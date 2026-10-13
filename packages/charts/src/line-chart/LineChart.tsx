'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { areaPath, linePath, type PlotPoint } from '../foundations/path';
import { linearScale } from '../foundations/scale';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import {
  chartDomain,
  defaultTicks,
  moveFrom,
  nearestWithData,
  positionsWithData,
  readingsAt,
  xPosition,
  type Move,
} from './geometry';

export interface LinePoint {
  /** The y value, to draw. */
  value: number;
  /** The y value, formatted, for the readout and the table: "$84.20". */
  valueLabel: string;
}

export interface LineSeries {
  /** "This month", "Last month". Required: it names the series in the legend, the readout and the table. */
  label: string;
  /** One point per x position, aligned with `xLabels`. `null` is a gap, such as a future day. */
  points: readonly (LinePoint | null)[];
}

/** The strings the chart writes itself. Give all three, so no default in English is left on the page. */
export interface LineChartLabels {
  showTable: string;
  showChart: string;
  /** Shown with scripts off, above the table: "Scripts are off, so the chart's data is in the table below." */
  noScript: string;
}

export type LineChartProps = Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> &
  AriaName & {
    /** One or two series. The first is the story, drawn in ink; the second is context, drawn in slate. */
    series: readonly [LineSeries] | readonly [LineSeries, LineSeries];
    /** The x positions' labels, formatted: "Oct 1", "Oct 2". */
    xLabels: readonly string[];
    /** Which x labels the axis shows, by index. @default first, middle and last */
    xTicks?: readonly number[];
    /** The y gridlines and their labels, formatted. When absent the chart draws no y labels and relies on the readout and the table. */
    yTicks?: readonly { value: number; label: string }[];
    /** The y domain. @default from zero to the nice ceiling of the data */
    yDomain?: readonly [number, number];
    /** Fills under the first series. @default false */
    hasArea?: boolean;
    /** @default { showTable: 'Show as table', showChart: 'Show as chart', noScript: "Scripts are off, so the chart's data is in the table below." } */
    labels?: LineChartLabels;
    /** Height of the plot in px. @default 240 */
    height?: number;
    ref?: Ref<HTMLElement>;
  };

const DEFAULT_LABELS: LineChartLabels = {
  showTable: 'Show as table',
  showChart: 'Show as chart',
  noScript: "Scripts are off, so the chart's data is in the table below.",
};

/** What set the active position: a key or focus, which is announced, or a pointer, which is not. */
type Source = 'key' | 'pointer' | 'touch';

/** The keys the plot moves by. Left and Right follow the drawn direction, which right to left mirrors. */
const KEYS: Record<string, Move | ((rtl: boolean) => Move)> = {
  ArrowRight: (rtl) => (rtl ? 'previous' : 'next'),
  ArrowLeft: (rtl) => (rtl ? 'next' : 'previous'),
  Home: 'first',
  End: 'last',
  PageUp: 'page-back',
  PageDown: 'page-forward',
};

/** How long a position rests before it is announced, so a held key announces only where it stops. */
const REST = 150;

/** A coordinate far past the plot, for a value far outside the domain: drawn off the plot, never at an infinity. */
const FAR = 1e6;

/** A string that names something: given and not only spaces. */
const named = (text: string | undefined): text is string => text !== undefined && text.trim() !== '';

/** A number for an svg attribute: three decimals at most, and String writes -0 as 0. */
const coordinate = (value: number): string => String(Math.round(value * 1000) / 1000);

/** A percentage of the plot, for an HTML mark placed over the svg. */
const percent = (value: number): string => `${coordinate(value)}%`;

/**
 * Whether the drawing runs right to left: the nearest explicit `dir="ltr"` or `dir="rtl"`, the attribute
 * charts.css sets `--chart-flip` and `--chart-direction` from, so the keys and the pointer agree with what is
 * drawn. `dir="auto"` sets neither, so it is looked past, as the CSS looks past it.
 */
const isRightToLeft = (element: Element): boolean =>
  element.closest("[dir='ltr' i], [dir='rtl' i]")?.getAttribute('dir')?.toLowerCase() === 'rtl';

/**
 * The month as a line: one or two series drawn on the server in an svg stretched to the plot, with gridlines,
 * axis labels and a legend as HTML. The plot is one tab stop whose keys move a readout and a crosshair across
 * the positions with data, announced once they rest; a pointer snaps to the nearest position. A toggle under
 * the chart swaps the plot for a table of the same strings, and with scripts off that table is shown under the
 * plot. Every figure is the app's string; `value` only places a point.
 */
