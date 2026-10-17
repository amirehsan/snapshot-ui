import { useMemo, type MouseEvent, type PointerEvent } from 'react';

/*
 * A click with no pointerdown before it. React Aria starts a press on pointerdown, so a real click whose
 * pointerdown never reached a hydrated element, as when a touch begins before React listens and ends after, is
 * cancelled on a link tab, the anchor's own navigation with it, and selects nothing. Such a click is sent again
 * as a click with no pointer, the click React Aria follows as a screen reader's: it selects the tab or opens its
 * link through the RouterProvider, once. React Aria's own clicks pass untouched: a keyboard's or a screen
 * reader's has no click count, and the one it sends to open a link natively has no view.
 */

/** Elements whose current press reached their own pointerdown handler. */
const started = new WeakSet<Element>();

const hasModifier = (event: MouseEvent): boolean =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

/** Clicks `element` with no pointer, after the event that asked for it, outside React's handling of it. */
const follow = (element: HTMLElement): void => {
  queueMicrotask(() => {
    if (element.isConnected) element.click();
  });
};

export interface UnstartedClick<E extends HTMLElement> {
  onPointerDown: (event: PointerEvent<E>) => void;
  onClickCapture: (event: MouseEvent<E>) => void;
}

/**
 * Handlers that follow a click whose pointerdown the element never saw, which React Aria would cancel. Give the
 * element each one beside React Aria's own. A modified click on a link stays the browser's: a new tab or window.
 */
export function useUnstartedClick<E extends HTMLElement>(isDisabled = false): UnstartedClick<E> {
  return useMemo(
    () => ({
      onPointerDown: (event: PointerEvent<E>) => {
        started.add(event.currentTarget);
      },
      onClickCapture: (event: MouseEvent<E>) => {
        const element = event.currentTarget;
        if (started.delete(element) || isDisabled) return;
        if (event.detail === 0 || event.button !== 0 || event.nativeEvent.view === null) return;
        // React Aria would cancel it, a modified click on a link included, so it never reaches React Aria.
        event.stopPropagation();
        if (element instanceof HTMLAnchorElement && hasModifier(event)) return;
        event.preventDefault();
        follow(element);
      },
    }),
    [isDisabled],
  );
}
