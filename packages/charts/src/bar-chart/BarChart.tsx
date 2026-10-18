'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { ChartLegend } from '../foundations/ChartLegend';
import { ChartTable } from '../foundations/ChartTable';
import type { ChartColor } from '../foundations/color';
import { valueDomain as domainOf } from '../foundations/domain';
import { coordinate, percent } from '../foundations/format';
import { hasModifier, type Move } from '../foundations/keys';
import { chartName } from '../foundations/naming';
import { placeReadout, READOUT_GAP, readoutAlign } from '../foundations/readout';
import { linearScale } from '../foundations/scale';
import type { ChartStatus, ChartStatusLabels } from '../foundations/status';
import { useChartActive, type ChartSource } from '../foundations/useChartActive';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { useWarnOnce } from '../utils/warn-once';
import { barExtent, barMark, firstStop, moveBar, nonzero, type BarStop } from './geometry';

export type { ChartColor } from '../foundations/color';
export type { ChartStatusLabels } from '../foundations/status';

/** One bar: the number places it, the string says it. */
export interface BarValue {
  value: number;
  /** Formatted: "$420.00", "-$1,240.00", "۴۲۰ دلار". */
  valueLabel: string;
}

export interface BarSeries {
  /** "Groceries", "October", "Income". Names the series in the legend, the readout, each bar's name and the table. */
  label: string;
  /** One per category, aligned with `categories`. `null` is no value: no bar, skipped by the keys, an empty cell. */
  values: readonly (BarValue | null)[];
  /** Pins the series to a color, so it keeps it when another series is filtered out. @default ink, then slate */
  color?: ChartColor;
  /** 'hatched' draws the series as the previous period: the color of the first filled series, striped. Grouped charts only. @default 'fill' */
  look?: 'fill' | 'hatched';
}

/** Grouped bars hold one or two series; stacked bars up to five. */
export type BarChartSeries =
  | { layout?: 'grouped'; series: readonly [BarSeries] | readonly [BarSeries, BarSeries] }
  | { layout: 'stacked'; series: readonly BarSeries[] };

/** The strings the chart writes itself. Give all six, so no default in English is left on the page. */
export interface BarChartLabels {
  showTable: string;
  showChart: string;
  /** Shown with scripts off, above the table: "Scripts are off, so the chart's data is in the table below." */
  noScript: string;
  /** The bars' group's `aria-roledescription`: "chart". */
  roleDescription: string;
  /** Each bar's `aria-roledescription`: "bar". */
  bar: string;
  /** The table's header for `totals`, and the readout's: "Total". */
  total: string;
}

export type BarChartProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label' | 'aria-labelledby'> &
  AriaName &
  BarChartSeries & {
    /** The bands' labels, formatted: "Groceries", "Whole Foods Market", "Other". In the app's order: a ranked list is sorted by the app. */
    categories: readonly string[];
    /** @default 'vertical' */
    orientation?: 'vertical' | 'horizontal';
    /** Whether the bands are periods in order or peers. Time bands start the keys at the newest. @default 'category' */
    bands?: 'category' | 'time';
    /** Which category labels show, by index. @default every one */
    categoryTicks?: readonly number[];
    /** The value gridlines and their labels, formatted. Absent, no gridlines but the zero line and no value labels under the bars. */
    valueTicks?: readonly { value: number; label: string }[];
    /** The value domain. Always widened to include zero. @default from the least to the greatest value, zero included, rounded out */
    valueDomain?: readonly [number, number];
    /** Amounts in the end column: none, every row, or the rows at these indexes. @default 'all' */
    valueLabels?: 'none' | 'all' | readonly number[];
    /** Each band's total, formatted by the app, for the readout and a Total column in the table. */
    totals?: readonly (string | null)[];
    /** @default 'ready' */
    status?: ChartStatus;
    /** Drawn in the rows' place for 'empty' and 'error', such as an EmptyState with a Retry button. */
    statusContent?: ReactNode;
    /** Draws each series' texture as well as its color. Always on in forced colors. @default false */
    hasTexture?: boolean;
    /** @default { showTable: 'Show as table', showChart: 'Show as chart', noScript: "Scripts are off, so the chart's data is in the table below.", roleDescription: 'chart', bar: 'bar', total: 'Total' } */
    labels?: BarChartLabels;
    /** @default { loading: 'Loading', empty: 'Nothing to show for this period', error: 'The chart could not be loaded' } */
    statusLabels?: ChartStatusLabels;
    /** The plot's height in px, vertical only; a horizontal chart is as tall as its rows. @default 240 */
    height?: number;
    ref?: Ref<HTMLElement>;
  };

