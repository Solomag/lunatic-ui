import React from "react";
import {
  LunaPlugin,
  Messager,
  SettingsTransfer,
  type ExportData,
  type PluginPackage,
} from "@luna/core";
import {
  confirm,
  LunaButton,
  LunaSwitch,
  SpinningButton,
} from "@luna/ui";
import { downloadObject, redux, Tidal } from "@luna/lib";
import {
  needsElevation,
  pkg as lunaNativePkg,
  relaunch,
  runElevatedInstall,
  update,
} from "@luna/lib.native";
import { store as obyStore } from "oby";
import {
  currentSettingsComponent,
  displayPluginName,
  pluginAuthorName,
  uiPreferences,
} from "./plugin-state";
import { LunaticFeatureFlags } from "./FeatureFlags";
import { LiveOffGlyph, LiveOnGlyph, SettingsGlyph } from "./icons";
import { requestJson } from "../net";
import { lunaFeatures } from "../luna-features";
import { LunaticSearch, LunaticSelect } from "./controls";

type LunaRelease = {
  tag_name: string;
  prerelease?: boolean;
  assets?: Array<{ browser_download_url?: string }>;
};

const lunaClientVersion = (await lunaNativePkg()).version ?? "Unknown";

function corePlugins() {
  return Object.values(LunaPlugin.plugins).filter((plugin) => LunaPlugin.corePlugins.has(plugin.name));
}

const AdaptivePluginSettingsShell = React.memo(({ Settings }: { Settings: React.ComponentType }) => {
  const rootRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Luna with MuiTheme: compact layout through theme overrides. Older Luna: the DOM observer fallback.
    const install = lunaFeatures.themeOverrides
      ? import("./plugin-settings-theme").then((m) => m.holdPluginSettingsTheme())
      : import("./plugin-settings-layout").then((m) => m.installAdaptivePluginSettingsLayout(root));
    let cleanup: (() => void) | undefined;
    let unmounted = false;
    install.then((release) => {
      if (unmounted) release();
      else cleanup = release;
    });
    return () => {
      unmounted = true;
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      data-lunatic-adaptive-core-plugin-settings="true"
      data-lunatic-layout-owner="plugin-settings"
    >
      <Settings />
    </section>
  );
});

const LunaticCorePluginCard = React.memo(({
  plugin,
  active,
  onToggleSettings,
}: {
  plugin: LunaPlugin;
  active: boolean;
  onToggleSettings(plugin: LunaPlugin, currentlyOpen: boolean): void;
}) => {
  const [loading, setLoading] = React.useState(plugin.loading._);
  const [loadError, setLoadError] = React.useState(plugin.loadError._);
  const [liveReload, setLiveReload] = React.useState(plugin.liveReload);
  const [hideSettings, setHideSettings] = React.useState(plugin.store.hideSettings);
  const [pkg, setPkg] = React.useState<PluginPackage>(() => obyStore.unwrap(plugin.store.package));

  React.useEffect(() => {
    const unloads = [
      plugin.loading.onValue((next: boolean) => setLoading(next)),
      plugin.loadError.onValue((next: string | undefined) => setLoadError(next)),
      plugin.onSetLiveReload((next: boolean) => setLiveReload(next)),
      obyStore.on(() => plugin.store.package, () => setPkg(obyStore.unwrap(plugin.store.package))),
      obyStore.on(() => plugin.store.hideSettings, () => setHideSettings(obyStore.unwrap(plugin.store.hideSettings))),
    ];
    return () => unloads.forEach((unload) => unload?.());
  }, [plugin]);

  const Settings = currentSettingsComponent(plugin);
  const author = pluginAuthorName(pkg.author);
  const version = pkg.version ? `${pkg.version}${plugin.isDev ? " [DEV]" : ""}` : undefined;

  const settingsOpen = !!Settings && !hideSettings;

  return (
    <article
      data-lunatic-adaptive-core-plugin-card="true"
      data-lunatic-core-plugin-expanded={settingsOpen ? "true" : "false"}
      data-lunatic-plugin-full-name={plugin.name}
    >
      <header data-lunatic-adaptive-core-plugin-header="true">
        <div data-lunatic-adaptive-core-plugin-copy="true">
          <div data-lunatic-adaptive-core-plugin-title="true">{displayPluginName(plugin.name)}</div>
          {version && <div data-lunatic-plugin-version-line="true">{version}</div>}
          {author && <div data-lunatic-adaptive-core-plugin-author="true">by {author}</div>}
          {pkg.description && <div data-lunatic-adaptive-core-plugin-description="true">{pkg.description}</div>}
          {loadError && <div role="alert" data-lunatic-plugin-error="true">{loadError}</div>}
        </div>
        <div
          data-lunatic-adaptive-core-plugin-actions="true"
          data-lunatic-core-plugin-has-settings={Settings ? "true" : "false"}
        >
          <div data-lunatic-core-plugin-runtime-actions="true">
            <SpinningButton
              title="Reload plugin"
              aria-label="Reload plugin"
              spin={loading}
              disabled={loading}
              onClick={() => plugin.reload()}
              data-lunatic-plugin-reload="true"
            />
            <SpinningButton
              title={liveReload ? "Disable live reloading" : "Enable live reloading"}
              aria-label={liveReload ? "Disable live reloading" : "Enable live reloading"}
              icon={liveReload ? LiveOnGlyph : LiveOffGlyph}
              disabled={loading}
              onClick={() => (plugin.liveReload = !plugin.liveReload)}
              data-lunatic-plugin-live-reload="true"
              data-lunatic-live-state={liveReload ? "on" : "off"}
            />
          </div>
          {Settings && (
            <SpinningButton
              title={settingsOpen ? "Hide settings" : "Show settings"}
              aria-label={settingsOpen ? "Hide settings" : "Show settings"}
              icon={SettingsGlyph}
              disabled={loading}
              onClick={() => onToggleSettings(plugin, settingsOpen)}
              data-lunatic-plugin-settings="true"
              data-lunatic-core-settings-toggle-active={settingsOpen ? "true" : "false"}
            />
          )}
        </div>
      </header>
      {active && Settings && settingsOpen && (
        <AdaptivePluginSettingsShell Settings={Settings} />
      )}
    </article>
  );
});

