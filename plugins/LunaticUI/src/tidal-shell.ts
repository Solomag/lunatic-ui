import type { LunaUnload } from "@luna/core";

const TITLE_SELECTOR = 'div[class^="_mainContainer"] > div[class^="_bar"] > div[class^="_title"]';
const TITLE_CHECK_MS = 1200;

function normalize(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function ensureTidalLunaTitle() {
  const title = document.querySelector<HTMLElement>(TITLE_SELECTOR);
  if (!title) return;

  const text = normalize(title.textContent);
  if (text.includes("luna") && text.includes("beta")) return;

  // @luna/lib injects this title once during startup. TIDAL can replace the
  // native title node after account/session transitions without re-running
  // that one-shot injection. Restore only the known Luna shell title and keep
  // all accents monochrome so it survives relogin without reverting to cyan/red.
  title.replaceChildren();
  const tidal = document.createTextNode("TIDA");
  const strong = document.createElement("b");
  const luna = document.createElement("span");
  luna.textContent = "Luna";
  strong.appendChild(luna);
  const spacer = document.createTextNode(" ");
  const beta = document.createElement("span");
  beta.textContent = "BETA";
  title.append(tidal, strong, spacer, beta);
}

export function installTidalShellPolish(unloads: Set<LunaUnload>) {
  ensureTidalLunaTitle();
  const timer = window.setInterval(ensureTidalLunaTitle, TITLE_CHECK_MS);
  const refresh = () => ensureTidalLunaTitle();
  window.addEventListener("focus", refresh, { passive: true });
  document.addEventListener("visibilitychange", refresh);

  unloads.add(() => {
    window.clearInterval(timer);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  });
}
