/** Runtime CSS for Lunatic-owned adaptive Settings views. */

export const adaptiveStoreCss = String.raw`
[data-lunatic-cached-tab] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin-top: 16px;
  margin-left: -24px;
}

[data-lunatic-cached-tab][hidden] {
  display: none !important;
}

[data-lunatic-plugins-page="true"] {
  display: block;
  width: 100%;
  min-width: 0;
}

[data-lunatic-plugin-organizer="true"] {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 220px) minmax(150px, 200px) minmax(150px, 200px);
  align-items: end;
  gap: 10px;
  width: 100%;
  min-width: 0;
  margin-bottom: 8px;
}

[data-lunatic-plugin-organizer="true"] input,
[data-lunatic-plugin-organizer="true"] select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 36px;
  font: inherit;
}

[data-lunatic-plugin-organizer-summary="true"] {
  min-height: 18px;
  margin: 0 0 8px;
}

[data-lunatic-field-label-with-help="true"] {
  display: inline-flex;
  align-items: flex-start;
  gap: 2px;
}

[data-lunatic-sort-info="true"] {
  display: inline-block;
  position: relative;
  top: -2px;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  opacity: .48;
  cursor: help;
}
[data-lunatic-sort-info="true"]:hover { opacity: .9; }

[data-lunatic-plugin-list="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 8px 10px;
  width: 100%;
  min-width: 0;
}

[data-lunatic-native-installed-plugin="true"] {
  display: block;
  box-sizing: border-box;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  margin: 0;
  border: 1px solid var(--wave-color-solid-base-bright, #18181b);
  border-radius: 10px;
  background: color-mix(in srgb, var(--wave-color-solid-base-bright, #18181b) 55%, var(--wave-color-solid-base-fill, #000));
  color: var(--wave-color-text-main, #fff);
}

[data-lunatic-native-installed-plugin="true"][data-lunatic-plugin-expanded="true"] {
  grid-column: 1 / -1;
  align-self: start;
  border-color: var(--wave-color-solid-base-brighter, #242429);
  background: color-mix(in srgb, var(--wave-color-solid-base-bright, #18181b) 65%, var(--wave-color-solid-base-fill, #000));
}

[data-lunatic-native-installed-plugin-header="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 104px;
  align-items: start;
  gap: 8px;
  min-width: 0;
}

[data-lunatic-native-installed-plugin-copy="true"] {
  min-width: 0;
}

[data-lunatic-native-installed-plugin-actions="true"] {
  display: grid;
  grid-template-columns: repeat(3, 32px);
  grid-template-rows: repeat(2, 34px);
  grid-template-areas:
    "settings enable enable"
    "reload live delete";
  place-content: start end;
  align-items: center;
  justify-items: center;
  gap: 2px;
  width: 104px;
  min-width: 104px;
}

[data-lunatic-action-slot] {
  display: grid;
  place-items: center;
  width: 32px;
  min-width: 32px;
  height: 34px;
  min-height: 34px;
}

[data-lunatic-action-slot="enable"] { grid-area: enable; width: 66px; }
[data-lunatic-action-slot="delete"] { grid-area: delete; }
[data-lunatic-action-slot="reload"] { grid-area: reload; }
[data-lunatic-action-slot="live"] { grid-area: live; }
[data-lunatic-action-slot="settings"] { grid-area: settings; }

[data-lunatic-native-installed-plugin-actions="true"] .MuiIconButton-root {
  width: 32px !important;
  min-width: 32px !important;
  height: 32px !important;
  min-height: 32px !important;
  margin: 0 !important;
  padding: 4px !important;
}

[data-lunatic-native-installed-plugin-actions="true"] .MuiSwitch-root {
  margin: 0 !important;
  align-self: center !important;
  transform: scale(.92);
  transform-origin: center;
}

[data-lunatic-installed-plugin-title="true"] {
  display: block;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--wave-color-text-main, #fff);
  font-weight: 700;
  line-height: 20px;
}

[data-lunatic-installed-plugin-title="true"] > :first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
}

[data-lunatic-installed-plugin-meta="true"] {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0 5px;
  min-width: 0;
  margin-top: 1px;
  color: var(--wave-color-text-tertiary, #787887);
  font-size: 11px;
  line-height: 16px;
}

[data-lunatic-plugin-meta-separator="true"] {
  opacity: .62;
}

[data-lunatic-plugin-version="true"],
[data-lunatic-installed-plugin-author="true"] {
  color: inherit;
}

[data-lunatic-plugin-description="true"] {
  display: -webkit-box;
  min-width: 0;
  margin-top: 4px;
  overflow: hidden;
  color: var(--wave-color-text-secondary, #afafb6);
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

[data-lunatic-native-installed-plugin="true"][data-lunatic-plugin-expanded="true"]
  [data-lunatic-plugin-description="true"] {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
}

[data-lunatic-plugin-error="true"] {
  margin-top: 5px;
}

[data-lunatic-installed-plugin-settings-shell="true"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin-top: 8px;
  padding-top: 9px;
  border-top: 1px solid var(--wave-color-solid-base-bright, #18181b);
}

@media (max-width: 820px) {
  [data-lunatic-plugin-list="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-lunatic-plugin-organizer="true"] {
    grid-template-columns: minmax(0, 1fr);
  }
}

[data-lunatic-plugin-store-page="true"] {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

[data-lunatic-native-store-controls="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  min-width: 0;
  margin: 0 0 16px;
}

[data-lunatic-native-field="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 5px;
  min-width: 0;
}

[data-lunatic-native-field="true"] input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  font: inherit;
}

[data-lunatic-native-url-row="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

[data-lunatic-native-store="true"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 22px 28px 26px;
  margin: 0 0 16px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, currentColor 2%, transparent);
}

[data-lunatic-native-store-header="true"] {
  display: block;
  width: 100%;
  min-width: 0;
  margin: 0 0 12px;
}

[data-lunatic-native-store-title-row="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

[data-lunatic-native-store-title="true"] {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

[data-lunatic-native-store-actions="true"] {
  display: flex;
  align-items: center;
  gap: 8px;
}

[data-lunatic-native-store-grid="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  min-width: 0;
  align-items: stretch;
}

[data-lunatic-native-plugin-card="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 14px 20px 18px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 2.5%, transparent);
}

[data-lunatic-native-plugin-card="true"] [data-lunatic-plugin-action="true"] {
  position: static !important;
  inset: auto !important;
  transform: none !important;
  justify-self: end;
  align-self: end;
}

[data-lunatic-native-plugin-card-body="true"],
[data-lunatic-native-plugin-card-heading="true"],
[data-lunatic-native-plugin-card="true"] [data-lunatic-plugin-description="true"] {
  min-width: 0;
}

[data-lunatic-native-plugin-card-heading="true"] {
  display: flex;
  align-items: baseline;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
}

[data-lunatic-native-plugin-card-heading="true"] > :first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-lunatic-native-plugin-card="true"] [data-lunatic-plugin-description="true"] {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  overflow-wrap: anywhere;
}


[data-lunatic-search="true"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  color: inherit;
  color-scheme: dark;
  font: inherit;
  outline: none;
}

[data-lunatic-search="true"]:focus {
  border-color: color-mix(in srgb, currentColor 34%, transparent);
}

[data-lunatic-page-search-field="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  width: 100%;
  min-width: 0;
  margin: 0 0 12px;
}

[data-lunatic-page-search-field="true"] > span {
  font-size: 11px;
  line-height: 14px;
  opacity: .58;
}

[data-lunatic-store-toolbar="true"] {
  display: grid;
  grid-template-columns: minmax(220px, 1.8fr) repeat(3, minmax(140px, .7fr));
  gap: 10px;
  width: 100%;
  min-width: 0;
  margin: 0 0 10px;
}

[data-lunatic-store-control] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  min-width: 0;
}

[data-lunatic-store-control] > span,
[data-lunatic-store-install-field="true"] > span {
  font-size: 11px;
  line-height: 14px;
  opacity: .58;
}

[data-lunatic-store-control] input,
[data-lunatic-store-install-field="true"] input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  color: inherit;
  color-scheme: dark;
  font: inherit;
  outline: none;
}

[data-lunatic-store-control] input:focus,
[data-lunatic-store-install-field="true"] input:focus {
  border-color: color-mix(in srgb, currentColor 34%, transparent);
}

[data-lunatic-select="true"] {
  position: relative;
  min-width: 0;
}

[data-lunatic-select-button="true"] {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 8px 0 10px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

[data-lunatic-select-button="true"] > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-lunatic-select-button="true"] svg {
  width: 18px;
  height: 18px;
  opacity: .68;
  transition: transform 120ms ease;
}

[data-lunatic-select="true"][data-lunatic-select-open="true"] [data-lunatic-select-button="true"] {
  border-color: color-mix(in srgb, currentColor 34%, transparent);
}

[data-lunatic-select="true"][data-lunatic-select-open="true"] [data-lunatic-select-button="true"] svg {
  transform: rotate(180deg);
}

[data-lunatic-select-button="true"]:disabled {
  opacity: .55;
  cursor: default;
}

[data-lunatic-select-menu="true"] {
  position: absolute;
  z-index: 1000;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  display: grid;
  gap: 2px;
  max-height: min(280px, 42vh);
  padding: 4px;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 8px;
  background: var(--wave-color-solid-base-bright, #18181b);
  box-shadow: 0 10px 26px rgba(0, 0, 0, .34);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

[data-lunatic-select-option="true"] {
  width: 100%;
  min-height: 30px;
  padding: 5px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--wave-color-text-main, #fff);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

[data-lunatic-select-option="true"]:hover,
[data-lunatic-select-option="true"][aria-selected="true"] {
  background: color-mix(in srgb, currentColor 10%, transparent);
}

[data-lunatic-store-secondary-row="true"] {
  display: grid;
  grid-template-columns: minmax(220px, 1.8fr) repeat(3, minmax(140px, .7fr));
  align-items: end;
  gap: 10px;
  width: 100%;
  min-width: 0;
  margin: 0 0 12px;
}

[data-lunatic-store-install-field="true"] {
  display: grid;
  grid-column: 1;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  min-width: 0;
}

[data-lunatic-store-install-row="true"] {
  position: relative;
  display: block;
  min-width: 0;
}

[data-lunatic-store-secondary-actions="true"] {
  grid-column: 2 / 5;
  display: flex;
  align-items: end;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

[data-lunatic-store-filter-chips="true"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  min-width: 0;
  min-height: 36px;
}

[data-lunatic-store-secondary-actions="true"] > [data-lunatic-store-filter-chips="true"] {
  flex: 1 1 auto;
}

[data-lunatic-store-filter-chip="true"] {
  box-sizing: border-box;
  min-height: 30px;
  padding: 5px 9px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 5%, transparent);
  color: inherit;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

[data-lunatic-store-result-count="true"] {
  margin: 0 0 8px;
  font-size: 11px;
  opacity: .52;
}

[data-lunatic-store-local-section="true"] {
  margin: 0 0 14px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 3.5%, transparent);
}

[data-lunatic-store-local-heading="true"] {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 36px;
  align-items: center;
  gap: 7px;
  width: 100%;
  margin: 0 2px 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

[data-lunatic-store-local-section="true"][data-lunatic-store-local-collapsed="true"] [data-lunatic-store-local-heading="true"] {
  margin-bottom: 0;
}

[data-lunatic-store-local-heading="true"] strong {
  font-size: 12px;
  font-weight: 650;
}

[data-lunatic-store-local-heading="true"] span {
  font-size: 10px;
  opacity: .48;
}

[data-lunatic-store-local-chevron="true"] {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  opacity: .66 !important;
}

[data-lunatic-store-local-chevron="true"] svg {
  display: block;
  width: 30px;
  height: 30px;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: transform 120ms ease;
}

[data-lunatic-store-local-section="true"][data-lunatic-store-local-collapsed="true"] [data-lunatic-store-local-chevron="true"] svg {
  transform: rotate(0deg);
}

[data-lunatic-store-local-heading="true"]:hover [data-lunatic-store-local-chevron="true"] {
  opacity: .92 !important;
}

[data-lunatic-store-flat-grid="true"],
[data-lunatic-store-group-grid="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  width: 100%;
  min-width: 0;
  align-items: stretch;
}

[data-lunatic-store-catalog-card="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 92px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, currentColor 9%, transparent);
  border-radius: 9px;
  background: color-mix(in srgb, currentColor 2.5%, transparent);
}

[data-lunatic-store-catalog-main="true"] {
  min-width: 0;
}

[data-lunatic-store-catalog-heading="true"] {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  line-height: 18px;
}

[data-lunatic-store-catalog-heading="true"] > a,
[data-lunatic-store-catalog-heading="true"] > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

[data-lunatic-store-catalog-version="true"] {
  flex: 0 0 auto;
  font-size: 11px;
  opacity: .42;
}

[data-lunatic-store-catalog-meta="true"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  min-width: 0;
  margin-top: 2px;
  font-size: 11px;
  line-height: 15px;
  opacity: .58;
}

[data-lunatic-store-catalog-meta="true"] > * + *::before {
  content: "·";
  margin: 0 6px;
  opacity: .65;
}

[data-lunatic-store-author-filter="true"] {
  display: inline;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-decoration: none;
}

[data-lunatic-store-author-filter="true"]:hover {
  text-decoration: underline;
}

[data-lunatic-store-catalog-description="true"] {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  min-width: 0;
  max-height: 32px;
  margin-top: 4px;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-size: 12px;
  line-height: 16px;
  opacity: .72;
}

[data-lunatic-store-catalog-card="true"] [data-lunatic-plugin-action="true"] {
  position: static !important;
  inset: auto !important;
  transform: none !important;
  align-self: center;
  justify-self: end;
  min-width: 84px;
}

[data-lunatic-store-groups="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

[data-lunatic-store-group="true"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 2%, transparent);
}

[data-lunatic-store-group-header="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin: 0 0 8px;
}

[data-lunatic-store-group-identity="true"] {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

[data-lunatic-store-group-identity="true"] > a {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

[data-lunatic-store-group-identity="true"] > span {
  font-size: 11px;
  opacity: .5;
}

[data-lunatic-store-group-actions="true"] {
  display: flex;
  align-items: center;
  gap: 5px;
}

[data-lunatic-store-group-description="true"] {
  margin: -2px 0 8px;
  font-size: 11px;
  line-height: 15px;
  opacity: .55;
}

[data-lunatic-store-loading="true"],
[data-lunatic-store-empty="true"],
[data-lunatic-store-error-summary="true"] {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 9px;
  font-size: 12px;
  opacity: .64;
}

[data-lunatic-store-error-summary="true"] {
  margin-top: 10px;
}

@media (max-width: 920px) {
  [data-lunatic-store-toolbar="true"],
  [data-lunatic-store-secondary-row="true"] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  [data-lunatic-store-install-field="true"] {
    grid-column: 1;
  }

  [data-lunatic-store-secondary-actions="true"] {
    grid-column: 2;
  }

  [data-lunatic-store-flat-grid="true"],
  [data-lunatic-store-group-grid="true"] {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 620px) {
  [data-lunatic-store-toolbar="true"],
  [data-lunatic-store-secondary-row="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-lunatic-store-install-field="true"],
  [data-lunatic-store-secondary-actions="true"] {
    grid-column: 1;
  }

  [data-lunatic-store-filter-chips="true"],
  [data-lunatic-store-secondary-actions="true"] {
    justify-content: flex-start;
  }

  [data-lunatic-store-secondary-actions="true"] {
    flex-wrap: wrap;
  }

  [data-lunatic-store-catalog-card="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-lunatic-store-catalog-card="true"] [data-lunatic-plugin-action="true"] {
    justify-self: start;
  }
}

[data-lunatic-themes-page="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

[data-lunatic-themes-meta="true"] {
  margin: 0 0 -4px;
  font-size: 12px;
  opacity: .55;
}

[data-lunatic-native-theme-field="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 5px;
  min-width: 0;
}

[data-lunatic-native-theme-url-row="true"] {
  position: relative;
  display: block;
  min-width: 0;
}

[data-lunatic-native-theme-url-row="true"] input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  font: inherit;
}

[data-lunatic-store-install-row="true"][data-lunatic-install-action-visible="true"] input,
[data-lunatic-native-theme-url-row="true"][data-lunatic-install-action-visible="true"] input {
  padding-right: 78px;
}

[data-lunatic-store-install-row="true"] > .MuiButton-root,
[data-lunatic-native-theme-url-row="true"] > .MuiButton-root {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  height: 28px;
  min-height: 28px;
  margin: 0 !important;
}

[data-lunatic-native-theme-field="true"] > span {
  font-size: 11px;
  line-height: 14px;
  opacity: .58;
}

[data-lunatic-theme-list="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  min-width: 0;
}

[data-lunatic-native-theme-card="true"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 2.5%, transparent);
}

[data-lunatic-native-theme-card="true"][data-lunatic-theme-enabled="false"] {
  background: color-mix(in srgb, currentColor 1.5%, transparent);
}

[data-lunatic-native-theme-header="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

[data-lunatic-native-theme-copy="true"] {
  min-width: 0;
}

[data-lunatic-theme-title-row="true"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

[data-lunatic-theme-title="true"] {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 700;
}

[data-lunatic-theme-author="true"] {
  margin-top: 3px;
  font-size: 12px;
  opacity: .62;
}

[data-lunatic-theme-description="true"] {
  margin-top: 8px;
  max-width: 760px;
  font-size: 12.5px;
  line-height: 1.45;
  opacity: .72;
}

[data-lunatic-theme-source="true"] {
  display: block;
  width: fit-content;
  max-width: min(760px, 100%);
  margin-top: 9px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 11px;
  opacity: .42;
}

[data-lunatic-theme-source="true"]:hover {
  opacity: .78;
}

[data-lunatic-native-theme-actions="true"] {
  display: grid;
  grid-template-columns: 56px 40px 40px;
  align-items: center;
  justify-content: end;
  gap: 6px;
  min-width: 0;
}

[data-lunatic-native-theme-actions="true"] > button {
  width: 40px;
  height: 40px;
  min-width: 40px;
  box-sizing: border-box;
}

[data-lunatic-native-theme-actions="true"] .MuiSwitch-root {
  margin: 0 !important;
  justify-self: center;
}

[data-lunatic-theme-error="true"],
[data-lunatic-theme-install-error="true"] {
  margin-top: 7px;
  font-size: 12px;
}

@media (max-width: 820px) {
  [data-lunatic-native-store-controls="true"],
  [data-lunatic-native-store-grid="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-lunatic-native-installed-plugin-header="true"],
  [data-lunatic-native-theme-header="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-lunatic-native-installed-plugin-actions="true"],
  [data-lunatic-native-theme-actions="true"] {
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  [data-lunatic-plugin-organizer="true"] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  [data-lunatic-plugin-organizer="true"] {
    grid-template-columns: minmax(0, 1fr);
  }
}

[data-lunatic-settings-root="true"] {
  /* Keep the Settings shell at a stable native-TIDAL-like vertical anchor.
     The upstream Luna container otherwise shifts when a shorter cached tab
     (Themes / Settings) becomes active. */
  margin-top: -80px !important;
  margin-bottom: 0 !important;
  min-height: calc(100dvh - var(--lunatic-playbar-clearance, 0px) - 118px) !important;
  align-self: stretch !important;
}

/* One readable panel behind the whole Settings page (tab row included), over TIDAL's own window
   background: the page shares the window background instead of painting its own, and the panel
   is TIDAL-style glass (translucent base colour + blur) so cards do not float on the backdrop. */
[data-lunatic-settings-root="true"] {
  box-sizing: border-box !important;
  padding: 8px 24px 24px !important;
  background-color: color-mix(in srgb, var(--wave-color-solid-base-fill, #000) 78%, transparent) !important;
  backdrop-filter: blur(20px) saturate(1.4) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.4) !important;
  border: 1px solid var(--wave-color-opacity-contrast-fill-ultra-thin, #ffffff1a) !important;
  border-radius: var(--wave-border-radius--regular, 12px) !important;
}

/* The panel now provides the side padding; drop the old offset that compensated for Luna's container */
[data-lunatic-settings-root="true"] [data-lunatic-cached-tab] {
  margin-left: 0 !important;
}

[data-lunatic-settings-root="true"] > .MuiTabs-root {
  /* Keep the tab strip in normal document flow. The stable root height fixes
     cross-tab vertical drift without overlaying content while the page scrolls. */
  position: relative !important;
  top: auto !important;
  z-index: auto !important;
  background: transparent !important;
}

/* Match the native TIDAL shell instead of @luna/ui's rainbow Settings page. */
#luna-page-LunaSettings,
#luna-page-LunaSettings > * {
  color: inherit;
}

div[class^="_mainContainer"] > div[class^="_bar"] > div[class^="_title"],
div[class^="_mainContainer"] > div[class^="_bar"] > div[class^="_title"] * {
  color: var(--wave-color-text-main, #fff) !important;
}

/* Keep Luna Settings tab icons monochrome. The upstream MUI theme can paint
   the selected SvgIcon cyan through generated classes/inline variables, so
   target the transformed tab shell itself and neutralize the final SVG paint. */
[data-lunatic-settings-root="true"] [role="tab"] .MuiTab-iconWrapper,
[data-lunatic-settings-root="true"] [role="tab"] .MuiSvgIcon-root,
[data-lunatic-settings-root="true"] [role="tab"] svg,
[data-lunatic-settings-root="true"] [role="tab"] svg * {
  color: rgba(255, 255, 255, .62) !important;
  fill: currentColor !important;
  stroke: currentColor !important;
}

[data-lunatic-settings-root="true"] [role="tab"] svg {
  filter: grayscale(1) saturate(0) !important;
  opacity: .68 !important;
}

[data-lunatic-settings-root="true"] [role="tab"][aria-selected="true"] .MuiTab-iconWrapper,
[data-lunatic-settings-root="true"] [role="tab"][aria-selected="true"] .MuiSvgIcon-root,
[data-lunatic-settings-root="true"] [role="tab"][aria-selected="true"] svg,
[data-lunatic-settings-root="true"] [role="tab"][aria-selected="true"] svg * {
  color: var(--wave-color-text-main, #fff) !important;
  fill: currentColor !important;
  stroke: currentColor !important;
}

[data-lunatic-settings-root="true"] [role="tab"][aria-selected="true"] svg {
  filter: grayscale(1) saturate(0) brightness(2.5) !important;
  opacity: 1 !important;
}

[data-lunatic-settings-page="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  width: 100%;
  min-width: 0;
  padding-bottom: 0;
}

[data-lunatic-settings-section] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

[data-lunatic-settings-section-header="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-bottom: 12px;
}

[data-lunatic-settings-section-header="true"] strong {
  font-size: 16px;
}

[data-lunatic-settings-section-meta="true"] {
  margin-top: 3px;
  font-size: 12px;
  opacity: .58;
}

[data-lunatic-settings-primary="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  min-width: 0;
}

[data-lunatic-settings-secondary="true"] {
  width: 100%;
  min-width: 0;
  margin-top: 4px;
  padding-top: 18px;
  border-top: 1px solid color-mix(in srgb, currentColor 8%, transparent);
}

[data-lunatic-settings-section="core-plugins"] {
  padding: 0;
}

[data-lunatic-adaptive-core-plugin-list="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 8px 10px;
}

[data-lunatic-adaptive-core-plugin-card="true"] {
  box-sizing: border-box;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 0;
  max-height: none;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 2.5%, transparent);
}

[data-lunatic-adaptive-core-plugin-card="true"][data-lunatic-core-plugin-expanded="true"] {
  grid-column: 1 / -1;
  align-self: start;
  border-color: color-mix(in srgb, currentColor 12%, transparent);
  background: color-mix(in srgb, currentColor 3.5%, transparent);
}

[data-lunatic-adaptive-core-plugin-header="true"] {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 6px;
  min-width: 0;
}

[data-lunatic-adaptive-core-plugin-card="true"][data-lunatic-core-plugin-expanded="false"]
  [data-lunatic-adaptive-core-plugin-header="true"] {
  display: block;
  padding-right: 74px;
}

[data-lunatic-adaptive-core-plugin-copy="true"] {
  min-width: 0;
}

[data-lunatic-adaptive-core-plugin-actions="true"] {
  display: grid;
  grid-template-columns: auto;
  justify-items: center;
  justify-content: end;
  gap: 1px;
  width: auto;
  min-width: 0;
}

[data-lunatic-adaptive-core-plugin-card="true"][data-lunatic-core-plugin-expanded="false"]
  [data-lunatic-adaptive-core-plugin-actions="true"] {
  position: absolute;
  top: 0;
  right: 0;
}

[data-lunatic-core-plugin-runtime-actions="true"] {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

[data-lunatic-adaptive-core-plugin-actions="true"] .MuiIconButton-root {
  width: 32px !important;
  min-width: 32px !important;
  height: 32px !important;
  min-height: 32px !important;
  margin: 0 !important;
  padding: 4px !important;
}

[data-lunatic-adaptive-core-plugin-actions="true"] > [data-lunatic-plugin-settings="true"] {
  margin-top: -6px !important;
}

[data-lunatic-core-settings-toggle-active="true"] {
  color: rgba(238, 238, 238, .88) !important;
}

[data-lunatic-adaptive-core-plugin-title="true"] {
  min-width: 0;
  font-weight: 700;
  line-height: 24px;
}

[data-lunatic-adaptive-core-plugin-author="true"] {
  margin-top: 0;
  line-height: 18px;
  opacity: .62;
}

[data-lunatic-adaptive-core-plugin-description="true"] {
  display: block;
  width: 100%;
  min-width: 0;
  margin: 4px 0 0;
  padding: 0;
  overflow: visible;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.35;
}

[data-lunatic-adaptive-core-plugin-settings="true"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin-top: 8px;
  padding: 10px 0 0;
  border-top: 1px solid color-mix(in srgb, currentColor 8%, transparent);
}

/* Generic Plugin Settings Layout System — compact category cards. */
[data-lunatic-adaptive-core-plugin-settings="true"] > .MuiBox-root,
[data-lunatic-adaptive-core-plugin-settings="true"] > .MuiStack-root {
  width: 100% !important;
  min-width: 0 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"][data-lunatic-setting-groups-grid="true"] {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  align-items: stretch !important;
  gap: 10px !important;
  width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-group="true"] {
  display: block !important;
  align-self: stretch !important;
  box-sizing: border-box !important;
  width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 11px 12px !important;
  border: 1px solid color-mix(in srgb, currentColor 9%, transparent) !important;
  border-radius: 10px !important;
  background: color-mix(in srgb, currentColor 2.2%, transparent) !important;
  box-shadow: none !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-group-title="true"] {
  display: block !important;
  margin: 0 0 4px !important;
  padding: 0 !important;
  font-size: 13px !important;
  font-weight: 650 !important;
  line-height: 1.25 !important;
  letter-spacing: .01em;
  opacity: .62 !important;
  cursor: help;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-group-description="true"] {
  display: block !important;
  margin: -1px 0 6px !important;
  padding: 0 !important;
  overflow: visible !important;
  white-space: normal !important;
  text-overflow: clip !important;
  overflow-wrap: anywhere !important;
  font-size: 12px !important;
  line-height: 1.25 !important;
  opacity: .46 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"][data-lunatic-category-descriptions="hover"]
  [data-lunatic-setting-group-description="true"] {
  display: none !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-spacer="true"],
[data-lunatic-adaptive-core-plugin-settings="true"] > [data-lunatic-setting-spacer="true"] {
  display: none !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-rows-bridge="true"] {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] {
  position: relative !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  align-items: center !important;
  column-gap: 10px !important;
  box-sizing: border-box !important;
  width: 100% !important;
  min-width: 0 !important;
  min-height: 36px !important;
  margin: 0 !important;
  padding: 4px 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] + [data-lunatic-setting-row="true"] {
  border-top: 1px solid color-mix(in srgb, currentColor 6%, transparent) !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-copy="true"] {
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-controls="true"] {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 7px !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-description="true"] {
  display: block !important;
  margin: 2px 0 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  white-space: normal !important;
  text-overflow: clip !important;
  overflow-wrap: anywhere !important;
  font-size: 12px !important;
  line-height: 1.25 !important;
  opacity: .46 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] .MuiTextField-root {
  width: 170px !important;
  min-width: 135px !important;
  margin: 0 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] .MuiSwitch-root {
  order: 0;
  flex: 0 0 auto !important;
  margin: 0 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] .MuiTextField-root,
[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] select,
[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] textarea {
  order: 1;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-row="true"] .MuiButton-root {
  order: 1;
  flex: 0 0 auto !important;
  margin: 0 !important;
}

[data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-help] {
  cursor: help;
}

[data-lunatic-adaptive-core-plugin-card="true"][data-lunatic-core-plugin-expanded="false"] [data-lunatic-adaptive-core-plugin-author="true"] {
  margin-top: 1px;
}

[data-lunatic-settings-section="client"],
[data-lunatic-settings-section="transfer"] {
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 2%, transparent);
}

[data-lunatic-settings-client-controls="true"] {
  display: grid;
  grid-template-columns: minmax(150px, 1fr);
  gap: 8px;
  align-items: center;
}

[data-lunatic-settings-client-controls="true"] [data-lunatic-select="true"] {
  width: 100%;
  min-width: 0;
}

[data-lunatic-settings-client-controls="true"] .MuiButton-root {
  width: 100%;
}

[data-lunatic-maintenance-refresh="true"] {
  color: rgba(238,238,238,.58) !important;
}

[data-lunatic-settings-transfer-controls="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

[data-lunatic-settings-inline-toggle="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

[data-lunatic-settings-inline-toggle="true"] .MuiSwitch-root {
  margin: 0 !important;
}

[data-lunatic-settings-transfer-actions="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

[data-lunatic-settings-transfer-actions="true"] .MuiButton-root {
  width: 100%;
}

[data-lunatic-feature-flags-grid="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin-top: 8px;
}

[data-lunatic-feature-flag="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px 8px;
}

@media (max-width: 820px) {
  [data-lunatic-settings-primary="true"],
  [data-lunatic-settings-client-controls="true"],
  [data-lunatic-feature-flags-grid="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-lunatic-settings-transfer-actions="true"],
  [data-lunatic-adaptive-core-plugin-list="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  [data-lunatic-adaptive-core-plugin-header="true"] {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  [data-lunatic-adaptive-core-plugin-settings="true"] [data-lunatic-setting-groups-grid="true"] {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}

[data-lunatic-supporters-page="true"] {
  display: grid;
  gap: 24px;
  width: 100%;
  min-width: 0;
}
[data-lunatic-supporters-section] {
  display: grid;
  gap: 12px;
  min-width: 0;
}
[data-lunatic-supporter-grid="true"] {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  min-width: 0;
}
[data-lunatic-supporter="true"] {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-width: 0;
  min-height: 58px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, currentColor 2%, transparent);
  text-decoration: none;
  color: inherit;
}
[data-lunatic-supporter="true"] img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex: 0 0 auto;
}
[data-lunatic-supporter="true"] span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-lunatic-stargazer-count="true"] {
  width: fit-content;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  font-size: 0.92rem;
  opacity: 0.88;
}

[data-lunatic-feature-flag-toolbar="true"] {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(150px, 190px) auto;
  gap: 10px;
  align-items: center;
  margin: 14px 0 10px;
}
[data-lunatic-feature-flag-toolbar="true"] [data-lunatic-search="true"],
[data-lunatic-feature-flag-toolbar="true"] [data-lunatic-select="true"] {
  min-width: 0;
}
[data-lunatic-feature-flag-note="true"] {
  margin: 8px 0 14px;
  color: rgba(255,255,255,.55);
  font-size: 12px;
  line-height: 1.45;
}
[data-lunatic-feature-flag-group="true"] {
  margin: 0 0 14px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  overflow: clip;
  background: rgba(255,255,255,.018);
}
[data-lunatic-feature-flag-group="true"] > summary {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px 54px 12px 14px;
  min-height: 30px;
  font-weight: 650;
  list-style: none;
  background: rgba(255,255,255,.035);
}
[data-lunatic-feature-flag-group="true"] > summary::-webkit-details-marker { display: none; }
[data-lunatic-feature-flag-chevron="true"] {
  position: absolute;
  right: 12px;
  top: 50%;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  opacity: .66;
  transform: translateY(-50%);
}
[data-lunatic-feature-flag-chevron="true"] svg {
  display: block;
  width: 30px;
  height: 30px;
  transform: rotate(0deg);
  transform-origin: 50% 50%;
  transition: transform 120ms ease;
}
[data-lunatic-feature-flag-group="true"][open] > summary [data-lunatic-feature-flag-chevron="true"] svg {
  transform: rotate(-90deg);
}
[data-lunatic-feature-flag-group="true"] > summary:hover [data-lunatic-feature-flag-chevron="true"] {
  opacity: .92;
}
[data-lunatic-feature-flag-toolbar="true"] .MuiButton-root.Mui-disabled,
[data-lunatic-feature-flag-toolbar="true"] button:disabled {
  color: inherit !important;
  opacity: .32 !important;
}
[data-lunatic-feature-flags-grid="true"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px;
  background: transparent;
}
[data-lunatic-feature-flag="true"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 8px;
  background: rgba(255,255,255,.018);
}
[data-lunatic-feature-flag-overridden="true"] {
  border-color: rgba(255,255,255,.16);
  background: rgba(255,255,255,.045);
}
[data-lunatic-feature-flag-name="true"] {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
[data-lunatic-feature-flag-description="true"] {
  margin-top: 5px;
  color: rgba(255,255,255,.58);
  font-size: 11.5px;
  line-height: 1.38;
}
[data-lunatic-feature-flag-meta="true"] {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 7px;
  color: rgba(255,255,255,.43);
  font-size: 11px;
}
[data-lunatic-feature-flag-meta="true"] strong { color: rgba(255,255,255,.82); }
[data-lunatic-feature-flags-empty="true"] {
  padding: 18px 0;
  color: rgba(255,255,255,.55);
}
@media (max-width: 900px) {
  [data-lunatic-feature-flag-toolbar="true"] { grid-template-columns: 1fr; }
  [data-lunatic-feature-flags-grid="true"] { grid-template-columns: 1fr; }
}

/* Stock third-party/core setting controls: use the surrounding UI as the color source. */
[data-lunatic-layout-owner="plugin-settings"] .MuiOutlinedInput-root,
[data-lunatic-core-plugin-content="true"] .MuiOutlinedInput-root {
  color: inherit !important;
  background: color-mix(in srgb, currentColor 4%, transparent) !important;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiOutlinedInput-root fieldset,
[data-lunatic-core-plugin-content="true"] .MuiOutlinedInput-root fieldset {
  border-color: currentColor !important;
  opacity: .22;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiOutlinedInput-root.Mui-focused fieldset,
[data-lunatic-core-plugin-content="true"] .MuiOutlinedInput-root.Mui-focused fieldset {
  opacity: .58;
}
[data-lunatic-layout-owner="plugin-settings"] input,
[data-lunatic-layout-owner="plugin-settings"] textarea,
[data-lunatic-core-plugin-content="true"] input,
[data-lunatic-core-plugin-content="true"] textarea {
  color: inherit !important;
}

/* Installed/Core plugin action semantics. */
[data-lunatic-plugin-settings="true"] {
  color: rgba(238, 238, 238, .72) !important;
}
[data-lunatic-plugin-live-reload="true"][data-lunatic-live-state="on"] {
  color: var(--wave-color-solid-rainbow-green-fill, #33ffa9) !important;
}
[data-lunatic-plugin-live-reload="true"][data-lunatic-live-state="off"] {
  color: rgba(238, 238, 238, .38) !important;
}
[data-lunatic-plugin-reload="true"] {
  color: var(--wave-color-solid-rainbow-orange-fill, #ffc45c) !important;
}
[data-lunatic-plugin-settings="true"].Mui-disabled,
[data-lunatic-plugin-live-reload="true"].Mui-disabled,
[data-lunatic-plugin-reload="true"].Mui-disabled,
[data-lunatic-plugin-settings="true"]:disabled,
[data-lunatic-plugin-live-reload="true"]:disabled,
[data-lunatic-plugin-reload="true"]:disabled {
  color: rgba(238, 238, 238, .22) !important;
  opacity: 1 !important;
}

/* Canonical stock Luna fields inside third-party/Core plugin Settings.
   Override MUI primary/focus colors generically rather than targeting Dev settings by name. */
[data-lunatic-layout-owner="plugin-settings"] .MuiFormLabel-root,
[data-lunatic-layout-owner="plugin-settings"] .MuiInputLabel-root {
  color: inherit !important;
  opacity: .62 !important;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiFormLabel-root.Mui-focused,
[data-lunatic-layout-owner="plugin-settings"] .MuiInputLabel-root.Mui-focused {
  color: inherit !important;
  opacity: .88 !important;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiOutlinedInput-root {
  color: inherit !important;
  background: color-mix(in srgb, currentColor 4%, transparent) !important;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiOutlinedInput-notchedOutline {
  border-color: currentColor !important;
  opacity: .24 !important;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
  border-color: currentColor !important;
  opacity: .38 !important;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
  border-color: currentColor !important;
  opacity: .62 !important;
}
[data-lunatic-layout-owner="plugin-settings"] .MuiInputBase-input,
[data-lunatic-layout-owner="plugin-settings"] input,
[data-lunatic-layout-owner="plugin-settings"] textarea {
  color: inherit !important;
  -webkit-text-fill-color: currentColor !important;
}

/* Adaptive Theme actions deliberately use separate markers from the legacy
   fallback so legacy grid-placement rules cannot distort the new layout. */
[data-lunatic-adaptive-theme-switch="true"] {
  margin: 0 !important;
  place-self: center !important;
}
[data-lunatic-adaptive-theme-reload="true"],
[data-lunatic-adaptive-theme-delete="true"] {
  position: static !important;
  place-self: center !important;
  width: 40px !important;
  min-width: 40px !important;
  height: 40px !important;
  min-height: 40px !important;
  margin: 0 !important;
  padding: 8px !important;
  transform: none !important;
}
[data-lunatic-adaptive-theme-reload="true"] {
  color: var(--wave-color-solid-rainbow-orange-fill, #ffc45c) !important;
}
[data-lunatic-adaptive-theme-delete="true"] {
  color: var(--wave-color-text-danger, #ff4242) !important;
}
[data-lunatic-adaptive-theme-reload="true"].Mui-disabled,
[data-lunatic-adaptive-theme-delete="true"].Mui-disabled,
[data-lunatic-adaptive-theme-reload="true"]:disabled,
[data-lunatic-adaptive-theme-delete="true"]:disabled {
  color: rgba(238, 238, 238, .22) !important;
  opacity: 1 !important;
}


/* Installed plugins grouped by state (after Inrixia/TidaLuna#197 by FlazeIGuess) */
[data-lunatic-plugin-group] + [data-lunatic-plugin-group] { margin-top: 24px; }
[data-lunatic-plugin-group-title="true"] {
  display: flex; align-items: baseline; gap: 8px; margin: 0 0 12px;
  font-family: "Square Sans Text VF", "Square Sans Text", Helvetica, Arial, sans-serif;
  font-size: 16px; font-weight: 600; line-height: 24px;
  color: var(--wave-color-text-main, #fff);
}
[data-lunatic-plugin-group-title="true"] > span {
  font-size: 12px; font-weight: 500; color: var(--wave-color-text-tertiary, #787887);
}
[data-lunatic-plugin-group="failed"] > [data-lunatic-plugin-group-title="true"] {
  color: var(--wave-color-text-danger, #ff4242);
}

`;
