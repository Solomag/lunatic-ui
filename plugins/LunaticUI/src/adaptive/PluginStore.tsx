import React from "react";
import { LunaPlugin, Messager, type PluginPackage } from "@luna/core";
import { confirm, LunaButton, LunaTrashButton, SpinningButton } from "@luna/ui";
import { store as obyStore } from "oby";
import {
  displayPluginName,
  markPluginInstalledNow,
  pluginAuthorName,
  pluginLink,
  pluginStoreUiState,
  uiPreferences,
} from "./plugin-state";
import {
  LOCAL_STORE,
  addStore,
  removeStore,
  currentStoreUrls,
  onStoreUrlsChange,
} from "./store-state";
import { isAllowedPreviewImage, LunaticPreviewImage, showDownloadsFor } from "./preview-image";
import { fetchWithTimeout } from "../net";
import { LunaticSearch, LunaticSelect } from "./controls";

interface StorePackage extends PluginPackage {
  plugins: string[];
}

type InstalledFilter = "not-installed" | "all" | "installed";
type StoreView = "plugins" | "stores";
type SortMode = "downloads" | "uploaded" | "name";

type ReleaseAsset = {
  name?: string;
  download_count?: number;
  created_at?: string;
};

type GitHubRelease = {
  assets?: ReleaseAsset[];
};

type ArtifactMetrics = {
  downloads?: number;
  uploadedAt?: number;
};

type CatalogPlugin = {
  key: string;
  url: string;
  sourceUrl: string;
  sourceName: string;
  plugin?: LunaPlugin;
  error?: string;
  metrics?: ArtifactMetrics;
  /** Store opted in to showing download counts for all its plugins */
  storeShowDownloads?: unknown;
};

type CatalogStore = {
  url: string;
  removable: boolean;
  pkg?: StorePackage;
  error?: string;
  loading?: boolean;
  plugins: CatalogPlugin[];
};

type StoreHttpState = {
  etag?: string;
  modified?: string;
  pkg?: StorePackage;
};

type StoreSnapshot = StoreHttpState & {
  savedAt: number;
  pluginPackages: Record<string, PluginPackage>;
};

const GITHUB_RELEASE_CACHE_MS = 24 * 60 * 60 * 1000;
const LOCAL_STORE_SNAPSHOT_KEY = "lunatic-ui:local-store-snapshot:v1";
const STORE_SNAPSHOT_PREFIX = "lunatic-ui:plugin-store-snapshot:v2:";
const GITHUB_METADATA_CONCURRENCY = 4;
const githubReleaseCache = new Map<string, { expiresAt: number; promise: Promise<Map<string, ArtifactMetrics>> }>();
let githubMetadataActive = 0;
let githubApiBlockedUntil = 0;
const githubMetadataQueue: Array<() => void> = [];

function storeSnapshotKey(url: string) {
  return `${STORE_SNAPSHOT_PREFIX}${url}`;
}

function serializablePluginPackage(pkg: PluginPackage | undefined) {
  if (!pkg) return;
  const copy = { ...pkg };
  delete copy.code;
  return copy;
}

function readStoreSnapshot(url: string): StoreSnapshot | undefined {
  try {
    const parsed = JSON.parse(localStorage.getItem(storeSnapshotKey(url)) ?? "null") as StoreSnapshot | null;
    if (!parsed?.pkg || !parsed.pluginPackages || typeof parsed.pluginPackages !== "object") return;
    return parsed;
  } catch {
    return;
  }
}

function writeStoreSnapshot(url: string, state: StoreHttpState, plugins: CatalogPlugin[]) {
  if (!state.pkg) return;
  const pluginPackages: Record<string, PluginPackage> = {};
  for (const record of plugins) {
    const pkg = serializablePluginPackage(record.plugin?.package);
    if (pkg) pluginPackages[record.url] = pkg;
  }
  try {
    localStorage.setItem(storeSnapshotKey(url), JSON.stringify({
      etag: state.etag,
      modified: state.modified,
      pkg: state.pkg,
      savedAt: Date.now(),
      pluginPackages,
    } satisfies StoreSnapshot));
  } catch {
    // Catalog snapshots are an optimization; storage denial must not break Store.
  }
}

function pluginPath(storeUrl: string, name: string) {
  return storeUrl === LOCAL_STORE ? name : name.replace(" ", ".");
}

function packageAssetName(name: string) {
  return `${name.replace(/@/g, "").replace(/\//g, ".")}.mjs`.toLowerCase();
}

function normalizedAssetIdentity(name: string) {
  return name.toLowerCase().replace(/\.mjs$/, "").replace(/[^a-z0-9]+/g, "");
}

function resolveArtifactMetrics(metrics: Map<string, ArtifactMetrics>, ...candidateNames: string[]) {
  for (const name of candidateNames) {
    const exact = metrics.get(name.toLowerCase());
    if (exact) return exact;
  }

  const identities = new Set(candidateNames.map(normalizedAssetIdentity).filter(Boolean));
  if (identities.size === 0) return;
  for (const [assetName, value] of metrics) {
    if (identities.has(normalizedAssetIdentity(assetName))) return value;
  }
}

