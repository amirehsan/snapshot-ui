import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type Key,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { monthGridSummary } from './summary';

/** The library's looks, which are shapes and not meanings. The app's states map onto them. */
export type MonthGridLook = 'filled' | 'partial' | 'empty';

export interface MonthGridState {
  /** The app's key for the state, used in `years[].months`: 'held'. */
  id: string;
  /** The app's word for it, in the legend, the summary and the table: "Held". */
  label: string;
  /**
   * `filled` is a solid cell, `partial` a hatched one and `empty` an outline. None is error, warning or success:
   * a missing month is the reader's fact, so say what needs attention in the summary or with a Badge.
   */
  look: MonthGridLook;
}

export interface MonthGridYear {
  /** Stable across updates. */
  id: Key;
  /** The year as the app writes it, in its calendar and digits: "2025", "۱۴۰۴". */
  label: string;
  /**
   * One entry per month, in the order of `monthLabels`: a state's id, or `null` for a month outside the range
   * (before the account opened, not yet come), which stays blank.
   */
  months: readonly (string | null)[];
}

export interface MonthGridLabels {
  /** The table's word for a month outside the range. @default 'Not in range' */
  outside: string;
  /** The table's first column header. @default 'Year' */
  year: string;
}

export type MonthGridBaseProps = Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> & {
  /** The visible name: "Statement coverage". Without it, `aria-label` or `aria-labelledby` names the grid. */
  label?: ReactNode;
  /** The app's states, each mapped to a look. Two states may share a look. */
  states: readonly MonthGridState[];
  /** The rows, in the order drawn: newest first or oldest first is the app's choice. */
  years: readonly MonthGridYear[];
  /**
   * The short month labels over the columns, in the app's calendar: "J", "F", or "فر", "ار". Their count sets the
   * columns, 12 for most calendars. Under 28rem of the grid's width only every third, from the first, shows.
   */
  monthLabels: readonly string[];
  /** The full month names, for the summary and the table: "January", or "فروردین". Same count as `monthLabels`. */
  monthNames: readonly string[];
  /**
   * The sentence under the grid, which also describes the figure. A string or node replaces the library's English
   * default, which names the months of every state whose look is not `filled`, the empty looks first, oldest
   * first: "Missing: November 2024, March and April 2025. Partial: June 2025." Pass your own in any other
   * language. `false` draws none.
   */
  summary?: ReactNode | false;
  /** The legend of the states under the grid, each state some month holds. @default true */
  hasLegend?: boolean;
  /** The hidden table's words for its first column and a month outside the range. */
  labels?: Partial<MonthGridLabels>;
  ref?: Ref<HTMLElement>;
};

/**
 * The props of MonthGrid. The types require a name: a visible `label`, an `aria-label` or an `aria-labelledby`.
 */
export type MonthGridProps = MonthGridBaseProps & AccessibleName<'label'>;

const DEFAULT_LABELS: MonthGridLabels = { outside: 'Not in range', year: 'Year' };

/** A string that names something: given and not only spaces. */
const named = (text: string | undefined): text is string => text !== undefined && text.trim() !== '';

/** A node that draws something: `present()`, and not a string of only spaces. */
const shows = (node: ReactNode): boolean =>
  present(node) && !(typeof node === 'string' && node.trim() === '');

/**
 * Which months you have: a header of the app's short month labels, then one row per year, each month a cell in
 * the look of its state, or blank outside the range. The visible grid and its legend are hidden from assistive
 * technology; a sentence under the grid and a table clipped from sight say the same in words. Nothing computes a
 * date: the years, the months and every word are the app's, in its calendar. Static: `useId` is its one hook,
 * so a server component renders it with no client JavaScript.
 */
