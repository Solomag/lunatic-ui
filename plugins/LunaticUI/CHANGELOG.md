# Lunatic UI changelog

## 0.42.2 — Shared background, one settings panel

- The Settings page no longer paints its own page background: it shows TIDAL's window background (with a theme, the same backdrop as the rest of TIDAL).
- The whole Settings page, tab row included, sits on one TIDAL-style glass panel (translucent base colour, 20px blur, hairline border, regular radius) so cards no longer float on the backdrop.
- Content is centred in the panel (the old -24px offset is dropped inside it).

## 0.42.1 — Fixes from the first TidaLunar run

- Plugin cards no longer get their header drawn as a second card inside the card: the "framed child" rules now also skip the adaptive header (`data-lunatic-native-installed-plugin-header`).
- On the SettingsTabs API path, themes that frame Luna's tab container by its MUI class  no longer leave a dark box under the tab row.
- The load/unload messages go to the console instead of a toast on every load, and name the path actually used (SettingsTabs API / takeover / legacy).

## 0.42.0 — Store registry, opt-in downloads, preview images

After Inrixia/TidaLuna#195 and #197 by FlazeIGuess (MS-PL).

- On Luna builds with the store registry (Solomag/TidaLuna `feat/store-list`) the Plugin Store reads and changes the store list through `@luna/ui` (`visibleStores`, `addToStores`, `removeStore`); removing a default store hides it instead of it coming back. Older Luna keeps using the flat `storeUrls` list (`src/adaptive/store-state.ts`).
- Download counts are shown only when the plugin (`showDownloads` in its package) or its store opted in; a plugin's own `false` wins over its store. Sorting by downloads still works without printing the numbers.
- Store cards show a plugin's `image` as a 16:9 preview, click to open full size (`src/adaptive/preview-image.tsx`). Only https images on GitHub hosts are shown, so a listed author cannot log the IP of everyone opening the store.

## 0.41.0 — TIDAL tokens, TIDAL icons, plugin groups

Ideas and parts adapted from Inrixia/TidaLuna#197 by FlazeIGuess (MS-PL), with thanks.

- Colours follow TIDAL's own `--wave-*` design tokens instead of hard-coded values, so the Settings page follows TIDAL when it retunes its palette. Card surfaces are mixed from TIDAL's base tokens to keep the previous depth; the page background is `--wave-color-solid-base-fill`.
- Plugin Store and Themes tabs use icons from TIDAL's own sprite (`src/adaptive/tidal-icons.tsx`, adapted from `LunaIcon`); if TIDAL drops a symbol Luna's icon stays.
- Installed plugins are grouped into "Failed to load", "Enabled" and "Disabled" and move between groups as their state changes. With Solomag/TidaLuna `feat/plugin-error-attribution` only real load failures land in the first group; runtime errors stay with their plugin.

## 0.40.1 — Legacy fallback only where needed

- On the SettingsTabs API path the legacy DOM fallback runtime is no longer created at all (no document-wide capture listeners, no description popover, no MutationObserver). It is still created on Luna builds without the API.

## 0.40.0 — SettingsTabs API

- When the running Luna exposes the `@luna/ui` `SettingsTabs` API (Solomag/TidaLuna `feat/settings-tab-api`), Lunatic mounts its views through it instead of patching the Settings page React tree.
- Plugins, Plugin Store, Themes, Settings and Supporters are replaced with `SettingsTabs.override` (kept alive between switches); Feature Flags is a registered tab; hiding Supporters is an override. All of it follows the preferences live and is reverted on unload.
- No structural health check or legacy DOM fallback is needed on that path; the page background is set through `settingsPage.pageStyles`.
- Existing CSS keeps applying: Lunatic still wraps each view in `data-lunatic-cached-tab` and marks the root with `data-lunatic-settings-root`; Luna's own tab container spacing is reset.
- On a stock Luna without the API the previous takeover path is used unchanged.
- New module: `src/adaptive/tabs-api.tsx`.

## 0.39.0 — Plugins density and contrast

- Begins the Installed Plugins cleanup after the completed Settings UI milestone.
- Reflows installed plugin cards into the same compact two-column rhythm used by Core Plugins, with responsive one-column fallback on narrow layouts.
- Makes a plugin with its Settings expanded span the full grid width so third-party settings keep the available horizontal space.
- Compacts the action deck from 36 px controls to the Core-style 32 px geometry while preserving the existing settings / enable / reload / live-reload / uninstall layout and semantic action colors.
- Combines version and author into one metadata line and limits collapsed descriptions to two lines, reducing empty vertical space without shrinking the actual typography.
- Replaces the near-black `currentColor` card surface with the native TIDAL Settings palette measured from the current client: `#0e0e10` surface, neutral `#18181b` border, brighter primary text and clearer secondary/body text hierarchy.
- Scopes the older Plugin Store description clamp to Store cards only, preventing it from overriding the new Installed Plugin description geometry.

## 0.38.3 — Settings top position and scroll flow

- Raises the entire Luna Settings shell another 32 px (from `-48px` to `-80px`) to match the requested initial vertical position more closely.
- Removes sticky positioning from the Settings tab bar. Tabs now remain in normal document flow, so long pages scroll naturally and content can no longer pass underneath an opaque pinned tab strip.
- Keeps the stable viewport-relative minimum height from 0.38.2, which still prevents shorter tabs such as Themes and Settings from pulling the tab row downward when switching views.
- Retains the completed monochrome tab icons, cyan underline, native-black Settings shell, cached Plugin Store, shared controls and payload-safe Log Out flow.

## 0.38.2 — Settings positioning and icon lock

- Forces Luna Settings tab icons through the transformed Lunatic shell rather than the outer page ID, including MUI wrapper, SVG descendants and a final grayscale/saturation neutralizer. This closes the remaining cyan selected-icon leak while keeping the cyan tab underline unchanged.
- Moves the full Settings shell further upward to the requested native-TIDAL-like position.
- Gives the Settings root a stable viewport-relative minimum height so shorter tabs such as Themes and Settings no longer pull the entire tab strip downward when switching away from taller views such as Plugin Store.
- Keeps the tab bar pinned to the top of the Settings shell while scrolling long pages, using the native black shell background so the position stays visually stable.
- Retains the 0.38.1 theme-only URL field, aligned Store/Themes controls, payload-safe Log Out, cached Plugin Store and native-black shell.

## 0.38.1 — Settings milestone polish