export function LineChart({
  series,
  xLabels,
  xTicks,
  yTicks,
  yDomain,
  hasArea = false,
  labels = DEFAULT_LABELS,
  height = 240,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: LineChartProps): ReactElement {
  const id = useId();
  const plotRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [active, setActive] = useState<number | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [isReadoutHidden, setReadoutHidden] = useState(false);
  const [announced, setAnnounced] = useState<number | null>(null);

  const count = xLabels.length;
  // The series as drawn: points past the x labels are dropped, and a value that is not a finite number is a
  // gap, as it is in the sparkline.
  const drawn: LineSeries[] = series.map(({ label, points }) => ({
    label,
    points: points.slice(0, count).map((point) => (point && Number.isFinite(point.value) ? point : null)),
  }));
  const withData = positionsWithData(drawn, count);
  const domain = chartDomain(drawn, yDomain);
  const scale = linearScale(domain, [100, 0]);
  const yOf = (value: number): number => Math.min(Math.max(scale(value), -FAR), FAR);
  const plotted = drawn.map(({ points }) =>
    points.map((point, index): PlotPoint | null =>
      point ? { x: xPosition(index, count), y: yOf(point.value) } : null,
    ),
  );
  const lines = plotted.map((points) => linePath(points));
  const area = hasArea && plotted[0] ? areaPath(plotted[0], 100) : '';
  const [low, high] = [Math.min(...domain), Math.max(...domain)];
  const ticks = (yTicks ?? []).filter(({ value }) => Number.isFinite(value) && value >= low && value <= high);
  const xTicksShown = [...new Set(xTicks ?? defaultTicks(count))].filter(
    (index) => Number.isInteger(index) && index >= 0 && index < count,
  );

  // The first name that names something, aria-labelledby first. With neither, the series' column headers name
  // the plot, so the one tab stop is never a chart with no name.
  const labelledBy = named(ariaLabelledBy) ? ariaLabelledBy : undefined;
  const label = labelledBy === undefined && named(ariaLabel) ? ariaLabel : undefined;
  const headerId = (at: number): string => `${id}-series-${String(at + 1)}`;
  const plotName =
    labelledBy !== undefined
      ? { 'aria-labelledby': labelledBy }
      : label !== undefined
        ? { 'aria-label': label }
        : { 'aria-labelledby': drawn.map((_, at) => headerId(at)).join(' ') };

  // A position that has lost its data since it was set, by new props, shows nothing.
  const current = active !== null && withData.includes(active) ? active : null;

  const activate = (index: number, from: Source): void => {
    setActive(index);
    setSource(from);
    setReadoutHidden(false);
  };

  const clear = (): void => {
    setActive(null);
    setSource(null);
  };

  // The rest before a key or a focus is announced; a new move restarts it, and blur or unmount cancels it.
  useEffect(() => {
    if (active === null || source !== 'key') return;
    const timer = window.setTimeout(() => {
      setAnnounced(active);
    }, REST);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active, source]);

  // A touch holds its position until a press anywhere outside the plot.
  useEffect(() => {
    const plot = plotRef.current;
    if (source !== 'touch' || !plot) return;
    const onPress = (event: globalThis.PointerEvent): void => {
      if (!(event.target instanceof Node && plot.contains(event.target))) {
        setActive(null);
        setSource(null);
      }
    };
    plot.ownerDocument.addEventListener('pointerdown', onPress);
    return () => {
      plot.ownerDocument.removeEventListener('pointerdown', onPress);
    };
  }, [source]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      if (current !== null && !isReadoutHidden) {
        event.preventDefault();
        setReadoutHidden(true);
      }
      return;
    }
    const key = KEYS[event.key];
    if (key === undefined || active === null) return;
    event.preventDefault();
    const move = typeof key === 'function' ? key(isRightToLeft(event.currentTarget)) : key;
    activate(moveFrom(withData, active, move), 'key');
  };

  const onFocus = (): void => {
    // A pointer that already holds a position keeps it; otherwise focus lands on the newest day with data.
    const last = withData.at(-1);
    if (active === null && last !== undefined) activate(last, 'key');
  };

  const onBlur = (): void => {
    clear();
    setAnnounced(null);
  };

  /** Activates the position with data nearest the pointer, read across the plot from its oldest side. */
  const snap = (event: PointerEvent<HTMLDivElement>, from: Source): void => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const across = width > 0 ? (event.clientX - left) / width : 0;
    const fraction = isRightToLeft(event.currentTarget) ? 1 - across : across;
    const index = nearestWithData(withData, count, fraction);
    if (index !== undefined) activate(index, from);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== 'touch') snap(event, 'pointer');
  };

  const onPointerLeave = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'touch') return;
    if (event.currentTarget.ownerDocument.activeElement !== event.currentTarget) clear();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'touch') snap(event, 'touch');
  };

  const onToggle = (): void => {
    clear();
    setView((shown) => (shown === 'chart' ? 'table' : 'chart'));
  };

  /** The table of the same strings. The noscript copy is shown and carries no ids, so the page has one of each. */
  const table = (isCopy: boolean): ReactElement => (
    <table className="line-chart-table" hidden={!isCopy && view === 'chart'} aria-labelledby={labelledBy}>
      {label === undefined ? null : <caption>{label}</caption>}
      <thead>
        <tr>
          <td />
          {drawn.map((line, at) => (
            <th key={at} scope="col" id={isCopy ? undefined : headerId(at)}>
              {line.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {xLabels.map((xLabel, index) => (
          <tr key={index}>
            <th scope="row">{xLabel}</th>
            {drawn.map((line, at) => (
              <td key={at}>{line.points[index]?.valueLabel}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const x = current === null ? 0 : xPosition(current, count);
  const readings = current === null ? [] : readingsAt(drawn, current);
  const spoken = announced === null ? [] : readingsAt(drawn, announced);

  return (
    <figure
      {...rest}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cx('line-chart', className)}
      data-view={view}
    >
      <div className="line-chart-chart" hidden={view === 'table'}>
        {drawn.length > 1 ? (
          <ul className="line-chart-legend">
            {drawn.map((line, at) => (
              <li key={at} className="line-chart-legend-item" data-series={at + 1}>
                <span className="line-chart-key" aria-hidden="true" />
                <span className="line-chart-legend-label">{line.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the chart is one tab stop that arrow keys move through (spec 9.2), the WAI-ARIA pattern for a composite with a roledescription */}
        <div
          ref={plotRef}
          className="line-chart-plot"
          role="group"
          aria-roledescription="chart"
          {...plotName}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the same one tab stop: the rule reports the attribute's line
          tabIndex={0}
          data-has-y-labels={ticks.length > 0 ? '' : undefined}
          data-active={current === null ? undefined : ''}
          style={{ blockSize: height }}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerDown={onPointerDown}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {ticks.map((tick, at) => (
              <line
                key={at}
                className="line-chart-grid"
                x1="0"
                x2="100"
                y1={coordinate(yOf(tick.value))}
                y2={coordinate(yOf(tick.value))}
              />
            ))}
            <line
              className="line-chart-baseline"
              x1="0"
              x2="100"
              y1={coordinate(yOf(low))}
              y2={coordinate(yOf(low))}
            />
            {area === '' ? null : <path className="line-chart-area" d={area} />}
            {/* The second series first, so the first, the story, draws on top. A series with no point draws none. */}
            {lines
              .map((d, at) => ({ d, at }))
              .reverse()
              .map(({ d, at }) =>
                d === '' ? null : <path key={at} className="line-chart-line" data-series={at + 1} d={d} />,
              )}
          </svg>
          <div className="line-chart-overlay" aria-hidden="true">
            {ticks.map((tick, at) => (
              <span key={at} className="line-chart-y-label" style={{ top: percent(yOf(tick.value)) }}>
                {tick.label}
              </span>
            ))}
            {current === null ? null : (
              <>
                <span className="line-chart-crosshair" style={{ insetInlineStart: percent(x) }} />
                {plotted.map((points, at) => {
                  const mark = points[current];
                  return mark ? (
                    <span
                      key={at}
                      className="line-chart-dot"
                      data-series={at + 1}
                      style={{ insetInlineStart: percent(mark.x), top: percent(mark.y) }}
                    />
                  ) : null;
                })}
                {isReadoutHidden ? null : (
                  <div
                    className="line-chart-readout"
                    data-align={x < 25 ? 'start' : x > 75 ? 'end' : 'center'}
                    style={{ insetInlineStart: percent(x) }}
                  >
                    <p className="line-chart-readout-x">{xLabels[current]}</p>
                    <ul className="line-chart-readout-list">
                      {readings.map((reading) => (
                        <li key={reading.series}>
                          <strong className="line-chart-readout-value">{reading.valueLabel}</strong>
                          <span className="line-chart-readout-series">{reading.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Each part is an element of its own, read as a line of its own, so no punctuation of the library's
              comes between the app's words: a Persian page hears only Persian. */}
          <span className="line-chart-live" aria-live="polite" aria-atomic="true">
            {announced === null ? null : (
              <>
                <span className="line-chart-live-part">{xLabels[announced]}</span>
                {spoken.map((reading) => (
                  <span key={reading.series} className="line-chart-live-part">
                    {reading.label} {reading.valueLabel}
                  </span>
                ))}
              </>
            )}
          </span>
        </div>
        <div className="line-chart-x" aria-hidden="true">
          {xTicksShown.map((index) => (
            <span
              key={index}
              className="line-chart-x-label"
              data-edge={
                count > 1 ? (index === 0 ? 'start' : index === count - 1 ? 'end' : undefined) : undefined
              }
              style={{ insetInlineStart: percent(xPosition(index, count)) }}
            >
              {xLabels[index]}
            </span>
          ))}
        </div>
      </div>
      {table(false)}
      <div className="line-chart-toolbar">
        <button type="button" className="button button-tertiary line-chart-toggle" onClick={onToggle}>
          {view === 'chart' ? labels.showTable : labels.showChart}
        </button>
      </div>
      <noscript>
        <p className="line-chart-noscript">{labels.noScript}</p>
        {table(true)}
      </noscript>
    </figure>
  );
}
