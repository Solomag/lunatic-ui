import { store as obyStore } from "oby";
import { uiPreferences } from "./plugin-state";

const ROOT_CONTROL_SELECTOR = [
  ".MuiTextField-root",
  ".MuiSwitch-root",
  ".MuiButton-root",
  "select",
  "textarea",
  'input:not([type="hidden"])',
].join(",");

const GROUP_HEADING_SELECTOR = [
  ".MuiTypography-h7",
  ".MuiTypography-h6",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
].join(",");

function isNestedControl(element: HTMLElement) {
  const parentControl = element.parentElement?.closest<HTMLElement>(
    ".MuiTextField-root, .MuiSwitch-root, .MuiButton-root",
  );
  return !!parentControl;
}

function controlRoots(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(ROOT_CONTROL_SELECTOR))
    .filter((element) => !isNestedControl(element));
}

function nearestSettingRow(root: HTMLElement, control: HTMLElement) {
  let current: HTMLElement | null = control.parentElement;
  let fallback: HTMLElement | null = null;

  for (let depth = 0; current && current !== root && depth < 6; depth++, current = current.parentElement) {
    const controls = controlRoots(current);
    if (!controls.length) continue;

    if (!fallback && current.children.length >= 2 && current.textContent?.trim()) fallback = current;

    if (
      current.classList.contains("MuiStack-root") &&
      current.textContent?.trim() &&
      controls.length <= 3
    ) {
      return current;
    }
  }

  return fallback;
}

function directChildContaining(parent: HTMLElement, child: HTMLElement) {
  let current: HTMLElement = child;
  while (current.parentElement && current.parentElement !== parent) {
    current = current.parentElement;
  }
  return current.parentElement === parent ? current : child;
}

function markRowDescription(description: HTMLElement, row: HTMLElement) {
  const text = description.textContent?.trim();
  if (!text) return;
  description.dataset.lunaticSettingDescription = "true";
  row.dataset.lunaticSettingHelp = text;
  // Row descriptions are visible, so duplicating them as a native title tooltip
  // only creates noise.
  row.removeAttribute("title");
}

function markGroupDescription(description: HTMLElement, heading: HTMLElement) {
  const text = description.textContent?.trim();
  if (!text) return;
  description.dataset.lunaticSettingGroupDescription = "true";
  heading.dataset.lunaticSettingHelp = text;
}

