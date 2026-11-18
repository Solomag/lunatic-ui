import { ReactiveStore, type LunaUnloads } from "@luna/core";
import type { Album, Playlist } from "@luna/lib";

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

const imageIdsOf = (collection: Album | Playlist) => {
	const ids = "uuid" in collection ? [collection.tidalPlaylist.image, collection.tidalPlaylist.squareImage] : [collection.tidalAlbum.cover];
	return ids.filter((id): id is string => typeof id === "string" && id.length > 0);
};

/** Tidal image id -> url to show instead, rebuilt from storage by `refreshCovers` */
let replacements = new Map<string, string>();
const objectUrls: string[] = [];

// Matches urls like https://resources.tidal.com/images/aaaaaaaa/bbbb/cccc/dddd/eeeeeeeeeeee/640x640.jpg
const tidalImageUrl =
	/https?:\/\/resources\.tidal\.com\/images\/([0-9a-f]{8}\/[0-9a-f]{4}\/[0-9a-f]{4}\/[0-9a-f]{4}\/[0-9a-f]{12})\/[^\s,"')]+/gi;

export const replaceCoverUrls = (value: string) => {
	if (replacements.size === 0 || !value.includes("resources.tidal.com")) return value;
	return value.replace(tidalImageUrl, (url, idPath: string) => replacements.get(idPath.replaceAll("/", "-").toLowerCase()) ?? url);
};

const dataUrlToObjectUrl = (dataUrl: string) => {
	const [head, base64] = dataUrl.split(",", 2);
	const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	const objectUrl = URL.createObjectURL(new Blob([bytes], { type: head.slice(5).split(";")[0] }));
	objectUrls.push(objectUrl);
	return objectUrl;
};

const revokeObjectUrls = () => {
	for (const objectUrl of objectUrls.splice(0)) URL.revokeObjectURL(objectUrl);
};

// Values tidal set before we replaced them, keyed by the element (src/srcset) or its style declaration (css properties)
const originals = new WeakMap<object, Record<string, any>>();
const coverAttributes = ["src", "srcset"];
const isCoverElement = (elem: Element) => elem instanceof HTMLImageElement || elem instanceof HTMLSourceElement;

const nativeSetAttribute = Element.prototype.setAttribute;
const nativeSetProperty = CSSStyleDeclaration.prototype.setProperty;
const patchedProps: [object, string, PropertyDescriptor][] = [];

/** Replaces the cover urls in a value tidal sets and remembers the original so it can be restored */
const rewrite = (owner: object, name: string, value: string) => {
	const replaced = replaceCoverUrls(value);
	const ownerOriginals = originals.get(owner);
	if (replaced !== value) originals.set(owner, { ...ownerOriginals, [name]: value });
	else if (ownerOriginals?.[name] !== undefined) delete ownerOriginals[name];
	return replaced;
};

/** Re-applies the overrides to the covers already on screen */
const updateRenderedCovers = () => {
	for (const elem of document.querySelectorAll("img, source")) {
		for (const name of coverAttributes) {
			const current = elem.getAttribute(name);
			if (current === null) continue;
			const replaced = rewrite(elem, name, originals.get(elem)?.[name] ?? current);
			if (replaced !== current) nativeSetAttribute.call(elem, name, replaced);
		}
	}
	// Backgrounds like the blurred header image use inline css (eg. --img: url(...))
	for (const elem of document.querySelectorAll<HTMLElement>("[style]")) {
		const style = elem.style;
		const names = new Set(Object.keys(originals.get(style) ?? {}));
		for (let i = 0; i < style.length; i++) if (style.getPropertyValue(style[i]).includes("url(")) names.add(style[i]);
		for (const name of names) {
			const current = style.getPropertyValue(name);
			const replaced = rewrite(style, name, originals.get(style)?.[name] ?? current);
			if (replaced !== current) nativeSetProperty.call(style, name, replaced, style.getPropertyPriority(name));
		}
	}
};

// The OS media controls (eg. Windows media overlay) get the cover from navigator.mediaSession
const mediaSessionMetadata = Object.getOwnPropertyDescriptor(MediaSession.prototype, "metadata")!;
const updateMediaSession = () => {
	const metadata = navigator.mediaSession.metadata;
	if (metadata !== null) navigator.mediaSession.metadata = metadata;
};

export const refreshCovers = () => {
	revokeObjectUrls();
	const next = new Map<string, string>();
	for (const cover of Object.values(storage.covers)) {
		const url = cover.url.startsWith("data:") ? dataUrlToObjectUrl(cover.url) : cover.url;
		for (const imageId of cover.imageIds) next.set(imageId.toLowerCase(), url);
	}
	replacements = next;
	updateRenderedCovers();
	updateMediaSession();
};

export const getCover = (collection: Album | Playlist): CoverOverride | undefined => storage.covers[coverKey(collection)];

export const setCover = (collection: Album | Playlist, url: string) => {
	storage.covers[coverKey(collection)] = {
		title: titleOf(collection),
		imageIds: imageIdsOf(collection),
		url,
	};
	refreshCovers();
};

export const resetCover = (key: string) => {
	delete storage.covers[key];
	refreshCovers();
};

/**
 * Tidal builds every cover <img> (headers, grids, player bar, now playing) from a resources.tidal.com url containing the image id.
 * Rewriting those urls when they are set on <img>/<source> elements and inline styles covers every place at once.
 */
export const interceptCovers = (unloads: LunaUnloads) => {
	Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
		if (isCoverElement(this) && coverAttributes.includes(name.toLowerCase())) value = rewrite(this, name.toLowerCase(), String(value));
		return nativeSetAttribute.call(this, name, value);
	};
	CSSStyleDeclaration.prototype.setProperty = function (this: CSSStyleDeclaration, name: string, value: string | null, priority?: string) {
		if (typeof value === "string" && value.includes("url(")) value = rewrite(this, name, value);
		return nativeSetProperty.call(this, name, value, priority);
	};
	Object.defineProperty(MediaSession.prototype, "metadata", {
		...mediaSessionMetadata,
		set(this: MediaSession, metadata: MediaMetadata | null) {
			if (metadata !== null) {
				// Use the artwork tidal set unless tidal changed it since we replaced it
				const previous = originals.get(metadata);
				const unchanged = previous !== undefined && metadata.artwork.every((image, i) => image.src === previous.replaced[i]?.src);
				const artwork: readonly MediaImage[] = unchanged ? previous.artwork : metadata.artwork;
				const replaced = artwork.map((image) => ({
					...image,
					src: replaceCoverUrls(image.src),
				}));
				originals.set(metadata, { artwork, replaced });
				metadata.artwork = replaced;
			}
			mediaSessionMetadata.set!.call(this, metadata);
		},
	});
	for (const proto of [HTMLImageElement.prototype, HTMLSourceElement.prototype]) {
		for (const name of coverAttributes) {
			const descriptor = Object.getOwnPropertyDescriptor(proto, name)!;
			patchedProps.push([proto, name, descriptor]);
			Object.defineProperty(proto, name, {
				...descriptor,
				set(this: Element, value: string) {
					descriptor.set!.call(this, rewrite(this, name, String(value)));
				},
			});
		}
	}
	refreshCovers();

	unloads.add(() => {
		// Put tidal's covers back while still patched, the media session setter restores the original artwork
		replacements = new Map();
		updateRenderedCovers();
		updateMediaSession();
		revokeObjectUrls();
		Element.prototype.setAttribute = nativeSetAttribute;
		CSSStyleDeclaration.prototype.setProperty = nativeSetProperty;
		Object.defineProperty(MediaSession.prototype, "metadata", mediaSessionMetadata);
		for (const [proto, name, descriptor] of patchedProps.splice(0)) Object.defineProperty(proto, name, descriptor);
	});
};
