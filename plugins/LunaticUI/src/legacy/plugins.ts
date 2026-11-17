import { closestSemanticCard } from "./dom";
import { bindOverflowPopover } from "./overflow-popover";

export function clearInstalledPluginMarkers(row: HTMLElement, headerBox: HTMLElement, headerStack: HTMLElement, title: HTMLElement) {
  delete row.dataset.lunaticInstalledPlugin;
  delete headerBox.dataset.lunaticInstalledPluginHeader;
  delete headerStack.dataset.lunaticInstalledPluginHeaderStack;
  delete title.dataset.lunaticInstalledPluginTitle;

  headerStack.querySelectorAll<HTMLElement>(
    '[data-lunatic-installed-plugin-author="true"], [data-lunatic-installed-plugin-spacer="true"]'
  ).forEach((el) => {
    delete el.dataset.lunaticInstalledPluginAuthor;
    delete el.dataset.lunaticInstalledPluginSpacer;
  });
}

export function actionLabel(element: Element | null) {
  if (!(element instanceof HTMLElement)) return "";
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent ||
    ""
  ).trim().toLowerCase();
}

export function hasAction(root: HTMLElement, matcher: (label: string) => boolean) {
  return Array.from(root.querySelectorAll<HTMLElement>("button,[role=button]")).some((button) =>
    matcher(actionLabel(button))
  );
}


function pluginHeaderParts(row: HTMLElement) {
  const title = row.querySelector<HTMLElement>(
    '[data-lunatic-installed-plugin-title="true"], h6.MuiTypography-h6, h5.MuiTypography-h5, [role="heading"]'
  );
  if (!title) return null;

  /* Find the smallest ancestor of the title that also owns at least one plugin
     management control. This is intentionally independent of Box -> Stack
     nesting and survives extra MUI wrappers. */
  const headerStack = closestSemanticCard(title, (candidate) => {
    if (!candidate.contains(title)) return false;
    return !!candidate.querySelector('.MuiSwitch-root, button[aria-label*="plugin" i], button[title*="plugin" i]');
  }, 5);
  if (!headerStack) return null;

  const headerBox = closestSemanticCard(headerStack, (candidate) => {
    if (candidate === row) return false;
    return candidate.contains(headerStack) && candidate.contains(title);
  }, 3) ?? headerStack;

  return { title, headerStack, headerBox };
}

function installedPluginCardFromUninstall(button: HTMLButtonElement) {
  return closestSemanticCard(button, (candidate) => {
    if (!candidate.contains(button)) return false;
    const hasSwitch = !!candidate.querySelector('.MuiSwitch-root, input[type="checkbox"]');
    const hasTitle = !!candidate.querySelector('h6.MuiTypography-h6, h5.MuiTypography-h5, [role="heading"]');
    const hasReload = hasAction(candidate, (label) => label.includes("reload plugin"));
    return hasSwitch && hasTitle && hasReload;
  });
}

function corePluginCardFromReload(button: HTMLButtonElement) {
  return closestSemanticCard(button, (candidate) => {
    if (!candidate.contains(button)) return false;
    const hasTitle = !!candidate.querySelector('h6.MuiTypography-h6, h5.MuiTypography-h5, [role="heading"]');
    const hasSettings = hasAction(candidate, (label) =>
      label.includes("show settings") || label.includes("hide settings")
    );
    const hasEnableSwitch = !!candidate.querySelector('.MuiSwitch-root, input[type="checkbox"]');
    const hasUninstall = hasAction(candidate, (label) => label.includes("uninstall plugin"));
    return hasTitle && hasSettings && !hasEnableSwitch && !hasUninstall;
  });
}

