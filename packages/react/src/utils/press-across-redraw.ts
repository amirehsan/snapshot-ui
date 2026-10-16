import { useMemo, type MouseEvent, type PointerEvent, type RefCallback } from 'react';

/*
 * Presses that span hydration. React Aria draws a collection's items again just after hydration: the server's
 * tab or row is removed and a new one put in its place. A press that began on the server's element before the
 * scripts ran ends on the new one, and the browser, whose pressed element is gone, sends no click: a link tab
 * or a row's link opened nothing, not even by the anchor's own navigation. Chromium leaves the press active on
 * the removed element's parent, which holds the new element, and that is how a new element knows, as it is
 * drawn, that the press under the pointer began on the element it replaced. Its release is then followed as a
 * click with no pointer, the click React Aria follows as a screen reader's.
 *
 * A click can also reach a hydrated tab with no pointerdown before it, when the pointerdown came before React
 * listened. React Aria cancels such a click on a link tab, and with it the anchor's navigation, and opens
 * nothing; `followUnstartedClick` follows it the same way.
 */

/** Elements whose current press reached their own pointerdown handler. */
const started = new WeakSet<Element>();
/** Elements drawn while a press that began on an element they replaced was still down. */
const carried = new Set<Element>();
/** Elements whose carried press was followed: a click the browser sends them after it is dropped. */
const followed = new Set<Element>();
let clearing = false;

/** Forgets the carried press once its pointer is released, after the release's own click, in the same task. */
function clearAfterRelease(view: Window): void {
  if (clearing) return;
  clearing = true;
  const clear = (): void => {
    view.removeEventListener('pointerup', clear, true);
    view.removeEventListener('pointercancel', clear, true);
    view.setTimeout(() => {
      carried.clear();
      followed.clear();
      clearing = false;
    });
  };
  view.addEventListener('pointerup', clear, true);
  view.addEventListener('pointercancel', clear, true);
}

/**
 * Whether a press under way began on an element since removed from inside `container`: the deepest active
 * element is inside the container and holds `element`, which is not itself active. A press that began
 * anywhere outside the container, such as a drag from the page, does not count.
 */
function pressBeganOnRemoved(element: Element, container: string): boolean {
  const root = element.parentElement?.closest(container);
  if (!root || element.matches(':active') || !root.matches(':active')) return false;
  const active = element.ownerDocument.querySelectorAll(':active');
  const deepest = active[active.length - 1];
  return deepest !== undefined && root.contains(deepest) && deepest.contains(element);
}

/**
 * Clicks `element` with no pointer, the click React Aria follows as a screen reader's: it selects a tab or opens
 * a link through the RouterProvider. After the event that asked for it, since React Aria's state does not take a
 * click dispatched from inside React's handling of another.
 */
const follow = (element: HTMLElement): void => {
  queueMicrotask(() => {
    if (element.isConnected) element.click();
  });
};

const hasModifier = (event: MouseEvent): boolean =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

export interface PressAcrossRedraw<E extends HTMLElement> {
  ref: RefCallback<E>;
  onPointerDown: (event: PointerEvent<E>) => void;
  onPointerUp: (event: PointerEvent<E>) => void;
  onClickCapture: (event: MouseEvent<E>) => void;
}

export interface PressAcrossRedrawOptions {
  /** Whether the element takes no press. */
  isDisabled?: boolean;
  /** Follow a real click whose pointerdown the element never saw, which React Aria would cancel. */
  followUnstartedClick?: boolean;
}

/**
 * Props for an element React Aria draws again after hydration, inside `container` (a selector for the nearest
 * element that stays), so a press that began on the server's element is followed. Give the element each
 * handler beside React Aria's own and the ref beside its ref.
 */
export function usePressAcrossRedraw<E extends HTMLElement>(
  container: string,
  { isDisabled = false, followUnstartedClick = false }: PressAcrossRedrawOptions = {},
): PressAcrossRedraw<E> {
  return useMemo(
    () => ({
      ref: (element: E | null) => {
        if (element === null || isDisabled || !pressBeganOnRemoved(element, container)) return;
        carried.add(element);
        const view = element.ownerDocument.defaultView;
        if (view) clearAfterRelease(view);
      },
      onPointerDown: (event: PointerEvent<E>) => {
        started.add(event.currentTarget);
      },
      onPointerUp: (event: PointerEvent<E>) => {
        const element = event.currentTarget;
        if (event.button !== 0 || started.has(element) || !carried.delete(element) || isDisabled) return;
        followed.add(element);
        follow(element);
      },
      onClickCapture: (event: MouseEvent<E>) => {
        const element = event.currentTarget;
        const wasStarted = started.delete(element);
        if (event.detail > 0 && followed.delete(element)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        // React Aria's own clicks pass: a keyboard's or a screen reader's has no detail, and the one it sends to
        // open a link has no view.
        if (!followUnstartedClick || wasStarted || isDisabled) return;
        if (event.detail === 0 || event.button !== 0 || event.nativeEvent.view === null) return;
        // A modified click on a link is the browser's, a new tab or window, which React Aria would cancel too.
        event.stopPropagation();
        if (element instanceof HTMLAnchorElement && hasModifier(event)) return;
        event.preventDefault();
        follow(element);
      },
    }),
    [container, isDisabled, followUnstartedClick],
  );
}
