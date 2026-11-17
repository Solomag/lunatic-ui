export const lunaticPluginStoreUxCss = String.raw`
@layer lunatic-stable-tint, lunatic-plugin-store-fix;
@layer lunatic-plugin-store-fix {
  [data-lunatic-plugin-card="true"] > [data-lunatic-original-action="true"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* Geometry/interaction only. Palette belongs to Theme / Appearance. */
  .lunatic-plugin-store-real-action {
    position: absolute !important;
    z-index: 20 !important;
    right: 20px !important;
    bottom: 16px !important;
    min-width: 84px !important;
    height: 32px !important;
    box-sizing: border-box !important;
    padding: 6px 13px !important;
    border-radius: 7px !important;
    font: inherit !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    line-height: 18px !important;
    text-align: center !important;
    visibility: visible !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }

  .lunatic-plugin-store-real-action:focus-visible {
    outline-offset: 2px !important;
  }

  .lunatic-plugin-store-real-action[data-lunatic-busy="true"] {
    cursor: wait !important;
  }
}
`;
