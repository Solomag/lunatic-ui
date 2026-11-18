import { Tracer, type LunaUnload } from "@luna/core";
import { MediaItem, redux } from "@luna/lib";

import { Shortcut } from "./shortcut";

export const { trace, errSignal } = Tracer("[Lunatic Shortcuts]");
export const unloads = new Set<LunaUnload>();

// Opens the page of the playing track's artist or album
const goTo = async (kind: "artist" | "album") => {
	const { tidalItem } = (await MediaItem.fromPlaybackContext()) ?? {};
	const id = kind === "artist" ? (tidalItem?.artist?.id ?? tidalItem?.artists?.[0]?.id) : tidalItem?.album?.id;
	if (id === undefined) return false;
	redux.actions["router/PUSH"]({ pathname: `/${kind}/${id}`, search: "", replace: false });
};

// Adds the playing track or video to My Collection or removes it, like the heart in the player bar
const toggleFavorite = () => {
	const { mediaProduct } = redux.store.getState().playbackControls;
	if (mediaProduct?.productId === undefined) return false;
	const item = { itemId: Number(mediaProduct.productId), itemType: mediaProduct.productType };
	redux.actions["content/TOGGLE_FAVORITE_ITEMS"](<redux.ActionPayloads["content/TOGGLE_FAVORITE_ITEMS"]>{
		from: "heart",
		items: [item],
		moduleId: "NOW_PLAYING",
	});
};

// Keys TIDAL already uses (Ctrl+Left/Right, Shift+Ctrl+Left/Right, Ctrl+S, Ctrl+F, Ctrl+H, Ctrl+P, Ctrl+U, Shift+Ctrl+L) are left alone
if (Shortcut === undefined) {
	trace.msg.warn("Needs a Luna version with keyboard shortcuts (Shortcut API), nothing is registered");
} else {
	Shortcut.register(unloads, {
		id: "lunatic.volumeUp",
		keys: "Ctrl+ArrowUp",
		label: "Volume up",
		action: () => redux.actions["playbackControls/INCREASE_VOLUME"](),
	});
	Shortcut.register(unloads, {
		id: "lunatic.volumeDown",
		keys: "Ctrl+ArrowDown",
		label: "Volume down",
		action: () => redux.actions["playbackControls/DECREASE_VOLUME"](),
	});
	Shortcut.register(unloads, {
		id: "lunatic.toggleMute",
		keys: "Ctrl+M",
		label: "Mute / unmute",
		action: () => redux.actions["playbackControls/TOGGLE_MUTE"](),
	});
	Shortcut.register(unloads, {
		id: "lunatic.toggleRepeat",
		keys: "Ctrl+R",
		label: "Repeat: off / all / one",
		action: () => redux.actions["playQueue/TOGGLE_REPEAT_MODE"](),
	});
	Shortcut.register(unloads, {
		id: "lunatic.toggleFavorite",
		keys: "Alt+L",
		label: "Add the playing track to My Collection / remove it",
		action: toggleFavorite,
	});
	Shortcut.register(unloads, {
		id: "lunatic.goToArtist",
		keys: "Alt+A",
		label: "Go to the playing artist",
		action: () => goTo("artist"),
	});
	Shortcut.register(unloads, {
		id: "lunatic.goToAlbum",
		keys: "Alt+B",
		label: "Go to the playing album",
		action: () => goTo("album"),
	});
}
