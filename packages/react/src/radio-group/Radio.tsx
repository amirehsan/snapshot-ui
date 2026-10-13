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
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface RadioBaseProps extends Omit<RadioFieldProps, 'children' | 'className' | 'style'> {
  /**
   * The option's label. It wraps inside the row when it is long, even a word
   * with no break in it, and inline markup stays in one run of text. Required
   * unless the radio has an `aria-label` or an `aria-labelledby`.
   */
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
 * The props of a radio. A name is required: its `children`, an `aria-label` or an `aria-labelledby`.
 */
export type RadioProps = RadioBaseProps & AccessibleName<'children'>;

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
        {present(children) ? <span className="radio-text">{children}</span> : null}
      </RadioButton>
      {present(description) ? <Description>{description}</Description> : null}
    </RadioField>
  );
}
