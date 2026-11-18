import { Tracer, type LunaUnload } from "@luna/core";
import { ContextMenu, MediaItem, redux } from "@luna/lib";
import { clipboardWriteText } from "@luna/lib.native";

import { Shortcut } from "./shortcut";

export const { trace, errSignal } = Tracer("[Copy Artist - Title]");
export const unloads = new Set<LunaUnload>();

const copyButton = ContextMenu.addButton(unloads);

// Uses the names shown in TIDAL, without MusicBrainz lookups, so large selections copy instantly
const artistTitle = ({ tidalItem }: MediaItem) => {
	let title = tidalItem.title ?? "";
	if (tidalItem.version && !title.toLowerCase().includes(tidalItem.version.toLowerCase())) title += ` (${tidalItem.version})`;
	const artists = (tidalItem.artists ?? (tidalItem.artist ? [tidalItem.artist] : [])).map(({ name }) => name).filter(Boolean);
	return artists.length === 0 ? title : `${artists.join(", ")} - ${title}`;
};

ContextMenu.onMediaItem(unloads, async ({ mediaCollection, contextMenu }) => {
	const trackCount = await mediaCollection.count();
	if (trackCount === 0) return;

	const defaultText = (copyButton.text = "Copy Artist - Title");

	copyButton.onClick(async () => {
		copyButton.text = "Copying...";
		try {
			const lines: string[] = [];
			for await (const mediaItem of await mediaCollection.mediaItems()) {
				lines.push(artistTitle(mediaItem));
			}
			await clipboardWriteText(lines.join("\n"));
			redux.actions["contextMenu/CLOSE"]();
			trace.msg.log(`Copied ${lines.length === 1 ? lines[0] : `${lines.length} tracks`}`);
		} catch (err) {
			trace.msg.err.withContext("Failed to copy Artist - Title")(err);
		} finally {
			copyButton.text = defaultText;
		}
	});

	await copyButton.show(contextMenu);
});

// Ctrl+Shift+C copies the playing track, on Luna versions with keyboard shortcuts
Shortcut?.register(unloads, {
	id: "copyArtistTitle.playing",
	keys: "Ctrl+Shift+C",
	label: "Copy Artist - Title of the playing track",
	action: async () => {
		const mediaItem = await MediaItem.fromPlaybackContext();
		if (mediaItem === undefined) return;
		const line = artistTitle(mediaItem);
		await clipboardWriteText(line);
		trace.msg.log(`Copied ${line}`);
	},
});
