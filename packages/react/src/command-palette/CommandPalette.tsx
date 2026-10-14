'use client';

import { Search } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Autocomplete,
  Dialog as RACDialog,
  Input as RACInput,
  TextField as RACTextField,
  useFilter,
  type AutocompleteProps,
  type Key,
} from 'react-aria-components';
import { Kbd } from '../kbd/Kbd';
import { MenuList } from '../menu/Menu';
import { MenuItem } from '../menu/MenuItem';
import { MenuSection } from '../menu/MenuSection';
import { ModalFrame } from '../overlay/ModalFrame';
import { isAnotherModalOpen } from '../overlay/useOverlayStack';
import { Spinner } from '../spinner/Spinner';
import { QUIET_MS } from '../utils/quiet';
import { push, useRecents } from './recentsStore';
import { matchesShortcut, parseShortcut } from './shortcut';

export interface CommandPaletteItem {
  id: Key;
  /** The label, matched by the default filter and announced. */
  label: string;
  /** A subtitle under the label, matched too. */
  description?: string;
  /** Extra text that matches but is not drawn. */
  keywords?: string;
  /** A 16px icon at the start. */
  icon?: ReactNode;
  /** A preformatted value at the end, such as an amount. Never formatted here. */
  end?: ReactNode;
  /** A key hint, drawn as keys. "Mod" draws as the platform's modifier after mount and as "Mod" on the server. */
  shortcut?: string;
  /** Items with the same section are grouped under it, in first-seen order. Items without one come first. */
  section?: string;
  isDisabled?: boolean;
}

export interface CommandPaletteLabels {
  /** @default the `label` */
  placeholder: string;
  /** @default 'No results' */
  empty: string;
  /** @default 'Loading' */
  loading: string;
  /** @default 'Recent' */
  recent: string;
  /**
   * The status line. Replace it to translate, plurals included.
   * @default (count, query) => count === 0 ? `No results for ${query}` : count === 1 ? '1 result' : `${count} results`
   */
  status: (count: number, query: string) => string;
  /** @default 'Esc' */ escape: string;
  /** @default 'to move' */ move: string;
  /** @default 'to open' */ open: string;
}

export interface CommandPaletteProps {
  /** The dialog's and the input's accessible name, and the placeholder unless `labels.placeholder` is given. Required. */
  label: string;
  /** Every item that may show. In manual mode (`filter={null}`) the app passes the current results, already ordered and capped. */
  items: CommandPaletteItem[];
  /** Runs when an item is chosen, after the palette has closed and focus has returned. The app navigates here. */
  onAction: (item: CommandPaletteItem) => void;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (value: string) => void;
  /**
   * Keeps or drops an item for a query. Unless given: every whitespace-separated word of the query
   * appears in the label, description or keywords, case and accent insensitive. `null` is manual mode:
   * the items are shown as given, and the app filters, ranks and caps them from `inputValue`.
   */
  filter?: ((item: CommandPaletteItem, query: string) => boolean) | null;
  /** Shows the Spinner in the field row while the app loads results. The list keeps what it has. */
  isLoading?: boolean;
  /**
   * The key that opens and closes it. `Mod` is Cmd or Ctrl, either. `false` turns it off. It does nothing while
   * another of this library's modals is open (Dialog, ConfirmDialog, Drawer, Sheet). @default 'Mod+K'
   */
  shortcut?: string | false;
  /** Remembers chosen items in this browser under this key. */
  storageKey?: string;
  /** @default 5 */
  recentLimit?: number;
  /** Controlled recents, newest first. With `onRecentChange`, the palette stores nothing. */
  recentIds?: Key[];
  /**
   * Called with the new list, newest first, each time an item is chosen. With `recentIds` it holds your keys
   * as given, the chosen item's own first; otherwise it is the list as stored, so every id is a string.
   */
  onRecentChange?: (ids: Key[]) => void;
  labels?: Partial<CommandPaletteLabels>;
  /** Goes on the surface. */
  className?: string;
  ref?: Ref<HTMLElement>;
}

