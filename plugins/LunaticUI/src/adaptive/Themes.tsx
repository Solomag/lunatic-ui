import React from "react";
import { Messager, ReactiveStore } from "@luna/core";
import { LunaButton, LunaSwitch, LunaTrashButton, SpinningButton } from "@luna/ui";
import { store as obyStore } from "oby";
import { requestText } from "../net";
import { LunaticSearch } from "./controls";

type LunaticThemeStorage = {
  enabled: boolean;
  css?: string;
};

type ThemeManifest = {
  name?: string;
  description?: string;
  author?: string;
};

const lunaStorage = ReactiveStore.getStore("@luna/storage");
const themes = await lunaStorage.getReactive<Record<string, LunaticThemeStorage>>("themes", {});


function parseThemeManifest(css?: string): ThemeManifest | undefined {
  if (!css) return;
  const source = css.slice(0, 12_000);
  for (const match of source.matchAll(/\/\*([\s\S]*?)\*\//g)) {
    const body = match[1]?.trim();
    if (!body || !body.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(body);
      if (!parsed || typeof parsed !== "object") continue;
      const manifest = parsed as ThemeManifest;
      if (manifest.name || manifest.description || manifest.author) return manifest;
    } catch {
      // Not a JSON manifest comment.
    }
  }
  return;
}

function themeFallbackName(url: string) {
  try {
    const parsed = new URL(url);
    const raw = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).at(-1) || parsed.hostname);
    return raw.replace(/\.css$/i, "") || "Untitled theme";
  } catch {
    const raw = url.split(/[\\/]/).filter(Boolean).at(-1) || url;
    return raw.replace(/\.css$/i, "") || "Untitled theme";
  }
}