type GitHubReleaseRef = {
  owner: string;
  repo: string;
  tag: string;
  apiUrl: string;
  expandedAssetsUrl: string;
};

function githubReleaseRef(storeUrl: string): GitHubReleaseRef | undefined {
  try {
    const parsed = new URL(storeUrl);
    if (parsed.hostname.toLowerCase() !== "github.com") return;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const releaseIndex = parts.findIndex((part, index) => part === "releases" && parts[index + 1] === "download");
    if (releaseIndex < 2 || parts.length <= releaseIndex + 2) return;
    const owner = parts[releaseIndex - 2];
    const repo = parts[releaseIndex - 1];
    const tag = parts[releaseIndex + 2];
    if (!owner || !repo || !tag) return;
    const ownerPart = encodeURIComponent(owner);
    const repoPart = encodeURIComponent(repo);
    const tagPart = encodeURIComponent(tag);
    return {
      owner,
      repo,
      tag,
      apiUrl: `https://api.github.com/repos/${ownerPart}/${repoPart}/releases/tags/${tagPart}`,
      expandedAssetsUrl: `https://github.com/${ownerPart}/${repoPart}/releases/expanded_assets/${tagPart}`,
    };
  } catch {
    return;
  }
}

function scheduleGitHubMetadata<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      githubMetadataActive += 1;
      void task().then(resolve, reject).finally(() => {
        githubMetadataActive -= 1;
        githubMetadataQueue.shift()?.();
      });
    };
    if (githubMetadataActive < GITHUB_METADATA_CONCURRENCY) run();
    else githubMetadataQueue.push(run);
  });
}

function metricsFromRelease(release: GitHubRelease) {
  const metrics = new Map<string, ArtifactMetrics>();
  for (const asset of release.assets ?? []) {
    if (!asset.name?.toLowerCase().endsWith(".mjs")) continue;
    const uploadedAt = asset.created_at ? Date.parse(asset.created_at) : NaN;
    metrics.set(asset.name.toLowerCase(), {
      downloads: typeof asset.download_count === "number" ? asset.download_count : undefined,
      uploadedAt: Number.isFinite(uploadedAt) ? uploadedAt : undefined,
    });
  }
  return metrics;
}

function metricsFromExpandedAssetsHtml(html: string) {
  const metrics = new Map<string, ArtifactMetrics>();
  const document = new DOMParser().parseFromString(html, "text/html");
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/releases/download/"]'));
  for (const link of links) {
    let name: string | undefined;
    try {
      name = decodeURIComponent(new URL(link.href, "https://github.com").pathname.split("/").pop() ?? "");
    } catch {
      name = link.getAttribute("href")?.split("/").pop();
    }
    if (!name?.toLowerCase().endsWith(".mjs")) continue;
    const row = link.closest("li") ?? link.closest("div");
    const time = row?.querySelector<HTMLElement>("relative-time[datetime], time[datetime]");
    const rawDate = time?.getAttribute("datetime");
    const uploadedAt = rawDate ? Date.parse(rawDate) : NaN;
    metrics.set(name.toLowerCase(), {
      uploadedAt: Number.isFinite(uploadedAt) ? uploadedAt : undefined,
    });
  }
  return metrics;
}

async function fetchGitHubMetrics(ref: GitHubReleaseRef) {
  if (Date.now() >= githubApiBlockedUntil) {
    try {
      const response = await fetchWithTimeout(ref.apiUrl);
      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          const resetSeconds = Number(response.headers.get("x-ratelimit-reset"));
          githubApiBlockedUntil = Number.isFinite(resetSeconds)
            ? Math.max(Date.now() + 60_000, resetSeconds * 1000)
            : Date.now() + 10 * 60_000;
        }
        throw new Error(`GitHub API ${response.status}`);
      }
      const release = await response.json() as GitHubRelease;
      const metrics = metricsFromRelease(release);
      if (metrics.size > 0) return metrics;
    } catch (error) {
      console.warn(`[Lunatic UI] GitHub release API unavailable for ${ref.owner}/${ref.repo}@${ref.tag}; falling back to release asset dates.`, error);
    }
  }

  try {
    const response = await fetchWithTimeout(ref.expandedAssetsUrl);
    if (!response.ok) throw new Error(`GitHub expanded assets ${response.status}`);
    const metrics = metricsFromExpandedAssetsHtml(await response.text());
    if (metrics.size > 0) return metrics;
  } catch (error) {
    console.warn(`[Lunatic UI] GitHub release metadata fallback unavailable for ${ref.owner}/${ref.repo}@${ref.tag}.`, error);
  }

  return new Map<string, ArtifactMetrics>();
}

