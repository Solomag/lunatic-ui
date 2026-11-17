import { closestSemanticCard, nearestCommonAncestor } from "./dom";

function switchRowsWithin(root: HTMLElement) {
  const switches = Array.from(root.querySelectorAll<HTMLElement>(
    '.MuiSwitch-root, input[type="checkbox"], [role="switch"]'
  ));

  const rows = switches
    .map((sw) => closestSemanticCard(sw, (candidate) => {
      if (!root.contains(candidate)) return false;
      const count = candidate.querySelectorAll('.MuiSwitch-root, input[type="checkbox"], [role="switch"]').length;
      return count === 1 && (!!candidate.textContent?.trim() || !!candidate.querySelector("label"));
    }, 4))
    .filter((row): row is HTMLElement => !!row);

  return rows.filter((row, index, all) => all.indexOf(row) === index);
}

export function markFeatureFlags() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>(
    "h1,h2,h3,h4,h5,h6,span,strong,[role=heading]"
  )).filter((el) => el.textContent?.trim().toLowerCase() === "feature flags");

  for (const heading of headings) {
    let section: HTMLElement | null = heading;
    let rows: HTMLElement[] = [];

    for (let depth = 0; section && depth < 7; depth++, section = section.parentElement) {
      rows = switchRowsWithin(section);
      if (rows.length >= 2) break;
    }
    if (!section || rows.length < 2) continue;

    const grid = nearestCommonAncestor(rows[0], rows.at(-1)!, 7) ?? section;
    grid.dataset.lunaticFeatureFlagsGrid = "true";

    const shell = grid.parentElement;
    if (shell instanceof HTMLElement) {
      shell.dataset.lunaticFeatureFlagsShell = "true";
      const shellParent = shell.parentElement;
      if (shellParent instanceof HTMLElement) shellParent.dataset.lunaticFeatureFlagsOuter = "true";
    }

    rows.forEach((row) => {
      row.dataset.lunaticFeatureFlag = "true";
      const setting = closestSemanticCard(
        row.querySelector<HTMLElement>('.MuiSwitch-root, input[type="checkbox"], [role="switch"]') ?? row,
        (candidate) => candidate === row || row.contains(candidate),
        3
      );
      const settingNode = setting ?? row;
      settingNode.dataset.lunaticFeatureFlagSetting = "true";

      const control = settingNode.querySelector<HTMLElement>('.MuiSwitch-root, input[type="checkbox"], [role="switch"]');
      if (control) {
        const controlShell = closestSemanticCard(control, (candidate) =>
          candidate.parentElement === settingNode || candidate === settingNode
        , 3) ?? control;
        controlShell.dataset.lunaticFeatureFlagControl = "true";
      }

      Array.from(settingNode.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        if (child.dataset.lunaticFeatureFlagControl === "true") return;
        if (control && child.contains(control)) {
          child.dataset.lunaticFeatureFlagControl = "true";
        } else if (child.textContent?.trim()) {
          child.dataset.lunaticFeatureFlagCopy = "true";
        }
      });
    });
  }
}
