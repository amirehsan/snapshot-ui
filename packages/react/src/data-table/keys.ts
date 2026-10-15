import type { KeyboardEvent } from 'react';

/*
 * DataTable's capture-phase key handler, on its root, so it runs before React Aria's handlers on the grid, its
 * rows and its cells (spec 7.2, ruling 3). This task's part is the hidden-cell arrows: React Aria's keyboard
 * delegate walks the collection, not the DOM, so an arrow would land on a cell the container query hid (spec
 * correction 8). Every DOM read is here, at key time, never at render.
 */

const CELL = '[role="gridcell"], [role="rowheader"]';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

const isShown = (cell: Element): boolean => getComputedStyle(cell).display !== 'none';

const cellsOf = (row: Element): HTMLElement[] => [
  ...row.querySelectorAll<HTMLElement>(':scope > [role="gridcell"], :scope > [role="rowheader"]'),
];

/** The nearest shown cell from `from` in DOM order (1 next, -1 previous), or the row's first or last shown one. */
export function nextVisibleCell(from: Element, step: 1 | -1 | 'first' | 'last'): HTMLElement | null {
  const row = from.getAttribute('role') === 'row' ? from : from.closest('[role="row"]');
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

/** The cell or row an arrow starts from: the focused cell, the cell holding focus, or the focused row. */
function startOf(active: Element, root: Element): Element | null {
  if (!root.contains(active)) return null;
  if (active.getAttribute('role') === 'row') return active;
  return active.closest(CELL);
}

/**
 * Moves an arrow, Home or End past a cell the CSS hid: when the cell React Aria would reach is `display: none`,
 * the key stops here and focus goes to the nearest shown cell in that direction, whose focus event sets React
 * Aria's focused key. Every other key passes through. Arrow Right is the next cell in DOM order on a
 * left-to-right row and the previous on a right-to-left one.
 */
export function handleTableKey(event: KeyboardEvent<HTMLElement>): void {
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing)
    return;
  const { key } = event;
  if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
  const active = event.currentTarget.ownerDocument.activeElement;
  if (active === null) return;
  const from = startOf(active, event.currentTarget);
  if (from === null) return;
  const row = from.getAttribute('role') === 'row' ? from : from.closest('[role="row"]');
  if (row === null) return;
  const cells = cellsOf(row);
  if (cells.length === 0) return;
  let target: HTMLElement | null;
  if (key === 'Home' || key === 'End') {
    // From a row React Aria moves between rows; from a cell, to the row's first or last cell.
    if (from === row) return;
    const reached = key === 'Home' ? cells[0] : cells.at(-1);
    if (reached === undefined || isShown(reached)) return;
    target = nextVisibleCell(from, key === 'Home' ? 'first' : 'last');
  } else {
    const rtl = getComputedStyle(row).direction === 'rtl';
    const step = (key === 'ArrowRight') !== rtl ? 1 : -1;
    if (from !== row && hasFocusableBeyond(from, active, step)) return;
    const start = from === row ? (step === 1 ? -1 : cells.length) : cells.indexOf(from as HTMLElement);
    const reached = cells[start + step];
    if (reached === undefined || isShown(reached)) return;
    // Past the last shown cell React Aria returns to the row, as it does past the last cell.
    target = nextVisibleCell(from, step) ?? (from === row ? null : (row as HTMLElement));
  }
  if (target === null) return;
  event.preventDefault();
  event.stopPropagation();
  target.focus();
}
