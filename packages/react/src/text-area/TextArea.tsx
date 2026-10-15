'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  TextArea as RACTextArea,
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

export interface TextAreaBaseProps extends Omit<
  RACTextFieldProps,
  'children' | 'className' | 'type' | 'pattern'
> {
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
   * How many lines tall the control is. It is never shorter than 6rem (three
   * lines and their padding), so fewer rows look the same. The reader can drag
   * the corner to resize it.
   * @default 3
   */
  rows?: number;
  /**
   * Whether the value differs from the saved one. Shows the clay Changed chip
   * and the light signal orange border, and a screen reader reads the chip with
   * the field. An invalid field shows its error instead.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * About how long the value should be. Shows a length count from 70% of the
   * budget. It never blocks typing, so the count can pass it. The length is in
   * UTF-16 code units, as `maxLength` measures it. Set `budget` at or below
   * `maxLength`, which the count does not read.
   */
  budget?: number;
  /**
   * Options for the `budget` count. `label` returns its text from the count,
   * the budget and whether the count is past it. `showFrom` is the share of the
   * budget, from 0 to 1, where the count appears (0.7 by default).
   */
  counter?: Pick<FieldCounterProps, 'label' | 'showFrom'>;
  /** A class name, or a function of the field's state, merged after the library's own class. */
  className?: string | ((values: TextFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the textarea element. */
  textAreaRef?: Ref<HTMLTextAreaElement>;
}

/**
 * The props of a text area. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type TextAreaProps = TextAreaBaseProps & AccessibleName<'label'>;

/**
 * A multi-line text field: label, control, hint, error and an optional length
 * count in one element. The same field as TextField, with a box that is as tall
 * as its rows. Built on React Aria's TextField and TextArea.
 */
export function TextArea({
  label,
  description,
  errorMessage,
  placeholder,
  rows = 3,
  isChanged = false,
  changedLabel,
  budget,
  counter,
  className,
  textAreaRef,
  defaultValue,
  onChange,
  ...props
}: TextAreaProps): ReactElement {
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
      <RACTextArea ref={textAreaRef} rows={rows} placeholder={placeholder} className="input textarea" />
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      {budget === undefined ? null : <FieldCounter {...counter} count={length} budget={budget} />}
    </RACTextField>
  );
}