- Restricts Themes `Install from URL` to actual `.css` theme URLs. Plugin/store URL loading remains in Plugin Store, so the Themes field no longer advertises unrelated plugin/store installs.
- Changes the Themes placeholder to `Paste theme URL…` and reports a clear error for non-CSS URLs.
- Makes Plugin Store `Install from URL` use the exact same first-column width as Search instead of the slightly wider 50/50 secondary-row layout.
- Keeps both Themes and Plugin Store URL inputs full-width even while the conditional Load button is visible by placing that action inside the field surface rather than shrinking the input.
- Strengthens tab-icon monochrome overrides down to the MUI icon wrapper, SVG and SVG path level. The active icon is white and inactive icons are neutral gray; the cyan tab indicator itself remains unchanged.
- Raises the full Luna Settings shell by 12 px and reduces the owned-tab content gap from 24 px to 16 px, moving the interface closer to the vertical placement of native TIDAL Settings while preserving PlayBar clearance.
- Retains the 0.38.0 native-black shell, self-healing white `TIDALuna BETA` title, cached Plugin Store and payload-safe Log Out flow.

## 0.38.0 — Settings UI milestone

- Completes the current Luna Settings shell milestone after the 0.37.x Plugin Store and control-system work.
- Adds an in-field hint to Themes `Install from URL`: `Paste theme, plugin, or store URL…`.
- Removes Luna cyan from Settings tab icons. Inactive icons use the same neutral monochrome scale as TIDAL; the active tab icon is white.
- Makes the injected `TIDALuna BETA` shell title self-healing across account/session transitions. TIDAL can replace its native title node after relogin, while `@luna/lib` only injects the Luna title once at startup; Lunatic now restores the known title when that replacement occurs.
- Keeps the entire `TIDALuna BETA` title monochrome white, including after relogin or shell reconstruction.
- Retains the confirmed payload-safe Log Out confirmation, native-black Settings background, shared Lunatic dropdown/search controls, persistent Plugin Store cache/filter state, local pins and GitHub release metrics from the 0.37.x stabilization cycle.

## 0.37.8

- Fixes the confirmed Log Out crash identified in TIDAL 2.43.2.21 logs. Lunatic now preserves the original `session/LOGOUT` action-creator argument and replays it with `initiatedByUser` intact after confirmation, instead of dispatching a payload-less logout that crashes TIDAL's session saga.
- Keeps the preferred Luna/Material Log Out confirmation UI; Cancel remains one-click and confirmed Log Out now follows TIDAL's expected action payload contract.
- Removes the cyan inline color from the injected `Luna Settings` profile-menu entry so it inherits the same foreground as neighboring native TIDAL items.
- Changes the Luna Settings page background from TidaLuna's rainbow gradient to native TIDAL black (`#000000`).
- Forces the injected `TIDALuna BETA` title accents to white so the whole title matches the native monochrome shell.
- Adds a bounded scrollable menu to the shared Lunatic dropdown, preventing the long TidaLuna release selector from extending under the PlayBar.
- Applies the shared Lunatic input styling to Themes `Install from URL`, matching the search fields used across the other adaptive pages.
- Stops sending `If-None-Match` / `If-Modified-Since` headers to the localhost dev Store. Those headers triggered a CORS preflight that `127.0.0.1:3000` does not allow; local Store refreshes now use a simple GET while retaining snapshot comparison.

## 0.37.7

- Reworks Log Out safety at the actual TIDAL Redux boundary. Lunatic now lets the original profile-menu click run normally, intercepts and cancels only the `session/LOGOUT` action it emits, opens the existing Luna/Material confirmation after the menu closes, and replays the same logout action once on approval. This avoids detached DOM clicks and avoids guessing a separate modal action.
- Extracts the compact Plugin Store dropdown into a reusable Lunatic select control and applies it to every Lunatic-owned select: Installed Plugins sort/settings/state filters, Feature Flags state filter, and TIDALuna release selection. Native Windows/Chromium `<select>` rendering is no longer used by Lunatic-owned adaptive views.
- Extracts the Plugin Store search field into a reusable Lunatic search control and uses the same geometry/styling across Plugin Store, Plugins, Feature Flags, Themes, Settings and Supporters.
- Adds Theme search across manifest name, author, description and source URL.
- Adds Settings search across maintenance, transfer and Core Plugin metadata; Core Plugin cards are filtered by name/author/description.
- Adds Supporters search across loaded sponsor/contributor/stargazer identities, with an explicit message when GitHub exposes only a stargazer count and not searchable identities.
- Keeps the current Lunatic dark dropdown palette unchanged; the controls are now centralized so their palette can later be moved into the standalone Lunatic theme without touching component logic.

## 0.37.6

- Fixes confirmed Log Out finally executing the TIDAL action: after the Luna/Material confirmation resolves, Lunatic dispatches TIDAL's own `session/LOGOUT` Redux action instead of replaying a click on the now-detached profile-menu button. Cancel behavior remains unchanged and still uses the preferred Luna confirmation UI.
- Replaces the three native Plugin Store `<select>` controls with Lunatic-owned compact dropdowns. This removes the intermittent Windows/Chromium native scrollbar shown even for three-item menus and keeps the existing dark styling/visibility fix independent of OS select rendering.
- Adds a visible `Reload catalog` action in the flat Store UI. It force-refreshes every `store.json` and every plugin package, bypassing the saved catalog snapshot, so cache behavior can be verified or manually overridden without switching to Stores view.
- Keeps normal cold starts snapshot-first: cached catalog/plugin metadata render immediately, remote store manifests are only validated in the background, and individual plugin package JSON is fetched again only when a store changed or a manual force reload is requested.
- Removes the obsolete custom logout-dialog CSS left over from the abandoned hand-built dialog implementation.

## 0.37.5

- Reworks Log Out confirmation again around the original Luna/Material confirmation UI. Lunatic now closes the TIDAL profile context menu, waits for that menu to leave the DOM plus two paint frames, and only then opens the `@luna/ui` confirmation. This targets the actual first-click consumption boundary while restoring the preferred stock-like dialog appearance. The original TIDAL Log Out button is still invoked only after confirmation.
- Replaces the Local plugins text glyph with the same SVG chevron geometry used by Feature Flags and moves it to the far-right edge after the pinned-count label.
- Keeps `Pin local Plugin Store entries` enabled by default; existing explicit user choices are preserved.
- Adds persistent full Plugin Store catalog snapshots for every store, not only GitHub metrics/local manifests. Store manifests, per-plugin package metadata, ETag and Last-Modified validators are cached on disk.
- Cold startup now hydrates the Store immediately from local snapshots, then validates each `store.json` in the background with conditional requests instead of rebuilding every plugin card from network data first.
- If a store responds unchanged (304, or a byte-equivalent manifest after a 200 response), cached plugin package metadata is reused and individual plugin package JSON files are not re-fetched.
- GitHub download/upload metadata remains an independent persistent cache, so popularity/date refreshes no longer require rebuilding the Store catalog.
- Manual Store reload still forces plugin-package refresh, preserving an explicit way to bypass the cache when a developer republishes package metadata without changing the manifest.
- When a remote Store refresh fails but a valid local snapshot exists, Lunatic keeps showing the cached catalog instead of replacing it with a load error.

