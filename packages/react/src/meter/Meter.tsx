import { useId, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface MeterSegment {
  /** In the meter's units, such as dollars. Segments stack in order from the start. */
  value: number;
  /** `fill` is solid ink, `hatched` is ink stripes: spent and held. */
  look: 'fill' | 'hatched';
  /** For the legend and the accessible value: "Spent", "Held". */
  label: string;
  /** Formatted: "$820.00". */
  valueLabel: string;
}

export type MeterBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> & {
  /** The visible label, such as "Groceries". When absent, `aria-label` or `aria-labelledby` names the meter. */
  label?: ReactNode;
  /** The limit, in the same units. Over 0: a limit of 0 or below draws an empty track and reports 0. */
  max: number;
  segments: MeterSegment[];
  /** The visible value text and the accessible value: "$1,020 of $1,200". Over the limit it must say so in words. */
  valueLabel: string;
  /** Where spending would be today if it kept pace, in the same units. */
  pace?: { value: number; label: string };
  /** Draws a legend under the bar for the segments and the pace. @default false */
  hasLegend?: boolean;
  ref?: Ref<HTMLDivElement>;
};

/**
 * The props of Meter. The types require a name: a visible `label`, an `aria-label` or an `aria-labelledby`.
 */
export type MeterProps = MeterBaseProps & AccessibleName<'label'>;

/** A percentage with at most three decimals. */
const percent = (share: number): string => `${String(Math.round(share * 100_000) / 1000)}%`;

/** Each segment's drawn width, in percent of the track, stacked from the start and clipped at max. */
function widths(segments: readonly MeterSegment[], max: number): number[] {
  let used = 0;
  return segments.map(({ value }) => {
    const amount = Math.max(0, value);
    const drawn = max > 0 ? (Math.min(amount, Math.max(0, max - used)) / max) * 100 : 0;
    used += amount;
    return Math.round(drawn * 1000) / 1000;
  });
}

/** A string that names something: given and not only spaces. */
const named = (text: string | undefined): text is string => text !== undefined && text.trim() !== '';

/**
 * Spending against a budget: segments stacked in one bar, a marker for today's pace, and the app's words for
 * the value. The WAI-ARIA meter pattern written by hand, with the role on the bar, so the legend beside it is
 * not lost to a meter's presentational children. Static: `useId` is its one hook, so a server component
 * renders it with no client JavaScript.
 */
export function Meter(props: MeterProps): ReactElement {
  // Every branch of the union is one of these, so the annotation widens without a cast: the names are read
  // here and put on the bar, never on the root.
  const {
    label,
    max,
    segments,
    valueLabel,
    pace,
    hasLegend = false,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  }: MeterBaseProps & { 'aria-label'?: string; 'aria-labelledby'?: string } = props;
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const paceId = `${id}-pace`;
  // A label of only spaces names nothing, so it counts as absent for the name, as a blank aria-label does.
  const hasLabel = present(label) && !(typeof label === 'string' && label.trim() === '');
  const sum = segments.reduce((total, { value }) => total + Math.max(0, value), 0);
  const drawn = widths(segments, max);
  const paceLabel = pace && named(pace.label) ? pace.label : undefined;
  // The first name that names something: a blank aria-labelledby or aria-label falls through to the next, and
  // with nothing else the value text names the bar, so the meter never goes unnamed.
  const name = named(ariaLabelledBy)
    ? { 'aria-labelledby': ariaLabelledBy }
    : named(ariaLabel)
      ? { 'aria-label': ariaLabel }
      : { 'aria-labelledby': hasLabel ? labelId : valueId };
  const unnamed = !named(ariaLabelledBy) && !named(ariaLabel) && !hasLabel;
  return (
    <div {...rest} className={cx('meter', className)} data-over={sum > max ? '' : undefined}>
      <div className="meter-head">
        {hasLabel ? (
          <span className="meter-label" id={labelId}>
            {label}
          </span>
        ) : null}
        <span className="meter-value" id={unnamed ? valueId : undefined} aria-hidden="true">
          {valueLabel}
        </span>
      </div>
      <div
        className="meter-bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, max)}
        aria-valuenow={max > 0 ? Math.min(sum, max) : 0}
        aria-valuetext={valueLabel}
        // The caller's description, which the root could not carry since it has no role, then the pace.
        aria-describedby={
          [named(ariaDescribedBy) ? ariaDescribedBy : undefined, paceLabel === undefined ? undefined : paceId]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...name}
      >
        <div className="meter-track">
          {segments.map((segment, index) =>
            (drawn[index] ?? 0) > 0 ? (
              <span
                // A segment has no identity beyond its place in the stack.
                key={index}
                className="meter-segment"
                data-look={segment.look}
                style={{ inlineSize: `${String(drawn[index])}%` }}
              />
            ) : null,
          )}
        </div>
        {pace ? (
          <span
            className="meter-pace"
            style={{ insetInlineStart: percent(max > 0 ? Math.min(1, Math.max(0, pace.value / max)) : 0) }}
          />
        ) : null}
      </div>
      {paceLabel === undefined ? null : (
        <span className="meter-pace-label" id={paceId} hidden>
          {paceLabel}
        </span>
      )}
      {hasLegend ? (
        <ul className="meter-legend">
          {segments.map((segment, index) => (
            <li className="meter-legend-item" key={index}>
              <span className="meter-swatch" data-look={segment.look} aria-hidden="true" />
              <span className="meter-legend-label">{segment.label}</span>
              <span className="meter-legend-value">{segment.valueLabel}</span>
            </li>
          ))}
          {paceLabel === undefined ? null : (
            <li className="meter-legend-item">
              <span className="meter-swatch" data-look="pace" aria-hidden="true" />
              <span className="meter-legend-label">{paceLabel}</span>
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
