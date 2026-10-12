'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  RadioButton,
  RadioField,
  type RadioButtonRenderProps,
  type RadioFieldProps,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { cx } from '../utils/cx';

export interface RadioProps extends Omit<RadioFieldProps, 'children' | 'className' | 'style'> {
  /** The option's label. Keep it to inline text, which wraps inside the row when it is long. */
  children?: ReactNode;
  /** A hint under the option's row. It becomes the radio's accessible description. */
  description?: ReactNode;
  /** A class name, or a function of the row's state, merged after the library's own class. */
  className?:
    string | ((values: RadioButtonRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the option's row, the `label` element. */
  ref?: Ref<HTMLLabelElement>;
  /** A ref to the native radio input. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * One option of a `RadioGroup`: a full-pill row holding a dot and the label,
 * and an optional hint under it. The row fills with ink while it is chosen.
 * Built on React Aria's RadioField and RadioButton.
 */
export function Radio({ children, description, className, ref, ...props }: RadioProps): ReactElement {
  return (
    <RadioField {...props}>
      <RadioButton
        ref={ref}
        className={composeRenderProps(className, (userClassName) => cx('radio', userClassName))}
      >
        <span className="radio-indicator" aria-hidden="true" />
        {children}
      </RadioButton>
      {description != null ? <Description>{description}</Description> : null}
    </RadioField>
  );
}
