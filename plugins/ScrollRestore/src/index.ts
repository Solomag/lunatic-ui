import type { LunaUnload } from "@luna/core";
import { redux } from "@luna/lib";

export const unloads = new Set<LunaUnload>();

// How many pages to remember
const MAX_POSITIONS = 200;
// Scroll events this long after a wheel/key input are counted as the user scrolling
const INPUT_WINDOW_MS = 600;
// Give up restoring after this long
const RESTORE_TIMEOUT_MS = 60_000;
// Keep the position applied this long after the page rendered, Tidal sets its own position while rendering
const SETTLE_MS = 1000;
// If nothing on the page changed within this time it is treated as rendered
const RENDER_FALLBACK_MS = 1000;
// Stop loading more items when the list has not grown for this long
const STALL_MS = 4000;

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

const positions = new Map<string, number>();
// Key of the current route, taken from router/NAVIGATED as Tidal rewrites some urls in place (/artist/1 to /artist/name/1)
let routeKey = location.pathname + location.search;
const getMain = () => document.querySelector<HTMLElement>("main#main");
// main and its scrollbars (OverlayScrollbars, next to main)
const inMainArea = (target: EventTarget | null) => {
	const area = getMain()?.parentElement;
	return target instanceof Node && area?.contains(target) === true;
};

let lastInput = 0;
let draggingScrollbar = false;
let restoring: (() => void) | undefined;

const savePosition = (key: string, top: number) => {
	positions.delete(key);
	if (top <= 0) return;
	positions.set(key, top);
	if (positions.size > MAX_POSITIONS) positions.delete(positions.keys().next().value!);
};

// Only positions the user scrolled to are saved, Tidal clamps and resets the scroll position while swapping pages
const onScroll = (event: Event) => {
	const main = getMain();
	if (main === null || event.target !== main || restoring !== undefined) return;
	if (draggingScrollbar || performance.now() - lastInput < INPUT_WINDOW_MS) savePosition(routeKey, main.scrollTop);
};

const onUserInput = () => {
	lastInput = performance.now();
	restoring?.();
};
const onWheel = (event: WheelEvent) => {
	if (inMainArea(event.target)) onUserInput();
};
const onKeyDown = (event: KeyboardEvent) => {
	if (!SCROLL_KEYS.has(event.key)) return;
	const target = event.target;
	if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select"))) return;
	onUserInput();
};
const onPointerDown = (event: PointerEvent) => {
	const { target } = event;
	if (!inMainArea(target)) return;
	if (target === getMain() || (target instanceof Element && target.closest(".os-scrollbar") !== null)) draggingScrollbar = true;
	onUserInput();
};
const onPointerUp = () => (draggingScrollbar = false);

const listen = <K extends keyof DocumentEventMap>(type: K, listener: (event: DocumentEventMap[K]) => unknown) => {
	const options = { capture: true, passive: true };
	document.addEventListener(type, listener, options);
	unloads.add(() => document.removeEventListener(type, listener, options));
};
listen("scroll", onScroll);
listen("wheel", onWheel);
listen("keydown", onKeyDown);
listen("pointerdown", onPointerDown);
listen("pointerup", onPointerUp);
listen("pointercancel", onPointerUp);

// Tidal swaps the page container in main when another kind of page renders.
// When following a link this happens before router/NAVIGATED (in the same task or an earlier one), when navigating through redux after it.
let pageAddedAt = 0;
let pageAddedUrl = "";
let navigatedAt = 0;
const addsPage = (mutations: MutationRecord[]) => mutations.some(({ addedNodes }) => addedNodes.length !== 0);
const pageObserver = new MutationObserver((mutations) => {
	if (!addsPage(mutations)) return;
	pageAddedAt = performance.now();
	pageAddedUrl = location.href;
});
unloads.add(() => pageObserver.disconnect());
let observedMain: HTMLElement | null = null;
const observeMain = () => {
	const main = getMain();
	if (main === observedMain) return main;
	pageObserver.disconnect();
	if (main !== null) pageObserver.observe(main, { childList: true });
	return (observedMain = main);
};
observeMain();

const restore = (main: HTMLElement, key: string, target: number, rendered: boolean) => {
	const start = performance.now();
	const startHeight = main.scrollHeight;
	let renderedAt = rendered ? start : undefined;
	let appliedAt = start;
	let lastHeight = 0;
	let grewAt = start;

	let frame = 0;
	const stop = () => {
		cancelAnimationFrame(frame);
		if (restoring === stop) restoring = undefined;
	};
	// Runs every frame right before it is painted, so the new page is not shown at the wrong position
	const step = () => {
		frame = requestAnimationFrame(step);
		const now = performance.now();
		if (!main.isConnected || routeKey !== key || now - start > RESTORE_TIMEOUT_MS) return stop();

		// The same kind of page (e.g. playlist to playlist) keeps its container and only changes its content
		const changed = pageAddedAt >= start || main.scrollHeight !== startHeight;
		if (renderedAt === undefined && (changed || now - start > RENDER_FALLBACK_MS)) renderedAt = grewAt = now;
		// The previous page is still shown
		if (renderedAt === undefined) return;
		if (main.scrollHeight !== lastHeight) {
			lastHeight = main.scrollHeight;
			grewAt = now;
		}

		const maxTop = main.scrollHeight - main.clientHeight;
		if (maxTop >= target) {
			if (Math.abs(main.scrollTop - target) > 1) {
				main.scrollTop = target;
				appliedAt = now;
			} else if (now - Math.max(appliedAt, renderedAt, pageAddedAt) >= SETTLE_MS) stop();
			return;
		}
		// Not enough items loaded yet, scroll to the end so the list loads more
		main.scrollTop = maxTop;
		if (now - grewAt > STALL_MS) stop();
	};
	frame = requestAnimationFrame(step);
	return stop;
};

redux.intercept("router/NAVIGATED", unloads, ({ path, search }) => {
	restoring?.();
	const main = observeMain();
	// Pending records mean the new page was added in this same task
	const rendered = addsPage(pageObserver.takeRecords()) || (pageAddedUrl === location.href && pageAddedAt > navigatedAt);
	navigatedAt = performance.now();
	routeKey = path + search;
	const target = positions.get(routeKey);
	if (main !== null && target !== undefined) restoring = restore(main, routeKey, target, rendered);
});
unloads.add(() => restoring?.());
