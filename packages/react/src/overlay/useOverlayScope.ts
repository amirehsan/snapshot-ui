'use client';

import { useLayoutEffect, type RefObject } from 'react';

/** The three attributes a scope may carry, copied in this order. */
export const SCOPE_ATTRIBUTES = ['data-theme', 'data-shape', 'data-density'] as const;

/**
 * Copies each scope attribute from the nearest ancestor of `origin` that carries it onto `root`, and
 * removes from `root` the ones no ancestor carries. An origin of null copies nothing and removes all
 * three, which is the root theme. Exported for the test; the hook is what components call.
 */
export function copyScope(root: Element, origin: Element | null | undefined): void {
  for (const name of SCOPE_ATTRIBUTES) {
    const value = origin?.closest(`[${name}]`)?.getAttribute(name);
    if (value == null) root.removeAttribute(name);
    else root.setAttribute(name, value);
  }
}

/**
 * Copies the theme, shape and density scope of the element an overlay opened from onto the
 * overlay's root, in a layout effect at mount. The origin is `originRef.current` when React Aria
 * gives the overlay its trigger (Popover and Menu through `PopoverContext`, Tooltip through
 * `TooltipContext`), and otherwise `document.activeElement` at that moment: the pressed trigger
 * still holds focus during the layout effect, before React Aria's Dialog moves it in an effect.
 * An overlay root mounts when it opens, since React Aria unmounts a closed overlay, so mount is open.
 *
 * Internal: not exported from the package.
 */
export function useOverlayScope(
  rootRef: RefObject<Element | null>,
  originRef?: RefObject<Element | null>,
): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    copyScope(root, originRef?.current ?? document.activeElement);
    // Once, at mount: an overlay root mounts when it opens.
  }, [rootRef, originRef]);
}
