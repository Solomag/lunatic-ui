import type { LunaUnload } from "@luna/core";
import { ContextMenu } from "@luna/lib";
import { lunaFeatures } from "./luna-features";

const PROFILE_MENU_TYPE = "USER_PROFILE";
const MENU_ITEM_SELECTOR = '[data-type="contextmenu-item"]';
const LUNA_SETTINGS_LABEL = "Luna Settings";
const SETTINGS_LABEL = "Settings";
const LAYOUT_RETRY_FRAMES = 8;

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

export async function installProfileMenuSafety(unloads: Set<LunaUnload>) {
  let cancelLayout: (() => void) | undefined;
  ContextMenu.onOpen(unloads, ({ event, contextMenu }) => {
    if (event.type !== PROFILE_MENU_TYPE) return;
    cancelLayout?.();
    cancelLayout = settleProfileMenuLayout(contextMenu);
  });
  unloads.add(() => cancelLayout?.());

  // Luna 1.20.5+ asks before logging out itself, a second dialog would be redundant
  if (!lunaFeatures.coreLogoutConfirm) (await import("./legacy/logout-confirm")).installLogoutConfirm(unloads);
}
