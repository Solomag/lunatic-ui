// SPDX-License-Identifier: MS-PL  (adapted from Inrixia/TidaLuna#197 by FlazeIGuess; see THIRD_PARTY_NOTICES.md)
/**
 * Icons drawn from TIDAL's own sprite.
 *
 * Adapted from LunaIcon in Inrixia/TidaLuna#197 by FlazeIGuess (MS-PL): TIDAL mounts ~108 <symbol>
 * elements into <div id="icons-root"> and draws its whole interface from them, so referencing the
 * same sprite gives Lunatic TIDAL's own artwork. Each icon carries a viewBox crop because TIDAL's
 * symbols are not drawn to a common margin.
 *
 * Lunatic addition: if TIDAL ever renames or drops a symbol the fallback is drawn instead of an
 * empty box.
 */
import React from "react";

export interface TidalIcon {
  /** Symbol id in TIDAL's sprite, without the leading hash */
  id: string;
  /** viewBox that makes the symbol's ink fill ~90% of the box */
  crop: string;
}

export const tidalIcons = {
  search: { id: "general__search", crop: "0.64 0.71 23.06 23.06" },
  close: { id: "general__close", crop: "4.73 4.72 14.53 14.53" },
  add: { id: "general__add", crop: "5.33 5.33 13.33 13.33" },
  trash: { id: "detail-view__trashcan", crop: "0.17 0.67 22.67 22.67" },
  alert: { id: "general__alert", crop: "-1.33 -1.33 26.67 26.67" },
  check: { id: "general__checkmark", crop: "-1.32 -0.83 26.66 26.66" },
  threeDots: { id: "general__three-dots", crop: "1.33 0.73 21.33 21.33" },
  upload: { id: "3.0__upload", crop: "4.78 4.28 14.44 14.44" },
  shine: { id: "general__shine", crop: "0.97 -0.64 23.67 23.67" },
  marketplace: { id: "general__marketplace", crop: "-0.91 -0.92 25.83 25.83" },
  heart: { id: "general__heart", crop: "-1.33 -0.7 26.54 26.54" },
} as const satisfies Record<string, TidalIcon>;

export const hasTidalIcon = (icon: TidalIcon) => document.getElementById(icon.id) !== null;

export const TidalSpriteIcon = React.memo(
  ({ icon, size = 20, fallback = null, className }: { icon: TidalIcon; size?: number; fallback?: React.ReactNode; className?: string }) => {
    if (!hasTidalIcon(icon)) return <>{fallback}</>;
    return (
      <svg
        // MUI Tab passes its icon spacing class (MuiTab-iconWrapper) through className
        className={className}
        viewBox={icon.crop}
        width={size}
        height={size}
        focusable="false"
        aria-hidden="true"
        data-lunatic-tidal-icon={icon.id}
        style={{ fill: "currentColor", display: "block", flexShrink: 0 }}
      >
        {/* Explicit 24: without it <use> fills the viewport and the crop scales with it */}
        <use href={`#${icon.id}`} width="24" height="24" />
      </svg>
    );
  },
);