const LunaticClientSettings = React.memo(() => {
  const [releases, setReleases] = React.useState<LunaRelease[]>([]);
  const [selectedRelease, setSelectedRelease] = React.useState(lunaClientVersion);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState<"updating" | "resetting" | null>(null);
  const [error, setError] = React.useState<string | undefined>();

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = await requestJson<LunaRelease[]>("https://api.github.com/repos/Inrixia/TidaLuna/releases");
      setReleases(next);
      if (next[0]?.tag_name) setSelectedRelease(next[0].tag_name);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const action = selectedRelease !== lunaClientVersion ? "Update Client" : "Reinstall Client";
  const description = selectedRelease !== lunaClientVersion
    ? `Update to ${selectedRelease}? TIDALuna will restart.`
    : `Reinstall ${selectedRelease}? TIDALuna will restart.`;

  const runUpdate = React.useCallback(async () => {
    const result = await confirm({ title: action, description, confirmationText: action, cancellationText: "Cancel" });
    if (!result.confirmed) return;
    const releaseUrl = releases.find((release) => release.tag_name === selectedRelease)?.assets?.[0]?.browser_download_url;
    if (!releaseUrl) return Messager.Error("Release URL not found");

    if (__platform === "linux" && (await needsElevation())) {
      const elevation = await confirm({
        title: "Administrator privileges required",
        description: "TidaLuna does not have write access to its installation directory.",
        confirmationText: "Continue",
        cancellationText: "Cancel",
      });
      if (!elevation.confirmed) return;
    }

    setBusy("updating");
    try {
      const result = await update(selectedRelease);
      if (result === "elevation_required") await runElevatedInstall();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await relaunch();
    } catch (err: any) {
      setBusy(null);
      Messager.Error("Update failed: ", err?.message ?? String(err));
    }
  }, [action, description, releases, selectedRelease]);

  const factoryReset = React.useCallback(async () => {
    const result = await confirm({
      title: "Factory Reset",
      description: "This deletes Luna plugins and configuration, then restarts the app.",
      confirmationText: "DELETE and Restart",
      cancellationText: "Cancel",
    });
    if (!result.confirmed) return;
    setBusy("resetting");
    for (const db of await indexedDB.databases()) {
      if (!db.name || db.name === "localforage") continue;
      indexedDB.deleteDatabase(db.name);
    }
    await relaunch();
  }, []);

  return (
    <section data-lunatic-settings-section="client" data-lunatic-layout-owner="lunatic-ui">
      <header data-lunatic-settings-section-header="true">
        <div>
          <strong>TIDALuna maintenance</strong>
          <div data-lunatic-settings-section-meta="true">Client version {lunaClientVersion}</div>
        </div>
        <SpinningButton
          title="Fetch releases"
          aria-label="Fetch releases"
          spin={loading}
          onClick={refresh}
          data-lunatic-maintenance-refresh="true"
        />
      </header>
      <div data-lunatic-settings-client-controls="true">
        <LunaticSelect<string>
          value={selectedRelease}
          onChange={setSelectedRelease}
          ariaLabel="TIDALuna release"
          options={releases.length === 0
            ? [{ value: selectedRelease, label: selectedRelease }]
            : releases.map((release) => ({ value: release.tag_name, label: `${release.tag_name}${release.prerelease ? "-dev" : ""}` }))}
        />
        <LunaButton disabled={!!busy || loading || releases.length === 0} onClick={runUpdate}>{action}</LunaButton>
        <LunaButton disabled={!!busy} onClick={factoryReset}>Factory Reset</LunaButton>
      </div>
      {error && <div role="alert" data-lunatic-settings-error="true">{error}</div>}
      {busy && <div data-lunatic-settings-busy="true">Operation in progress. Do not close TIDAL.</div>}
    </section>
  );
});


