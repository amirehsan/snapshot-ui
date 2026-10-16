'use client';

import { useSyncExternalStore } from 'react';
import { readRailCollapsed, readRailUnfolded, readShape, readStagePanelOpen, type Shape } from './prepaint';

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

const subscribeUnfolded = subscribeTo('data-rail-unfolded');

/** Calls back whenever the page's elements change, so a panel opening or closing in an example is seen. */
const subscribeTree = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
  };
};

/** Whether an example's side panel stands open beside the page. False on the server and while hydrating. */
export function useStagePanelOpen(): boolean {
  return useSyncExternalStore(subscribeTree, readStagePanelOpen, () => false);
}

/** Whether the reader expanded the rail over an open example panel. */
export function useRailUnfolded(): boolean {
  return useSyncExternalStore(subscribeUnfolded, readRailUnfolded, () => false);
}

/** False on the server and while hydrating, true after: for values only the browser knows. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}