function normalizeRows(root: HTMLElement) {
  const rows: HTMLElement[] = [];

  for (const control of controlRoots(root)) {
    const row = nearestSettingRow(root, control);
    if (!row || rows.includes(row)) continue;

    const rowControls = controlRoots(row);
    if (!rowControls.length) continue;

    row.dataset.lunaticSettingRow = "true";
    rows.push(row);

    const controlChildren = new Set(
      rowControls.map((rowControl) => directChildContaining(row, rowControl)),
    );

    for (const child of Array.from(row.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (controlChildren.has(child)) {
        child.dataset.lunaticSettingControls = "true";
      } else if (child.textContent?.trim()) {
        child.dataset.lunaticSettingCopy = "true";
      }
    }

    if (controlChildren.size === 1) {
      const [shell] = Array.from(controlChildren);
      shell.dataset.lunaticSettingControls = "true";
    }

    const hasTextField = rowControls.some((item) =>
      item.matches(".MuiTextField-root, select, textarea, input"),
    );
    const hasButton = rowControls.some((item) => item.matches(".MuiButton-root"));
    const complex = rowControls.length > 1 || hasTextField || hasButton;
    row.dataset.lunaticSettingComplex = complex ? "true" : "false";

    const description = row.querySelector<HTMLElement>(".MuiTypography-subtitle2");
    if (description) markRowDescription(description, row);
  }

  return rows;
}

function topLevelChild(root: HTMLElement, element: HTMLElement) {
  let current: HTMLElement = element;
  while (current.parentElement && current.parentElement !== root) {
    current = current.parentElement;
  }
  return current.parentElement === root ? current : null;
}

function isRealGroupHeading(heading: HTMLElement) {
  if (heading.closest('[data-lunatic-setting-row="true"]')) return false;
  if (heading.classList.contains("MuiTypography-subtitle2")) return false;
  return true;
}

function normalizeGroups(root: HTMLElement, rows: HTMLElement[]) {
  const groups: HTMLElement[] = [];

  root.querySelectorAll<HTMLElement>(GROUP_HEADING_SELECTOR).forEach((heading) => {
    if (!isRealGroupHeading(heading)) return;

    const group = topLevelChild(root, heading);
    if (!group || groups.includes(group)) return;

    const localRows = rows.filter((row) => group.contains(row));
    if (!localRows.length) return;

    group.dataset.lunaticSettingGroup = "true";
    heading.dataset.lunaticSettingGroupTitle = "true";
    groups.push(group);

    const description = Array.from(group.querySelectorAll<HTMLElement>(".MuiTypography-subtitle2"))
      .find((candidate) => !candidate.closest('[data-lunatic-setting-row="true"]'));
    if (description) markGroupDescription(description, heading);

    // The actual TIDALuna DOM puts setting rows under one or more Stack/Box
    // wrappers inside the top-level category. Flatten styling on those wrappers,
    // but never flatten the category card itself.
    const rowBridges = new Set<HTMLElement>();
    for (const row of localRows) {
      let bridge = row.parentElement;
      while (bridge && bridge !== group) {
        rowBridges.add(bridge);
        bridge = bridge.parentElement;
      }
    }
    rowBridges.forEach((bridge) => {
      bridge.dataset.lunaticSettingRowsBridge = "true";
    });

    for (const child of Array.from(group.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child.contains(heading)) continue;
      if (localRows.some((row) => child === row || child.contains(row))) continue;
      if (child.textContent?.trim()) continue;
      child.dataset.lunaticSettingSpacer = "true";
    }
  });

  if (groups.length) {
    root.dataset.lunaticSettingGroupsGrid = "true";
  }

  // Current Luna inserts <br> separators between top-level categories.
  for (const child of Array.from(root.children)) {
    if (child instanceof HTMLBRElement) {
      child.dataset.lunaticSettingSpacer = "true";
    }
  }
}

function markRemainingDescriptions(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".MuiTypography-subtitle2").forEach((description) => {
    if (
      description.dataset.lunaticSettingDescription === "true" ||
      description.dataset.lunaticSettingGroupDescription === "true"
    ) {
      return;
    }

    const text = description.textContent?.trim();
    if (!text) return;

    const heading = description.parentElement?.querySelector<HTMLElement>(GROUP_HEADING_SELECTOR);
    if (heading) markGroupDescription(description, heading);
  });
}

function applyCategoryDescriptionPreference(root: HTMLElement) {
  const hoverOnly = obyStore.unwrap(uiPreferences.pluginSettingCategoryDescriptionsOnHover);
  root.dataset.lunaticCategoryDescriptions = hoverOnly ? "hover" : "visible";

  root.querySelectorAll<HTMLElement>('[data-lunatic-setting-group-title="true"]').forEach((heading) => {
    const text = heading.dataset.lunaticSettingHelp;
    if (hoverOnly && text) heading.title = text;
    else heading.removeAttribute("title");
  });
}

export function normalizeAdaptivePluginSettings(root: HTMLElement) {
  const rows = normalizeRows(root);
  normalizeGroups(root, rows);
  markRemainingDescriptions(root);
  applyCategoryDescriptionPreference(root);
}

export function installAdaptivePluginSettingsLayout(root: HTMLElement) {
  let frame: number | null = null;

  const queue = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      normalizeAdaptivePluginSettings(root);
    });
  };

  const observer = new MutationObserver(queue);
  observer.observe(root, { childList: true, subtree: true });

  const unloadPreference = obyStore.on(
    () => uiPreferences.pluginSettingCategoryDescriptionsOnHover,
    () => {
      applyCategoryDescriptionPreference(root);
    },
  );

  queue();

  return () => {
    observer.disconnect();
    unloadPreference?.();
    if (frame !== null) window.cancelAnimationFrame(frame);
  };
}
