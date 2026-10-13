import { useLayoutEffect, useRef, type RefObject } from 'react';

/** The attribute the card's root carries while its fold moves. */
const FOLDING = 'data-folding';

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
 * The fold is the root's grandchild: the root holds React Aria's disclosure, which holds the fold.
 *
 * Internal: not exported from the package.
 */
export function useFolding(foldRef: RefObject<HTMLElement | null>, isExpanded: boolean): void {
  const turn = useRef(0);
  const shown = useRef(isExpanded);
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
}
