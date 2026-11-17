import type { LunaticAppearance } from "./appearance";

const STYLE_ID = "lunatic-appearance-style";
const ROOT_ATTR = "data-lunatic-appearance";
let appearanceActive = true;

function escUrl(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function backgroundSize(a: LunaticAppearance) {
  if (a.backgroundZoom <= 100) return a.backgroundFit;
  if (a.backgroundFit === "contain") return `auto ${a.backgroundZoom}%`;
  return `${a.backgroundZoom}% auto`;
}

export function buildAppearanceCss(a: LunaticAppearance) {
  const radius = Math.max(0, Number(a.borderRadius) || 0);
  const opacity = Math.max(0, Math.min(100, Number(a.surfaceOpacity) || 0));
  const reload = a.singleIconColor ? a.iconColor : a.reloadIconColor;
  const liveReload = a.singleIconColor ? a.iconColor : a.liveReloadIconColor;
  const settings = a.singleIconColor ? a.iconColor : a.settingsIconColor;
  const uninstall = a.singleIconColor ? a.iconColor : a.uninstallIconColor;
  const image = a.pageBackgroundImage ? `url("${escUrl(a.pageBackgroundImage)}")` : "none";
  const avatarRule = a.hideAuthorAvatars
    ? `html[${ROOT_ATTR}="true"] [data-lunatic-plugin-author="true"] .MuiAvatar-root,
html[${ROOT_ATTR}="true"] [data-lunatic-installed-plugin-author="true"] .MuiAvatar-root,
html[${ROOT_ATTR}="true"] [data-lunatic-core-plugin-author="true"] .MuiAvatar-root { display: none !important; }`
    : "";

  // A theme that publishes a --solo-* palette into TIDAL's --wave-* tokens; overriding the palette
  // here (html[attr] outranks the theme's :root) recolours TIDAL and Lunatic UI together.
  const paletteRule = a.applyToTheme
    ? `html[${ROOT_ATTR}="true"] {
  --solo-bg: ${a.pageBackground};
  --solo-surface: ${a.pageBackground};
  --solo-raised: ${a.cardBackground};
  --solo-text: ${a.textColor};
  --solo-text-secondary: ${a.mutedTextColor};
  --solo-border: ${a.borderColor};
}`
    : "";

  return String.raw`
${paletteRule}
html[${ROOT_ATTR}="true"] {
  --lunatic-app-page: ${a.pageBackground};
  --lunatic-app-shell: ${a.shellBackground};
  --lunatic-app-card: ${a.cardBackground};
  --lunatic-app-inner: ${a.innerBackground};
  --lunatic-app-control: ${a.controlBackground};
  --lunatic-app-edge: ${a.borderColor};
  --lunatic-app-edge-strong: ${a.strongBorderColor};
  --lunatic-app-text: ${a.textColor};
  --lunatic-app-muted: ${a.mutedTextColor};
  --lunatic-app-radius: ${radius}px;
  --lunatic-app-opacity: ${opacity}%;
}

/* Page-level appearance. :has() lets Appearance remain observer-free. */
html[${ROOT_ATTR}="true"] .MuiContainer-root:not([data-luna-settings-tab-page]):has([data-lunatic-plugin-store="true"]),
html[${ROOT_ATTR}="true"] .MuiContainer-root:not([data-luna-settings-tab-page]):has([data-lunatic-settings-card="true"]),
html[${ROOT_ATTR}="true"] .MuiContainer-root:not([data-luna-settings-tab-page]):has([data-lunatic-theme-row="true"]),
html[${ROOT_ATTR}="true"] .MuiContainer-root:not([data-luna-settings-tab-page]):has([data-lunatic-feature-flag="true"]) {
  /* Translucent so the window background shows through the Lunatic UI glass panel */
  background-color: color-mix(in srgb, var(--lunatic-app-page) 78%, transparent) !important;
  background-image: ${image} !important;
  background-size: ${backgroundSize(a)} !important;
  background-position: ${a.backgroundPositionX}% ${a.backgroundPositionY}% !important;
  background-repeat: no-repeat !important;
  color: var(--lunatic-app-text) !important;
}

html[${ROOT_ATTR}="true"] [data-lunatic-plugin-store="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-core-plugins-shell="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-feature-flags-shell="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-client-updates-shell="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-backup-settings-shell="true"] {
  background: color-mix(in srgb, var(--lunatic-app-shell) var(--lunatic-app-opacity), transparent) !important;
  border-color: var(--lunatic-app-edge) !important;
  border-radius: var(--lunatic-app-radius) !important;
  color: var(--lunatic-app-text) !important;
}

html[${ROOT_ATTR}="true"] [data-lunatic-plugin-card="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-settings-card="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-theme-row="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-feature-flag="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-core-plugin="true"] {
  background: color-mix(in srgb, var(--lunatic-app-card) var(--lunatic-app-opacity), transparent) !important;
  border-color: var(--lunatic-app-edge) !important;
  border-radius: var(--lunatic-app-radius) !important;
  color: var(--lunatic-app-text) !important;
}

html[${ROOT_ATTR}="true"] [data-lunatic-installed-plugin-settings="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-installed-plugin-settings-shell="true"] {
  background: color-mix(in srgb, var(--lunatic-app-inner) var(--lunatic-app-opacity), transparent) !important;
  border-color: var(--lunatic-app-edge-strong) !important;
  border-radius: var(--lunatic-app-radius) !important;
}

html[${ROOT_ATTR}="true"] [data-lunatic-unified-input="true"] .MuiOutlinedInput-root,
html[${ROOT_ATTR}="true"] [data-lunatic-themes-install-field="true"] .MuiOutlinedInput-root,
html[${ROOT_ATTR}="true"] [data-lunatic-plugin-store-controls="true"] .MuiOutlinedInput-root {
  background: var(--lunatic-app-control) !important;
  color: var(--lunatic-app-text) !important;
  border-radius: var(--lunatic-app-radius) !important;
}

html[${ROOT_ATTR}="true"] [data-lunatic-unified-input="true"] .MuiOutlinedInput-notchedOutline,
html[${ROOT_ATTR}="true"] [data-lunatic-themes-install-field="true"] .MuiOutlinedInput-notchedOutline,
html[${ROOT_ATTR}="true"] [data-lunatic-plugin-store-controls="true"] .MuiOutlinedInput-notchedOutline {
  border-color: var(--lunatic-app-edge) !important;
}

html[${ROOT_ATTR}="true"] [data-lunatic-plugin-description="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-installed-plugin-author="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-core-plugin-author="true"],
html[${ROOT_ATTR}="true"] [data-lunatic-plugin-author="true"] {
  color: var(--lunatic-app-muted) !important;
}

/* Plugin action icons. Cover both normal installed plugins and Luna core plugins.
   Apply the colour to the IconButton AND its SVG because some Luna buttons
   assign an explicit icon colour through MUI sx (for example Show/Hide settings). */
html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([title="Reload plugin"], [aria-label="Reload plugin"]),
html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([title="Reload plugin"], [aria-label="Reload plugin"]) svg { color: ${reload} !important; }

html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([aria-label*="live reloading" i], [title*="live reloading" i]),
html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([aria-label*="live reloading" i], [title*="live reloading" i]) svg { color: ${liveReload} !important; }

html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([aria-label*="settings" i], [title*="settings" i]),
html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([aria-label*="settings" i], [title*="settings" i]) svg { color: ${settings} !important; }

html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([aria-label*="uninstall" i], [title*="uninstall" i]),
html[${ROOT_ATTR}="true"] :is([data-lunatic-installed-plugin-header-stack="true"], [data-lunatic-core-plugin-header-stack="true"])
  button:is([aria-label*="uninstall" i], [title*="uninstall" i]) svg { color: ${uninstall} !important; }

html[${ROOT_ATTR}="true"] .lunatic-plugin-store-real-action {
  border: 1px solid var(--lunatic-app-edge-strong) !important;
  background: var(--lunatic-app-control) !important;
  color: var(--lunatic-app-text) !important;
}
html[${ROOT_ATTR}="true"] .lunatic-plugin-store-real-action[data-lunatic-action-kind="install"] {
  background: var(--lunatic-app-text) !important;
  color: var(--lunatic-app-page) !important;
  border-color: var(--lunatic-app-text) !important;
}
html[${ROOT_ATTR}="true"] .lunatic-plugin-store-real-action:focus-visible {
  outline: 2px solid var(--lunatic-app-edge-strong) !important;
}

${avatarRule}
`;
}

export function applyAppearance(a: LunaticAppearance) {
  if (!appearanceActive) return;
  document.documentElement.setAttribute(ROOT_ATTR, "true");
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  const css = buildAppearanceCss(a);
  if (style.textContent !== css) style.textContent = css;
}

export function unloadAppearance() {
  appearanceActive = false;
  document.documentElement.removeAttribute(ROOT_ATTR);
  document.getElementById(STYLE_ID)?.remove();
}
