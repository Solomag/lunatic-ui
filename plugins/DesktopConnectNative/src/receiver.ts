import { type LunaUnload, Tracer, unloadSet } from "@luna/core";
import { ipcRenderer, MediaItem, PlayState, redux } from "@luna/lib";

import type { PlayerCommand, PlayerState } from "./connect/ConnectReceiver";
import { playerEvent, startReceiver, stopReceiver } from "./receiver.native";

const { trace } = Tracer("[DesktopConnectNative]");

// TIDAL's desktop server key (base64 of the PEM), set at build time from the TIDAL_SERVER_KEY_PEM environment variable (esbuild.config.ts), empty without it
declare const __TIDAL_SERVER_KEY_BASE64__: string;

// Same as in receiver.native.ts
const receiverChannel = "desktopConnectNative.receiver";
// Loading a video can take over 5s
const loadTimeoutMs = 10000;
// The desktop's previous starts the track again after this many seconds of it
const restartAfterS = 3;

// Resolves undefined after the timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) => {
	let timeout: number | undefined;
	const timedOut = new Promise<undefined>((resolve) => {
		timeout = window.setTimeout(resolve, timeoutMs);
	});
	return Promise.race([promise, timedOut]).finally(() => clearTimeout(timeout));
};
// Resolves with the next (matching) payload of the action, or undefined after a timeout
const nextAction = <T extends redux.ActionType>(
	actionType: T,
	timeoutMs: number,
	matches: (payload: redux.InterceptPayload<T>) => boolean = () => true,
) => {
	const waitUnloads = new Set<LunaUnload>();
	const action = new Promise<redux.InterceptPayload<T>>((resolve) => {
		redux.intercept(actionType, waitUnloads, (payload) => {
			if (matches(payload)) resolve(payload);
		});
	});
	return withTimeout(action, timeoutMs).finally(() => unloadSet(waitUnloads));
};
const currentElement = () => PlayState.playQueue.elements[PlayState.playQueue.currentIndex];

