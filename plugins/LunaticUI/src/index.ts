import { LunaUnload, Tracer } from "@luna/core";
import packageManifest from "../package.json";
import { adaptiveStoreCss, installAdaptiveSettingsTakeover, LunaticUiSettings, previewImageCss, settingsTabsApiCss } from "./adaptive";
import {
  installPlayBarClearanceTracking,
  queuePlayBarClearance,
  uninstallPlayBarClearanceTracking,
} from "./playbar";
import {
  lunaticLayoutCss,
  lunaticPluginStoreUxCss,
} from "./styles/runtime";
import { createLegacyDomRuntime } from "./legacy/runtime";
import { installProfileMenuSafety } from "./profile-menu";
import { installTidalShellPolish } from "./tidal-shell";

export const Settings = LunaticUiSettings;

const PLUGIN_VERSION = packageManifest.version;

const lifecycleAbort = new AbortController();
const { signal: lifecycleSignal } = lifecycleAbort;

export const { trace } = Tracer("[Lunatic UI]");
export const unloads = new Set<LunaUnload>();

const STYLE_ID = "lunatic-ui-style";

const adaptiveTakeover = installAdaptiveSettingsTakeover();
const adaptiveTakeoverAvailable = adaptiveTakeover.active;
// The legacy DOM fallback only exists for Luna builds without the SettingsTabs API
const legacyDom = adaptiveTakeover.viaTabsApi ? undefined : createLegacyDomRuntime();

function injectStyle() {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  const css = `/* ===== LUNATIC UI: LAYOUT + UX ===== */\n${lunaticLayoutCss}\n\n${lunaticPluginStoreUxCss}\n\n/* ===== ADAPTIVE SETTINGS TAKEOVER ===== */\n${adaptiveStoreCss}\n\n/* ===== SETTINGS TABS API ===== */\n${settingsTabsApiCss}

/* ===== STORE PREVIEW IMAGES ===== */
${previewImageCss}`;
  if (style.textContent !== css) style.textContent = css;
}

injectStyle();
installPlayBarClearanceTracking();
installProfileMenuSafety(unloads);
installTidalShellPolish(unloads);

window.addEventListener("resize", queuePlayBarClearance, { passive: true, signal: lifecycleSignal });
window.addEventListener("focus", queuePlayBarClearance, { passive: true, signal: lifecycleSignal });
document.addEventListener("visibilitychange", (() => {
  if (!document.hidden) queuePlayBarClearance();
}) as EventListener, { signal: lifecycleSignal });
function enableLegacyFallback(reason: string) {
  if (!legacyDom) return;
  const wasActive = legacyDom.active;
  legacyDom.enable();
  if (!wasActive) trace.msg.warn(`Legacy DOM fallback enabled (${reason})`);
}

function disableLegacyFallback() {
  legacyDom?.disable();
}

document.addEventListener("lunatic:adaptive-health", ((event: Event) => {
  const health = (event as CustomEvent<"pending" | "healthy" | "failed">).detail;
  if (health === "healthy") disableLegacyFallback();
  else if (health === "failed") enableLegacyFallback("adaptive structural health check failed");
}) as EventListener, { signal: lifecycleSignal });

/* Cached tabs no longer remount on every navigation. This event only matters
   when the legacy fallback is active. */
document.addEventListener("lunatic:settings-tab-change", (() => {
  legacyDom?.queueScan();
}) as EventListener, { signal: lifecycleSignal });

if (!adaptiveTakeoverAvailable) {
  enableLegacyFallback("adaptive takeover unavailable");
}

unloads.add(() => {
  adaptiveTakeover.unload();
  legacyDom?.cleanup();
  lifecycleAbort.abort();
  uninstallPlayBarClearanceTracking();

  document.getElementById(STYLE_ID)?.remove();

  trace.log(`Lunatic UI ${PLUGIN_VERSION} unloaded`);
});

// Console only: a toast on every load is noise for users
trace.log(
  `Lunatic UI ${PLUGIN_VERSION} loaded (${adaptiveTakeover.viaTabsApi ? "SettingsTabs API" : adaptiveTakeoverAvailable ? "adaptive takeover pending health check" : "legacy fallback"})`,
);

