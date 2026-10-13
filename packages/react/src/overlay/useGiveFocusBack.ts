'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/** Gives focus back to `origin` if it fell to the body, and the origin is on the page to take it. */
function giveFocusBack(origin: Element | null): void {
  const active = document.activeElement;
  if (active !== null && active !== document.body) return;
  // With no scroll, as React Aria's own restore does it.
  if (origin instanceof HTMLElement && origin !== document.body && origin.isConnected) {
    origin.focus({ preventScroll: true });
  }
}

/**
 * For an overlay's content, called first in it: records in `originRef` what held focus as the content
 * mounted, and once the overlay has closed and the content leaves the page, gives focus back to it if focus
 * fell to the body with the content. That runs before the browser does anything else: React Aria removes a
 * closed overlay's content in a synchronous update, whose passive effects React runs before it returns.
 * `isOpen` is the overlay's state, false once it is closing.
 *
 * React Aria gives focus back too, but in the next animation frame, and only if focus is still on the body by
 * then. A dialog under the overlay can take it first: React Aria's `useDialog` focuses its own dialog element
 * 500ms after it mounts whenever focus is on the body, a VoiceOver workaround. An overlay opened over a
 * dialog that closes near that moment, before the frame, leaves focus on the dialog's container for good,
 * since the frame then finds focus off the body and restores nothing. Given back here, focus never rests on
 * the body for that dialog to take.
 *
 * The origin is read once per mount: Strict Mode runs the layout effect again as the content mounts, after
 * the content has taken focus. And nothing moves at an unmount while the state is open, which is Strict
 * Mode's rehearsal, or content taken off the page without closing, which React Aria handles.
 *
 * Internal: not exported from the package.
 */
export function useGiveFocusBack(originRef: RefObject<Element | null>, isOpen: boolean): void {
  const isOriginRead = useRef(false);
  useLayoutEffect(() => {
    if (isOriginRead.current) return;
    isOriginRead.current = true;
    originRef.current = document.activeElement;
  }, [originRef]);
  // The state as of the last commit, read at unmount.
  const isOpenRef = useRef(isOpen);
  useLayoutEffect(() => {
    isOpenRef.current = isOpen;
  });
  useEffect(
    () => () => {
      if (!isOpenRef.current) giveFocusBack(originRef.current);
    },
    [originRef],
  );
}
