import { useCallback, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { markReveal } from './useFolding';

/** How the fold is watched: the one attribute a changed field carries, anywhere inside it. */
const WATCH: MutationObserverInit = { attributeFilter: ['data-changed'], subtree: true, childList: true };

/**
 * Whether anything inside the fold carries `data-changed`, as every library field's root does while it is
 * changed, so a folded card can say it holds a change. A field in a card nested in the body counts too.
 *
 * The fold is read and watched only while the card is folded. It is read in the render that folds the card,
 * so a change made while the card was open shows at once. From then on a MutationObserver watches that one
 * attribute in the fold's subtree, and the elements that come and go there, until the card opens or leaves
 * the page, when it is disconnected. Open, the card shows no marker and nothing is watched.
 *
 * The server has no fold to read, so nothing inside is changed there, or while the page hydrates.
 *
 * Internal: not exported from the package.
 */
export function useHoldsChange(foldRef: RefObject<HTMLElement | null>, isFolded: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      const fold = foldRef.current;
      if (!isFolded || !fold) return () => undefined;
      const observer = new MutationObserver(onChange);
      observer.observe(fold, WATCH);
      return () => {
        observer.disconnect();
      };
    },
    [foldRef, isFolded],
  );
  const holdsChange = (): boolean => {
    const fold = foldRef.current;
    return isFolded && fold !== null && fold.querySelector('[data-changed]') !== null;
  };
  return useSyncExternalStore(subscribe, holdsChange, () => false);
}

/**
 * Opens the card through `open`, the path a press of the toggle takes, when a field in its folded body fails
 * the browser's validation, on submit or when a script calls the form's `checkValidity()` or
 * `reportValidity()`. The browser fires `invalid` at each control that fails before it moves focus to the
 * first one, and a React Aria field moves the focus itself, from its own `invalid` listener on
 * the control. This listener is on the card's root, in the capture phase, so it runs before both, and it
 * renders the open at once, so the body is shown before anything focuses a field in it. Only a folded card
 * listens, and only a control inside the fold opens it: one among the header's actions is in view already.
 *
 * The open is a reveal (see `markReveal`), so it is drawn with no transition: the body is its full height
 * when the field takes focus, and the browser scrolls the page to the field and not a clipped body to it.
 *
 * The browser fires `invalid` at every control that fails, one after another in the same task, so the card
 * opens, or asks a controlled card's parent to, once for all of them, and again for the next check.
 *
 * The root is the fold's grandparent: the root holds React Aria's disclosure, which holds the fold.
 *
 * `open` is a new function on every render, so the listener reads the latest one from a ref and stays on the
 * root for as long as the card is folded: a folded card in a parent that renders often adds and removes
 * nothing per render.
 *
 * Internal: not exported from the package.
 */
export function useOpenOnInvalid(
  foldRef: RefObject<HTMLElement | null>,
  isFolded: boolean,
  open: () => void,
): void {
  const opening = useRef(false);
  const latestOpen = useRef(open);
  useLayoutEffect(() => {
    latestOpen.current = open;
  });
  useLayoutEffect(() => {
    const fold = foldRef.current;
    const root = fold?.parentElement?.parentElement;
    if (!isFolded || !fold || !root) return;
    const onInvalid = (event: Event): void => {
      if (opening.current || !(event.target instanceof Node) || !fold.contains(event.target)) return;
      opening.current = true;
      setTimeout(() => {
        opening.current = false;
      });
      markReveal(event);
      flushSync(latestOpen.current);
    };
    root.addEventListener('invalid', onInvalid, true);
    return () => {
      root.removeEventListener('invalid', onInvalid, true);
    };
  }, [foldRef, isFolded]);
}