export function MonthGrid(props: MonthGridProps): ReactElement {
  // Every branch of the union is one of these, so the annotation widens without a cast: the names are read here
  // and put on the figure and the table.
  const {
    label,
    states,
    years,
    monthLabels,
    monthNames,
    summary,
    hasLegend = true,
    labels,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  }: MonthGridBaseProps & { 'aria-label'?: string; 'aria-labelledby'?: string } = props;
  const id = useId();
  const labelId = `${id}-label`;
  const summaryId = `${id}-summary`;
  const words = { ...DEFAULT_LABELS, ...labels };
  // A label of only spaces names nothing, so it counts as absent, as a blank aria-label does.
  const hasLabel = shows(label);

  // A state by its id; the first wins if two share one. An id no state has is drawn as outside the range.
  const byId = new Map<string, MonthGridState>();
  for (const state of states) if (!byId.has(state.id)) byId.set(state.id, state);
  const stateOf = (month: string | null): MonthGridState | undefined =>
    month === null ? undefined : byId.get(month);

  // The first name that names something: a non-blank aria-labelledby, else a non-blank aria-label, else the label.
  const name = named(ariaLabelledBy)
    ? { 'aria-labelledby': ariaLabelledBy }
    : named(ariaLabel)
      ? { 'aria-label': ariaLabel }
      : hasLabel
        ? { 'aria-labelledby': labelId }
        : {};
  // The table's caption is the name a reader sees, or the aria-label nothing shows; a name shown elsewhere is
  // pointed at instead, since a caption cannot hold another element's text.
  const caption: ReactNode = hasLabel ? label : named(ariaLabel) ? ariaLabel : null;
  const tableName = caption === null && named(ariaLabelledBy) ? ariaLabelledBy : undefined;

  const sentence: ReactNode =
    summary === undefined ? monthGridSummary(states, years, monthNames) : summary === false ? null : summary;

  // The states some month holds, in the order of `states`.
  const held = new Set(years.flatMap((year) => year.months.map((month) => stateOf(month)?.id)));
  const legend = [...byId.values()].filter((state) => held.has(state.id));

  // The summary describes the figure, after the caller's own description, so the gist is heard with the name.
  const hasSummary = shows(sentence);
  const describedBy =
    [named(ariaDescribedBy) ? ariaDescribedBy : undefined, hasSummary ? summaryId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  // In reading order: the name, the picture (hidden), the gist, the table, the key (hidden). The legend follows the
  // table in the markup and the summary on screen, since the table is clipped out of the flow.
  return (
    <figure {...rest} {...name} aria-describedby={describedBy} className={cx('month-grid', className)}>
      {hasLabel ? (
        // Hidden, since the figure's name already says it: it names the figure, and is not read a second time.
        <span className="month-grid-label" id={labelId} aria-hidden="true">
          {label}
        </span>
      ) : null}
      <div
        className="month-grid-grid"
        aria-hidden="true"
        style={
          {
            '--month-grid-columns': String(monthLabels.length),
            // Half the months, rounded up: a row each for the two halves of a year under 12rem of the grid's width.
            '--month-grid-half': String(Math.ceil(monthLabels.length / 2)),
          } as CSSProperties
        }
      >
        <span className="month-grid-corner" />
        {monthLabels.map((short, index) => (
          // A label has no identity beyond its column.
          <span key={index} className="month-grid-month" data-quarter={index % 3 === 0 ? '' : undefined}>
            {short}
          </span>
        ))}
        {years.map((year) => [
          <span key={`${String(year.id)}-year`} className="month-grid-year">
            {year.label}
          </span>,
          ...year.months.map((month, index) => (
            <span
              key={`${String(year.id)}-${String(index)}`}
              className="month-grid-cell"
              data-look={stateOf(month)?.look ?? 'none'}
            />
          )),
        ])}
      </div>
      {hasSummary ? (
        <p className="month-grid-summary" id={summaryId}>
          {sentence}
        </p>
      ) : null}
      {/* Clipped from sight inside its own box, so its width never scrolls the page; read in browse mode and by
          table navigation, row by column: "March 2025?" */}
      <div className="month-grid-alternative">
        <table className="month-grid-table" aria-labelledby={tableName}>
          {caption === null ? null : <caption>{caption}</caption>}
          <thead>
            <tr>
              <th scope="col">{words.year}</th>
              {monthNames.map((month, index) => (
                <th key={index} scope="col">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year.id}>
                <th scope="row">{year.label}</th>
                {year.months.map((month, index) => (
                  <td key={index}>{stateOf(month)?.label ?? words.outside}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasLegend && legend.length > 0 ? (
        <ul className="month-grid-legend" aria-hidden="true">
          {legend.map((state) => (
            <li key={state.id} className="month-grid-legend-item">
              <span className="month-grid-swatch" data-look={state.look} />
              <span className="month-grid-legend-label">{state.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
