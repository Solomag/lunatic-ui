/** Dynamic footer-player clearance tracking, independent from Settings rendering. */

/* The TIDAL footer player is a fixed overlay. Reserve exactly the part of the
   viewport it obstructs instead of assuming a stock player height: themes may
   resize, translate, hide, remove, or later restore the bar. */
const PLAYBAR_SELECTOR = '#footerPlayer, [data-test="footer-player"]';
const PLAYBAR_GAP = 12;
const PLAYBAR_CLEARANCE_VAR = "--lunatic-playbar-clearance";
const PLAYBAR_POLL_MS = 2000;

let observedPlayBar: HTMLElement | null = null;
let playBarResizeObserver: ResizeObserver | null = null;
let playBarAttributeObserver: MutationObserver | null = null;
let playBarPollTimer: number | null = null;
let playBarFrame: number | null = null;

function visiblePlayBarClearance(player: HTMLElement | null) {
  if (!player || !player.isConnected) return 0;

  const style = getComputedStyle(player);
  if (
    player.getAttribute("aria-hidden") === "true" ||
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse"
  ) return 0;

  const rect = player.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || rect.top >= window.innerHeight) return 0;

  const obstruction = Math.max(0, Math.min(window.innerHeight, window.innerHeight - rect.top));
  return obstruction > 0 ? Math.ceil(obstruction + PLAYBAR_GAP) : 0;
}

function applyPlayBarClearance() {
  playBarFrame = null;

  const clearance = visiblePlayBarClearance(observedPlayBar);
  document.documentElement.style.setProperty(
    PLAYBAR_CLEARANCE_VAR,
    `${clearance}px`,
    "important",
  );
}

export function queuePlayBarClearance() {
  if (playBarFrame !== null) return;
  playBarFrame = window.requestAnimationFrame(applyPlayBarClearance);
}

function unbindObservedPlayBar() {
  playBarResizeObserver?.disconnect();
  playBarResizeObserver = null;
  playBarAttributeObserver?.disconnect();
  playBarAttributeObserver = null;
  observedPlayBar = null;
}

function bindPlayBar() {
  const next = document.querySelector<HTMLElement>(PLAYBAR_SELECTOR);
  if (next === observedPlayBar) {
    queuePlayBarClearance();
    return;
  }

  unbindObservedPlayBar();
  observedPlayBar = next;

  if (next) {
    playBarResizeObserver = new ResizeObserver(() => {
      queuePlayBarClearance();
    });
    playBarResizeObserver.observe(next);

    playBarAttributeObserver = new MutationObserver(() => {
      queuePlayBarClearance();
    });
    playBarAttributeObserver.observe(next, {
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
    });
  }

  queuePlayBarClearance();
}

function pollPlayBar() {
  bindPlayBar();
}

export function installPlayBarClearanceTracking() {
  uninstallPlayBarClearanceTracking();
  bindPlayBar();

  /* Do not observe the entire TIDAL DOM. The old implementation received a
     callback for every subtree child-list mutation for the whole lifetime of
     the app. A small periodic health check is enough to detect replacement,
     removal and theme-driven transforms while ResizeObserver/attribute
     observation still handle changes to the live player immediately. */
  playBarPollTimer = window.setInterval(pollPlayBar, PLAYBAR_POLL_MS);
}

export function uninstallPlayBarClearanceTracking() {
  if (playBarPollTimer !== null) {
    window.clearInterval(playBarPollTimer);
    playBarPollTimer = null;
  }

  unbindObservedPlayBar();

  if (playBarFrame !== null) {
    window.cancelAnimationFrame(playBarFrame);
    playBarFrame = null;
  }

  document.documentElement.style.removeProperty(PLAYBAR_CLEARANCE_VAR);
}
