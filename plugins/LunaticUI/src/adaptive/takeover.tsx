import { lunaFeatures } from "../luna-features";

export type AdaptiveHealth = "pending" | "healthy" | "failed";

export type AdaptiveTakeover = {
  /** Mounted through the @luna/ui SettingsTabs API: no legacy DOM fallback is ever needed */
  viaTabsApi?: boolean;
  active: boolean;
  readonly health: AdaptiveHealth;
  /** CSS only this way of mounting needs */
  css?: string;
  isOwnedTabActive(): boolean;
  leaveFeatureFlagsTab(): void;
  unload(): void;
};

let current: AdaptiveTakeover | undefined;

export function isAdaptiveOwnedTabActive() {
  return current?.isOwnedTabActive() ?? false;
}

export function leaveFeatureFlagsTabIfNeeded() {
  current?.leaveFeatureFlagsTab();
}

/**
 * Mount the Lunatic views into Luna Settings. Only the code for the running Luna is loaded:
 * the SettingsTabs API when Luna has it, otherwise the React tree patch of the Settings page.
 */
export async function installAdaptiveSettingsTakeover(): Promise<AdaptiveTakeover> {
  const takeover = lunaFeatures.settingsTabs
    ? (await import("./tabs-api")).installSettingsTabsTakeover()
    : (await import("./tree-takeover")).installTreeTakeover();
  current = takeover;
  return {
    ...takeover,
    get health() {
      return takeover.health;
    },
    unload() {
      if (current === takeover) current = undefined;
      takeover.unload();
    },
  };
}
