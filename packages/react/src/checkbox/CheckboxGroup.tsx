'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  CheckboxGroup as RACCheckboxGroup,
  type CheckboxGroupProps as RACCheckboxGroupProps,
  type CheckboxGroupRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

export interface CheckboxGroupBaseProps extends Omit<RACCheckboxGroupProps, 'children' | 'className'> {
  /** The checkboxes. Each needs a `value`. */
  children?: ReactNode;
  /**
   * The group's name, shown above the checkboxes. Required unless the group has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the checkboxes. It becomes the group's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the group is invalid. A function receives
   * the validation result. Without it the group shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the selection differs from the saved one. Shows the clay Changed
   * chip in the label row and has a screen reader read it with the group. The
   * boxes keep their edges. An invalid group shows its error instead.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * How the checkboxes are laid out. Arrow keys do not move between checkboxes
   * in either layout: Tab does.
   * @default 'vertical'
   */
  orientation?: CheckboxGroupOrientation;
  /** A class name, or a function of the group's state, merged after the library's own classes. */
  className?:
    string | ((values: CheckboxGroupRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the group's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of a checkbox group. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type CheckboxGroupProps = CheckboxGroupBaseProps & AccessibleName<'label'>;

/**
 * A labelled group of checkboxes that share one value, an array of the checked
 * checkboxes' values. Label, hint and error line are the field's own. Built on
 * React Aria's CheckboxGroup.
 */
export function CheckboxGroup({
  children,
  label,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  orientation = 'vertical',
  className,
  ...props
}: CheckboxGroupProps): ReactElement {
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled group has one to read.
    isChanged: isChanged && present(label),
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACCheckboxGroup
      {...props}
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      // React Aria's group has no orientation of its own: this is only for the layout.
      data-orientation={orientation}
      className={composeRenderProps(className, (userClassName) =>
        cx('field', 'checkbox-group', userClassName),
      )}
    >
      {present(label) ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <div className="checkbox-items">{children}</div>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </RACCheckboxGroup>
  );
}
