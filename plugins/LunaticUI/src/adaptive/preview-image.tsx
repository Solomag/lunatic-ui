// SPDX-License-Identifier: MS-PL  (adapted from Inrixia/TidaLuna#197 by FlazeIGuess; see THIRD_PARTY_NOTICES.md)
/**
 * Plugin preview images for the store, after Inrixia/TidaLuna#197 by FlazeIGuess (MS-PL).
 *
 * The store renders a card for every plugin of every listed store, so an unrestricted image url
 * would let any listed author log the IP of everyone who opens the tab. Only https urls on the
 * GitHub hosts the plugin code already comes from are shown; anything else falls back to a plain card.
 */
import React from "react";

const ALLOWED_HOSTS = new Set(["github.com", "raw.githubusercontent.com", "user-images.githubusercontent.com", "objects.githubusercontent.com"]);

export const isAllowedPreviewImage = (image: unknown): image is string => {
  if (typeof image !== "string" || image === "") return false;
  try {
    const url = new URL(image);
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

/** Per plugin wins, otherwise the store wide default, otherwise off */
export const showDownloadsFor = (pluginFlag: unknown, storeFlag: unknown): boolean =>
  typeof pluginFlag === "boolean" ? pluginFlag : storeFlag === true;

/** Thumbnail on the card; click opens it full size, click or Escape closes */
export const LunaticPreviewImage = React.memo(({ src, alt }: { src: string; alt: string }) => {
  const [open, setOpen] = React.useState(false);
  const [broken, setBroken] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (broken) return null;
  return (
    <>
      <button type="button" data-lunatic-store-preview="true" onClick={() => setOpen(true)} title="Open preview">
        <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      </button>
      {open && (
        <div data-lunatic-store-preview-overlay="true" role="dialog" aria-label={alt} onClick={() => setOpen(false)}>
          <img src={src} alt={alt} referrerPolicy="no-referrer" />
        </div>
      )}
    </>
  );
});

export const previewImageCss = String.raw`
[data-lunatic-store-preview="true"] {
  display: block; width: 100%; aspect-ratio: 16 / 9; margin: 0 0 12px; padding: 0; overflow: hidden;
  border: 1px solid var(--wave-color-opacity-contrast-fill-ultra-thin, #ffffff1a);
  border-radius: var(--wave-border-radius--small, 8px);
  background: var(--wave-color-solid-base-bright, #18181b); cursor: zoom-in;
}
[data-lunatic-store-preview="true"] > img { width: 100%; height: 100%; object-fit: cover; display: block; }
[data-lunatic-store-preview-overlay="true"] {
  position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center;
  padding: 48px; background: rgba(0, 0, 0, .82); cursor: zoom-out;
}
[data-lunatic-store-preview-overlay="true"] > img {
  max-width: 100%; max-height: 100%; object-fit: contain;
  border-radius: var(--wave-border-radius--regular, 12px);
}
`;
