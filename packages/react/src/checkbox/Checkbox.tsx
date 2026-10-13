'use client';

import { useContext, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  CheckboxButton,
  CheckboxField,
  CheckboxGroupStateContext,
  FieldErrorContext,
  type CheckboxFieldProps as RACCheckboxFieldProps,
  type CheckboxFieldRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldChanged } from '../field/FieldChanged';
import { FieldError } from '../field/FieldError';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface CheckboxBaseProps extends Omit<RACCheckboxFieldProps, 'children' | 'className'> {
  /**
   * The label, shown beside the box. The whole row is the label, so a press
   * anywhere on it toggles the box. Required unless the checkbox has an `aria-label` or an
   * `aria-labelledby`.
   */
  children?: ReactNode;
  /** A hint under the label. It becomes the checkbox's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the checkbox is invalid. A function receives
   * the validation result. Without it the checkbox shows its own validation messages.
   * Inside a `CheckboxGroup` it is not shown: a group has one error line, its own.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the choice differs from the saved one. Shows the clay Changed chip
   * beside the label and has a screen reader read the chip with the checkbox.
   * The box keeps its edge: the chip is the whole cue. An invalid checkbox shows
   * its error instead, and one without a visible label draws no chip. Inside a
   * `CheckboxGroup` it is ignored, because the group's own chip covers it: set
   * `isChanged` on the group.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /** A class name, or a function of the checkbox's state, merged after the library's own class. */
  className?:
    string | ((values: CheckboxFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the checkbox's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a checkbox. A name is required: its `children`, an `aria-label` or an `aria-labelledby`.
 */
export type CheckboxProps = CheckboxBaseProps & AccessibleName<'children'>;

/**
 * A single checkbox: the box, its label, an optional hint, an error line and
 * the Changed chip in one element. Built on React Aria's CheckboxField and
 * CheckboxButton. On its own it submits `value` (or "on") under `name` while it
 * is checked; in a `CheckboxGroup` it takes part in the group's value.
 */
export function Checkbox({
  children,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  className,
  ...props
}: CheckboxProps): ReactElement {
  // A group's own chip covers its checkboxes, so one inside a group has none.
  const isInGroup = useContext(CheckboxGroupStateContext) !== null;
  // The chip lives in a label row beside the row, so a checkbox with no visible label has no chip to read.
  const hasChip = present(children) && !isInGroup;
  const { chipId, describedBy } = useChangedDescription({
    isChanged: isChanged && hasChip,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  const row = (
    <CheckboxButton className="checkbox">
      <span className="checkbox-box" aria-hidden="true" />
      {present(children) ? <span className="checkbox-text">{children}</span> : null}
    </CheckboxButton>
  );
  return (
    <CheckboxField
      {...props}
      aria-describedby={describedBy}
      data-changed={isChanged && !isInGroup ? '' : undefined}
      className={composeRenderProps(className, (userClassName) => cx('checkbox-field', userClassName))}
    >
      {hasChip ? (
        <div className="field-head">
          {row}
          <CheckboxChanged id={chipId}>{changedLabel}</CheckboxChanged>
        </div>
      ) : (
        row
      )}
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </CheckboxField>
  );
}

/**
 * The Changed chip of a checkbox on its own. Like `FieldHead`'s, it leaves the page while React Aria finds
 * the checkbox invalid, by any cause: a chip that is only hidden is still read when `aria-describedby`
 * names it, and validation that React Aria runs is not something the checkbox's own props can see.
 */
function CheckboxChanged({ id, children }: { id: string; children?: string }): ReactElement | null {
  const isInvalid = useContext(FieldErrorContext)?.isInvalid === true;
  return isInvalid ? null : <FieldChanged id={id}>{children}</FieldChanged>;
}
