'use client';

import { Check } from 'lucide-react';
import { useId, type ReactElement, type ReactNode, type Ref } from 'react';
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
  /**
   * A preformatted value at the end, such as an amount, before the key hint. Shown as given. It describes the
   * item and is not part of its name.
   */
  end?: ReactNode;
  /** A key hint at the end, such as "Q" or "Mod ,", drawn as keys. Separate keys with spaces. "Mod" shows as Cmd or Ctrl once mounted. */
  shortcut?: string;
  /** The ids of elements that also describe the item, read after its end value. */
  'aria-describedby'?: string;
  /** `danger` draws the label and icon in the error color, for an item that loses something. @default 'default' */
  variant?: 'default' | 'danger';
  className?: string | ((values: MenuItemRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

/**
 * One row of a menu: an icon, a label that names it, a description under it, a value and a key hint at its
 * end, and, in a selectable menu or section, a check whose room every row keeps. With `href` it is a link that
 * navigates through React Aria's `RouterProvider`; its inherited `render` prop can draw a router's own link.
 *
 * The label names the item, and the end value, the description and the keys describe it, through their
 * ids: a screen reader hears "Settings", then "Account and billing, Command comma".
 */
export function MenuItem<T extends object = object>({
  children,
  icon,
  description,
  end,
  shortcut,
  variant = 'default',
  className,
  textValue,
  'aria-describedby': describedBy,
  ...props
}: MenuItemProps<T>): ReactElement {
  // React Aria describes the item by its description and its key; the end value joins them, ahead of both.
  const endId = useId();
  const hasEnd = present(end);
  return (
    <RACMenuItem
      {...props}
      aria-describedby={hasEnd ? cx(endId, describedBy) : describedBy}
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
          {hasEnd ? (
            <span id={endId} className="menu-item-end">
              {end}
            </span>
          ) : null}
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
