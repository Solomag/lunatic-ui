export const lunaticLayoutCss = String.raw`

@layer lunatic-stable-tint, lunatic-plugin-store-fix;

/* Fixed footer-player safe area. Runtime JS owns the custom property and sets
   it to 0 whenever the player is hidden or absent. */
[data-lunatic-settings-root="true"] {
  box-sizing: border-box !important;
  padding-bottom: var(--lunatic-playbar-clearance, 0px) !important;
}

@layer lunatic-plugin-store-fix {
  [data-lunatic-plugin-card="true"] {display: flex !important;flex-direction: column !important;align-items: stretch !important;justify-content: flex-start !important;width: 100% !important;height: 100% !important;min-width: 0 !important;padding: 14px 20px 18px !important;visibility: visible !important;transform: none !important;translate: none !important;scale: 1 !important;overflow: visible !important;cursor: default !important;}

  [data-lunatic-plugin-card="true"]:is(:hover,:focus,:focus-visible,:active) {display: flex !important;flex-direction: column !important;align-items: stretch !important;justify-content: flex-start !important;padding: 14px 20px 18px !important;visibility: visible !important;transform: none !important;translate: none !important;scale: 1 !important;}

  /* Plugin Store layout now lives here rather than in the standalone theme. */
  [data-lunatic-plugin-store="true"] {box-sizing: border-box !important;padding: 22px 28px 26px !important;}

  [data-lunatic-plugin-store-header="true"] {display: block !important;width: 100% !important;min-width: 0 !important;margin: 0 0 10px !important;padding: 0 !important;overflow: visible !important;}

  [data-lunatic-plugin-store-header-row="true"] {width: 100% !important;min-width: 0 !important;}

  [data-lunatic-plugin-store-grid="true"] {width: 100% !important;margin: 0 !important;box-sizing: border-box !important;align-items: stretch !important;}

  [data-lunatic-plugin-store-controls="true"] {display: grid !important;grid-template-columns: repeat(2, minmax(0,1fr)) !important;gap: 16px !important;width: 100% !important;min-width: 0 !important;margin: 0 0 16px !important;}

  /* Search and Install-from-URL deliberately use one synthetic visual-label
     model. MUI's generated InputLabel classes are hidden and used only as a
     text source for the dynamic install status. */
  [data-lunatic-store-field="true"] {display: grid !important;grid-template-columns: minmax(0,1fr) !important;grid-template-rows: 16px 40px !important;row-gap: 5px !important;align-content: start !important;width: 100% !important;min-width: 0 !important;margin: 0 !important;padding: 0 !important;}

  [data-lunatic-store-field="true"]::before {content: attr(data-lunatic-field-label) !important;grid-column: 1 !important;grid-row: 1 !important;display: block !important;align-self: start !important;width: max-content !important;max-width: 100% !important;height: 16px !important;margin: 0 !important;padding: 0 !important;line-height: 16px !important;white-space: nowrap !important;overflow: hidden !important;text-overflow: ellipsis !important;pointer-events: none !important;}

  [data-lunatic-store-field-label="true"] {display: none !important;}

  [data-lunatic-store-input-surface="true"] {grid-column: 1 !important;grid-row: 2 !important;width: 100% !important;height: 40px !important;min-height: 40px !important;margin: 0 !important;padding-top: 0 !important;padding-bottom: 0 !important;}

  [data-lunatic-store-input-surface="true"] .MuiOutlinedInput-notchedOutline > legend {max-width: 0 !important;}

  [data-lunatic-plugin-store-controls="true"] .MuiInputBase-input {box-sizing: border-box !important;}

  @media (max-width: 800px) {
    [data-lunatic-plugin-store-controls="true"] {grid-template-columns: minmax(0,1fr) !important;}
  }

  /* Grid item becomes the containing block for our genuine sibling button. */
  [data-lunatic-plugin-grid-item="true"] {display: flex !important;position: relative !important;align-items: stretch !important;min-width: 0 !important;}

    [data-lunatic-plugin-grid-item="true"] > [data-lunatic-plugin-card="true"] {align-self: stretch !important;width: 100% !important;height: 100% !important;padding-bottom: 56px !important;}

  /* Luna's original decorative Install/Uninstall label is NOT an action.
     The source component explicitly gives it pointer-events:none. Keep it only
     in DOM as a state/label source and hide it visually. */

  [data-lunatic-plugin-card-content="true"],
  [data-lunatic-plugin-card="true"]:hover [data-lunatic-plugin-card-content="true"] {display: block !important;position: relative !important;width: 100% !important;min-width: 0 !important;margin: 0 !important;padding: 0 !important;visibility: visible !important;transform: none !important;translate: none !important;}

  [data-lunatic-plugin-card-content="true"] > *,
  [data-lunatic-plugin-card="true"]:hover [data-lunatic-plugin-card-content="true"] > * {visibility: visible !important;transform: none !important;translate: none !important;}

  [data-lunatic-plugin-header="true"] {display: grid !important;grid-template-columns: minmax(0,1fr) !important;grid-template-rows: 28px 16px !important;row-gap: 3px !important;align-items: center !important;width: 100% !important;min-width: 0 !important;height: 47px !important;min-height: 47px !important;max-height: 47px !important;margin: 0 !important;padding: 0 !important;overflow: visible !important;}

  [data-lunatic-plugin-title="true"] {grid-row: 1 !important;display: block !important;width: 100% !important;min-width: 0 !important;margin: 0 !important;padding: 0 !important;overflow: hidden !important;white-space: nowrap !important;text-overflow: ellipsis !important;}

  [data-lunatic-plugin-title="true"] > a {display: inline !important;position: static !important;}

  [data-lunatic-plugin-title="true"] > a ~ * {display: inline !important;position: static !important;width: auto !important;height: auto !important;margin: 0 0 0 6px !important;padding: 0 !important;vertical-align: baseline !important;line-height: inherit !important;transform: none !important;translate: none !important;}

  [data-lunatic-plugin-author="true"] {grid-row: 2 !important;display: block !important;position: static !important;width: 100% !important;min-width: 0 !important;height: 16px !important;min-height: 16px !important;max-height: 16px !important;margin: 0 !important;padding: 0 !important;overflow: hidden !important;white-space: nowrap !important;text-overflow: ellipsis !important;line-height: 16px !important;transform: none !important;translate: none !important;}

  [data-lunatic-plugin-author-name="true"] {display: block !important;position: static !important;width: 100% !important;min-width: 0 !important;margin: 0 !important;padding: 0 !important;overflow: hidden !important;white-space: nowrap !important;text-overflow: ellipsis !important;line-height: 16px !important;}

  [data-lunatic-plugin-author-avatar="true"] {display: none !important;visibility: hidden !important;pointer-events: none !important;}

[data-lunatic-plugin-description="true"] {display: -webkit-box !important;-webkit-box-orient: vertical !important;-webkit-line-clamp: 3 !important;position: static !important;width: 100% !important;min-width: 0 !important;height: 57.7px !important;min-height: 57.7px !important;max-height: 57.7px !important;margin: 10px 0 0 !important;padding: 0 !important;overflow: hidden !important;white-space: normal !important;overflow-wrap: anywhere !important;visibility: visible !important;transform: none !important;translate: none !important;cursor: help !important;}

  #lunatic-plugin-store-description-popover {position: fixed !important;z-index: 2147483000 !important;box-sizing: border-box !important;max-height: 250px !important;overflow-x: hidden !important;overflow-y: auto !important;padding: 9px 11px !important;font: inherit !important;line-height: 19.23px !important;text-align: left !important;white-space: normal !important;overflow-wrap: anywhere !important;pointer-events: auto !important;}
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     PLUGIN STORE HEADER — canonical semantic layout
     Collapses historical 0.7.3 → 0.7.12 store/header patches.
     ========================================================= */

  [data-lunatic-plugin-store-header-row="true"] {
    display: grid !important;
    grid-template-columns: minmax(0,1fr) 40px 40px !important;
    grid-template-rows: auto auto !important;
    column-gap: 8px !important;
    row-gap: 2px !important;
    align-items: center !important;
    width: 100% !important;
    min-width: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }

  [data-lunatic-plugin-store-title="true"] {
    grid-column: 1 !important;
    grid-row: 1 !important;
    display: block !important;
    position: static !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    transform: none !important;
    translate: none !important;
  }

  [data-lunatic-plugin-store-header-row="true"]
    > [data-lunatic-store-action="true"]:nth-of-type(1) {
    grid-column: 2 !important;
    grid-row: 1 !important;
  }

  [data-lunatic-plugin-store-header-row="true"]
    > [data-lunatic-store-action="true"]:nth-of-type(2) {
    grid-column: 3 !important;
    grid-row: 1 !important;
  }

  [data-lunatic-store-action="true"] {
    position: relative !important;
    place-self: center !important;
    box-sizing: border-box !important;
    width: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
    height: 40px !important;
    min-height: 40px !important;
    max-height: 40px !important;
    margin: 0 !important;
    padding: 8px !important;
    inset: auto !important;
    transform: none !important;
  }

  [data-lunatic-store-spacer="true"] {
    display: none !important;
  }

  [data-lunatic-store-author="true"] {
    grid-column: 1 !important;
    grid-row: 2 !important;
    display: flex !important;
    position: static !important;
    align-items: center !important;
    justify-content: flex-start !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 18px !important;
    min-height: 18px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  [data-lunatic-store-author-avatar="true"] {
    display: none !important;
  }

  [data-lunatic-store-author-name="true"] {
    display: block !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 18px !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 18px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     INSTALLED PLUGINS / THEMES — canonical semantic layout
     ========================================================= */

  /* ---------- INSTALLED PLUGINS ----------
     Header DOM:
       title, switch, reload, live, settings, uninstall, spacer, author
     Controls should be vertically centered across title + author together. */
  [data-lunatic-installed-plugin-header-stack="true"] {display: grid !important;grid-template-columns:
      minmax(0,1fr)
      56px
      40px
      40px
      40px
      40px !important;grid-template-rows: 24px 18px !important;column-gap: 8px !important;row-gap: 2px !important;align-items: center !important;width: 100% !important;min-width: 0 !important;max-width: none !important;}

  [data-lunatic-installed-plugin-title="true"] {grid-column: 1 !important;grid-row: 1 !important;display: block !important;position: static !important;width: auto !important;min-width: 0 !important;height: 24px !important;min-height: 24px !important;max-height: 24px !important;margin: 0 !important;padding: 0 !important;line-height: 24px !important;white-space: nowrap !important;overflow: hidden !important;text-overflow: ellipsis !important;}

  [data-lunatic-installed-plugin-title="true"] > a,
  [data-lunatic-installed-plugin-version="true"] {display: inline !important;position: static !important;vertical-align: baseline !important;transform: none !important;translate: none !important;}

  [data-lunatic-installed-plugin-version="true"] {visibility: visible !important;width: auto !important;height: auto !important;margin: 0 0 0 7px !important;padding: 0 !important;line-height: 24px !important;white-space: nowrap !important;pointer-events: none !important;}

  [data-lunatic-installed-plugin-author="true"] {grid-column: 1 !important;grid-row: 2 !important;display: flex !important;position: static !important;align-items: center !important;justify-content: flex-start !important;width: 100% !important;min-width: 0 !important;max-width: none !important;height: 18px !important;min-height: 18px !important;max-height: 18px !important;margin: 0 !important;padding: 0 !important;}

  [data-lunatic-installed-plugin-switch="true"] {grid-column: 2 !important;grid-row: 1 / span 2 !important;position: relative !important;place-self: center !important;margin: 0 !important;}

  [data-lunatic-installed-plugin-action="reload"] {grid-column: 3 !important;grid-row: 1 / span 2 !important;}

  [data-lunatic-installed-plugin-action="live-reload"] {grid-column: 4 !important;grid-row: 1 / span 2 !important;}

  [data-lunatic-installed-plugin-action="settings"] {grid-column: 5 !important;grid-row: 1 / span 2 !important;}

  [data-lunatic-installed-plugin-action="uninstall"] {grid-column: 6 !important;grid-row: 1 / span 2 !important;}

  [data-lunatic-installed-plugin-action] {position: relative !important;place-self: center !important;box-sizing: border-box !important;width: 40px !important;min-width: 40px !important;max-width: 40px !important;height: 40px !important;min-height: 40px !important;max-height: 40px !important;margin: 0 !important;padding: 8px !important;top: auto !important;right: auto !important;bottom: auto !important;left: auto !important;transform: none !important;translate: none !important;scale: 1 !important;animation: none !important;}

  [data-lunatic-installed-plugin-action] > .MuiSvgIcon-root {display: block !important;position: static !important;width: 24px !important;height: 24px !important;margin: 0 !important;padding: 0 !important;transform: none !important;translate: none !important;scale: 1 !important;animation: none !important;}

  [data-lunatic-installed-plugin-spacer="true"] {display: none !important;}

  /* ---------- THEMES ----------
     Theme rows are no longer treated as installed Plugins. */
  [data-lunatic-themes-install-field="true"] {display: grid !important;grid-template-rows: 16px 40px !important;row-gap: 5px !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;padding: 0 !important;}

  [data-lunatic-themes-install-label="true"] {grid-row: 1 !important;position: static !important;transform: none !important;display: block !important;width: max-content !important;height: 16px !important;margin: 0 !important;padding: 0 !important;line-height: 16px !important;}

  [data-lunatic-themes-install-surface="true"] {grid-row: 2 !important;width: 100% !important;height: 40px !important;min-height: 40px !important;margin: 0 !important;}

[data-lunatic-theme-row="true"] {display: grid !important;grid-template-columns: minmax(0,1fr) 56px 40px 40px !important;grid-template-rows: 40px !important;column-gap: 8px !important;align-items: center !important;width: 100% !important;min-width: 0 !important;max-width: none !important;box-sizing: border-box !important;margin: 0 !important;padding: 0 !important;overflow: hidden !important;}

  [data-lunatic-theme-url="true"] {grid-column: 1 !important;grid-row: 1 !important;display: block !important;min-width: 0 !important;max-width: 100% !important;margin: 0 !important;padding: 0 !important;overflow: hidden !important;text-overflow: ellipsis !important;white-space: nowrap !important;}

  [data-lunatic-theme-url="true"] {display: block !important;min-width: 0 !important;max-width: 100% !important;overflow: hidden !important;text-overflow: ellipsis !important;white-space: nowrap !important;}

  [data-lunatic-theme-switch="true"] {grid-column: 2 !important;grid-row: 1 !important;position: relative !important;place-self: center !important;margin: 0 !important;}

  [data-lunatic-theme-reload="true"] {display: inline-flex !important;grid-column: 3 !important;grid-row: 1 !important;position: relative !important;place-self: center !important;width: 40px !important;min-width: 40px !important;max-width: 40px !important;height: 40px !important;min-height: 40px !important;max-height: 40px !important;margin: 0 !important;padding: 8px !important;transform: none !important;translate: none !important;}

  [data-lunatic-theme-delete="true"] {grid-column: 4 !important;grid-row: 1 !important;position: relative !important;place-self: center !important;width: 40px !important;min-width: 40px !important;max-width: 40px !important;height: 40px !important;min-height: 40px !important;max-height: 40px !important;margin: 0 !important;padding: 8px !important;transform: none !important;translate: none !important;}

  [data-lunatic-theme-spacer="true"] {display: none !important;}
@media (max-width: 760px) {
    [data-lunatic-installed-plugin-header-stack="true"] {grid-template-columns: minmax(0,1fr) 52px 36px 36px 36px 36px !important;column-gap: 5px !important;}

  }
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     PLUGIN STORE CONTROLS — canonical layout
     ========================================================= */
[data-lunatic-theme-reload="true"],
  [data-lunatic-theme-delete="true"],
[data-lunatic-theme-reload="true"].Mui-disabled,
  [data-lunatic-theme-delete="true"].Mui-disabled,
  [data-lunatic-theme-action="true"].Mui-disabled,
  [data-lunatic-theme-reload="true"]:disabled,
/* PLUGIN STORE: restore the preferred two-column top controls. */
  [data-lunatic-plugin-store-controls="true"] {display: grid !important;grid-template-columns: repeat(2, minmax(0,1fr)) !important;gap: 16px !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 0 16px !important;}

  [data-lunatic-store-field="true"] {width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;}

  @media (max-width: 760px) {
    [data-lunatic-plugin-store-controls="true"] {grid-template-columns: minmax(0,1fr) !important;}
  }
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     SUPPORTERS — canonical exact implementation
     Replaces historical 0.7.23–0.7.29 patch train.
     ========================================================= */

  [data-lunatic-exact-supporter-section="sponsors"],
  [data-lunatic-exact-supporter-section="contributors"],
  [data-lunatic-exact-supporter-section="stargazers"],
  [data-lunatic-exact-supporter-stack="sponsors"],
  [data-lunatic-exact-supporter-stack="contributors"],
  [data-lunatic-exact-supporter-stack="stargazers"] {box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;padding: 0 !important;overflow: visible !important;}

  [data-lunatic-exact-supporter-stack="sponsors"],
  [data-lunatic-exact-supporter-stack="contributors"],
  [data-lunatic-exact-supporter-stack="stargazers"] {display: block !important;}

  [data-lunatic-exact-supporter-grid="sponsors"],
  [data-lunatic-exact-supporter-grid="contributors"],
  [data-lunatic-exact-supporter-grid="stargazers"] {display: grid !important;grid-template-columns: repeat(4, minmax(0,1fr)) !important;gap: 14px 22px !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;padding: 16px 18px !important;overflow: hidden !important;}

  [data-lunatic-exact-supporter-item="true"] {display: flex !important;align-items: center !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: 100% !important;min-height: 58px !important;margin: 0 !important;padding: 10px 12px !important;flex: none !important;flex-basis: auto !important;}

  [data-lunatic-exact-supporter-author="true"] {display: grid !important;grid-template-columns: minmax(0,1fr) auto !important;align-items: center !important;column-gap: 10px !important;width: 100% !important;min-width: 0 !important;max-width: 100% !important;margin: 0 !important;padding: 0 !important;}

  [data-lunatic-exact-supporter-name="true"] {grid-column: 1 !important;min-width: 0 !important;max-width: 100% !important;margin: 0 !important;padding: 0 !important;overflow: hidden !important;text-overflow: ellipsis !important;white-space: nowrap !important;}

  [data-lunatic-exact-supporter-avatar="true"] {grid-column: 2 !important;justify-self: end !important;margin: 0 !important;flex: 0 0 auto !important;}

  [data-lunatic-exact-supporter-section="contributors"],
  [data-lunatic-exact-supporter-section="stargazers"] {margin-top: 26px !important;}

  @media (max-width: 1100px) {
    [data-lunatic-exact-supporter-grid="sponsors"],
    [data-lunatic-exact-supporter-grid="contributors"],
    [data-lunatic-exact-supporter-grid="stargazers"] {grid-template-columns: repeat(3, minmax(0,1fr)) !important;}
  }

  @media (max-width: 820px) {
    [data-lunatic-exact-supporter-grid="sponsors"],
    [data-lunatic-exact-supporter-grid="contributors"],
    [data-lunatic-exact-supporter-grid="stargazers"] {grid-template-columns: repeat(2, minmax(0,1fr)) !important;}
  }

  @media (max-width: 560px) {
    [data-lunatic-exact-supporter-grid="sponsors"],
    [data-lunatic-exact-supporter-grid="contributors"],
    [data-lunatic-exact-supporter-grid="stargazers"] {grid-template-columns: minmax(0,1fr) !important;}
  }
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     SETTINGS — canonical implementation
     Collapses historical 0.8.3 → 0.9.2 overrides.
     ========================================================= */

  /* ---------- Installed plugins ---------- */
  [data-lunatic-installed-plugin="true"] {margin-bottom: 14px !important;}

  [data-lunatic-installed-plugin="true"]:last-child {margin-bottom: 0 !important;}

  [data-lunatic-installed-plugin="true"]
    > :not([data-lunatic-installed-plugin-header="true"]):not([data-lunatic-native-installed-plugin-header="true"]) {box-sizing: border-box !important;margin-top: 12px !important;}

  /* ---------- Unified inputs ---------- */

/* ---------- Themes ---------- */

  /* ---------- Settings hierarchy ---------- */

  [data-lunatic-client-updates-shell="true"],
  [data-lunatic-backup-settings-shell="true"],
  [data-lunatic-feature-flags-shell="true"],
  [data-lunatic-core-plugins-grid="true"] {box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin-bottom: 18px !important;padding: 18px 20px !important;}

  /* ---------- Feature Flags ---------- */
  [data-lunatic-feature-flags-grid="true"] {width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;}

  /* ---------- Client Updates / backup ---------- */
  [data-lunatic-client-updates-shell="true"] > *,
  [data-lunatic-backup-settings-shell="true"] > * {max-width: 100% !important;}

  [data-lunatic-client-update-controls="true"] {box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;margin-top: 10px !important;padding: 12px 14px !important;}

[data-lunatic-client-version-select="true"]
    > .MuiSelect-select {padding-left: 14px !important;padding-right: 38px !important;}

  /* ---------- Core plugins collection ---------- */
  [data-lunatic-core-plugins-grid="true"] {display: flex !important;flex-direction: column !important;gap: 14px !important;}

  [data-lunatic-core-plugins-grid="true"]
    > [data-lunatic-core-plugin="true"] {margin: 0 !important;}

  [data-lunatic-core-plugin="true"] {padding: 16px 20px !important;}

  /* ---------- Core settings section ---------- */
  [data-lunatic-core-plugin-content="true"] {display: block !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;height: auto !important;min-height: 0 !important;max-height: none !important;margin: 14px 0 0 !important;padding: 18px 20px 16px !important;overflow: visible !important;}

  /* Title/description inset. */
  [data-lunatic-core-settings-title="true"] {box-sizing: border-box !important;display: block !important;width: 100% !important;min-width: 0 !important;margin: 0 0 8px !important;padding: 8px 12px 12px !important;}

  [data-lunatic-core-settings-heading="true"] {display: block !important;margin: 0 0 5px !important;padding: 0 !important;}

  [data-lunatic-core-settings-description="true"] {margin: 0 !important;padding: 0 !important;}

  [data-lunatic-core-settings-title="true"] + div[style*="height: 8px"] {height: 4px !important;}

  /* One LunaSettings group, no nested card fills. */
  [data-lunatic-core-plugin-content="true"]
    > .MuiStack-root[display="flex"],
  [data-lunatic-core-plugin-content="true"]
    .MuiStack-root[display="flex"] {display: flex !important;flex-direction: column !important;align-items: stretch !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;height: auto !important;min-height: 0 !important;max-height: none !important;gap: 0 !important;margin: 0 !important;padding: 0 !important;}

  /* Exact direct row stack gets the final horizontal gutter from 0.9.2. */
  [data-lunatic-core-plugin-content="true"]
    > .MuiStack-root[display="flex"] {padding: 0 6px !important;}

  /* Real setting row: text left, controls right. */
  [data-lunatic-core-setting-row="true"] {display: grid !important;grid-template-columns: minmax(0,1fr) minmax(220px, 40%) !important;align-items: center !important;column-gap: 18px !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;height: auto !important;min-height: 68px !important;max-height: none !important;margin: 0 !important;padding: 12px !important;overflow: visible !important;}

  [data-lunatic-core-setting-copy="true"] {grid-column: 1 !important;min-width: 0 !important;max-width: 100% !important;margin: 0 !important;padding: 0 8px 0 0 !important;}

  [data-lunatic-core-setting-control="true"] {grid-column: 2 !important;display: flex !important;flex-direction: row !important;align-items: center !important;justify-content: flex-end !important;width: 100% !important;min-width: 0 !important;max-width: none !important;gap: 10px !important;margin: 0 !important;padding: 0 !important;}

  [data-lunatic-core-plugin-content="true"] .MuiTextField-root {flex: 1 1 auto !important;width: auto !important;min-width: 170px !important;max-width: 320px !important;margin: 0 !important;}

  [data-lunatic-core-plugin-content="true"] .MuiSwitch-root {flex: 0 0 auto !important;margin: 0 !important;}

  [data-lunatic-core-plugin-content="true"] .MuiButton-root {flex: 0 0 auto !important;min-width: 190px !important;max-width: 260px !important;margin: 0 !important;}

  @media (max-width: 820px) {
    [data-lunatic-core-setting-row="true"] {grid-template-columns: minmax(0,1fr) !important;row-gap: 10px !important;}

    [data-lunatic-core-setting-row="true"]
      > .MuiBox-root[display="flex"] {grid-column: 1 !important;justify-content: flex-start !important;}
  }
}

/* ===== RADIANT / ADAPTIVE MATERIAL ===== */

@layer lunatic-plugin-store-fix {
  /* =========================================================
     FEATURE FLAGS / CORE PLUGINS — canonical structural guards
     Historical foundation rules removed in 0.12.7.
     ========================================================= */

  /* Feature Flags own the full available width. */
  [data-lunatic-feature-flags-outer="true"],
  [data-lunatic-feature-flags-shell="true"],
  [data-lunatic-feature-flags-grid="true"] {display: block !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;flex: 1 1 100% !important;margin-left: 0 !important;margin-right: 0 !important;transform: none !important;translate: none !important;}

  [data-lunatic-feature-flags-grid="true"] {display: grid !important;grid-template-columns: repeat(4, minmax(0,1fr)) !important;gap: 12px 16px !important;padding: 0 !important;align-items: stretch !important;}

  [data-lunatic-feature-flag="true"] {display: flex !important;align-items: center !important;justify-content: space-between !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;min-height: 58px !important;margin: 0 !important;padding: 10px 12px !important;overflow: hidden !important;flex-basis: auto !important;}

  [data-lunatic-feature-flag-setting="true"] {display: flex !important;flex-direction: row !important;align-items: center !important;justify-content: space-between !important;width: 100% !important;min-width: 0 !important;min-height: 42px !important;margin: 0 !important;padding: 0 !important;gap: 12px !important;overflow: visible !important;}

  [data-lunatic-feature-flag-copy="true"] {flex: 1 1 auto !important;min-width: 0 !important;margin: 0 !important;}

  [data-lunatic-feature-flag-control="true"] {flex: 0 0 auto !important;position: relative !important;margin: 0 !important;}

  [data-lunatic-feature-flag-copy="true"] {min-width: 0 !important;margin-right: 10px !important;}

  @media (max-width: 1180px) {
    [data-lunatic-feature-flags-grid="true"] {grid-template-columns: repeat(2, minmax(0,1fr)) !important;}
  }

  @media (max-width: 700px) {
    [data-lunatic-feature-flags-grid="true"] {grid-template-columns: minmax(0,1fr) !important;}
  }

  /* Core Plugins are one full-width vertical flow. */
  [data-lunatic-core-plugins-shell="true"],
  [data-lunatic-core-plugins-grid="true"] {box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;transform: none !important;translate: none !important;}

  [data-lunatic-core-plugins-grid="true"] {display: flex !important;flex-direction: column !important;gap: 14px !important;}

  [data-lunatic-core-plugin="true"] {display: block !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;height: auto !important;min-height: 0 !important;max-height: none !important;overflow: visible !important;}

  [data-lunatic-core-plugin-header="true"] {display: flex !important;flex-direction: column !important;align-items: stretch !important;width: 100% !important;min-width: 0 !important;max-width: none !important;height: auto !important;min-height: 0 !important;margin: 0 !important;padding: 0 !important;overflow: visible !important;}

  [data-lunatic-core-plugin-header-stack="true"] {display: grid !important;grid-template-columns: minmax(0,1fr) repeat(3,40px) !important;grid-template-rows: 40px 18px !important;column-gap: 8px !important;row-gap: 2px !important;align-items: center !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;padding: 0 !important;overflow: visible !important;}

  [data-lunatic-core-plugin-title="true"] {grid-column: 1 !important;grid-row: 1 !important;display: block !important;position: static !important;width: auto !important;min-width: 0 !important;max-width: 100% !important;margin: 0 !important;padding: 0 !important;line-height: 24px !important;white-space: nowrap !important;overflow: hidden !important;text-overflow: ellipsis !important;transform: none !important;translate: none !important;}

  [data-lunatic-core-plugin-action] {grid-row: 1 !important;position: relative !important;place-self: center !important;box-sizing: border-box !important;width: 40px !important;min-width: 40px !important;max-width: 40px !important;height: 40px !important;min-height: 40px !important;max-height: 40px !important;margin: 0 !important;padding: 8px !important;transform: none !important;translate: none !important;}

  [data-lunatic-core-plugin-action="reload"] {grid-column: 2 !important;}
  [data-lunatic-core-plugin-action="live-reload"] {grid-column: 3 !important;}
  [data-lunatic-core-plugin-action="settings"] {grid-column: 4 !important;}

  [data-lunatic-core-plugin-spacer="true"] {display: none !important;}

  [data-lunatic-core-plugin-author="true"] {grid-column: 1 / -1 !important;grid-row: 2 !important;display: flex !important;align-items: center !important;justify-content: flex-start !important;width: 100% !important;min-width: 0 !important;max-width: none !important;height: 18px !important;min-height: 18px !important;max-height: 18px !important;margin: 0 !important;padding: 0 !important;overflow: hidden !important;}

  [data-lunatic-core-plugin-author-avatar="true"] {display: none !important;}

  [data-lunatic-core-plugin-author-name="true"] {display: block !important;width: auto !important;height: 18px !important;margin: 0 !important;padding: 0 !important;line-height: 18px !important;white-space: nowrap !important;}

  [data-lunatic-core-plugin-description="true"] {display: block !important;position: static !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 12px 0 0 !important;padding: 0 !important;overflow: visible !important;transform: none !important;translate: none !important;}
/* Opened settings and nested MUI grids must own the entire card width. */
  [data-lunatic-core-plugin="true"] > :not([data-lunatic-core-plugin-header="true"]) {display: block !important;box-sizing: border-box !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin-left: 0 !important;margin-right: 0 !important;overflow: visible !important;}

  [data-lunatic-core-plugin-content="true"] > * {box-sizing: border-box !important;min-width: 0 !important;max-width: 100% !important;}

  [data-lunatic-core-plugin-content="true"] .MuiGrid-root.MuiGrid-container,
  [data-lunatic-core-plugin="true"] .MuiGrid-root.MuiGrid-container {display: grid !important;grid-template-columns: minmax(0,1fr) !important;gap: 12px !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;padding: 0 !important;}

  [data-lunatic-core-plugin-content="true"] .MuiGrid-root:not(.MuiGrid-container),
  [data-lunatic-core-plugin="true"] .MuiGrid-root:not(.MuiGrid-container) {display: block !important;width: 100% !important;min-width: 0 !important;max-width: none !important;margin: 0 !important;padding: 0 !important;flex: 0 0 100% !important;}
}

@layer lunatic-plugin-store-fix {
  /* Transform locks are structural: keep controls in their assigned cells. */
  [data-lunatic-installed-plugin-action],
  [data-lunatic-installed-plugin-action] svg,
  [data-lunatic-theme-reload="true"],
  [data-lunatic-theme-delete="true"],
  [data-lunatic-theme-action="true"],
  [data-lunatic-theme-reload="true"] svg,
  [data-lunatic-theme-delete="true"] svg,
  [data-lunatic-theme-action="true"] svg {
    transform: none !important;
  }
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     VISUAL-OFF STRUCTURAL GUARDS
     These are neutral resets, not Lunatic palette. They keep Luna/MUI's own
     fills and colours while preventing stock Paper/Card styling from changing
     the geometry that Layout & UX fixes establish.
     ========================================================= */

  [data-lunatic-installed-plugin="true"],
  [data-lunatic-installed-plugin-header="true"],
  [data-lunatic-installed-plugin-header-stack="true"],
  [data-lunatic-core-plugin="true"],
  [data-lunatic-core-plugin-header="true"],
  [data-lunatic-core-plugin-header-stack="true"] {
    box-sizing: border-box !important;
  }

  [data-lunatic-installed-plugin-header="true"],
  [data-lunatic-installed-plugin-header-stack="true"],
  [data-lunatic-core-plugin-header="true"],
  [data-lunatic-core-plugin-header-stack="true"] {
    min-width: 0 !important;
    max-width: none !important;
  }
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     INSTALLED PLUGIN SETTINGS — semantic layout
     Replaces old theme.ts rules tied to Emotion css-* hashes.
     ========================================================= */

  [data-lunatic-installed-plugin-settings-shell="true"] {
    box-sizing: border-box !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin-top: 8px !important;
  }

  [data-lunatic-installed-plugin-settings="true"] {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0,1fr)) !important;
    gap: 10px 18px !important;
    align-items: stretch !important;
    box-sizing: border-box !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  [data-lunatic-installed-plugin-setting="true"] {
    display: grid !important;
    grid-template-columns: minmax(0,1fr) 42px !important;
    grid-template-areas: "copy control" !important;
    align-items: center !important;
    column-gap: 14px !important;
    box-sizing: border-box !important;
    width: 100% !important;
    min-width: 0 !important;
    min-height: 56px !important;
    margin: 0 !important;
    padding: 8px 12px !important;
    overflow: visible !important;
  }

  [data-lunatic-installed-plugin-setting-copy="true"] {
    grid-area: copy !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    overflow: visible !important;
  }

  [data-lunatic-installed-plugin-setting-control="true"] {
    grid-area: control !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-end !important;
    width: 42px !important;
    min-width: 42px !important;
    max-width: 42px !important;
    min-height: 32px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  [data-lunatic-installed-plugin-setting-control-type="switch"] {
    flex: 0 0 auto !important;
    margin: 0 !important;
  }

  [data-lunatic-installed-plugin-setting="true"]
    :is(.MuiTypography-h8,.MuiTypography-subtitle2) {
    display: block !important;
    min-width: 0 !important;
    overflow-wrap: anywhere !important;
  }

  [data-lunatic-installed-plugin-setting="true"] .MuiTypography-subtitle2 {
    margin: 3px 0 0 !important;
    white-space: normal !important;
  }

  /* Controls wider than a switch need the full second row. */
  [data-lunatic-installed-plugin-setting-kind="button"],
  [data-lunatic-installed-plugin-setting-kind="field"] {
    grid-column: 1 / -1 !important;
    grid-template-columns: minmax(0,1fr) !important;
    grid-template-areas:
      "copy"
      "control" !important;
    row-gap: 8px !important;
  }

  [data-lunatic-installed-plugin-setting-kind="button"]
    [data-lunatic-installed-plugin-setting-control="true"],
  [data-lunatic-installed-plugin-setting-kind="field"]
    [data-lunatic-installed-plugin-setting-control="true"] {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    justify-content: flex-start !important;
  }

  [data-lunatic-installed-plugin-setting-control-type="field"] {
    flex: 1 1 auto !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin: 0 !important;
  }

  @media (max-width: 900px) {
    [data-lunatic-installed-plugin-settings="true"] {
      grid-template-columns: minmax(0,1fr) !important;
    }
  }
}

@layer lunatic-plugin-store-fix {
  /* =========================================================
     SETTINGS CONTENT SPACING / STOCK LUNA CORRECTIONS
     ========================================================= */

  /* LunaSettings renders title/description as the first child of the shell.
     Give that block breathing room so copy does not visually touch the card
     edge. This is geometry, not theme decoration. */
  [data-lunatic-installed-plugin-settings-intro="true"] {
    box-sizing: border-box !important;
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 10px 12px 6px !important;
  }

  [data-lunatic-installed-plugin-settings-intro="true"]
    > .MuiTypography-subtitle2 {
    margin-bottom: 0 !important;
  }

}

`;
