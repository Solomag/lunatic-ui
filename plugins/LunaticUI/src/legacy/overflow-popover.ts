const POPOVER_ID = "lunatic-plugin-store-description-popover";

let hideTimer: number | null = null;
let showFrame: number | null = null;
let activeDescription: HTMLElement | null = null;
let listenerSignal: AbortSignal | undefined;

function elementIsTruncated(el: HTMLElement) {
  return (
    el.scrollHeight > el.clientHeight + 1 ||
    el.scrollWidth > el.clientWidth + 1
  );
}

function getPopover() {
  let el = document.getElementById(POPOVER_ID);
  if (el) return el;

  el = document.createElement("div");
  el.id = POPOVER_ID;
  el.hidden = true;
  document.body.appendChild(el);

  el.addEventListener("pointerenter", () => {
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    hideTimer = null;
  }, listenerSignal ? { signal: listenerSignal } : undefined);

  el.addEventListener(
    "pointerleave",
    scheduleHidePopover,
    listenerSignal ? { signal: listenerSignal } : undefined,
  );
  return el;
}

function positionPopover(anchor: HTMLElement, popover: HTMLElement) {
  const container =
    anchor.closest<HTMLElement>('[data-lunatic-plugin-card="true"]') ??
    anchor.closest<HTMLElement>('[data-lunatic-plugin-store="true"]') ??
    anchor.closest<HTMLElement>('[data-lunatic-installed-plugin="true"]');

  const ar = anchor.getBoundingClientRect();
  const cr = container?.getBoundingClientRect() ?? ar;
  const pad = 12;
  const gap = 5;
  const available = Math.max(220, cr.width - 40);
  const width = Math.max(220, Math.min(available, window.innerWidth - pad * 2));
  const left = Math.max(pad, Math.min(ar.left, window.innerWidth - width - pad));

  popover.style.width = `${width}px`;
  popover.style.left = `${left}px`;
  popover.style.top = `${ar.bottom + gap}px`;

  const pr = popover.getBoundingClientRect();
  if (pr.bottom > window.innerHeight - pad) {
    popover.style.top = `${Math.max(pad, ar.top - gap - Math.min(pr.height, 250))}px`;
  }
}

function showPopover(description: HTMLElement) {
  if (!elementIsTruncated(description)) return;
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  hideTimer = null;

  const text = description.textContent?.trim();
  if (!text) return;

  activeDescription = description;
  const popover = getPopover();
  popover.textContent = text;
  popover.hidden = false;
  if (showFrame !== null) window.cancelAnimationFrame(showFrame);
  showFrame = window.requestAnimationFrame(() => {
    showFrame = null;
    if (!popover.hidden && activeDescription === description) {
      positionPopover(description, popover);
    }
  });
}

function scheduleHidePopover() {
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    const popover = document.getElementById(POPOVER_ID);
    if (popover) popover.hidden = true;
    activeDescription = null;
    hideTimer = null;
  }, 120);
}

export function installOverflowPopover(signal: AbortSignal) {
  listenerSignal = signal;
  getPopover();
}

export function bindOverflowPopover(element: HTMLElement) {
  if (element.dataset.lunaticOverflowBound === "true") return;
  element.dataset.lunaticOverflowBound = "true";
  element.addEventListener(
    "pointerenter",
    () => showPopover(element),
    listenerSignal ? { signal: listenerSignal } : undefined,
  );
  element.addEventListener(
    "pointerleave",
    scheduleHidePopover,
    listenerSignal ? { signal: listenerSignal } : undefined,
  );
}

export function onOverflowPopoverViewportChange() {
  if (!activeDescription) return;
  const popover = document.getElementById(POPOVER_ID);
  if (!popover || popover.hidden) return;
  positionPopover(activeDescription, popover);
}

export function cleanupOverflowPopover() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (showFrame !== null) {
    window.cancelAnimationFrame(showFrame);
    showFrame = null;
  }
  activeDescription = null;
  listenerSignal = undefined;
  document.getElementById(POPOVER_ID)?.remove();
}
