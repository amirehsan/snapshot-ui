'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  CheckboxButton,
  CheckboxField,
  type CheckboxFieldProps as RACCheckboxFieldProps,
  type CheckboxFieldRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface CheckboxProps extends Omit<RACCheckboxFieldProps, 'children' | 'className'> {
  /**
   * The label, shown beside the box. The whole row is the label, so a press
   * anywhere on it toggles the box. Without one, give the checkbox an `aria-label`.
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
  /** A class name, or a function of the checkbox's state, merged after the library's own class. */
  className?:
    string | ((values: CheckboxFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the checkbox's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * A single checkbox: the box, its label, an optional hint and an error line in
 * one element. Built on React Aria's CheckboxField and CheckboxButton. On its
 * own it submits `value` (or "on") under `name` while it is checked; in a
 * `CheckboxGroup` it takes part in the group's value.
 */
export function Checkbox({
  children,
  description,
  errorMessage,
  className,
  ...props
}: CheckboxProps): ReactElement {
  return (
    <CheckboxField
      {...props}
      className={composeRenderProps(className, (userClassName) => cx('checkbox-field', userClassName))}
    >
      <CheckboxButton className="checkbox">
        <span className="checkbox-box" aria-hidden="true" />
        {present(children) ? <span className="checkbox-text">{children}</span> : null}
      </CheckboxButton>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </CheckboxField>
  );
}
