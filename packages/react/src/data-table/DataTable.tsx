'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from 'react';
import { useFilter, useLocale, type Key, type Selection, type TableState } from 'react-aria-components';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';
import { BulkBar, MOST_PROMOTED } from './BulkBar';
import { isBulkActionData } from './bulk-actions';
import { DataTableStatus, useQuiet } from './DataTableStatus';
import { groupsOf } from './groups';
import { EDITABLE, editorRow, escapeEditor, handleTableKey, type TableKeyActions } from './keys';
import { ListFace, type ListSelection, type ListSelectionManager } from './ListFace';
import { selectsOnPress } from './press';
import { portalOf, watchPortal } from '../overlay/watch-portal';
import { uncover } from './scroll';
import { rowHeaderOf, textOf } from './rows';
import { keysOf, presentKeys, staleKeys, toggled } from './selection';
import { TableFace, type FaceRow, type FaceSelection, type FaceSelectionManager } from './TableFace';

export interface DataTableColumn<T> {
  /** Unique; the sort descriptor's `column`. `__selection` is reserved. */
  id: string;
  /** The header's text, and its name. */
  header: string;
  /** The cell for a row: a string or any node. */
  cell: (item: T) => ReactNode;
  /** The row's name when the row header's cell is not a string. */
  textValue?: (item: T) => string;
  /** Exactly one column is the row header. @default the first column */
  isRowHeader?: boolean;
  /** 'end' sets figures: tabular, unbroken, at the line's end in either direction. @default 'start' */
  align?: 'start' | 'end';
  /** The header is a button that sorts by this column: ascending, then descending. */
  allowsSorting?: boolean;
  /** A CSS width for the column, written on its header cell: '8rem', '20%'. @default shares what is left */
  width?: string;
  /**
   * The column leaves the table face when DataTable's own box is narrower than 48rem: a container width, not a
   * breakpoint. Under 40rem, or the table's `listBelow`, the list face is drawn instead, where `listSlot` places
   * every column. The row header never leaves.
   */
  hideBelow?: 'md';
  /** The totals row's cell for this column. */
  total?: ReactNode;
  /**
   * How a cell's text that is too long for its column reads: on one line ending in an ellipsis, or wrapped to two
   * lines and clamped there, for a memo a reader wants to read without opening the row. Figures never wrap.
   * @default 'truncate'
   */
  overflow?: 'truncate' | 'wrap';
  /**
   * The direction of the first press on this column's header, when another column is sorted: descending for a
   * column read newest or largest first. Each later press flips it, two states only.
   * @default 'ascending'
   */
  firstSortDirection?: 'ascending' | 'descending';
  /**
   * The header draws nothing and keeps `header` as its name for assistive technology, as an actions column of row
   * menus needs.
   */
  isHeaderHidden?: boolean;
  /**
   * Where the cell goes in an item of the list face, the face drawn under 40rem of the table's own box (or its
   * `listBelow`): on its first line, on its second line in slate, at its end, or nowhere.
   * @default 'title' for the row header, 'hidden' for every other column
   */
  listSlot?: 'title' | 'meta' | 'end' | 'hidden';
}

export interface DataTableLabels {
  /** The header checkbox's name. @default 'Select all' */
  selectAll: string;
  /**
   * The first word of a row checkbox's name; React Aria adds the row's name after it, as "Select Corner Mart".
   * @default 'Select'
   */
  select: string;
  /** The bar's X that clears the selection: its name and its tip. @default 'Clear selection' */
  clearSelection: string;
  /** The bar's count, given the count as `formatCount` writes it. @default (count) => `${count} selected` */
  selected: (count: string) => string;
  /** The status while loading. @default 'Loading' */
  loading: string;
  /** The totals row's header cell. @default 'Total' */
  total: string;
  /** The bulk-action bar's name. @default 'Bulk actions' */
  toolbar: string;
  /** The button above the list face that shows its checkboxes. @default 'Select' */
  selectItems: string;
  /** The same button while the checkboxes show, which hides them and keeps the selection. @default 'Done' */
  doneSelecting: string;
  /** The bar's More button, which opens the actions it does not show, and its menu's name. @default 'More actions' */
  moreActions: string;
}

