import { LunaPlugin, Tracer } from "@luna/core";
import { bindOverflowPopover } from "./overflow-popover";
import { closestSemanticCard, nearestCommonAncestor } from "./dom";

const { trace } = Tracer("[Lunatic UI]");

const ORIGINAL_ACTION_SELECTOR =
  '[data-lunatic-original-action="true"], p.MuiTypography-body1';

const DESCRIPTION_SELECTOR =
  '[data-lunatic-plugin-description="true"], h6.MuiTypography-subtitle2, .MuiTypography-subtitle2';

const ACTION_CLASS = "lunatic-plugin-store-real-action";

export type LegacyPluginStoreRuntime = {
  processCard(card: HTMLButtonElement): void;
  markStoreStructure(): void;
  normalizeScopedHeadings(): void;
  blockDirectCardClick(event: MouseEvent, active: boolean): void;
  blockDirectCardPress(event: Event, active: boolean): void;
  cleanup(): void;
};

export function createLegacyPluginStoreRuntime(
  signal: AbortSignal,
  queueScan: () => void,
): LegacyPluginStoreRuntime {
  function findStoreCardTitle(card: HTMLElement) {
    return card.querySelector<HTMLElement>(
      'h6.MuiTypography-h6, h5.MuiTypography-h5, [role="heading"]'
    );
  }

  function findOriginalStoreAction(card: HTMLElement) {
    const explicit = card.querySelector<HTMLElement>(ORIGINAL_ACTION_SELECTOR);
    if (explicit) return explicit;

    return Array.from(card.querySelectorAll<HTMLElement>("p,span"))
      .find((element) => {
        const value = element.textContent?.trim().toLowerCase();
        return value === "install" || value === "uninstall";
      }) ?? null;
  }

  function findStoreCardDescription(card: HTMLElement, title?: HTMLElement | null) {
    const explicit = card.querySelector<HTMLElement>(DESCRIPTION_SELECTOR);
    if (explicit && explicit !== title) return explicit;

    return Array.from(card.querySelectorAll<HTMLElement>("h6,p,span"))
      .find((element) =>
        element !== title &&
        !!element.textContent?.trim() &&
        !element.querySelector("button,[role=button]")
      ) ?? null;
  }

  function storeCardHeader(card: HTMLElement, title: HTMLElement) {
    return closestSemanticCard(title, (candidate) => {
      if (!card.contains(candidate) || candidate === card) return false;
      return candidate.contains(title) &&
        (!!candidate.querySelector('[author]') ||
         !!candidate.querySelector("button,[role=button]") ||
         candidate.children.length > 1);
    }, 5);
  }

  function isPluginCard(button: HTMLButtonElement) {
    const title = findStoreCardTitle(button);
    const action = findOriginalStoreAction(button);
    const description = findStoreCardDescription(button, title);
    return !!title && !!action && !!description;
  }

  function splitScopedLabel(value: string) {
    const trimmed = value.trim();
    const match = trimmed.match(/^@([^/]+)\/(.+)$/);
    if (!match) return null;

    return {
      full: trimmed,
      author: match[1],
      name: match[2],
    };
  }

  function normalizeScopedAnchor(anchor: HTMLAnchorElement) {
    const visible = anchor.textContent?.trim() || "";
    const source =
      anchor.dataset.lunaticOriginalScopedLabel ||
      (visible.startsWith("@") ? visible : "") ||
      anchor.getAttribute("aria-label") ||
      visible ||
      "";

    const parsed = splitScopedLabel(source);
    if (!parsed) return null;

    anchor.dataset.lunaticOriginalScopedLabel = parsed.full;
    anchor.title = parsed.full;

    if (anchor.textContent?.trim() !== parsed.name) {
      anchor.textContent = parsed.name;
    }

    return parsed;
  }

  /* Store/category headers and plugin titles are all LunaPluginHeader titles.
     Normalize every scoped h6 link instead of trying to infer a particular MUI
     Grid ancestry. This also survives DEV headers such as:
         @luna/template [DEV] -> template [DEV]
  */
  function normalizeScopedHeadings() {
    document
      .querySelectorAll<HTMLAnchorElement>("h6.MuiTypography-h6 > a")
      .forEach((anchor) => {
        const visible = anchor.textContent?.trim() || "";
        const aria = anchor.getAttribute("aria-label") || "";
        const stored = anchor.dataset.lunaticOriginalScopedLabel || "";

        if (
          visible.startsWith("@") ||
          aria.startsWith("@") ||
          stored.startsWith("@")
        ) {
          normalizeScopedAnchor(anchor);
        }
      });
  }

  function normalizeStoreControls(
    controls: HTMLElement,
    search: HTMLInputElement,
  ) {
    controls.dataset.lunaticPluginStoreControls = "true";

    const fields = Array.from(controls.querySelectorAll<HTMLInputElement>("input"))
      .map((input) =>
        input.closest<HTMLElement>(".MuiFormControl-root, label, [role=group], div") ?? input.parentElement
      )
      .filter((field): field is HTMLElement => field instanceof HTMLElement)
      .filter((field, index, all) => all.indexOf(field) === index);

    for (const field of fields) {
      const input = field.querySelector<HTMLInputElement>("input");
      if (!input) continue;

      field.dataset.lunaticStoreField = "true";

      if (input === search) {
        field.dataset.lunaticSearchField = "true";
        input.dataset.lunaticSearchInput = "true";

        if (input.placeholder !== "") input.placeholder = "";
        if (input.getAttribute("aria-label") !== "Search plugins") {
          input.setAttribute("aria-label", "Search plugins");
        }

        if (field.dataset.lunaticFieldLabel !== "Search plugins") {
          field.dataset.lunaticFieldLabel = "Search plugins";
        }
        const searchLabel = field.querySelector<HTMLElement>(".MuiInputLabel-root, label");
        if (searchLabel) searchLabel.dataset.lunaticStoreFieldLabel = "true";
        const searchSurface = input.closest<HTMLElement>(".MuiOutlinedInput-root, [role=combobox], [role=textbox]") ?? input.parentElement;
        if (searchSurface instanceof HTMLElement) searchSurface.dataset.lunaticStoreInputSurface = "true";
        continue;
      }

      /* InstallFromUrl owns a genuine dynamic MUI label. Preserve its state
         text (normal / success / error) but render it through the same visual
         label slot as Search. */
      const muiLabel = field.querySelector<HTMLElement>(".MuiInputLabel-root, label");
      if (muiLabel) muiLabel.dataset.lunaticStoreFieldLabel = "true";
      const inputSurface = input.closest<HTMLElement>(".MuiOutlinedInput-root, [role=combobox], [role=textbox]") ?? input.parentElement;
      if (inputSurface instanceof HTMLElement) inputSurface.dataset.lunaticStoreInputSurface = "true";
      const labelText = muiLabel?.textContent?.trim() || "Install from URL";

      if (field.dataset.lunaticFieldLabel !== labelText) {
        field.dataset.lunaticFieldLabel = labelText;
      }
    }
  }


  function storeHeaderFromGrid(grid: HTMLElement) {
    const store = closestSemanticCard(grid, (candidate) => {
      if (candidate === grid) return false;
      const hasHeading = !!candidate.querySelector('h6.MuiTypography-h6, h5.MuiTypography-h5, [role="heading"]');
      return hasHeading && candidate.contains(grid);
    }, 5);
    if (!store) return null;

    const title = Array.from(store.querySelectorAll<HTMLElement>(
      'h6.MuiTypography-h6, h5.MuiTypography-h5, [role="heading"]'
    )).find((candidate) => !grid.contains(candidate));
    if (!title) return { store, header: null as HTMLElement | null };

    const header = closestSemanticCard(title, (candidate) =>
      candidate !== store && store.contains(candidate) && !candidate.contains(grid)
    , 4) ?? title.parentElement;

    return { store, header: header instanceof HTMLElement ? header : null };
  }

  function markStoreStructure() {
    document
      .querySelectorAll<HTMLElement>('[data-lunatic-plugin-grid-item="true"]')
      .forEach((gridItem) => {
        const grid = closestSemanticCard(gridItem, (candidate) => {
          if (!candidate.contains(gridItem)) return false;
          return candidate.querySelectorAll('[data-lunatic-plugin-grid-item="true"]').length >= 1;
        }, 5);
        if (!grid) return;

        grid.dataset.lunaticPluginStoreGrid = "true";

        const parts = storeHeaderFromGrid(grid);
        if (!parts) return;
        const { store, header } = parts;
        store.dataset.lunaticPluginStore = "true";

        if (header) {
          header.dataset.lunaticPluginStoreHeader = "true";

          const headerRow = Array.from(header.children).find((child): child is HTMLElement =>
            child instanceof HTMLElement &&
            (!!child.querySelector("button,[role=button]") || !!child.querySelector("[author]"))
          ) ?? header;
          headerRow.dataset.lunaticPluginStoreHeaderRow = "true";

          const storeTitle = header.querySelector<HTMLElement>(
            'h6.MuiTypography-h6, h5.MuiTypography-h5, [role="heading"]'
          );
          const storeDescription = Array.from(header.querySelectorAll<HTMLElement>(
            'h6.MuiTypography-subtitle2, .MuiTypography-subtitle2, p'
          )).find((candidate) => candidate !== storeTitle && !!candidate.textContent?.trim());

          if (storeTitle) {
            storeTitle.dataset.lunaticPluginStoreTitle = "true";
            bindOverflowPopover(storeTitle);
          }
          if (storeDescription) bindOverflowPopover(storeDescription);

          const actionButtons = Array.from(header.querySelectorAll<HTMLElement>("button,[role=button]"));
          actionButtons.forEach((button) => {
            button.dataset.lunaticStoreAction = "true";
          });

          const author = header.querySelector<HTMLElement>("[author]") ??
            Array.from(header.children).find((child): child is HTMLElement =>
              child instanceof HTMLElement &&
              child !== storeTitle &&
              !child.matches("button,[role=button]") &&
              !!child.textContent?.trim()
            );
          if (author) {
            author.dataset.lunaticStoreAuthor = "true";
            const authorName = author.querySelector<HTMLElement>("[name],p,span");
            if (authorName) authorName.dataset.lunaticStoreAuthorName = "true";
            const authorAvatar = author.querySelector<HTMLElement>(".MuiAvatar-root,img");
            if (authorAvatar) authorAvatar.dataset.lunaticStoreAuthorAvatar = "true";
            bindOverflowPopover(author);
          }

          Array.from(header.children).forEach((child) => {
            if (!(child instanceof HTMLElement)) return;
            if (
              child !== storeTitle &&
              !child.textContent?.trim() &&
              !child.querySelector("button,[role=button],input,select,textarea")
            ) {
              child.dataset.lunaticStoreSpacer = "true";
            }
          });
        }
      });

    const search =
      document.querySelector<HTMLInputElement>('input[placeholder="Search plugins..."]') ??
      document.querySelector<HTMLInputElement>('input[aria-label="Search plugins"]') ??
      document.querySelector<HTMLInputElement>('input[data-lunatic-search-input="true"]');

    if (!search) return;

    const installInput = Array.from(document.querySelectorAll<HTMLInputElement>("input"))
      .find((input) => {
        if (input === search) return false;
        const label = input.getAttribute("aria-label") || input.placeholder || "";
        if (/install from url/i.test(label)) return true;
        const field = input.closest<HTMLElement>(".MuiFormControl-root, label, [role=group], div");
        return !!Array.from(field?.querySelectorAll<HTMLElement>("label,.MuiInputLabel-root") ?? [])
          .find((candidate) => /install from url/i.test(candidate.textContent || ""));
      });

    const controls = installInput
      ? nearestCommonAncestor(search, installInput, 7)
      : search.closest<HTMLElement>(".MuiStack-root, [role=group], section, div");

    if (controls) normalizeStoreControls(controls, search);
  }

  function parseScopedName(anchor: HTMLAnchorElement | null) {
    if (!anchor) return null;

    const source =
      anchor.dataset.lunaticOriginalPluginName ||
      anchor.dataset.lunaticOriginalScopedLabel ||
      anchor.getAttribute("aria-label") ||
      anchor.textContent?.trim() ||
      "";

    const parsed = splitScopedLabel(source);
    if (!parsed) return null;

    return {
      full: parsed.full,
      author: parsed.author,
      plugin: parsed.name,
    };
  }

  function normalizeTitle(title: HTMLElement) {
    title.dataset.lunaticPluginTitle = "true";

    const anchor = title.querySelector<HTMLAnchorElement>(":scope > a");
    const parsed = parseScopedName(anchor);

    if (anchor && parsed) {
      anchor.dataset.lunaticOriginalPluginName = parsed.full;
      normalizeScopedAnchor(anchor);
    }

    return parsed;
  }

  function githubUrl(author: string, repo?: string) {
    const owner = author.trim().replace(/^@/, "");
    if (!owner) return null;
    return repo
      ? `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
      : `https://github.com/${encodeURIComponent(owner)}`;
  }

  function markCardLinks(
    header: HTMLElement,
    parsed: ReturnType<typeof parseScopedName>,
  ) {
    const titleAnchor = header.querySelector<HTMLAnchorElement>(
      ':scope > h6.MuiTypography-h6 > a'
    );

    if (titleAnchor) {
      titleAnchor.dataset.lunaticPluginTitleLink = "true";

      /* LunaStorePlugin does not pass `link` to LunaPluginHeader. LunaLink then
         renders href="", and HTMLAnchorElement.href resolves that empty value to
         the current TIDAL page. Use the RAW attribute or we'd mistake TIDAL for
         a valid plugin URL and never reach the GitHub fallback. */
      const rawHref = titleAnchor.getAttribute("href")?.trim() || "";
      if (titleAnchor.dataset.lunaticOriginalHref === undefined) {
        titleAnchor.dataset.lunaticOriginalHref = rawHref;
      }

      const inferred =
        parsed && githubUrl(
          parsed.author,
          parsed.plugin.replace(/\s+\[DEV\]$/i, ""),
        );

      const target =
        /^https?:\/\//i.test(rawHref)
          ? rawHref
          : inferred;

      if (target) {
        titleAnchor.dataset.lunaticPluginUrl = target;
        titleAnchor.href = target;
        titleAnchor.target = "_blank";
        titleAnchor.rel = "noopener noreferrer";
        titleAnchor.style.setProperty("pointer-events", "auto", "important");
        titleAnchor.style.setProperty("cursor", "pointer", "important");

        if (titleAnchor.dataset.lunaticTitleClickBound !== "true") {
          titleAnchor.dataset.lunaticTitleClickBound = "true";
          titleAnchor.addEventListener("click", (event: MouseEvent) => {
            const url = titleAnchor.dataset.lunaticPluginUrl;
            if (!url) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            window.open(url, "_blank", "noopener,noreferrer");
          }, { capture: true, signal });
        }
      }
    }

    const author = header.querySelector<HTMLElement>(":scope > [author]");
    if (author) {
      author.dataset.lunaticPluginAuthorLink = "true";

      const image = author.querySelector<HTMLImageElement>("img");
      let target: string | null = null;

      if (image?.src) {
        try {
          const u = new URL(image.src);
          if (u.hostname === "avatars.githubusercontent.com") {
            const owner = u.pathname.split("/").filter(Boolean)[0];
            if (owner) target = githubUrl(owner);
          }
        } catch {}
      }

      if (!target && parsed) target = githubUrl(parsed.author);

      const authorName =
        author.querySelector<HTMLElement>("p[name]")?.getAttribute("name") ||
        parsed?.author ||
        "";

      if (!target && authorName) target = githubUrl(authorName);

      if (target) {
        author.dataset.lunaticAuthorUrl = target;
        author.setAttribute("role", "link");
        author.tabIndex = 0;
        author.style.setProperty("pointer-events", "auto", "important");
        author.style.setProperty("cursor", "pointer", "important");
      }

      if (author.dataset.lunaticKeyboardBound !== "true") {
        author.dataset.lunaticKeyboardBound = "true";
        author.addEventListener("keydown", (event: KeyboardEvent) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          const url = author.dataset.lunaticAuthorUrl;
          if (!url) return;
          event.preventDefault();
          event.stopPropagation();
          window.open(url, "_blank", "noopener,noreferrer");
        }, { signal });
      }
    }
  }

  function ensureAuthor(header: HTMLElement, parsed: ReturnType<typeof parseScopedName>) {
    const existing = header.querySelector<HTMLElement>(":scope > [author]");

    if (existing) {
      existing.dataset.lunaticPluginAuthor = "true";
      const name = existing.querySelector<HTMLElement>("[name],p,span");
      if (name) name.dataset.lunaticPluginAuthorName = "true";
      const avatar = existing.querySelector<HTMLElement>(".MuiAvatar-root,img");
      if (avatar) avatar.dataset.lunaticPluginAuthorAvatar = "true";
      return;
    }

    let generated = header.querySelector<HTMLElement>(":scope > .lunatic-plugin-generated-author");

    if (!parsed) {
      generated?.remove();
      return;
    }

    if (!generated) {
      generated = document.createElement("div");
      generated.className = "lunatic-plugin-generated-author";
      generated.dataset.lunaticPluginAuthor = "true";
      header.appendChild(generated);
    }

    const wanted = `by ${parsed.author}`;
    if (generated.textContent !== wanted) generated.textContent = wanted;
  }


  function bindDescription(description: HTMLElement) {
    bindOverflowPopover(description);
  }

  function findGridItem(card: HTMLButtonElement) {
    const parent = card.parentElement;
    if (parent instanceof HTMLElement && parent.classList.contains("MuiGrid-root")) return parent;
    return null;
  }

  function hideOriginalAction(original: HTMLElement) {
    original.dataset.lunaticOriginalAction = "true";
    original.setAttribute("aria-hidden", "true");

    /* The user's theme contains older !important rules that deliberately make
       Luna's Typography action visible. A stylesheet rule in this plugin can
       therefore lose depending on cascade-layer order. Inline !important wins
       deterministically, so keep the original node only as Luna state source. */
    original.style.setProperty("display", "none", "important");
    original.style.setProperty("visibility", "hidden", "important");
    original.style.setProperty("pointer-events", "none", "important");
    original.style.setProperty("position", "absolute", "important");
    original.style.setProperty("width", "0", "important");
    original.style.setProperty("height", "0", "important");
    original.style.setProperty("margin", "0", "important");
    original.style.setProperty("padding", "0", "important");
    original.style.setProperty("overflow", "hidden", "important");
  }

  function restoreOriginalAction(original: HTMLElement) {
    delete original.dataset.lunaticOriginalAction;
    original.removeAttribute("aria-hidden");
    [
      "display", "opacity", "visibility", "pointer-events", "position",
      "width", "height", "margin", "padding", "overflow",
    ].forEach((property) => original.style.removeProperty(property));
  }

  function clearPluginCardUx(card: HTMLButtonElement) {
    card.tabIndex = 0;

    const grid = findGridItem(card);
    grid?.querySelector<HTMLButtonElement>(`:scope > button.${ACTION_CLASS}`)?.remove();

    const original = findOriginalStoreAction(card);
    if (original) restoreOriginalAction(original);

    const titleAnchor = card.querySelector<HTMLAnchorElement>('[data-lunatic-plugin-title-link="true"]');
    if (titleAnchor) {
      const originalHref = titleAnchor.dataset.lunaticOriginalHref;
      if (originalHref !== undefined) titleAnchor.setAttribute("href", originalHref);
      titleAnchor.style.removeProperty("pointer-events");
      titleAnchor.style.removeProperty("cursor");
      delete titleAnchor.dataset.lunaticPluginTitleLink;
      delete titleAnchor.dataset.lunaticPluginUrl;
    }

    const author = card.querySelector<HTMLElement>('[data-lunatic-plugin-author-link="true"]');
    if (author) {
      author.removeAttribute("role");
      author.removeAttribute("tabindex");
      author.style.removeProperty("pointer-events");
      author.style.removeProperty("cursor");
      delete author.dataset.lunaticPluginAuthorLink;
      delete author.dataset.lunaticAuthorUrl;
    }
  }

  function cardPluginName(card: HTMLButtonElement) {
    const anchor = card.querySelector<HTMLAnchorElement>(
      '[data-lunatic-plugin-title-link="true"], h6.MuiTypography-h6 > a'
    );
    if (!anchor) return null;

    return (
      anchor.dataset.lunaticOriginalPluginName ||
      anchor.dataset.lunaticOriginalScopedLabel ||
      anchor.getAttribute("aria-label") ||
      ""
    ).trim() || null;
  }

  function cardPluginVersion(card: HTMLButtonElement) {
    const caption = card.querySelector<HTMLElement>(
      'h6.MuiTypography-h6 > .MuiTypography-caption'
    );
    return (caption?.textContent?.trim() || "")
      .replace(/\s*\[DEV\]\s*$/i, "")
      .trim();
  }

  function resolvePluginInstance(card: HTMLButtonElement) {
    const fullName = cardPluginName(card);
    if (!fullName) return null;

    const candidates = LunaPlugin.getAllByName(fullName);
    if (!candidates.length) return null;

    const version = cardPluginVersion(card);
    const isDevCard = /\[DEV\]\s*$/i.test(
      card.querySelector<HTMLElement>('h6.MuiTypography-h6')?.textContent || ""
    );

    let pool = candidates.filter((plugin) => plugin.isDev === isDevCard);
    if (!pool.length) pool = candidates;

    if (version) {
      const exactVersion = pool.filter(
        (plugin) => (plugin.package?.version || "").trim() === version
      );
      if (exactVersion.length) pool = exactVersion;
    }

    /* Store cards are normally unique by name/version/store URL. If more than
       one display instance remains, prefer the installed one only when Luna's
       own source label currently says Uninstall; otherwise prefer a non-installed
       display instance. This is a fallback for duplicate stores, not the normal
       path. */
    const original = findOriginalStoreAction(card);
    const wantsInstalled = (original?.textContent || "").toLowerCase().includes("uninstall");
    const stateMatch = pool.find((plugin) => plugin.installed === wantsInstalled);
    return stateMatch ?? pool[0] ?? null;
  }

  function setRealActionState(
    real: HTMLButtonElement,
    installed: boolean,
  ) {
    const kind = installed ? "uninstall" : "install";
    const label = installed ? "Uninstall" : "Install";

    real.dataset.lunaticActionKind = kind;
    if (real.textContent !== label) real.textContent = label;
    if (real.getAttribute("aria-label") !== label) real.setAttribute("aria-label", label);
    if (real.title !== label) real.title = label;
  }

  function syncActionsForPlugin(fullName: string) {
    const installed = LunaPlugin.getAllByName(fullName).find((plugin) => plugin.installed);

    document
      .querySelectorAll<HTMLButtonElement>(`.${ACTION_CLASS}[data-lunatic-plugin-full-name]`)
      .forEach((real) => {
        if (real.dataset.lunaticPluginFullName !== fullName) return;
        const url = real.dataset.lunaticPluginUrl;
        setRealActionState(real, !!installed && installed.url === url);
      });
  }

  function bindRealActionToPlugin(card: HTMLButtonElement, real: HTMLButtonElement) {
    const plugin = resolvePluginInstance(card);
    if (!plugin) return false;

    const fullName = cardPluginName(card);
    if (!fullName) return false;

    real.dataset.lunaticPluginFullName = fullName;
    real.dataset.lunaticPluginUrl = plugin.url;
    setRealActionState(real, plugin.installed);
    return true;
  }

  function ensureRealAction(card: HTMLButtonElement) {
    const grid = findGridItem(card);
    if (!grid) return;

    grid.dataset.lunaticPluginGridItem = "true";

    const original = findOriginalStoreAction(card);
    if (original) hideOriginalAction(original);

    let real = grid.querySelector<HTMLButtonElement>(`:scope > button.${ACTION_CLASS}`);
    if (!real) {
      real = document.createElement("button");
      real.type = "button";
      real.className = ACTION_CLASS;
      grid.appendChild(real);

      real.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (real!.dataset.lunaticBusy === "true") return;

        const url = real!.dataset.lunaticPluginUrl;
        const fullName = real!.dataset.lunaticPluginFullName;
        if (!url || !fullName) {
          queueScan();
          return;
        }

        real!.dataset.lunaticBusy = "true";
        real!.disabled = true;

        try {
          /* Directly use Luna's public plugin lifecycle instead of forwarding a
             synthetic click into LunaStorePlugin's private ButtonBase handler.
             This removes hover nudges, optimistic label timers and card.click(). */
          const plugin = await LunaPlugin.fromStorage({ url });
          if (plugin.installed) await plugin.uninstall();
          else await plugin.install();

          setRealActionState(real!, plugin.installed);
          syncActionsForPlugin(fullName);
        } catch (error) {
          trace.msg.err.withContext(`Plugin Store action failed for ${fullName}`)(error);
        } finally {
          real!.dataset.lunaticBusy = "false";
          real!.disabled = false;
          queueScan();
        }
      }, { signal });
    }

    /* Resolve once while LunaStorePlugin's display instance is definitely
       registered. The URL stays attached to our action even if uninstall()
       removes that display instance from LunaPlugin.plugins. */
    if (!real.dataset.lunaticPluginUrl) bindRealActionToPlugin(card, real);
    else {
      const fullName = real.dataset.lunaticPluginFullName;
      if (fullName) syncActionsForPlugin(fullName);
    }
  }

  function processCard(card: HTMLButtonElement) {
    if (!isPluginCard(card)) return;

    const title = findStoreCardTitle(card);
    const originalAction = findOriginalStoreAction(card);
    const description = findStoreCardDescription(card, title);
    if (!title || !originalAction || !description) return;

    const header = storeCardHeader(card, title) ?? title.parentElement;
    if (!(header instanceof HTMLElement)) return;

    card.dataset.lunaticPluginCard = "true";
    header.dataset.lunaticPluginHeader = "true";

    const cardContent = nearestCommonAncestor(header, description, 5);
    if (cardContent && cardContent !== card) {
      cardContent.dataset.lunaticPluginCardContent = "true";
    }

    const parsed = normalizeTitle(title);
    ensureAuthor(header, parsed);

    description.dataset.lunaticPluginDescription = "true";
    bindDescription(description);

    card.tabIndex = -1;
    markCardLinks(header, parsed);
    hideOriginalAction(originalAction);
    ensureRealAction(card);
  }

  function blockDirectCardClick(event: MouseEvent, active: boolean) {
    if (!active) return;
    const path = event.composedPath();
    const card = path.find((node): node is HTMLButtonElement =>
      node instanceof HTMLButtonElement && node.dataset.lunaticPluginCard === "true"
    );
    if (!card) return;

    const titleLink = path.find((node): node is HTMLAnchorElement =>
      node instanceof HTMLAnchorElement &&
      node.dataset.lunaticPluginTitleLink === "true"
    );

    if (titleLink) {
      const url = titleLink.dataset.lunaticPluginUrl || titleLink.href;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const authorLink = path.find((node): node is HTMLElement =>
      node instanceof HTMLElement &&
      node.dataset.lunaticPluginAuthorLink === "true"
    );

    if (authorLink) {
      const url = authorLink.dataset.lunaticAuthorUrl;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function blockDirectCardPress(event: Event, active: boolean) {
    if (!active) return;
    const path = event.composedPath();
    const card = path.find((node): node is HTMLButtonElement =>
      node instanceof HTMLButtonElement && node.dataset.lunaticPluginCard === "true"
    );
    if (!card) return;

    const interactive = path.some((node) =>
      node instanceof HTMLElement &&
      (
        node.dataset.lunaticPluginTitleLink === "true" ||
        node.dataset.lunaticPluginAuthorLink === "true"
      )
    );
    if (interactive) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function cleanup() {
    document.querySelectorAll<HTMLButtonElement>('[data-lunatic-plugin-card="true"]').forEach((card) => {
      clearPluginCardUx(card);
    });
    document.querySelectorAll(`.${ACTION_CLASS}`).forEach((el) => el.remove());

    document.querySelectorAll<HTMLElement>('[data-lunatic-plugin-grid-item="true"]').forEach((el) =>
      el.removeAttribute("data-lunatic-plugin-grid-item")
    );

    document.querySelectorAll<HTMLButtonElement>('[data-lunatic-plugin-card="true"]').forEach((card) => {
      card.removeAttribute("data-lunatic-plugin-card");
      card.tabIndex = 0;
    });
  }

  return {
    processCard,
    markStoreStructure,
    normalizeScopedHeadings,
    blockDirectCardClick,
    blockDirectCardPress,
    cleanup,
  };
}
