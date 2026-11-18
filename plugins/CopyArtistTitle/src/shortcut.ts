import type { LunaUnloads } from "@luna/core";
import * as lib from "@luna/lib";

export type ShortcutOptions = {
	id: string;
	keys: string | string[];
	label?: string;
	enabled?: boolean;
	action: (event: KeyboardEvent) => unknown;
};
type ShortcutApi = { register(unloads: LunaUnloads, options: ShortcutOptions): unknown };

/** Luna's keyboard shortcut API (`Shortcut` in @luna/lib), undefined on Luna versions without it */
export const Shortcut = (lib as { Shortcut?: ShortcutApi }).Shortcut;
