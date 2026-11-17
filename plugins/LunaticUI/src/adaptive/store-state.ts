import { ReactiveStore } from "@luna/core";
import * as lunaUi from "@luna/ui";
import { store as obyStore } from "oby";

export const LOCAL_STORE = "http://127.0.0.1:3000";

/**
 * Luna builds with the store registry (Inrixia/TidaLuna#195 by FlazeIGuess, Solomag/TidaLuna
 * feat/store-list) keep defaults, user stores and hidden defaults apart and delete the old flat
 * "storeUrls" list after migrating it. Older builds only have that flat list. Lunatic reads and
 * writes through whichever the running Luna has.
 */
type RegistryApi = {
  visibleStores(): { url: string; userAdded: boolean }[];
  addToStores(url: string): boolean;
  removeStore(url: string): void;
  refreshRegistry?(force?: boolean): Promise<boolean>;
  registryStores: object;
  userStoreUrls: object;
  hiddenStoreUrls: object;
};
const ui = lunaUi as unknown as Partial<RegistryApi>;
const registry: RegistryApi | undefined = typeof ui.visibleStores === "function" ? (ui as RegistryApi) : undefined;
export const usesStoreRegistry = registry !== undefined;

const pluginStores = ReactiveStore.getStore("@luna/pluginStores");
/** Legacy flat list, only used on Luna builds without the registry */
export const storeUrls = registry ? undefined : await pluginStores.getReactive<string[]>("storeUrls", []);

export function normalizeStoreUrl(value: string) {
  const href = new URL(value.trim()).href;
  return href.endsWith("/store.json") ? href.slice(0, -11) : href.replace(/\/$/, "");
}

/** Store base urls currently shown, in display order */
export function currentStoreUrls(): string[] {
  if (registry) return registry.visibleStores().map((store) => store.url);
  return [...obyStore.unwrap(storeUrls!)];
}

/** Calls cb whenever the visible store list may have changed. Also refreshes the registry. */
export function onStoreUrlsChange(cb: () => void): () => void {
  if (!registry) return obyStore.on(storeUrls!, cb);
  const unloads = [
    obyStore.on(registry.registryStores, cb),
    obyStore.on(registry.userStoreUrls, cb),
    obyStore.on(registry.hiddenStoreUrls, cb),
  ];
  registry.refreshRegistry?.().catch(() => {});
  return () => {
    for (const unload of unloads) unload?.();
  };
}

export function addStore(url: string) {
  const normalized = normalizeStoreUrl(url);
  if (registry) return registry.addToStores(normalized);
  if (storeUrls!.includes(normalized)) return false;
  storeUrls!.push(normalized);
  return true;
}

/** On the registry a default store is hidden rather than deleted, so it does not come back */
export function removeStore(url: string) {
  const normalized = normalizeStoreUrl(url);
  if (registry) return registry.removeStore(normalized);
  const index = storeUrls!.indexOf(normalized);
  if (index >= 0) storeUrls!.splice(index, 1);
}
