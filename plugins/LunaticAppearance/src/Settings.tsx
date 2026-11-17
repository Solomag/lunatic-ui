import React from "react";
import { LunaButton, LunaSettings } from "@luna/ui";
import {
  defaultLunaticAppearance,
  lunaticAppearance,
  onLunaticAppearanceChange,
  saveLunaticAppearance,
  type LunaticAppearance,
} from "./appearance";
import { applyAppearance } from "./runtime";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 34,
  padding: "7px 9px",
  borderRadius: 7,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.045)",
  color: "inherit",
  outline: "none",
};

const editorCss = String.raw`
  [data-lunatic-appearance-editor="true"] {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  [data-lunatic-appearance-main-grid="true"] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, .85fr);
    gap: 16px;
    align-items: start;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  [data-lunatic-appearance-fields="true"] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    min-width: 0;
  }
  [data-lunatic-appearance-editor="true"] section,
  [data-lunatic-appearance-editor="true"] label,
  [data-lunatic-appearance-editor="true"] input,
  [data-lunatic-appearance-editor="true"] select {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  @media (max-width: 860px) {
    [data-lunatic-appearance-main-grid="true"] { grid-template-columns: minmax(0, 1fr); }
    [data-lunatic-appearance-preview="true"] { position: static !important; }
  }
  @media (max-width: 560px) {
    [data-lunatic-appearance-fields="true"] { grid-template-columns: minmax(0, 1fr); }
  }
`;

function cssColorToPicker(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${value.slice(1).split("").map((c) => c + c).join("")}`;
  const rgba = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgba) return `#${[rgba[1], rgba[2], rgba[3]].map((v) => Math.max(0, Math.min(255, Number(v))).toString(16).padStart(2, "0")).join("")}`;
  return "#808080";
}

