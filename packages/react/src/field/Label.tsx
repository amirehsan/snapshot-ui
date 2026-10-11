'use client';

import type { ReactElement, Ref } from 'react';
import { Label as RACLabel, type LabelProps as RACLabelProps } from 'react-aria-components';
import { cx } from '../utils/cx';

export interface LabelProps extends RACLabelProps {
  ref?: Ref<HTMLLabelElement>;
}

/**
 * The name of a field: 14px, bold, in ink. Inside a React Aria field it names
 * the control. On its own, tie it to an input with `htmlFor`, or set
 * `elementType="span"` for a caption that names a group.
 */
export function Label({ className, ...props }: LabelProps): ReactElement {
  return <RACLabel {...props} className={cx('field-label', className)} />;
}