/** One action of the bulk-action bar's data form: a promoted button, or an item of its More menu. */
export interface DataTableBulkAction {
  /** Unique among the actions. */
  id: string;
  /** The action's name, on its button and in the More menu. */
  label: string;
  /** A 16px Lucide icon, drawn before the label on a button and in the menu, hidden from assistive technology. */
  icon?: ReactNode;
  /** Runs the action. Receives the selected keys present in `items`. */
  onAction: (keys: Key[]) => void;
  /**
   * A button in the bar while it has room; the rest are in More. At most three are drawn as buttons; a fourth
   * warns and goes to More. Under 40rem of the bar every action is in More.
   * @default false
   */
  isPromoted?: boolean;
  isDisabled?: boolean;
}

/** Selection: both props or neither. */
export type DataTableSelectable =
  | { selectedKeys?: undefined; onSelectionChange?: undefined }
  | {
      /**
       * Turns selection on: a first column of checkboxes and the bulk-action bar. Always controlled, from the
       * page's state and never the URL. Clear it when the rows change.
       */
      selectedKeys: readonly Key[];
      /** Called with the selected keys: always the given rows' keys, never React Aria's 'all'. */
      onSelectionChange: (keys: Key[]) => void;
    };

export interface DataTableShared<T> {
  /** The rows, in the order to draw them. */
  items: readonly T[];
  /** The columns, in the order to draw them. */
  columns: readonly DataTableColumn<T>[];
  /**
   * Each row's key, stable across renders and unique: a later row with a key already used is not drawn.
   * `__total` is reserved.
   */
  getKey: (item: T) => Key;
  /** The row's detail, a URL the router opens. Rows without one do not open. */
  getRowHref?: (item: T) => string;
  /**
   * The row whose detail is open: its link is aria-current and the row draws the current bar. It is compared
   * with each row's key by strict equality, so a string from the URL never matches a numeric key.
   */
  currentKey?: Key | null;
  /** Controlled from the URL: the column's id and its direction. */
  sortDescriptor?: { column: string; direction: 'ascending' | 'descending' };
  /** Called with the next sort when a sortable header is pressed: ascending, or descending when it was ascending. */
  onSortChange?: (sort: { column: string; direction: 'ascending' | 'descending' }) => void;
  /**
   * Rows that cannot be selected, and with `disabledBehavior` 'all' cannot be focused or opened either and draw
   * in taupe.
   */
  disabledKeys?: readonly Key[];
  /**
   * What `disabledKeys` turns off: everything, or only selection, so a row that cannot be selected still opens.
   * @default 'all'
   */
  disabledBehavior?: 'selection' | 'all';
  /** Shows skeleton rows while there are no items, and marks the table busy. */
  isLoading?: boolean;
  /** @default 8 */
  loadingRowCount?: number;
  /** The empty body: an EmptyState, or any node. */
  emptyState?: ReactNode;
  /**
   * The list face's day groups: adjacent rows with the same `id` form one section headed by `label`, your string.
   * Only adjacent rows group, so pass it only while the rows are sorted by date. Without it the list is one
   * ungrouped list.
   */
  getGroup?: (item: T) => { id: Key; label: string };
  /**
   * The rows did not load. With no rows it is the body, in place of the empty state, such as an EmptyState with a
   * Retry action; with rows shown, a failed next page, it is a line under the table that a polite status says.
   * It wins over `isLoading` and `emptyState`.
   */
  error?: ReactNode;
  /**
   * The bulk-action bar's actions, shown while any row is selected: data, which the bar lays out as up to three
   * promoted buttons and a More menu that never wraps, or the app's own buttons as a node, drawn as they are.
   */
  bulkActions?: ReactNode | readonly DataTableBulkAction[];
  /** After the bar's count: the app's "Select all 1,240 matching" button, or what it says once pressed. */
  selectAllMatching?: ReactNode;
  /**
   * The width of the table's own box under which the list face is drawn in place of the table: a container
   * width, not a breakpoint. `'32rem'` keeps the table beside an open SidePanel, when the columns that stay under
   * 48rem (the row header and those without `hideBelow`) fit in 32rem; every phone held upright still draws the
   * list.
   * @default '40rem'
   */
  listBelow?: '40rem' | '32rem';
  /** How the bar writes its count, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  /** The words the table writes itself, each with an English default. */
  labels?: Partial<DataTableLabels>;
  /** Merged after the library's class on the root. */
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/** DataTable's props without its name: the shared ones, and selection's two together or neither. */
export type DataTableBaseProps<T> = DataTableShared<T> & DataTableSelectable;

/** DataTable's props: a name is required, from `aria-label` or `aria-labelledby`. */
export type DataTableProps<T> = DataTableBaseProps<T> & AriaName;

const DEFAULT_LABELS: DataTableLabels = {
  selectAll: 'Select all',
  select: 'Select',
  clearSelection: 'Clear selection',
  selected: (count) => `${count} selected`,
  loading: 'Loading',
  total: 'Total',
  toolbar: 'Bulk actions',
  selectItems: 'Select',
  doneSelecting: 'Done',
  moreActions: 'More actions',
};

/** Whether React Aria's selection holds exactly `keys`, so it can go back to React Aria with its anchor. */
const holds = (selection: Selection | null, keys: readonly Key[]): selection is Set<Key> =>
  selection !== null &&
  selection !== 'all' &&
  selection.size === new Set(keys).size &&
  keys.every((key) => selection.has(key));

/** The grid of the face that is shown, the table's or the list's, read at event or effect time. */
function shownGrid(root: HTMLElement | null): HTMLElement | null {
  if (root === null) return null;
  for (const face of root.querySelectorAll<HTMLElement>(
    ':scope > .data-table-grid, :scope > .data-table-list',
  )) {
    if (getComputedStyle(face).display === 'none') continue;
    const grid = face.querySelector<HTMLElement>('[role="grid"]');
    if (grid !== null) return grid;
  }
  return null;
}

/** The row whose checkbox `target` is in, inside `root`; null for the select-all box and anything else. */
function rowOfBox(target: Element, root: Element): Element | null {
  const row = target.closest('[data-selection] .checkbox-field')?.closest('[role="row"]');
  return row !== null && row !== undefined && root.contains(row) && row.closest('thead') === null
    ? row
    : null;
}

/**
 * The rows of the face, one per key: a row whose key an earlier row has is left out, since React Aria throws for
 * a repeated key outside production and can loop forever in it. `repeated` is the first such key, or null.
 */
function faceRows<T>(
  items: readonly T[],
  getKey: (item: T) => Key,
  rowHeader: DataTableColumn<T> | undefined,
  getRowHref: ((item: T) => string) | undefined,
): { rows: FaceRow<T>[]; repeated: Key | null } {
  const seen = new Set<Key>();
  const rows: FaceRow<T>[] = [];
  let repeated: Key | null = null;
  for (const value of items) {
    const key = getKey(value);
    if (seen.has(key)) {
      repeated ??= key;
      continue;
    }
    seen.add(key);
    rows.push({ key, value, text: textOf(value, rowHeader), href: getRowHref?.(value) });
  }
  return { rows, repeated };
}

/**
 * Rows of data: a grid with sortable columns, a row header that links to the row's detail, a sticky header,
 * columns of figures at the line's end, columns that leave where the table's box is narrow, a totals row, an
 * empty and a loading body, and with `selectedKeys` a checkbox column and a bulk-action bar. A press on a row
 * opens it; the checkbox, Space and X select. Every cell and string is the app's; the sort, the open row and the
 * selection are controlled. Built on React Aria's Table. Render it from a client component: its props are
 * functions.
 */
export function DataTable<T>(props: DataTableProps<T>): ReactElement {
  const {
    items,
    columns,
    getKey,
    getRowHref,
    currentKey,
    sortDescriptor,
    onSortChange,
    disabledKeys,
    disabledBehavior = 'all',
    selectedKeys,
    onSelectionChange,
    bulkActions,
    selectAllMatching,
    listBelow = '40rem',
    formatCount = String,
    isLoading = false,
    loadingRowCount = 8,
    emptyState,
    getGroup,
    error,
    labels,
    className,
    ref,
  } = props;
  const words = { ...DEFAULT_LABELS, ...labels };
  const rowHeader = rowHeaderOf(columns);
  const { rows, repeated } = faceRows(items, getKey, rowHeader, getRowHref);
  // An error wins over loading and the empty state: with no rows it is the body, with rows the line under them.
  const failed = present(error);
  const loading = isLoading && !failed;
  // Rows already shown that load again draw a quiet cue once the load has lasted QUIET_MS.
  const reloading = useQuiet(loading && rows.length > 0);
  const { direction } = useLocale();
  const disabled = useMemo(() => new Set<Key>(disabledKeys ?? []), [disabledKeys]);
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useMemo(() => mergeRefs(ref, rootRef), [ref]);

  // Selection (section 7). The keys in items, by the string React Aria writes as each row's data-key.
  const selectable = selectedKeys !== undefined;
  const byDataKey = new Map<string, Key>(rows.map((row) => [String(row.key), row.key]));
  const shown = new Set<Key>(rows.map((row) => row.key));
  const counted = selectable ? presentKeys(selectedKeys, shown) : [];
  const stale = selectable ? staleKeys(selectedKeys, shown) : [];
  // React Aria's last selection, handed back while it holds the app's keys, so Shift keeps its anchor.
  const [last, setLast] = useState<Selection | null>(null);
  const manager = useRef<FaceSelectionManager | null>(null);
  const onManager = useCallback((next: FaceSelectionManager | null) => {
    manager.current = next;
  }, []);
  // The list face's own manager, so X and Shift there move its anchor, not the table's.
  const listManager = useRef<ListSelectionManager | null>(null);
  const onListManager = useCallback((next: ListSelectionManager | null) => {
    listManager.current = next;
  }, []);
  /** The manager of the face `element` is in. */
  const managerOf = (element: Element): FaceSelectionManager | null =>
    element.closest('.data-table-list') === null ? manager.current : listManager.current;
  // React Aria's table state, whose keyboard navigation is off while an editable element in a cell has focus.
  const tableState = useRef<TableState<unknown> | null>(null);
  const onTableState = useCallback((next: TableState<unknown> | null) => {
    tableState.current = next;
  }, []);
  // Whether an editable element in a list item has focus: the list's items then leave their children's arrows
  // alone, as the table's cells do while its navigation is off (spec correction 67).
  const [listEditing, setListEditing] = useState(false);
  /**
   * Lets an editable element in a cell or a list item keep its arrows while it has focus, and gives them back to
   * the grid or the list once focus is anywhere else. `target` is the focused element, or null once focus is out.
   */
  const editableKeys = useCallback((target: Element | null): void => {
    const row = editorRow(target);
    const inList = row?.closest('.data-table-list') != null;
    setListEditing(inList);
    const state = tableState.current;
    if (state === null) return;
    const editing = row !== null && !inList;
    if (state.isKeyboardNavigationDisabled !== editing) state.setKeyboardNavigationDisabled(editing);
  }, []);
  // The switch turns back on from focus events: an engine that fires no blur when a focused editor is removed or
  // hidden would leave the arrows off, so focus is checked again whenever the rows change and whenever anything
  // on the page takes focus (spec correction 69).
  const recheckEditing = useCallback((): void => {
    const root = rootRef.current;
    if (root === null) return;
    const active = root.ownerDocument.activeElement;
    editableKeys(active !== null && root.contains(active) ? active : null);
  }, [editableKeys]);
  useLayoutEffect(() => {
    recheckEditing();
    // React Aria draws the rows of a changed collection in a render of its own, after this one: once more then.
    const frame = requestAnimationFrame(recheckEditing);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [items, recheckEditing]);
  useEffect(() => {
    const document = rootRef.current?.ownerDocument;
    if (document === undefined) return;
    document.addEventListener('focusin', recheckEditing);
    return () => {
      document.removeEventListener('focusin', recheckEditing);
    };
  }, [recheckEditing]);
  // Whether the last focus inside the root's DOM was in the bar, which the root's focus capture keeps.
  const focusInBar = useRef(false);

  const focusTable = (): void => {
    shownGrid(rootRef.current)?.focus();
  };
  const clear = (): void => {
    // Focus first, while the bar is still here, so it never falls to the page.
    focusTable();
    onSelectionChange?.([]);
  };
  const hasBar = counted.length > 0;
  // The bar leaves with focus in it when the selection empties some other way, such as a bulk action that
  // clears it: focus goes to the table rather than to the page (spec 7.1). Only when focus has fallen to the
  // page: focus the reader has since moved elsewhere stays where it is. When an action opened a dialog or a menu
  // that holds focus as the bar leaves, such as a confirm whose Delete cleared the selection, the table waits
  // for that portal to close and takes focus then, if it fell to the page.
  useLayoutEffect(() => {
    if (hasBar || !focusInBar.current) return;
    focusInBar.current = false;
    const root = rootRef.current;
    if (root === null) return;
    const document = root.ownerDocument;
    const fallen = (): boolean => document.activeElement === null || document.activeElement === document.body;
    if (fallen()) {
      shownGrid(root)?.focus();
      // A menu that leaves with the bar, its More menu, has made the page inert while open, and React Aria takes
      // that away only in an effect after this one, so the table cannot take focus yet: it does a frame later,
      // if focus is still on the page by then (spec correction 102).
      if (!fallen()) return;
      let frames = 0;
      let frame = requestAnimationFrame(function retry(): void {
        if (!fallen() || !root.isConnected) return;
        shownGrid(root)?.focus();
        frames += 1;
        if (fallen() && frames < 10) frame = requestAnimationFrame(retry);
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    }
    const active = document.activeElement;
    if (active === null || root.contains(active)) return;
    return watchPortal(root, active, () => {
      shownGrid(root)?.focus();
    });
  }, [hasBar]);

  // React Aria sees only the selected rows it draws, so a selection of stale keys shows no indeterminate header
  // and lets Escape through; the app keeps the stale keys until it drops them (risk R6). Both faces take it.
  const shared = {
    selectedKeys: holds(last, counted) ? last : counted,
    onChange: (selection: Selection) => {
      setLast(selection === 'all' ? null : selection);
      onSelectionChange?.([...keysOf(selection, rows, (row) => row.key, disabled), ...stale]);
    },
    selectAllLabel: words.selectAll,
    selectLabel: words.select,
  };
  const faceSelection: FaceSelection | undefined = selectable ? { ...shared, onManager } : undefined;
  // The list's select-all is the library's own box above it, since GridList has none (spec 10.2 item 9): every
  // enabled row, or none, as the table's select-all gives.
  const enabled = rows.filter((row) => !disabled.has(row.key)).map((row) => row.key);
  const chosen = new Set(counted);
  // Select mode is the list's (amendment 3), off at first so the server draws no box; DataTable holds it, since
  // its press guard reads it, and draws it on the list only while the list has rows and its head.
  const [selecting, setSelecting] = useState(false);
  const listSelecting = selectable && selecting && rows.length > 0;
  const listSelection: ListSelection | undefined = selectable
    ? {
        ...shared,
        all:
          enabled.length > 0 && enabled.every((key) => chosen.has(key))
            ? 'all'
            : counted.length > 0
              ? 'some'
              : 'none',
        onSelectAll: (select) => {
          setLast(null);
          onSelectionChange([...(select ? enabled : []), ...stale]);
        },
        selectItemsLabel: words.selectItems,
        doneLabel: words.doneSelecting,
        selecting,
        onSelectingChange: setSelecting,
        onManager: onListManager,
      }
    : undefined;

  // What React Aria's typeahead compares a letter with: each row's name, a row header cell's own text, the
  // totals row's and every header's name, as `TableKeyboardDelegate.getKeyForSearch` does, with its collator.
  const { startsWith } = useFilter({ sensitivity: 'base' });
  const typeahead = (character: string): boolean => {
    const names: string[] = [words.total, words.selectAll, ...columns.map((column) => column.header)];
    for (const row of rows) {
      names.push(row.text);
      const cell = rowHeader?.cell(row.value);
      if (typeof cell === 'string') names.push(cell);
    }
    return names.some((name) => name !== '' && startsWith(name, character));
  };

  // A press on a cell, outside its controls and the row's link, never selects (ruling 2): React Aria would select
  // a row without a link on it. A virtual click, a screen reader's, is a press too. Shift with a press on a row's
  // box is the range's (below), so React Aria's own press on the box never starts. In the list's Select mode a
  // press on an item, off its controls, toggles it, as a phone's selection mode does (open question 8, spec
  // correction 69): React Aria's press still never starts, and the click toggles through the list's manager, so
  // the item becomes the anchor as with Space. The item's link takes no pointer there, so the title is the item's.
  const guardPress = (event: SyntheticEvent<HTMLDivElement>): void => {
    if (!selectable || !(event.target instanceof Element)) return;
    const native = event.nativeEvent as globalThis.MouseEvent;
    const pressed = selectsOnPress(event.target, event.currentTarget);
    const item = listSelecting && pressed ? event.target.closest('.data-table-list .data-table-item') : null;
    if (event.type === 'click' && native.detail !== 0 && item === null) return;
    if (pressed || (native.shiftKey && rowOfBox(event.target, event.currentTarget) !== null))
      event.stopPropagation();
    if (item === null || event.type !== 'click') return;
    const actions = actionsFor(item);
    const key = actions.keyOf(item);
    if (key !== null) actions.toggle(key);
  };

  /** The handler's actions for a key from `target`, in the table face or the list face. */
  const actionsFor = (target: Element): TableKeyActions => {
    const inList = target.closest('.data-table-list') !== null;
    return {
      direction,
      keyOf: (row) => {
        const key = byDataKey.get(row.getAttribute('data-key') ?? '');
        return selectable && key !== undefined && !disabled.has(key) ? key : null;
      },
      toggle: (key) => {
        // As Space does, so the toggled row becomes the anchor Shift extends from, in the face it is in.
        const own = managerOf(target);
        if (own !== null) own.toggleSelection(key);
        else if (selectedKeys !== undefined) onSelectionChange(toggled(selectedKeys, key));
      },
      extend: (row) => {
        const key = row.getAttribute('data-key');
        const reached =
          key === null ? undefined : (byDataKey.get(key) ?? (key === '__total' ? key : undefined));
        if (reached !== undefined) managerOf(row)?.extendSelection(reached);
      },
      // The list takes disallowTypeAhead, so no letter would move focus there and every one reaches the page.
      typeahead: inList ? () => false : typeahead,
    };
  };

  const marked = columns.filter((column) => column.isRowHeader === true);
  useWarnOnce(
    marked.length > 1
      ? `DataTable: ${String(marked.length)} columns are marked isRowHeader; only one can be. "${marked[0]?.id ?? ''}" is the row header.`
      : null,
  );
  useWarnOnce(
    rowHeader?.hideBelow === undefined
      ? null
      : `DataTable: the row header "${rowHeader.id}" never leaves the table, so its hideBelow is ignored.`,
  );
  useWarnOnce(
    sortDescriptor !== undefined && !columns.some((column) => column.id === sortDescriptor.column)
      ? `DataTable: sortDescriptor names "${sortDescriptor.column}", which is no column's id.`
      : null,
  );
  const sortable =
    onSortChange === undefined ? columns.find((column) => column.allowsSorting === true) : undefined;
  useWarnOnce(
    sortable === undefined
      ? null
      : `DataTable: the column "${sortable.id}" allowsSorting, and there is no onSortChange, so a press on its header changes nothing. Pass onSortChange and sortDescriptor from your URL.`,
  );
  useWarnOnce(
    repeated === null
      ? null
      : `DataTable: getKey gives "${String(repeated)}" to more than one row; every row needs a key of its own. Only the first row with it is drawn.`,
  );
  useWarnOnce(
    stale.length === 0
      ? null
      : `DataTable: selectedKeys holds keys that are not in items: ${stale.map(String).join(', ')}. Clear the selection when the rows change.`,
  );
  const promoted = isBulkActionData(bulkActions)
    ? bulkActions.filter((action) => action.isPromoted === true)
    : [];
  useWarnOnce(
    promoted.length > MOST_PROMOTED
      ? `DataTable: ${String(promoted.length)} bulk actions are promoted; at most three are drawn as buttons. "${promoted[MOST_PROMOTED]?.id ?? ''}" and those after it are in More.`
      : null,
  );
  useWarnOnce(
    items.length === 0 && !isLoading && !failed && !present(emptyState)
      ? 'DataTable: the table has no rows and no emptyState. Pass an EmptyState that says what is missing.'
      : null,
  );

  return (
    // The capture handler takes keys before React Aria's grid does (spec 7.2): a capture listener, which
    // jsx-a11y does not read, so the root needs no role of its own. Its one bubble handler is Escape out of an
    // editor in a cell, after the editor has had it.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- the grid and the list inside are the roles; the root only hears an editor's unused Escape on its way up (spec correction 64)
    <div
      ref={rootRefs}
      className={cx('data-table', className)}
      // The 40rem switch is the stylesheet's default, so only the other width is written (ruling 24).
      data-list-below={listBelow === '32rem' ? listBelow : undefined}
      onKeyDownCapture={(event: KeyboardEvent<HTMLDivElement>) => {
        const target = event.target as Element;
        if (
          event.key === 'Escape' &&
          event.currentTarget.contains(target) &&
          target.closest('.data-table-bar') !== null &&
          target.closest(EDITABLE) === null
        ) {
          // Escape in the bar clears and puts focus on the table (spec correction 18). A Menu opened from an
          // action is a portal, outside the root's DOM, and its Escape is its own; a text field's is the field's.
          event.preventDefault();
          event.stopPropagation();
          clear();
          return;
        }
        handleTableKey(event, actionsFor(target));
      }}
      onKeyDown={escapeEditor}
      onFocusCapture={(event: FocusEvent<HTMLDivElement>) => {
        const target = event.target as Element;
        const root = event.currentTarget;
        // Focus in a portal opened from the bar (a Menu) keeps what the bar had.
        if (!root.contains(target)) return;
        focusInBar.current = target.closest('.data-table-bar') !== null;
        editableKeys(target);
        // A focused row or cell of the body, or a list item, is scrolled clear of the sticky header or day
        // heading and the bar, after React Aria's own scroll, which runs in the next frame (WCAG 2.4.11).
        if (target instanceof HTMLElement && target.closest('tbody, tfoot, .data-table-item') !== null) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              uncover(target, root);
            });
          });
        }
      }}
      onBlurCapture={(event: FocusEvent<HTMLDivElement>) => {
        const next = event.relatedTarget;
        // Focus that leaves the table for the page forgets the bar; focus that goes into a portal, a dialog or a
        // menu one of its actions opened, keeps it.
        if (next instanceof Element && !event.currentTarget.contains(next)) {
          if (portalOf(next) === portalOf(event.currentTarget)) focusInBar.current = false;
        }
        // Focus that leaves the table gives the arrows back to the grid; a move inside it is the focus capture's.
        if (!(next instanceof Element) || !event.currentTarget.contains(next)) editableKeys(null);
      }}
      onPointerDownCapture={guardPress}
      onMouseDownCapture={guardPress}
      onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
        guardPress(event);
        if (event.isPropagationStopped()) return;
        // Shift with a press on a row's box selects the range from the anchor, as Shift with an arrow does: the
        // box's own toggle is cancelled and React Aria's manager extends the selection to the row.
        if (!event.shiftKey || !(event.target instanceof Element)) return;
        const row = rowOfBox(event.target, event.currentTarget);
        if (row === null) return;
        const key = actionsFor(row).keyOf(row);
        const own = managerOf(row);
        if (key === null || own === null) return;
        event.preventDefault();
        event.stopPropagation();
        own.extendSelection(key);
      }}
    >
      {/* Busy while loading. The status sits outside the busy part and stays mounted, so it is heard. */}
      <div
        className="data-table-grid"
        aria-busy={loading ? 'true' : undefined}
        data-reloading={reloading ? '' : undefined}
      >
        <TableFace
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          rows={rows}
          columns={columns}
          rowHeader={rowHeader}
          currentKey={currentKey}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
          disabledKeys={disabled}
          disabledBehavior={disabledBehavior}
          selection={faceSelection}
          isLoading={loading && rows.length === 0}
          loadingRowCount={loadingRowCount}
          emptyState={failed ? error : emptyState}
          totalLabel={words.total}
          loadingLabel={words.loading}
          onState={onTableState}
        />
      </div>
      {/* The list face, shown instead of the grid under 40rem of the root's box, or 32rem with listBelow (rulings 8
          and 24); busy as the grid is. */}
      <div
        className="data-table-list"
        aria-busy={loading ? 'true' : undefined}
        data-reloading={reloading ? '' : undefined}
        data-selecting={listSelecting ? '' : undefined}
      >
        <ListFace
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          rows={rows}
          groups={groupsOf(rows, getGroup === undefined ? undefined : (row) => getGroup(row.value))}
          columns={columns}
          rowHeader={rowHeader}
          currentKey={currentKey}
          disabledKeys={disabled}
          disabledBehavior={disabledBehavior}
          selection={listSelection}
          isEditing={listEditing}
          isLoading={loading && rows.length === 0}
          loadingRowCount={loadingRowCount}
          emptyState={failed ? error : emptyState}
          totalLabel={words.total}
          loadingLabel={words.loading}
        />
      </div>
      {/* A failed next page under the rows: a polite region, mounted empty, so the error is heard as it comes. */}
      <div className="data-table-error" role="status">
        {failed && rows.length > 0 ? error : null}
      </div>
      {hasBar ? (
        <BulkBar
          label={words.toolbar}
          count={words.selected(formatCount(counted.length))}
          actions={bulkActions}
          selectAllMatching={selectAllMatching}
          keys={counted}
          clearLabel={words.clearSelection}
          moreLabel={words.moreActions}
          onClear={clear}
        />
      ) : null}
      <DataTableStatus message={loading ? words.loading : ''} />
      {/* The count, said once it has held for QUIET_MS, so a run of X presses says the total once (spec 7.1);
          mounted while selection is on, so it is there before the first count. */}
      {selectable ? (
        <DataTableStatus
          className="data-table-count"
          message={hasBar ? words.selected(formatCount(counted.length)) : ''}
        />
      ) : null}
    </div>
  );
}
