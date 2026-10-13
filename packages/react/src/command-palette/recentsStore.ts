import { useCallback, useSyncExternalStore } from 'react';

/** Every palette's entry starts with this, and ends with its storage key. */
const PREFIX = 'snapshot-ui:recent:';

/** No ids: the server's snapshot, a palette with no key, and the reading of an entry that holds none. */
const NONE: readonly string[] = Object.freeze([]);

/** The entry for a storage key: `snapshot-ui:recent:<storageKey>`. */
export function entryFor(storageKey: string): string {
  return `${PREFIX}${storageKey}`;
}

/** The stored ids, newest first: a JSON list of strings, else []. Unreadable JSON, a non-list, blocked storage all read as []. Non-strings are left out. */
export function read(storage: Pick<Storage, 'getItem'> | null, storageKey: string): string[] {
  try {
    const stored: unknown = JSON.parse(storage?.getItem(entryFor(storageKey)) ?? '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Writes the list; a full or refusing storage keeps nothing. */
export function write(
  ids: readonly string[],
  storage: Pick<Storage, 'setItem'> | null,
  storageKey: string,
): void {
  try {
    storage?.setItem(entryFor(storageKey), JSON.stringify(ids));
  } catch {
    // Full, or blocked: the choice is then remembered only while the palette is on the page.
  }
}

/** `id` moved to the front, never doubled, cut to `limit`. */
export function push(stored: readonly string[], id: string, limit: number): string[] {
  return [id, ...stored.filter((each) => each !== id)].slice(0, Math.max(0, limit));
}

/** The browser's `localStorage`, or null where there is none or the browser blocks it. */
function local(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The palettes on the page, by storage key, each told when its ids change. */
const listeners = new Map<string, Set<() => void>>();

/**
 * The ids as the page knows them, by storage key, while a palette with that key is on the page: read from
 * storage when the first one arrives, changed here before storage is written, so a choice is still listed
 * where storage cannot keep it, read again when another tab writes, and dropped when the last one leaves.
 */
const known = new Map<string, readonly string[]>();

/** The last reading of each entry, by storage key, so an entry that has not changed reads as the same list. */
const readings = new Map<string, { raw: string | null; ids: readonly string[] }>();

/** The raw text of an entry, or null where there is none or the browser refuses it. */
function rawEntry(storageKey: string): string | null {
  try {
    return local()?.getItem(entryFor(storageKey)) ?? null;
  } catch {
    return null;
  }
}

/** The ids in storage for a key, the same list as last time while the entry is unchanged. */
function stored(storageKey: string): readonly string[] {
  const raw = rawEntry(storageKey);
  const last = readings.get(storageKey);
  if (last?.raw === raw) return last.ids;
  const ids = raw === null ? NONE : read({ getItem: () => raw }, storageKey);
  readings.set(storageKey, { raw, ids: ids.length === 0 ? NONE : ids });
  return ids.length === 0 ? NONE : ids;
}

const recents = (storageKey: string): readonly string[] => known.get(storageKey) ?? stored(storageKey);

function tell(storageKey: string): void {
  for (const listener of listeners.get(storageKey) ?? []) listener();
}

/** Another tab wrote an entry or cleared its storage. The event never fires in the tab that wrote. */
function onStorage(event: StorageEvent): void {
  for (const storageKey of listeners.keys()) {
    if (event.key !== null && event.key !== entryFor(storageKey)) continue;
    known.set(storageKey, stored(storageKey));
    tell(storageKey);
  }
}

function subscribe(storageKey: string, listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  let palettes = listeners.get(storageKey);
  if (!palettes) {
    palettes = new Set();
    listeners.set(storageKey, palettes);
    known.set(storageKey, stored(storageKey));
  }
  palettes.add(listener);
  return () => {
    palettes.delete(listener);
    if (palettes.size > 0) return;
    listeners.delete(storageKey);
    known.delete(storageKey);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

const subscribeNothing = (): (() => void) => () => undefined;

/**
 * The remembered ids for `storageKey` through `useSyncExternalStore` (the `storage` event for other
 * tabs, an empty server snapshot), and a recorder. With no key: an empty list and a recorder that
 * stores nothing.
 *
 * Internal: not exported from the package.
 */
export function useRecents(
  storageKey: string | undefined,
  limit: number,
): [ids: readonly string[], record: (id: string) => void] {
  const subscribeKey = useCallback(
    (listener: () => void) =>
      storageKey === undefined ? subscribeNothing() : subscribe(storageKey, listener),
    [storageKey],
  );
  const ids = useSyncExternalStore(
    subscribeKey,
    () => (storageKey === undefined ? NONE : recents(storageKey)),
    () => NONE,
  );
  const record = (id: string): void => {
    if (storageKey === undefined) return;
    const next = push(recents(storageKey), id, limit);
    if (listeners.has(storageKey)) known.set(storageKey, next);
    write(next, local(), storageKey);
    tell(storageKey);
  };
  return [ids, record];
}
