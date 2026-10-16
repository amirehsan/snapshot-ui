import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { matchesShortcut, parseShortcut } from '../command-palette/shortcut';
import { isUnderModal } from '../overlay/useOverlayStack';
import { pageStickyTop, scrollPortOf, stickyHead } from './scroll';
import type { Key } from './selection';

/*
 * DataTable's capture-phase key handler, on its root, so it runs before React Aria's handlers on the grid, its
 * rows and its cells (spec 7.2, ruling 3). It gives Enter on a row its link, J and K the arrows' meaning and X the
 * selection toggle, stops every other single printable key before React Aria's typeahead, and keeps the arrows
 * off cells that have left. React Aria's keyboard delegate walks the collection, not the DOM, so a key would land
 * its focused key, and the grid's one tab stop, on a cell or a column header the container query hid (spec
 * correction 8). The handler works out the cell React Aria would reach, as `TableKeyboardDelegate` does, and only
 * when that cell has left does it take the key and focus the nearest shown one, whose focus event sets React
 * Aria's focused key. Every DOM read is here, at key time, never at render.
 */

const CELL = '[role="gridcell"], [role="rowheader"], [role="columnheader"]';
const ROW_CELLS = ':scope > [role="gridcell"], :scope > [role="rowheader"], :scope > [role="columnheader"]';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** What the handler needs from DataTable. */
export interface TableKeyActions {
  /** The locale's direction, which React Aria's delegate reads too. */
  direction: 'ltr' | 'rtl';
  /**
   * The app's key for a body row that can be selected, or null: the totals row, the empty row, a disabled row, a
   * header row, or any row while selection is off.
   */
  keyOf: (row: Element) => Key | null;
  /** Toggles the row's selection, as Space does. */
  toggle: (key: Key) => void;
  /** Extends the selection to `row`, as React Aria does when Shift is held with a key that moves. */
  extend: (row: Element) => void;
  /**
   * Whether React Aria's typeahead would move focus for this character: some row's name, or a header's, starts
   * with it as React Aria compares them. Only such a key is stopped, so every other one reaches the page.
   */
  typeahead: (character: string) => boolean;
}

const J = parseShortcut('j');
const K = parseShortcut('k');
const X = parseShortcut('x');

/** Where a key types text: a text input, a text area, a select or editable content. A checkbox types nothing. */
export const EDITABLE =
  'input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"], [type="image"], [type="range"], [type="color"], [type="file"]), textarea, select, [contenteditable]:not([contenteditable="false"])';

/** A row's own cells, where Enter opens the row; a column header's Enter sorts, and a control's is its own. */
const BODY_CELL = '[role="gridcell"], [role="rowheader"]';

/** The checkbox column's cell or header: Enter on its box opens the row, and never selects (ruling 2). */
const SELECTION_CELL = '[data-selection]';