function markPluginCard(row: HTMLElement, kind: "installed" | "core") {
  const parts = pluginHeaderParts(row);
  if (!parts) return;
  const { headerBox, headerStack, title } = parts;

  if (kind === "core") {
    clearInstalledPluginMarkers(row, headerBox, headerStack, title);
    row.dataset.lunaticCorePlugin = "true";
    headerBox.dataset.lunaticCorePluginHeader = "true";
    headerStack.dataset.lunaticCorePluginHeaderStack = "true";
    title.dataset.lunaticCorePluginTitle = "true";

    Array.from(row.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      delete child.dataset.lunaticCorePluginContent;
      if (child === headerBox) return;

      const settingsTitle = child.querySelector<HTMLElement>(
        ':scope > span.MuiTypography-h7, :scope > .MuiTypography-h7, [role="heading"]'
      );
      const settingsControls = child.querySelector<HTMLElement>(
        '.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, select'
      );
      if (!settingsTitle && !settingsControls) return;

      child.dataset.lunaticCorePluginContent = "true";
      child.style.setProperty("box-sizing", "border-box", "important");
      child.style.setProperty("width", "100%", "important");
      child.style.setProperty("min-width", "0", "important");
      child.style.setProperty("max-width", "none", "important");
      child.style.setProperty("margin", "14px 0 0", "important");
      child.style.setProperty("padding", "18px 20px 16px", "important");
      child.style.setProperty("overflow", "visible", "important");
    });

    const coreDescription = Array.from(headerBox.querySelectorAll<HTMLElement>("h6,p,span"))
      .find((el) => el !== title && !!el.textContent?.trim() && !el.querySelector("button"));
    if (coreDescription) coreDescription.dataset.lunaticCorePluginDescription = "true";

    const parent = row.parentElement;
    if (parent instanceof HTMLElement) {
      parent.dataset.lunaticCorePluginsGrid = "true";
      const shell = parent.parentElement;
      if (shell instanceof HTMLElement) shell.dataset.lunaticCorePluginsShell = "true";
    }
  } else {
    delete row.dataset.lunaticCorePlugin;
    delete headerBox.dataset.lunaticCorePluginHeader;
    delete headerStack.dataset.lunaticCorePluginHeaderStack;
    delete title.dataset.lunaticCorePluginTitle;

    row.dataset.lunaticInstalledPlugin = "true";
    headerBox.dataset.lunaticInstalledPluginHeader = "true";
    headerStack.dataset.lunaticInstalledPluginHeaderStack = "true";
    title.dataset.lunaticInstalledPluginTitle = "true";

    Array.from(row.children).forEach((child) => {
      if (!(child instanceof HTMLElement) || child === headerBox) return;
      delete child.dataset.lunaticInstalledPluginSettingsShell;

      /* Find a settings block from actual controls rather than requiring the
         historical Stack[display=flex][variant=h7] wrapper. */
      const settingsStack = Array.from(child.querySelectorAll<HTMLElement>(".MuiStack-root, [role=group], section, div"))
        .find((candidate) =>
          !!candidate.querySelector(':scope > .MuiStack-root, :scope > [data-luna-setting], :scope > label') &&
          !!candidate.querySelector('.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, select')
        );
      if (!settingsStack) return;

      child.dataset.lunaticInstalledPluginSettingsShell = "true";

      const intro = Array.from(child.children).find((candidate): candidate is HTMLElement =>
        candidate instanceof HTMLElement &&
        candidate !== settingsStack &&
        !!candidate.textContent?.trim() &&
        !candidate.querySelector('.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, select, [role="switch"]')
      );
      if (intro) {
        intro.dataset.lunaticInstalledPluginSettingsIntro = "true";
        const introDescription = intro.querySelector<HTMLElement>(".MuiTypography-subtitle2, p");
        if (introDescription) introDescription.dataset.lunaticInstalledPluginSettingsIntroDescription = "true";
      }

      const directSettingsChildren = Array.from(settingsStack.children).filter(
        (setting): setting is HTMLElement => setting instanceof HTMLElement
      );
      const stockSettingRows = directSettingsChildren.filter((setting) =>
        !!setting.querySelector('.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, select')
      );
      const pluginOwnsLayout = directSettingsChildren.some(
        (setting) => setting.dataset.lunaticLayoutOwner === "plugin"
      );
      const isPureStockSettings =
        !pluginOwnsLayout && stockSettingRows.length > 0 && stockSettingRows.length === directSettingsChildren.length;

      if (!isPureStockSettings) {
        delete settingsStack.dataset.lunaticInstalledPluginSettings;
        directSettingsChildren.forEach((setting) => {
          delete setting.dataset.lunaticInstalledPluginSetting;
          delete setting.dataset.lunaticInstalledPluginSettingKind;
          setting.querySelectorAll<HTMLElement>(
            '[data-lunatic-installed-plugin-setting-copy="true"], [data-lunatic-installed-plugin-setting-control="true"]'
          ).forEach((part) => {
            delete part.dataset.lunaticInstalledPluginSettingCopy;
            delete part.dataset.lunaticInstalledPluginSettingControl;
          });
        });
        return;
      }

      settingsStack.dataset.lunaticInstalledPluginSettings = "true";
      stockSettingRows.forEach((setting) => {
        setting.dataset.lunaticInstalledPluginSetting = "true";
        const control = setting.querySelector<HTMLElement>(
          '.MuiSwitch-root, .MuiButton-root, .MuiTextField-root, input, select'
        );
        if (!control) return;

        const controlShell = closestSemanticCard(control, (candidate) =>
          candidate.parentElement === setting || candidate === setting
        , 3) ?? control;
        controlShell.dataset.lunaticInstalledPluginSettingControl = "true";

        const copy = Array.from(setting.children).find(
          (candidate): candidate is HTMLElement => candidate instanceof HTMLElement && candidate !== controlShell
        );
        if (copy) copy.dataset.lunaticInstalledPluginSettingCopy = "true";

        if (setting.querySelector('.MuiSwitch-root, input[type="checkbox"], [role="switch"]')) {
          setting.dataset.lunaticInstalledPluginSettingKind = "switch";
          control.dataset.lunaticInstalledPluginSettingControlType = "switch";
        } else if (setting.querySelector('.MuiButton-root, button, [role="button"]')) {
          setting.dataset.lunaticInstalledPluginSettingKind = "button";
          control.dataset.lunaticInstalledPluginSettingControlType = "button";
        } else if (setting.querySelector('.MuiTextField-root, input, textarea, select, [role="textbox"], [role="combobox"]')) {
          setting.dataset.lunaticInstalledPluginSettingKind = "field";
          control.dataset.lunaticInstalledPluginSettingControlType = "field";
        }
      });
    });

    const titleAnchor = title.querySelector<HTMLAnchorElement>("a[href]");
    if (titleAnchor) {
      titleAnchor.dataset.lunaticInstalledPluginName = "true";
      bindOverflowPopover(titleAnchor);
    }

    const pluginDescription = Array.from(headerBox.querySelectorAll<HTMLElement>("h6,p,span"))
      .find((el) => el !== title && !!el.textContent?.trim() && !el.querySelector("button"));
    if (pluginDescription) {
      pluginDescription.dataset.lunaticInstalledPluginDescription = "true";
      bindOverflowPopover(pluginDescription);
    }
  }

  const pluginSwitch = headerStack.querySelector<HTMLElement>('.MuiSwitch-root, input[type="checkbox"], [role="switch"]');
  if (pluginSwitch) {
    if (kind === "core") pluginSwitch.dataset.lunaticCorePluginSwitch = "true";
    else pluginSwitch.dataset.lunaticInstalledPluginSwitch = "true";
  }

  Array.from(headerStack.querySelectorAll<HTMLElement>("button,[role=button]")).forEach((button) => {
    const label = actionLabel(button);
    const role =
      label.includes("reload plugin") ? "reload" :
      label.includes("live reloading") ? "live-reload" :
      label.includes("show settings") || label.includes("hide settings") ? "settings" :
      label.includes("uninstall plugin") ? "uninstall" :
      "";

    if (!role) return;
    if (kind === "core") button.dataset.lunaticCorePluginAction = role;
    else button.dataset.lunaticInstalledPluginAction = role;
  });

  const version = title.querySelector<HTMLElement>(".MuiTypography-caption, [data-version]");
  if (version) {
    if (kind === "core") version.dataset.lunaticCorePluginVersion = "true";
    else version.dataset.lunaticInstalledPluginVersion = "true";
  }

  const children = Array.from(headerStack.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
  const last = children.at(-1);
  if (last && last !== title && !last.matches("button") && !last.querySelector('.MuiSwitch-root, [role="switch"]')) {
    if (kind === "core") {
      last.dataset.lunaticCorePluginAuthor = "true";
      const authorName = last.querySelector<HTMLElement>("[name],p,span");
      if (authorName) authorName.dataset.lunaticCorePluginAuthorName = "true";
      const avatar = last.querySelector<HTMLElement>(".MuiAvatar-root,img");
      if (avatar) avatar.dataset.lunaticCorePluginAuthorAvatar = "true";
    } else {
      last.dataset.lunaticInstalledPluginAuthor = "true";
      const authorName = last.querySelector<HTMLElement>("[name],p,span");
      if (authorName) authorName.dataset.lunaticInstalledPluginAuthorName = "true";
      const avatar = last.querySelector<HTMLElement>(".MuiAvatar-root,img");
      if (avatar) avatar.dataset.lunaticInstalledPluginAuthorAvatar = "true";
      bindOverflowPopover(last);
    }
  }

  const spacer = children.find((child) =>
    child !== title && !child.matches("button") && !child.querySelector('.MuiSwitch-root') && !child.textContent?.trim()
  );
  if (spacer) {
    if (kind === "core") spacer.dataset.lunaticCorePluginSpacer = "true";
    else spacer.dataset.lunaticInstalledPluginSpacer = "true";
  }
}

export function markLunaticSettingsRows() {
  /* Installed plugin recognizer starts from the uninstall action, which is a
     stable semantic signal exposed by Luna itself. */
  document.querySelectorAll<HTMLButtonElement>('button[aria-label="Uninstall plugin"], button[title="Uninstall plugin"]').forEach((button) => {
    const row = installedPluginCardFromUninstall(button);
    if (row) markPluginCard(row, "installed");
  });

  /* Core plugins have no enable/uninstall controls. Start from Reload plugin
     and require a sibling Show/Hide settings action before marking anything. */
  document.querySelectorAll<HTMLButtonElement>('button[aria-label="Reload plugin"], button[title="Reload plugin"]').forEach((button) => {
    const row = corePluginCardFromReload(button);
    if (row) markPluginCard(row, "core");
  });
}