## 0.37.4

- Fixes stock Log Out confirmation dispatch ordering: Lunatic now closes TIDAL's profile context menu first and dispatches `modal/SHOW_LOGOUT_MODAL` on the next task, instead of trying to open the modal while the context menu is still active.
- Adds `Pin local Plugin Store entries`, enabled by default. When enabled, Local/DEV plugins remain in a separate compact section above the flat catalog; when disabled, they join the normal catalog and obey Installed/Not installed filtering and the selected sort.
- Makes the pinned Local/DEV section collapsible with its collapsed state persisted alongside the other Plugin Store UI state when Store-state persistence is enabled.
- Persists the last successful Local Store manifest as a continuity snapshot so a transient localhost/store refresh failure no longer makes all pinned local plugins disappear.
- Forces catalog filter/count refresh after Install/Uninstall even when TidaLuna replaces a plugin instance during uninstall/reload.
- Changes release-metadata coverage to the currently visible GitHub-backed result set, so an Installed/Not installed filter can no longer show a filtered plugin count next to an unrelated global `74/76` metric.
- Adds the names of currently visible plugins missing GitHub release metadata to the coverage label tooltip for direct diagnosis of packaging/source exceptions.
- Adds punctuation-insensitive release-asset matching after exact matching, covering package/store names such as `Tidal Tags` vs `TidalTags.mjs` or `Song Downloader` vs `SongDownloader.mjs` without weakening the normal exact match path.

## 0.37.3

- Pins Local/DEV Store plugins in their own compact section above the remote flat catalog. Local plugins are no longer hidden by the default `Not installed` filter; search and developer filtering still apply.
- Excludes Local/DEV plugins from GitHub release-metadata coverage counts. The coverage label now reports only plugins whose source is actually a GitHub Release, making cases such as `74/74 GitHub plugins with release metadata` explicit instead of looking like two plugins lost metadata.
- Adds `Remember Plugin Store filters`, enabled by default, to Lunatic UI preferences. Sort mode, Installed filter, Plugins/Stores view and developer filter persist through cold TIDAL restarts; search text intentionally resets.
- Stores Plugin Store UI state in Lunatic's existing ReactiveStore instead of ephemeral React state, so persisted filters follow the rest of Lunatic settings storage.
- Keeps GitHub release metadata persisted on disk via the existing 24-hour cache, avoiding a full metadata refetch on every cold restart.
- Uses TIDAL's own built-in `modal/SHOW_LOGOUT_MODAL` action for the intercepted profile-menu Log Out command. This restores the stock TIDAL confirmation design and removes Lunatic from the normal Cancel/confirm interaction path; the Lunatic dialog remains only as a defensive fallback if that stock action is unavailable.

## 0.37.2

- Fixes the remaining two-click Log Out cancel bug at its actual boundary: the dialog no longer relies on `<form method="dialog">` default submission, which TIDAL can cancel before Chromium closes the modal. Cancel and Log Out now use direct one-shot button handlers and remove the singleton dialog immediately.
- Restyles the Log Out actions to neutral stock-like controls; Cancel is no longer bright cyan/blue, while Log Out keeps a restrained destructive tint.
- Makes GitHub release metadata resilient to unauthenticated API limits. API requests are concurrency-limited, successful results are cached for 24 hours, and 403/429 responses temporarily stop further API bursts.
- Adds a no-API fallback through GitHub's release `expanded_assets` HTML so `.mjs` upload dates can still power `Recently uploaded` when the REST API is rate-limited or blocked. Download counts remain available when the REST response succeeds.
- Matches release assets against both the Store path and the plugin's sanitized package name, covering scoped names such as `@jxnxsdev/audiovisualiser -> jxnxsdev.audiovisualiser.mjs`.
- If download metadata is unavailable but upload dates are available, the Store automatically falls back from `Most downloaded` to `Recently uploaded`; if neither exists it falls back to `Name` instead of silently pretending the download sort worked.
- Replaces the generic metadata coverage label with explicit download-count and upload-date coverage.

## 0.37.1

- Replaces the hand-built logout backdrop with a native Chromium `<dialog>` while retaining Lunatic styling. Cancel, Escape and confirmation now use the browser's modal close path, eliminating the custom stacked-click behavior.
- Restyles the logout dialog closer to the original TidaLuna/Material UI confirmation presentation while keeping it independent from `material-ui-confirm` and its duplicated provider path.
- Fixes Plugin Store native `<select>` contrast using the same dark `color-scheme` and explicit option colors already used by the Feature Flags toolbar.
- Removes the low-value `Author` sort while keeping author/developer filtering on plugin metadata.
- Fixes `Stores` view so a store group is omitted whenever zero plugins survive the current Installed/Not installed, search, or developer filter. Store load errors remain visible.
- Hardens GitHub release metadata loading by using native fetch with GitHub's JSON accept header and case-insensitive `.mjs` asset matching.
- Shows metadata coverage next to download/upload sorting so missing GitHub release data is visible instead of silently degenerating to name sorting.

## 0.37.0

- Replaces the temporary browser-native Log Out prompt with a Lunatic-owned singleton dialog styled to match the TIDAL/Luna interface, without using `material-ui-confirm` or a second ConfirmProvider.
- Keeps the original TIDAL Log Out action behind the confirmation and keeps `Luna Settings` directly below stock `Settings`.
- Redesigns Plugin Store around a compact flat plugin catalog instead of store/category sections.
- Adds `Plugins` and `Stores` views. The default `Plugins` view merges all configured stores into one two-column catalog; `Stores` keeps source-oriented browsing in a much denser grouped layout.
- Adds sorting by `Most downloaded`, `Recently uploaded`, `Name`, and `Author`. GitHub release stores use the matching `.mjs` release asset `download_count` and `created_at`; stores without compatible GitHub metadata remain supported and sort after entries with known metrics.
- Caches GitHub release metadata for 30 minutes, including across Plugin Store remounts in the same client storage, to avoid burning unauthenticated GitHub API requests during normal tab use.
- Adds `Not installed / All / Installed` filtering. Browsing defaults to `Not installed`; active text search automatically includes all plugins.
- Makes developer names clickable filters and exposes the active developer as a removable filter chip.
- Compacts plugin cards to name/version, metadata, a two-line description, and one explicit Install/Uninstall action. Single-plugin stores no longer consume a full store-sized section in the default view.
- Keeps Install from URL, store reload/remove controls, conditional store refreshes, and existing uninstall confirmation behavior.

