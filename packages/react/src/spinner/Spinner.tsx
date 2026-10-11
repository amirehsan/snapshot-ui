'use client';

import type { ReactElement, Ref } from 'react';
import { ProgressBar, type ProgressBarProps, composeRenderProps } from 'react-aria-components';
import { cx } from '../utils/cx';

export type SpinnerSize = 'inline' | 'md' | 'lg';

export interface SpinnerProps extends Omit<
  ProgressBarProps,
  'isIndeterminate' | 'value' | 'minValue' | 'maxValue' | 'valueLabel' | 'formatOptions' | 'children'
> {
  /**
   * `inline` follows the surrounding font size; `md` is 24px and `lg` is 40px.
   * @default 'inline'
   */
  size?: SpinnerSize;
  ref?: Ref<HTMLDivElement>;
}

/** An indeterminate loading indicator, announced as a progress bar. */
export function Spinner({
  size = 'inline',
  className,
  'aria-label': ariaLabel = 'Loading',
  ...props
}: SpinnerProps): ReactElement {
  return (
    <ProgressBar
      {...props}
      aria-label={ariaLabel}
      isIndeterminate
      className={composeRenderProps(className, (userClassName) =>
        cx('spinner', size !== 'inline' && `spinner-${size}`, userClassName),
      )}
    >
      <svg className="spinner-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="spinner-track" cx="12" cy="12" r="9" strokeWidth="3" />
        <circle className="spinner-arc" cx="12" cy="12" r="9" strokeWidth="3" strokeDasharray="14 57" />
      </svg>
    </ProgressBar>
  );
}
