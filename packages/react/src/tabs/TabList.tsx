'use client';

import { useContext, useEffect, useMemo, useRef, type ReactElement, type Ref } from 'react';
import {
  TabList as RACTabList,
  TabListStateContext,
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
 * mount it brings the selected tab into view by moving the row alone. Name it with `aria-label` or
 * `aria-labelledby`.
 */
export function TabList<T extends object = object>({
  className,
  ref,
  ...props
}: TabListProps<T>): ReactElement {
  const own = useRef<HTMLDivElement>(null);
  const listRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
  const scrolled = useRef(false);
  // React Aria builds its collection after its first render on the client, and its state says when the tabs are
  // there. Read here, it renders the row again as they arrive.
  const state = useContext(TabListStateContext);
  const selectedKey = state?.selectedKey;
  const size = state?.collection.size;
  // Once, after the first paint that holds the selected tab: the server's row starts at its first tab, and the
  // selected one arrives here. The row moves, never the page, which scrollIntoView would move too.
  useEffect(() => {
    if (scrolled.current) return;
    const list = own.current;
    const tab = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!list || !tab) return;
    scrolled.current = true;
    const room = list.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(list).paddingInlineStart) || 0;
    if (box.right > room.right - pad) list.scrollBy({ left: box.right - room.right + pad });
    else if (box.left < room.left + pad) list.scrollBy({ left: box.left - room.left - pad });
  }, [selectedKey, size]);
  return <RACTabList {...props} ref={listRef} className={cx('tab-list', className)} />;
}
