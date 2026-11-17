import { ReactiveStore } from "@luna/core";

export type LunaticAppearance = {
  pageBackground: string;
  pageBackgroundImage: string;
  backgroundFit: "cover" | "contain" | "auto";
  backgroundPositionX: number;
  backgroundPositionY: number;
  backgroundZoom: number;
  shellBackground: string;
  cardBackground: string;
  innerBackground: string;
  controlBackground: string;
  borderColor: string;
  strongBorderColor: string;
  textColor: string;
  mutedTextColor: string;
  borderRadius: number;
  surfaceOpacity: number;
  hideAuthorAvatars: boolean;
  /** Push page/card/text/border colours into a theme palette (--solo-*), so they reach all of TIDAL */
  applyToTheme: boolean;
  singleIconColor: boolean;
  iconColor: string;
  reloadIconColor: string;
  liveReloadIconColor: string;
  settingsIconColor: string;
  uninstallIconColor: string;
};

export const defaultLunaticAppearance: LunaticAppearance = {
  pageBackground: "#09090b",
  pageBackgroundImage: "",
  backgroundFit: "cover",
  backgroundPositionX: 50,
  backgroundPositionY: 50,
  backgroundZoom: 100,
  shellBackground: "#070709",
  cardBackground: "#0c0c0f",
  innerBackground: "#0c0c0f",
  controlBackground: "#09090b",
  borderColor: "rgba(255,255,255,.11)",
  strongBorderColor: "rgba(255,255,255,.18)",
  textColor: "rgba(255,255,255,.94)",
  mutedTextColor: "rgba(255,255,255,.62)",
  borderRadius: 10,
  surfaceOpacity: 100,
  hideAuthorAvatars: false,
  applyToTheme: false,
  singleIconColor: true,
  iconColor: "#d8d8de",
  reloadIconColor: "#d8d8de",
  liveReloadIconColor: "#d8d8de",
  settingsIconColor: "#d8d8de",
  uninstallIconColor: "#d8d8de"
};

export const lunaticAppearance = await ReactiveStore.getPluginStorage<LunaticAppearance>(
  "LunaticAppearance",
  defaultLunaticAppearance,
);

for (const [key, value] of Object.entries(defaultLunaticAppearance) as [keyof LunaticAppearance, LunaticAppearance[keyof LunaticAppearance]][]) {
  if (lunaticAppearance[key] === undefined) (lunaticAppearance as any)[key] = value;
}

const listeners = new Set<() => void>();

export function onLunaticAppearanceChange(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveLunaticAppearance(next: LunaticAppearance) {
  Object.assign(lunaticAppearance, next);
  listeners.forEach((listener) => listener());
}

export function resetLunaticAppearance() {
  saveLunaticAppearance({ ...defaultLunaticAppearance });
}
