'use client';

import { useCallback, useRef, useState, type ReactElement, type Ref } from 'react';
import {
  Menu as RACMenu,
  PopoverContext,
  composeRenderProps,
  useSlottedContext,
  type MenuProps as RACMenuProps,
  type Placement,
} from 'react-aria-components';
import { Popover } from '../popover/Popover';
import { cx } from '../utils/cx';

export { MenuTrigger, type MenuTriggerProps } from 'react-aria-components';

/**
 * React Aria's submenu trigger: a `MenuItem` and then a `Menu`, the submenu. The item draws a chevron after its end
 * value and opens the submenu on a press, on hover, and on Arrow Right (Arrow Left under a right-to-left locale,
 * which `I18nProvider` sets); Arrow Left or Escape closes that level alone and gives focus back to the item, and a
 * choice in it closes every level and gives focus back to the root trigger.
 */
export { SubmenuTrigger, type SubmenuTriggerProps } from 'react-aria-components';

/**
 * React Aria's key, a string or a number, as a menu item's `id`, a selection and a palette item's `id` take
 * it, so an app can type one without importing React Aria.
 */
export type { Key } from 'react-aria-components';

export interface MenuProps<T extends object> extends Omit<RACMenuProps<T>, 'className' | 'style'> {
  /** Where the popover opens. @default 'bottom start', and 'end top' for a submenu */
  placement?: Placement;
  /** Goes on the menu element: a string, or a function of the menu's state (`isEmpty`, `defaultClassName`). */
  className?: RACMenuProps<T>['className'];
  /** Goes on the popover around it. */
  popoverClassName?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Internal: React Aria's Menu wearing the `menu` class with the library's close-on-select default.
 * CommandPalette renders it inline. Not exported from the package index.
 */
export interface MenuListProps<T extends object> extends Omit<RACMenuProps<T>, 'className' | 'style'> {
  className?: RACMenuProps<T>['className'];
  ref?: Ref<HTMLDivElement>;
}

/**
 * React Aria's Menu wearing the `menu` class, with the library's two defaults: a choice closes the menu
 * unless the selection is multiple, which covers Space from the keyboard as well as a press, and the arrows
 * stop at the ends instead of wrapping. The caller's `shouldCloseOnSelect` and `shouldFocusWrap` win, and an
 * item's own `shouldCloseOnSelect` wins over both.
 *
 * Internal: not exported from the package. Menu puts it in a popover; CommandPalette renders it inline.
 */
export function MenuList<T extends object>({
  className,
  shouldCloseOnSelect,
  shouldFocusWrap = false,
  ...props
}: MenuListProps<T>): ReactElement {
  return (
    <RACMenu
      {...props}
      shouldFocusWrap={shouldFocusWrap}
      shouldCloseOnSelect={shouldCloseOnSelect ?? props.selectionMode !== 'multiple'}
      className={composeRenderProps(className, (userClassName) => cx('menu', userClassName))}
    />
  );
}

/**
 * A menu in its popover. Compose `MenuTrigger`, a button and a `Menu`. A true `role="menu"`, named by its
 * trigger: the arrows move between the items, Home and End jump, letters find an item, Enter and Space run
 * or choose one, and Escape closes it and gives focus back to the trigger. A choice in single selection
 * closes it and one in multiple selection leaves it open. Built on React Aria's Menu.
 */
export function Menu<T extends object>({
  placement,
  popoverClassName,
  ...props
}: MenuProps<T>): ReactElement {
  // The trigger React Aria hands the popover: a MenuTrigger's places it under the button, at its start, and a
  // SubmenuTrigger's beside the row, at its end, by the popover's own fallback to the trigger's placement.
  const isSubmenu = useSlottedContext(PopoverContext)?.trigger === 'SubmenuTrigger';
  const [isCramped, cramp] = useCramped(isSubmenu);
  return (
    <Popover
      ref={cramp}
      className={cx('menu-popover', popoverClassName)}
      // A submenu with room on neither side opens under its row, over the rows below it, as on a narrow phone.
      placement={isCramped ? 'bottom start' : placement}
      offset={isCramped ? 0 : undefined}
      // Up by the list's 8px padding and the popover's 1px edge, so the submenu's first row is level with its own.
      crossOffset={isSubmenu && !isCramped ? SUBMENU_CROSS_OFFSET : undefined}
    >
      <MenuList {...props} />
    </Popover>
  );
}

/** How far a submenu moves up along its row: the list's padding, `--spacing-part`, and the popover's edge. */
const SUBMENU_CROSS_OFFSET = -9;

/**
 * Whether a submenu beside its row has room on neither side: React Aria flips it to the other side when that has
 * more room, and leaves it past the viewport's edge when neither has enough. Read in the frame after the submenu
 * is placed, from its own box, so nothing is measured before it opens or on the server.
 */
function useCramped(isSubmenu: boolean): [boolean, (popover: HTMLElement | null) => void] {
  const [isCramped, setCramped] = useState(false);
  const frame = useRef(0);
  const measure = useCallback(
    (popover: HTMLElement | null) => {
      cancelAnimationFrame(frame.current);
      if (popover === null || !isSubmenu) return;
      frame.current = requestAnimationFrame(() => {
        const start = popover.offsetLeft - window.scrollX;
        if (start < 0 || start + popover.offsetWidth > document.documentElement.clientWidth) setCramped(true);
      });
    },
    [isSubmenu],
  );
  return [isCramped, measure];
}
