'use client';

import type { ReactElement, Ref } from 'react';
import {
  FieldError as RACFieldError,
  type FieldErrorProps as RACFieldErrorProps,
  composeRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';

export interface FieldErrorProps extends RACFieldErrorProps {
  ref?: Ref<HTMLElement>;
}

/**
 * The error line of a field, in the error color. It renders only while the
 * field is invalid, and shows its children or, without any, the field's own
 * validation messages. It must sit inside a React Aria field.
 */
export function FieldError({ className, ...props }: FieldErrorProps): ReactElement {
  return (
    <RACFieldError
      {...props}
      className={composeRenderProps(className, (userClassName) => cx('field-error', userClassName))}
    />
  );
}
