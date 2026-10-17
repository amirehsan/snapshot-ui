/*
 * SaveBar keeps a focused control in its holder clear of itself (WCAG 2.4.11, risk R6). The root's scroll padding
 * keeps a control that focus scrolls into view clear of the tab bar, the bar and a phone's upload bar, with a gap,
 * but a browser leaves a control that is wholly in view where it is, under them, and the root's padding does not
 * reach a box that scrolls of its own. So two frames after the focus, after the browser's own scroll, the bar
 * scrolls the control's field clear, as DataTable clears its rows of its bulk-action bar (`data-table/scroll.ts`).
 * Every read is of the layout at that moment, never at render.
 */

import { scrollPortOf } from '../data-table/scroll';

/**
 * The gap a control keeps above the bar and the page's sticky offset, in pixels. The bar's scroll margin holds them
 * (`save-bar.css`: `scroll-margin-block: var(--page-sticky-top, 0px) var(--spacing-inset)`), so a length in rem or a
 * calc() reads as the browser resolves it, as DataTable reads its grid's.
 */
function marginsOf(bar: Element): { gap: number; stickyTop: number } {
  const style = getComputedStyle(bar);
  return {
    stickyTop: parseFloat(style.getPropertyValue('scroll-margin-block-start')) || 0,
    gap: parseFloat(style.getPropertyValue('scroll-margin-block-end')) || 0,
  };
}

/**
 * How many whole pixels `port` must scroll to bring `shown` the gap above the bar and, where the window scrolls,
 * above a phone's upload bar, which sits above it; at most what keeps `control`'s top at the view's top, below the
 * page's sticky offset where the window scrolls, so a control taller than the room keeps its start in view. Zero
 * when it is clear already, under by half a pixel or less, or its top is at the view's top already.
 */
function overlap(
  shown: Element,
  control: Element,
  bar: Element,
  port: Element | null,
  margins: { gap: number; stickyTop: number },
): number {
  const covers = [bar, ...(port === null ? document.querySelectorAll('.upload-tray-bar') : [])]
    .map((cover) => cover.getBoundingClientRect())
    .filter((box) => box.height > 0);
  if (covers.length === 0) return 0;
  const edge = Math.min(...covers.map((box) => box.top)) - margins.gap;
  const delta = shown.getBoundingClientRect().bottom - edge;
  if (delta <= 0.5) return 0;
  const viewTop = port === null ? Math.max(0, margins.stickyTop) : port.getBoundingClientRect().top;
  // Whole pixels: WebKit and Firefox round a scroll position, so a fractional step could stop short.
  return Math.max(0, Math.min(Math.ceil(delta), Math.floor(control.getBoundingClientRect().top - viewTop)));
}

/**
 * Scrolls `control`, a focused control in the bar's holder, by the least that brings its field (its label,
 * control, description and error line, or the control alone outside a field) the gap above the bar: first in the
 * control's own scroll port, then, for a control in a box that scrolls inside the bar's, in the bar's port by what
 * is still covered. Nothing moves when focus has moved on by the time the frame comes.
 *
 * Internal: SaveBar's.
 */
export function uncover(control: HTMLElement, bar: HTMLElement): void {
  if (!control.isConnected || control.ownerDocument.activeElement !== control) return;
  const field = control.closest('.field');
  const shown = field !== null && !field.contains(bar) ? field : control;
  const margins = marginsOf(bar);
  const own = scrollPortOf(control);
  const outer = scrollPortOf(bar);
  for (const port of own === outer ? [own] : [own, outer]) {
    const delta = overlap(shown, control, bar, port, margins);
    if (delta > 0) (port ?? window).scrollBy({ top: delta, behavior: 'instant' });
  }
}
