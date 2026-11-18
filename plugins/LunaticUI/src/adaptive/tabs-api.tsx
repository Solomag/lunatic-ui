/**
 * Lunatic views mounted through the @luna/ui SettingsTabs API.
 *
 * Loaded by takeover.tsx only when the running Luna exposes `SettingsTabs` (TidaLuna 1.21.0+).
 * Unlike the React-tree takeover in takeover.tsx this does not depend on the internal structure
 * of the Luna Settings page, so it needs no structural health check or legacy DOM fallback.
 */
import React from "react";
import * as lunaUi from "@luna/ui";
import type { LunaUnload } from "@luna/core";
import { store as obyStore } from "oby";
import { uiPreferences } from "./plugin-state";
import { LunaticFeatureFlags } from "./FeatureFlags";
import { LunaticSupporters } from "./Supporters";
import { LunaticThemes } from "./Themes";
import { LunaticPluginStore } from "./PluginStore";
import { LunaticPlugins } from "./Plugins";
import { LunaticSettings } from "./Settings";
import { SettingsGlyph } from "./icons";
import { hasTidalIcon, TidalSpriteIcon, tidalIcons, type TidalIcon } from "./tidal-icons";
import type { AdaptiveTakeover } from "./takeover";

type TabProps = { active: boolean };
type Unloads = Set<LunaUnload>;
interface SettingsTabsApi {
  register(unloads: Unloads, tab: { id: string; label: string; icon?: React.ReactElement; order: number; content: React.ComponentType<TabProps>; keepAlive?: boolean }): void;
  override(unloads: Unloads, id: string, override: { content?: React.ComponentType<TabProps>; icon?: React.ReactElement; keepAlive?: boolean; hidden?: boolean }): void;
  readonly current: string;
  open(id: string): void;
  onChange(cb: (id: string) => unknown): () => void;
}

export const FEATURE_FLAGS_TAB = "Feature Flags";

const settingsTabsApi = (lunaUi as any).SettingsTabs as SettingsTabsApi;
const settingsPage = (lunaUi as any).settingsPage as { pageStyles?: CSSStyleDeclaration } | undefined;

/** Luna's own tab container already adds spacing, the Lunatic wrapper owns it instead. */
const settingsTabsApiCss = String.raw`
[data-luna-settings-root] { margin-bottom: 0 !important; }
[data-luna-settings-root] > [data-luna-settings-tab-page] { margin: 0 !important; padding: 0 !important; max-width: none !important; }
/* Themes that frame Luna's tab container by its MUI class would draw a box under the tab row: the Lunatic view owns its own surfaces */
[data-luna-settings-root] > [data-luna-settings-tab-page][data-luna-settings-tab-page] { background: none !important; background-image: none !important; border-radius: 0 !important; box-shadow: none !important; transform: none !important; }
`;

/** Same wrapper and markers the takeover produced, so all existing Lunatic CSS keeps applying. */
const lunaticTab = (tab: string, View: React.ComponentType<TabProps>) =>
  React.memo(({ active }: TabProps) => {
    React.useEffect(() => {
      // Existing layout CSS targets the root by the Lunatic marker
      document.querySelector("[data-luna-settings-root]")?.setAttribute("data-lunatic-settings-root", "true");
      if (active) document.dispatchEvent(new CustomEvent("lunatic:settings-tab-change", { detail: tab }));
    }, [active]);
    return (
      <div data-lunatic-cached-tab={tab} data-lunatic-cached-tab-active={active ? "true" : "false"}>
        <View active={active} />
      </div>
    );
  });

const views: Record<string, React.ComponentType<TabProps>> = {
  Plugins: lunaticTab("Plugins", LunaticPlugins),
  "Plugin Store": lunaticTab("Plugin Store", LunaticPluginStore),
  Themes: lunaticTab("Themes", LunaticThemes),
  Settings: lunaticTab("Settings", LunaticSettings),
  Supporters: lunaticTab("Supporters", LunaticSupporters),
};
const tabSpriteIcons: Record<string, TidalIcon> = {
  "Plugin Store": tidalIcons.marketplace,
  Themes: tidalIcons.shine,
  Supporters: tidalIcons.heart,
};

const FeatureFlagsView = lunaticTab(FEATURE_FLAGS_TAB, () => <LunaticFeatureFlags />);

function installSettingsTabs(api: SettingsTabsApi): () => void {
  const unloads: Unloads = new Set();
  for (const [id, content] of Object.entries(views)) api.override(unloads, id, { content, keepAlive: true });

  // Use TIDAL's own artwork for the tabs it has a matching symbol for; others keep Luna's icon
  for (const [id, icon] of Object.entries(tabSpriteIcons)) {
    if (hasTidalIcon(icon)) api.override(unloads, id, { icon: <TidalSpriteIcon icon={icon} /> });
  }

  // Preference driven parts are re-applied whenever the preferences change
  let prefUnloads: Unloads = new Set();
  const applyPreferences = () => {
    for (const unload of prefUnloads) unload();
    prefUnloads = new Set();
    if (uiPreferences.hideSupportersPage) api.override(prefUnloads, "Supporters", { hidden: true });
    if (uiPreferences.featureFlagsSeparateTab) {
      api.register(prefUnloads, { id: FEATURE_FLAGS_TAB, label: FEATURE_FLAGS_TAB, icon: <SettingsGlyph />, order: 450, content: FeatureFlagsView, keepAlive: true });
    }
  };
  applyPreferences();
  const stopWatching = [
    obyStore.on(() => uiPreferences.hideSupportersPage, applyPreferences),
    obyStore.on(() => uiPreferences.featureFlagsSeparateTab, applyPreferences),
  ];

  const originalBackground = settingsPage?.pageStyles?.background;
  if (settingsPage?.pageStyles) settingsPage.pageStyles.background = "transparent";

  return () => {
    for (const stop of stopWatching) stop?.();
    for (const unload of prefUnloads) unload();
    for (const unload of unloads) unload();
    if (settingsPage?.pageStyles && originalBackground !== undefined) settingsPage.pageStyles.background = originalBackground;
    document.querySelector("[data-luna-settings-root]")?.removeAttribute("data-lunatic-settings-root");
  };
}

const OWNED_TABS = new Set([...Object.keys(views), FEATURE_FLAGS_TAB]);

export function installSettingsTabsTakeover(): AdaptiveTakeover {
  const uninstall = installSettingsTabs(settingsTabsApi);
  let installed = true;
  return {
    active: true,
    viaTabsApi: true,
    health: "healthy",
    css: settingsTabsApiCss,
    isOwnedTabActive: () => installed && OWNED_TABS.has(settingsTabsApi.current),
    leaveFeatureFlagsTab() {
      if (installed && settingsTabsApi.current === FEATURE_FLAGS_TAB) settingsTabsApi.open("Settings");
    },
    unload() {
      if (!installed) return;
      installed = false;
      uninstall();
    },
  };
}
