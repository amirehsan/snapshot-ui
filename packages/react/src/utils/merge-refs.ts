import type { Ref, RefCallback } from 'react';

/**
 * Gives one ref the element, and returns what undoes it: an object ref is cleared, a callback ref's own
 * cleanup runs when it returned one, and otherwise the callback ref is called with null, as React does.
 */
function attach<T>(ref: Ref<T> | undefined, element: T): () => void {
  if (typeof ref === 'function') {
    const cleanup = ref(element);
    return typeof cleanup === 'function'
      ? cleanup
      : () => {
          ref(null);
        };
  }
  if (ref) {
    ref.current = element;
    return () => {
      ref.current = null;
    };
  }
  return () => undefined;
}

/**
 * One callback ref that feeds every ref given: an object ref is set and cleared, a callback ref is
 * called with the element and, if it returned a cleanup, that cleanup runs on detach, otherwise it is
 * called with null. Undefined refs are skipped.
 *
 * React 19 detaches by running the cleanup the merged ref returns. A caller that detaches by calling it
 * with null instead, as code written before React 19 does, undoes the same last attach.
 *
 * Memoize the result, with `useMemo` over the refs, as `ModalFrame` does. A new merged ref on every render
 * makes React detach and attach every ref it feeds on every render: object refs blink to null, and a callback
 * ref with side effects runs them again.
 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  let detach: (() => void) | undefined;
  const undo = (): void => {
    detach?.();
    detach = undefined;
  };
  return (element) => {
    undo();
    if (element === null) return;
    const undoEach = refs.map((ref) => attach(ref, element));
    detach = () => {
      for (const each of undoEach) each();
    };
    return undo;
  };
}
