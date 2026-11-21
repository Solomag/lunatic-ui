/**
 * What the running Luna (TidaLuna or TidaLunar) can do, checked once at load.
 *
 * Lunatic UI carries workarounds for older Luna builds and code for newer Luna APIs. Each piece
 * is only loaded (lazy `import()`) when this says it is needed, so a current Luna runs none of the
 * workarounds and an older one none of the new API code. Prefer adding a feature check here over
 * comparing version strings.
 */
import type { LunaUnload } from "@luna/core";
import { observePromise } from "@luna/lib";
import * as lunaUi from "@luna/ui";

const ui = lunaUi as Record<string, unknown>;

/** True when @luna/ui itself intercepts the redux action (Luna marks each intercept unload with its action types) */
function lunaUiIntercepts(actionType: string) {
  const unloads = ui.unloads;
  if (!(unloads instanceof Set)) return false;
  const source = `intercept${JSON.stringify([actionType])}`;
  // Luna prefixes the source with the owning module when it is added to the unloads: `@luna/ui.intercept[...]`
  for (const unload of unloads) {
    const unloadSource = (unload as { source?: unknown })?.source;
    if (typeof unloadSource === "string" && unloadSource.endsWith(source)) return true;
  }
  return false;
}

export const lunaFeatures = {
  /** @luna/ui SettingsTabs API (TidaLuna 1.21.0+): plugins add or replace Luna Settings tabs without patching the page */
  settingsTabs: typeof ui.SettingsTabs === "object" && ui.SettingsTabs !== null,
  /** Luna asks before a logout from the profile menu (TidaLuna 1.20.5+, Inrixia/TidaLuna#212) */
  coreLogoutConfirm: lunaUiIntercepts("session/LOGOUT"),
  /** @luna/ui MuiTheme API (TidaLuna 1.21.9+): plugins extend Luna's MUI theme, Luna setting components are themeable */
  themeOverrides: typeof (ui.MuiTheme as { override?: unknown } | undefined)?.override === "function",
} as const;

export const WINDOW_TITLE_SELECTOR = 'div[class^="_mainContainer"] > div[class^="_bar"] > div[class^="_title"]';
const TITLE_WAIT_MS = 30000;

/**
 * Resolves true when Luna keeps its window title itself after TIDAL re-renders the title bar
 * (it marks its title with `data-luna-title`), false when it sets it only once at startup.
 * The title bar may not exist yet when plugins load, so this waits for it through Luna's shared observer.
 */
export async function lunaKeepsWindowTitle(unloads: Set<LunaUnload>) {
  const title = document.querySelector(WINDOW_TITLE_SELECTOR) ?? (await observePromise(unloads, WINDOW_TITLE_SELECTOR, TITLE_WAIT_MS));
  if (title === null) return false;
  // Luna sets the title from its own observer callback, give it a frame when the bar just appeared
  if (title.querySelector("[data-luna-title]") === null) await new Promise((resolve) => requestAnimationFrame(resolve));
  return title.isConnected && title.querySelector("[data-luna-title]") !== null;
}
