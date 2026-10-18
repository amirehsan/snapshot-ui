/*
 * Keeps a focused control clear of the page's chrome (WCAG 2.4.11): the shell's sticky header at the top, and at the
 * bottom a SaveBar, DataTable's bulk-action bar, the tab bar, the phone's upload bar and the wide upload panel. Each
 * piece of chrome registers itself while it is mounted, and one `focusin` listener on the document, added with the
 * first and removed with the last, scrolls a focused control out from under them two frames after the focus, after
 * the browser's own scroll and React Aria's. Nothing pads the root's scroll (spec correction 121): a browser applies
 * root scroll padding to every focus scroll, the one onto a stuck bar's own button included, which made the page
 * jump. Every read is of the layout at that moment, never at render, and nothing runs on the server.
 */

import { useEffect, type RefObject } from 'react';
import { scrollPortOf } from './scroll-port';

/** Which edge of the view a piece of chrome covers. */
export type ChromeEdge = 'top' | 'bottom';

/** A box in the view, as `getBoundingClientRect` gives it. */
export interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** A covering box and the gap a control keeps from it, in pixels. */
export interface Cover extends Box {
  gap: number;
}

/**
 * How far a port must scroll, in whole pixels, to bring `shown` out from under `covers`: positive scrolls down, so
 * the box moves up, by the least that brings its bottom the gap above every bottom cover it would meet on its way
 * (a stack of bars, the tab bar under the save bar under the upload bar, is cleared to the topmost); at most what
 * keeps `start`, the control's top, at `ceiling`, so a control taller than the room keeps its start in view. With
 * nothing under the bottom covers, negative by the least that brings its top the gap below the top covers. Zero when
 * it is clear already, or covered by half a pixel or less. Only covers that overlap the box across are given.
 *
 * Internal.
 */
export function clearance(
  shown: Box,
  start: number,
  covers: { top: readonly Cover[]; bottom: readonly Cover[] },
  ceiling: number,
): number {
  let up = 0;
  for (;;) {
    const bottom = shown.bottom - up;
    const hits = covers.bottom.filter(
      (cover) => cover.top - cover.gap < bottom - 0.5 && cover.bottom > shown.top - up,
    );
    if (hits.length === 0) break;
    up += bottom - Math.min(...hits.map((cover) => cover.top - cover.gap));
  }
  // Whole pixels: WebKit and Firefox round a scroll position, so a fractional step could stop short.
  if (up > 0) return Math.max(0, Math.min(Math.ceil(up), Math.floor(start - ceiling)));
  let down = 0;
  for (;;) {
    const top = shown.top + down;
    const hits = covers.top.filter(
      (cover) => cover.bottom + cover.gap > top + 0.5 && cover.top < shown.bottom + down,
    );
    if (hits.length === 0) break;
    down += Math.max(...hits.map((cover) => cover.bottom + cover.gap)) - top;
  }
  return down > 0 ? -Math.ceil(down) : 0;
}

/** The chrome on the page, each with the edge it covers. */
const chrome = new Map<HTMLElement, ChromeEdge>();

/** The view's top and bottom in `port`, or the window's. */
function viewOf(port: Element | null): { top: number; bottom: number } {
  return port === null
    ? { top: 0, bottom: document.documentElement.clientHeight }
    : port.getBoundingClientRect();
}

/** A length of `element`'s computed style in pixels, or NaN for `auto`. */
const px = (element: Element, name: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(name));

/**
 * Whether `element` cannot move as `port` scrolls: it, or an ancestor, is fixed, or is sticky in `port` and stuck
 * at its offset there. A stuck bar's own buttons, or a stuck header's, are where they are; scrolling would only
 * move the page under them.
 */
function isPinned(element: Element, port: Element | null): boolean {
  for (let each: Element | null = element; each !== null; each = each.parentElement) {
    const { position } = getComputedStyle(each);
    if (position === 'fixed') return true;
    if (position !== 'sticky' || scrollPortOf(each) !== port) continue;
    const box = each.getBoundingClientRect();
    const view = viewOf(port);
    if (Math.abs(box.top - view.top - px(each, 'top')) < 1) return true;
    if (Math.abs(view.bottom - px(each, 'bottom') - box.bottom) < 1) return true;
  }
  return false;
}

