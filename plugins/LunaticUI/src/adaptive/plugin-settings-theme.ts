/**
 * Compact plugin settings through the @luna/ui MuiTheme API (TidaLuna 1.21.9+).
 *
 * Same look as plugin-settings-layout.ts (the DOM observer used with older Luna builds), but expressed as
 * theme overrides of Luna's setting components, so nothing watches or rewrites the DOM. Scoped to the
 * plugin settings Lunatic renders in its Plugins tab; the group grid itself lives in css.ts.
 */
import type { LunaUnload } from "@luna/core";
import * as lunaUi from "@luna/ui";
import { store as obyStore } from "oby";
import { uiPreferences } from "./plugin-state";

type ThemeOptions = Record<string, unknown>;
interface MuiThemeApi {
  override(unloads: Set<LunaUnload>, override: ThemeOptions): void;
}

const muiTheme = (lunaUi as Record<string, unknown>).MuiTheme as MuiThemeApi | undefined;

/** Selector prefix that limits a style to Lunatic's plugin settings sections */
const inSettings = '[data-lunatic-adaptive-core-plugin-settings="true"] &';

const quietText = {
  margin: 0,
  padding: 0,
  overflow: "visible",
  whiteSpace: "normal",
  textOverflow: "clip",
  overflowWrap: "anywhere",
  fontSize: 12,
  lineHeight: 1.25,
  opacity: 0.46,
};

function pluginSettingsTheme(descriptionsOnHover: boolean): ThemeOptions {
  const groupDescription = descriptionsOnHover
    ? {
        // Shown as a small bubble while hovering the category title
        display: "none",
        position: "absolute",
        zIndex: 2,
        top: "100%",
        left: 0,
        maxWidth: 320,
        padding: "6px 8px",
        borderRadius: 6,
        background: "rgba(18, 18, 20, .96)",
        boxShadow: "0 6px 18px rgba(0, 0, 0, .35)",
        opacity: 1,
      }
    : { display: "block", margin: "-1px 0 6px" };

  return {
    components: {
      // A plugin's LunaSettings group becomes one compact card: title, description and rows
      LunaSettings: {
        styleOverrides: {
          root: {
            [inSettings]: {
              boxSizing: "border-box",
              alignSelf: "stretch",
              width: "100%",
              minWidth: 0,
              margin: 0,
              padding: "11px 12px",
              border: "1px solid color-mix(in srgb, currentColor 9%, transparent)",
              borderRadius: 10,
              background: "color-mix(in srgb, currentColor 2.2%, transparent)",
              boxShadow: "none",
              "& > .LunaTitle-root": { position: "relative", cursor: "help" },
              "& > .LunaTitle-root .LunaTitle-title": {
                display: "block",
                margin: "0 0 4px",
                padding: 0,
                fontSize: 13,
                fontWeight: 650,
                lineHeight: 1.25,
                letterSpacing: ".01em",
                opacity: 0.62,
              },
              "& > .LunaTitle-root .LunaTitle-desc": { ...quietText, ...groupDescription },
              ...(descriptionsOnHover && { "& > .LunaTitle-root:hover .LunaTitle-desc": { display: "block" } }),
            },
          },
          spacer: { [inSettings]: { display: "none" } },
          content: {
            [inSettings]: {
              display: "block",
              width: "100%",
              minWidth: 0,
              margin: 0,
              padding: 0,
              gap: 0,
              background: "transparent",
              border: 0,
              borderRadius: 0,
              boxShadow: "none",
              "& > :not(style) ~ :not(style)": { margin: 0 },
            },
          },
        },
      },
      // One setting: title and description on the left, controls on the right
      LunaSetting: {
        styleOverrides: {
          root: {
            [inSettings]: {
              position: "relative",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "center",
              columnGap: 10,
              boxSizing: "border-box",
              width: "100%",
              minWidth: 0,
              minHeight: 36,
              margin: 0,
              padding: "4px 0",
              border: 0,
              borderRadius: 0,
              background: "transparent",
              boxShadow: "none",
              "& > :not(style) ~ :not(style)": { margin: 0 },
              "& > .LunaTitle-root": { minWidth: 0 },
              "& > .LunaTitle-root .LunaTitle-desc": { ...quietText, display: "block", margin: "2px 0 0" },
            },
            [`${inSettings} + .LunaSetting-root`]: {
              borderTop: "1px solid color-mix(in srgb, currentColor 6%, transparent)",
            },
          },
          control: {
            [inSettings]: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 7,
              minWidth: 0,
              margin: 0,
              padding: 0,
              "& .MuiTextField-root, & > .MuiInputBase-root": { order: 1, width: 170, minWidth: 135, margin: 0 },
              "& .MuiSwitch-root": { order: 0, flex: "0 0 auto", margin: 0 },
              "& .MuiButton-root": { order: 1, flex: "0 0 auto", margin: 0 },
            },
          },
        },
      },
    },
  };
}

let users = 0;
let uninstall: (() => void) | undefined;

function install() {
  const themeUnloads = new Set<LunaUnload>();
  const apply = () => {
    for (const unload of themeUnloads) unload();
    themeUnloads.clear();
    muiTheme!.override(themeUnloads, pluginSettingsTheme(!!obyStore.unwrap(uiPreferences.pluginSettingCategoryDescriptionsOnHover)));
  };
  apply();
  const unloadPreference = obyStore.on(() => uiPreferences.pluginSettingCategoryDescriptionsOnHover, apply);
  return () => {
    unloadPreference?.();
    for (const unload of themeUnloads) unload();
    themeUnloads.clear();
  };
}

/**
 * Applies the compact plugin settings theme while at least one plugin settings section is mounted.
 * Returns the function that releases this section's hold.
 */
export function holdPluginSettingsTheme() {
  if (muiTheme === undefined) return () => {};
  if (users++ === 0) uninstall = install();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--users === 0) {
      uninstall?.();
      uninstall = undefined;
    }
  };
}
