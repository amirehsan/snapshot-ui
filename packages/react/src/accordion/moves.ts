/**
 * The keys that move focus between an accordion's titles (spec 5.4, ruling 2): Arrow Down and Arrow Up to the
 * next and the previous, Home and End to the first and the last. They never wrap, and they never open or fold.
 */
export const ACCORDION_KEYS: readonly string[] = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

/** The path from an accordion's root to each of its own toggles: a nested accordion's are never on it. */
const OWN_TOGGLES =
  ':scope > .accordion-item > .accordion-disclosure > .accordion-heading > .accordion-toggle';

/**
 * Every toggle of the accordion at `root`, its own and no nested accordion's, in the page's order. With
 * `enabledOnly`, a disabled toggle is left out, since the keys pass over it.
 *
 * Internal: not exported from the package.
 */
export function ownToggles(root: Element, enabledOnly = false): HTMLButtonElement[] {
  const toggles = [...root.querySelectorAll<HTMLButtonElement>(OWN_TOGGLES)];
  return enabledOnly ? toggles.filter((toggle) => !toggle.disabled) : toggles;
}

/**
 * The toggle `key` moves focus to from `current` among `toggles`: the next or the previous, the first or the
 * last. `null` at an end, where the key does nothing, for an empty list, and for a key that is not one of
 * `ACCORDION_KEYS`.
 *
 * Internal: not exported from the package.
 */
export function nextToggle<T>(toggles: readonly T[], current: T, key: string): T | null {
  const at = toggles.indexOf(current);
  let next: T | undefined;
  if (key === 'Home') next = toggles[0];
  else if (key === 'End') next = toggles.at(-1);
  else if (at === -1) return null;
  else if (key === 'ArrowDown') next = toggles[at + 1];
  else if (key === 'ArrowUp') next = at === 0 ? undefined : toggles[at - 1];
  return next === undefined || next === current ? null : next;
}
