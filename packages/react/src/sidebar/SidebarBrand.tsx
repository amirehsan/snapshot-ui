'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import { Link as RACLink, type LinkProps as RACLinkProps } from 'react-aria-components';
import { useAppShell } from '../app-shell/AppShell';
import { Tooltip, TooltipTrigger } from '../tooltip/Tooltip';
import { cx } from '../utils/cx';
import { useSidebar } from './Sidebar';

export interface SidebarBrandProps extends Omit<RACLinkProps, 'children' | 'className'> {
  href: NonNullable<RACLinkProps['href']>;
  /** The mark, shown in both states. A 24px box, hidden from assistive technology. */
  mark: ReactNode;
  /** The name, shown beside the mark and hidden from view when collapsed. It is the accessible name. */
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * The brand row: the app's mark and its name, as a link home. Collapsed, the mark stays and the name shows as a
 * tooltip; it stays the link's name either way. In the drawer a press closes the drawer, as an item's does.
 */
export function SidebarBrand({
  mark,
  children,
  className,
  onPress,
  ref,
  ...props
}: SidebarBrandProps): ReactElement {
  const { isCollapsed, inDrawer } = useSidebar();
  const { closeDrawer } = useAppShell();
  return (
    <TooltipTrigger isDisabled={!isCollapsed}>
      <RACLink
        {...props}
        ref={ref}
        onPress={(event) => {
          onPress?.(event);
          if (inDrawer) closeDrawer();
        }}
        className={cx('sidebar-brand', className)}
      >
        <span className="sidebar-brand-mark" aria-hidden="true">
          {mark}
        </span>
        <span className="sidebar-brand-name">{children}</span>
      </RACLink>
      <Tooltip placement="end">{children}</Tooltip>
    </TooltipTrigger>
  );
}