/** A cell that has left stays in its row at zero width and hidden, so it is shown only while visible. */
const isShown = (cell: Element): boolean => {
  const style = getComputedStyle(cell);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const isRow = (element: Element): boolean => element.getAttribute('role') === 'row';
const isHeader = (element: Element): boolean => element.getAttribute('role') === 'columnheader';

const cellsOf = (row: Element): HTMLElement[] => [...row.querySelectorAll<HTMLElement>(ROW_CELLS)];

const rowOf = (from: Element): Element | null => (isRow(from) ? from : from.closest('[role="row"]'));

/**
 * React Aria's platform test (`utils/platform.mjs`): on a Mac its grid moves with Alt where elsewhere it moves
 * with Ctrl, and only off a Mac does Ctrl take Home and End to the grid's corners. Read at key time only.
 */
function isMac(): boolean {
  const { navigator } = globalThis;
  const reported = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    ?.platform;
  return /^Mac/i.test(reported === undefined || reported === '' ? navigator.platform : reported);
}

/** The nearest shown cell from `from` in DOM order (1 next, -1 previous), or the row's first or last shown one. */
export function nextVisibleCell(from: Element, step: 1 | -1 | 'first' | 'last'): HTMLElement | null {
  const row = rowOf(from);
  if (row === null) return null;
  const cells = cellsOf(row);
  const shown = cells.filter(isShown);
  if (step === 'first') return shown[0] ?? null;
  if (step === 'last') return shown.at(-1) ?? null;
  const start = from === row ? (step === 1 ? -1 : cells.length) : cells.indexOf(from as HTMLElement);
  for (let index = start + step; index >= 0 && index < cells.length; index += step) {
    const cell = cells[index];
    if (cell !== undefined && isShown(cell)) return cell;
  }
  return null;
}

/** Whether focus can still move inside `cell` in `step`'s direction, which React Aria does before it leaves it. */
function hasFocusableBeyond(cell: Element, active: Element, step: 1 | -1): boolean {
  const inside = [...cell.querySelectorAll(FOCUSABLE)];
  const index = inside.indexOf(active);
  return index !== -1 && inside[index + step] !== undefined;
}

/** The cell or row a key starts from: the focused cell or header, the cell holding focus, or the focused row. */
function startOf(active: Element, root: Element): Element | null {
  if (!root.contains(active)) return null;
  if (isRow(active)) return active;
  return active.closest(CELL);
}

/** The rows React Aria's keys reach, in order: its rows take a tabindex, the header row and a disabled row none. */
const reachableRows = (grid: Element): Element[] => [...grid.querySelectorAll('[role="row"][tabindex]')];

/** The header row: the row of column headers. */
const headerRowOf = (grid: Element): Element | undefined =>
  [...grid.querySelectorAll('[role="row"]')].find((row) =>
    row.querySelector(':scope > [role="columnheader"]'),
  );

/** The first shown header after `cells[index]` in `step`'s direction, or null at the header row's end. */
function nextShownHeader(cells: readonly HTMLElement[], index: number, step: 1 | -1): HTMLElement | null {
  for (let next = index + step; next >= 0 && next < cells.length; next += step) {
    const cell = cells[next];
    if (cell !== undefined && isShown(cell)) return cell;
  }
  return null;
}

/**
 * Arrow Left or Right: React Aria's next cell or header in `step`'s DOM direction, and where to go instead. In
 * the header row React Aria wraps from one end to the other; the handler stops at the ends instead, returning
 * the header it is on, and steps over a header that has left.
 */
function sideways(from: Element, row: Element, active: Element, step: 1 | -1): HTMLElement | null {
  const cells = cellsOf(row);
  if (from === row) {
    // From a row React Aria enters its first cell in reading order.
    const reached = step === 1 ? cells[0] : cells.at(-1);
    if (reached === undefined || isShown(reached)) return null;
    return nextVisibleCell(row, step);
  }
  if (hasFocusableBeyond(from, active, step)) return null;
  const index = cells.indexOf(from as HTMLElement);
  if (isHeader(from)) {
    const next = nextShownHeader(cells, index, step);
    // At the end of the header row the key stops where it is.
    if (next === null) return from as HTMLElement;
    return next === cells[index + step] ? null : next;
  }
  const reached = cells[index + step];
  // Past the last cell React Aria returns to the row, which is shown.
  if (reached === undefined || isShown(reached)) return null;
  // Past the last shown cell the handler returns to the row, as React Aria does past the last cell.
  return nextVisibleCell(from, step) ?? (row as HTMLElement);
}

/** Home or End: the row's first or last cell, or with `corner` the first row's first or last row's last. */
function toEnd(from: Element, row: Element, home: boolean, corner: boolean): HTMLElement | null {
  // From a row React Aria moves between rows, with Ctrl or without.
  if (from === row) return null;
  let target: Element | undefined = row;
  if (corner) {
    const grid = row.closest('[role="grid"]');
    const rows = grid === null ? [] : reachableRows(grid);
    target = home ? rows[0] : rows.at(-1);
  }
  if (target === undefined) return null;
  const cells = cellsOf(target);
  const reached = home ? cells[0] : cells.at(-1);
  if (reached === undefined || isShown(reached)) return null;
  return nextVisibleCell(reached, home ? 'first' : 'last');
}

/** Arrow Up from the first row: React Aria goes to the first column's header, which may have left. */
function upToHeader(from: Element, row: Element): HTMLElement | null {
  // From a cell React Aria goes to its own column's header, which is shown while the cell is.
  if (from !== row) return null;
  const grid = row.closest('[role="grid"]');
  if (grid === null || reachableRows(grid)[0] !== row) return null;
  const header = headerRowOf(grid);
  const reached = header === undefined ? undefined : cellsOf(header)[0];
  if (reached === undefined || isShown(reached)) return null;
  return nextVisibleCell(reached, 'first');
}

/**
 * The height the body's rows scroll in: the nearest ancestor that scrolls, or the window, less what covers its
 * top (where the window scrolls the page's sticky offset, then the sticky header row or a day heading, and the
 * list's head while it sticks in Select mode) and its bottom (the bulk-action bar where it shows).
 */
function pageHeight(grid: Element): number {
  const port = scrollPortOf(grid);
  let height = port === null ? window.innerHeight : port.clientHeight;
  // The page's own sticky header, which an ungrouped list, with no heading, has as its only cover.
  if (port === null) height -= pageStickyTop(grid);
  // The table's header row, or in the list face a day heading, which sticks as the header row does.
  const header = grid.querySelector('[role="columnheader"], .data-table-section-header');
  if (header !== null) height -= header.getBoundingClientRect().height;
  const head = stickyHead(grid);
  if (head !== null) height -= head.getBoundingClientRect().height;
  const bar = grid.closest('.data-table')?.querySelector('.data-table-bar');
  if (bar !== null && bar !== undefined) {
    height -= bar.getBoundingClientRect().height + (parseFloat(getComputedStyle(bar).bottom) || 0);
  }
  return height;
}

/**
 * Page Down and Page Up (risk R4, spec correction 41). React Aria measures a page against the whole table when
 * the page itself scrolls, so it jumped to the first or the last row; the handler moves by the rows that fit in
 * the view instead, from a row to a row and from a cell to the same column's cell, never past the first or the
 * last row, and with Shift extends the selection to the row it reaches, as React Aria does. A header's keys, and
 * a key with Ctrl, Alt or Meta, are React Aria's.
 */
function pageKey(event: ReactKeyboardEvent<HTMLElement>, { extend }: TableKeyActions): boolean {
  if (event.key !== 'PageDown' && event.key !== 'PageUp') return false;
  if (event.ctrlKey || event.altKey || event.metaKey) return false;
  const active = event.currentTarget.ownerDocument.activeElement;
  if (active === null) return false;
  const from = startOf(active, event.currentTarget);
  if (from === null || isHeader(from)) return false;
  const row = rowOf(from);
  const grid = row?.closest('[role="grid"]');
  if (row === null || grid === null || grid === undefined) return false;
  const rows = reachableRows(grid);
  const index = rows.indexOf(row);
  if (index === -1) return false;
  const fit = Math.max(1, Math.floor(pageHeight(grid) / (row.getBoundingClientRect().height || 1)));
  const next = Math.min(rows.length - 1, Math.max(0, index + (event.key === 'PageDown' ? fit : -fit)));
  const reached = rows[next] ?? row;
  event.preventDefault();
  event.stopPropagation();
  let target: HTMLElement = reached as HTMLElement;
  // A list item's one cell draws nothing of its own (display: contents) and takes no focus, so the item does.
  if (from !== row && !row.classList.contains('data-table-item')) {
    const cell = cellsOf(reached)[cellsOf(row).indexOf(from as HTMLElement)];
    target = (cell === undefined || isShown(cell) ? cell : nextVisibleCell(cell, 'first')) ?? target;
  }
  target.focus();
  if (event.shiftKey) extend(reached);
  return true;
}

/**
 * Moves an arrow, Home or End past a cell or a column header the CSS hid: when the one React Aria would reach
 * has left, the key stops here and focus goes to the nearest shown one in that direction, whose focus event sets
 * React Aria's focused key; true when it took the key. In the header row Arrow Left and Right stop at its ends,
 * where React Aria would wrap to the other end. Every other key passes through. It takes the keys with the
 * modifiers React Aria's grid moves with (`useSelectableCollection.mjs`): none, Shift, and Ctrl off a Mac or Alt
 * on one, with Ctrl taking Home and End to the grid's corners off a Mac. Arrow Right is the next cell in DOM order
 * in a left-to-right locale and the previous in a right-to-left one, as React Aria reads it from the locale.
 * With Shift, React Aria extends the selection to the row of the cell it reaches on an arrow and on Ctrl+Home or
 * Ctrl+End, so where the handler takes such a key it extends the selection to the shown cell's row, the same row
 * React Aria would have reached: a column that has left never stops Shift from extending.
 */
function hiddenCellKey(
  event: ReactKeyboardEvent<HTMLElement>,
  { direction, extend }: TableKeyActions,
): boolean {
  const { key } = event;
  if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End')
    return false;
  if (event.metaKey) return false;
  const mac = isMac();
  if (mac ? event.ctrlKey : event.altKey) return false;
  const active = event.currentTarget.ownerDocument.activeElement;
  if (active === null) return false;
  const from = startOf(active, event.currentTarget);
  if (from === null) return false;
  const row = rowOf(from);
  if (row === null) return false;
  let target: HTMLElement | null;
  let extending = false;
  if (key === 'Home' || key === 'End') {
    const corner = !mac && event.ctrlKey;
    target = toEnd(from, row, key === 'Home', corner);
    // Home and End extend only with Ctrl, to the grid's corners.
    extending = corner;
  } else if (key === 'ArrowUp') {
    // A column header is never selected.
    target = upToHeader(from, row);
  } else {
    target = sideways(from, row, active, (key === 'ArrowRight') === (direction === 'ltr') ? 1 : -1);
    extending = !isHeader(from);
  }
  if (target === null) return false;
  event.preventDefault();
  event.stopPropagation();
  target.focus();
  const reached = rowOf(target);
  if (event.shiftKey && extending && reached !== null) extend(reached);
  return true;
}

/**
 * The table's keys, in this order (spec 7.2, spec corrections 6 to 8). Nothing is taken from a key that reached
 * the root only through React's tree (a Menu opened in a cell is a portal), a composing key, a key while the
 * table sits under an open modal (one inside a modal keeps its keys), a key typed into an editable element, or a
 * key inside the bulk-action bar or the list face's head, whose controls' keys are their own. Then: Enter on a row, one of its own cells or the box in its checkbox cell
 * opens the row's link, with any modifiers, and never reaches React Aria, which would select the row; Page Down
 * and Page Up by the rows in view; the arrows, Home and End past a column that has left, and Left and Right
 * stopping at the header row's ends; every other key with Ctrl, Alt or Meta is React Aria's (Mod+A, Shift
 * with the arrows); J and K are dispatched as Arrow Down and Arrow Up on the focused element; X toggles the
 * focused row; and a single printable key that React Aria's typeahead would act on stops here, so typeahead never
 * moves focus. J, K and X match by `event.key` and then by `event.code`, so a Persian layout's J is J.
 */
export function handleTableKey(event: ReactKeyboardEvent<HTMLElement>, actions: TableKeyActions): void {
  const native = event.nativeEvent;
  const target = event.target as Element;
  if (!event.currentTarget.contains(target)) return;
  if (native.isComposing || isUnderModal(event.currentTarget)) return;
  if (target.closest(`${EDITABLE}, .data-table-bar, .data-table-list-head`) !== null) return;
  const row = target.closest('[role="row"]');
  if (
    event.key === 'Enter' &&
    row !== null &&
    (target === row || target.matches(BODY_CELL) || target.closest(SELECTION_CELL) !== null)
  ) {
    // React Aria would select a row with no action on Enter (spec correction 6), and its checkbox toggles on
    // Enter, so Enter never reaches it: it opens the row, or does nothing on a row without a link.
    event.preventDefault();
    event.stopPropagation();
    openRow(row, native);
    return;
  }
  if (pageKey(event, actions) || hiddenCellKey(event, actions)) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const j = matchesShortcut(native, J);
  if (j || matchesShortcut(native, K)) {
    event.preventDefault();
    event.stopPropagation();
    const arrow = j ? 'ArrowDown' : 'ArrowUp';
    // React Aria moves on the arrow's keydown, which the grid hears from the focused element.
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: arrow, code: arrow, bubbles: true, cancelable: true }),
    );
    return;
  }
  if (matchesShortcut(native, X)) {
    event.preventDefault();
    event.stopPropagation();
    const key = row === null ? null : actions.keyOf(row);
    if (key !== null) actions.toggle(key);
    return;
  }
  // Typeahead: a letter never moves focus (ruling 3). Only a key React Aria's typeahead would act on stops, and
  // React Aria would stop that one itself once it moved focus, so every key it would let pass, such as a page's
  // "/" shortcut, still reaches the page. Space is React Aria's toggle.
  if (event.key.length === 1 && event.key !== ' ' && actions.typeahead(event.key)) event.stopPropagation();
}

/**
 * Opens the row's link: a plain click, so the router opens it, or a click carrying the modifiers, so the browser
 * opens a new tab or window as it would for a modifier click, as React Aria's `openLink` does. A row without a
 * link (a disabled row, the totals row, the empty row) opens nothing.
 */
function openRow(row: Element, native: KeyboardEvent): void {
  const link = row.querySelector<HTMLAnchorElement>('a.data-table-link');
  if (link === null) return;
  const { ctrlKey, metaKey, shiftKey, altKey } = native;
  if (!ctrlKey && !metaKey && !shiftKey && !altKey) {
    link.click();
    return;
  }
  link.dispatchEvent(
    new MouseEvent('click', {
      ctrlKey,
      metaKey,
      shiftKey,
      altKey,
      bubbles: true,
      cancelable: true,
      detail: 1,
    }),
  );
}
