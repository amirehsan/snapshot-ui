/*
 * DataTable keeps a focused row clear of what covers it (WCAG 2.4.11, amendment 5). Rows carry a scroll margin
 * of the sticky offset and the header row above and the bulk-action bar below, which a browser honors when focus
 * scrolls a row that is partly out of the view; a row wholly inside the view but under the sticky header or the
 * bar is not scrolled at all (Chromium checks the row's own box, not its margins). So after React Aria's own
 * scroll, in a frame of its own, the focused row or cell is scrolled clear of the header row and the bar. Every
 * read is of the layout at that moment, never at render.
 */

/** Whether an element scrolls in the block direction: an overflow that scrolls and more to scroll. */
export function scrolls(element: Element): boolean {
  const { overflowY } = getComputedStyle(element);
  return /auto|scroll|overlay/.test(overflowY) && element.scrollHeight > element.clientHeight;
}

/** The nearest ancestor of `element` that scrolls, or null for the window. */
export function scrollPortOf(element: Element): Element | null {
  let port: Element | null = element.parentElement;
  while (port !== null && !scrolls(port)) port = port.parentElement;
  return port;
}

/**
 * Scrolls `element`, a focused row, cell or list item, by the least that brings it out from under the grid's
 * sticky header row, or the list item's day heading, and the bar in `root`, within the view it scrolls in. Nothing moves when it is clear already, or when focus
 * has moved on by the time the frame comes.
 */
export function uncover(element: HTMLElement, root: Element): void {
  if (!element.isConnected || element.ownerDocument.activeElement !== element) return;
  const grid = element.closest('[role="grid"]');
  if (grid === null) return;
  const port = scrollPortOf(grid);
  const view = port === null ? { top: 0, bottom: window.innerHeight } : port.getBoundingClientRect();
  // The table's sticky header row, or in the list face the item's own day heading, which sticks over its items.
  const header = (
    grid.querySelector('[role="columnheader"]') ??
    element.closest('.data-table-section')?.querySelector('.data-table-section-header')
  )?.getBoundingClientRect();
  const bar = root.querySelector('.data-table-bar')?.getBoundingClientRect();
  const top = Math.max(view.top, header?.bottom ?? view.top);
  const bottom = Math.min(view.bottom, bar?.top ?? view.bottom);
  const box = element.getBoundingClientRect();
  const delta = box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0;
  if (Math.abs(delta) < 1) return;
  (port ?? window).scrollBy({ top: delta, behavior: 'instant' });
}
