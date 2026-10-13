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
 * The last `beforematch` event the browser fired inside a folded card. The browser fires it at a
 * `hidden="until-found"` element before it shows a find-in-page match or a text fragment there, and scrolls to
 * the match once the event is done. React Aria opens the card inside the event, in a render it flushes at
 * once, and every card that opens with it renders in that same render: each card with its `storageKey`, and a
 * controlled card whose parent opens it.
 */
let reveal: Event | undefined;

/** Whether this render runs while the browser reveals a match, inside the dispatch of its event. */
const isRevealing = (): boolean => reveal !== undefined && reveal.eventPhase !== Event.NONE;

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
 * A card that folds while focus is in its body moves the focus to its toggle, `toggleRef`, since the body
 * is about to be hidden and would take the focus with it. Focus anywhere else stays where it is.
 *
 * Returns whether the root carries `data-instant`, which the stylesheet turns every transition off for. It is
 * there for two kinds of change, which are drawn at once and not moved:
 * - The render after hydration. A card the server rendered carries the mark from the server's HTML until two
 *   frames after hydration, so the render where the card catches up with what only the browser knows, such
 *   as a remembered fold, is drawn at once: a page never animates on load.
 * - A change made while the browser reveals a match. The browser scrolls to the match as the card opens, and
 *   a body still growing from nothing, clipped while it moves, would leave the match out of view. Every card
 *   that changes in that render takes the mark, so a card with the same key above the match is drawn at once
 *   too, and loses it two frames later.
 *
 * The mark is rendered rather than set by an effect, so it is on before anything brings the styles up to
 * date, and two cards that change in one commit are both drawn at once. A card first rendered in the browser
 * carries it only for a reveal, and every other change moves.
 *
 * The fold is the root's grandchild: the root holds React Aria's disclosure, which holds the fold.
 *
 * Internal: not exported from the package.
 */
export function useFolding(
  foldRef: RefObject<HTMLElement | null>,
  toggleRef: RefObject<HTMLElement | null>,
  isExpanded: boolean,
): boolean {
  const turn = useRef(0);
  const shown = useRef(isExpanded);
  const hydrated = useHydrated();
  // True when the first render was the server's, or the hydration of its HTML.
  const [serverRendered] = useState(!hydrated);
  const [settled, setSettled] = useState(false);
  // The state the card last rendered, and whether it changed to it while the browser revealed a match. The
  // render that makes a change records where it runs, once.
  const [drawn, setDrawn] = useState({ isExpanded, isRevealed: false });
  if (drawn.isExpanded !== isExpanded) setDrawn({ isExpanded, isRevealed: isRevealing() });
  const instant = (serverRendered && !settled) || drawn.isRevealed;
  useLayoutEffect(() => {
    // Effects run again with nothing changed under Strict Mode, and that is not a move.
    if (shown.current === isExpanded) return;
    shown.current = isExpanded;
    const fold = foldRef.current;
    const root = fold?.parentElement?.parentElement;
    if (!fold || !root) return;
    if (!isExpanded && fold.contains(document.activeElement)) toggleRef.current?.focus();
    const mine = ++turn.current;
    root.setAttribute(FOLDING, '');
    const running = 'getAnimations' in fold ? fold.getAnimations() : [];
    void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
      if (turn.current === mine) root.removeAttribute(FOLDING);
    });
  }, [foldRef, toggleRef, isExpanded]);
  useLayoutEffect(() => {
    // Only a folded card can hold a match. Its root sees the event first, in the capture phase, before React
    // Aria's listener on the fold opens the card.
    const root = foldRef.current?.parentElement?.parentElement;
    if (isExpanded || !root) return;
    const onBeforeMatch = (event: Event): void => {
      reveal = event;
    };
    root.addEventListener('beforematch', onBeforeMatch, true);
    return () => {
      root.removeEventListener('beforematch', onBeforeMatch, true);
    };
  }, [foldRef, isExpanded]);
  useEffect(() => {
    if (!hydrated || !instant) return;
    // The first frame draws whatever the change drew, with the mark on. The next takes the mark off, once the
    // styles it drew are the ones in place, so taking it off starts nothing.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        setSettled(true);
        setDrawn((now) => (now.isRevealed ? { ...now, isRevealed: false } : now));
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [hydrated, instant]);
  return instant;
}
