'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  Link as RACLink,
  VisuallyHidden,
  composeRenderProps,
  type LinkProps as RACLinkProps,
  type LinkRenderProps,
} from 'react-aria-components';
import { useAppShell } from '../app-shell/AppShell';
import { Tooltip, TooltipTrigger } from '../tooltip/Tooltip';
import { cx } from '../utils/cx';
import { useSidebar } from './Sidebar';

/** A count and the words that make it a name: "12" and "to review" read "Transactions, 12 to review". */
type ItemCount =
  { count?: undefined; countLabel?: undefined } | { count: number | string; countLabel: string };

export type SidebarItemProps = Omit<RACLinkProps, 'children' | 'className' | 'aria-current' | 'href'> &
  ItemCount & {
    href: NonNullable<RACLinkProps['href']>;
    /** The icon, 20px, hidden from assistive technology. */
    icon: ReactNode;
    /** The label. It is the accessible name, and it wraps when long. */
    children: ReactNode;
    /** Whether this is the page shown: sets `aria-current="page"` and draws the ink pill. */
    isCurrent?: boolean;
    className?: string | ((values: LinkRenderProps & { defaultClassName: string | undefined }) => string);
    ref?: Ref<HTMLAnchorElement>;
  };

/**
 * One page in a SidebarGroup: an icon, a label that wraps and an optional count, as a link. Built on React
 * Aria's Link, so `href` works with scripts off and a `RouterProvider` routes the press. `aria-current="page"`
 * is set only when `isCurrent` is true. Collapsed, the label shows as a tooltip; in the drawer, a press closes
 * the drawer, the page already open included, and the current item takes focus as the drawer opens.
 */
export function SidebarItem({
  href,
  icon,
  children,
  isCurrent = false,
  count,
  countLabel,
  className,
  onPress,
  ref,
  ...props
}: SidebarItemProps): ReactElement {
  const { isCollapsed, inDrawer } = useSidebar();
  const { closeDrawer } = useAppShell();
  return (
    <li>
      <TooltipTrigger isDisabled={!isCollapsed}>
        <RACLink
          {...props}
          ref={ref}
          href={href}
          // React Aria treats any aria-current as current, "false" included, so it is set only when current.
          aria-current={isCurrent ? 'page' : undefined}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- initial focus inside a modal is the dialog pattern: the drawer opens on the page shown
          autoFocus={inDrawer && isCurrent}
          onPress={(event) => {
            onPress?.(event);
            if (inDrawer) closeDrawer();
          }}
          className={composeRenderProps(className, (userClassName) => cx('sidebar-item', userClassName))}
        >
          <span className="sidebar-item-icon" aria-hidden="true">
            {icon}
          </span>
          {/* A name joins the parts of a link as the page lays them out: a browser puts a space at every flex
              item's edge and at every hidden box's, and jsdom trims each element's text. So the comma ends the
              label, inline and drawn at no size, and plain spaces sit between the parts: the name is
              "Transactions, 12 to review" everywhere, while the row shows "12" and no comma or words. */}
          <span className="sidebar-item-label">
            {children}
            {count !== undefined ? <span className="sidebar-comma">,</span> : null}
          </span>
          {count !== undefined ? (
            <>
              {' '}
              <span className="sidebar-item-count">
                <span className="sidebar-item-count-number">{count}</span>{' '}
                <VisuallyHidden elementType="span">{countLabel}</VisuallyHidden>
              </span>
            </>
          ) : null}
        </RACLink>
        <Tooltip placement="end">
          {children}
          {count !== undefined ? (
            <span className="sidebar-tooltip-count">
              {count} {countLabel}
            </span>
          ) : null}
        </Tooltip>
      </TooltipTrigger>
    </li>
  );
}
