'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  RadioButton,
  RadioField,
  type RadioButtonRenderProps,
  type RadioFieldProps as RACRadioFieldProps,
  composeRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';

export interface SegmentedControlItemProps extends Omit<RACRadioFieldProps, 'children' | 'className'> {
  /** The value the control takes while this option is selected. It is also what a form submits. */
  value: string;
  /** What the option shows: a word or two. */
  children: ReactNode;
  /** A class name, or a function of the option's state, merged after the library's own class. */
  className?:
    string | ((values: RadioButtonRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the option, the label a person presses. */
  ref?: Ref<HTMLLabelElement>;
}

/**
 * One option of a segmented control, a radio drawn as a pill. Built on React
 * Aria's RadioField and RadioButton, so it must sit inside a SegmentedControl.
 */
export function SegmentedControlItem({
  children,
  className,
  ref,
  ...props
}: SegmentedControlItemProps): ReactElement {
  return (
    <RadioField {...props} className="segmented-item">
      <RadioButton
        ref={ref}
        className={composeRenderProps(className, (userClassName) => cx('segmented-option', userClassName))}
      >
        <span className="segmented-label">{children}</span>
      </RadioButton>
    </RadioField>
  );
}
