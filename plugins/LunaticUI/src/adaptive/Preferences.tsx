import React from "react";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import { store as obyStore } from "oby";
import { pluginStoreUiState, uiPreferences } from "./plugin-state";
import { leaveFeatureFlagsTabIfNeeded } from "./takeover";

export const LunaticUiSettings = React.memo(() => {
  const [showEnabledFirst, setShowEnabledFirst] = React.useState(uiPreferences.showEnabledFirst);
  const [askWhenUninstall, setAskWhenUninstall] = React.useState(uiPreferences.askWhenUninstall);
  const [featureFlagsSeparateTab, setFeatureFlagsSeparateTab] = React.useState(uiPreferences.featureFlagsSeparateTab);
  const [hideSupportersPage, setHideSupportersPage] = React.useState(uiPreferences.hideSupportersPage);
  const [categoryDescriptionsOnHover, setCategoryDescriptionsOnHover] = React.useState(
    uiPreferences.pluginSettingCategoryDescriptionsOnHover,
  );
  const [rememberPluginStoreState, setRememberPluginStoreState] = React.useState(uiPreferences.rememberPluginStoreState);
  const [pinLocalStorePlugins, setPinLocalStorePlugins] = React.useState(uiPreferences.pinLocalStorePlugins);

  React.useEffect(() => {
    const unloads = [
      obyStore.on(
        () => uiPreferences.showEnabledFirst,
        () => setShowEnabledFirst(obyStore.unwrap(uiPreferences.showEnabledFirst)),
      ),
      obyStore.on(
        () => uiPreferences.askWhenUninstall,
        () => setAskWhenUninstall(obyStore.unwrap(uiPreferences.askWhenUninstall)),
      ),
      obyStore.on(
        () => uiPreferences.featureFlagsSeparateTab,
        () => setFeatureFlagsSeparateTab(obyStore.unwrap(uiPreferences.featureFlagsSeparateTab)),
      ),
      obyStore.on(
        () => uiPreferences.hideSupportersPage,
        () => setHideSupportersPage(obyStore.unwrap(uiPreferences.hideSupportersPage)),
      ),
      obyStore.on(
        () => uiPreferences.pluginSettingCategoryDescriptionsOnHover,
        () => setCategoryDescriptionsOnHover(
          obyStore.unwrap(uiPreferences.pluginSettingCategoryDescriptionsOnHover),
        ),
      ),
      obyStore.on(
        () => uiPreferences.rememberPluginStoreState,
        () => setRememberPluginStoreState(obyStore.unwrap(uiPreferences.rememberPluginStoreState)),
      ),
      obyStore.on(
        () => uiPreferences.pinLocalStorePlugins,
        () => setPinLocalStorePlugins(obyStore.unwrap(uiPreferences.pinLocalStorePlugins)),
      ),
    ];
    return () => {
      for (const unload of unloads) unload?.();
    };
  }, []);

  return (
    <LunaSettings
      title="Lunatic UI"
      desc="Behavior preferences for the standalone Lunatic Settings renderer."
    >
      <LunaSwitchSetting
        title="Show enabled first"
        desc="Keep enabled plugins above disabled plugins while preserving the selected sort order inside each group."
        checked={showEnabledFirst}
        onChange={(_, checked) => (uiPreferences.showEnabledFirst = checked)}
      />
      <LunaSwitchSetting
        title="Ask when uninstall"
        desc="Show a confirmation dialog before uninstalling a plugin."
        checked={askWhenUninstall}
        onChange={(_, checked) => (uiPreferences.askWhenUninstall = checked)}
      />
      <LunaSwitchSetting
        title="Remember Plugin Store filters"
        desc="Restore Plugin Store sort, installed filter, view and developer filter after restarting TIDAL. Search text is never restored."
        checked={rememberPluginStoreState}
        onChange={(_, checked) => {
          uiPreferences.rememberPluginStoreState = checked;
          if (!checked) {
            pluginStoreUiState.sortMode = "downloads";
            pluginStoreUiState.installedFilter = "not-installed";
            pluginStoreUiState.view = "plugins";
            delete pluginStoreUiState.authorFilter;
          }
        }}
      />
      <LunaSwitchSetting
        title="Pin local Plugin Store entries"
        desc="Keep Local/DEV Store plugins in a separate collapsible section above the catalog. When disabled, local plugins join the normal catalog and obey Installed/Not installed filtering and sorting."
        checked={pinLocalStorePlugins}
        onChange={(_, checked) => (uiPreferences.pinLocalStorePlugins = checked)}
      />
      <LunaSwitchSetting
        title="Hide Supporters page"
        desc="Hide the Supporters tab from TIDALuna Settings. This is enabled by default because the page is informational only."
        checked={hideSupportersPage}
        onChange={(_, checked) => (uiPreferences.hideSupportersPage = checked)}
      />
      <LunaSwitchSetting
        title="Category descriptions on hover only"
        desc="Hide Core Plugin settings category descriptions from the layout and show the full description when hovering the category title."
        checked={categoryDescriptionsOnHover}
        onChange={(_, checked) => (uiPreferences.pluginSettingCategoryDescriptionsOnHover = checked)}
      />
      <LunaSwitchSetting
        title="Feature Flags in separate tab"
        desc="Show TIDAL Feature Flags as their own Luna Settings tab. When disabled, Feature Flags appear below Luna core plugins on the Settings tab."
        checked={featureFlagsSeparateTab}
        onChange={(_, checked) => {
          if (!checked) leaveFeatureFlagsTabIfNeeded();
          uiPreferences.featureFlagsSeparateTab = checked;
        }}
      />
    </LunaSettings>
  );
});
