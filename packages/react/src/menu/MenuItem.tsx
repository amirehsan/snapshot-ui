'use client';

import { Check } from 'lucide-react';
import type { ReactElement, ReactNode, Ref } from 'react';
import {
  MenuItem as RACMenuItem,
  Text,
  composeRenderProps,
  type MenuItemProps as RACMenuItemProps,
  type MenuItemRenderProps,
} from 'react-aria-components';
import { Shortcut } from '../overlay/Shortcut';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface MenuItemProps<T extends object = object> extends Omit<
  RACMenuItemProps<T>,
  'className' | 'children' | 'style'
> {
  /** The label. A string is also the item's text value, for typeahead and announcement. */
  children: ReactNode;
  /** A 16px icon at the start, hidden from assistive technology. */
  icon?: ReactNode;
  /** A second line under the label, in slate. It becomes the item's accessible description. */
  description?: ReactNode;
  /** A key hint at the end, such as "Q" or "Mod ,", drawn as a key. Keys are separated by spaces; "Mod" is the platform's modifier after mount. */
  shortcut?: string;
  /** `danger` draws the label and icon in the error color, for an item that loses something. @default 'default' */
  variant?: 'default' | 'danger';
  className?: string | ((values: MenuItemRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

/**
 * One row of a menu: an icon, a label that names it, a description under it, a key hint at its end, and,
 * in a selectable menu or section, a check whose room every row keeps. With `href` it is a link that
 * navigates through React Aria's `RouterProvider`; its inherited `render` prop can draw a router's own link.
 *
 * The label names the item, and the description and the keys describe it, through the ids React Aria gives
 * them: a screen reader hears "Settings", then "Account and billing, Command comma".
 */
export function MenuItem<T extends object = object>({
  children,
  icon,
  description,
  shortcut,
  variant = 'default',
  className,
  textValue,
  ...props
}: MenuItemProps<T>): ReactElement {
  return (
    <RACMenuItem
      {...props}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      className={composeRenderProps(className, (userClassName) =>
        cx('menu-item', variant === 'danger' && 'menu-item-danger', userClassName),
      )}
    >
      {({ selectionMode }) => (
        <>
          {present(icon) ? (
            <span className="menu-item-icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className="menu-item-text">
            <Text slot="label" className="menu-item-label">
              {children}
            </Text>
            {present(description) ? (
              <Text slot="description" className="menu-item-description">
                {description}
              </Text>
            ) : null}
          </span>
          {shortcut !== undefined && present(shortcut) ? (
            <Shortcut keys={shortcut} className="menu-item-shortcut" />
          ) : null}
          {selectionMode === 'none' ? null : (
            <span className="menu-item-check" aria-hidden="true">
              <Check />
            </span>
          )}
        </>
      )}
    </RACMenuItem>
  );
}
