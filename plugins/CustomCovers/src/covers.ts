import { ReactiveStore, type LunaUnload, type LunaUnloads } from "@luna/core";
import type { Album, Playlist } from "@luna/lib";

import { ImageOverrides } from "./imageOverrides";

export type CoverOverride = {
	title: string;
	/** Tidal image ids (uuids) that get replaced by url */
	imageIds: string[];
	/** http(s) url or a data url of a local image */
	url: string;
};

export const storage = await ReactiveStore.getPluginStorage<{
	covers: Record<string, CoverOverride>;
}>("CustomCovers", { covers: {} });

export const coverKey = (collection: Album | Playlist) => ("uuid" in collection ? `playlist:${collection.uuid}` : `album:${collection.id}`);

// Album.title() looks the album up on MusicBrainz, the tidal title is all we need
export const titleOf = (collection: Album | Playlist) =>
	("uuid" in collection ? collection.tidalPlaylist.title : collection.tidalAlbum.title) ?? coverKey(collection);

const imageIdsOf = (collection: Album | Playlist) =>
	"uuid" in collection
		? [collection.tidalPlaylist.squareImage, collection.tidalPlaylist.image].filter((id): id is string => !!id)
		: [collection.tidalAlbum.cover].filter((id): id is string => !!id);

const dataUrlToObjectUrl = (dataUrl: string) => {
	const [head, base64] = dataUrl.split(",", 2);
	const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	return URL.createObjectURL(new Blob([bytes], { type: head.slice(5).split(";")[0] }));
};

/** Cover key -> removes its image override (and revokes its blob url) */
const applied = new Map<string, LunaUnload>();
let pluginUnloads: LunaUnloads | undefined;

const applyCover = (key: string, cover: CoverOverride) => {
	if (pluginUnloads === undefined) return;
	// Local images are kept as data urls, a blob url is much cheaper to put in every img
	const url = cover.url.startsWith("data:") ? dataUrlToObjectUrl(cover.url) : cover.url;
	const removeOverride = ImageOverrides.add(pluginUnloads, cover.imageIds, url);
	const remove: LunaUnload = () => {
		pluginUnloads?.delete(remove);
		removeOverride();
		if (url !== cover.url) URL.revokeObjectURL(url);
	};
	pluginUnloads.add(remove);
	// Remove the previous cover only after the new one is shown
	applied.get(key)?.();
	applied.set(key, remove);
};

const removeCover = (key: string) => {
	applied.get(key)?.();
	applied.delete(key);
};

export const getCover = (collection: Album | Playlist): CoverOverride | undefined => storage.covers[coverKey(collection)];

export const setCover = (collection: Album | Playlist, url: string) => {
	const key = coverKey(collection);
	applyCover(key, (storage.covers[key] = { title: titleOf(collection), imageIds: imageIdsOf(collection), url }));
};

export const resetCover = (key: string) => {
	delete storage.covers[key];
	removeCover(key);
};

/** Shows the stored covers until `unloads` are run */
export const applyCovers = (unloads: LunaUnloads) => {
	pluginUnloads = unloads;
	for (const [key, cover] of Object.entries(storage.covers)) applyCover(key, cover);
	unloads.add(() => {
		pluginUnloads = undefined;
		applied.clear();
	});
};
