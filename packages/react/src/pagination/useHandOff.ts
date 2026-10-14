import { useLayoutEffect, useRef, type FocusEvent, type RefObject } from 'react';

export interface HandOff {
  onFocus: () => void;
  onBlur: (event: FocusEvent) => void;
}

/**
 * Hands focus on when a step disables while it holds it, as Next does on reaching the last page: to the current
 * page's control, or to the other step when the numbers are hidden or not drawn, so focus never falls to the
 * page. A disabled link step is a new element (React Aria draws it as a span), and a disabled button drops
 * focus, so the step remembers it had focus and looks again once it has disabled. Imported only by the two
 * client leaves.
 */
export function useHandOff(ref: RefObject<HTMLElement | null>, isDisabled: boolean): HandOff {
  const hadFocus = useRef(false);
  useLayoutEffect(() => {
    if (!isDisabled || !hadFocus.current) return;
    hadFocus.current = false;
    const active = document.activeElement;
    // Focus that went somewhere else went there on purpose.
    if (active !== null && active !== document.body && active !== ref.current) return;
    const nav = ref.current?.closest('.pagination');
    if (!nav) return;
    const candidates = [
      nav.querySelector<HTMLElement>('.pagination-page[aria-current]'),
      nav.querySelector<HTMLElement>('.pagination-step:not(:disabled, [aria-disabled="true"])'),
    ];
    // A hidden control does not take focus: under 30rem the current page is not drawn, so the other step takes it.
    for (const candidate of candidates) {
      candidate?.focus();
      if (candidate && document.activeElement === candidate) return;
    }
  }, [isDisabled, ref]);
  return {
    onFocus: () => {
      hadFocus.current = true;
    },
    // Focus lost with its element, or to a disabled button, has no related target, so the flag stays for those.
    // A move to another element clears it, and so does focus going to nothing from a step still in the page
    // and enabled, such as a click on the page around it.
    onBlur: (event) => {
      const step = event.target;
      if (
        event.relatedTarget !== null ||
        (step.isConnected && !step.matches(':disabled, [aria-disabled="true"]'))
      )
        hadFocus.current = false;
    },
  };
}
