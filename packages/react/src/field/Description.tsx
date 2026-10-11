'use client';

import type { ReactElement, Ref } from 'react';
import { Text, type TextProps } from 'react-aria-components';
import { cx } from '../utils/cx';

export interface DescriptionProps extends Omit<TextProps, 'slot'> {
  ref?: Ref<HTMLElement>;
}

/**
 * The hint under a control: 14px, in slate. Inside a React Aria field it
 * becomes the control's accessible description. It also works on its own, for
 * the secondary line of a row.
 */
export function Description({ className, ...props }: DescriptionProps): ReactElement {
  return <Text {...props} slot="description" className={cx('field-description', className)} />;
}
