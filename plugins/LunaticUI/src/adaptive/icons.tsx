import React from "react";

type LunaticGlyphProps = { sx?: unknown };

export const SettingsGlyph = (_props: LunaticGlyphProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.61l-1.92-3.32a.5.5 0 0 0-.59-.22l-2.39.96a7.1 7.1 0 0 0-1.62-.94L14.4 2.81a.49.49 0 0 0-.48-.41h-3.84a.49.49 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.5.5 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.5.5 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.5.5 0 0 0-.12-.61zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2"/>
  </svg>
);

export const LiveOnGlyph = (_props: LunaticGlyphProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8.4 8.4a5.1 5.1 0 0 0 0 7.2" />
      <path d="M5.6 5.6a9 9 0 0 0 0 12.8" />
      <path d="M15.6 8.4a5.1 5.1 0 0 1 0 7.2" />
      <path d="M18.4 5.6a9 9 0 0 1 0 12.8" />
    </g>
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

export const LiveOffGlyph = (_props: LunaticGlyphProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M7.7 9.2a5.1 5.1 0 0 0 .8 6.4" />
      <path d="M5.3 6.8a9 9 0 0 0 .7 11.5" />
      <path d="M15.7 8.5a5.1 5.1 0 0 1 .7 5.9" />
      <path d="M18.4 5.6a9 9 0 0 1 .7 11.7" />
      <path d="M4 4l16 16" />
    </g>
  </svg>
);