## 0.36.4

- Replaces the `@luna/ui` global confirmation helper for the stock TIDAL Log Out action with a single browser-native modal.
- Fixes the cold-start case where cancelling Log Out required two Cancel clicks because two confirmation layers were rendered.
- Keeps the original TIDAL Log Out button/action untouched and still invokes it only after explicit confirmation.
- Keeps `Luna Settings` directly below the stock `Settings` profile-menu item.

## 0.36.3

- Prevented duplicate Log Out confirmation dialogs by using a renderer-global confirmation lock that survives plugin hot reload overlap.
- Kept the original TIDAL Log Out action intact after confirmation.

This file is documentation only. TidaLuna mounts the plugin from `package.json -> main` (`./src/index.ts`); this file is not imported or executed.

## 0.36.2
- Adds a confirmation dialog before the stock TIDAL `Log Out` action in the user-profile context menu, preventing accidental sign-outs without replacing TIDAL's original logout handler.
- Moves the existing `Luna Settings` menu item directly below TIDAL's stock `Settings` item whenever the profile menu opens.
- Uses the existing TidaLuna `ContextMenu` and `confirm` APIs and keeps the profile-menu hook lifecycle-owned by Lunatic UI unloads.
- Keeps Plugin Store behavior unchanged; the Store redesign remains the next UI task.

## 0.36.1
- Removes the temporary `window.__lunaticUiDiagnostics` lifecycle/PlayBar instrumentation added for the 0.36.0 freeze investigation.
- Keeps the 0.36.0 PlayBar stability fix itself: low-frequency health polling plus narrow live-player observers remain unchanged.
- Folds the late 0.35.x Core Plugin corrective CSS back into the canonical Core Plugin rules, removing the trailing patch block without changing the resulting layout.
- Restores stock-style bordered cards for adaptive Supporters entries, including the previous compact 58px card geometry.
- Performs a cleanup-only pass before the remaining Plugins and Plugin Store UI work; no Plugin Store behavior is changed in this release.

## 0.36.0
- Starts a runtime-stability pass after a long-lived TIDAL session became progressively unresponsive and Electron reported `MaxListenersExceededWarning` for 11 `mediaduration` listeners.
- Removes Lunatic UI's permanent whole-document PlayBar `MutationObserver` and permanent whole-`<head>` stylesheet observer.
- PlayBar replacement/theme-transform detection now uses a 2-second health poll; the live player still has immediate `ResizeObserver` and attribute observation, plus resize/focus/visibility refresh.
- Keeps complete cleanup for the PlayBar interval, ResizeObserver, MutationObserver and pending RAF during plugin unload/hot reload.
- Adds `window.__lunaticUiDiagnostics.snapshot()` and persistent `window.__lunaticUiDiagnostics.history` lifecycle records. Counters expose PlayBar polls, player rebinds, observer callbacks and RAF activity so repeated plugin reloads can be checked for runaway work.
- Diagnostics record adaptive health, legacy-fallback state, version, load/unload timestamps and survive Lunatic hot reloads as history.
- Runtime/dependency audit confirmed Lunatic UI does not register a `mediaduration` listener itself; the Electron warning therefore requires separate identification of the native/media listener owner.

## 0.35.11
- Restores equal-height alignment for collapsed Core Plugin cards within each two-column grid row.
- Keeps the compact content-driven card geometry from 0.35.9/0.35.10, but stretches each collapsed pair only to the taller card in that row.
- Expanded Core Plugin cards remain content-driven and do not inherit paired-row stretching.

## 0.35.10
- Restores normal Core Plugin typography after 0.35.7 over-compressed the text instead of only removing wasted space.
- Core Plugin titles/authors/descriptions now use the normal Settings/Plugins text scale while keeping the compact content-sized card geometry introduced by the isolation fix.
- Removes ellipsis/truncation from setting descriptions inside expanded category cards; descriptions wrap naturally instead of ending in `...`.
- Removes ellipsis from visible category descriptions as well. The existing `Category descriptions on hover only` preference still hides category descriptions entirely when enabled.
- Raises category/setting description typography back to a readable 12px scale while keeping category titles visually secondary.

## 0.35.9
- Fixes the Core Plugin card height issue at its source instead of overriding the shared Plugin Store description selector.
- Core Plugin descriptions no longer use `data-lunatic-plugin-description`, which is owned by the Plugin Store layout and carries a fixed 57.7px description box.
- Adaptive Core Plugins now use their own `data-lunatic-adaptive-core-plugin-description` marker, fully isolating their description geometry from Plugin Store/legacy CSS.
- Collapsed Core Plugin action decks are absolutely positioned in the top-right corner, so the Reload/Live/Settings corner never adds vertical height to the card.
- Core Plugin descriptions remain fully readable and wrap naturally; no ellipsis/clamping is used.

## 0.35.8
- Fixes the actual cause of oversized collapsed Core Plugin cards.
- The legacy/global Plugin Store layout still applied `height/min-height/max-height: 57.7px !important` to every `[data-lunatic-plugin-description]`, including adaptive Core Plugin descriptions. Previous density changes therefore reduced text size/clamped content without reducing the reserved 57.7px block.
- Adaptive Core Plugin descriptions now explicitly override that legacy geometry with `height: auto`, `min-height: 0`, `max-height: none` and normal wrapping using equal-or-higher specificity plus `!important`.
- Removes the one-line ellipsis/clamp introduced in 0.35.7; Core Plugin descriptions are fully readable again and cards grow only when the actual text needs another line.
- Explicitly makes collapsed Core Plugin cards content-sized (`height: auto`, `min-height: 0`, `align-self: start`) and slightly tightens the header gap.
- Keeps the 0.35.7 category-description hover preference unchanged.

## 0.35.7
- Further compacts collapsed Luna Core Plugin cards: smaller padding, 32px action controls, tighter author/description typography and reduced grid gaps.
- Adds `Category descriptions on hover only`, enabled by default.
- With the preference enabled, Core Plugin settings category descriptions are hidden from the permanent layout and available through the category-title hover tooltip.
- With the preference disabled, category descriptions remain visible and their native hover tooltip is removed so the same text is not duplicated.
- Setting-row descriptions remain visible and no longer duplicate themselves through `title` hover tooltips.
- Keeps all description behavior generic; no Dev-specific labels or selectors are introduced.

## 0.35.6
- Keeps both category and setting labels in the generic Plugin Settings template instead of deleting semantics for single-setting categories.
- Demotes category headings visually so they read as small contextual labels while the actual setting names remain primary.
- Makes category cards in the same grid row stretch to equal height, so the first two settings groups form a clean paired row while an unrelated third group sits below.
- Further subdues category descriptions to reduce the `category + setting` duplication effect without throwing away useful context.

