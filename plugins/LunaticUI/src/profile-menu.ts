import type { LunaUnload } from "@luna/core";
import { ContextMenu, redux } from "@luna/lib";
import { confirm } from "@luna/ui";

const PROFILE_MENU_TYPE = "USER_PROFILE";
const MENU_ITEM_SELECTOR = '[data-type="contextmenu-item"]';
const LUNA_SETTINGS_LABEL = "Luna Settings";
const SETTINGS_LABEL = "Settings";
const LOGOUT_LABELS = new Set(["Log Out", "Log out", "Logout"]);
const LAYOUT_RETRY_FRAMES = 8;
const MENU_CLOSE_TIMEOUT_MS = 350;

function normalizedText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function menuItems(contextMenu: Element) {
  return Array.from(contextMenu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
}

function itemLabel(item: HTMLElement) {
  const span = item.querySelector("span");
  return normalizedText(span?.textContent ?? item.textContent);
}

function findMenuItem(contextMenu: Element, label: string) {
  return menuItems(contextMenu).find((item) => itemLabel(item) === label);
}

function moveLunaSettingsBelowStockSettings(contextMenu: Element) {
  const stockSettings = findMenuItem(contextMenu, SETTINGS_LABEL);
  const lunaSettings = findMenuItem(contextMenu, LUNA_SETTINGS_LABEL);
  if (!stockSettings || !lunaSettings || stockSettings === lunaSettings) return false;

  if (stockSettings.nextElementSibling !== lunaSettings) {
    stockSettings.insertAdjacentElement("afterend", lunaSettings);
  }

  // @luna/ui paints its injected menu item cyan inline. Remove that inline
  // accent so the entry inherits the exact same foreground as TIDAL's native
  // Settings / Log Out items.
  const lunaLabel = lunaSettings.querySelector<HTMLElement>("span");
  lunaLabel?.style.removeProperty("color");
  lunaSettings.style.removeProperty("color");
  return true;
}

function settleProfileMenuLayout(contextMenu: Element) {
  let frame = 0;
  let raf = 0;

  const attempt = () => {
    if (!contextMenu.isConnected) return;
    if (moveLunaSettingsBelowStockSettings(contextMenu)) return;
    frame += 1;
    if (frame < LAYOUT_RETRY_FRAMES) raf = requestAnimationFrame(attempt);
  };

  raf = requestAnimationFrame(attempt);
  return () => cancelAnimationFrame(raf);
}

function waitForMenuClosed(contextMenu?: Element) {
  if (!contextMenu?.isConnected) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const started = performance.now();
    const check = () => {
      if (!contextMenu.isConnected || performance.now() - started >= MENU_CLOSE_TIMEOUT_MS) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

async function askLogout(contextMenu?: Element) {
  await waitForMenuClosed(contextMenu);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  try {
    const result = await confirm({
      title: "Log out of TIDAL?",
      description: "You will need to sign in again to continue using TIDAL.",
      confirmationText: "Log Out",
      cancellationText: "Cancel",
    });
    return result.confirmed;
  } catch (error) {
    console.warn("[Lunatic UI] Luna confirmation dialog failed; using browser fallback.", error);
    return window.confirm("Log out of TIDAL?\n\nYou will need to sign in again to continue using TIDAL.");
  }
}

export function installProfileMenuSafety(unloads: Set<LunaUnload>) {
  let cleanupCurrent: (() => void) | undefined;
  let logoutIntent = false;
  let logoutMenu: Element | undefined;
  let confirming = false;
  let replaying = false;

  // Let TIDAL's original Log Out click run normally, but cancel the exact
  // session/LOGOUT action it emits. This preserves TIDAL's own click path and
  // only inserts confirmation at the Redux boundary. On approval we replay the
  // same action once while bypassing this interceptor.
  redux.intercept("session/LOGOUT", unloads, (payload) => {
    if (replaying) return;
    if (confirming) return true;
    if (!logoutIntent) return;
    logoutIntent = false;
    confirming = true;
    const menu = logoutMenu;

    // TIDAL 2.43.x's logout saga reads `initiatedByUser` from the action
    // creator argument. TidaLuna's generated ActionPayloads currently types
    // session/LOGOUT as void, so replaying it without the original argument
    // crashes the saga (`Cannot read ... initiatedByUser`) and leaves session
    // controls broken until restart. Preserve the exact captured argument and
    // only fill the field defensively when the action creator exposed none.
    const logoutPayload = typeof payload === "object" && payload !== null
      ? { ...(payload as Record<string, unknown>), initiatedByUser: (payload as any).initiatedByUser ?? true }
      : { initiatedByUser: true };

    void askLogout(menu).then((confirmed) => {
      if (!confirmed) return;
      replaying = true;
      try {
        (redux.actions["session/LOGOUT"] as unknown as (payload: Record<string, unknown>) => unknown)(logoutPayload);
      } catch (error) {
        console.error("[Lunatic UI] Failed to replay TIDAL logout after confirmation.", error);
      } finally {
        queueMicrotask(() => { replaying = false; });
      }
    }).finally(() => {
      confirming = false;
      logoutMenu = undefined;
    });
    return true;
  });

  ContextMenu.onOpen(unloads, ({ event, contextMenu }) => {
    if (event.type !== PROFILE_MENU_TYPE) return;

    cleanupCurrent?.();
    const cancelLayout = settleProfileMenuLayout(contextMenu);
    const markLogoutIntent = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const item = target.closest<HTMLElement>(MENU_ITEM_SELECTOR);
      if (!item || !contextMenu.contains(item) || !LOGOUT_LABELS.has(itemLabel(item))) return;
      logoutIntent = true;
      logoutMenu = contextMenu;
      // If this particular click never emits session/LOGOUT, do not arm a
      // future unrelated logout action.
      setTimeout(() => {
        if (logoutMenu === contextMenu && !confirming) {
          logoutIntent = false;
          logoutMenu = undefined;
        }
      }, 1500);
    };
    contextMenu.addEventListener("click", markLogoutIntent, true);

    cleanupCurrent = () => {
      cancelLayout?.();
      contextMenu.removeEventListener("click", markLogoutIntent, true);
      cleanupCurrent = undefined;
    };
  });

  unloads.add(() => {
    cleanupCurrent?.();
  });
}