/** A palette's words, but the placeholder, which defaults to its label. */
const DEFAULT_LABELS: Omit<CommandPaletteLabels, 'placeholder'> = {
  empty: 'No results',
  loading: 'Loading',
  recent: 'Recent',
  status: (count, query) =>
    count === 0 ? `No results for ${query}` : count === 1 ? '1 result' : `${String(count)} results`,
  escape: 'Esc',
  move: 'to move',
  open: 'to open',
};

/** React Aria's collection filter: the node's text value, the field's text, and the node. */
type CollectionFilter = NonNullable<AutocompleteProps<CommandPaletteItem>['filter']>;

/** What the default filter searches: the label, the description and the keywords, one per line. */
const textOf = (item: CommandPaletteItem): string =>
  [item.label, item.description, item.keywords]
    .filter((part) => part !== undefined && part !== '')
    .join('\n');

/** The words of a query, split at whitespace. */
const wordsOf = (query: string): string[] => query.split(/\s+/).filter(Boolean);

/** The items with no section first, then each section's items under its name, in the order first seen. */
function grouped(items: readonly CommandPaletteItem[]): {
  loose: CommandPaletteItem[];
  sections: [title: string, items: CommandPaletteItem[]][];
} {
  const loose: CommandPaletteItem[] = [];
  const sections = new Map<string, CommandPaletteItem[]>();
  for (const item of items) {
    if (item.section === undefined || item.section === '') {
      loose.push(item);
      continue;
    }
    const section = sections.get(item.section);
    if (section) section.push(item);
    else sections.set(item.section, [item]);
  }
  return { loose, sections: [...sections] };
}

/** One row: the item's label names it, and its icon, second line, end value and key draw around it. */
function Row({ item, id }: { item: CommandPaletteItem; id: Key }): ReactElement {
  return (
    <MenuItem
      id={id}
      value={item}
      icon={item.icon}
      description={item.description}
      end={item.end}
      shortcut={item.shortcut}
      isDisabled={item.isDisabled}
      textValue={textOf(item)}
    >
      {item.label}
    </MenuItem>
  );
}

interface PaletteContentProps {
  label: string;
  labels: CommandPaletteLabels;
  items: CommandPaletteItem[];
  recent: CommandPaletteItem[];
  filter: CommandPaletteProps['filter'];
  isLoading: boolean;
  inputValue: string | undefined;
  defaultInputValue: string | undefined;
  onInputChange: ((value: string) => void) | undefined;
  onChoose: (item: CommandPaletteItem) => void;
}

/**
 * Everything inside the dialog. It mounts each time the palette opens, so an uncontrolled field starts from
 * `defaultInputValue` every time, and the default filter's collator is made only in a browser that opened it.
 */
