'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * For an overlay's content, called first in it: records in `originRef` what held focus as the content
 * mounted, and as the content leaves the page with focus inside it, gives focus back to that origin. That runs
 * before the browser does anything else: React Aria removes a closed overlay's content in a synchronous
 * update, whose passive effects React runs before it returns.
 *
 * React Aria gives focus back too, but in the next animation frame, and only if focus is still on the body by
 * then. A dialog under the overlay can take it first: React Aria's `useDialog` focuses its own dialog element
 * 500ms after it mounts whenever focus is on the body, a VoiceOver workaround. An overlay opened over a
 * dialog that closes near that moment, before the frame, leaves focus on the dialog's container for good,
 * since the frame then finds focus off the body and restores nothing. Given back here, focus never rests on
 * the body for that dialog to take.
 *
 * Only focus that left with the content moves. Focus the user put elsewhere before the close, such as a press
 * on a blank part of the page that closed a combo box's list, stays where it is. Focus goes back through React
 * Aria's own `react-aria-focus-scope-restore` event, so a trigger that owns its restore, such as a link
 * preview that must not reopen, handles it; only when nothing takes the event does the origin take focus.
 *
 * The origin is read once per mount: Strict Mode runs the layout effect again as the content mounts, after
 * the content has taken focus. Strict Mode's rehearsed unmount moves nothing, since the content is still on
 * the page then.
 *
 * Internal: not exported from the package.
 */
export function useGiveFocusBack(originRef: RefObject<Element | null>): void {
  const isOriginRead = useRef(false);
  useLayoutEffect(() => {
    if (isOriginRead.current) return;
    isOriginRead.current = true;
    originRef.current = document.activeElement;
  }, [originRef]);
  // Layout cleanups of a removed subtree run before React detaches its DOM, so this is where focus was.
  const focusAtRemoval = useRef<Element | null>(null);
  useLayoutEffect(
    () => () => {
      focusAtRemoval.current = document.activeElement;
    },
    [],
  );
  useEffect(
    () => () => {
      const left = focusAtRemoval.current;
      // Only when focus was inside what just left the page.
      if (left === null || left === document.body || left.isConnected) return;
      const active = document.activeElement;
      if (active !== null && active !== document.body) return;
      const origin = originRef.current;
      if (!(origin instanceof HTMLElement) || origin === document.body || !origin.isConnected) return;
      // React Aria's own restore event, so a trigger that owns its restore (a link preview, a collection) handles it.
      const restore = new CustomEvent('react-aria-focus-scope-restore', { bubbles: true, cancelable: true });
      // With no scroll, as React Aria's own restore does it.
      if (origin.dispatchEvent(restore)) origin.focus({ preventScroll: true });
    },
    [originRef],
  );
}
