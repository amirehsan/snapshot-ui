import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cx } from '../utils/cx';

export type PanelRowLayout = 'halves' | 'third-two-thirds' | 'two-thirds-third';

export interface PanelRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Which pair. A full card is a Card outside any row. */
  layout: PanelRowLayout;
  /** Exactly two cards: widths only ever pair. */
  children: readonly [ReactNode, ReactNode];
  ref?: Ref<HTMLDivElement>;
}

/**
 * Two cards that pair from 66rem of the row's own width, two halves or a third beside two thirds, and stack in
 * source order under it, each keeping its own height. Its intrinsic inline size is 0, so a holder sized to its
 * content gives it a width. Static: it renders in a server component with no client code.
 */
export function PanelRow({ layout, children, className, ref, ...props }: PanelRowProps): ReactElement {
  const [first, second] = children;
  return (
    <div {...props} ref={ref} className={cx('panel-row', className)} data-layout={layout}>
      <div className="panel-row-grid">
        <div className="panel-row-cell">{first}</div>
        <div className="panel-row-cell">{second}</div>
      </div>
    </div>
  );
}
