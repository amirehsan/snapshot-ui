/*
 * DataTable keeps a focused row clear of what covers it (WCAG 2.4.11, amendment 5). Rows carry a scroll margin
 * of the sticky offset and the header row above and the bulk-action bar below, which a browser honors when focus
 * scrolls a row that is partly out of the view; a row wholly inside the view but under the sticky header or the
 * bar is not scrolled at all (Chromium checks the row's own box, not its margins). So after React Aria's own
 * scroll, in a frame of its own, the focused row or cell is scrolled clear of the header row and the bar. Every
 * read is of the layout at that moment, never at render.
 */

import { scrollPortOf } from '../utils/scroll-port';

export { scrollPortOf } from '../utils/scroll-port';

/**
 * The page's sticky offset, `--page-sticky-top`, resolved to pixels: the grid's own scroll margin holds it (the
 * stylesheet sets it from the offset), so a length in rem or a calc() reads as the browser resolves it.
 */
export function pageStickyTop(grid: Element): number {
  return parseFloat(getComputedStyle(grid).getPropertyValue('scroll-margin-block-start')) || 0;
}

/** The list face's head while it sticks over the list, in Select mode; null in the table face and out of it. */
export function stickyHead(grid: Element): Element | null {
  return (
    grid.closest('.data-table-list')?.querySelector(':scope > .data-table-list-head[data-selecting]') ?? null
  );
}

/**
 * Where the bottom of a sticky `part` comes to rest once what it covers scrolls under it, in the view whose top is
 * `top`: its sticky offset and its height, or its own bottom while it sits lower, in the flow. A day heading or the
 * head that has not stuck yet sticks as soon as its item scrolls up to it, so its resting place is what covers.
 */
function stuckBottom(part: Element, top: number): number {
  const box = part.getBoundingClientRect();
  return Math.max(box.bottom, top + (parseFloat(getComputedStyle(part).top) || 0) + box.height);
}

/**
 * Scrolls `element`, a focused row, cell or list item, by the least that brings it out from under what covers the
 * top of its view and the bar in `root`, within the view it scrolls in: the page's sticky offset where the window
 * scrolls, the grid's sticky header row, or in the list face the item's own day heading and the list's head while
 * it sticks in Select mode. Nothing moves when it is clear already, or when focus has moved on by the time the
 * frame comes.
 */
export function uncover(element: HTMLElement, root: Element): void {
  if (!element.isConnected || element.ownerDocument.activeElement !== element) return;
  const grid = element.closest('[role="grid"]');
  if (grid === null) return;
  const port = scrollPortOf(grid);
  const view = port === null ? { top: 0, bottom: window.innerHeight } : port.getBoundingClientRect();
  // The table's sticky header row, or in the list face the item's own day heading, which sticks over its items.
  const header =
    grid.querySelector('[role="columnheader"]') ??
    element.closest('.data-table-section')?.querySelector('.data-table-section-header');
  const head = stickyHead(grid);
  const bar = root.querySelector('.data-table-bar')?.getBoundingClientRect();
  // An ungrouped list has no heading, so the page's own sticky header is the cover there; it is under the
  // header row and the headings wherever they stick, so the greatest of them is the edge.
  const top = Math.max(
    view.top,
    port === null ? pageStickyTop(grid) : view.top,
    header === null || header === undefined ? view.top : stuckBottom(header, view.top),
    head === null ? view.top : stuckBottom(head, view.top),
  );
  const bottom = Math.min(view.bottom, bar?.top ?? view.bottom);
  const box = element.getBoundingClientRect();
  const delta = box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0;
  if (Math.abs(delta) < 1) return;
  (port ?? window).scrollBy({ top: delta, behavior: 'instant' });
}