function themeSourceLabel(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${decodeURIComponent(parsed.pathname)}`;
  } catch {
    return url;
  }
}

function setThemeStyle(url: string, css?: string) {
  let style = document.getElementById(url) as HTMLStyleElement | null;
  const next = css?.trim();
  if (!next) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = url;
  }
  if (style.textContent !== next) style.textContent = next;
  if (!style.isConnected) document.head.appendChild(style);
}

function themesSignature() {
  return Object.keys(obyStore.unwrap(themes)).sort().join("\u0001");
}

const LunaticThemeCard = React.memo(({ url, theme, onStructureChange }: { url: string; theme: LunaticThemeStorage; onStructureChange(): void }) => {
  const [enabled, setEnabled] = React.useState(theme.enabled);
  const [css, setCss] = React.useState(theme.css);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [manifest, setManifest] = React.useState<ThemeManifest | undefined>(() => parseThemeManifest(theme.css));

  React.useEffect(() => {
    const unloads = [
      obyStore.on(
        () => themes[url]?.enabled,
        () => {
          const next = !!themes[url]?.enabled;
          setEnabled(next);
        },
      ),
      obyStore.on(
        () => themes[url]?.css,
        () => {
          const next = themes[url]?.css;
          setCss(next);
          setManifest(parseThemeManifest(next));
        },
      ),
    ];
    return () => unloads.forEach((unload) => unload?.());
  }, [url]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = await requestText(url);
      if (!themes[url]) return;
      themes[url].css = next;
      setCss(next);
      setManifest(parseThemeManifest(next));
      if (themes[url].enabled) setThemeStyle(url, next);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [url]);

  React.useEffect(() => {
    if (!enabled) return;
    if (css) setThemeStyle(url, css);
    else void reload();
  }, []);

  const toggle = React.useCallback(async (_: unknown, checked: boolean) => {
    const current = themes[url];
    if (!current) return;
    current.enabled = checked;
    setEnabled(checked);
    if (!checked) {
      setThemeStyle(url, undefined);
      return;
    }
    if (current.css) setThemeStyle(url, current.css);
    else await reload();
  }, [url, reload]);

  const uninstall = React.useCallback(() => {
    setThemeStyle(url, undefined);
    delete themes[url];
    onStructureChange();
  }, [url, onStructureChange]);

  const name = manifest?.name?.trim() || themeFallbackName(url);
  const author = manifest?.author?.trim();
  const description = manifest?.description?.trim();
  const sourceLabel = themeSourceLabel(url);

  return (
    <article
      data-lunatic-theme-card="true"
      data-lunatic-native-theme-card="true"
      data-lunatic-theme-url={url}
      data-lunatic-theme-enabled={enabled ? "true" : "false"}
    >
      <header data-lunatic-theme-header="true" data-lunatic-native-theme-header="true">
        <div data-lunatic-native-theme-copy="true">
          <div data-lunatic-theme-title-row="true">
            <div data-lunatic-theme-title="true" title={name}>{name}</div>
          </div>
          {author && <div data-lunatic-theme-author="true">by {author}</div>}
          {description && (
            <div data-lunatic-theme-description="true">{description}</div>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={url}
            data-lunatic-theme-source="true"
          >
            {sourceLabel}
          </a>
          {error && <div role="alert" data-lunatic-theme-error="true">{error}</div>}
        </div>
        <div data-lunatic-native-theme-actions="true">
          <LunaSwitch
            checked={enabled}
            loading={loading}
            onChange={toggle}
            tooltip={enabled ? `Disable ${name}` : `Enable ${name}`}
            data-lunatic-adaptive-theme-switch="true"
          />
          <SpinningButton
            title="Reload theme"
            aria-label="Reload theme"
            spin={loading}
            disabled={loading}
            onClick={reload}
            data-lunatic-adaptive-theme-reload="true"
          />
          <LunaTrashButton
            title="Remove theme"
            aria-label="Remove theme"
            disabled={loading}
            onClick={uninstall}
            data-lunatic-adaptive-theme-delete="true"
          />
        </div>
      </header>
    </article>
  );
});

export const LunaticThemes = React.memo(({ active }: { active: boolean }) => {
  const initial = React.useMemo(() => Object.entries(obyStore.unwrap(themes)), []);
  const [entries, setEntries] = React.useState<[string, LunaticThemeStorage][]>(initial);
  const signatureRef = React.useRef(themesSignature());
  const [urlValue, setUrlValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [query, setQuery] = React.useState("");

  const refreshIfChanged = React.useCallback(() => {
    const signature = themesSignature();
    if (signature === signatureRef.current) return false;
    signatureRef.current = signature;
    setEntries(Object.entries(obyStore.unwrap(themes)));
    return true;
  }, []);

  React.useEffect(
    () => obyStore.on(themes, refreshIfChanged),
    [refreshIfChanged],
  );

  React.useEffect(() => {
    if (active) refreshIfChanged();
  }, [active, refreshIfChanged]);


  const visibleEntries = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(([url, theme]) => {
      const manifest = parseThemeManifest(theme.css);
      const haystack = [
        manifest?.name || themeFallbackName(url),
        manifest?.author || "",
        manifest?.description || "",
        themeSourceLabel(url),
      ].join("\n").toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query]);

  const loadFromUrl = React.useCallback(async () => {
    const raw = urlValue.trim();
    if (!raw || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const url = new URL(raw).href;
      if (!url.toLowerCase().endsWith(".css")) throw new Error("Theme URL must point to a .css file");
      if (themes[url]) throw new Error("Theme already added");
      const theme: LunaticThemeStorage = (themes[url] = { enabled: true });
      try {
        const next = await requestText(url);
        theme.css = next;
        setThemeStyle(url, next);
      } catch (err) {
        delete themes[url];
        throw err;
      }
      refreshIfChanged();
      Messager.Info(`Added theme ${url}`);
      setUrlValue("");
    } catch (err: any) {
      setError(err?.message ?? "Invalid URL or failed to load");
    } finally {
      setBusy(false);
    }
  }, [urlValue, busy, refreshIfChanged]);

  return (
    <div data-lunatic-themes-page="true" data-lunatic-layout-owner="lunatic-ui">
      <div data-lunatic-themes-meta="true">
        {visibleEntries.length === entries.length ? entries.length : `${visibleEntries.length} of ${entries.length}`} installed theme{entries.length === 1 ? "" : "s"}.
      </div>
      <label data-lunatic-page-search-field="true">
        <span>Search</span>
        <LunaticSearch value={query} onChange={setQuery} placeholder="Search themes…" ariaLabel="Search themes" />
      </label>
      <label data-lunatic-native-theme-field="true">
        <span>Install from URL</span>
        <div data-lunatic-native-theme-url-row="true" data-lunatic-install-action-visible={(busy || !!urlValue.trim()) ? "true" : "false"}>
          <input
            value={urlValue}
            onChange={(event) => setUrlValue(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadFromUrl();
            }}
            aria-invalid={!!error}
            aria-label="Install theme from URL"
            placeholder="Paste theme URL…"
            data-lunatic-search="true"
          />
          {(busy || urlValue.trim()) && (
            <LunaButton size="small" disabled={busy} onClick={loadFromUrl}>
              {busy ? "Loading…" : "Load"}
            </LunaButton>
          )}
        </div>
        {error && <span role="alert" data-lunatic-theme-install-error="true">{error}</span>}
      </label>
      <div data-lunatic-theme-list="true">
        {visibleEntries.map(([url, theme]) => (
          <LunaticThemeCard key={url} url={url} theme={theme} onStructureChange={refreshIfChanged} />
        ))}
        {visibleEntries.length === 0 && <div data-lunatic-empty-state="true">No themes match the current search.</div>}
      </div>
    </div>
  );
});
