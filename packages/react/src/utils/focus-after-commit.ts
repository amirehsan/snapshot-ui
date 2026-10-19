/*
 * Moving focus after React's commit, to a place the reader can name, never the body (settings plan, lessons 2 and
 * 10). Every part that hides or removes what may hold focus uses it: ConditionalFields first, then FieldExtras,
 * Repeater, PanelLayout and AccountMenu. It is internal and not exported from the package. Every DOM read is in an
 * effect, a listener or a frame, never at render, so nothing here runs on the server.
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react';

/** Runs `move` in the next animation frame, after React's commit and any engine's focus fix-up. Returns a cancel. */
export function afterCommit(move: () => void): () => void {
  const frame = requestAnimationFrame(() => {
    move();
  });
  return () => {
    cancelAnimationFrame(frame);
  };
}

/**
 * Watches whether focus is inside `root`: set by a focusin inside it, cleared only by a focusin outside it (a
 * document listener while mounted). A blur to nothing, as Chromium's when the focused element turns display: none
 * or loses its tabindex before effects run, leaves it set (lesson 10).
 */
export function useFocusWatch(root: RefObject<HTMLElement | null>): {
  held: () => boolean;
  release: () => void;
} {
  const holds = useRef(false);
  useEffect(() => {
    const element = root.current;
    if (element === null) return;
    const page = element.ownerDocument;
    // Focus may already be inside when the watch starts, as with a field that mounts focused.
    holds.current = element.contains(page.activeElement);
    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target;
      holds.current = target instanceof Node && root.current?.contains(target) === true;
    };
    page.addEventListener('focusin', onFocusIn, true);
    return () => {
      page.removeEventListener('focusin', onFocusIn, true);
    };
  }, [root]);
  return useMemo(
    () => ({
      held: () => holds.current,
      release: () => {
        holds.current = false;
      },
    }),
    [],
  );
}

/** What holds no focus, or none a reader can see: hidden, inert, or a disabled fieldset's field. */
const UNREACHABLE = '[hidden], [inert], fieldset:disabled';

/** Whether focus is lost: on the body, on nothing, detached, or inside something hidden, inert or disabled. */
export function focusIsLost(): boolean {
  const active = document.activeElement;
  if (active === null || active === document.body || active === document.documentElement) return true;
  if (!active.isConnected) return true;
  return active.matches(':disabled') || active.closest(UNREACHABLE) !== null;
}

/** What may take focus by Tab, before the checks that rule each one out. */
const CANDIDATES = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]';

/**
 * Whether `element` takes focus by Tab: not disabled, not inert, not hidden, not a hidden input, not tabindex -1,
 * and drawn, where the engine can tell (jsdom has no layout and no `checkVisibility`).
 */
function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(':disabled')) return false;
  if (element instanceof HTMLInputElement && element.type === 'hidden') return false;
  if (element.closest(UNREACHABLE) !== null) return false;
  return (
    typeof element.checkVisibility !== 'function' || element.checkVisibility({ visibilityProperty: true })
  );
}

/** Every element in `root` that takes focus by Tab, in document order. */
function tabbables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(CANDIDATES)].filter(isTabbable);
}

/** The first element in `root` that takes focus by Tab: not disabled, not inert, not hidden, not tabindex -1. */
export function firstFocusable(root: ParentNode): HTMLElement | null {
  return tabbables(root)[0] ?? null;
}

/** The nearest element before `node` in the document that takes focus by Tab, outside it. Internal. */
export function focusableBefore(node: Element): HTMLElement | null {
  const before = tabbables(node.ownerDocument).filter(
    (element) =>
      !node.contains(element) &&
      (node.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) !== 0,
  );
  return before.at(-1) ?? null;
}

/** Whether `element` takes focus by Tab. Internal, for a part checking the place it names first. */
export function takesFocus(element: HTMLElement | null): element is HTMLElement {
  return element?.isConnected === true && isTabbable(element);
}

/**
 * Focuses `<main>`, lending it `tabindex="-1"` while it holds focus if it has no tabindex of its own, so a script
 * can focus it and Tab never stops on it. The page does not scroll to its top.
 */
function focusMain(main: HTMLElement): boolean {
  if (!main.hasAttribute('tabindex')) {
    main.setAttribute('tabindex', '-1');
    main.addEventListener(
      'blur',
      () => {
        main.removeAttribute('tabindex');
      },
      { once: true },
    );
  }
  main.focus({ preventScroll: true });
  return main.ownerDocument.activeElement === main;
}

/** Focuses `target`, else `<main>`; never the body. Returns the element focused, or null. */
export function focusNamedPlace(target: HTMLElement | null): HTMLElement | null {
  if (target?.isConnected === true) {
    target.focus();
    if (target.ownerDocument.activeElement === target) return target;
  }
  const main = (target?.ownerDocument ?? document).querySelector('main');
  return main !== null && focusMain(main) ? main : null;
}