async function githubArtifactMetrics(storeUrl: string) {
  const ref = githubReleaseRef(storeUrl);
  if (!ref) return new Map<string, ArtifactMetrics>();

  const cached = githubReleaseCache.get(ref.apiUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const storageKey = `lunatic-ui:github-release-metrics:v2:${ref.apiUrl}`;
  let staleMetrics: Map<string, ArtifactMetrics> | undefined;
  try {
    const persisted = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { expiresAt?: number; entries?: [string, ArtifactMetrics][] } | null;
    if (Array.isArray(persisted?.entries) && persisted.entries.length > 0) {
      const normalizedEntries = persisted.entries.map(([name, value]) => [name.toLowerCase(), value] as [string, ArtifactMetrics]);
      staleMetrics = new Map<string, ArtifactMetrics>(normalizedEntries);
      if (persisted?.expiresAt && persisted.expiresAt > Date.now()) {
        const promise = Promise.resolve(staleMetrics);
        githubReleaseCache.set(ref.apiUrl, { expiresAt: persisted.expiresAt, promise });
        return promise;
      }
    }
  } catch {
    // Cache corruption/storage denial is non-fatal; fetch fresh metadata instead.
  }

  const promise = scheduleGitHubMetadata(() => fetchGitHubMetrics(ref))
    .then((metrics) => {
      if (metrics.size > 0) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            expiresAt: Date.now() + GITHUB_RELEASE_CACHE_MS,
            entries: [...metrics.entries()],
          }));
        } catch {
          // Persistent metadata cache is optional.
        }
        return metrics;
      }
      if (staleMetrics?.size) return staleMetrics;
      githubReleaseCache.delete(ref.apiUrl);
      return metrics;
    })
    .finally(() => {
      const cached = githubReleaseCache.get(ref.apiUrl);
      if (cached?.promise === promise && Date.now() >= cached.expiresAt) githubReleaseCache.delete(ref.apiUrl);
    });

  githubReleaseCache.set(ref.apiUrl, { expiresAt: Date.now() + GITHUB_RELEASE_CACHE_MS, promise });
  return promise;
}

function formatDownloads(value?: number) {
  if (value === undefined) return;
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
}

function formatUploaded(value?: number) {
  if (value === undefined) return;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(value);
}



function descriptionText(value: PluginPackage["description"]) {
  return typeof value === "string" ? value : "";
}

function installedFor(record: CatalogPlugin) {
  return record.plugin?.installed === true;
}

function compareOptionalNumberDescending(a?: number, b?: number) {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return b - a;
}

function compareCatalogPlugins(a: CatalogPlugin, b: CatalogPlugin, mode: SortMode) {
  const aName = displayPluginName(a.plugin?.name ?? a.key);
  const bName = displayPluginName(b.plugin?.name ?? b.key);

  let result = 0;
  if (mode === "downloads") result = compareOptionalNumberDescending(a.metrics?.downloads, b.metrics?.downloads);
  else if (mode === "uploaded") result = compareOptionalNumberDescending(a.metrics?.uploadedAt, b.metrics?.uploadedAt);

  if (result !== 0) return result;
  return aName.localeCompare(bName, undefined, { sensitivity: "base" });
}

const CatalogPluginCard = React.memo(({ record, onAuthor, onInstalledChange }: {
  record: CatalogPlugin;
  onAuthor: (author: string) => void;
  onInstalledChange?: () => void;
}) => {
  const [installed, setInstalled] = React.useState(() => installedFor(record));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(record.error);

  React.useEffect(() => {
    setInstalled(installedFor(record));
    setError(record.error);
    if (!record.plugin) return;
    return obyStore.on(
      () => record.plugin!.installed,
      () => setInstalled(obyStore.unwrap(record.plugin!.store.installed)),
    );
  }, [record]);

  const plugin = record.plugin;
  const pkg = plugin?.package;
  const fullName = plugin?.name ?? record.key;
  const author = pluginAuthorName(pkg?.author);
  const link = pluginLink(pkg);
  // Download counts are shown only when the plugin or its store opted in (Inrixia/TidaLuna#197 by
  // FlazeIGuess): nobody gets a number put next to their work without choosing to. Sorting by
  // downloads still works, it just does not print the number.
  const showDownloads = showDownloadsFor((pkg as { showDownloads?: unknown } | undefined)?.showDownloads, record.storeShowDownloads);
  const downloads = showDownloads ? formatDownloads(record.metrics?.downloads) : undefined;
  const previewImage = (pkg as { image?: string } | undefined)?.image;
  const uploaded = formatUploaded(record.metrics?.uploadedAt);

  const act = React.useCallback(async () => {
    if (!plugin || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      if (plugin.installed) {
        if (uiPreferences.askWhenUninstall) {
          const result = await confirm({
            title: `Uninstall ${displayPluginName(plugin.name)}?`,
            description: "This removes the plugin and its installed entry from TIDALuna.",
            confirmationText: "Uninstall",
            cancellationText: "Cancel",
          });
          if (!result.confirmed) return;
        }
        await plugin.uninstall();
        const fresh = await LunaPlugin.fromStorage({ url: record.url });
        record.plugin = fresh;
        setInstalled(fresh.installed);
        onInstalledChange?.();
      } else {
        await plugin.install();
        markPluginInstalledNow(plugin);
        setInstalled(plugin.installed);
        onInstalledChange?.();
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }, [plugin, busy, onInstalledChange, record]);

  return (
    <article
      data-lunatic-store-catalog-card="true"
      data-lunatic-plugin-full-name={fullName}
      title={`Source: ${record.sourceName}`}
    >
      {previewImage && isAllowedPreviewImage(previewImage) && (
        <LunaticPreviewImage src={previewImage} alt={`${displayPluginName(fullName)} preview`} />
      )}
      <div data-lunatic-store-catalog-main="true">
        <div data-lunatic-store-catalog-heading="true">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" title={fullName}>{displayPluginName(fullName)}</a>
          ) : (
            <span title={fullName}>{displayPluginName(fullName)}</span>
          )}
          {pkg?.version && <span data-lunatic-store-catalog-version="true">{pkg.version}{record.sourceUrl === LOCAL_STORE ? " [DEV]" : ""}</span>}
        </div>

        <div data-lunatic-store-catalog-meta="true">
          {author && (
            <button type="button" onClick={() => onAuthor(author)} data-lunatic-store-author-filter="true">
              {author}
            </button>
          )}
          {downloads && <span>{downloads} downloads</span>}
          {uploaded && <span>Uploaded {uploaded}</span>}
          {!author && !downloads && !uploaded && <span>{record.sourceName}</span>}
        </div>

        {pkg?.description && <div data-lunatic-store-catalog-description="true">{pkg.description}</div>}
        {error && <div role="alert" data-lunatic-plugin-error="true">{error}</div>}
      </div>

      {plugin && (
        <LunaButton
          size="small"
          disabled={busy}
          onClick={act}
          data-lunatic-plugin-action="true"
          data-lunatic-store-installed={installed ? "true" : "false"}
          children={busy ? "Working…" : installed ? "Uninstall" : "Install"}
        />
      )}
    </article>
  );
});

