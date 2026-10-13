'use client';

import { useId, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cx } from '../utils/cx';

export interface SidebarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The group's label, drawn as an overline with a dot, and the list's accessible name. */
  label: ReactNode;
  /** Whether the group holds the current page: lights the dot and turns the label ink. */
  isCurrent?: boolean;
  /** SidebarItem elements. */
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A labelled list of SidebarItems. The label is a paragraph, not a heading: it names the list, and a heading in
 * every group would crowd the page's outline. The group is static; `isCurrent` is the app's to set, since the
 * library does not look inside its children. Its id comes from `useId`, so the drawer copy's has its own.
 */
export function SidebarGroup({
  label,
  isCurrent = false,
  children,
  className,
  ref,
  ...props
}: SidebarGroupProps): ReactElement {
  const labelId = useId();
  return (
    <div
      {...props}
      ref={ref}
      className={cx('sidebar-group', className)}
      data-current={isCurrent ? '' : undefined}
    >
      <p className="sidebar-group-label" id={labelId}>
        <span className="sidebar-group-text">{label}</span>
      </p>
      <ul className="sidebar-list" aria-labelledby={labelId}>
        {children}
      </ul>
    </div>
  );
}
