import { closestSemanticCard } from "./dom";
import { actionLabel, clearInstalledPluginMarkers, hasAction } from "./plugins";

function themeCardFromAnchor(anchor: HTMLAnchorElement) {
  return closestSemanticCard(anchor, (candidate) => {
    const hasSwitch = !!candidate.querySelector('.MuiSwitch-root, input[type="checkbox"]');
    const hasReload = hasAction(candidate, (label) => label.includes("reload"));
    const hasDelete = hasAction(candidate, (label) =>
      label.includes("remove") || label.includes("delete") || label.includes("uninstall")
    );
    return candidate.contains(anchor) && hasSwitch && (hasReload || hasDelete);
  });
}

function themeHeaderFromCard(card: HTMLElement, anchor: HTMLAnchorElement) {
  const title = anchor.closest<HTMLElement>('h6,h5,[role="heading"]') ?? anchor;
  return closestSemanticCard(title, (candidate) => {
    if (!card.contains(candidate)) return false;
    return !!candidate.querySelector('.MuiSwitch-root, input[type="checkbox"]') &&
      (hasAction(candidate, (label) => label.includes("reload")) ||
       hasAction(candidate, (label) => label.includes("remove") || label.includes("delete") || label.includes("uninstall")));
  }, 5);
}

export function markLunaticThemesPage() {
  /* Identify the install field by its visible label; its wrapper class is only
     used for enumeration, not for structural parent-depth assumptions. */
  document.querySelectorAll<HTMLElement>("label,.MuiInputLabel-root").forEach((label) => {
    if (label.textContent?.trim().toLowerCase() !== "install from url") return;
    const field = closestSemanticCard(label, (candidate) =>
      !!candidate.querySelector('input,textarea')
    , 4);
    if (!field) return;
    field.dataset.lunaticThemesInstallField = "true";
    label.dataset.lunaticThemesInstallLabel = "true";
    const surface = field.querySelector<HTMLElement>(".MuiOutlinedInput-root, [role=textbox], input, textarea");
    if (surface) surface.dataset.lunaticThemesInstallSurface = "true";
    const row = field.parentElement;
    if (row instanceof HTMLElement) row.dataset.lunaticThemesInstallRow = "true";
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    if (!/\.css(?:$|\?)/i.test(href) && !/raw\.githubusercontent\.com/i.test(href)) return;

    const outerRow = themeCardFromAnchor(anchor);
    if (!outerRow) return;
    const headerStack = themeHeaderFromCard(outerRow, anchor);
    if (!headerStack) return;

    const title = anchor.closest<HTMLElement>('h6,h5,[role="heading"]') ?? anchor;
    const headerBox = closestSemanticCard(headerStack, (candidate) =>
      candidate !== outerRow && outerRow.contains(candidate) && candidate.contains(headerStack)
    , 3) ?? headerStack;

    clearInstalledPluginMarkers(outerRow, headerBox, headerStack, title);
    delete outerRow.dataset.lunaticInstalledPlugin;
    delete outerRow.dataset.lunaticSettingsCard;
    delete headerBox.dataset.lunaticInstalledPluginHeader;
    delete headerStack.dataset.lunaticInstalledPluginHeaderStack;
    delete title.dataset.lunaticInstalledPluginTitle;

    outerRow.dataset.lunaticThemeCard = "true";
    headerBox.dataset.lunaticThemeHeader = "true";
    headerStack.dataset.lunaticThemeRow = "true";
    anchor.dataset.lunaticThemeUrl = "true";

    const sw = headerStack.querySelector<HTMLElement>('.MuiSwitch-root, input[type="checkbox"]');
    if (sw) sw.dataset.lunaticThemeSwitch = "true";

    headerStack.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      const label = actionLabel(button);
      delete button.dataset.lunaticThemeAction;
      delete button.dataset.lunaticThemeReload;
      delete button.dataset.lunaticThemeDelete;

      if (label.includes("reload")) button.dataset.lunaticThemeReload = "true";
      else if (label.includes("remove") || label.includes("delete") || label.includes("uninstall")) {
        button.dataset.lunaticThemeDelete = "true";
      } else if (label) button.dataset.lunaticThemeAction = "true";
    });

    /* Mark only empty direct children as spacers instead of assuming MuiBox. */
    Array.from(headerStack.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      if (!child.textContent?.trim() && !child.querySelector('button,input,.MuiSwitch-root')) {
        child.dataset.lunaticThemeSpacer = "true";
      }
    });
  });
}
