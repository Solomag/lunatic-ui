import React from "react";
import { Page } from "@luna/ui";
import { store as obyStore } from "oby";
import { uiPreferences } from "./plugin-state";
import { LunaticFeatureFlags } from "./FeatureFlags";
import { LunaticSupporters } from "./Supporters";
import { LunaticThemes } from "./Themes";
import { LunaticPluginStore } from "./PluginStore";
import { LunaticPlugins } from "./Plugins";
import { LunaticSettings } from "./Settings";
import { SettingsGlyph } from "./icons";
import { installSettingsTabs, settingsTabsApi } from "./tabs-api";

/** True while Lunatic is mounted through the @luna/ui SettingsTabs API instead of the takeover */
let tabsApiActive = false;

interface UnsafePage {
  component?: React.ReactNode;
  reactRoot?: { render(node: React.ReactNode): void };
  pageStyles?: CSSStyleDeclaration;
}





const FEATURE_FLAGS_TAB = "Feature Flags";
const OWNED_TABS = new Set(["Plugins", "Plugin Store", "Themes", "Settings", FEATURE_FLAGS_TAB, "Supporters"]);
let adaptiveActiveTab: string | undefined;
let adaptiveNavigateTab: ((tab: string) => void) | undefined;

export function isAdaptiveOwnedTabActive() {
  if (tabsApiActive && settingsTabsApi) return OWNED_TABS.has(settingsTabsApi.current);
  return adaptiveActiveTab !== undefined && OWNED_TABS.has(adaptiveActiveTab);
}

export function leaveFeatureFlagsTabIfNeeded() {
  if (tabsApiActive && settingsTabsApi) {
    if (settingsTabsApi.current === FEATURE_FLAGS_TAB) settingsTabsApi.open("Settings");
    return;
  }
  if (adaptiveActiveTab === FEATURE_FLAGS_TAB) adaptiveNavigateTab?.("Settings");
}




function invokeOriginalPage(element: React.ReactElement): React.ReactNode {
  const type: any = element.type;
  const impl = typeof type === "function" ? type : typeof type?.type === "function" ? type.type : null;
  if (!impl) throw new Error("Unsupported LunaPage component type");
  return impl(element.props);
}