/**
 * Whether `cover` stays where it is as `port` scrolls, so scrolling there can bring a control out from under it:
 * fixed, sticky in that port, or outside it.
 */
function holds(cover: Element, port: Element | null): boolean {
  if (getComputedStyle(cover).position === 'fixed') return true;
  const own = scrollPortOf(cover);
  return port === null ? own === null : own === port || !port.contains(cover);
}

/**
 * Scrolls `control`, focused, by the least that brings its field (its label, control, description and error line,
 * or the control alone outside a field) out from under the chrome: first in its own scroll port, then in each port
 * around it by what is still covered. A chrome's gap is its `scroll-margin-block-end`, and a SaveBar's
 * `scroll-margin-block-start` is the page's sticky offset, which a tall control's top never goes above where the
 * window scrolls. Nothing moves when focus has moved on, or in a port where the control is pinned.
 *
 * Internal.
 */
export function uncover(control: HTMLElement): void {
  if (!control.isConnected || control.ownerDocument.activeElement !== control) return;
  const pieces = [...chrome].filter(([element]) => !element.contains(control));
  const field = control.closest('.field');
  const shown = field !== null && !pieces.some(([element]) => field.contains(element)) ? field : control;
  let port = scrollPortOf(control);
  for (;;) {
    if (!isPinned(control, port)) {
      const box = shown.getBoundingClientRect();
      const view = viewOf(port);
      const covers: { top: Cover[]; bottom: Cover[] } = { top: [], bottom: [] };
      for (const [element, edge] of pieces) {
        const cover = element.getBoundingClientRect();
        if (cover.height <= 0 || cover.left >= box.right || cover.right <= box.left || !holds(element, port))
          continue;
        // Chrome stuck or fixed at its edge covers the view to that edge, the tab bar under a stuck bar included.
        const isAtEdge = isPinned(element, port);
        covers[edge].push({
          top: edge === 'top' && isAtEdge ? Math.min(cover.top, view.top) : cover.top,
          bottom: edge === 'bottom' && isAtEdge ? Math.max(cover.bottom, view.bottom) : cover.bottom,
          left: cover.left,
          right: cover.right,
          gap: edge === 'bottom' ? px(element, 'scroll-margin-block-end') || 0 : 0,
        });
      }
      const ceiling = Math.max(
        view.top,
        ...covers.top.map((cover) => cover.bottom),
        ...(port === null ? pieces.map(([element]) => px(element, 'scroll-margin-block-start') || 0) : []),
      );
      const delta = clearance(box, control.getBoundingClientRect().top, covers, ceiling);
      if (delta !== 0) (port ?? window).scrollBy({ top: delta, behavior: 'instant' });
    }
    if (port === null) return;
    port = scrollPortOf(port);
  }
}

let frame = 0;

/** Scrolls the focused control clear two frames after the focus, unless it is in a portal or a modal. */
function onFocusIn(event: FocusEvent): void {
  const target = event.target;
  if (!(target instanceof HTMLElement) || target.closest('.overlay, .sheet-overlay, [data-trigger]') !== null)
    return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      uncover(target);
    });
  });
}

/**
 * Registers `element` as chrome covering `edge` of the view until the returned function is called. The first
 * registration adds the document's `focusin` listener and the last removal takes it away.
 *
 * Internal.
 */
export function registerChrome(element: HTMLElement, edge: ChromeEdge): () => void {
  if (chrome.size === 0) document.addEventListener('focusin', onFocusIn);
  chrome.set(element, edge);
  return () => {
    chrome.delete(element);
    if (chrome.size > 0) return;
    document.removeEventListener('focusin', onFocusIn);
    cancelAnimationFrame(frame);
  };
}

/** Registers the element in `ref` as chrome covering `edge` while it is mounted and `isActive`. Internal. */
export function useChrome(ref: RefObject<HTMLElement | null>, edge: ChromeEdge, isActive = true): void {
  useEffect(() => {
    const element = ref.current;
    if (element === null || !isActive) return;
    return registerChrome(element, edge);
  }, [ref, edge, isActive]);
}
