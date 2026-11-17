import { closestSemanticCard } from "./dom";

export function applyLunaticInputSurface() {
  const roots = new Set<HTMLElement>();

  document
    .querySelectorAll<HTMLElement>(
      [
        '[data-lunatic-store-input-surface="true"]',
        '[data-lunatic-themes-install-surface="true"]',
        '[data-lunatic-core-plugin-content="true"] .MuiOutlinedInput-root',
        '[data-lunatic-settings-card="true"] .MuiOutlinedInput-root'
      ].join(",")
    )
    .forEach((root) => roots.add(root));

  roots.forEach((root) => {
    /* Marker only. Visual Theme owns fill/border/shadow; Layout owns geometry. */
    root.dataset.lunaticUnifiedInput = "true";
  });
}


export function markLunaticSettingsSections() {
  /* Client Updates: locate the semantic title first, then the smallest
     nearby ancestor that also contains the TIDAL icon. */
  const clientUpdateHeadings = Array.from(
    document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,span,strong,.MuiTypography-root")
  ).filter((el) => el.textContent?.trim().startsWith("Client Updates"));

  clientUpdateHeadings.forEach((heading) => {
    let shell: HTMLElement | null = heading;
    for (let depth = 0; shell && depth < 7; depth++, shell = shell.parentElement) {
      if (shell.querySelector('img[alt="TIDAL Icon"]')) {
        shell.dataset.lunaticClientUpdatesShell = "true";
        break;
      }
    }
  });

  /* Settings Transfer has a stable semantic description in current Luna.
     Search locally rather than requiring a specific Stack attribute topology. */
  document.querySelectorAll<HTMLElement>("[desc]").forEach((candidate) => {
    const desc = candidate.getAttribute("desc") || "";
    if (
      desc.startsWith(
        "Exports installed plugins, plugin settings, themes, store URLs and feature flag overrides."
      )
    ) {
      candidate.dataset.lunaticBackupSettingsShell = "true";
    }
  });

  /* Only actual marked Core settings sections participate here. */
  document
    .querySelectorAll<HTMLElement>('[data-lunatic-core-plugin-content="true"]')
    .forEach((content) => {
      const heading = content.querySelector<HTMLElement>(
        ':scope > [role="heading"], :scope > span.MuiTypography-h7, :scope > .MuiTypography-h7, h1,h2,h3,h4,h5,h6'
      );
      if (!heading) return;

      const titleBox = closestSemanticCard(heading, (candidate) =>
        candidate === content || candidate.parentElement === content
      , 3) ?? heading;

      titleBox.dataset.lunaticCoreSettingsTitle = "true";
      heading.dataset.lunaticCoreSettingsHeading = "true";

      /* Hard runtime inset. This is deliberately inline !important because
         several historical theme rules target these generic MuiBox nodes. */
      titleBox.style.setProperty("box-sizing", "border-box", "important");
      titleBox.style.setProperty("display", "block", "important");
      titleBox.style.setProperty("width", "100%", "important");
      titleBox.style.setProperty("min-width", "0", "important");
      titleBox.style.setProperty("margin", "0 0 8px", "important");
      titleBox.style.setProperty("padding", "8px 12px 12px", "important");

      if (heading) {
        heading.style.setProperty("display", "block", "important");
        heading.style.setProperty("margin", "0 0 5px", "important");
        heading.style.setProperty("padding", "0", "important");
      }

      const desc = titleBox.querySelector<HTMLElement>(
        ':scope > .MuiTypography-subtitle2'
      );
      if (desc) {
        desc.dataset.lunaticCoreSettingsDescription = "true";
        desc.style.setProperty("margin", "0", "important");
        desc.style.setProperty("padding", "0", "important");
      }

      const controls = Array.from(content.querySelectorAll<HTMLElement>(
        '.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, textarea, select, [role="switch"]'
      ));
      const rows = controls
        .map((control) => closestSemanticCard(control, (candidate) => {
          if (!content.contains(candidate)) return false;
          const controlCount = candidate.querySelectorAll(
            '.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, textarea, select, [role="switch"]'
          ).length;
          return controlCount >= 1 && candidate !== content;
        }, 4))
        .filter((row): row is HTMLElement => !!row)
        .filter((row, index, all) => all.indexOf(row) === index);

      rows.forEach((row) => {
        row.dataset.lunaticCoreSettingRow = "true";
        const rowControls = Array.from(row.querySelectorAll<HTMLElement>(
          '.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, textarea, select, [role="switch"]'
        ));
        if (!rowControls.length) return;

        const controlShell = closestSemanticCard(rowControls[0], (candidate) =>
          candidate.parentElement === row || candidate === row
        , 3) ?? rowControls[0];
        controlShell.dataset.lunaticCoreSettingControl = "true";

        Array.from(row.children).forEach((child) => {
          if (!(child instanceof HTMLElement) || child === controlShell) return;
          if (child.contains(rowControls[0])) child.dataset.lunaticCoreSettingControl = "true";
          else if (child.textContent?.trim()) child.dataset.lunaticCoreSettingCopy = "true";
        });
      });
    });
}

export function markLunaticClientUpdateControls() {
  document
    .querySelectorAll<HTMLElement>('[data-lunatic-client-updates-shell="true"]')
    .forEach((shell) => {
      /* Once the semantic Client Updates shell is known, keep the remaining
         recognizer deliberately shallow: locate the actual version select and
         mark its nearest local control row instead of depending on Stack props. */
      const selectRoot = shell.querySelector<HTMLElement>(
        '.MuiOutlinedInput-root.MuiSelect-root, [role="combobox"]'
      );
      if (!selectRoot) return;

      selectRoot.dataset.lunaticClientVersionSelect = "true";

      let controlRow: HTMLElement | null = selectRoot.parentElement;
      for (let depth = 0; controlRow && controlRow !== shell && depth < 4; depth++, controlRow = controlRow.parentElement) {
        const hasButton = !!controlRow.querySelector("button");
        if (!hasButton) continue;
        controlRow.dataset.lunaticClientUpdateControls = "true";
        break;
      }
    });
}