const PersistentTab = React.memo(({ tab, currentTab, originalChildren }: { tab: string; currentTab: string; originalChildren: React.ReactNode }) => {
  const active = tab === currentTab;
  const [visited, setVisited] = React.useState(active);

  React.useEffect(() => {
    if (!active) return;
    if (!visited) setVisited(true);
    document.dispatchEvent(new CustomEvent("lunatic:settings-tab-change", { detail: tab }));
  }, [active, visited, tab]);

  if (!visited) return null;

  let children = originalChildren;
  if (tab === "Plugins") children = <LunaticPlugins active={active} />;
  else if (tab === "Plugin Store") children = <LunaticPluginStore active={active} />;
  else if (tab === "Themes") children = <LunaticThemes active={active} />;
  else if (tab === "Settings") children = <LunaticSettings active={active} />;
  else if (tab === FEATURE_FLAGS_TAB) children = <LunaticFeatureFlags />;
  else if (tab === "Supporters") children = <LunaticSupporters active={active} />;

  return (
    <div
      data-lunatic-cached-tab={tab}
      data-lunatic-cached-tab-active={active ? "true" : "false"}
      hidden={!active}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
});

function settingsTabsChildren(children: React.ReactNode) {
  return React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
}

function isSettingsTabs(children: React.ReactNode) {
  const values = new Set(settingsTabsChildren(children).map((child) => child.props?.value));
  return ["Plugins", "Plugin Store", "Themes", "Settings", "Supporters"].every((value) => values.has(value));
}

function featureFlagsTabFromTemplate(children: React.ReactNode) {
  const tabs = settingsTabsChildren(children);
  const template = tabs.find((child) => child.props?.value === "Settings") ?? tabs[0];
  if (!template) return null;
  return React.cloneElement(template, {
    key: "lunatic-feature-flags-tab",
    value: FEATURE_FLAGS_TAB,
    label: FEATURE_FLAGS_TAB,
    icon: <SettingsGlyph />,
  });
}

type AdaptiveTransformStats = {
  tabShells: Set<string>;
  settingsTabsFound: boolean;
  settingsRootFound: boolean;
};

function transformPages(node: React.ReactNode, stats: AdaptiveTransformStats): React.ReactNode {
  if (Array.isArray(node)) return node.map((child) => transformPages(child, stats));
  if (!React.isValidElement(node)) return node;

  const props = node.props as Record<string, any>;
  if (typeof props.tab === "string" && Object.prototype.hasOwnProperty.call(props, "currentTab")) {
    const tab = props.tab as string;
    const currentTab = props.currentTab as string;
    stats.tabShells.add(tab);
    adaptiveActiveTab = currentTab;
    if (tab === "Supporters" && uiPreferences.hideSupportersPage) return null;
    return (
      <PersistentTab
        key={`lunatic-cached-tab:${tab}`}
        tab={tab}
        currentTab={currentTab}
        originalChildren={props.children}
      />
    );
  }

  const children = props.children;
  if (children === undefined) return node;
  let nextChildren = React.Children.map(children, (child) => transformPages(child, stats));

  if (isSettingsTabs(children)) {
    stats.settingsTabsFound = true;
    if (typeof props.onChange === "function") {
      adaptiveNavigateTab = (tab: string) => props.onChange(null, tab);
    }
    if (uiPreferences.hideSupportersPage) {
      nextChildren = React.Children.toArray(nextChildren).filter(
        (child: any) => !(React.isValidElement<{ value?: string }>(child) && child.props?.value === "Supporters"),
      );
    }
  }

  if (isSettingsTabs(children) && uiPreferences.featureFlagsSeparateTab) {
    const featureTab = featureFlagsTabFromTemplate(children);
    if (featureTab) {
      const tabs = React.Children.toArray(nextChildren);
      const supportIndex = tabs.findIndex((child: any) => React.isValidElement<{ value?: string }>(child) && child.props?.value === "Supporters");
      if (supportIndex >= 0) tabs.splice(supportIndex, 0, featureTab);
      else tabs.push(featureTab);
      nextChildren = tabs;
    }
  }

  // Core LunaPage reserves marginBottom: 10 even though the player bar already
  // occupies its own fixed space. Under keep-alive this produces a large blank
  // scroll tail after the last visible card. Remove only that known shell margin.
  if (props.maxWidth === "md" && props.sx && typeof props.sx === "object" && props.sx.marginBottom === 10) {
    stats.settingsRootFound = true;
    const rootChildren = React.Children.toArray(nextChildren);
    if (uiPreferences.featureFlagsSeparateTab) {
      rootChildren.push(
        <PersistentTab
          key="lunatic-cached-tab:Feature Flags"
          tab={FEATURE_FLAGS_TAB}
          currentTab={adaptiveActiveTab ?? "Plugins"}
          originalChildren={null}
        />,
      );
    }
    return React.cloneElement(node as React.ReactElement<any>, {
      sx: { ...props.sx, marginBottom: 0 },
      "data-lunatic-settings-root": "true",
    }, rootChildren);
  }

  return React.cloneElement(node as React.ReactElement<any>, undefined, nextChildren);
}

export type AdaptiveHealth = "pending" | "healthy" | "failed";

let adaptiveHealth: AdaptiveHealth = "pending";

function publishAdaptiveHealth(next: AdaptiveHealth) {
  if (adaptiveHealth === next) return;
  adaptiveHealth = next;
  document.dispatchEvent(new CustomEvent<AdaptiveHealth>("lunatic:adaptive-health", { detail: next }));
}

const REQUIRED_ADAPTIVE_TABS = ["Plugins", "Plugin Store", "Themes", "Settings", "Supporters"] as const;

const AdaptiveLunaPage = React.memo(({ original }: { original: React.ReactElement }) => {
  const [, forcePreferences] = React.useReducer((value: number) => value + 1, 0);
  React.useEffect(() => {
    const unloads = [
      obyStore.on(
        () => uiPreferences.featureFlagsSeparateTab,
        () => forcePreferences(),
      ),
      obyStore.on(
        () => uiPreferences.hideSupportersPage,
        () => {
          if (obyStore.unwrap(uiPreferences.hideSupportersPage) && adaptiveActiveTab === "Supporters") {
            adaptiveNavigateTab?.("Settings");
          }
          forcePreferences();
        },
      ),
    ];
    return () => {
      for (const unload of unloads) unload?.();
    };
  }, []);

  let rendered: React.ReactNode = original;
  let health: AdaptiveHealth = "failed";

  try {
    const stats: AdaptiveTransformStats = {
      tabShells: new Set<string>(),
      settingsTabsFound: false,
      settingsRootFound: false,
    };
    rendered = transformPages(invokeOriginalPage(original), stats);

    const missingTabs = REQUIRED_ADAPTIVE_TABS.filter((tab) => !stats.tabShells.has(tab));
    if (!stats.settingsTabsFound || !stats.settingsRootFound || missingTabs.length > 0) {
      throw new Error(
        `Adaptive structure mismatch: tabs=${stats.settingsTabsFound}, root=${stats.settingsRootFound}, missing=${missingTabs.join(",") || "none"}`,
      );
    }
    health = "healthy";
  } catch (err) {
    console.error("[Lunatic UI] Adaptive LunaPage failed structural health check; enabling legacy fallback", err);
    rendered = original;
  }

  React.useEffect(() => {
    publishAdaptiveHealth(health);
  }, [health]);

  return <>{rendered}</>;
});

function deepestSingleChild(element: React.ReactElement): React.ReactElement {
  const child = (element.props as any)?.children;
  return React.isValidElement(child) ? deepestSingleChild(child) : element;
}

function replaceDeepestSingleChild(element: React.ReactElement, replacement: React.ReactNode): React.ReactElement {
  const child = (element.props as any)?.children;
  if (!React.isValidElement(child)) return replacement as React.ReactElement;
  return React.cloneElement(
    element as React.ReactElement<any>,
    undefined,
    replaceDeepestSingleChild(child, replacement),
  );
}

export type AdaptiveTakeover = {
  /** Mounted through the @luna/ui SettingsTabs API: no legacy DOM fallback is ever needed */
  viaTabsApi?: boolean;
  active: boolean;
  readonly health: AdaptiveHealth;
  unload(): void;
};

export function installAdaptiveSettingsTakeover(): AdaptiveTakeover {
  // Prefer the SettingsTabs API when the running Luna provides it: no React tree patching needed
  if (settingsTabsApi) {
    const uninstall = installSettingsTabs(settingsTabsApi);
    tabsApiActive = true;
    adaptiveHealth = "healthy";
    // Listeners in index.ts are attached after install, publish on the next tick
    setTimeout(() => {
      if (tabsApiActive) document.dispatchEvent(new CustomEvent<AdaptiveHealth>("lunatic:adaptive-health", { detail: "healthy" }));
    });
    return {
      active: true,
      viaTabsApi: true,
      get health() {
        return adaptiveHealth;
      },
      unload() {
        if (!tabsApiActive) return;
        tabsApiActive = false;
        adaptiveHealth = "pending";
        uninstall();
      },
    };
  }

  const pages = (Page as any).pages as Record<string, UnsafePage> | undefined;
  const page = pages?.LunaSettings;
  const originalComponent = page?.component;

  if (!page || !React.isValidElement(originalComponent)) {
    adaptiveHealth = "failed";
    return { active: false, health: "failed", unload() {} };
  }

  const originalLeaf = deepestSingleChild(originalComponent);
  const patched = replaceDeepestSingleChild(
    originalComponent,
    <AdaptiveLunaPage original={originalLeaf} />,
  );

  const originalPageBackground = page.pageStyles?.background;
  if (page.pageStyles) page.pageStyles.background = "transparent";

  page.component = patched;
  page.reactRoot?.render(patched);

  let restored = false;
  return {
    active: true,
    get health() {
      return adaptiveHealth;
    },
    unload() {
      if (restored) return;
      restored = true;
      adaptiveActiveTab = undefined;
      adaptiveNavigateTab = undefined;
      adaptiveHealth = "pending";
      if (page.pageStyles && originalPageBackground !== undefined) {
        page.pageStyles.background = originalPageBackground;
      }
      page.component = originalComponent;
      page.reactRoot?.render(originalComponent);
    },
  };
}
