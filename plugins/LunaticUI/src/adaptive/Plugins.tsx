import React from "react";
import { LunaPlugin, type PluginPackage } from "@luna/core";
import { confirm, LunaSwitch, LunaTrashButton, SpinningButton } from "@luna/ui";
import { store as obyStore } from "oby";
import {
  currentSettingsComponent,
  displayPluginName,
  ensurePluginMetadata,
  installedPlugins,
  pluginAuthorName,
  pluginHasSettings,
  pluginLink,
  pluginUiMetadata,
  uiPreferences,
} from "./plugin-state";
import { LiveOffGlyph, LiveOnGlyph, SettingsGlyph } from "./icons";
import { LunaticSearch, LunaticSelect } from "./controls";

type PluginSortMode = "name-asc" | "name-desc" | "installed-new" | "installed-old";
type PluginSettingsFilter = "all" | "with" | "without";
type PluginEnabledFilter = "all" | "enabled" | "disabled";

/** loadFailed exists on Luna builds with Solomag/TidaLuna feat/plugin-error-attribution */
type PluginWithLoadFailed = LunaPlugin & { loadFailed?: { _: boolean; onValue(cb: () => void): () => void } };
/** Only a failure to load counts; runtime errors (loadError without loadFailed) keep the plugin in its group */
const pluginFailedToLoad = (plugin: LunaPlugin) => {
  const failed = (plugin as PluginWithLoadFailed).loadFailed;
  if (failed) return failed._;
  return plugin.enabled && !!plugin.loadError._ && plugin.exports === undefined;
};


function installedPluginsSignature(plugins = installedPlugins()) {
  return plugins.map((plugin) => `${plugin.name}\u0000${plugin.url}`).join("\u0001");
}

