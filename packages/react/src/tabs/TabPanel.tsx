'use client';

import type { ReactElement, Ref } from 'react';
import { TabPanel as RACTabPanel, type TabPanelProps as RACTabPanelProps } from 'react-aria-components';
import { cx } from '../utils/cx';

export interface TabPanelProps extends Omit<RACTabPanelProps, 'className'> {
  /** A class name merged after the library's own class. */
  className?: string;
  /** A ref to the panel. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The content of one tab, named by its tab. Only the selected panel is mounted, unless `shouldForceMount`
 * keeps the others in the page, inert and hidden.
 */
export function TabPanel({ className, ...props }: TabPanelProps): ReactElement {
  return <RACTabPanel {...props} className={cx('tab-panel', className)} />;
}