/* Settings transfer intentionally delegates persistence semantics to TidaLuna.
   Lunatic owns the presentation, not the list/layout of IndexedDB stores. */

const LunaticSettingsTransfer = React.memo(() => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [includeCode, setIncludeCode] = React.useState(false);

  const exportSettings = React.useCallback(async () => {
    setBusy(true);
    try {
      const featureFlags = redux.store.getState().featureFlags.userOverrides as Record<string, boolean>;
      const data = await SettingsTransfer.dump(!includeCode, Object.keys(featureFlags).length ? featureFlags : null);
      const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadObject(JSON.stringify(data), `tidaluna-settings-${date}.json`, "application/json");
    } catch (err: any) {
      Messager.Error("Failed to export settings: ", err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }, [includeCode]);

  const importSettings = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as ExportData;
      if (!SettingsTransfer.validate(data)) return Messager.Error("Invalid settings file format");
      const result = await confirm({
        title: "Import Settings",
        description: `Import settings exported on ${new Date(data.timestamp).toLocaleString()}? Existing settings will be replaced and the app will restart.`,
        confirmationText: "Import & Restart",
        cancellationText: "Cancel",
      });
      if (!result.confirmed) return;
      setBusy(true);
      await SettingsTransfer.restore(data);
      if (data.featureFlags != null) {
        const currentFlags = Tidal.featureFlags;
        for (const [name, value] of Object.entries(data.featureFlags)) {
          if (name in currentFlags && currentFlags[name].value !== value) {
            redux.actions["featureFlags/TOGGLE_USER_OVERRIDE"]({ ...currentFlags[name], value });
          }
        }
      }
      Messager.Info("Settings imported successfully, restarting...");
      await new Promise((resolve) => setTimeout(resolve, 700));
      await relaunch();
    } catch (err: any) {
      Messager.Error("Failed to import settings: ", err?.message ?? String(err));
      setBusy(false);
    }
  }, []);

  return (
    <section data-lunatic-settings-section="transfer" data-lunatic-layout-owner="lunatic-ui">
      <header data-lunatic-settings-section-header="true">
        <div>
          <strong>Settings Transfer</strong>
          <div data-lunatic-settings-section-meta="true">Back up or restore plugins, settings, themes, store URLs and feature flag overrides.</div>
        </div>
      </header>
      <div data-lunatic-settings-transfer-controls="true">
        <label data-lunatic-settings-inline-toggle="true">
          <span>Include plugin source code</span>
          <LunaSwitch checked={includeCode} disabled={busy} onChange={(_, checked) => setIncludeCode(checked)} />
        </label>
        <div data-lunatic-settings-transfer-actions="true">
          <LunaButton disabled={busy} onClick={exportSettings}>Export Settings</LunaButton>
          <LunaButton disabled={busy} onClick={() => inputRef.current?.click()}>Import Settings</LunaButton>
        </div>
        <input ref={inputRef} type="file" accept=".json" hidden onChange={importSettings} />
      </div>
    </section>
  );
});


