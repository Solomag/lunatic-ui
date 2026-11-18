import type { LunaUnload } from "@luna/core";
import { ContextMenu, redux } from "@luna/lib";

import { askForCover } from "./coverDialog";
import { coverKey, getCover, interceptCovers, resetCover, setCover, titleOf } from "./covers";

export const unloads = new Set<LunaUnload>();

export { Settings } from "./Settings";

interceptCovers(unloads);

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

	// Remove the whole menu item (show() appends the span's wrapper), removing only the span would break the button
	if (current === undefined) return resetButton.elem?.parentElement?.parentElement?.remove();
	resetButton.onClick(() => {
		redux.actions["contextMenu/CLOSE"]();
		resetCover(coverKey(collection));
	});
	await resetButton.show(contextMenu);
});