/**
 * The props as a story may also pass them: the band a pointer holds when the chart first draws, so a story shows
 * the dimming with no pointer. Not part of the package's types.
 */
type DrawnProps = BarChartProps & { defaultActive?: number };

const DEFAULT_LABELS: BarChartLabels = {
  showTable: 'Show as table',
  showChart: 'Show as chart',
  noScript: "Scripts are off, so the chart's data is in the table below.",
  roleDescription: 'chart',
  bar: 'bar',
  total: 'Total',
};

const DEFAULT_STATUS_LABELS: ChartStatusLabels = {
  loading: 'Loading',
  empty: 'Nothing to show for this period',
  error: 'The chart could not be loaded',
};

/** The keys a horizontal chart moves by: Up and Down through the rows as drawn. Left and Right are not moves. */
const KEYS: Record<string, Move> = {
  ArrowDown: 'next',
  ArrowUp: 'previous',
  Home: 'first',
  End: 'last',
  PageUp: 'page-back',
  PageDown: 'page-forward',
};

/** The loading rows' widths, in percent of the track, repeating: a list's shape, not a chart's. */
const LOADING = [70, 50, 85, 40];

/** A row's least height in px, `--size-target`, which the readout's place is reckoned in. */
const ROW = 40;

/** One series' value at the active band, as the readout says it. */
interface Reading {
  at: number;
  label: string;
  valueLabel: string;
  color: ChartColor;
}

/**
 * Amounts as bars, drawn on the server as HTML: a row per category with its label at the start, its bars from a
 * zero line, and its amounts in a column at the end, over gridlines in a stretched svg. Each bar is a stop of a
 * roving tab index, named by its table cells, and the arrow keys move bar to bar; a pointer activates the row
 * under it. A toggle swaps the chart for a table of the same strings. Loading, empty and error draw in the
 * rows' place. Every figure is the app's string; `value` only places a bar, and the value axis always holds zero.
 */
