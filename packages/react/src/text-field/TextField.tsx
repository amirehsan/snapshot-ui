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
import { FieldCounter } from '../field/FieldCounter';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { useValueLength } from '../field/useValueLength';
import { cx } from '../utils/cx';
import { Input } from './Input';

export interface TextFieldProps extends Omit<RACTextFieldProps, 'children' | 'className'> {
  /** The field's name, shown above the control. Without one, give the field an `aria-label`. */
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
   * from 70% of the budget on. It advises and never blocks typing.
   */
  budget?: number;
  /** A class name, or a function of the field's state, merged after the library's own class. */
  className?: string | ((values: TextFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

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
    isChanged: isChanged && label != null,
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
      {label != null ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <Input ref={inputRef} placeholder={placeholder} />
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      {budget === undefined ? null : <FieldCounter count={length} budget={budget} />}
    </RACTextField>
  );
}
