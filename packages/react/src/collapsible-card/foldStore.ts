import { useSyncExternalStore } from 'react';

/** The one `localStorage` entry every remembered card shares: a JSON list of the keys of the folded ones. */
const ENTRY = 'snapshot-ui:collapsed';

/**
 * The keys of the folded cards in `storage`. An entry that is missing, is not JSON or is not a list, and a
 * storage that refuses to be read, all read as no folded cards, so every card is open. Anything in the list
 * that is not a string is left out.
 */
export function read(storage: Pick<Storage, 'getItem'> | null): string[] {
  try {
    const stored: unknown = JSON.parse(storage?.getItem(ENTRY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Stores the keys of the folded cards in `storage`. A storage that is full, or refuses the write, keeps
 * nothing.
 */
export function write(keys: readonly string[], storage: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(ENTRY, JSON.stringify(keys));
  } catch {
    // Full, or blocked: the fold then lasts only while the card is on the page.
  }
}

/**
 * The stored keys once the card with `key` has folded or opened: its key is added or taken out, and every
 * other key is kept as it was, in order, whether or not its card is on this page.
 */
export function next(stored: readonly string[], key: string, isFolded: boolean): string[] {
  const others = stored.filter((each) => each !== key);
  return isFolded ? [...others, key] : others;
}

/** The browser's `localStorage`, or null where there is none or the browser blocks it. */
function local(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The remembered cards on the page, each told when the folded keys change. */
const listeners = new Set<() => void>();

/**
 * The folded keys as the page knows them, while a remembered card is on it: read from storage when the first
 * card arrives, changed here before storage is written, so a card still folds where storage cannot keep it,
 * read again when another tab writes, and dropped when the last card leaves.
 */
let known: readonly string[] | undefined;

const folded = (): readonly string[] => known ?? read(local());

function tell(): void {
  for (const listener of listeners) listener();
}

/** Another tab wrote the entry or cleared its storage. The event never fires in the tab that wrote. */
function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== ENTRY) return;
  known = read(local());
  tell();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    known = read(local());
    window.addEventListener('storage', onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    window.removeEventListener('storage', onStorage);
    known = undefined;
  };
}

const subscribeNothing = (): (() => void) => () => undefined;

/**
 * Whether the card with `key` is folded, as this browser remembers it, and a setter that remembers a fold or
 * an open and tells every card with the same key. With no key it reads, stores and subscribes to nothing, and
 * is never folded. The server cannot see the browser's storage, so on the server, and while the page
 * hydrates, nothing is folded: a server-rendered card is drawn open and folds once the page has hydrated.
 *
 * Internal: not exported from the package.
 */
export function useStoredFold(
  key: string | undefined,
): [isFolded: boolean, setFolded: (isFolded: boolean) => void] {
  const isFolded = useSyncExternalStore(
    key === undefined ? subscribeNothing : subscribe,
    () => key !== undefined && folded().includes(key),
    () => false,
  );
  const setFolded = (fold: boolean): void => {
    if (key === undefined) return;
    known = next(folded(), key, fold);
    write(known, local());
    tell();
  };
  return [isFolded, setFolded];
}
