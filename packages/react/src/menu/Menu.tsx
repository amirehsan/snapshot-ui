'use client';

import type { ReactElement, Ref } from 'react';
import {
  Menu as RACMenu,
  composeRenderProps,
  type MenuProps as RACMenuProps,
  type Placement,
} from 'react-aria-components';
import { Popover } from '../popover/Popover';
import { cx } from '../utils/cx';

export { MenuTrigger, type MenuTriggerProps } from 'react-aria-components';

/**
 * React Aria's key, a string or a number, as a menu item's `id`, a selection and a palette item's `id` take
 * it, so an app can type one without importing React Aria.
 */
export type { Key } from 'react-aria-components';

export interface MenuProps<T extends object> extends Omit<RACMenuProps<T>, 'className' | 'style'> {
  /** Where the popover opens. @default 'bottom start' */
  placement?: Placement;
  /**
   * Goes on the menu element: a string, or a function of the menu's state (`isEmpty`, `defaultClassName`).
   * React Aria does not export the state's type, so it is read from its own `className`.
   */
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
  placement = 'bottom start',
  popoverClassName,
  ...props
}: MenuProps<T>): ReactElement {
  return (
    <Popover className={cx('menu-popover', popoverClassName)} placement={placement}>
      <MenuList {...props} />
    </Popover>
  );
}
