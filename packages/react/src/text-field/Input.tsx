'use client';

import type { ReactElement, Ref } from 'react';
import {
  Input as RACInput,
  type InputProps as RACInputProps,
  composeRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';

export interface InputProps extends RACInputProps {
  ref?: Ref<HTMLInputElement>;
}

/**
 * The text control: a pill on the raised fill, `--size-field` tall (48px, 36px in compact). Inside a React Aria field
 * it takes the field's label, hint and error. On its own, give it an
 * `aria-label`. `TextField` renders one; use this directly for a custom layout.
 */
export function Input({ className, ...props }: InputProps): ReactElement {
  return (
    <RACInput
      {...props}
      className={composeRenderProps(className, (userClassName) => cx('input', userClassName))}
    />
  );
}