function colorAlpha(value: string) {
  const rgba = value.match(/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgba) return rgba[1] === undefined ? 1 : Math.max(0, Math.min(1, Number(rgba[1])));
  if (/^#[0-9a-f]{8}$/i.test(value)) return parseInt(value.slice(7, 9), 16) / 255;
  return 1;
}

function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return `#${[r, g, b].map((n) => Math.round((n + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function hexToHsv(value: string) {
  const hex = cssColorToPicker(value).slice(1);
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max ? d / max : 0, v: max };
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const swatchRef = React.useRef<HTMLButtonElement>(null);
  const svRef = React.useRef<HTMLDivElement>(null);
  const svCursorRef = React.useRef<HTMLDivElement>(null);
  const hueCursorRef = React.useRef<HTMLDivElement>(null);
  const alphaCursorRef = React.useRef<HTMLDivElement>(null);
  const hsvRef = React.useRef(hexToHsv(value));
  const alphaRef = React.useRef(colorAlpha(value));
  const pendingRef = React.useRef(value);

  const paint = React.useCallback(() => {
    const { h, s, v } = hsvRef.current;
    const hex = hsvToHex(h, s, v);
    const alpha = alphaRef.current;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const next = alpha >= .999 ? hex : `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    pendingRef.current = next;
    if (swatchRef.current) swatchRef.current.style.background = next;
    if (svRef.current) svRef.current.style.backgroundColor = `hsl(${h} 100% 50%)`;
    if (svCursorRef.current) {
      svCursorRef.current.style.left = `${s * 100}%`;
      svCursorRef.current.style.top = `${(1 - v) * 100}%`;
    }
    if (hueCursorRef.current) hueCursorRef.current.style.left = `${(h / 360) * 100}%`;
    if (alphaCursorRef.current) alphaCursorRef.current.style.left = `${alpha * 100}%`;
  }, []);

  React.useEffect(() => {
    hsvRef.current = hexToHsv(value);
    alphaRef.current = colorAlpha(value);
    pendingRef.current = value;
    paint();
  }, [value, paint]);

  React.useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onChange(pendingRef.current);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open, onChange]);

  const updateSv = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    hsvRef.current.s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    hsvRef.current.v = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    paint();
  };
  const updateHue = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    hsvRef.current.h = Math.max(0, Math.min(359.999, ((event.clientX - rect.left) / rect.width) * 360));
    paint();
  };
  const updateAlpha = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    alphaRef.current = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    paint();
  };
  const pointerHandlers = (update: (event: React.PointerEvent<HTMLDivElement>) => void) => ({
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); update(event); },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event); },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      onChange(pendingRef.current);
    },
  });

  return (
    <div ref={rootRef} style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1fr) 38px", gap: 6 }}>
      <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 12, opacity: .72 }}>{label}</span>
        <input style={fieldStyle} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <button
        ref={swatchRef}
        type="button"
        aria-label={`Pick ${label.toLowerCase()}`}
        onClick={() => setOpen((v) => !v)}
        style={{ alignSelf: "end", height: 34, width: 38, padding: 0, borderRadius: 7, border: "1px solid rgba(255,255,255,.18)", background: value, cursor: "pointer" }}
      />
      {open && (
        <div style={{ position: "absolute", zIndex: 10000, right: 0, top: "calc(100% + 6px)", width: 240, padding: 10, borderRadius: 9, border: "1px solid rgba(255,255,255,.16)", background: "#17171a", boxShadow: "0 12px 36px rgba(0,0,0,.55)" }}>
          <div
            ref={svRef}
            {...pointerHandlers(updateSv)}
            style={{ position: "relative", height: 150, cursor: "crosshair", touchAction: "none", backgroundColor: `hsl(${hsvRef.current.h} 100% 50%)`, backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)" }}
          >
            <div ref={svCursorRef} style={{ position: "absolute", width: 12, height: 12, border: "2px solid white", borderRadius: "50%", boxShadow: "0 0 0 1px black", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
          </div>
          <div {...pointerHandlers(updateHue)} style={{ position: "relative", height: 18, marginTop: 8, cursor: "ew-resize", touchAction: "none", background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}>
            <div ref={hueCursorRef} style={{ position: "absolute", top: -2, bottom: -2, width: 4, border: "1px solid black", background: "white", transform: "translateX(-50%)", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "42px 1fr", gap: 8, alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 12, opacity: .75 }}>Alpha</span>
            <div {...pointerHandlers(updateAlpha)} style={{ position: "relative", height: 18, cursor: "ew-resize", touchAction: "none", backgroundImage: "linear-gradient(to right,transparent,currentColor),linear-gradient(45deg,#777 25%,transparent 25%,transparent 75%,#777 75%),linear-gradient(45deg,#777 25%,#aaa 25%,#aaa 75%,#777 75%)", backgroundSize: "100% 100%,8px 8px,8px 8px", backgroundPosition: "0 0,0 0,4px 4px", color: pendingRef.current }}>
              <div ref={alphaCursorRef} style={{ position: "absolute", top: -2, bottom: -2, width: 4, border: "1px solid black", background: "white", transform: "translateX(-50%)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, type = "text", onChange }: { label: string; value: string | number; type?: string; onChange: (value: string) => void }) {
  return <label style={{ display: "grid", gap: 4 }}><span style={{ fontSize: 12, opacity: .72 }}>{label}</span><input style={fieldStyle} type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label style={{ minHeight: 34, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 9px", border: "1px solid rgba(255,255,255,.11)", borderRadius: 7 }}><span style={{ fontSize: 12 }}>{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /></label>;
}

function useSavedAppearance() {
  const [, redraw] = React.useReducer((value: number) => value + 1, 0);
  React.useEffect(() => {
    const unlisten = onLunaticAppearanceChange(() => redraw());
    return () => {
      unlisten();
    };
  }, []);
  return lunaticAppearance;
}

function Preview({ a }: { a: LunaticAppearance }) {
  const radius = Math.max(0, Number(a.borderRadius) || 0);
  return (
    <div data-lunatic-appearance-preview="true" style={{ position: "sticky", top: 12, minWidth: 0, maxWidth: "100%", minHeight: 330, padding: 16, boxSizing: "border-box", borderRadius: radius, border: `1px solid ${a.borderColor}`, background: a.pageBackground, color: a.textColor }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Page background</div>
      <div style={{ fontSize: 12, color: a.mutedTextColor, marginBottom: 12 }}>Muted text</div>
      <div style={{ padding: 12, borderRadius: radius, border: `1px solid ${a.borderColor}`, background: a.shellBackground }}>
        <div style={{ fontWeight: 700 }}>Section</div>
        <div style={{ marginTop: 10, padding: 10, borderRadius: radius, border: `1px solid ${a.borderColor}`, background: a.cardBackground }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!a.hideAuthorAvatars && <div style={{ width: 24, height: 24, borderRadius: "50%", background: a.strongBorderColor }} />}
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>Card</div><div style={{ fontSize: 12, color: a.mutedTextColor }}>Author / secondary text</div></div>
          </div>
          <div style={{ marginTop: 10, padding: 9, borderRadius: radius, border: `1px solid ${a.strongBorderColor}`, background: a.innerBackground }}>
            <div style={{ fontSize: 12, color: a.mutedTextColor }}>Inner background</div>
            <div style={{ marginTop: 7, height: 32, borderRadius: radius, border: `1px solid ${a.borderColor}`, background: a.controlBackground }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const Settings = React.memo(() => {
  const saved = useSavedAppearance();
  const [draft, setDraft] = React.useState<LunaticAppearance>(() => ({ ...saved }));
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setDraft({ ...saved }), [saved]);
  React.useEffect(() => applyAppearance(draft), [draft]);
  React.useEffect(() => () => applyAppearance(lunaticAppearance), []);

  const update = React.useCallback(<K extends keyof LunaticAppearance>(key: K, value: LunaticAppearance[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);
  const dirty = React.useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const save = React.useCallback(() => saveLunaticAppearance({ ...draft }), [draft]);
  const discard = React.useCallback(() => { setDraft({ ...saved }); applyAppearance(saved); }, [saved]);
  const reset = React.useCallback(() => setDraft({ ...defaultLunaticAppearance }), []);

  const loadBackgroundImage = React.useCallback((file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("pageBackgroundImage", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }, [update]);

  const grid: React.CSSProperties = {};

  return (
    <LunaSettings title="Lunatic Appearance" desc="Standalone appearance tokens. Changes preview live; Save persists them.">
      <style>{editorCss}</style>
      <div data-lunatic-appearance-editor="true" data-lunatic-layout-owner="plugin">
        <div data-lunatic-appearance-main-grid="true">
          <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <section>
            <h4 style={{ margin: "0 0 8px" }}>Background</h4>
            <div data-lunatic-appearance-fields="true" style={grid}>
              <ColorField label="Page background" value={draft.pageBackground} onChange={(v) => update("pageBackground", v)} />
              <div style={{ display: "flex", alignItems: "end", gap: 6 }}>
                <LunaButton size="small" variant="outlined" onClick={() => fileRef.current?.click()}>Choose image</LunaButton>
                {draft.pageBackgroundImage && <LunaButton size="small" variant="text" onClick={() => update("pageBackgroundImage", "")}>Clear</LunaButton>}
                <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => loadBackgroundImage(e.target.files?.[0])} />
              </div>
              <label style={{ display: "grid", gap: 4 }}><span style={{ fontSize: 12, opacity: .72 }}>Image fit</span><select style={fieldStyle} value={draft.backgroundFit} onChange={(e) => update("backgroundFit", e.target.value as LunaticAppearance["backgroundFit"])}><option value="cover">Cover / crop</option><option value="contain">Contain</option><option value="auto">Original size</option></select></label>
              <LabeledInput label="Image zoom %" type="number" value={draft.backgroundZoom} onChange={(v) => update("backgroundZoom", Math.max(25, Math.min(400, Number(v) || 100)))} />
              <LabeledInput label="Crop position X %" type="number" value={draft.backgroundPositionX} onChange={(v) => update("backgroundPositionX", Math.max(0, Math.min(100, Number(v) || 0)))} />
              <LabeledInput label="Crop position Y %" type="number" value={draft.backgroundPositionY} onChange={(v) => update("backgroundPositionY", Math.max(0, Math.min(100, Number(v) || 0)))} />
            </div>
          </section>

          <section>
            <h4 style={{ margin: "0 0 8px" }}>Surfaces</h4>
            <div data-lunatic-appearance-fields="true" style={grid}>
              <ColorField label="Section background" value={draft.shellBackground} onChange={(v) => update("shellBackground", v)} />
              <ColorField label="Card background" value={draft.cardBackground} onChange={(v) => update("cardBackground", v)} />
              <ColorField label="Inner background" value={draft.innerBackground} onChange={(v) => update("innerBackground", v)} />
              <ColorField label="Control background" value={draft.controlBackground} onChange={(v) => update("controlBackground", v)} />
              <ColorField label="Border color" value={draft.borderColor} onChange={(v) => update("borderColor", v)} />
              <ColorField label="Strong border" value={draft.strongBorderColor} onChange={(v) => update("strongBorderColor", v)} />
              <ColorField label="Text color" value={draft.textColor} onChange={(v) => update("textColor", v)} />
              <ColorField label="Muted text" value={draft.mutedTextColor} onChange={(v) => update("mutedTextColor", v)} />
              <LabeledInput label="Corner radius px" type="number" value={draft.borderRadius} onChange={(v) => update("borderRadius", Math.max(0, Number(v) || 0))} />
              <LabeledInput label="Surface opacity %" type="number" value={draft.surfaceOpacity} onChange={(v) => update("surfaceOpacity", Math.max(0, Math.min(100, Number(v) || 0)))} />
            </div>
          </section>

          <section>
            <h4 style={{ margin: "0 0 8px" }}>Plugin chrome</h4>
            <div data-lunatic-appearance-fields="true" style={grid}>
              <Toggle label="Hide author avatars" checked={draft.hideAuthorAvatars} onChange={(v) => update("hideAuthorAvatars", v)} />
              <Toggle label="Apply colours to all of TIDAL (theme palette)" checked={draft.applyToTheme} onChange={(v) => update("applyToTheme", v)} />
              <Toggle label="Use one icon color" checked={draft.singleIconColor} onChange={(v) => update("singleIconColor", v)} />
              {draft.singleIconColor ? <ColorField label="All action icons" value={draft.iconColor} onChange={(v) => update("iconColor", v)} /> : <>
                <ColorField label="Reload icon" value={draft.reloadIconColor} onChange={(v) => update("reloadIconColor", v)} />
                <ColorField label="Live reload icon" value={draft.liveReloadIconColor} onChange={(v) => update("liveReloadIconColor", v)} />
                <ColorField label="Settings icon" value={draft.settingsIconColor} onChange={(v) => update("settingsIconColor", v)} />
                <ColorField label="Uninstall icon" value={draft.uninstallIconColor} onChange={(v) => update("uninstallIconColor", v)} />
              </>}
            </div>
          </section>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <LunaButton disabled={!dirty} onClick={save}>Save changes</LunaButton>
            <LunaButton variant="outlined" disabled={!dirty} onClick={discard}>Discard</LunaButton>
            <LunaButton variant="text" onClick={reset}>Reset defaults</LunaButton>
            {dirty && <span style={{ fontSize: 12, opacity: .65 }}>Unsaved changes</span>}
          </div>
        </div>
          <Preview a={draft} />
        </div>
      </div>
    </LunaSettings>
  );
});