function PaletteContent({
  label,
  labels,
  items,
  recent,
  filter,
  isLoading,
  inputValue,
  defaultInputValue,
  onInputChange,
  onChoose,
}: PaletteContentProps): ReactElement {
  const [ownQuery, setOwnQuery] = useState(defaultInputValue ?? '');
  const query = inputValue ?? ownQuery;
  const isEmpty = query.trim() === '';

  // Whether an item stays for a query: the caller's filter, every word in its text, or, in manual mode, null.
  const { contains } = useFilter({ sensitivity: 'base' });
  const keeps = useMemo(() => {
    if (filter === null) return null;
    if (filter) return filter;
    return (item: CommandPaletteItem, text: string): boolean =>
      wordsOf(text).every((word) => contains(textOf(item), word));
  }, [filter, contains]);
  // React Aria's filter applies only once there is text, and hides a section none of whose items stay.
  const collectionFilter = useMemo<CollectionFilter | undefined>(
    () =>
      keeps === null || isEmpty
        ? undefined
        : (_textValue, text, node) => (node.value ? keeps(node.value, text) : true),
    [keeps, isEmpty],
  );

  // The status line speaks once typing has paused, so it never talks over the letters being typed.
  const [isPaused, setPaused] = useState(true);
  const pause = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(pause.current);
    },
    [],
  );
  const changeInput = (value: string): void => {
    if (inputValue === undefined) setOwnQuery(value);
    onInputChange?.(value);
    setPaused(false);
    clearTimeout(pause.current);
    pause.current = setTimeout(() => {
      setPaused(true);
    }, QUIET_MS);
  };
  const count = keeps === null ? items.length : items.filter((item) => keeps(item, query)).length;
  const message = isEmpty || !isPaused || isLoading ? '' : labels.status(count, query);

  const { loose, sections } = useMemo(() => grouped(items), [items]);
  // Every row's key, the Recent copies' included, back to the item as the app passed it.
  const byKey = useMemo(() => {
    const map = new Map<Key, CommandPaletteItem>();
    for (const item of items) map.set(item.id, item);
    for (const item of recent) map.set(`recent:${String(item.id)}`, item);
    return map;
  }, [items, recent]);

  return (
    <Autocomplete<CommandPaletteItem>
      inputValue={query}
      onInputChange={changeInput}
      filter={collectionFilter}
    >
      <div className="command-palette-field">
        <Search className="command-palette-glass" aria-hidden="true" />
        <RACTextField aria-label={label} className="command-palette-textfield">
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- initial focus inside a modal is the dialog pattern, and the palette opens to be typed in */}
          <RACInput className="command-palette-input" placeholder={labels.placeholder} autoFocus />
        </RACTextField>
        {isLoading ? (
          <Spinner size="md" aria-label={labels.loading} className="command-palette-spinner" />
        ) : null}
        <Kbd>{labels.escape}</Kbd>
      </div>
      <div className="command-palette-body">
        <MenuList
          className="command-palette-list"
          aria-label={label}
          shouldFocusWrap
          onAction={(key) => {
            const item = byKey.get(key);
            if (item) onChoose(item);
          }}
          renderEmptyState={
            // An empty field has nothing to report, and a list still loading has not yet found nothing.
            isEmpty || isLoading
              ? undefined
              : () => <div className="command-palette-empty">{labels.empty}</div>
          }
        >
          {isEmpty && recent.length > 0 ? (
            <MenuSection title={labels.recent}>
              {recent.map((item) => {
                // The copy's key is its own, so the collection's keys stay unique.
                const key = `recent:${String(item.id)}`;
                return <Row key={key} id={key} item={item} />;
              })}
            </MenuSection>
          ) : null}
          {loose.map((item) => (
            <Row key={String(item.id)} id={item.id} item={item} />
          ))}
          {sections.map(([title, list]) => (
            <MenuSection key={title} title={title}>
              {list.map((item) => (
                <Row key={String(item.id)} id={item.id} item={item} />
              ))}
            </MenuSection>
          ))}
        </MenuList>
      </div>
      <div className="command-palette-status" role="status">
        {message}
      </div>
      <div className="command-palette-footer">
        <span>
          <Kbd>{'↑'}</Kbd> <Kbd>{'↓'}</Kbd> {labels.move}
        </span>
        <span>
          <Kbd>{'↵'}</Kbd> {labels.open}
        </span>
      </div>
    </Autocomplete>
  );
}

/**
 * A search-and-jump dialog near the top of the viewport, opened and closed by Cmd or Ctrl+K: a field that
 * keeps focus over a list whose active row moves with the arrows, every typed word matched, sections, recent
 * items, a status line that waits for typing to pause, and Enter to open. It never routes: `onAction` runs
 * once the palette has closed and focus has gone back, so the app navigates there and nothing undoes it.
 * There is no trigger: the app's own button opens it through `isOpen`. Built on React Aria's Modal, Dialog
 * and Autocomplete, over the Menu's rows.
 */
