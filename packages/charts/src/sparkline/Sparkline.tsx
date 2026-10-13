import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { areaPath, linePath, type PlotPoint } from '../foundations/path';
import { extent, linearScale } from '../foundations/scale';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';

export type SparklineProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> &
  Partial<AriaName> & {
    /** The values, oldest first. */
    data: readonly number[];
    /** Marks the last point with a dot. @default true */
    hasEndPoint?: boolean;
    /** Fills under the line with a 10% ink wash. @default false */
    hasArea?: boolean;
    ref?: Ref<HTMLSpanElement>;
  };

/** A string that names something: given and not only spaces. */
const named = (text: string | undefined): text is string => text !== undefined && text.trim() !== '';

/** A percentage of the plot, for an HTML mark placed over the svg. */
const percent = (value: number): string => `${String(Math.round(value * 1000) / 1000)}%`;

/**
 * A tile's trend as a line: the data's shape over their extent, in a 0 to 100 viewBox stretched to the box,
 * with the end point as HTML over it so it stays round at any width. Hidden from assistive technology unless
 * it is given a name. Static: no hook and no client directive, so a server component renders it with no
 * client JavaScript.
 */
export function Sparkline({
  data,
  hasEndPoint = true,
  hasArea = false,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: SparklineProps): ReactElement {
  // The domain is the data's extent, not from zero: a sparkline shows a shape, not a magnitude. A flat
  // series has a domain of no width, which the scale draws at mid-height.
  const domain = extent(data);
  const y = linearScale(domain ?? [0, 0], [100, 0]);
  const x = (index: number): number => (data.length > 1 ? (index / (data.length - 1)) * 100 : 50);
  // A value that is not a finite number is a gap, as a null is in the line chart.
  const points: (PlotPoint | null)[] = data.map((value, index) =>
    Number.isFinite(value) ? { x: x(index), y: y(value) } : null,
  );
  // One value is only its dot: a line needs two.
  const drawn = data.length > 1 ? linePath(points) : '';
  const area = hasArea && data.length > 1 ? areaPath(points, 100) : '';
  const end = hasEndPoint ? points.at(-1) : undefined;

  // The first name that names something: a blank aria-labelledby or aria-label falls through to the next,
  // and with neither the sparkline is decorative, never an unnamed image.
  const name = named(ariaLabelledBy)
    ? { role: 'img', 'aria-labelledby': ariaLabelledBy }
    : named(ariaLabel)
      ? { role: 'img', 'aria-label': ariaLabel }
      : { 'aria-hidden': true };

  return (
    <span {...rest} {...name} className={cx('sparkline', className)}>
      <span className="sparkline-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {area === '' ? null : <path className="sparkline-area" d={area} />}
          {drawn === '' ? null : <path className="sparkline-line" d={drawn} />}
        </svg>
        {end ? (
          <span className="sparkline-end" style={{ insetInlineStart: percent(end.x), top: percent(end.y) }} />
        ) : null}
      </span>
    </span>
  );
}
