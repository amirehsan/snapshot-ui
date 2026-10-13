'use client';

import type { ReactElement, Ref } from 'react';
import { Separator } from 'react-aria-components';
import { cx } from '../utils/cx';

export interface MenuSeparatorProps {
  className?: string;
  ref?: Ref<HTMLElement>;
}

/** A 1px rule between groups of menu items, read as a separator. */
export function MenuSeparator({ className, ref }: MenuSeparatorProps): ReactElement {
  return <Separator ref={ref} className={cx('menu-separator', className)} />;
}
