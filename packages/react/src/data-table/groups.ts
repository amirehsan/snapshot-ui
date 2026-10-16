import type { Key } from './selection';

/** One run of rows in one group: a section of the list face, headed by `label`, or with no heading. */
export interface RowGroup<T> {
  /** Unique among the groups, even when a group's id comes back after another: its run's index and the id. */
  key: string;
  /** The group's heading, the app's string, or null for the one ungrouped section. */
  label: string | null;
  items: T[];
}

/** Rows in runs of one group, in items order: the app sorts, the list groups only what is adjacent (spec 8.1). */
export function groupsOf<T>(
  items: readonly T[],
  getGroup?: (item: T) => { id: Key; label: string },
): RowGroup<T>[] {
  if (getGroup === undefined)
    return items.length === 0 ? [] : [{ key: 'all', label: null, items: [...items] }];
  const groups: RowGroup<T>[] = [];
  let last: Key | undefined;
  for (const item of items) {
    const { id, label } = getGroup(item);
    const current = groups.at(-1);
    if (current !== undefined && id === last) current.items.push(item);
    // Keyed by its run, so a group id that comes back after another is a second, unique section.
    else groups.push({ key: `${String(groups.length)}:${String(id)}`, label, items: [item] });
    last = id;
  }
  return groups;
}
