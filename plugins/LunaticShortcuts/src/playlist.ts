import type { LunaUnloads, Tracer } from "@luna/core";
import * as lib from "@luna/lib";

// Luna's playlist editing API (`Playlist` in @luna/lib, TidaLuna#233). Typed here as the published Luna may not have it yet
type ItemRef = { id: string; type: "tracks" | "videos"; meta: { itemId: string } };
/** Removed entries grouped by the entry they were before, as `Playlist.removeItems` returns them */
type RemovedItems = { items: ItemRef[]; before?: string }[];
type EditablePlaylist = {
	readonly canEdit: boolean;
	removeItems(items: ItemRef[]): Promise<RemovedItems>;
	restoreItems(removed: RemovedItems): Promise<void>;
};
type PlaylistApi = {
	readonly currentUUID?: string;
	selection?(): { items: ItemRef[]; clear: () => void } | undefined;
	getItemFromStore(contentType: "playlists", id: string): lib.redux.Playlist | undefined;
	new (uuid: string, tidalPlaylist: lib.redux.Playlist): EditablePlaylist;
	fromId(uuid: string): Promise<EditablePlaylist | undefined>;
};
const Playlist = <PlaylistApi>(<unknown>lib.Playlist);
/** True if the running Luna can edit playlists (`Playlist.selection`, `removeItems`, `restoreItems`) */
export const canEditPlaylists = typeof Playlist.selection === "function" && typeof Playlist.prototype.removeItems === "function";

type Removal = { uuid: string; removed: RemovedItems; restoring: boolean };
const countItems = (removed: RemovedItems) => removed.reduce((sum, { items }) => sum + items.length, 0);
const itemsText = (count: number) => `${count} ${count === 1 ? "item" : "items"}`;

/**
 * Delete removes the tracks/videos selected on the open playlist page (luna-plugins#148), the notification it shows
 * has an Undo button, and Ctrl+Z undoes the last removal while its playlist is open.
 */
export class PlaylistRemoval {
	/** The last removal, for `undo` */
	private lastRemoval?: Removal;
	private removing = false;
	// Entries removed in this session, TIDAL's selection can still hold them until it has reloaded the list
	private readonly removedItemIds = new Set<string>();

	constructor(
		private readonly unloads: LunaUnloads,
		private readonly trace: Tracer,
	) {}

	/**
	 * Remove the tracks/videos selected on the open playlist page, if the user can edit the playlist.
	 * The selection is TIDAL's own, the same its "Remove from playlist" uses, so it is exact for duplicates, sorted or
	 * filtered views and rows scrolled out of view.
	 * @returns `false` if there is nothing to remove here, so the key goes on to TIDAL
	 */
	public removeSelected() {
		const uuid = Playlist.currentUUID;
		if (uuid === undefined) return false;
		const tidalPlaylist = Playlist.getItemFromStore("playlists", uuid);
		if (tidalPlaylist === undefined) return false;
		const playlist = new Playlist(uuid, tidalPlaylist);
		if (!playlist.canEdit) return false;

		const selected = Playlist.selection?.()?.items.filter(({ meta }) => !this.removedItemIds.has(meta.itemId));
		if (selected === undefined || selected.length === 0) return false;
		// Still removing the previous selection, swallow the key rather than remove anything twice
		if (this.removing) return;
		this.removing = true;

		return (async () => {
			let removed: RemovedItems;
			let error: unknown;
			try {
				removed = await playlist.removeItems(selected);
			} catch (err) {
				// Part may have been removed before the error, that part can still be undone
				removed = (<{ removed?: RemovedItems }>err).removed ?? [];
				error = err;
			}
			for (const { items } of removed) for (const { meta } of items) this.removedItemIds.add(meta.itemId);
			const count = countItems(removed);
			if (count > 0) {
				// Clear the removed entries' selection like TIDAL does on its own removal. Only if the selection is still the
				// removed one: a selection made while this ran stays, and on a failure the user can try again
				const current = Playlist.selection?.();
				const currentIds = current?.items.map(({ meta }) => meta.itemId) ?? [];
				const selectedIds = new Set(selected.map(({ meta }) => meta.itemId));
				if (error === undefined && currentIds.length === selectedIds.size && currentIds.every((itemId) => selectedIds.has(itemId))) current!.clear();

				const removal: Removal = { uuid, removed, restoring: false };
				this.lastRemoval = removal;
				const message = `Removed ${itemsText(count)}`;
				// The notification's Undo restores this removal, wherever the user is by then
				this.addNotificationButton(message, "Undo", () => this.restore(removal).catch(this.trace.msg.err.withContext("Undo")));
				this.trace.msg.log(message);
			}
			if (error !== undefined) throw error;
		})().finally(() => (this.removing = false));
	}

	/**
	 * Put back the tracks/videos last removed by `removeSelected`, if their playlist is open.
	 * @returns `false` if there is nothing to undo here, so the key goes on to TIDAL
	 */
	public undo() {
		const last = this.lastRemoval;
		if (last === undefined || last.restoring || last.uuid !== Playlist.currentUUID) return false;
		return this.restore(last);
	}
	private async restore(removal: Removal) {
		if (removal.restoring || removal.removed.length === 0) return;
		removal.restoring = true;
		try {
			const playlist = await Playlist.fromId(removal.uuid);
			if (playlist === undefined) throw new Error(`Playlist ${removal.uuid} not found`);
			const count = countItems(removal.removed);
			await playlist.restoreItems(removal.removed);
			if (this.lastRemoval === removal) this.lastRemoval = undefined;
			this.trace.msg.log(`Restored ${itemsText(count)}`);
		} finally {
			removal.restoring = false;
		}
	}

	/**
	 * Add a button next to the close button of the next TIDAL notification that shows `message`, as TIDAL's notifications
	 * can't have their own buttons. Call it right before the notification is shown.
	 * Clicking the button closes the notification and calls `onClick`.
	 */
	private addNotificationButton(message: string, label: string, onClick: () => unknown, timeoutMs: number = 5000) {
		const selector = `[data-test="notification"]`;
		// Notifications already showing, so an older one with the same message isn't picked
		const shown = new Set(document.querySelectorAll(selector));
		const stop = lib.observe(this.unloads, selector, (notification) => {
			if (shown.has(notification) || !notification.textContent?.includes(message)) return;
			const close = notification.querySelector<HTMLButtonElement>(`[data-test="notification-close"]`);
			if (close === null) return;
			done();
			const button = <HTMLButtonElement>close.cloneNode();
			button.removeAttribute("data-test");
			button.textContent = label;
			button.addEventListener("click", () => {
				close.click();
				onClick();
			});
			close.before(button);
		});
		// Also take the observer's unload back out of the plugin's unloads, it would keep `onClick` alive until it unloads
		const done = () => {
			stop();
			this.unloads.delete(stop);
			clearTimeout(timeout);
		};
		const timeout = setTimeout(done, timeoutMs);
	}
}
