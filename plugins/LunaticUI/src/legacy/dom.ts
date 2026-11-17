export function nearestCommonAncestor(
  first: Element,
  second: Element,
  maxDepth = 6,
): HTMLElement | null {
  let current: HTMLElement | null = first instanceof HTMLElement ? first : first.parentElement;
  let depth = 0;
  while (current && depth <= maxDepth) {
    if (current.contains(second)) return current;
    current = current.parentElement;
    depth += 1;
  }
  return null;
}

export function closestSemanticCard(
  seed: HTMLElement,
  predicate: (candidate: HTMLElement) => boolean,
  maxDepth = 8,
) {
  let candidate: HTMLElement | null = seed;
  for (let depth = 0; candidate && candidate !== document.body && depth < maxDepth; depth++) {
    if (predicate(candidate)) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}