## 0.35.5
- Rebuilds Plugin Settings category detection from the real `@luna/dev` DOM supplied during testing instead of continuing to infer wrapper depth.
- The expanded Settings `<section>` itself is now the two-column category grid because the real category containers (`Redux Logging`, `IPC Logging`, `Debugging`) are already direct children of that section.
- Stops applying `display: contents` to category cards. In 0.35.4 the category nodes themselves were marked as bridge slots, which destroyed the card boxes and left full-width strips.
- Excludes row descriptions (`MuiTypography-subtitle2`) and headings inside setting rows from category detection, preventing rows such as `Native IPC` from being misclassified as nested categories.
- Flattens only the wrappers between a real category card and its setting rows.
- Hides the actual top-level `<br>` separator found between current Luna categories.
- Keeps `switch + filter` rows on one line where space allows and slightly tightens the filter field.

## 0.35.4
- Fixes the remaining Plugin Settings category-grid issue from 0.35.3.
- The previous bridge flattened only one intermediary Luna wrapper, while current TIDALuna Settings can nest each category through several Box/Stack wrappers.
- The normalizer now marks the entire ancestor chain between each detected category card and the common two-column grid container as `display: contents`.
- Does the same for intermediary row wrappers inside each category, preventing stock Luna wrappers from recreating full-width strips inside a category card.
- Keeps categories as compact two-column cards and slightly strengthens their card surface/radius.

## 0.35.3
- Corrects the 0.35.2 Plugin Settings layout regression that stretched every category across the full expanded plugin width.
- Marks intermediary Luna wrappers as grid slots so category cards can actually participate in the intended two-column layout even when upstream DOM nesting adds extra wrapper nodes.
- Removes the remaining nested dark row-surface wrappers inside category cards; individual settings are flat rows again.
- Keeps complex controls on one line where space allows instead of stacking switch/filter rows vertically.
- Reduces the regex/text-field width and overall row height to keep category cards compact.
- Tightens the expanded plugin header/settings divider spacing and clamps the plugin description to one line.

## 0.35.2
- Fixes category recognition in expanded Plugin Settings by anchoring groups from their actual Luna heading (`Redux Logging`, `IPC Logging`, `Debugging`) and selecting the smallest ancestor that also contains controls.
- Category titles are now genuinely inside their own card instead of sitting above a separately boxed control region.
- Uses the full expanded-plugin width as a two-column category grid, eliminating the large unused right side seen in 0.35.1.
- Restores descriptions in a compact form: category descriptions and setting descriptions are shown as subdued single-line text with ellipsis, while the full text remains available through hover tooltips.
- Keeps individual setting rows flat; only category cards provide a surface.
- Complex rows such as `Render redux events + switch + filter` remain contained within one category card instead of forcing a full-width page row.

## 0.35.1
- Flattens expanded Plugin Settings from `plugin → category title → row cards` into `plugin → category cards`.
- Category/group titles now live inside the same compact surface as their settings, removing one visual hierarchy level and reducing vertical waste.
- Category cards use a two-column grid on wide layouts, similar in density to Core Plugin cards themselves; narrow layouts collapse to one column.
- Individual setting rows are now flat inside their category card instead of receiving their own nested card/background.
- Simple switch rows stay one-line; complex rows with filters/buttons/multiple controls stack their controls within the same category card.
- Category descriptions and setting descriptions remain hidden from the permanent layout and are available through hover tooltips.
- Removes spacer nodes inserted by stock Luna layouts when they would otherwise create empty vertical bands.

## 0.35.0
- Introduces a generic adaptive Plugin Settings Layout System for expanded Core Plugin settings.
- Normalizes stock Luna/MUI setting rows at runtime instead of hard-coding individual Dev settings.
- Simple switch-only sibling settings use a two-column compact grid; rows with text fields, multiple controls or buttons span the full width.
- Hides verbose setting-row and category/group descriptions from the layout and exposes the same text through the native hover tooltip (`title`) on the corresponding row/group owner.
- In mixed controls such as Redux Logging, the enable switch is shown before ancillary fields such as the regex filter. The filter remains editable while disabled because Lunatic cannot safely assume a plugin requires enable-before-configure semantics.
- Aligns setting controls into a common right-side control zone while preserving the plugin's own actual controls and behavior.
- Removes upstream row shadows/background clutter in favor of a subtle canonical setting-row surface.
- Keeps expanded settings inside the owning plugin card and preserves the 0.34.3 accordion/reflow model.
- Further tightens collapsed Core Plugin cards and clamps their descriptions to one line.
- On narrow windows the settings grid automatically collapses to one column.

## 0.34.3
- Reworks Core Plugin Settings expansion into an explicit accordion model.
- Places the Settings action below Reload + Live Reload, separating disclosure/navigation from runtime actions.
- Allows only one Core Plugin Settings panel to be open at a time.
- Expanded Core Plugin cards remain self-contained and span the full two-column grid width.
- If the opened plugin originally occupied the right column, it is moved before its left neighbor for rendering. The expanded card takes the full row, while the displaced neighbor and following cards automatically repack below without leaving an empty cell.
- Uses an explicit `data-lunatic-core-plugin-expanded` marker instead of CSS `:has()` for the full-width state.
- Slightly emphasizes the active Settings button and expanded card without adding a separate selected-plugin UI.
- No animation added yet; this release establishes the layout/state model first.

## 0.34.2
- Compacts Settings Transfer: `Include plugin source code` now sits above Export/Import with its switch aligned to the far right, eliminating the large empty footer area.
- Keeps the switch for the export modifier because it is a binary option, but presents it as a compact option row rather than a third action.
- Makes Core Plugins substantially denser with a two-column card grid on wide layouts.
- Core Plugin action decks are now content-sized inline-flex rows, so plugins without Settings no longer reserve an empty settings slot.
- Core Plugin cards with expanded Settings automatically span the full grid width, preserving readable settings layout while compact cards remain two-up.
- Core Plugins collapse back to one column on narrower windows.

## 0.34.1
- Moves Luna Core Plugins to the bottom of Settings. Maintenance and Settings Transfer are now the primary Settings content; Core Plugins are treated as secondary/advanced infrastructure.
- Isolates adaptive Core Plugin markup from the old legacy fallback selectors by using dedicated `data-lunatic-adaptive-core-*` markers.
- Fixes the Core Plugin icon layout collision that caused adaptive cards to inherit historical legacy grid/flex rules.
- Core Plugin actions now use the same compact 36px controls / 4px gaps / 116px action deck width as the Plugins page.
- Tightens Core Plugin cards and expanded settings spacing while leaving individual third-party/Core Settings semantics untouched.
- Removes stale CSS for the old TIDALuna client identity/icon layout.