export function BarChart(props: BarChartProps): ReactElement {
  const {
    series,
    layout = 'grouped',
    categories,
    orientation = 'vertical',
    bands = 'category',
    categoryTicks,
    valueTicks,
    valueDomain,
    valueLabels = 'all',
    totals,
    status = 'ready',
    statusContent,
    hasTexture = false,
    labels = DEFAULT_LABELS,
    statusLabels = DEFAULT_STATUS_LABELS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- a vertical plot's: taken out of the figure's attributes, since a horizontal chart is as tall as its rows
    height,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    defaultActive,
    ...rest
  } = props as DrawnProps;
  const id = useId();
  const rowsRef = useRef<HTMLDivElement>(null);
  // The bar that last took focus, kept while it is in the page or until focus leaves it, so a bar that new
  // categories took away hands focus to the new first stop rather than the body.
  const focusedBar = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const count = categories.length;
  const isReady = status === 'ready';
  const shownView = isReady ? view : 'chart';
  // The series as drawn: values past the categories are dropped, and a value that is not finite is none.
  const drawn = series.map((line) => ({
    ...line,
    values: categories.map((_, band) => {
      const value = line.values[band];
      return value && Number.isFinite(value.value) ? value : null;
    }),
  }));
  const colors: ChartColor[] = drawn.map((line, at) => line.color ?? (at === 0 ? 'ink' : 'slate'));

  // The domain always holds zero: a bar that starts anywhere else misstates its value.
  const domain = domainOf(
    drawn.flatMap((line) => line.values.flatMap((value) => (value ? [value.value] : []))),
    valueDomain,
    { includeZero: true },
  );
  const isWidened =
    valueDomain !== undefined &&
    Number.isFinite(valueDomain[0]) &&
    Number.isFinite(valueDomain[1]) &&
    (domain[0] !== valueDomain[0] || domain[1] !== valueDomain[1]);
  useWarnOnce(
    isWidened
      ? `BarChart: valueDomain must include 0; widened to [${String(domain[0])}, ${String(domain[1])}].`
      : null,
  );
  useWarnOnce(
    orientation === 'horizontal'
      ? null
      : 'BarChart: this version draws horizontal bars only; pass orientation="horizontal".',
  );
  const scale = linearScale(domain, [0, 100]);
  const [low, high] = [Math.min(...domain), Math.max(...domain)];
  const zero = coordinate(scale(0));
  const ticks = isReady
    ? (valueTicks ?? []).filter(({ value }) => Number.isFinite(value) && value >= low && value <= high)
    : [];

  // The bars with a value, in drawn order: row by row, and in a row series by series. The DOM's order too.
  const stops: BarStop[] = isReady
    ? categories.flatMap((_, band) =>
        drawn.flatMap((line, at) => (line.values[band] ? [{ band, series: at }] : [])),
      )
    : [];
  const marks = stops.map(barMark);
  const first = firstStop(isReady ? drawn.map((line) => line.values) : [], bands);

  // The categories by their strings, not by the array's identity: a mark made under other categories is gone.
  const key = categories.join('\n');
  const [markedFor, setMarkedFor] = useState(key);
  const chart = useChartActive<string>({
    onFirstFocus: () => (first === null ? null : barMark(first)),
    isAvailable: (mark) => markedFor === key && marks.includes(mark),
    within: rowsRef,
  });
  const activate = (stop: BarStop, from: ChartSource): void => {
    setMarkedFor(key);
    chart.activate(barMark(stop), from);
  };
  // The roving tab stop: the bar last active under these categories, else the first stop.
  const stop =
    chart.stop !== null && markedFor === key && marks.includes(chart.stop)
      ? chart.stop
      : first && barMark(first);
  // A story's held band, as a pointer would hold it, until a reader acts.
  const held =
    defaultActive === undefined || chart.source !== null
      ? null
      : (marks.find((mark) => mark.startsWith(`${String(defaultActive)}:`)) ?? null);
  const active = chart.current ?? held;
  const activeStop = active === null ? undefined : stops[marks.indexOf(active)];
  const isPointer = chart.current === null ? held !== null : chart.source !== 'key';

  // New categories while a bar holds focus: focus goes to the new first stop, never the body.
  const shownKey = useRef(key);
  useEffect(() => {
    if (shownKey.current === key) return;
    shownKey.current = key;
    const rows = rowsRef.current;
    const bar = focusedBar.current;
    if (!rows || !bar) return;
    const focused = rows.ownerDocument.activeElement;
    if (bar.isConnected ? focused !== bar : focused !== null && focused !== rows.ownerDocument.body) return;
    rows.querySelector<HTMLElement>('.bar-chart-bar[tabindex="0"]')?.focus();
  }, [key]);

  /** The chart's bars, in the order of `stops`. */
  const barsOf = (rows: HTMLElement): HTMLElement[] => [
    ...rows.querySelectorAll<HTMLElement>('.bar-chart-bar'),
  ];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // A key with Alt, Control or Meta is the browser's or the page's shortcut, never a move.
    if (hasModifier(event)) return;
    if (event.key === 'Escape') {
      // Stopped as well as prevented, so a Dialog around the chart closes on the next Escape, not this one.
      if (chart.current !== null && !chart.isReadoutHidden) {
        event.preventDefault();
        event.stopPropagation();
        chart.hideReadout();
      }
      return;
    }
    const move = KEYS[event.key];
    const bars = barsOf(event.currentTarget);
    const from = stops[bars.indexOf(event.target as HTMLElement)];
    if (move === undefined || from === undefined) return;
    event.preventDefault();
    const to = moveBar(stops, from, move);
    activate(to, 'key');
    bars[stops.indexOf(to)]?.focus();
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const to = event.relatedTarget;
    if (to instanceof Node && event.currentTarget.contains(to)) return;
    const bar = event.target;
    // A bar still in the page lost focus to something else; one that new categories took away keeps its place.
    queueMicrotask(() => {
      if (bar.isConnected && focusedBar.current === bar) focusedBar.current = null;
    });
    chart.clear();
  };

  /** Activates the row under the pointer, read from each row's parts, and the bar under it or the row's first. */
  const snap = (event: PointerEvent<HTMLDivElement>, from: ChartSource): void => {
    const y = event.clientY;
    const rows = [...event.currentTarget.querySelectorAll('.bar-chart-row')];
    let band = -1;
    let nearest = Number.POSITIVE_INFINITY;
    rows.forEach((row, at) => {
      const boxes = [...row.children].map((part) => part.getBoundingClientRect());
      const top = Math.min(...boxes.map((box) => box.top));
      const bottom = Math.max(...boxes.map((box) => box.bottom));
      const distance = y < top ? top - y : y > bottom ? y - bottom : 0;
      if (distance < nearest) {
        nearest = distance;
        band = at;
      }
    });
    const inBand = stops.filter((stop) => stop.band === band);
    const bars = [...(rows[band]?.querySelectorAll('.bar-chart-bar') ?? [])];
    const under = inBand.find((_, at) => {
      const box = bars[at]?.getBoundingClientRect();
      return box !== undefined && y >= box.top && y <= box.bottom;
    });
    const stop = under ?? inBand[0];
    if (stop) activate(stop, from);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== 'touch') snap(event, 'pointer');
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'touch') snap(event, 'touch');
  };

  const onPointerLeave = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'touch') return;
    // A bar that holds focus takes the active mark back; with none, nothing is active.
    const focused =
      stops[
        barsOf(event.currentTarget).indexOf(event.currentTarget.ownerDocument.activeElement as HTMLElement)
      ];
    if (focused) activate(focused, 'key');
    else chart.clear();
  };

  const onToggle = (): void => {
    chart.clear();
    setView((shown) => (shown === 'chart' ? 'table' : 'chart'));
  };

  // Ids for every header and cell of the table, so each bar is named by its cells.
  const cellId = (row: number, column: number): string => `${id}-${String(row)}-${String(column)}`;
  const name = chartName(
    { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy },
    drawn.map((_, at) => cellId(-1, at)),
  );
  const showsAmount = (band: number): boolean =>
    valueLabels === 'all' || (valueLabels !== 'none' && valueLabels.includes(band));
  const rowCount = isReady || count > 0 ? count : LOADING.length;

  // The readout, above the active row when its lines fit there and below it otherwise, at the end of the row's
  // longest bar along the track. Every number is known, so nothing is measured.
  const readings: Reading[] =
    activeStop === undefined
      ? []
      : drawn.flatMap((line, at) => {
          const value = line.values[activeStop.band];
          return value
            ? [{ at, label: line.label, valueLabel: value.valueLabel, color: colors[at] ?? 'ink' }]
            : [];
        });
  const total = activeStop === undefined ? null : (totals?.[activeStop.band] ?? null);
  let along = 0;
  if (activeStop !== undefined) {
    let longest = -1;
    for (const line of drawn) {
      const value = line.values[activeStop.band];
      if (!value) continue;
      const { start, size } = barExtent(value.value, scale);
      if (size > longest) {
        longest = size;
        along = Math.min(Math.max(value.value < 0 ? start : start + size, 0), 100);
      }
    }
  }
  const readout =
    activeStop === undefined
      ? null
      : placeReadout({
          marks: [(activeStop.band / count) * 100, ((activeStop.band + 1) / count) * 100],
          height: count * ROW,
          lines: readings.length + 1 + (total === null ? 0 : 1),
          gap: READOUT_GAP,
        });

  const rowsStyle = {
    '--bar-chart-rows': rowCount,
    '--bar-chart-rows-narrow': rowCount * 2,
    '--bar-chart-group': drawn.length,
  } as CSSProperties;

  return (
    <figure
      {...rest}
      aria-label={name.label}
      aria-labelledby={name.labelledBy}
      aria-busy={status === 'loading' ? true : undefined}
      className={cx('bar-chart', className)}
      data-orientation="horizontal"
      data-layout={layout}
      data-view={shownView}
      data-status={status}
      data-texture={hasTexture ? '' : undefined}
    >
      <div className="bar-chart-chart" hidden={shownView === 'table'}>
        {isReady && drawn.length > 1 ? (
          <ChartLegend
            block="bar-chart"
            items={drawn.map((line, at) => ({
              label: line.label,
              color: colors[at],
              look: line.look === 'hatched' ? 'hatched' : 'swatch',
            }))}
          />
        ) : null}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the bars are one roving tab stop that the arrow keys move through (spec 7.6); the group takes their keys as they bubble */}
        <div
          ref={rowsRef}
          className="bar-chart-rows"
          role="group"
          aria-roledescription={labels.roleDescription}
          {...name.stop}
          data-pointer={isPointer && active !== null ? '' : undefined}
          style={rowsStyle}
          onKeyDown={isReady ? onKeyDown : undefined}
          onBlur={isReady ? onBlur : undefined}
          onPointerMove={isReady ? onPointerMove : undefined}
          onPointerLeave={isReady ? onPointerLeave : undefined}
          onPointerDown={isReady ? onPointerDown : undefined}
        >
          <div className="bar-chart-gridlines" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
              {ticks.map((tick, at) => (
                <line
                  key={at}
                  className="bar-chart-grid"
                  x1={coordinate(scale(tick.value))}
                  x2={coordinate(scale(tick.value))}
                  y1="0"
                  y2="100"
                />
              ))}
              <line
                className="bar-chart-baseline"
                data-crosses={low < 0 && high > 0 ? '' : undefined}
                x1={zero}
                x2={zero}
                y1="0"
                y2="100"
              />
            </svg>
          </div>
          {status === 'loading' ? (
            Array.from({ length: rowCount }, (_, at) => (
              <div key={at} className="bar-chart-row" aria-hidden="true">
                <span className="bar-chart-category" />
                <div className="bar-chart-track">
                  <span
                    className="skeleton bar-chart-skeleton"
                    style={{ inlineSize: `${String(LOADING[at % LOADING.length])}%` }}
                  />
                </div>
                <span className="bar-chart-amounts" />
              </div>
            ))
          ) : isReady ? (
            categories.map((category, band) => (
              <div
                key={band}
                className="bar-chart-row"
                data-active={activeStop?.band === band ? '' : undefined}
              >
                <span className="bar-chart-category" aria-hidden="true">
                  {categoryTicks === undefined || categoryTicks.includes(band) ? category : null}
                </span>
                <div className="bar-chart-track">
                  {drawn.map((line, at) => {
                    const value = line.values[band];
                    if (!value) return null;
                    const mark = barMark({ band, series: at });
                    const { start, size } = barExtent(value.value, scale);
                    return (
                      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a bar is a stop of the roving tab index, and taking focus makes it the active bar
                      <span
                        key={at}
                        className="bar-chart-bar"
                        role="img"
                        aria-roledescription={labels.bar}
                        aria-labelledby={[
                          cellId(band, -1),
                          drawn.length > 1 ? cellId(-1, at) : '',
                          cellId(band, at),
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        data-color={colors[at]}
                        data-look={line.look ?? 'fill'}
                        data-sign={value.value > 0 ? 'positive' : value.value < 0 ? 'negative' : 'zero'}
                        data-nonzero={nonzero(value.value) ? '' : undefined}
                        data-active={active === mark ? '' : undefined}
                        tabIndex={chart.isInteractive ? (mark === stop ? 0 : -1) : undefined}
                        style={
                          {
                            insetInlineStart: percent(start),
                            inlineSize: percent(size),
                            '--bar-chart-place': drawn.length > 1 ? at : undefined,
                          } as CSSProperties
                        }
                        onFocus={(event) => {
                          focusedBar.current = event.currentTarget;
                          activate({ band, series: at }, 'key');
                        }}
                      />
                    );
                  })}
                </div>
                <span className="bar-chart-amounts" aria-hidden="true">
                  {showsAmount(band)
                    ? drawn.map((line, at) => {
                        const value = line.values[band];
                        return value ? (
                          <span key={at} className="bar-chart-amount">
                            {value.valueLabel}
                          </span>
                        ) : null;
                      })
                    : null}
                </span>
              </div>
            ))
          ) : (
            <div className="bar-chart-state">
              {statusContent ?? (
                <p className="bar-chart-message" data-tone={status === 'error' ? 'error' : undefined}>
                  {status === 'error' ? statusLabels.error : statusLabels.empty}
                </p>
              )}
            </div>
          )}
          {ticks.length > 0 ? (
            <div className="bar-chart-ticks" aria-hidden="true">
              {ticks.map((tick, at) => {
                const x = scale(tick.value);
                return (
                  <span
                    key={at}
                    className="bar-chart-tick"
                    data-edge={x <= 0 ? 'start' : x >= 100 ? 'end' : undefined}
                    style={{ insetInlineStart: percent(x) }}
                  >
                    {tick.label}
                  </span>
                );
              })}
            </div>
          ) : null}
          {activeStop === undefined || readout === null || chart.isReadoutHidden ? null : (
            <div
              className="bar-chart-readout"
              aria-hidden="true"
              data-align={readoutAlign(along)}
              data-place={readout.place}
              style={
                {
                  '--bar-chart-row': activeStop.band + 1,
                  '--bar-chart-row-narrow': activeStop.band * 2 + 2,
                  insetInlineStart: percent(along),
                  [readout.place === 'above' ? 'insetBlockEnd' : 'insetBlockStart']: '100%',
                } as CSSProperties
              }
            >
              <p className="bar-chart-readout-x">{categories[activeStop.band]}</p>
              <ul className="bar-chart-readout-list">
                {readings.map((reading) => (
                  <li key={reading.at} className="bar-chart-readout-item" data-color={reading.color}>
                    <span className="bar-chart-key" />
                    <strong className="bar-chart-readout-value">{reading.valueLabel}</strong>
                    <span className="bar-chart-readout-series">{reading.label}</span>
                  </li>
                ))}
                {total === null ? null : (
                  <li className="bar-chart-readout-item">
                    <strong className="bar-chart-readout-value">{total}</strong>
                    <span className="bar-chart-readout-series">{labels.total}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      {status === 'loading' ? null : (
        <ChartTable
          block="bar-chart"
          columns={[...drawn.map((line) => line.label), ...(totals ? [labels.total] : [])]}
          rows={categories}
          cell={(row, column) =>
            column < drawn.length ? drawn[column]?.values[row]?.valueLabel : (totals?.[row] ?? undefined)
          }
          id={cellId}
          name={name}
          view={shownView}
          labels={labels}
          onToggle={onToggle}
          hasToggle={isReady}
        />
      )}
      {/* The polite status, in the page from the first render so the word is heard when it arrives. */}
      <span className="bar-chart-status" role="status">
        {chart.isInteractive && status === 'loading'
          ? statusLabels.loading
          : chart.isInteractive && status === 'error'
            ? statusLabels.error
            : null}
      </span>
    </figure>
  );
}
