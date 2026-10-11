import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { cx } from '../utils/cx';

/** The numbers a counter's text is made from. */
export interface FieldCounterState {
  /** How much has been written. */
  count: number;
  /** About how much is wanted. */
  budget: number;
  /** Whether the count is past the budget. */
  over: boolean;
}

export interface FieldCounterProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** How much has been written: usually the length of the value. */
  count: number;
  /**
   * About how much is wanted. A budget, not a limit: nothing stops a longer
   * value. A budget that is not a positive number shows nothing.
   */
  budget: number;
  /**
   * The share of the budget at which the count first appears, from 0 to 1.
   * Nothing shows while the count is 0, whatever this is.
   * @default 0.7
   */
  showFrom?: number;
  /**
   * Replaces the text. Return an empty string to show nothing.
   * @default ({ count, budget }) => `${count} of about ${budget}`
   */
  label?: (state: FieldCounterState) => string;
  ref?: Ref<HTMLSpanElement>;
}

const defaultLabel = ({ count, budget }: FieldCounterState): string =>
  `${String(count)} of about ${String(budget)}`;

/**
 * A length count against a budget. It advises and never blocks: it sets no
 * maxlength and no validity. It is a polite status region that stays in the
 * page, empty, until the count is worth showing.
 */
export function FieldCounter({
  count,
  budget,
  showFrom = 0.7,
  label = defaultLabel,
  className,
  ...props
}: FieldCounterProps): ReactElement {
  const over = count > budget;
  const shown = budget > 0 && count > 0 && count >= Math.round(budget * showFrom);
  return (
    <span
      role="status"
      {...props}
      className={cx('field-counter', className)}
      data-over={shown && over ? '' : undefined}
    >
      {shown ? label({ count, budget, over }) : null}
    </span>
  );
}