## 0.34.0
- Redesigns the Settings page hierarchy.
- Moves Luna core plugins to the top as the primary Settings content.
- Keeps embedded Feature Flags directly after Core Plugins when the separate Feature Flags tab is disabled.
- Moves client maintenance and Settings Transfer into a compact utilities footer at the bottom of Settings.
- Removes the `Thanks for using TIDALuna!` greeting and TIDAL icon from the maintenance section; the footer now shows a concise `TIDALuna maintenance` title and current client version.
- Presents Maintenance and Settings Transfer as matching utility cards, two columns on wide layouts and one column on narrow layouts.
- Adds canonical surfaces to Core Plugin cards and a divider before expanded Core Plugin settings.
- Removes the temporary Plugin Store installed/not-installed status dot entirely.

## 0.33.1
- Replaces the Feature Flags text chevron with a real SVG chevron so closed/open rotation stays geometrically centered. Closed points left; open points down; the control is larger and fixed to the far-right center of the category header.
- Removes the redundant Enabled/Disabled text badge from Theme cards; the switch already communicates that state.
- Removes the duplicate Themes page title and keeps only the installed-theme count.
- Stops showing `No theme metadata provided.` when a raw CSS theme has no metadata. Optional author/description are shown only when a JSON metadata comment actually exists.
- Fixes adaptive Theme action layout by giving the new Theme controls adaptive-only data markers, preventing old legacy fallback CSS from forcing them into the historical grid.
- Normalizes scoped Plugin Store category/store names with the same `displayPluginName()` rule used for plugin titles, removing the returned `@author/` prefix.
- Adds a compact red/green status dot to Plugin Store plugin cards for not-installed/installed state. The existing Install/Uninstall button remains the action to avoid two competing controls.

## 0.33.0
- Redesigns the Themes page around theme metadata instead of raw URLs.
- Theme cards now show a readable theme name, optional author, description, enabled/disabled status and a subdued source URL.
- Themes without metadata fall back to a filename-derived name plus `No theme metadata provided.` instead of using the full URL as the title.
- Theme manifest parsing now scans early CSS block comments for a JSON manifest instead of requiring the first comment to be JSON.
- Adds a compact Themes page heading with installed-theme count.
- Keeps theme enable/reload/remove actions in a consistent right-side action deck and preserves the existing theme lifecycle.
- Fixes Feature Flags disclosure positioning: the closed indicator points left, the open indicator points down, and the larger glyph is absolutely centered on the right edge of the category header.

## 0.32.1
- Polishes the first UI Foundation pass based on visual testing.
- Installed/Core plugin actions now use explicit semantic states: Reload remains orange, Settings is neutral gray, Live Reload is green when on and dark neutral when off, and disabled actions are uniformly dark gray.
- Adds the same semantic action markers to Core Plugins.
- Adds the missing canonical surface to Theme cards.
- Replaces the Sort info circle with a tiny superscript `*` hint above the label.
- Moves Feature Flags disclosure chevrons to the far right, enlarges them, and keeps right/down orientation through rotation.
- Strengthens generic stock Luna TextField normalization inside third-party/Core plugin Settings, including neutral label, outline, hover, focus and input text colors.
- Does not special-case the Dev plugin or `Event regex filter`; the fix applies to stock outlined fields through the shared plugin-settings owner.

## 0.32.0
- Starts the post-refactor UI improvement phase.
- Adds `Hide Supporters page` preference, enabled by default. The Supporters tab and its page shell are removed from the adaptive UI while the upstream structure remains part of health validation.
- Restores native Luna action colors in Installed Plugins by removing inherited-white icon overrides.
- Adds subtle canonical card surfaces to Installed Plugins, Plugin Store stores and Plugin Store plugin cards.
- Equalizes Installed Plugins action-slot heights and centers switches/icon buttons consistently.
- Replaces the raw `ⓘ` Sort hint with a compact styled info glyph.
- Hides empty `Load` actions for Install-from-URL fields in Plugin Store and Themes; the action appears once input exists or while loading.
- Adds explicit disclosure chevrons to collapsible Feature Flags categories.
- Normalizes stock outlined setting inputs relative to inherited UI color instead of hard-coding the Dev plugin's field colors.
- Improves disabled Feature Flags action styling while keeping `Reset all overrides` discoverable.

## 0.31.8
- Final bug-sweep hotfix after the 0.31.7 runtime audit.
- Fixes a real regression in the shared network wrapper: `requestJson()` did not forward `ftch` request options, while the Stargazers request still passes the GitHub media-type `Accept` header.
- `requestJson()` now accepts and forwards the same options type as `ftch.json`, with the timeout kept as a separate third argument.
- This restores the intended Stargazers identity-list request/fallback path without weakening the 15-second network timeout.
- Re-runs syntax/transpile, unresolved-identifier, unused-code and local dependency-cycle checks.

## 0.31.7
- Final runtime/lifecycle audit after the adaptive and legacy modularization series.
- Fixes a real legacy fallback lifecycle edge case: cancelling a queued scan now also resets `scanQueued`, so fallback can be disabled and later re-enabled without the scanner becoming permanently stuck.
- Makes PlayBar tracking initialization idempotent to prevent orphaned observers if initialization is accidentally repeated in the same module instance.
- Tracks and cancels the overflow-popover positioning animation frame during replacement and cleanup.
- Removes dead imports, an unused Plugin Store parameter, and an unused network helper found by `noUnusedLocals` / `noUnusedParameters`.
- Confirms the local module graph has no circular dependencies.
- Confirms the filtered unresolved-identifier audit has no local missing-symbol errors.
- No intended visual changes.

## 0.31.6
- Adds a shared network runtime in `src/net.ts`.
- Applies a 15-second caller timeout to TidaLuna `ftch` JSON/text requests used by Themes, Supporters and Client Updates.
- Adds abortable `fetchWithTimeout()` for Plugin Store metadata requests while preserving ETag, Last-Modified and 304 handling.
- Keeps TidaLuna's existing `ftch` transport for client-safe remote text/JSON requests instead of replacing it with browser fetch.
- Normalizes timeout errors into explicit request/timeout messages instead of allowing remote requests to hang UI loading states indefinitely.
- No intended layout or feature changes.

