'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioGroupRenderProps,
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

export interface RadioGroupBaseProps extends Omit<RACRadioGroupProps, 'children' | 'className'> {
  /**
   * The group's name, shown above the options. Required unless the group has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the options. It becomes the group's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the group is invalid. A function receives
   * the validation result. Without it the group shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the choice differs from the saved one. Shows the clay Changed chip
   * in the label row, which is the whole cue (the options draw no edge of their
   * own), and has a screen reader read the chip with the group. An invalid
   * group shows its error instead. A group with no visible `label` has no label
   * row to hold the chip, so it shows nothing: it still sets `data-changed`.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /** The options: `Radio` elements. */
  children?: ReactNode;
  /** A class name, or a function of the group's state, merged after the library's own classes. */
  className?: string | ((values: RadioGroupRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the group's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of a radio group. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type RadioGroupProps = RadioGroupBaseProps & AccessibleName<'label'>;

/**
 * A group of radios: label, options, hint and error in one element. The
 * options stack as full-width pills, or sit in a row with `orientation`. Built
 * on React Aria's RadioGroup, which owns the arrow keys, the single tab stop
 * and the form value.
 */
export function RadioGroup({
  label,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  children,
  className,
  ...props
}: RadioGroupProps): ReactElement {
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled group has one to read.
    isChanged: isChanged && present(label),
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACRadioGroup
      {...props}
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      className={composeRenderProps(className, (userClassName) => cx('field', 'radio-group', userClassName))}
    >
      {present(label) ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <div className="radio-items">{children}</div>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </RACRadioGroup>
  );
}