const LunaticCorePlugins = React.memo(({ active, query }: { active: boolean; query: string }) => {
  const initial = React.useMemo(() => corePlugins(), []);
  const [plugins, setPlugins] = React.useState(initial);
  const [expandedUrl, setExpandedUrl] = React.useState<string | undefined>(() => {
    const initiallyOpen = initial.find(
      (plugin) => !!currentSettingsComponent(plugin) && !obyStore.unwrap(plugin.store.hideSettings),
    );
    return initiallyOpen?.url;
  });

  React.useEffect(() => {
    if (!active) return;
    const next = corePlugins();
    const signature = next.map((plugin) => `${plugin.name}\u0000${plugin.url}`).join("\u0001");
    const current = plugins.map((plugin) => `${plugin.name}\u0000${plugin.url}`).join("\u0001");
    if (signature !== current) setPlugins(next);
  }, [active, plugins]);

  // Keep the initial/persisted state deterministic: only one Core Plugin may
  // expose Settings at a time.
  React.useEffect(() => {
    if (!expandedUrl) return;
    for (const plugin of plugins) {
      if (plugin.url === expandedUrl) continue;
      if (currentSettingsComponent(plugin) && !obyStore.unwrap(plugin.store.hideSettings)) {
        plugin.store.hideSettings = true;
      }
    }
  }, [expandedUrl, plugins]);

  const toggleSettings = React.useCallback((plugin: LunaPlugin, currentlyOpen: boolean) => {
    if (currentlyOpen) {
      plugin.store.hideSettings = true;
      setExpandedUrl(undefined);
      return;
    }

    for (const other of plugins) {
      if (other.url === plugin.url) continue;
      if (currentSettingsComponent(other) && !obyStore.unwrap(other.store.hideSettings)) {
        other.store.hideSettings = true;
      }
    }
    plugin.store.hideSettings = false;
    setExpandedUrl(plugin.url);
  }, [plugins]);

  const orderedPlugins = React.useMemo(() => {
    const next = [...plugins];
    if (!expandedUrl) return next;

    const index = next.findIndex((plugin) => plugin.url === expandedUrl);
    // If the expanded card occupied the right column, move it before its left
    // neighbor. It can then span the full row and the displaced neighbor flows
    // naturally into the next available grid cell.
    if (index > 0 && index % 2 === 1) {
      const [expanded] = next.splice(index, 1);
      next.splice(index - 1, 0, expanded);
    }
    return next;
  }, [plugins, expandedUrl]);

  const visiblePlugins = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orderedPlugins;
    return orderedPlugins.filter((plugin) => {
      const pkg = obyStore.unwrap(plugin.store.package) as PluginPackage;
      const author = pluginAuthorName(pkg.author) ?? "";
      const haystack = `${plugin.name} ${displayPluginName(plugin.name)} ${author} ${typeof pkg.description === "string" ? pkg.description : ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [orderedPlugins, query]);

  return (
    <section data-lunatic-settings-section="core-plugins" data-lunatic-layout-owner="lunatic-ui">
      <header data-lunatic-settings-section-header="true">
        <div>
          <strong>Luna core plugins</strong>
          <div data-lunatic-settings-section-meta="true">Low-level TIDALuna components and their optional settings.</div>
        </div>
      </header>
      <div data-lunatic-adaptive-core-plugin-list="true">
        {visiblePlugins.map((plugin) => (
          <LunaticCorePluginCard
            key={plugin.url}
            plugin={plugin}
            active={active}
            onToggleSettings={toggleSettings}
          />
        ))}
        {visiblePlugins.length === 0 && <div data-lunatic-empty-state="true">No core plugins match the current search.</div>}
      </div>
    </section>
  );
});

export const LunaticSettings = React.memo(({ active }: { active: boolean }) => {
  const [separateFeatureFlags, setSeparateFeatureFlags] = React.useState(uiPreferences.featureFlagsSeparateTab);
  const [query, setQuery] = React.useState("");
  React.useEffect(() => obyStore.on(
    () => uiPreferences.featureFlagsSeparateTab,
    () => setSeparateFeatureFlags(obyStore.unwrap(uiPreferences.featureFlagsSeparateTab)),
  ), []);

  const q = query.trim().toLowerCase();
  const matches = (text: string) => !q || text.toLowerCase().includes(q);
  const showFeatureFlags = !separateFeatureFlags && matches("feature flags experiments overrides tidal");
  const showClient = matches("tidaluna maintenance client version update release factory reset");
  const showTransfer = matches("settings transfer backup restore export import plugin source code themes stores feature flags");
  const showCore = !q || matches("luna core plugins low-level components settings") || corePlugins().some((plugin) => {
    const pkg = obyStore.unwrap(plugin.store.package) as PluginPackage;
    const author = pluginAuthorName(pkg.author) ?? "";
    return `${plugin.name} ${displayPluginName(plugin.name)} ${author} ${typeof pkg.description === "string" ? pkg.description : ""}`.toLowerCase().includes(q);
  });

  return (
    <div data-lunatic-settings-page="true" data-lunatic-layout-owner="lunatic-ui">
      <label data-lunatic-page-search-field="true">
        <span>Search</span>
        <LunaticSearch value={query} onChange={setQuery} placeholder="Search settings…" ariaLabel="Search settings" />
      </label>
      {showFeatureFlags && <LunaticFeatureFlags />}
      {(showClient || showTransfer) && <div data-lunatic-settings-primary="true">
        {showClient && <LunaticClientSettings />}
        {showTransfer && <LunaticSettingsTransfer />}
      </div>}
      {showCore && <div data-lunatic-settings-secondary="true">
        <LunaticCorePlugins active={active} query={query} />
      </div>}
      {!showFeatureFlags && !showClient && !showTransfer && !showCore && <div data-lunatic-empty-state="true">No settings match the current search.</div>}
    </div>
  );
});