## 0.31.5
- Runs a full unresolved-identifier audit after the adaptive/legacy modularization series.
- Fixes a latent legacy fallback scope bug: `scan()` referenced `pluginStore` even though the instance was local to `createLegacyDomRuntime()`.
- Makes the Plugin Store fallback runtime reference explicit, nullable and cleanup-safe.
- Exports/imports shared legacy action helpers (`actionLabel`, `hasAction`, `clearInstalledPluginMarkers`) used by the Themes fallback.
- Restores the missing type-only `PluginPackage` import in `adaptive/Plugins.tsx`.
- Adds `src/globals.d.ts` for TidaLuna's existing `__platform` build-time global so future `tsc` audits can surface real missing identifiers cleanly.
- The filtered TypeScript unresolved-identifier audit now reports no local missing-symbol errors.

## 0.31.4
- Completes the current legacy-fallback decomposition pass without intended visual or behavioral changes.
- Moves Installed/Core Plugin fallback marking into `src/legacy/plugins.ts`.
- Moves legacy Feature Flags recognition/marking into `src/legacy/feature-flags.ts`.
- Moves legacy Themes recognition/marking into `src/legacy/themes.ts`.
- Moves legacy Supporters recognition/marking into `src/legacy/supporters.ts`.
- Moves legacy Settings/input/client-update marking into `src/legacy/settings.ts`.
- Leaves `src/legacy/runtime.ts` as a compact observer/lifecycle orchestrator that delegates each domain.
- Keeps shared semantic ancestry helpers in `src/legacy/dom.ts` and Plugin Store behavior in `src/legacy/plugin-store.ts`.

## 0.31.3
- Continues legacy-fallback decomposition without intended visual or behavioral changes.
- Moves the complete legacy Plugin Store fallback into `src/legacy/plugin-store.ts`.
- Plugin Store card recognition, scoped-name normalization, store structure markers, explicit install/uninstall actions, GitHub title/author links and direct-card click blocking now live in that module.
- Moves the generic `closestSemanticCard()` ancestry helper into `src/legacy/dom.ts` for reuse by legacy domains.
- `legacy/runtime.ts` now orchestrates Plugin Store fallback through a small runtime interface instead of owning its implementation.
- Keeps Plugin Store action listeners tied to the existing legacy AbortSignal and preserves cleanup behavior.

## 0.31.2
- Fixes two legacy-runtime extraction regressions visible on plugin reload / TIDAL restart.
- Restores the runtime-local `legacyFallbackActive` state that was referenced by `createLegacyDomRuntime()` but accidentally omitted during the 0.31.0 extraction.
- Replaces the final stale `onViewportChange` scroll-listener reference with `onOverflowPopoverViewportChange` after the popover move in 0.31.1.
- These were runtime identifier errors, so the previous transpile-only syntax check could not detect them.
- Adds targeted undefined/stale-symbol guards for both identifiers.

## 0.31.1
- Continues legacy-fallback decomposition without intended visual or behavioral changes.
- Moves the shared `nearestCommonAncestor()` DOM helper into `src/legacy/dom.ts`.
- Moves overflow-description popover state, positioning, binding and cleanup into `src/legacy/overflow-popover.ts`.
- Fixes a latent fallback-only bug introduced by the 0.31.0 extraction: the legacy Plugin Store action error path referenced `trace` without defining it inside the new legacy module.
- Legacy runtime now owns its own `Tracer("[Lunatic UI]")` instance for fallback action errors.
- Keeps popover event listeners tied to the existing legacy AbortSignal and preserves unload cleanup.

## 0.31.0
- Starts the legacy-fallback cleanup phase after completing adaptive modularization.
- Moves the legacy DOM scanner, semantic marker logic, Plugin Store fallback UX, overflow popover behavior and legacy event handlers into `src/legacy/runtime.ts`.
- `src/index.ts` now treats the legacy fallback as a runtime service with `enable`, `disable`, `queueScan` and `cleanup`.
- Adaptive health still decides whether the legacy runtime is active; the fallback remains disabled during a healthy adaptive takeover.
- Keeps PlayBar tracking independent from the legacy runtime.
- Keeps fallback warning/logging and adaptive-health orchestration in the package entry point, with its own abortable listener lifecycle.
- No intended visual or behavioral changes.

## 0.30.9
- Completes the current adaptive modularization pass without intended visual or behavioral changes.
- Moves Lunatic UI preference controls into `src/adaptive/Preferences.tsx`.
- Moves adaptive runtime CSS verbatim into `src/adaptive/css.ts`.
- Reduces `src/adaptive.tsx` to a stable public facade that only re-exports Preferences, CSS and takeover APIs.
- Keeps `src/index.ts` and the package entry point unchanged.
- Adds checks that the facade contains no runtime implementation code and that all expected public exports remain present.

## 0.30.8
- Continues modularization without intended visual or behavioral changes.
- Moves the complete adaptive React-tree takeover into `src/adaptive/takeover.tsx`.
- `PersistentTab`, tab injection, structural health checks, adaptive/legacy health events, cached-tab orchestration and Page patch/unpatch lifecycle now live in the takeover module.
- Keeps the public `installAdaptiveSettingsTakeover` / `AdaptiveTakeover` API re-exported from `adaptive.tsx`, so `src/index.ts` does not change.
- Replaces direct preference-UI access to takeover globals with `leaveFeatureFlagsTabIfNeeded()`.
- Adds targeted checks for all takeover-only symbols and the Feature Flags tab icon dependency.

## 0.30.7
- Fixes a 0.30.6 modularization regression that forced `DOM Fallback Enabled`.
- `featureFlagsTabFromTemplate()` still rendered `<SettingsGlyph />`, but the `SettingsGlyph` import was removed when the Settings page moved to `Settings.tsx`.
- The resulting runtime `ReferenceError` occurred inside adaptive tree transformation, causing the structural health check to fail and enabling the legacy fallback.
- Restores the shared `SettingsGlyph` import in the adaptive orchestrator.
- No intended visual or behavioral changes beyond restoring the healthy adaptive renderer.

## 0.30.6
- Continues modularization without intended visual or behavioral changes.
- Moves the complete adaptive Settings page into `src/adaptive/Settings.tsx`.
- Core Plugins, Client Updates, Factory Reset and Settings Transfer now live in the Settings module.
- Keeps Settings Transfer delegated to TidaLuna's public `SettingsTransfer` API.
- Keeps third-party Core Plugin Settings unmounted while the Settings tab is hidden.
- Removes Settings-only runtime dependencies from the main `adaptive.tsx` orchestrator.
- Runs targeted symbol checks after extraction.

