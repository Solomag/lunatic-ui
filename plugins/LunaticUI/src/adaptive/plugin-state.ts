import React from "react";
import { LunaPlugin, ReactiveStore, type PluginPackage } from "@luna/core";

export type PluginUiMetadata = {
  observedInstalledAt?: number;
  hasSettings?: boolean;
  settingsCapabilityHash?: string;
};

export type LunaticUiPreferences = {
  showEnabledFirst: boolean;
  askWhenUninstall: boolean;
  featureFlagsSeparateTab: boolean;
  hideSupportersPage: boolean;
  pluginSettingCategoryDescriptionsOnHover: boolean;
  rememberPluginStoreState: boolean;
  pinLocalStorePlugins: boolean;
  oneClickUninstall?: boolean;
};

const lunaticUiStorage = ReactiveStore.getStore("@solomag/lunatic-ui");

export const pluginUiMetadata = await lunaticUiStorage.getReactive<Record<string, PluginUiMetadata>>(
  "pluginUiMetadata",
  {},
);

export const uiPreferences = await lunaticUiStorage.getReactive<LunaticUiPreferences>("preferences", {
  showEnabledFirst: true,
  askWhenUninstall: true,
  featureFlagsSeparateTab: true,
  hideSupportersPage: true,
  pluginSettingCategoryDescriptionsOnHover: true,
  rememberPluginStoreState: true,
  pinLocalStorePlugins: true,
});
export type PluginStoreUiState = {
  sortMode?: "downloads" | "uploaded" | "name";
  installedFilter?: "not-installed" | "all" | "installed";
  view?: "plugins" | "stores";
  authorFilter?: string;
  localCollapsed?: boolean;
};

export const pluginStoreUiState = await lunaticUiStorage.getReactive<PluginStoreUiState>(
  "pluginStoreUiState",
  {
    sortMode: "downloads",
    installedFilter: "not-installed",
    view: "plugins",
  },
);


if (typeof uiPreferences.showEnabledFirst !== "boolean") uiPreferences.showEnabledFirst = true;
if (typeof uiPreferences.askWhenUninstall !== "boolean") {
  uiPreferences.askWhenUninstall = typeof uiPreferences.oneClickUninstall === "boolean"
    ? !uiPreferences.oneClickUninstall
    : true;
}
if (typeof uiPreferences.featureFlagsSeparateTab !== "boolean") uiPreferences.featureFlagsSeparateTab = true;
if (typeof uiPreferences.hideSupportersPage !== "boolean") uiPreferences.hideSupportersPage = true;
if (typeof uiPreferences.pluginSettingCategoryDescriptionsOnHover !== "boolean") {
  uiPreferences.pluginSettingCategoryDescriptionsOnHover = true;
}
if (typeof uiPreferences.rememberPluginStoreState !== "boolean") uiPreferences.rememberPluginStoreState = true;
if (typeof uiPreferences.pinLocalStorePlugins !== "boolean") uiPreferences.pinLocalStorePlugins = true;
if (Object.prototype.hasOwnProperty.call(uiPreferences, "oneClickUninstall")) {
  delete uiPreferences.oneClickUninstall;
}

function codeExportsSettings(code?: string) {
  if (!code) return false;
  return /\bas\s+Settings\b/.test(code) || /export\s*\{[^}]*\bSettings\b[^}]*\}/s.test(code);
}

export function currentSettingsComponent(plugin: LunaPlugin) {
  return plugin.exports?.Settings as React.ComponentType | undefined;
}

function settingsCapabilityForPackage(plugin: LunaPlugin) {
  const pkg = plugin.package;
  const hash = typeof pkg?.hash === "string" && pkg.hash ? pkg.hash : undefined;
  const Settings = currentSettingsComponent(plugin);
  if (Settings) return { hasSettings: true, hash };
  return { hasSettings: codeExportsSettings(pkg?.code), hash };
}

function refreshSettingsCapability(plugin: LunaPlugin, metadata: PluginUiMetadata) {
  const { hasSettings, hash } = settingsCapabilityForPackage(plugin);

  if (hash) {
    if (metadata.settingsCapabilityHash !== hash || metadata.hasSettings !== hasSettings) {
      metadata.settingsCapabilityHash = hash;
      metadata.hasSettings = hasSettings;
    }
    return;
  }

  metadata.settingsCapabilityHash = undefined;
  metadata.hasSettings = hasSettings;
}

export function ensurePluginMetadata(plugin: LunaPlugin, ordinal = 0) {
  const existing = pluginUiMetadata[plugin.url] ?? {};
  if (existing.observedInstalledAt === undefined) {
    existing.observedInstalledAt = Date.now() + ordinal;
  }
  refreshSettingsCapability(plugin, existing);
  pluginUiMetadata[plugin.url] = existing;
  return existing;
}

export function markPluginInstalledNow(plugin: LunaPlugin) {
  const metadata: PluginUiMetadata = {
    ...(pluginUiMetadata[plugin.url] ?? {}),
    observedInstalledAt: Date.now(),
  };
  refreshSettingsCapability(plugin, metadata);
  pluginUiMetadata[plugin.url] = metadata;
}

export function displayPluginName(name: string) {
  return name.replace(/^@[^/]+\//, "");
}

export function pluginAuthorName(author: PluginPackage["author"]) {
  return typeof author === "string" ? author : author?.name;
}

export function pluginLink(pkg?: PluginPackage) {
  return pkg?.homepage ?? pkg?.repository?.url;
}

export function installedPlugins() {
  const plugins = Object.values(LunaPlugin.plugins)
    .filter((plugin) => plugin.installed && !LunaPlugin.corePlugins.has(plugin.name));
  plugins.forEach((plugin, index) => ensurePluginMetadata(plugin, index));
  return plugins;
}

export function pluginHasSettings(plugin: LunaPlugin) {
  return ensurePluginMetadata(plugin).hasSettings === true;
}