// The own TIDAL Connect receiver (receiver.native.ts) owns the phone's queue and session,
// TIDAL's player here plays what it says and reports back. Returns false when it could not start (no key)
export const startOwnReceiver = async (unloads: Set<LunaUnload>) => {
	// While the phone controls the player
	const sessionUnloads = new Set<LunaUnload>();
	let unloaded = false;
	// Registered before the start: an unload while it starts stops it once started (the native side runs them in order)
	unloads.add(() => {
		unloaded = true;
		unloadSet(sessionUnloads);
		stopReceiver().catch(trace.err.withContext("stop receiver"));
	});
	const started = await startReceiver(__TIDAL_SERVER_KEY_BASE64__).catch(trace.err.withContext("start receiver"));
	if (started === undefined) return false;
	if (unloaded) return true;
	trace.log(`TIDAL Connect receiver on port ${started.port}`);

	// Commands come in bursts (load, seek, play) and loading is async, so run them one after another
	let commands: Promise<unknown> = Promise.resolve();
	ipcRenderer.on(unloads, receiverChannel, (command: PlayerCommand) => {
		commands = commands.then(() => (unloaded ? undefined : run(command))).catch(trace.err.withContext(`receiver ${command.type}`));
	});

	// Set while the phone's media is loaded but not started or paused: TIDAL reports STALLED then, which is paused for the phone
	let paused = false;
	// While the phone's media loads: TIDAL passes through idle and paused when the queue is replaced, the phone sees buffering
	let loading = false;
	// Set when the phone's media could not be loaded, so its seek and play do not apply to the previous track
	let loadFailed = false;
	// The phone's media in TIDAL's queue, a load of the same media (repeat one) starts it again instead of reloading it
	let loaded: { mediaId: string; uid: string } | undefined;
	// The phone's element in TIDAL's queue, also after it ended: a resumed session finds out whether the desktop played something else meanwhile
	let phoneUid: string | undefined;
	// Seconds into the phone's media, as reported to the phone
	let positionS = 0;
	const progress = (seconds: number, seeked = false) => {
		if (!Number.isFinite(seconds)) return;
		// Not the phone's media playing (it was not loaded): the phone's position stays for a play to load it at.
		// While it loads a late position is the previous media's
		if (loadFailed || loading) return;
		positionS = seconds;
		playerEvent({ type: "progress", positionMs: seconds * 1000, seeked });
	};
	// TIDAL ignores a seek on a video it has not started yet (it loads it again on play and starts from the beginning),
	// and sometimes does the same for a track loaded right after a video, so the phone's seek is applied again once it plays
	let unstarted = false;
	let phoneSeek: number | undefined;
	// TIDAL ignores a pause until it really started playing, so a pause sent while it starts is applied again once it plays
	let pauseWhenPlaying = false;
	// Set while the media playing is a video (TIDAL also has other video elements, animated covers)
	let playingVideo = false;
	// The phone's media TIDAL's player ended: the player is left ended, a play loads it again (at a seek made meanwhile)
	let current: { mediaId: string; mediaType: number } | undefined;
	let ended: { mediaId: string; mediaType: number; seek?: number } | undefined;
	// TIDAL's element left when the phone's media ended or failed to load: the desktop's play of it goes through the receiver.
	// Unset when the phone stops (the desktop's play is its own then), another element is the desktop's own
	let routedUid: string | undefined;
	// While the phone controls the player TIDAL's own repeat stays off (repeat is the receiver's, its queue),
	// the desktop's repeat mode is kept here (also one the desktop user picks meanwhile) and set again when the phone lets go
	let desktopRepeatMode: redux.RepeatMode = redux.RepeatMode.Off;
	// Not seen by the intercept below (luna's actions skip intercepts), only TIDAL's own are
	const setRepeatMode = (repeatMode: redux.RepeatMode) => redux.actions["playQueue/SET_REPEAT_MODE"](repeatMode);

	const run = async (command: PlayerCommand) => {
		switch (command.type) {
			case "load":
				return load(command.mediaId, command.mediaType, command.autoplay, false, command.positionMs / 1000);
			case "play":
				return play();
			case "stop":
				// The phone let go of its media: the desktop's seek and play of it are TIDAL's own, also once it ended again
				routedUid = ended = current = undefined;
				loadFailed = false;
				return pause();
			case "pause":
				return pause();
			case "seek":
				return seek(command.positionMs / 1000);
			case "volume":
				return redux.actions["playbackControls/SET_VOLUME"]({ volume: Math.min(Math.max(command.level, 0) * 100, 100) });
			case "mute":
				return redux.actions["playbackControls/SET_MUTE"](command.mute);
			case "release":
				pauseWhenPlaying = false;
				return unloadSet(sessionUnloads);
			case "attach":
				return resume(command.mediaId, command.mediaType, command.positionMs);
		}
	};

	const play = () => {
		// Not loaded (a timeout, the network was gone), a play tries again
		if (loadFailed) {
			if (current === undefined) return;
			// Where the phone is: a resumed position, or its seeks meanwhile
			return load(current.mediaId, current.mediaType, true, false, positionS);
		}
		if (ended !== undefined) {
			const { mediaId, mediaType, seek: time } = ended;
			return load(mediaId, mediaType, true, false, time);
		}
		paused = false;
		pauseWhenPlaying = false;
		// TIDAL's desired state, it may not be playing yet
		if (!PlayState.playing) PlayState.play();
	};
	// A starting video may start more than once (TIDAL reports PLAYING, then loads it again), so the pause holds
	// until a play (also on the desktop) or for as long as a load may take
	let pauseTimeout: number | undefined;
	const pause = () => {
		paused = true;
		pauseWhenPlaying = true;
		clearTimeout(pauseTimeout);
		pauseTimeout = window.setTimeout(() => (pauseWhenPlaying = false), loadTimeoutMs);
		PlayState.pause();
	};
	const seek = (time: number) => {
		// Not loaded: kept for when a play loads it again
		if (loadFailed) {
			positionS = time;
			return;
		}
		if (ended !== undefined) {
			ended.seek = time;
			return;
		}
		if (unstarted) phoneSeek = time;
		// Still starting, TIDAL may reset it to the beginning: this seek replaces the one waiting
		else if (stopPendingSeek !== undefined) seekWhenPlaying(time);
		positionS = time;
		PlayState.seek(time);
	};

	// resumed: loaded again for a resumed session, a failure does not skip it (it played before, the network may just be back).
	// at: where it starts, sought before the play (TIDAL may start a video at once, a seek after that is ignored)
	const load = async (mediaId: string, mediaType: number, autoplay: boolean, resumed = false, at = 0) => {
		stopPendingSeek?.();
		ended = undefined;
		current = { mediaId, mediaType };
		positionS = 0;
		// Repeat one or the phone selecting the item playing: replacing the queue with the same item may keep TIDAL's old position
		if (!loadFailed && loaded?.mediaId === mediaId && currentElement()?.uid === loaded.uid) {
			attach();
			// From the start, not where the phone's earlier seek waits for it to start (a seek after this load still waits)
			phoneSeek = undefined;
			PlayState.seek(0);
			if (at > 0) seek(at);
			if (autoplay) play();
			else {
				pause();
				// TIDAL was paused already and reports nothing, the phone waits in buffering
				playerEvent({ type: "state", state: "PAUSED" });
			}
			return;
		}
		// Null when TIDAL does not have it, undefined after a timeout or a failed request
		const lookup = MediaItem.fromId(mediaId, mediaType === 1 ? "video" : "track").then(
			(item) => item ?? null,
			(err) => {
				trace.err.withContext("load media")(err);
				return undefined;
			},
		);
		const mediaItem = await withTimeout(lookup, loadTimeoutMs);
		loadFailed = !mediaItem;
		loaded = phoneUid = undefined;
		if (!mediaItem) {
			routedUid = currentElement()?.uid;
			// Where a play loads it again
			positionS = at > 0 ? at : 0;
			// What plays is not the phone's media: the previous one of the phone's, or the desktop's own after a resumed session
			if (!resumed) PlayState.pause();
			const unavailable = mediaItem === null && !resumed;
			playerEvent({ type: "error", message: `Media ${mediaId} ${mediaItem === null ? "not found" : "could not be loaded"}`, unavailable });
			return;
		}
		attach();
		paused = !autoplay;
		unstarted = true;
		phoneSeek = undefined;
		loading = true;
		const transition = nextAction(
			"playbackControls/MEDIA_PRODUCT_TRANSITION",
			loadTimeoutMs,
			({ mediaProduct }) => mediaProduct.referenceId !== undefined && mediaProduct.referenceId === currentElement()?.uid,
		);
		// Only the phone's item in the queue, otherwise TIDAL moves on to its own next item when the track ends (without ENDED).
		// Clearing the queue resets the repeat mode, set it off again (attach kept the desktop's)
		redux.actions["playQueue/CLEAR_QUEUE"]();
		setRepeatMode(redux.RepeatMode.Off);
		redux.actions["playQueue/ADD_NEXT"]({ context: { type: "UNKNOWN" }, mediaItemIds: [mediaItem.tidalItem?.id ?? mediaItem.id] });
		// A slow switch still counts as loaded, the phone's commands after it must not wait forever
		await transition;
		loading = false;
		const uid = currentElement()?.uid;
		if (uid !== undefined) loaded = { mediaId, uid };
		phoneUid = uid;
		if (at > 0) seek(at);
		if (autoplay) play();
		// Not started, tell the phone it is ready (TIDAL reported it while loading)
		else playerEvent({ type: "state", state: "PAUSED" });
	};

	// A resumed session follows the phone again. When the desktop played something else meanwhile,
	// the phone's media is loaded again (paused where it was), the desktop's track is not taken for it
	const resume = async (mediaId: string, mediaType: number, positionMs: number) => {
		if (phoneUid !== undefined && currentElement()?.uid === phoneUid) {
			attach();
			// The phone was told buffering until the player says what it does
			playerEvent({ type: "state", state: ended === undefined && PlayState.playing ? "PLAYING" : "PAUSED" });
			return;
		}
		await load(mediaId, mediaType, false, true, positionMs / 1000);
	};

	// Only one seek waits, a newer one or a new load replaces it
	let stopPendingSeek: (() => void) | undefined;
	// The position a starting track must not go back before
	let trackSeek: number | undefined;
	const seekWhenPlaying = (time: number) => {
		stopPendingSeek?.();
		const waitUnloads = new Set<LunaUnload>();
		if (playingVideo) {
			// TIDAL reports PLAYING before the video element starts and then starts it from the beginning, so seek once the element plays
			const onPlaying = ({ target }: Event) => {
				if (!(target instanceof HTMLVideoElement) || !playingVideo) return;
				stop();
				PlayState.seek(time);
			};
			// Media events don't bubble, capture them on the document
			document.addEventListener("playing", onPlaying, true);
			waitUnloads.add(() => document.removeEventListener("playing", onPlaying, true));
		} else {
			// A track TIDAL loads again on play starts from the beginning (sometimes more than once),
			// so while it starts seek again whenever it is back before the phone's position
			trackSeek = time;
			let seekedAt = 0;
			let reached = false;
			ipcRenderer.on(waitUnloads, "client.playback.playersignal", ({ time: position }: { time?: number }) => {
				// The position is NaN until the track really started.
				// Far past it is not where it plays from (a late one of the previous track), a newer seek replaces or cancels this
				if (trackSeek === undefined || typeof position !== "number" || !Number.isFinite(position) || position > trackSeek + 5) return;
				if (position >= trackSeek - 2) {
					reached = true;
					trackSeek = Math.max(trackSeek, position);
				} else if (Date.now() - seekedAt > 1000) {
					seekedAt = Date.now();
					PlayState.seek(trackSeek);
				}
			});
			// Switching again after it played from there is the next play of it (repeat one) or another item, not a reset
			redux.intercept("playbackControls/MEDIA_PRODUCT_TRANSITION", waitUnloads, () => {
				if (reached) stop();
			});
			waitUnloads.add(() => (trackSeek = undefined));
		}
		const timeout = window.setTimeout(() => stop(), loadTimeoutMs);
		const stop = () => {
			clearTimeout(timeout);
			unloadSet(waitUnloads);
			sessionUnloads.delete(stop);
			if (stopPendingSeek === stop) stopPendingSeek = undefined;
		};
		stopPendingSeek = stop;
		sessionUnloads.add(stop);
	};

	// Follow the phone: report what the player does, and keep TIDAL from moving on by itself
	const attach = () => {
		if (sessionUnloads.size !== 0) return;
		// Also after a resumed session (no load follows), TIDAL repeating the track by itself would skip the phone's queue
		desktopRepeatMode = PlayState.repeatMode;
		redux.intercept("playQueue/SET_REPEAT_MODE", sessionUnloads, (repeatMode) => {
			// The desktop user's choice, for when the phone lets go. TIDAL's button goes on from the mode it shows (off to all),
			// so that one goes round here (off, all, one); another mode (TIDAL setting it off itself) is taken as it is
			desktopRepeatMode = repeatMode === redux.RepeatMode.All ? (((desktopRepeatMode + 1) % 3) as redux.RepeatMode) : repeatMode;
			return true;
		});
		sessionUnloads.add(() => setRepeatMode(desktopRepeatMode));
		setRepeatMode(redux.RepeatMode.Off);
		const states: Partial<Record<redux.PlaybackState, PlayerState>> = {
			IDLE: "IDLE",
			NOT_PLAYING: "PAUSED",
			PLAYING: "PLAYING",
			STALLED: "BUFFERING",
		};
		redux.intercept("playbackControls/SET_PLAYBACK_STATE", sessionUnloads, (state) => {
			if (state === "PLAYING" && pauseWhenPlaying && !loading) {
				// TIDAL ignored the phone's pause while starting
				PlayState.pause();
				return;
			}
			if (state === "PLAYING") {
				paused = false;
				if (unstarted && !loading) {
					const time = phoneSeek;
					unstarted = false;
					phoneSeek = undefined;
					if (time !== undefined) seekWhenPlaying(time);
				}
			}
			if (loading) return;
			const playerState = state === "STALLED" && paused ? "PAUSED" : states[state];
			if (playerState !== undefined) playerEvent({ type: "state", state: playerState });
		});
		// A play from anywhere (also on the desktop) is newer than the phone's pause
		redux.intercept("playbackControls/PLAY", sessionUnloads, () => {
			// The phone's media ended or was not loaded: TIDAL would play its own (the ended one from the start, or the previous one)
			// without the phone knowing, the receiver plays it like the phone's play. Not a play of what the desktop picked itself
			if ((ended !== undefined || loadFailed) && routedUid !== undefined && currentElement()?.uid === routedUid) {
				playerEvent({ type: "play" });
				return true;
			}
			paused = false;
			pauseWhenPlaying = false;
		});
		redux.intercept("playbackControls/PAUSE", sessionUnloads, () => {
			paused = true;
		});
		// Not every player signal has a time
		ipcRenderer.on(sessionUnloads, "client.playback.playersignal", ({ time }: { time?: number }) => {
			// Not the start TIDAL loads it at before the phone's seek is applied
			if (typeof time === "number" && Number.isFinite(time) && (trackSeek === undefined || time >= trackSeek - 2)) progress(time);
		});
		// TIDAL sends no player signal for videos, their progress comes from the video element (media events don't bubble)
		redux.intercept("playbackControls/MEDIA_PRODUCT_TRANSITION", sessionUnloads, ({ mediaProduct }) => {
			playingVideo = mediaProduct.productType === "video";
			// The desktop user played their own album or track (TIDAL's queue replaced, not by a load here):
			// it is not the phone's media, the phone is told it stopped and the player is let go (TIDAL's own next, end and repeat)
			const phoneElement = phoneUid ?? routedUid;
			const { referenceId } = mediaProduct;
			if (!loading && phoneElement !== undefined && referenceId !== undefined && referenceId !== phoneElement) {
				stopPendingSeek?.();
				// TIDAL keeps a seek made before a track started for whatever starts next: the phone's start position, not the desktop's
				if (unstarted) PlayState.seek(0);
				// Told once (the release follows). Until it does the phone's waiting seek and held pause must not apply to the desktop's media
				routedUid = ended = current = phoneUid = loaded = phoneSeek = undefined;
				loadFailed = unstarted = paused = pauseWhenPlaying = false;
				clearTimeout(pauseTimeout);
				playerEvent({ type: "takenOver" });
			}
		});
		const onVideoTime = ({ target }: Event) => {
			if (!(target instanceof HTMLVideoElement) || !playingVideo || unstarted || stopPendingSeek !== undefined) return;
			progress(target.currentTime);
		};
		document.addEventListener("timeupdate", onVideoTime, true);
		sessionUnloads.add(() => document.removeEventListener("timeupdate", onVideoTime, true));
		// The video element starts again after TIDAL reported PLAYING, the phone's pause must still hold
		const onVideoPlaying = ({ target }: Event) => {
			if (target instanceof HTMLVideoElement && playingVideo && pauseWhenPlaying && !loading) PlayState.pause();
		};
		document.addEventListener("playing", onVideoPlaying, true);
		sessionUnloads.add(() => document.removeEventListener("playing", onVideoPlaying, true));
		// The receiver picks what comes next from the phone's queue
		redux.intercept("playbackControls/ENDED", sessionUnloads, ({ reason }) => {
			if (reason === "completed") {
				// TIDAL's player is left ended (the action is cancelled) and does not play it again after a seek,
				// repeat one loads it again
				loaded = undefined;
				ended = current && { ...current };
				routedUid = currentElement()?.uid;
				playerEvent({ type: "ended" });
			}
			return true;
		});
		redux.intercept("playbackControls/SKIP_NEXT", sessionUnloads, () => {
			playerEvent({ type: "next" });
			return true;
		});
		// A seek on the desktop (also back/forward and previous, which restarts the track) is newer than the phone's
		// Not started yet: the desktop's seek replaces the phone's one applied on play
		redux.intercept("playbackControls/SEEK", sessionUnloads, (time) => {
			stopPendingSeek?.();
			if (unstarted) phoneSeek = time;
			// Ended: where a play loads it again, like the phone's seek
			if (ended !== undefined) ended.seek = time;
			// Also paused (TIDAL reports no position then)
			else progress(time, true);
		});
		// The player's position once it moved, while paused (playing, its signals tell it; before it started it is not the phone's media's).
		// TIDAL's state, PlayState.currentTime keeps reading the first player (a track's after a video)
		let seekedTimeout: number | undefined;
		sessionUnloads.add(() => clearTimeout(seekedTimeout));
		for (const action of ["playbackControls/SEEK_BACKWARDS", "playbackControls/SEEK_FORWARDS"] as const)
			redux.intercept(action, sessionUnloads, () => {
				stopPendingSeek?.();
				if (unstarted) phoneSeek = undefined;
				clearTimeout(seekedTimeout);
				seekedTimeout = window.setTimeout(() => {
					const { latestCurrentTime, playbackState } = PlayState.playbackControls;
					if (ended === undefined && !unstarted && playbackState !== "PLAYING") progress(latestCurrentTime, true);
				}, 500);
			});
		redux.intercept("playbackControls/SKIP_PREVIOUS", sessionUnloads, () => {
			stopPendingSeek?.();
			// Like TIDAL's own button: a track a few seconds in starts again (the phone's seek waiting for the start too)
			if (ended === undefined && !loadFailed && positionS > restartAfterS) {
				seek(0);
				progress(0, true);
			} else playerEvent({ type: "previous" });
			return true;
		});
	};

	return true;
};
