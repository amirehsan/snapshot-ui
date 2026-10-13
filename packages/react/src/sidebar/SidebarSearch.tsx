'use client';

import { Search } from 'lucide-react';
import type { ReactElement, ReactNode, Ref } from 'react';
import { Button as RACButton, type ButtonProps as RACButtonProps } from 'react-aria-components';
import { Shortcut } from '../overlay/Shortcut';
import { Tooltip, TooltipTrigger } from '../tooltip/Tooltip';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useSidebar } from './Sidebar';

export interface SidebarSearchProps extends Omit<RACButtonProps, 'children' | 'className'> {
  /** The label, such as "Search or jump to". */
  children: ReactNode;
  /** The shortcut as keys separated by spaces, such as "Mod K" or "Ctrl K", drawn as a key chip and shown in the collapsed tooltip. `Mod` becomes the platform's modifier after mount. */
  shortcut?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The search action under the brand: a canvas pill with an icon, the label and the shortcut's key chip. The app
 * opens its palette in `onPress`. The chip is part of the button's text, and so of its name, after a comma that
 * is in the DOM and drawn at no size: "Search or jump to, Mod K". Collapsed, it is the icon alone, and the label
 * and the shortcut show as a tooltip.
 */
export function SidebarSearch({
  children,
  shortcut,
  className,
  ref,
  ...props
}: SidebarSearchProps): ReactElement {
  const { isCollapsed } = useSidebar();
  const hasShortcut = shortcut !== undefined && present(shortcut);
  return (
    <TooltipTrigger isDisabled={!isCollapsed}>
      <RACButton {...props} ref={ref} className={cx('sidebar-search', className)}>
        <span className="sidebar-search-icon" aria-hidden="true">
          <Search />
        </span>
        {/* The comma ends the label at no size and a plain space follows it, as on a counted item, so the name
            is "Search or jump to, Mod K" in a browser and in jsdom alike. */}
        <span className="sidebar-search-label">
          {children}
          {hasShortcut ? <span className="sidebar-comma">,</span> : null}
        </span>
        {hasShortcut ? (
          <>
            {' '}
            <Shortcut keys={shortcut} className="kbd sidebar-search-shortcut" />
          </>
        ) : null}
      </RACButton>
      <Tooltip placement="end" shortcut={hasShortcut ? shortcut : undefined}>
        {children}
      </Tooltip>
    </TooltipTrigger>
  );
}