export function CommandPalette({
  label,
  items,
  onAction,
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  inputValue,
  defaultInputValue,
  onInputChange,
  filter,
  isLoading = false,
  shortcut = 'Mod+K',
  storageKey,
  recentLimit = 5,
  recentIds,
  onRecentChange,
  labels,
  className,
  ref,
}: CommandPaletteProps): ReactElement {
  // The palette's own place in the overlay stack, so its shortcut can tell another modal is open.
  const id = useId();

  // The item chosen, until the close it made has run onAction.
  const chosen = useRef<CommandPaletteItem | null>(null);

  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = isOpenProp ?? ownOpen;
  const isControlled = isOpenProp !== undefined;
  const isOpenRef = useRef(isOpen);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    isOpenRef.current = isOpen;
    onOpenChangeRef.current = onOpenChange;
  });
  const setOpen = useCallback(
    (next: boolean): void => {
      if (!isControlled) setOwnOpen(next);
      onOpenChangeRef.current?.(next);
    },
    [isControlled],
  );
  // Every open and every close the palette did not make for a choice (Escape, the scrim, the shortcut) drops a
  // pending choice. A choice whose close never came, because a caller kept the palette open or it reopened
  // during its exit, then never runs onAction on a later, unrelated close.
  const setOpenWithoutChoice = useCallback(
    (next: boolean): void => {
      chosen.current = null;
      setOpen(next);
    },
    [setOpen],
  );
  useEffect(() => {
    if (isOpen) chosen.current = null;
  }, [isOpen]);

  const words: CommandPaletteLabels = {
    placeholder: labels?.placeholder ?? label,
    empty: labels?.empty ?? DEFAULT_LABELS.empty,
    loading: labels?.loading ?? DEFAULT_LABELS.loading,
    recent: labels?.recent ?? DEFAULT_LABELS.recent,
    status: labels?.status ?? DEFAULT_LABELS.status,
    escape: labels?.escape ?? DEFAULT_LABELS.escape,
    move: labels?.move ?? DEFAULT_LABELS.move,
    open: labels?.open ?? DEFAULT_LABELS.open,
  };

  // Recents: the caller's when controlled, and then nothing is stored; otherwise this browser's, by key.
  const [storedIds, recordStored] = useRecents(recentIds === undefined ? storageKey : undefined, recentLimit);
  const remembered: readonly Key[] = recentIds ?? storedIds;
  const byId = useMemo(() => {
    const map = new Map<string, CommandPaletteItem>();
    for (const item of items) if (!map.has(String(item.id))) map.set(String(item.id), item);
    return map;
  }, [items]);
  // Only ids that are still items, newest first: one the index no longer has is dropped, not shown stale.
  const recent = useMemo(
    () =>
      remembered
        .map((each) => byId.get(String(each)))
        .filter((item) => item !== undefined)
        .slice(0, Math.max(0, recentLimit)),
    [remembered, byId, recentLimit],
  );
  const record = (chosenId: string): void => {
    if (recentIds === undefined) {
      // The list as stored: every id a string, as storage keeps it.
      recordStored(chosenId);
      onRecentChange?.(push(storedIds, chosenId, recentLimit));
      return;
    }
    const chosenKey = byId.get(chosenId)?.id ?? chosenId;
    onRecentChange?.(
      [chosenKey, ...recentIds.filter((each) => String(each) !== chosenId)].slice(
        0,
        Math.max(0, recentLimit),
      ),
    );
  };

  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const choose = (item: CommandPaletteItem): void => {
    record(String(item.id));
    chosen.current = item;
    setOpen(false);
  };

  // Given to ModalFrame as onUnmount. The panel has left the page and focus is going back to what opened
  // it: ModalFrame gives it back at once when it can, and React Aria otherwise does in the next frame. The
  // app moves it after that, so the last word is the caller's.
  const afterClose = (): void => {
    const item = chosen.current;
    if (!item) return;
    chosen.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onActionRef.current(item);
      });
    });
  };

  // The shortcut: installed while mounted, parsed once, ignored under another modal.
  const parsed = useMemo(() => (shortcut === false ? null : parseShortcut(shortcut)), [shortcut]);
  useEffect(() => {
    if (!parsed) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!matchesShortcut(event, parsed) || isAnotherModalOpen(id)) return;
      event.preventDefault();
      setOpenWithoutChoice(!isOpenRef.current);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [parsed, id, setOpenWithoutChoice]);

  return (
    <ModalFrame
      id={id}
      overlayClass="command-palette-overlay"
      panelClass="command-palette"
      className={className}
      isDismissable
      isOpen={isOpen}
      onOpenChange={setOpenWithoutChoice}
      onUnmount={afterClose}
    >
      <RACDialog ref={ref} aria-label={label} className="command-palette-content">
        <PaletteContent
          label={label}
          labels={words}
          items={items}
          recent={recent}
          filter={filter}
          isLoading={isLoading}
          inputValue={inputValue}
          defaultInputValue={defaultInputValue}
          onInputChange={onInputChange}
          onChoose={choose}
        />
      </RACDialog>
    </ModalFrame>
  );
}
