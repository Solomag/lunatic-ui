# Lunatic UI 0.39.0

**0.38.x milestone:** Luna Settings shell/UI pass complete; 0.39.0 locks the final tab/icon treatment and stable top anchoring across short and long Settings pages.


Lunatic-owned adaptive views now share one compact search/dropdown control system. Long dropdowns are bounded and scroll internally instead of extending behind the PlayBar. Plugin Store, Plugins, Feature Flags, Themes, Settings and Supporters use the same search geometry; all Lunatic-owned sort/filter/release dropdowns use the custom popup rather than native Chromium/Windows selects.

Log Out confirmation is inserted at the Redux boundary: Lunatic cancels the stock `session/LOGOUT`, preserves its original action-creator payload, asks for confirmation, then replays it with TIDAL's required `initiatedByUser` field intact. This avoids the TIDAL 2.43.x session-saga crash caused by payload-less replays.

Current Store behavior: catalogs hydrate from persistent snapshots first, then validate remote manifests in the background. `Reload catalog` is the explicit force-refresh path for all stores/plugin package metadata. Store Sort / Installed / View / Developer state persists when `Remember Plugin Store filters` is enabled; search remains session-only.

Plugin Store cold-start caching, Feature-Flags-style Local chevrons, persisted Store UI state, and profile-menu logout safety.

The Plugin Store now keeps a full local snapshot of each store manifest plus per-plugin package metadata and HTTP validators. On a cold TIDAL start, Lunatic renders cached Store data first, then validates each store in the background. Unchanged stores reuse the cached plugin packages instead of rebuilding the entire catalog from network requests. GitHub download counts/upload dates stay in their own persistent cache and can refresh independently.

`Pin local Plugin Store entries` remains enabled by default. The Local section is collapsible and now uses the same right-edge SVG chevron treatment as Feature Flags. Sort/filter/view/developer state remains persistent when `Remember Plugin Store filters` is enabled; search still resets.

See `CHANGELOG.md` for the complete version history.

Luna Settings now uses TIDAL black (`#000000`) instead of TidaLuna's rainbow page background. The `TIDALuna BETA` title accents and injected `Luna Settings` profile-menu item are normalized to the surrounding native text colors. Themes `Install from URL` uses the same Lunatic input treatment as the shared search fields. Local Store validation avoids conditional HTTP headers so localhost development stores do not fail CORS preflight.

Themes now keeps URL installation theme-specific: the field accepts `.css` theme URLs only, while plugin/store URLs belong in Plugin Store. Search and Install-from-URL surfaces are aligned to the same width, and conditional Load actions sit inside the URL field instead of changing its geometry. The Luna Settings shell is also shifted slightly upward, and tab icons are forced to a neutral white/gray scale while retaining the existing tab indicator accent.


## 0.39.0 Plugins layout

Installed Plugins now use a compact two-column card layout aligned with Core Plugins. Collapsed cards use native TIDAL Settings surface/contrast values; expanded plugin settings span both columns.
