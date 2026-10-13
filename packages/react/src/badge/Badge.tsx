import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cx } from '../utils/cx';

/**
 * What a badge means. Error means invalid or failed, success means
 * success, and warning means a state that needs a look soon and is not a
 * failure (Watch, Behind, Needs review, Out of date), so none is ever
 * decoration, in sample content included.
 */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * What the badge means: `info`, `success`, `warning` and `error` repeat in
   * color what the label already says. Error means invalid or failed, success
   * means success and warning means a state that needs a look soon and is not
   * a failure, never decoration, in sample content included. Clay and signal
   * orange are deliberately not tones: they mean unsaved work and consent.
   * @default 'neutral'
   */
  tone?: BadgeTone;
  /** The label or the count. Say what the badge means in words, since the tone is only a repeat. */
  children?: ReactNode;
  /** Added after the library's own classes. */
  className?: string;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * A short label for a state or a count, drawn as an outline with no fill.
 * A static `<span>`, safe in a server component.
 */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps): ReactElement {
  return <span {...props} className={cx('badge', tone !== 'neutral' && `badge-${tone}`, className)} />;
}
