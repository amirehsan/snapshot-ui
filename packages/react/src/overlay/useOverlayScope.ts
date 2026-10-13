'use client';

import { useCallback, type RefCallback, type RefObject } from 'react';

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
 * Returns a callback ref for an overlay's root that copies onto it the theme, shape and density scope of the
 * element the overlay opened from, when the root attaches. An overlay root mounts when it opens, since React
 * Aria unmounts a closed overlay, so attach is open. The origin is `originRef.current`: the trigger, when
 * React Aria gives the overlay one (Popover and Menu through `PopoverContext`, Tooltip through
 * `TooltipContext`), or what held focus when the overlay opened, as `ModalFrame` records it. Without one it is
 * `document.activeElement` at attach, which is the pressed trigger unless the content took focus as it
 * mounted: a native `autoFocus` inside the root does that in the same layout phase, before the root's ref
 * attaches. So an overlay whose content may focus itself records the origin earlier and passes it here.
 *
 * A callback ref and not an effect: React attaches a root's ref only after the layout effects of everything
 * inside it have run, so an effect in a component rendered inside the root, as a modal's panel holds its
 * parts, would find no root. Put it on the root with `mergeRefs`, memoized, beside the caller's own refs.
 *
 * Internal: not exported from the package.
 */
export function useOverlayScope(originRef?: RefObject<Element | null>): RefCallback<Element> {
  return useCallback(
    (root: Element | null) => {
      if (root) copyScope(root, originRef?.current ?? document.activeElement);
    },
    [originRef],
  );
}
