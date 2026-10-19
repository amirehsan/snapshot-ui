import { useId, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { GAUGE_SIZES, gaugeDash, gaugeMark, gaugeRest, gaugeShare, gaugeTrack } from './geometry';

export interface GaugeMark {
  /** In the gauge's units, between `minValue` and `maxValue`: 670 on a score, 30 on a utilization. */
  value: number;
  /**
   * What the mark means, added to the gauge's description: "Good from 670". An empty label draws the mark and
   * adds nothing, for thresholds repeated on every row of a table and said once beside it.
   */
  label: string;
}

export type GaugeBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> & {
  /** The visible name: "Credit score", "Utilization". Without it, `aria-label` or `aria-labelledby` names the gauge. */
  label?: ReactNode;
  /** The measurement, in the range's units. Drawn clamped to the range; above `maxValue` the gauge is over its limit. */
  value: number;
  /** The range's start, in the same units: 300 for a credit score. @default 0 */
  minValue?: number;
  /** The range's end: 850 for a credit score, 100 for a percentage. @default 100 */
  maxValue?: number;
  /**
   * The value in the app's words, shown under or beside the dial and given as the accessible value:
   * "742 of 850, Very good", "23% of your limit". At a warning or error tone, or over the limit, it must say so.
   */
  valueLabel: string;
  /** The short numeral in the middle at `md` and `lg`: "742", "23%". At most 4 characters at `md` and 6 at `lg`. None when absent. */
  figure?: string;
  /** A word under the figure at `md` and `lg`: "Very good". It repeats what `valueLabel` says. */
  figureCaption?: string;
  /** `ring` is a full circle from the top; `semicircle` an arc from the inline start over the top to the end. @default 'ring' */
  form?: 'ring' | 'semicircle';
  /** 32, 96 or 160px. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /**
   * What the value means now, the app's choice: `warning` needs a look soon, such as a fair or a poor score or a
   * utilization above 30%; `error` is a failure only, such as a limit that stopped a payment, never a score band.
   * There is no success tone: a good value is ink, and its words say it is good. Above `maxValue` a neutral gauge
   * draws as `warning`.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'warning' | 'error';
  /** Up to five marks across the track: band edges, a threshold, a target. A sixth is not drawn. */
  marks?: readonly GaugeMark[];
  ref?: Ref<HTMLDivElement>;
};

/**
 * The props of Gauge. The types require a name: a visible `label`, an `aria-label` or an `aria-labelledby`.
 */
export type GaugeProps = GaugeBaseProps & AccessibleName<'label'>;

/** Five marks hold a score's four band edges and a target; more would crowd a 32px ring. */
const MARK_LIMIT = 5;

/** A string that names something: given and not only spaces. */
const named = (text: string | undefined): text is string => text !== undefined && text.trim() !== '';

/**
 * One figure on a range at a glance: a credit score, a share of a limit. The WAI-ARIA meter pattern written by
 * hand, Meter's, with the role on the dial so the label and the value text beside it are not lost to a meter's
 * presentational children. The arc, caps included, is exactly the value's share of `minValue` to `maxValue`.
 * Static: `useId` is its one hook, so a server component renders it with no client JavaScript.
 */
export function Gauge(props: GaugeProps): ReactElement {
  // Every branch of the union is one of these, so the annotation widens without a cast: the names are read
  // here and put on the dial, never on the root.
  const {
    label,
    value,
    minValue = 0,
    maxValue = 100,
    valueLabel,
    figure,
    figureCaption,
    form = 'ring',
    size = 'md',
    tone = 'neutral',
    marks = [],
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  }: GaugeBaseProps & { 'aria-label'?: string; 'aria-labelledby'?: string } = props;
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const marksId = `${id}-marks`;
  // A label of only spaces names nothing, so it counts as absent for the name, as a blank aria-label does.
  const hasLabel = present(label) && !(typeof label === 'string' && label.trim() === '');

  // A range that is not a range draws an empty track and reports its minimum for all three numbers, and a value
  // that is not a number is the start of the range: ProgressBar's rule.
  const isRange = maxValue > minValue;
  const isValue = isRange && Number.isFinite(value);
  const now = isValue ? Math.min(maxValue, Math.max(minValue, value)) : minValue;
  const isOver = isValue && value > maxValue;
  const resolved = tone === 'neutral' && isOver ? 'warning' : tone;

  const track = gaugeTrack(size, form);
  const share = gaugeDash(gaugeShare(value, minValue, maxValue), track);
  // A share of 0 keeps its path, marked empty, so a change to or from 0 moves like any other.
  const dash = share ?? gaugeRest(track);
  // A semicircle's track has two ends, so it is dashed at the whole share: its round caps end at the arc's ends,
  // and a full value covers it exactly. A ring's track is the whole circle and has no ends.
  const trackDash = form === 'semicircle' ? gaugeDash(1, track) : null;

  // Sorted by value and the first five, each clamped to the range.
  const shown = [...marks].sort((a, b) => a.value - b.value).slice(0, MARK_LIMIT);
  const lines = shown.map((mark) => gaugeMark(gaugeShare(mark.value, minValue, maxValue), size, form));
  // The mask's region: the box and a box's width around it, so the marks' overhang and the round caps are inside.
  const { box } = GAUGE_SIZES[size];
  const maskId = `${id}-gaps`;
  const masked = lines.length > 0 ? `url(#${maskId})` : undefined;
  const described = shown.map((mark) => mark.label).filter(named);
  const marksLabel = described.length > 0 ? `${described.join('. ')}.` : undefined;

  const hasFigure = size !== 'sm' && (named(figure) || named(figureCaption));

  // The first name that names something: a blank aria-labelledby or aria-label falls through to the next, and
  // with nothing else the value text names the dial, so the meter never goes unnamed.
  const name = named(ariaLabelledBy)
    ? { 'aria-labelledby': ariaLabelledBy }
    : named(ariaLabel)
      ? { 'aria-label': ariaLabel }
      : { 'aria-labelledby': hasLabel ? labelId : valueId };
  const unnamed = !named(ariaLabelledBy) && !named(ariaLabel) && !hasLabel;
  // The caller's description, which the root could not carry since it has no role, then the marks.
  const describedBy =
    [named(ariaDescribedBy) ? ariaDescribedBy : undefined, marksLabel === undefined ? undefined : marksId]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div
      {...rest}
      className={cx('gauge', className)}
      data-size={size}
      data-form={form}
      data-tone={resolved}
      data-over={isOver ? '' : undefined}
    >
      <div
        className="gauge-dial"
        role="meter"
        aria-valuemin={minValue}
        aria-valuemax={isRange ? maxValue : minValue}
        aria-valuenow={now}
        aria-valuetext={valueLabel}
        aria-describedby={describedBy}
        {...name}
      >
        <svg className="gauge-svg" viewBox={track.viewBox} aria-hidden="true" focusable="false">
          {lines.length > 0 ? (
            // Each mark's gap is cut out of the track and the arc, so what is behind the gauge shows there on any
            // surface: a card, the page, a hovered or a selected table row. Luminance, so white keeps and black cuts.
            <defs>
              <mask
                id={maskId}
                className="gauge-mask"
                maskUnits="userSpaceOnUse"
                x={-box}
                y={-box}
                width={3 * box}
                height={3 * box}
              >
                <rect x={-box} y={-box} width={3 * box} height={3 * box} fill="white" />
                {lines.map((line, index) => (
                  // A mark has no identity beyond its place in the sorted list.
                  <line key={index} className="gauge-mark-gap" {...line} stroke="black" strokeWidth={6} />
                ))}
              </mask>
            </defs>
          ) : null}
          <path
            className="gauge-track"
            d={track.d}
            strokeWidth={track.stroke}
            mask={masked}
            style={
              trackDash
                ? { strokeDasharray: trackDash.dasharray, strokeDashoffset: trackDash.dashoffset }
                : undefined
            }
          />
          <path
            className="gauge-value"
            d={track.d}
            strokeWidth={track.stroke}
            mask={masked}
            data-empty={share ? undefined : ''}
            // Inline, so the stylesheet's transition runs when the value changes.
            style={{ strokeDasharray: dash.dasharray, strokeDashoffset: dash.dashoffset }}
          />
          {lines.map((line, index) => (
            <line key={index} className="gauge-mark" {...line} />
          ))}
        </svg>
        {hasFigure ? (
          <span className="gauge-figure" aria-hidden="true">
            {named(figure) ? <span className="gauge-figure-value">{figure}</span> : null}
            {named(figureCaption) ? <span className="gauge-figure-caption">{figureCaption}</span> : null}
          </span>
        ) : null}
      </div>
      <div className="gauge-text">
        {hasLabel ? (
          <span className="gauge-label" id={labelId}>
            {label}
          </span>
        ) : null}
        <span className="gauge-value-label" id={unnamed ? valueId : undefined} aria-hidden="true">
          {valueLabel}
        </span>
      </div>
      {marksLabel === undefined ? null : (
        <span className="gauge-marks-label" id={marksId} hidden>
          {marksLabel}
        </span>
      )}
    </div>
  );
}
