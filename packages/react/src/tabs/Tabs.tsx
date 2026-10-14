'use client';

import type { ReactElement, Ref } from 'react';
import { Tabs as RACTabs, type TabsProps as RACTabsProps } from 'react-aria-components';
import { cx } from '../utils/cx';

export interface TabsProps extends Omit<RACTabsProps, 'className' | 'orientation'> {
  /** A class name merged after the library's own class. */
  className?: string;
  /** A ref to the root element, which holds the tab list and the panels. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * Views of one page as a row of pills, the selected one the ink pill. Holds a `TabList` of `Tab`s and a
 * `TabPanel` per view. Tabs that switch a panel select on focus, React Aria's automatic activation. Tabs that
 * are links take `href` on each `Tab`; give `selectedKey` from the URL, no `onSelectionChange`, and
 * `keyboardActivation="manual"`, so the arrows only move focus and Enter, Space or a press follows the link through
 * `RouterProvider`. Horizontal only. Built on React Aria's Tabs.
 */
export function Tabs({ className, ...props }: TabsProps): ReactElement {
  return <RACTabs {...props} className={cx('tabs', className)} />;
}
