import { createLegacyPluginStoreRuntime, type LegacyPluginStoreRuntime } from "./plugin-store";
import { markLunaticSettingsRows } from "./plugins";
import { markFeatureFlags } from "./feature-flags";
import { markLunaticThemesPage } from "./themes";
import { markExactSupporterSections } from "./supporters";
import {
  applyLunaticInputSurface,
  markLunaticClientUpdateControls,
  markLunaticSettingsSections,
} from "./settings";
import {
  cleanupOverflowPopover,
  installOverflowPopover,
  onOverflowPopoverViewportChange,
} from "./overflow-popover";



const abort = new AbortController();
const { signal } = abort;

let observer: MutationObserver | null = null;
let scanQueued = false;
let scanFrame: number | null = null;
let legacyFallbackActive = false;
let pluginStore: LegacyPluginStoreRuntime | null = null;







function scan() {
  scanQueued = false;

  /* Most of this scan deliberately mutates data-* markers and inline styles.
     Do not let our own mutations recursively schedule more full-document
     scans while Luna is mounting/unmounting Settings tabs. */
  observer?.disconnect();

  try {
    /* Native Lunatic pages already own their markup. Keep the observer alive so
       a tab switch is noticed, but make mutations inside owned tabs effectively
       free instead of running the legacy full-document marker scan. */
    if (!legacyFallbackActive) return;

    if (pluginStore) {
      document.querySelectorAll<HTMLButtonElement>("button, [role=button]").forEach((candidate) => {
        if (candidate instanceof HTMLButtonElement) pluginStore!.processCard(candidate);
      });
      pluginStore.markStoreStructure();
      pluginStore.normalizeScopedHeadings();
    }
    markLunaticSettingsRows();
    markLunaticThemesPage();
    markExactSupporterSections();
    markFeatureFlags();
    applyLunaticInputSurface();
    markLunaticSettingsSections();
    markLunaticClientUpdateControls();

    document
      .querySelectorAll<HTMLElement>('[data-lunatic-installed-plugin-title="true"]')
      .forEach((title) => {
        title.removeAttribute("title");
      });
  } finally {
    if (legacyFallbackActive) {
      observer?.observe(document.documentElement, { subtree: true, childList: true });
    }
  }
}

function queueScan() {
  if (scanQueued) return;
  scanQueued = true;
  scanFrame = window.requestAnimationFrame(() => {
    scanFrame = null;
    scan();
  });
}

function cancelQueuedScan() {
  if (scanFrame !== null) {
    window.cancelAnimationFrame(scanFrame);
    scanFrame = null;
  }
  scanQueued = false;
}

/* The original Luna card remains a presentation shell only. All install /
   uninstall actions go through our explicit button and LunaPlugin lifecycle. */

export type LegacyDomRuntime = {
  readonly active: boolean;
  enable(): void;
  disable(): void;
  queueScan(): void;
  cleanup(): void;
};

export function createLegacyDomRuntime(): LegacyDomRuntime {
  let installed = false;
  pluginStore = createLegacyPluginStoreRuntime(signal, queueScan);

  const installListeners = () => {
    if (installed) return;
    installed = true;
    document.addEventListener("click", (event) => pluginStore?.blockDirectCardClick(event, legacyFallbackActive), { capture: true, signal });
    document.addEventListener("pointerdown", (event) => pluginStore?.blockDirectCardPress(event, legacyFallbackActive), { capture: true, signal });
    document.addEventListener("mousedown", (event) => pluginStore?.blockDirectCardPress(event, legacyFallbackActive), { capture: true, signal });
    window.addEventListener("resize", onOverflowPopoverViewportChange, { signal });
    window.addEventListener("scroll", onOverflowPopoverViewportChange, { capture: true, passive: true, signal });
    window.addEventListener("resize", () => {
      if (legacyFallbackActive) queueScan();
    }, { passive: true, signal });
    installOverflowPopover(signal);
  };

  installListeners();

  return {
    get active() {
      return legacyFallbackActive;
    },
    enable() {
      if (legacyFallbackActive && observer) return;
      legacyFallbackActive = true;
      observer ??= new MutationObserver(queueScan);
      observer.observe(document.documentElement, { subtree: true, childList: true });
      queueScan();
    },
    disable() {
      if (!legacyFallbackActive && !observer) return;
      legacyFallbackActive = false;
      observer?.disconnect();
      observer = null;
      cancelQueuedScan();
    },
    queueScan() {
      if (legacyFallbackActive) queueScan();
    },
    cleanup() {
      legacyFallbackActive = false;
      observer?.disconnect();
      observer = null;

      cancelQueuedScan();

      abort.abort();

      cleanupOverflowPopover();

      pluginStore?.cleanup();
      pluginStore = null;
    },
  };
}
