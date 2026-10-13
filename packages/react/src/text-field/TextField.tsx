'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
  type TextFieldRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldCounter, type FieldCounterProps } from '../field/FieldCounter';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { useValueLength } from '../field/useValueLength';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { Input } from './Input';

export interface TextFieldBaseProps extends Omit<RACTextFieldProps, 'children' | 'className'> {
  /**
   * The field's name, shown above the control. Required unless the field has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the control. It becomes the control's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the field is invalid. A function receives
   * the validation result. Without it the field shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Example text shown while the control is empty. It never replaces the label. */
  placeholder?: string;
  /**
   * Whether the value differs from the saved one. Shows the clay Changed chip
   * in the label row and the light signal orange border, and has a screen
   * reader read the chip with the field. An invalid field shows its error
   * instead.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * About how long the value should be. Shows a count of the value's length
   * from 70% of the budget on. It advises and never blocks typing, so the count
   * can pass the budget. The length is measured as JavaScript and `maxLength`
   * measure it, in UTF-16 code units, so an emoji or an accented letter built
   * from two code points can count as two. `maxLength` is a hard stop that the
   * count does not read, so set `budget` at or below it.
   */
  budget?: number;
  /**
   * Options for the count that `budget` shows. `label` replaces its text, for
   * another language or other words: it receives the count, the budget and
   * whether the count is past it. `showFrom` is the share of the budget the
   * count first appears at, from 0 to 1, and is 0.7 unless given.
   */
  counter?: Pick<FieldCounterProps, 'label' | 'showFrom'>;
  /** A class name, or a function of the field's state, merged after the library's own class. */
  className?: string | ((values: TextFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a text field. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type TextFieldProps = TextFieldBaseProps & AccessibleName<'label'>;

/**
 * A single-line text field: label, control, hint, error and an optional length
 * count in one element. Built on React Aria's TextField.
 */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  isChanged = false,
  changedLabel,
  budget,
  counter,
  className,
  inputRef,
  defaultValue,
  onChange,
  ...props
}: TextFieldProps): ReactElement {
  // The count follows the value whether the caller controls it or not.
  const { length, onChange: trackChange } = useValueLength({ value: props.value, defaultValue, onChange });
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled field has one to read.
    isChanged: isChanged && present(label),
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACTextField
      {...props}
      defaultValue={defaultValue}
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      className={composeRenderProps(className, (userClassName) => cx('field', userClassName))}
      onChange={trackChange}
    >
      {present(label) ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <Input ref={inputRef} placeholder={placeholder} />
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      {budget === undefined ? null : <FieldCounter {...counter} count={length} budget={budget} />}
    </RACTextField>
  );
}
