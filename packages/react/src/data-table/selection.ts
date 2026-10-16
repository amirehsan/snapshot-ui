/*
 * DataTable's selection as the app holds it: an array of keys, never React Aria's 'all' (ruling 4). Pure, so the
 * table face and the list face map their selection the same way. It names no react-aria-components module, which
 * only a client module may import, so React Aria's two types are written out here as React Aria defines them.
 */

/** React Aria's `Key`. */
export type Key = string | number;

/** React Aria's `Selection`: every row, or a set of keys. */
export type Selection = 'all' | Set<Key>;

/** React Aria's selection as the app's keys: 'all' is the given rows' enabled keys, never passed on (ruling 4). */
export function keysOf<T>(
  selection: Selection,
  items: readonly T[],
  getKey: (item: T) => Key,
  disabled: ReadonlySet<Key>,
): Key[] {
  if (selection === 'all') return items.map(getKey).filter((key) => !disabled.has(key));
  return [...selection];
}

/** The selected keys still in `present`, the ones the bar counts (R6). */
export const presentKeys = (selected: readonly Key[], present: ReadonlySet<Key>): Key[] =>
  selected.filter((key) => present.has(key));

/** The selected keys no longer in `present`, which DataTable names in its warning (R6). */
export const staleKeys = (selected: readonly Key[], present: ReadonlySet<Key>): Key[] =>
  selected.filter((key) => !present.has(key));

/** `selected` with `key` taken out when it is in, or added at the end when it is not. */
export const toggled = (selected: readonly Key[], key: Key): Key[] =>
  selected.includes(key) ? selected.filter((each) => each !== key) : [...selected, key];
