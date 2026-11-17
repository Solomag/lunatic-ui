import { LunaUnload, Tracer } from "@luna/core";
import { lunaticAppearance, onLunaticAppearanceChange } from "./appearance";
import { applyAppearance, unloadAppearance } from "./runtime";

export { Settings } from "./Settings";

export const { trace } = Tracer("[Lunatic Appearance]");
export const unloads = new Set<LunaUnload>();

applyAppearance(lunaticAppearance);
const unlisten = onLunaticAppearanceChange(() => applyAppearance(lunaticAppearance));
unloads.add(unlisten);
unloads.add(unloadAppearance);

trace.log("Lunatic Appearance 0.2.3 loaded");
