'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/** The open modal overlays, bottom-most first. A singleton that creates no DOM, so it imports on the server. */
const open: string[] = [];
const listeners = new Set<() => void>();

function tell(): void {
  for (const listener of listeners) listener();
}

/** Whether a modal overlay other than `id` is open. CommandPalette's shortcut asks this. */
export function isAnotherModalOpen(id?: string): boolean {
  return open.some((each) => each !== id);
}

/** The ids of the open modal overlays, bottom-most first. For tests. */
export function openModals(): readonly string[] {
  return [...open];
}

/**
 * Registers a modal overlay in the module-level stack while `isOpen`, and returns whether it is the
 * bottom-most open one, which is the one that paints the scrim. While it is not, the element in
 * `scrimRef` carries `data-stacked`, set and removed straight on the element in a layout effect so
 * React never has to re-render React Aria's overlay for it. When the bottom-most closes, the next
 * becomes bottom-most and paints. `isOpen` is the overlay state's `isOpen`, not whether the overlay
 * is mounted: an exiting overlay has left the stack.
 *
 * Internal: not exported from the package.
 */
export function useOverlayStack(
  id: string,
  isOpen: boolean,
  scrimRef: RefObject<HTMLElement | null>,
): boolean {
  const [isBottom, setBottom] = useState(true);
  useLayoutEffect(() => {
    if (!isOpen) return;
    open.push(id);
    tell();
    return () => {
      const index = open.indexOf(id);
      if (index >= 0) open.splice(index, 1);
      tell();
    };
  }, [id, isOpen]);
  useLayoutEffect(() => {
    const update = (): void => {
      setBottom(open[0] === id || !open.includes(id));
    };
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, [id]);
  useLayoutEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    if (isBottom) scrim.removeAttribute('data-stacked');
    else scrim.setAttribute('data-stacked', '');
  }, [isBottom, scrimRef]);
  return isBottom;
}
