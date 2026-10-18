import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export type ProgressBarBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> & {
  /** The visible label, such as "Uploading invoice.pdf". Without it, `aria-label` or `aria-labelledby` names the bar. */
  label?: ReactNode;
  /** How far along, from `minValue` to `maxValue`, clamped to them. Ignored while indeterminate. @default 0 */
  value?: number;
  /** @default 0 */
  minValue?: number;
  /** @default 100 */
  maxValue?: number;
  /** Work of unknown length, such as reading a document: a sliding segment and no value. @default false */
  isIndeterminate?: boolean;
  /**
   * The value in the app's words, shown at the head's end and given as the bar's value text: "45%", "1.2 of 4 MB".
   * A blank one counts as absent.
   * @default the percentage in ASCII digits, rounded to a whole number: "45%"
   */
  valueLabel?: string;
  /** Shows `valueLabel` at the head's end. @default true while determinate */
  showValueLabel?: boolean;
  ref?: Ref<HTMLDivElement>;
};

/**
 * A name is required: a visible `label`, an `aria-label` or an `aria-labelledby`. A blank one passes the types
 * and names nothing, so the bar falls back to its value text, or while indeterminate to Spinner's "Loading".
 */
export type ProgressBarProps = ProgressBarBaseProps & AccessibleName<'label'>;

/**
 * The name of an indeterminate bar that nothing else names, Spinner's own default, so the library's two
 * indicators of work of unknown length fall back to the same word. Your own label says more.
 */
const FALLBACK_NAME = 'Loading';

/** A percentage with at most three decimals, as Meter writes its own. */
const percent = (share: number): string => `${String(Math.round(share * 100_000) / 1000)}%`;

/** A string that names something: given and not only spaces. */
const named = (text: string | undefined): text is string => text !== undefined && text.trim() !== '';

/**
 * Work getting done: how far an upload has come, or that a reading is under way. The WAI-ARIA progressbar role
 * written by hand on the track, so the head beside it is not lost to the role's presentational children; valued
 * while determinate and unvalued while indeterminate, which is how the role says "unknown"; never live, since
 * the part that owns the work says what matters once. Static: `useId` is its one hook, so a server component
 * renders it with no client JavaScript.
 */
export function ProgressBar(props: ProgressBarProps): ReactElement {
  // Every branch of the union is one of these, so the annotation widens without a cast: the names are read
  // here and put on the track, never on the root.
  const {
    label,
    value = 0,
    minValue = 0,
    maxValue = 100,
    isIndeterminate = false,
    valueLabel,
    showValueLabel,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  }: ProgressBarBaseProps & { 'aria-label'?: string; 'aria-labelledby'?: string } = props;
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  // A label of only spaces names nothing, so it counts as absent for the name, as a blank aria-label does.
  const hasLabel = present(label) && !(typeof label === 'string' && label.trim() === '');

  // A range that is not a range draws an empty track and reports its minimum; a value that is not a number is
  // the start of the range.
  const isRange = maxValue > minValue;
  const clamped =
    isRange && Number.isFinite(value) ? Math.min(maxValue, Math.max(minValue, value)) : minValue;
  const share = isRange ? (clamped - minValue) / (maxValue - minValue) : 0;
  // Integer arithmetic in ASCII digits, never Intl, so the server and the browser write the same.
  const percentage = isRange
    ? `${String(Math.round(((clamped - minValue) * 100) / (maxValue - minValue)))}%`
    : '0%';
  // A blank valueLabel is no value text: the percentage stands while determinate, and nothing while indeterminate.
  const valueText = named(valueLabel) ? valueLabel : isIndeterminate ? undefined : percentage;

  // The first name that names something: a blank aria-labelledby or aria-label falls through to the next; with
  // nothing else the value text names the bar, and an indeterminate bar with no value text takes Spinner's
  // "Loading", so a blank string never leaves it unnamed.
  const unnamed = !named(ariaLabelledBy) && !named(ariaLabel) && !hasLabel;
  const showValue = valueText !== undefined && ((showValueLabel ?? !isIndeterminate) || unnamed);
  const name = named(ariaLabelledBy)
    ? { 'aria-labelledby': ariaLabelledBy }
    : named(ariaLabel)
      ? { 'aria-label': ariaLabel }
      : hasLabel
        ? { 'aria-labelledby': labelId }
        : showValue
          ? { 'aria-labelledby': valueId }
          : { 'aria-label': FALLBACK_NAME };
  // Indeterminate, a value shown on purpose cannot be the value text, which the role withholds, so it describes
  // the track instead, unless it already names it.
  const describesTrack = isIndeterminate && showValue && !unnamed;
  const describedBy =
    [named(ariaDescribedBy) ? ariaDescribedBy : undefined, describesTrack ? valueId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div {...rest} className={cx('progress-bar', className)}>
      {hasLabel || showValue ? (
        <div className="progress-bar-head">
          {hasLabel ? (
            <span className="progress-bar-label" id={labelId}>
              {label}
            </span>
          ) : null}
          {showValue ? (
            <span
              className="progress-bar-value"
              id={unnamed || describesTrack ? valueId : undefined}
              aria-hidden="true"
            >
              {valueText}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className="progress-bar-track"
        role="progressbar"
        {...(isIndeterminate
          ? { 'data-indeterminate': '' }
          : {
              'aria-valuemin': minValue,
              'aria-valuemax': isRange ? maxValue : minValue,
              'aria-valuenow': clamped,
              'aria-valuetext': valueText,
              style: { '--progress-bar-value': percent(share) } as CSSProperties,
            })}
        aria-describedby={describedBy}
        {...name}
      >
        <span className="progress-bar-fill" />
      </div>
    </div>
  );
}
