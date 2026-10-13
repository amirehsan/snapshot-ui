'use client';

import { Menu } from 'lucide-react';
import type { ReactElement, Ref } from 'react';
import type { ButtonProps as RACButtonProps } from 'react-aria-components';
import { useAppShell } from '../app-shell/AppShell';
import { IconButton, type IconButtonVariant } from '../icon-button/IconButton';
import { cx } from '../utils/cx';

export interface SidebarTriggerProps extends Omit<
  RACButtonProps,
  'children' | 'aria-label' | 'aria-labelledby' | 'className'
> {
  /** The accessible name. @default 'Open the menu' */
  label?: string;
  /** The IconButton look. @default 'outline' */
  variant?: IconButtonVariant;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The menu button for the page header: below 1024px it opens the rail as a drawer, and from 1024px up, where the
 * rail is beside the page, CSS hides it. It has no `aria-controls`, because the drawer is not in the page while
 * it is closed.
 */
export function SidebarTrigger({
  label = 'Open the menu',
  variant = 'outline',
  className,
  onPress,
  ...props
}: SidebarTriggerProps): ReactElement {
  const { isDrawerOpen, openDrawer } = useAppShell();
  return (
    <IconButton
      {...props}
      variant={variant}
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={isDrawerOpen}
      onPress={(event) => {
        onPress?.(event);
        openDrawer();
      }}
      className={cx('sidebar-trigger', className)}
    >
      <Menu />
    </IconButton>
  );
}
