# Lunatic Appearance

Standalone appearance editor extracted from the later Lunatic/Core UI experiments and adapted to the 0.14.4 split architecture.

It owns only appearance values and editing:
- HSV colour picker with alpha.
- Draft preview, Save, Discard and Reset-to-defaults workflow.
- Page/surface/control/text/border/icon tokens.
- Optional author-avatar hiding.

It does not own layout or any theme. It consumes `data-lunatic-*` hooks when Lunatic UI is installed; without Lunatic UI the editor still stores its settings, but most live Settings-page overrides have no semantic target.

## 0.15.1 / 0.1.1 cleanup
0.1.1: marks its editor as plugin-owned layout and adds responsive/min-width guards so Lunatic UI cannot collapse its custom grid.


## 0.1.3
- Apply configured action-icon colours to both installed and core plugin headers.
- Override explicit MUI SVG icon colours as well as IconButton colours.

## 0.2.0
- New option "Apply colours to all of TIDAL": page, card, text, muted text and border colours override a theme palette (`--solo-*`), which the theme publishes into TIDAL's `--wave-*` tokens — so the editor recolours TIDAL and Lunatic UI together. Off by default.

## 0.2.1
- Fixed: with the SettingsTabs API the page colour painted only the tab content box under the tab row; it now paints the whole settings page.
- Load message goes to the console instead of a toast.

## 0.2.2
- The page colour is applied translucent (78%) to Lunatic UI's settings panel, so the window background shows through the glass.