const LunaticPluginCard = React.memo(({
  plugin,
  active,
  onStructureChange,
}: {
  plugin: LunaPlugin;
  active: boolean;
  onStructureChange(): void;
}) => {
  const [enabled, setEnabled] = React.useState(plugin.enabled);
  const [loading, setLoading] = React.useState(plugin.loading._);
  const [loadError, setLoadError] = React.useState(plugin.loadError._);
  const [installed, setInstalled] = React.useState(plugin.installed);
  const [liveReload, setLiveReload] = React.useState(plugin.liveReload);
  const [hideSettings, setHideSettings] = React.useState(plugin.store.hideSettings);
  const [pkg, setPkg] = React.useState<PluginPackage>(() => obyStore.unwrap(plugin.store.package));
  const [, forceCapabilities] = React.useReducer((value: number) => value + 1, 0);

  React.useEffect(() => {
    const unloads = [
      plugin.onSetEnabled((next: boolean) => setEnabled(next)),
      plugin.loading.onValue((next: boolean) => setLoading(next)),
      plugin.loadError.onValue((next: string | undefined) => setLoadError(next)),
      plugin.onSetLiveReload((next: boolean) => setLiveReload(next)),
      obyStore.on(
        () => plugin.store.package,
        () => setPkg(obyStore.unwrap(plugin.store.package)),
      ),
      obyStore.on(
        () => plugin.installed,
        () => {
          const next = obyStore.unwrap(plugin.store.installed);
          setInstalled(next);
          if (!next) onStructureChange();
        },
      ),
      obyStore.on(
        () => plugin.store.hideSettings,
        () => setHideSettings(obyStore.unwrap(plugin.store.hideSettings)),
      ),
    ];
    return () => {
      for (const unload of unloads) unload?.();
    };
  }, [plugin, onStructureChange]);

  const toggleEnabled = React.useCallback(async (_: unknown, checked: boolean) => {
    if (checked) await plugin.enable();
    else await plugin.disable();
    // Re-evaluate capability after load/unload. We deliberately do not retain
    // an executable Settings component after disable: invoking it can execute
    // plugin code even though the plugin is meant to be off.
    ensurePluginMetadata(plugin);
    forceCapabilities();
  }, [plugin]);

  const reload = React.useCallback(async () => {
    await plugin.reload();
    ensurePluginMetadata(plugin);
    forceCapabilities();
    onStructureChange();
  }, [plugin, onStructureChange]);

  const toggleLiveReload = React.useCallback(() => {
    plugin.liveReload = !plugin.liveReload;
  }, [plugin]);

  const uninstall = React.useCallback(async () => {
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
    onStructureChange();
  }, [plugin, onStructureChange]);

  if (!installed) return null;

  const Settings = enabled ? currentSettingsComponent(plugin) : undefined;
  const hasSettings = pluginHasSettings(plugin);
  const canRenderSettings = enabled && !!Settings;
  const author = pluginAuthorName(pkg.author);
  const link = pluginLink(pkg);
  const version = pkg.version ? `${pkg.version}${plugin.isDev ? " [DEV]" : ""}` : undefined;
  const settingsOpen = active && enabled && !!Settings && !hideSettings;

  return (
    <article
      data-lunatic-installed-plugin="true"
      data-lunatic-native-installed-plugin="true"
      data-lunatic-plugin-full-name={plugin.name}
      data-lunatic-plugin-expanded={settingsOpen ? "true" : "false"}
    >
      <header data-lunatic-native-installed-plugin-header="true">
        <div data-lunatic-native-installed-plugin-copy="true">
          <div data-lunatic-installed-plugin-title="true">
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" title={plugin.name}>{displayPluginName(plugin.name)}</a>
            ) : (
              <span title={plugin.name}>{displayPluginName(plugin.name)}</span>
            )}
          </div>
          {(version || author) && (
            <div data-lunatic-installed-plugin-meta="true">
              {version && <span data-lunatic-plugin-version="true">{version}</span>}
              {version && author && <span data-lunatic-plugin-meta-separator="true">·</span>}
              {author && <span data-lunatic-installed-plugin-author="true">by {author}</span>}
            </div>
          )}
          {pkg.description && <div data-lunatic-plugin-description="true">{pkg.description}</div>}
          {loadError && <div role="alert" data-lunatic-plugin-error="true">{loadError}</div>}
        </div>
        <div data-lunatic-native-installed-plugin-actions="true" data-lunatic-plugin-action-deck="true">
          <div data-lunatic-action-slot="enable">
            <LunaSwitch
              checked={enabled}
              loading={loading}
              onChange={toggleEnabled}
              tooltip={enabled ? `Disable ${plugin.name}` : `Enable ${plugin.name}`}
            />
          </div>
          <div data-lunatic-action-slot="delete">
            <LunaTrashButton
              title="Uninstall plugin"
              aria-label="Uninstall plugin"
              disabled={loading}
              onClick={uninstall}
              data-lunatic-plugin-delete="true"
            />
          </div>
          <div data-lunatic-action-slot="reload">
            <SpinningButton
              title="Reload plugin"
              aria-label="Reload plugin"
              spin={loading}
              disabled={!enabled || loading}
              onClick={reload}
              data-lunatic-plugin-reload="true"
            />
          </div>
          <div data-lunatic-action-slot="live">
            <SpinningButton
              title={liveReload ? "Disable live reloading" : "Enable live reloading"}
              aria-label={liveReload ? "Disable live reloading" : "Enable live reloading"}
              icon={liveReload ? LiveOnGlyph : LiveOffGlyph}
              disabled={!enabled || loading}
              onClick={toggleLiveReload}
              data-lunatic-plugin-live-reload="true"
              data-lunatic-live-state={liveReload ? "on" : "off"}
            />
          </div>
          <div data-lunatic-action-slot="settings">
            {hasSettings && (
              <SpinningButton
                title={!enabled ? "Enable plugin to edit settings" : hideSettings ? "Show settings" : "Hide settings"}
                aria-label={!enabled ? "Enable plugin to edit settings" : hideSettings ? "Show settings" : "Hide settings"}
                icon={SettingsGlyph}
                disabled={!canRenderSettings || loading}
                onClick={() => (plugin.store.hideSettings = !plugin.store.hideSettings)}
                data-lunatic-plugin-settings="true"
                data-lunatic-settings-state={canRenderSettings ? "active" : "disabled"}
                />
            )}
          </div>
        </div>
      </header>
      {settingsOpen && Settings && (
        <section data-lunatic-installed-plugin-settings-shell="true" data-lunatic-layout-owner="plugin-settings">
          <Settings />
        </section>
      )}
    </article>
  );
});

