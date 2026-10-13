'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  Collection,
  Header,
  MenuSection as RACMenuSection,
  type MenuSectionProps as RACMenuSectionProps,
  type SelectionMode,
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface MenuSectionProps<T extends object = object> extends Omit<
  RACMenuSectionProps<T>,
  'className' | 'style'
> {
  /** The heading above the section's items, in the overline style. */
  title?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * Whether a choice in a section closes the menu, by the section's own selection mode: single and none
 * close, multiple stays open, and a section with no mode of its own selects with the menu, so it takes the
 * menu's rule.
 */
const closesOnSelect = (selectionMode: SelectionMode | undefined): boolean | undefined =>
  selectionMode === undefined ? undefined : selectionMode !== 'multiple';

/**
 * A group of menu items under an overline heading, which names the group. It can select on its own, with
 * `selectionMode`, `selectedKeys` and `onSelectionChange`, apart from the rest of the menu: a choice in a
 * single section closes the menu, and one in a multiple section leaves it open.
 */
export function MenuSection<T extends object = object>({
  title,
  className,
  children,
  items,
  dependencies,
  shouldCloseOnSelect,
  ...props
}: MenuSectionProps<T>): ReactElement {
  return (
    <RACMenuSection
      {...props}
      shouldCloseOnSelect={shouldCloseOnSelect ?? closesOnSelect(props.selectionMode)}
      className={cx('menu-section', className)}
    >
      {present(title) ? <Header className="menu-heading">{title}</Header> : null}
      <Collection items={items} dependencies={dependencies}>
        {children}
      </Collection>
    </RACMenuSection>
  );
}
