// Based on @vmohammad/api by vMohammad (https://github.com/vMohammad24/luna-plugins), see THIRD_PARTY_NOTICES.md
import { LunaUnload, reduxStore, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, PlayState, redux, safeInterval } from "@luna/lib";
import { startServer, stopServer, updateFields, type ServerOptions } from "./index.native";
import { settings } from "./Settings";
import type { ActionData, ActionHandler } from "./types";

declare global {
	interface Window {
		__remoteApiInvokeAction?: (data: ActionData & { action: string }) => Promise<unknown>;
	}
}

const stateUpdateInt = 250;
const settingsCheckInt = 2000;

export const { trace } = Tracer("[Remote API]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./Settings";

const updateMediaFields = async (item: MediaItem | undefined) => {
	if (!item) return;

	const [album, artist, coverUrl, isrc] = await Promise.all([item.album(), item.artist(), item.coverUrl(), item.isrc()]);

	updateFields({
		album: album?.tidalAlbum,
		artist: artist?.tidalArtist,
		track: item.tidalItem,
		coverUrl,
		isrc,
		duration: item.duration,
		bestQuality: item.bestQuality,
	});
};

const updateStateFields = () => {
	const { playing, playTime, repeatMode, lastPlayStart, playQueue, shuffle, currentTime } = PlayState;
	const { playbackControls } = redux.store.getState();

	const state: Record<string, unknown> = { playing, playTime, repeatMode, playQueue, shuffle };

	if (!Number.isNaN(currentTime)) state.currentTime = currentTime;
	if (lastPlayStart && !Number.isNaN(lastPlayStart)) state.lastPlayStart = lastPlayStart;
	if (playbackControls.volume !== undefined) state.volume = playbackControls.volume;

	updateFields(state);
};

const setVolume = (volume: number) => {
	redux.actions["playbackControls/SET_VOLUME"]({ volume });
};

const handleVolumeChange = (volume: string | number) => {
	if (typeof volume === "string" && /^[-+]\d+$/.test(volume)) {
		const currentVol = reduxStore.getState().playbackControls.volume || 0;
		const newVol = Math.max(0, Math.min(100, currentVol + Number.parseInt(volume, 10)));
		setVolume(newVol);
	} else if (typeof volume === "number" && volume >= 0 && volume <= 100) {
		setVolume(volume);
	}
};

const addToQueue = (itemId: string) => {
	redux.actions["playQueue/ADD_LAST"]({
		context: { type: "UNKNOWN", id: itemId },
		mediaItemIds: [itemId],
	});
};

const rendererActions: Record<string, (data: ActionData) => unknown> = {
	pause: () => PlayState.pause(),
	resume: () => PlayState.play(),
	toggle: () => (PlayState.playing ? PlayState.pause() : PlayState.play()),
	next: () => PlayState.next(),
	previous: () => PlayState.previous(),
	setRepeatMode: (data) => typeof data.mode === "number" && PlayState.setRepeatMode(data.mode),
	setShuffleMode: (data) => {
		if (data.shuffle === true) PlayState.setShuffle(true, true);
		else if (data.shuffle === false) PlayState.setShuffle(false, true);
	},
	seek: (data) => typeof data.time === "number" && PlayState.seek(data.time),
	volume: (data) => handleVolumeChange(data.volume as string | number),
	playNext: (data) => data.itemId && PlayState.playNext(data.itemId as string),
	addToQueue: (data) => data.itemId && addToQueue(data.itemId as string),
};

const serverOptions = (): ServerOptions => ({
	port: settings.port,
	host: settings.allowLan ? "0.0.0.0" : "127.0.0.1",
	token: settings.token,
});
const sameOptions = (a: ServerOptions, b: ServerOptions) => a.port === b.port && a.host === b.host && a.token === b.token;

let running = serverOptions();
startServer(running).catch(trace.msg.err.withContext("Failed to start the API server"));
unloads.add(() => void stopServer());

// Restart the server when the port, network access or token changes in the settings
safeInterval(
	unloads,
	() => {
		const next = serverOptions();
		if (sameOptions(next, running)) return;
		running = next;
		startServer(next)
			.then(() => trace.msg.log(`API listening on ${next.host}:${next.port}`))
			.catch(trace.msg.err.withContext("Failed to restart the API server"));
	},
	settingsCheckInt,
);

MediaItem.fromPlaybackContext().then(updateMediaFields);
MediaItem.onMediaTransition(unloads, updateMediaFields);
PlayState.onState(unloads, updateStateFields);
safeInterval(unloads, updateStateFields, stateUpdateInt);

window.__remoteApiInvokeAction = async (data: ActionData & { action: string }) => {
	const handler = rendererActions[data.action];
	// Rejecting makes executeJavaScript fail, so the client gets an error instead of "ok"
	if (!handler) throw new Error(`Unknown action "${data.action}"`);
	const result = await handler(data);
	updateStateFields();
	return result;
};
unloads.add(() => {
	delete window.__remoteApiInvokeAction;
});

ipcRenderer.on(unloads, "remoteApi.playback.control", async (data) => {
	rendererActions[data.action]?.(data);
	updateStateFields();
});

/**
 * Register a new action handler for the API.
 * @param unloadsFn - Your plugin unloads set
 * @param name - The action name (used in HTTP/WebSocket requests)
 * @param handler - The function to execute when the action is triggered
 * @returns A function to unregister the action (it is also added to unloadsFn)
 */
export const registerAction = (unloadsFn: Set<LunaUnload>, name: string, handler: ActionHandler) => {
	if (rendererActions[name]) trace.msg.warn(`Action "${name}" already exists, overwriting`);
	let registered = true;
	rendererActions[name] = handler;
	const unregister = () => {
		if (registered) {
			registered = false;
			delete rendererActions[name];
		}
	};
	unloadsFn.add(unregister);
	unloads.add(unregister);
	return unregister;
};

export type { ActionData, ActionHandler } from "./types";
export { updateFields as updateAPIFields };