export const LunaticPlugins = React.memo(({ active }: { active: boolean }) => {
  const initial = React.useMemo(() => installedPlugins(), []);
  const [plugins, setPlugins] = React.useState<LunaPlugin[]>(initial);
  const [query, setQuery] = React.useState("");
  const [sortMode, setSortMode] = React.useState<PluginSortMode>("name-asc");
  const [settingsFilter, setSettingsFilter] = React.useState<PluginSettingsFilter>("all");
  const [enabledFilter, setEnabledFilter] = React.useState<PluginEnabledFilter>("all");
  const [showEnabledFirst, setShowEnabledFirst] = React.useState(uiPreferences.showEnabledFirst);
  const [pluginStateRevision, bumpPluginStateRevision] = React.useReducer((value: number) => value + 1, 0);
  const signatureRef = React.useRef(installedPluginsSignature(initial));

  const refreshIfChanged = React.useCallback(() => {
    const next = installedPlugins();
    const signature = installedPluginsSignature(next);
    if (signature === signatureRef.current) return false;
    signatureRef.current = signature;
    setPlugins(next);
    return true;
  }, []);

  React.useEffect(() => {
    if (active) refreshIfChanged();
  }, [active, refreshIfChanged]);

  React.useEffect(() => obyStore.on(
    () => uiPreferences.showEnabledFirst,
    () => setShowEnabledFirst(obyStore.unwrap(uiPreferences.showEnabledFirst)),
  ), []);

  React.useEffect(() => {
    const unloads = plugins.flatMap((plugin) => [
      plugin.onSetEnabled(() => bumpPluginStateRevision()),
      plugin.loadError.onValue(() => bumpPluginStateRevision()),
      (plugin as PluginWithLoadFailed).loadFailed?.onValue(() => bumpPluginStateRevision()),
      obyStore.on(
        () => plugin.store.package,
        () => {
          ensurePluginMetadata(plugin);
          bumpPluginStateRevision();
        },
      ),
    ]);
    return () => {
      for (const unload of unloads) unload?.();
    };
  }, [plugins]);

  const visiblePlugins = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = plugins.filter((plugin) => {
      const pkg = obyStore.unwrap(plugin.store.package);
      const author = pluginAuthorName(pkg.author) ?? "";
      const haystack = `${plugin.name} ${displayPluginName(plugin.name)} ${author} ${pkg.description ?? ""}`.toLowerCase();
      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
      const hasSettings = pluginHasSettings(plugin);
      if (settingsFilter === "with" && !hasSettings) return false;
      if (settingsFilter === "without" && hasSettings) return false;
      if (enabledFilter === "enabled" && !plugin.enabled) return false;
      if (enabledFilter === "disabled" && plugin.enabled) return false;
      return true;
    });

    next.sort((a, b) => {
      if (showEnabledFirst && a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      if (sortMode === "name-asc") return displayPluginName(a.name).localeCompare(displayPluginName(b.name)) || a.url.localeCompare(b.url);
      if (sortMode === "name-desc") return displayPluginName(b.name).localeCompare(displayPluginName(a.name)) || b.url.localeCompare(a.url);
      const aTime = pluginUiMetadata[a.url]?.observedInstalledAt ?? 0;
      const bTime = pluginUiMetadata[b.url]?.observedInstalledAt ?? 0;
      return sortMode === "installed-new" ? bTime - aTime : aTime - bTime;
    });
    return next;
  }, [plugins, query, sortMode, settingsFilter, enabledFilter, showEnabledFirst, pluginStateRevision]);

  // Grouping by state, after Inrixia/TidaLuna#197 by FlazeIGuess: plugins that failed to load come
  // first, then enabled, then disabled, and move between groups as soon as their state changes.
  const groups = React.useMemo(() => {
    const failed: LunaPlugin[] = [];
    const enabled: LunaPlugin[] = [];
    const disabled: LunaPlugin[] = [];
    for (const plugin of visiblePlugins) {
      if (pluginFailedToLoad(plugin)) failed.push(plugin);
      else if (plugin.enabled) enabled.push(plugin);
      else disabled.push(plugin);
    }
    return [
      { id: "failed", title: "Failed to load", plugins: failed },
      { id: "enabled", title: "Enabled", plugins: enabled },
      { id: "disabled", title: "Disabled", plugins: disabled },
    ].filter((group) => group.plugins.length > 0);
  }, [visiblePlugins, pluginStateRevision]);

  return (
    <div data-lunatic-plugins-page="true" data-lunatic-layout-owner="lunatic-ui">
      <div data-lunatic-plugin-organizer="true">
        <label data-lunatic-native-field="true">
          <span>Search installed plugins</span>
          <LunaticSearch
            value={query}
            onChange={setQuery}
            placeholder="Search by name, author or description"
            ariaLabel="Search installed plugins"
          />
        </label>
        <label data-lunatic-native-field="true">
          <span data-lunatic-field-label-with-help="true">
            <span>Sort</span>
            <span
              data-lunatic-sort-info="true"
              role="img"
              title="TidaLuna does not store historical plugin installation times. Plugins that were already installed when Lunatic began tracking them are sorted by first-seen time; installs made afterwards use the actual install event time."
              aria-label="About installation time sorting"
            >*</span>
          </span>
          <LunaticSelect<PluginSortMode>
            value={sortMode}
            onChange={setSortMode}
            ariaLabel="Sort installed plugins"
            options={[
              { value: "name-asc", label: "Name A–Z" },
              { value: "name-desc", label: "Name Z–A" },
              { value: "installed-new", label: "Installation time — newest" },
              { value: "installed-old", label: "Installation time — oldest" },
            ]}
          />
        </label>
        <label data-lunatic-native-field="true">
          <span>Settings</span>
          <LunaticSelect<PluginSettingsFilter>
            value={settingsFilter}
            onChange={setSettingsFilter}
            ariaLabel="Filter plugins by settings support"
            options={[
              { value: "all", label: "All plugins" },
              { value: "with", label: "With settings" },
              { value: "without", label: "Without settings" },
            ]}
          />
        </label>
        <label data-lunatic-native-field="true">
          <span>State</span>
          <LunaticSelect<PluginEnabledFilter>
            value={enabledFilter}
            onChange={setEnabledFilter}
            ariaLabel="Filter plugins by enabled state"
            options={[
              { value: "all", label: "Enabled + disabled" },
              { value: "enabled", label: "Enabled only" },
              { value: "disabled", label: "Disabled only" },
            ]}
          />
        </label>
      </div>

      <div data-lunatic-plugin-organizer-summary="true">{visiblePlugins.length} of {plugins.length} plugins</div>

      {visiblePlugins.length === 0 ? (
        <div data-lunatic-plugin-list="true">
          <div data-lunatic-empty-state="true">No installed plugins match the current filters.</div>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.id} data-lunatic-plugin-group={group.id}>
            <h3 data-lunatic-plugin-group-title="true">
              {group.title} <span>{group.plugins.length}</span>
            </h3>
            <div data-lunatic-plugin-list="true">
              {group.plugins.map((plugin) => (
                <LunaticPluginCard key={plugin.url} plugin={plugin} active={active} onStructureChange={refreshIfChanged} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
});
