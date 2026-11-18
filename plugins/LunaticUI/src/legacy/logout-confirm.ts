import type { LunaUnload } from "@luna/core";
import { ContextMenu, redux } from "@luna/lib";
import { confirm } from "@luna/ui";

/*
 * Confirmation before Log Out for a Luna that does not ask itself (TidaLuna < 1.20.5, TidaLunar).
 * Loaded by profile-menu.ts only on such a Luna.
 */

const PROFILE_MENU_TYPE = "USER_PROFILE";
const MENU_ITEM_SELECTOR = '[data-type="contextmenu-item"]';
const LOGOUT_LABELS = new Set(["Log Out", "Log out", "Logout"]);
const MENU_CLOSE_TIMEOUT_MS = 350;

function itemLabel(item: HTMLElement) {
  const span = item.querySelector("span");
  return (span?.textContent ?? item.textContent ?? "").replace(/\s+/g, " ").trim();
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

export function installLogoutConfirm(unloads: Set<LunaUnload>) {
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
      contextMenu.removeEventListener("click", markLogoutIntent, true);
      cleanupCurrent = undefined;
    };
  });

  unloads.add(() => {
    cleanupCurrent?.();
  });
}