## 0.30.5
- Continues modularization without intended visual or behavioral changes.
- Moves the complete Installed Plugins view into `src/adaptive/Plugins.tsx`.
- Moves shared Settings / live-reload action glyphs into `src/adaptive/icons.tsx`.
- Keeps hash-aware Settings capability tracking and UI preferences in `plugin-state.ts`.
- Keeps third-party plugin Settings lifecycle behavior unchanged: Lunatic tab state stays cached while foreign Settings components unmount on hidden tabs.
- Removes Installed Plugins-only dependencies from the main `adaptive.tsx` orchestrator.
- Adds targeted extraction checks to prevent dangling references after the move.

## 0.30.4
- Continues modularization without intended visual or behavioral changes.
- Moves the complete adaptive Plugin Store view into `src/adaptive/PluginStore.tsx`.
- `LunaticStorePlugin`, store fetch/reload logic, search, install/uninstall actions and store controls now live with the Plugin Store module.
- Keeps shared store persistence in `src/adaptive/store-state.ts`.
- Removes Plugin Store-only dependencies from the main `adaptive.tsx` orchestrator.
- Adds targeted symbol checks to prevent another missing-helper regression during extraction.

## 0.30.3
- Fixes a regression introduced during the 0.30.0 modularization: `normalizeStoreUrl`, `addStore`, and `removeStore` were accidentally removed while their call sites remained.
- Adds `src/adaptive/store-state.ts` for the local store URL, reactive store list, URL normalization, add-store and remove-store operations.
- Moves the complete adaptive Themes state and UI into `src/adaptive/Themes.tsx`.
- Theme installation continues to support theme CSS, plugin URLs and store URLs exactly as before.
- Store removal now normalizes the supplied URL before matching it in the persisted store list.
- No intended visual changes.

## 0.30.2
- Continues modularization without intended behavior changes.
- Moves the complete adaptive Feature Flags view into `src/adaptive/FeatureFlags.tsx`.
- Moves the complete adaptive Supporters/Stargazers view into `src/adaptive/Supporters.tsx`.
- Keeps Feature Flag catalogue data separate in `src/adaptive/feature-flag-catalog.ts`.
- Keeps Supporters network behavior unchanged, including the stargazer-count fallback.
- Reduces `adaptive.tsx` to orchestration plus the remaining Plugins/Store/Themes/Settings/takeover views.

## 0.30.1
- Fixes a 0.30.0 modularization regression that could make the Settings page disappear.
- `currentSettingsComponent()` was moved into `plugin-state.ts` but remained referenced by `adaptive.tsx` without being exported/imported.
- Exports and imports that helper explicitly; no other behavior changes.

## 0.30.0
- Begins physical decomposition of the large `adaptive.tsx` / `index.ts` runtime without intended behavior changes.
- Moves plugin preferences, installation metadata and hash-aware Settings capability tracking into `src/adaptive/plugin-state.ts`.
- Moves the curated Feature Flag catalogue and fallback categorization into `src/adaptive/feature-flag-catalog.ts`.
- Moves dynamic PlayBar clearance tracking into `src/playbar.ts`.
- Keeps the package entry point unchanged (`./src/index.ts`); all new files are ordinary internal imports.
- `CHANGELOG.md` remains documentation-only and is not imported at runtime.

## 0.29.1
- Makes plugin Settings capability metadata package-hash-aware instead of sticky.
- A plugin update that removes `Settings` now correctly moves to the `Without settings` filter.
- Package/hash changes invalidate and refresh the Settings capability cache.
- Plugin reloads refresh Settings capability metadata.
- Third-party Installed Plugin Settings unmount while the Plugins tab is hidden.
- Third-party Core Plugin Settings unmount while the Settings tab is hidden.
- Keeps Lunatic-owned tab state cached while avoiding hidden background lifecycle work from arbitrary plugin Settings components.
- Core plugin list refreshes on Settings-tab activation instead of listening to every tab-change event.
- Removes an accidental duplicate installed-plugin description render.

## 0.29.0
- Added an adaptive takeover structural health check and `pending / healthy / failed` handshake.
- Legacy DOM fallback now activates only when adaptive takeover is unavailable or fails its health check.
- Disabled the global legacy MutationObserver during healthy adaptive operation.
- Narrowed PlayBar stylesheet observation to `<head>` while retaining DOM replacement and ResizeObserver tracking.
- Replaced Lunatic's duplicated raw IndexedDB Settings Transfer implementation with TidaLuna's public `SettingsTransfer.dump / restore / validate`.
- `Ask when uninstall` now also applies to uninstall actions in Plugin Store.
- Removes the migrated legacy `oneClickUninstall` preference key.

## 0.28.0
- Continued migration from MUI parent/child topology to semantic runtime markers.
- Added semantic roles for Installed/Core plugin actions, versions, descriptions, authors and settings controls.
- Hardened Plugin Store card content and Theme/Core settings selectors.

## 0.27.0
- Removed the historical CSS patch train from 0.7.3 through 0.7.12.
- Consolidated the surviving Plugin Store header behavior into one canonical semantic layout.
- Removed stale/no-op selector fragments.

## 0.26.0
- Consolidated runtime CSS around semantic markers.
- Added semantic markers for Plugin Store fields, Supporters, Feature Flags and Core Plugin settings.
- Retired the standalone `src/style.css` payload; runtime CSS lives in `src/styles/runtime/`.

## 0.25.2
- Hardened legacy Plugin Store, Feature Flags, Supporters and Core settings recognizers.
- Reduced reliance on fixed MUI Grid/Stack/Box topology.

## 0.25.1
- Hardened Installed/Core Plugin and Theme recognizers.
- Replaced fixed parent-depth and historical layout assumptions with semantic controls.

## 0.25.0
- Hardened Supporters and Client Updates recognition.
- Added graceful Stargazers fallback: list when available, star count when list access is unavailable, otherwise hide the section.

## 0.24.2
- Packaging compatibility repair.

## 0.24.1
- Removed the temporary `Copy all flag IDs` control.
- Added conservative fallback categorization for future TIDAL feature flags.

## 0.24.0
- Added the curated 2026 Feature Flag catalogue and explicit categories for the known flag set.
- Unknown future flags remain visible and functional without invented descriptions.

## 0.23.3
- Added robust clipboard fallback for the temporary Feature Flag ID export diagnostic.

## 0.23.2
- Added temporary Feature Flag ID export diagnostic.

## 0.23.1
- Refined Feature Flags UI: removed category filter/count clutter, filler descriptions and arbitrary card background.
- Added `Reset all overrides`.

## 0.23.0
- Added Lunatic-owned Feature Flags UI and optional separate Feature Flags tab.
- Began DOM-hardening work.

## 0.22.2
- Added `Show enabled first`.
- Added `Ask when uninstall` and migration from the old inverse preference.

## 0.22.1
- Added dynamic PlayBar clearance based on the actual visible footer-player geometry.

## 0.22.0
- Plugin runtime version now comes from `package.json`.
