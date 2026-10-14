'use client';

import { useContext, useEffect, useMemo, useRef, type ReactElement, type Ref } from 'react';
import {
  TabList as RACTabList,
  TabListStateContext,
  type Key,
  type TabListProps as RACTabListProps,
} from 'react-aria-components';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';

export type TabListProps<T extends object = object> = Omit<RACTabListProps<T>, 'className' | 'style'> &
  Partial<AriaName> & {
    /** A class name merged after the library's own class. */
    className?: string;
    /** A ref to the row, the element that scrolls. */
    ref?: Ref<HTMLDivElement>;
  };

/**
 * The row of tabs, in a canvas track with no edge. A row that does not fit scrolls inside itself, and after
 * mount, and whenever the selection moves while its tab does not hold focus, it brings the selected tab into
 * view by moving the row alone. Name it with `aria-label` or `aria-labelledby`.
 */
export function TabList<T extends object = object>({
  className,
  ref,
  ...props
}: TabListProps<T>): ReactElement {
  const own = useRef<HTMLDivElement>(null);
  const listRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
  // The key whose tab was last brought into view, or that took focus, which the browser shows on its own.
  const shown = useRef<Key | null>(null);
  // React Aria builds its collection after its first render on the client, and its state says when the tabs are
  // there. Read here, it renders the row again as they arrive.
  const state = useContext(TabListStateContext);
  const selectedKey = state?.selectedKey ?? null;
  const size = state?.collection.size;
  // After the first paint that holds the selected tab, and again each time the selection moves from outside the
  // row, as Back does with link tabs: the server's row starts at its first tab, and the selected one arrives
  // here. The row moves, never the page, which scrollIntoView would move too. A row mounted hidden has no width
  // and every box at zero, so it waits until it is drawn.
  useEffect(() => {
    const list = own.current;
    const tab = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!list || !tab || shown.current === selectedKey) return;
    const bring = (): boolean => {
      if (list.clientWidth === 0) return false;
      shown.current = selectedKey;
      if (tab.contains(document.activeElement)) return true;
      const room = list.getBoundingClientRect();
      const box = tab.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(list).paddingInlineStart) || 0;
      if (box.right > room.right - pad) list.scrollBy({ left: box.right - room.right + pad });
      else if (box.left < room.left + pad) list.scrollBy({ left: box.left - room.left - pad });
      return true;
    };
    if (bring() || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (bring()) observer.disconnect();
    });
    observer.observe(list);
    return () => {
      observer.disconnect();
    };
  }, [selectedKey, size]);
  return <RACTabList {...props} ref={listRef} className={cx('tab-list', className)} />;
}
