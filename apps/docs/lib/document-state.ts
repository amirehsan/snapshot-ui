'use client';

import { useSyncExternalStore } from 'react';
import { readRailCollapsed, readShape, type Shape } from './prepaint';

/** Calls back whenever `attribute` changes on <html>, whoever changes it. */
function subscribeTo(attribute: string): (onChange: () => void) => () => void {
  return (onChange) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [attribute] });
    return () => {
      observer.disconnect();
    };
  };
}

const subscribeShape = subscribeTo('data-shape');
const subscribeRail = subscribeTo('data-rail');
const subscribeNothing = (): (() => void) => () => undefined;

/** The corner shape on <html>. Every switch on the page shares it. */
export function useShape(): Shape {
  return useSyncExternalStore(subscribeShape, readShape, () => 'rounded');
}

/** Whether the rail is collapsed to icons. */
export function useRailCollapsed(): boolean {
  return useSyncExternalStore(subscribeRail, readRailCollapsed, () => false);
}

/** False on the server and while hydrating, true after: for values only the browser knows. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}