export const LunaticPluginStore = React.memo(({ active }: { active: boolean }) => {
  const [storeList, setStoreList] = React.useState<string[]>(() => currentStoreUrls());
  const [catalog, setCatalog] = React.useState<CatalogStore[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const rememberStoreState = uiPreferences.rememberPluginStoreState;
  const [sortMode, setSortMode] = React.useState<SortMode>(() => rememberStoreState ? pluginStoreUiState.sortMode ?? "downloads" : "downloads");
  const [installedFilter, setInstalledFilter] = React.useState<InstalledFilter>(() => rememberStoreState ? pluginStoreUiState.installedFilter ?? "not-installed" : "not-installed");
  const [view, setView] = React.useState<StoreView>(() => rememberStoreState ? pluginStoreUiState.view ?? "plugins" : "plugins");
  const [authorFilter, setAuthorFilter] = React.useState<string | undefined>(() => rememberStoreState ? pluginStoreUiState.authorFilter : undefined);
  const [localCollapsed, setLocalCollapsed] = React.useState(() => rememberStoreState ? pluginStoreUiState.localCollapsed === true : false);
  const [pinLocalPlugins, setPinLocalPlugins] = React.useState(uiPreferences.pinLocalStorePlugins);
  const [installedRevision, setInstalledRevision] = React.useState(0);
  const [urlValue, setUrlValue] = React.useState("");
  const [urlError, setUrlError] = React.useState<string>();
  const [urlBusy, setUrlBusy] = React.useState(false);
  const [catalogReloading, setCatalogReloading] = React.useState(false);
  const httpStateRef = React.useRef(new Map<string, StoreHttpState>());
  const generationRef = React.useRef(0);
  const lastRefreshRef = React.useRef(0);
  const mountedRef = React.useRef(true);

  React.useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  React.useEffect(() => {
    if (!uiPreferences.rememberPluginStoreState) return;
    pluginStoreUiState.sortMode = sortMode;
    pluginStoreUiState.installedFilter = installedFilter;
    pluginStoreUiState.view = view;
    if (authorFilter) pluginStoreUiState.authorFilter = authorFilter;
    else delete pluginStoreUiState.authorFilter;
    pluginStoreUiState.localCollapsed = localCollapsed;
  }, [authorFilter, installedFilter, localCollapsed, sortMode, view]);

  React.useEffect(() => obyStore.on(
    () => uiPreferences.pinLocalStorePlugins,
    () => setPinLocalPlugins(obyStore.unwrap(uiPreferences.pinLocalStorePlugins)),
  ), []);

  React.useEffect(
    () => onStoreUrlsChange(() => setStoreList(currentStoreUrls())),
    [],
  );

  const buildCatalogStore = React.useCallback(async (
    url: string,
    removable: boolean,
    pkg: StorePackage,
    storeError: string | undefined,
    cachedPackages: Record<string, PluginPackage> | undefined,
    refreshPluginPackages: boolean,
  ): Promise<CatalogStore> => {
    const sourceName = `${displayPluginName(pkg.name ?? "Unknown Store")}${url === LOCAL_STORE ? " [DEV]" : ""}`;
    const metrics = await githubArtifactMetrics(url);

    const plugins = await Promise.all((pkg.plugins ?? []).map(async (name): Promise<CatalogPlugin> => {
      const path = pluginPath(url, name);
      const pluginUrl = `${url}/${path}`;
      const assetName = `${path.split("/").pop()}.mjs`.toLowerCase();
      try {
        const cachedPackage = refreshPluginPackages ? undefined : cachedPackages?.[pluginUrl];
        const plugin = await LunaPlugin.fromStorage(cachedPackage ? { url: pluginUrl, package: cachedPackage } : { url: pluginUrl });
        const pluginAssetName = packageAssetName(plugin.name);
        return {
          key: `${url}/${path}`,
          url: pluginUrl,
          sourceUrl: url,
          sourceName,
          plugin,
          metrics: resolveArtifactMetrics(metrics, pluginAssetName, assetName),
          storeShowDownloads: (pkg as { showDownloads?: unknown }).showDownloads,
        };
      } catch (err: any) {
        return {
          key: `${url}/${path}`,
          url: pluginUrl,
          sourceUrl: url,
          sourceName,
          error: err?.message ?? String(err),
          metrics: resolveArtifactMetrics(metrics, assetName),
        };
      }
    }));

    return { url, removable, pkg, error: storeError, plugins };
  }, []);

  const loadSnapshotStore = React.useCallback(async (url: string, removable: boolean): Promise<CatalogStore | undefined> => {
    const snapshot = readStoreSnapshot(url);
    if (!snapshot?.pkg) return;
    httpStateRef.current.set(url, { etag: snapshot.etag, modified: snapshot.modified, pkg: snapshot.pkg });
    return buildCatalogStore(url, removable, snapshot.pkg, undefined, snapshot.pluginPackages, false);
  }, [buildCatalogStore]);

  const loadOneStore = React.useCallback(async (url: string, removable: boolean, conditional = false, forcePluginRefresh = false): Promise<CatalogStore> => {
    const snapshot = readStoreSnapshot(url);
    const previous = httpStateRef.current.get(url) ?? (snapshot ? {
      etag: snapshot.etag,
      modified: snapshot.modified,
      pkg: snapshot.pkg,
    } : undefined);
    if (previous && !httpStateRef.current.has(url)) httpStateRef.current.set(url, previous);

    let pkg = previous?.pkg;
    let storeError: string | undefined;
    let storeChanged = false;
    let responseState: StoreHttpState = previous ?? {};

    try {
      const headers: Record<string, string> = {};
      // Local dev servers commonly allow simple cross-origin GETs but do not
      // whitelist conditional request headers. Sending If-Modified-Since/ETag
      // forces a CORS preflight and breaks localhost Store refreshes. Local
      // snapshots are already cheap to compare, so keep localhost requests
      // simple and reserve validators for remote stores.
      const useConditionalHeaders = conditional && url !== LOCAL_STORE;
      if (useConditionalHeaders && previous?.etag) headers["If-None-Match"] = previous.etag;
      if (useConditionalHeaders && previous?.modified) headers["If-Modified-Since"] = previous.modified;

      const response = await fetchWithTimeout(`${url}/store.json`, Object.keys(headers).length > 0 ? { headers } : undefined);
      if (response.status !== 304) {
        if (!response.ok) throw new Error(`Failed to fetch store: ${response.status} ${response.statusText}`);
        const nextPkg = await response.json() as StorePackage;
        storeChanged = !previous?.pkg || JSON.stringify(previous.pkg) !== JSON.stringify(nextPkg);
        pkg = nextPkg;
        responseState = {
          etag: response.headers.get("etag") ?? undefined,
          modified: response.headers.get("last-modified") ?? undefined,
          pkg,
        };
        httpStateRef.current.set(url, responseState);
      }
    } catch (err: any) {
      if (url === LOCAL_STORE) {
        if (!pkg) {
          try {
            pkg = JSON.parse(localStorage.getItem(LOCAL_STORE_SNAPSHOT_KEY) ?? "null") as StorePackage | undefined;
          } catch {
            // A stale/corrupt local snapshot should never break the catalog.
          }
        }
      } else if (!pkg) {
        storeError = err?.message ?? String(err);
      } else {
        console.warn(`[Lunatic UI] Store refresh failed for ${url}; keeping the cached catalog.`, err);
      }
    }

    if (!pkg) return { url, removable, error: storeError, plugins: [] };
    if (url === LOCAL_STORE) {
      try {
        localStorage.setItem(LOCAL_STORE_SNAPSHOT_KEY, JSON.stringify(pkg));
      } catch {
        // Local Store continuity cache is optional.
      }
    }

    const built = await buildCatalogStore(
      url,
      removable,
      pkg,
      storeError,
      snapshot?.pluginPackages,
      forcePluginRefresh || storeChanged || !snapshot,
    );
    writeStoreSnapshot(url, { ...responseState, pkg }, built.plugins);
    return built;
  }, [buildCatalogStore]);

  const loadCatalog = React.useCallback(async (conditional = false) => {
    const generation = ++generationRef.current;
    setLoading(true);
    const urls = [LOCAL_STORE, ...storeList];
    const next = await Promise.all(urls.map((url, index) => loadOneStore(url, index !== 0, conditional)));
    if (!mountedRef.current || generation !== generationRef.current) return;
    setCatalog(next.filter((store) => store.url !== LOCAL_STORE || store.pkg || store.plugins.length));
    setLoading(false);
    lastRefreshRef.current = Date.now();
  }, [loadOneStore, storeList]);

  React.useEffect(() => {
    let cancelled = false;
    const hydrateThenRefresh = async () => {
      const urls = [LOCAL_STORE, ...storeList];
      const cached = (await Promise.all(urls.map((url, index) => loadSnapshotStore(url, index !== 0))))
        .filter((store): store is CatalogStore => !!store);
      if (!cancelled && cached.length > 0) {
        setCatalog(cached);
        setLoading(false);
      }
      if (!cancelled) void loadCatalog(true);
    };
    void hydrateThenRefresh();
    return () => { cancelled = true; };
  }, [loadCatalog, loadSnapshotStore, storeList]);

  React.useEffect(() => {
    if (!active || loading || Date.now() - lastRefreshRef.current < 30_000) return;
    void loadCatalog(true);
  }, [active, loadCatalog, loading]);

  const reloadStore = React.useCallback(async (url: string) => {
    setCatalog((current) => current.map((store) => store.url === url ? { ...store, loading: true } : store));
    const next = await loadOneStore(url, url !== LOCAL_STORE, false, true);
    if (!mountedRef.current) return;
    setCatalog((current) => current.map((store) => store.url === url ? next : store));
  }, [loadOneStore]);

  const reloadCatalog = React.useCallback(async () => {
    if (catalogReloading) return;
    setCatalogReloading(true);
    try {
      const urls = [LOCAL_STORE, ...storeList];
      const next = await Promise.all(urls.map((url, index) => loadOneStore(url, index !== 0, false, true)));
      if (!mountedRef.current) return;
      setCatalog(next.filter((store) => store.url !== LOCAL_STORE || store.pkg || store.plugins.length));
      lastRefreshRef.current = Date.now();
    } finally {
      if (mountedRef.current) setCatalogReloading(false);
    }
  }, [catalogReloading, loadOneStore, storeList]);

  const loadFromUrl = React.useCallback(async () => {
    const value = urlValue.trim();
    if (!value || urlBusy) return;
    setUrlBusy(true);
    setUrlError(undefined);
    try {
      const parsed = new URL(value).href;
      if (parsed.endsWith("/store.json")) {
        if (!addStore(parsed)) throw new Error("Store already added");
        Messager.Info(`Added store ${parsed}`);
      } else {
        const plugin = await LunaPlugin.fromStorage({ url: parsed });
        Messager.Info(`Loaded plugin ${plugin.name}`);
      }
      setUrlValue("");
    } catch (err: any) {
      setUrlError(err?.message ?? "Invalid URL or failed to load plugin");
    } finally {
      setUrlBusy(false);
    }
  }, [urlValue, urlBusy]);

  const query = search.trim().toLowerCase();
  const effectiveInstalledFilter: InstalledFilter = query ? "all" : installedFilter;
  const allPlugins = React.useMemo(() => catalog.flatMap((store) => store.plugins), [catalog]);
  const localPlugins = React.useMemo(() => allPlugins.filter((record) => record.sourceUrl === LOCAL_STORE), [allPlugins]);
  const remotePlugins = React.useMemo(() => allPlugins.filter((record) => record.sourceUrl !== LOCAL_STORE), [allPlugins]);

  React.useEffect(() => {
    const unloads = allPlugins.flatMap((record) => {
      if (!record.plugin) return [];
      return [obyStore.on(
        () => record.plugin!.installed,
        () => setInstalledRevision((value) => value + 1),
      )];
    });
    return () => unloads.forEach((unload) => unload());
  }, [allPlugins]);

  const matchesCommonFilters = React.useCallback((record: CatalogPlugin) => {
    const plugin = record.plugin;
    const pkg = plugin?.package;
    const author = pluginAuthorName(pkg?.author);
    if (authorFilter && author !== authorFilter) return false;
    if (!query) return true;
    const haystack = [
      plugin?.name ?? record.key,
      displayPluginName(plugin?.name ?? record.key),
      author ?? "",
      descriptionText(pkg?.description),
      record.sourceName,
    ].join("\n").toLowerCase();
    return haystack.includes(query);
  }, [authorFilter, query]);

  const visibleLocalPlugins = React.useMemo(() => pinLocalPlugins ? localPlugins
    .filter(matchesCommonFilters)
    .sort((a, b) => compareCatalogPlugins(a, b, "name")) : [],
  [installedRevision, localPlugins, matchesCommonFilters, pinLocalPlugins]);

  const catalogPlugins = React.useMemo(() => pinLocalPlugins ? remotePlugins : allPlugins, [allPlugins, pinLocalPlugins, remotePlugins]);
  const visiblePlugins = React.useMemo(() => {
    return catalogPlugins
      .filter((record) => {
        if (!matchesCommonFilters(record)) return false;
        if (effectiveInstalledFilter === "installed" && !installedFor(record)) return false;
        if (effectiveInstalledFilter === "not-installed" && installedFor(record)) return false;
        return true;
      })
      .sort((a, b) => compareCatalogPlugins(a, b, sortMode));
  }, [catalogPlugins, effectiveInstalledFilter, installedRevision, matchesCommonFilters, sortMode]);

  const storeErrors = catalog.filter((store) => store.error);
  const githubPlugins = remotePlugins.filter((record) => githubReleaseRef(record.sourceUrl));
  const downloadMetadataCount = githubPlugins.filter((record) => record.metrics?.downloads !== undefined).length;
  const uploadMetadataCount = githubPlugins.filter((record) => record.metrics?.uploadedAt !== undefined).length;
  const visibleGithubPlugins = visiblePlugins.filter((record) => githubReleaseRef(record.sourceUrl));
  const visibleReleaseMetadataCount = visibleGithubPlugins.filter((record) => record.metrics?.downloads !== undefined || record.metrics?.uploadedAt !== undefined).length;
  const missingVisibleMetadata = visibleGithubPlugins
    .filter((record) => record.metrics?.downloads === undefined && record.metrics?.uploadedAt === undefined)
    .map((record) => displayPluginName(record.plugin?.name ?? record.key));

  React.useEffect(() => {
    if (loading || remotePlugins.length === 0 || sortMode !== "downloads" || downloadMetadataCount > 0) return;
    setSortMode(uploadMetadataCount > 0 ? "uploaded" : "name");
  }, [downloadMetadataCount, loading, remotePlugins.length, sortMode, uploadMetadataCount]);

  return (
    <div data-lunatic-plugin-store-page="true" data-lunatic-layout-owner="lunatic-ui">
      <div data-lunatic-store-toolbar="true">
        <label data-lunatic-store-control="search">
          <span>Search</span>
          <LunaticSearch value={search} onChange={setSearch} placeholder="Search plugins…" ariaLabel="Search plugins" />
        </label>
        <label data-lunatic-store-control="sort">
          <span>Sort</span>
          <LunaticSelect<SortMode>
            value={sortMode}
            onChange={setSortMode}
            ariaLabel="Sort plugins"
            options={[
              { value: "downloads", label: "Most downloaded" },
              { value: "uploaded", label: "Recently uploaded" },
              { value: "name", label: "Name" },
            ]}
          />
        </label>
        <label data-lunatic-store-control="installed">
          <span>Installed</span>
          <LunaticSelect<InstalledFilter>
            value={effectiveInstalledFilter}
            disabled={!!query}
            onChange={setInstalledFilter}
            ariaLabel="Installed plugin filter"
            title={query ? "Search always includes installed and not-installed plugins" : undefined}
            options={[
              { value: "not-installed", label: "Not installed" },
              { value: "all", label: "All" },
              { value: "installed", label: "Installed" },
            ]}
          />
        </label>
        <label data-lunatic-store-control="view">
          <span>View</span>
          <LunaticSelect<StoreView>
            value={view}
            onChange={setView}
            ariaLabel="Plugin Store view"
            options={[
              { value: "plugins", label: "Plugins" },
              { value: "stores", label: "Stores" },
            ]}
          />
        </label>
      </div>

      <div data-lunatic-store-secondary-row="true">
        <label data-lunatic-store-install-field="true">
          <span>Install from URL</span>
          <div data-lunatic-store-install-row="true" data-lunatic-install-action-visible={(urlBusy || !!urlValue.trim()) ? "true" : "false"}>
            <input
              value={urlValue}
              onChange={(event) => setUrlValue(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void loadFromUrl();
              }}
              aria-invalid={!!urlError}
              aria-label="Install from URL"
              placeholder="Plugin or store URL"
            />
            {(urlBusy || urlValue.trim()) && (
              <LunaButton size="small" disabled={urlBusy} onClick={loadFromUrl} children={urlBusy ? "Loading…" : "Load"} />
            )}
          </div>
          {urlError && <span role="alert" data-lunatic-url-error="true">{urlError}</span>}
        </label>

        <div data-lunatic-store-secondary-actions="true">
          <div data-lunatic-store-filter-chips="true">
            {authorFilter && (
              <button type="button" onClick={() => setAuthorFilter(undefined)} data-lunatic-store-filter-chip="true">
                Developer: {authorFilter} <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
          <LunaButton
            size="small"
            disabled={catalogReloading}
            onClick={() => void reloadCatalog()}
            title="Force-refresh every store and plugin package, bypassing the local catalog snapshot"
            children={catalogReloading ? "Reloading…" : "Reload catalog"}
          />
        </div>
      </div>

      {loading && catalog.length === 0 ? (
        <div data-lunatic-store-loading="true">Loading plugin catalog…</div>
      ) : view === "plugins" ? (
        <>
          {visibleLocalPlugins.length > 0 && (
            <section data-lunatic-store-local-section="true" data-lunatic-store-local-collapsed={localCollapsed ? "true" : "false"}>
              <button
                type="button"
                data-lunatic-store-local-heading="true"
                aria-expanded={!localCollapsed}
                onClick={() => setLocalCollapsed((value) => !value)}
              >
                <strong>Local plugins</strong>
                <span>{visibleLocalPlugins.length} pinned</span>
                <span data-lunatic-store-local-chevron="true" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M15 18 9 12l6-6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              {!localCollapsed && (
                <div data-lunatic-store-flat-grid="true">
                  {visibleLocalPlugins.map((record) => (
                    <CatalogPluginCard key={record.key} record={record} onAuthor={setAuthorFilter} onInstalledChange={() => setInstalledRevision((value) => value + 1)} />
                  ))}
                </div>
              )}
            </section>
          )}
          <div
            data-lunatic-store-result-count="true"
            title={missingVisibleMetadata.length > 0 ? `Missing release metadata: ${missingVisibleMetadata.join(", ")}` : undefined}
          >
            {visiblePlugins.length} plugin{visiblePlugins.length === 1 ? "" : "s"}
            {visibleGithubPlugins.length > 0 && ` · ${visibleReleaseMetadataCount}/${visibleGithubPlugins.length} visible GitHub plugins with release metadata`}
          </div>
          <div data-lunatic-store-flat-grid="true">
            {visiblePlugins.map((record) => (
              <CatalogPluginCard key={record.key} record={record} onAuthor={setAuthorFilter} onInstalledChange={() => setInstalledRevision((value) => value + 1)} />
            ))}
          </div>
          {visiblePlugins.length === 0 && visibleLocalPlugins.length === 0 && <div data-lunatic-store-empty="true">No plugins match the current filters.</div>}
          {storeErrors.length > 0 && (
            <div data-lunatic-store-error-summary="true">
              {storeErrors.length} store{storeErrors.length === 1 ? "" : "s"} could not be loaded.
            </div>
          )}
        </>
      ) : (
        <div data-lunatic-store-groups="true">
          {catalog.map((store) => {
            const pkg = store.pkg;
            const storeName = `${displayPluginName(pkg?.name ?? "Unknown Store")}${store.url === LOCAL_STORE ? " [DEV]" : ""}`;
            const link = pluginLink(pkg) ?? store.url;
            const author = pluginAuthorName(pkg?.author);
            const groupedPlugins = store.plugins
              .filter((record) => {
                const recordAuthor = pluginAuthorName(record.plugin?.package?.author);
                if (authorFilter && recordAuthor !== authorFilter) return false;
                if ((store.url !== LOCAL_STORE || !pinLocalPlugins) && effectiveInstalledFilter === "installed" && !installedFor(record)) return false;
                if ((store.url !== LOCAL_STORE || !pinLocalPlugins) && effectiveInstalledFilter === "not-installed" && installedFor(record)) return false;
                if (!query) return true;
                const plugin = record.plugin;
                return [plugin?.name ?? record.key, recordAuthor ?? "", descriptionText(plugin?.package?.description)]
                  .join("\n").toLowerCase().includes(query);
              })
              .sort((a, b) => compareCatalogPlugins(a, b, sortMode));

            if (groupedPlugins.length === 0 && !store.error) return null;

            return (
              <section key={store.url} data-lunatic-store-group="true">
                <header data-lunatic-store-group-header="true">
                  <div data-lunatic-store-group-identity="true">
                    <a href={link} target="_blank" rel="noopener noreferrer">{storeName}</a>
                    {author && <span>by {author}</span>}
                    {!store.error && <span>{groupedPlugins.length} plugin{groupedPlugins.length === 1 ? "" : "s"}</span>}
                  </div>
                  <div data-lunatic-store-group-actions="true">
                    <SpinningButton
                      title="Reload store"
                      aria-label="Reload store"
                      spin={!!store.loading}
                      disabled={!!store.loading}
                      onClick={() => void reloadStore(store.url)}
                    />
                    {store.removable && (
                      <LunaTrashButton
                        title="Remove store"
                        aria-label="Remove store"
                        disabled={!!store.loading}
                        onClick={() => removeStore(store.url)}
                      />
                    )}
                  </div>
                </header>
                {store.error && <div role="alert" data-lunatic-store-error="true">{store.error}</div>}
                {pkg?.description && <div data-lunatic-store-group-description="true">{pkg.description}</div>}
                <div data-lunatic-store-group-grid="true">
                  {groupedPlugins.map((record) => (
                    <CatalogPluginCard key={record.key} record={record} onAuthor={setAuthorFilter} onInstalledChange={() => setInstalledRevision((value) => value + 1)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
});
