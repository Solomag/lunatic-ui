import { closestSemanticCard, nearestCommonAncestor } from "./dom";

function supporterKindFromHeading(text: string) {
  const label = text.trim().toLowerCase();
  if (label.startsWith("sponsors")) return "sponsors";
  if (label.startsWith("contributors")) return "contributors";
  if (label.startsWith("stargazers")) return "stargazers";
  return null;
}

export function markExactSupporterSections() {
  /* Anchor on the semantic section heading, then locate the smallest nearby
     container holding multiple supporter-like entries. */
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>(
      "h1,h2,h3,h4,h5,h6,span,strong,[role=heading]"
    )
  ).filter((heading) => supporterKindFromHeading(heading.textContent || "") !== null);

  for (const heading of headings) {
    const kind = supporterKindFromHeading(heading.textContent || "");
    if (!kind) continue;

    let section: HTMLElement | null = heading;
    let content: HTMLElement | null = null;
    let items: HTMLElement[] = [];

    for (let depth = 0; section && depth < 7; depth++, section = section.parentElement) {
      const candidates = Array.from(section.querySelectorAll<HTMLElement>("a,[role=listitem]"))
        .filter((candidate) =>
          candidate !== heading &&
          (!!candidate.querySelector("img") || !!candidate.textContent?.trim())
        );

      if (candidates.length >= 2) {
        content = nearestCommonAncestor(candidates[0], candidates.at(-1)!, 6) ?? section;
        items = candidates.filter((candidate) => content!.contains(candidate));
        break;
      }
    }

    if (!section || !content || !items.length) continue;

    section.dataset.lunaticExactSupporterSection = kind;
    content.dataset.lunaticExactSupporterStack = kind;

    const grid = closestSemanticCard(items[0], (candidate) =>
      candidate === content || (content!.contains(candidate) && items.every((item) => candidate.contains(item)))
    , 5) ?? content;
    grid.dataset.lunaticExactSupporterGrid = kind;

    items.forEach((item) => {
      item.dataset.lunaticExactSupporterItem = "true";
      const author = item.querySelector<HTMLElement>("[author]") ?? item;
      author.dataset.lunaticExactSupporterAuthor = "true";

      const name = author.querySelector<HTMLElement>("[name],p,span");
      if (name) name.dataset.lunaticExactSupporterName = "true";

      const avatar = author.querySelector<HTMLElement>(".MuiAvatar-root,img");
      if (avatar) avatar.dataset.lunaticExactSupporterAvatar = "true";
    });
  }
}
