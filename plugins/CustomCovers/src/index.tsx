import type { LunaUnload } from "@luna/core";
import { ContextMenu, redux } from "@luna/lib";

import { askForCover } from "./coverDialog";
import { applyCovers, coverKey, getCover, resetCover, setCover, titleOf } from "./covers";

export const unloads = new Set<LunaUnload>();

export { Settings } from "./Settings";

applyCovers(unloads);

const setButton = ContextMenu.addButton(unloads);
const resetButton = ContextMenu.addButton(unloads);
resetButton.text = "Reset custom cover";

ContextMenu.onMediaItem(unloads, async ({ mediaCollection, contextMenu }) => {
	// Only whole albums and playlists have a cover of their own
	if (!("tidalAlbum" in mediaCollection || "tidalPlaylist" in mediaCollection)) return;
	const collection = mediaCollection;

	const current = getCover(collection);
	setButton.text = current === undefined ? "Set custom cover…" : "Change custom cover…";
	setButton.onClick(async () => {
		redux.actions["contextMenu/CLOSE"]();
		const url = await askForCover(titleOf(collection), getCover(collection)?.url);
		if (url !== undefined) setCover(collection, url);
	});
	await setButton.show(contextMenu);

	// ContextMenuButton.hide() is new in @luna/lib (Inrixia/TidaLuna#223), older versions need the whole menu item removed by hand
	if (current === undefined) {
		const button = resetButton as unknown as { hide?: () => void; elem?: HTMLElement };
		return button.hide !== undefined ? button.hide() : button.elem?.parentElement?.parentElement?.remove();
	}
	resetButton.onClick(() => {
		redux.actions["contextMenu/CLOSE"]();
		resetCover(coverKey(collection));
	});
	await resetButton.show(contextMenu);
});
