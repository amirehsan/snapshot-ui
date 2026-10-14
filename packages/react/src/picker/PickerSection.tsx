'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  Collection,
  Header,
  ListBoxSection as RACListBoxSection,
  type ListBoxSectionProps as RACListBoxSectionProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface PickerSectionProps<T extends object = object> extends Omit<
  RACListBoxSectionProps<T>,
  'className' | 'style'
> {
  /** The heading above the section's options, in the overline style. */
  title?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * A group of options under an overline heading, which names the group: the Menu's section, in a picker's list.
 * A filter hides a section none of whose options it keeps. Select, ComboBox and MultiSelect share it.
 */
export function PickerSection<T extends object = object>({
  title,
  className,
  children,
  items,
  dependencies,
  ...props
}: PickerSectionProps<T>): ReactElement {
  return (
    <RACListBoxSection {...props} className={cx('menu-section', className)}>
      {present(title) ? <Header className="menu-heading">{title}</Header> : null}
      <Collection items={items} dependencies={dependencies}>
        {children}
      </Collection>
    </RACListBoxSection>
  );
}
