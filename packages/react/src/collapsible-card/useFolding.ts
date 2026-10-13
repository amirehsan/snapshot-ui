import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

/** The attribute the card's root carries while its fold moves. */
const FOLDING = 'data-folding';

const subscribeNothing = (): (() => void) => () => undefined;

/** False on the server and while the page hydrates, and true from the render after. */
const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

/**
 * Sets `data-folding` on the card's root each time the card opens or folds, and takes it off once every
 * transition the fold is running has finished, as the Web Animations API reports them. The stylesheet clips
 * the body only while the card is folded or folding, so a popup in an open card is never cut off at its
 * edge, and the attribute is there for exactly as long as the fold moves.
 *
 * Each change is a new turn. A toggle while the fold still moves replaces its transition, and the replaced
 * one settles late (a cancelled transition rejects), so only the settling of the latest turn takes the
 * attribute off. With nothing running, as under reduced motion, or where the API is missing, it comes off
 * at once. The first render marks nothing, since nothing moved.
 *
 * Returns whether the root carries `data-instant`, which the stylesheet turns every transition off for. A
 * card the server rendered carries it from the server's HTML until two frames after hydration, so the render
 * that follows hydration, where the card catches up with what only the browser knows, such as a remembered
 * fold, is drawn at once: a page never animates on load. The mark is rendered rather than set by an effect,
 * so it is on before anything brings the styles up to date, and two cards that fold in one commit are both
 * drawn at once. A card first rendered in the browser never carries it, and every later change moves.
 *
 * The fold is the root's grandchild: the root holds React Aria's disclosure, which holds the fold.
 *
 * Internal: not exported from the package.
 */
export function useFolding(foldRef: RefObject<HTMLElement | null>, isExpanded: boolean): boolean {
  const turn = useRef(0);
  const shown = useRef(isExpanded);
  const hydrated = useHydrated();
  // True when the first render was the server's, or the hydration of its HTML.
  const [serverRendered] = useState(!hydrated);
  const [settled, setSettled] = useState(false);
  const instant = serverRendered && !settled;
  useLayoutEffect(() => {
    // Effects run again with nothing changed under Strict Mode, and that is not a move.
    if (shown.current === isExpanded) return;
    shown.current = isExpanded;
    const fold = foldRef.current;
    const root = fold?.parentElement?.parentElement;
    if (!fold || !root) return;
    const mine = ++turn.current;
    root.setAttribute(FOLDING, '');
    const running = 'getAnimations' in fold ? fold.getAnimations() : [];
    void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
      if (turn.current === mine) root.removeAttribute(FOLDING);
    });
  }, [foldRef, isExpanded]);
  useEffect(() => {
    if (!hydrated || !instant) return;
    // The first frame draws whatever the render after hydration changed, with the mark on. The next takes
    // the mark off, once the styles it drew are the ones in place, so taking it off starts nothing.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        setSettled(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [hydrated, instant]);
  return instant;
}
