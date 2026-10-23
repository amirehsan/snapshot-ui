'use client';

import { ChevronsUpDown } from 'lucide-react';
import { useId, type ReactElement, type ReactNode } from 'react';
import { Button as RACButton, VisuallyHidden, type Placement } from 'react-aria-components';
import { Avatar } from '../avatar';
import { Menu, MenuTrigger, type MenuProps } from '../menu';
import { useSidebarState } from '../sidebar/Sidebar';
import { Tooltip, TooltipTrigger } from '../tooltip';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface AccountMenuProps<T extends object = object> extends Omit<
  MenuProps<T>,
  'placement' | 'aria-label' | 'aria-labelledby' | 'children'
> {
  /** The person's name: on the trigger, and the trigger's name. */
  name: string;
  /** A second line on the trigger, in slate: an email, a workspace. It describes the trigger. */
  detail?: ReactNode;
  /** The avatar's image; initials from `name` without it. */
  avatarSrc?: string;
  /**
   * Avatar only, the name in a Tooltip and the trigger's name. Inside a Sidebar it follows the rail's
   * `isCollapsed` unless given. @default false
   */
  isCompact?: boolean;
  /** Where the menu opens. @default 'top start' in a Sidebar, 'bottom end' elsewhere */
  placement?: Placement;
  /** The menu's name. @default 'Account' */
  menuLabel?: string;
  /** Controlled: whether the menu is open. */
  isOpen?: boolean;
  /** Uncontrolled: whether it opens drawn open. @default false */
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** MenuItem, MenuSection, MenuSeparator and ThemeMenu elements. */
  children: ReactNode;
  /** The trigger's name is the person's and the menu's is `menuLabel`, so neither takes one here. */
  'aria-label'?: never;
  'aria-labelledby'?: never;
}

/**
 * The signed-in person's menu, for a rail's footer or a header: a trigger with their avatar, their name and a
 * detail under it, opening their account's items, upward from a Sidebar and downward elsewhere. The trigger is
 * named by the visible name, never "Account", and described by the detail. In a folded rail, or with
 * `isCompact`, it is the avatar alone with the name as its name and in a Tooltip; it is the same element in both
 * faces, so a rail that folds while the menu is open still has the trigger focus goes back to. `className`,
 * `ref` and a menu's other props go on the menu.
 */
export function AccountMenu<T extends object = object>({
  name,
  detail,
  avatarSrc,
  isCompact,
  placement,
  menuLabel = 'Account',
  isOpen,
  defaultOpen,
  onOpenChange,
  popoverClassName,
  children,
  ...props
}: AccountMenuProps<T>): ReactElement {
  const rail = useSidebarState();
  const compact = isCompact ?? rail?.isCollapsed ?? false;
  const detailId = useId();
  const menuId = useId();
  const hasDetail = !compact && present(detail);
  return (
    <MenuTrigger isOpen={isOpen} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <TooltipTrigger isDisabled={!compact}>
        <RACButton
          className="account-menu-trigger"
          data-compact={compact ? '' : undefined}
          // The name is the person's, from the content: drawn beside the avatar, and compact a visually hidden copy
          // the tip shows, since an aria-label would leave the initials the avatar draws out of the name. The
          // detail, hidden inside, describes it by its id.
          aria-describedby={hasDetail ? detailId : undefined}
        >
          <Avatar name={name} src={avatarSrc} size="sm" isDecorative />
          {compact ? (
            <VisuallyHidden elementType="span">{name}</VisuallyHidden>
          ) : (
            <>
              <span className="account-menu-text">
                <span className="account-menu-name">{name}</span>
                {hasDetail ? (
                  <span id={detailId} className="account-menu-detail" aria-hidden="true">
                    {detail}
                  </span>
                ) : null}
              </span>
              <span className="account-menu-chevron" aria-hidden="true">
                <ChevronsUpDown />
              </span>
            </>
          )}
        </RACButton>
        <Tooltip placement={rail === null ? 'bottom' : 'end'}>{name}</Tooltip>
      </TooltipTrigger>
      <Menu
        {...props}
        // A menu takes its trigger's name from React Aria, here the person's; pointing its labelledby at itself
        // names it by its own aria-label instead.
        id={menuId}
        aria-label={menuLabel}
        aria-labelledby={menuId}
        placement={placement ?? (rail === null ? 'bottom end' : 'top start')}
        popoverClassName={cx('account-menu', popoverClassName)}
      >
        {children}
      </Menu>
    </MenuTrigger>
  );
}
