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
  type ReactNode,
  type Ref,
} from 'react';
import { ChartLegend } from '../foundations/ChartLegend';
import { ChartTable } from '../foundations/ChartTable';
import { coordinate, percent } from '../foundations/format';
import { hasModifier, isRightToLeft, moveFrom, type Move } from '../foundations/keys';
import { chartName } from '../foundations/naming';
import { areaPath, linePath, type PlotPoint } from '../foundations/path';
import { placeReadout, READOUT_GAP, readoutAlign } from '../foundations/readout';
import { linearScale } from '../foundations/scale';
import { DEFAULT_STATUS_LABELS, type ChartStatus, type ChartStatusLabels } from '../foundations/status';
import { useChartActive, type ChartSource } from '../foundations/useChartActive';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import {
  chartDomain,
  defaultTicks,
  nearestWithData,
  positionsWithData,
  readingsAt,
  xPosition,
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

/** The strings the chart writes itself. Give all four, so no default in English is left on the page. */
export interface LineChartLabels {
  showTable: string;
  showChart: string;
  /** Shown with scripts off, above the table: "Scripts are off, so the chart's data is in the table below." */
  noScript: string;
  /** What a screen reader calls the plot, its `aria-roledescription`: "chart". */
  roleDescription: string;
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
    /** @default { showTable: 'Show as table', showChart: 'Show as chart', noScript: "Scripts are off, so the chart's data is in the table below.", roleDescription: 'chart' } */
    labels?: LineChartLabels;
    /** Height of the plot in px. @default 240 */
    height?: number;
    /** Loading, empty or failed, drawn in the plot's own space at its height. @default 'ready' */
    status?: ChartStatus;
    /** Drawn in the plot's place for 'empty' and 'error', such as an EmptyState with a Retry button. */
    statusContent?: ReactNode;
    /** The three states' strings, apart from `labels`, so the four `labels` stay as they were. @default { loading: 'Loading', empty: 'Nothing to show for this period', error: 'The chart could not be loaded' } */
    statusLabels?: ChartStatusLabels;
    ref?: Ref<HTMLElement>;
  };

const DEFAULT_LABELS: LineChartLabels = {
  showTable: 'Show as table',
  showChart: 'Show as chart',
  noScript: "Scripts are off, so the chart's data is in the table below.",
  roleDescription: 'chart',
};

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
  status = 'ready',
  statusContent,
  statusLabels = DEFAULT_STATUS_LABELS,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: LineChartProps): ReactElement {
  const id = useId();
  const plotRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [announced, setAnnounced] = useState<number | null>(null);
  // A state draws in the plot's own space: no line, no legend, no toggle, no keys. The ready face is as it was.
  const isReady = status === 'ready';
  const shownView = isReady ? view : 'chart';

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
  const lines = isReady ? plotted.map((points) => linePath(points)) : [];
  const area = isReady && hasArea && plotted[0] ? areaPath(plotted[0], 100) : '';
  const [low, high] = [Math.min(...domain), Math.max(...domain)];
  const ticks = (yTicks ?? []).filter(({ value }) => Number.isFinite(value) && value >= low && value <= high);
  const xTicksShown = [...new Set(xTicks ?? defaultTicks(count))].filter(
    (index) => Number.isInteger(index) && index >= 0 && index < count,
  );

  // The first name that names something, aria-labelledby first. With neither, the series' column headers name
  // the plot, so the one tab stop is never a chart with no name.
  const headerId = (at: number): string => `${id}-series-${String(at + 1)}`;
  const name = chartName(
    { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy },
    drawn.map((_, at) => headerId(at)),
  );
  const { labelledBy, label } = name;

  // The active position, its source, the readout hidden by Escape, a touch held until a press outside the plot,
  // and the tab stop once scripts run. A position that has lost its data since it was set, by new props, is
  // not current and shows nothing; a pointer that already holds a position keeps it on focus, and otherwise
  // focus lands on the newest day with data.
  const {
    active,
    current: held,
    source,
    isReadoutHidden,
    isInteractive,
    activate: setActivePosition,
    clear,
    hideReadout,
    onFocus,
  } = useChartActive<number>({
    onFirstFocus: () => withData.at(-1) ?? null,
    isAvailable: (index) => withData.includes(index),
    within: plotRef,
  });
  // A state shows no position, and lets go of the one active and announced before it, so the ready face comes
  // back with none and says nothing stale.
  const current = isReady ? held : null;
  const [drawnStatus, setDrawnStatus] = useState(status);
  if (drawnStatus !== status) {
    setDrawnStatus(status);
    setAnnounced(null);
    clear();
  }

  const activate = (index: number, from: ChartSource): void => {
    // A pointer's position is not announced, so the region lets go of the last one: a key that lands back on
    // it is then a change the screen reader hears.
    if (from !== 'key') setAnnounced(null);
    setActivePosition(index, from);
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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // A key with Alt, Control or Meta is the browser's or the page's shortcut, never a move.
    if (hasModifier(event)) return;
    if (event.key === 'Escape') {
      // Stopped as well as prevented, since a React Aria overlay around the chart closes on any Escape that
      // reaches it. The next Escape, with nothing to hide, goes on to it.
      if (current !== null && !isReadoutHidden) {
        event.preventDefault();
        event.stopPropagation();
        hideReadout();
      }
      return;
    }
    const key = KEYS[event.key];
    const last = withData.at(-1);
    if (key === undefined || last === undefined) return;
    event.preventDefault();
    // A plot focused before it had data holds no position: a key starts at the newest, as focus would have.
    if (current === null) {
      activate(last, 'key');
      return;
    }
    const move = typeof key === 'function' ? key(isRightToLeft(event.currentTarget)) : key;
    activate(moveFrom(withData, current, move), 'key');
  };

  const onBlur = (): void => {
    clear();
    setAnnounced(null);
  };

  /** Activates the position with data nearest the pointer, read across the plot from its oldest side. */
  const snap = (event: PointerEvent<HTMLDivElement>, from: ChartSource): void => {
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

  const x = current === null ? 0 : xPosition(current, count);
  const readings = current === null ? [] : readingsAt(drawn, current);

  // The readout sits above the highest active dot, its bottom a gap over it, when the lines it holds fit
  // there; else under the lowest, so it covers none of them; else on the side with more room. Each dot's place,
  // the plot's height and the number of lines are known, so nothing is measured. A dot drawn past the plot
  // anchors at its edge.
  const dotYs =
    current === null
      ? []
      : plotted.flatMap((points) => {
          const mark = points[current];
          return mark ? [Math.min(Math.max(mark.y, 0), 100)] : [];
        });
  const readout = placeReadout({ marks: dotYs, height, lines: readings.length + 1, gap: READOUT_GAP });
  const readoutStyle =
    readout.place === 'above'
      ? { insetInlineStart: percent(x), insetBlockEnd: percent(readout.inset) }
      : { insetInlineStart: percent(x), insetBlockStart: percent(readout.inset) };
  const spoken = announced === null ? [] : readingsAt(drawn, announced);

  return (
    <figure
      {...rest}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cx('line-chart', className)}
      data-view={shownView}
      // Written only for a state, so the ready figure's markup is what it was before the states. No aria-busy:
      // its polite region is inside the plot, and a busy subtree's changes may go unheard.
      data-status={isReady ? undefined : status}
    >
      <div className="line-chart-chart" hidden={shownView === 'table'}>
        {isReady && drawn.length > 1 ? (
          <ChartLegend
            block="line-chart"
            items={drawn.map((line, at) => ({ label: line.label, series: at + 1 }))}
          />
        ) : null}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the chart is one tab stop that arrow keys move through (spec 9.2), the WAI-ARIA pattern for a composite with a roledescription */}
        <div
          ref={plotRef}
          className="line-chart-plot"
          role="group"
          aria-roledescription={labels.roleDescription}
          {...name.stop}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the same one tab stop: the rule reports the attribute's line
          tabIndex={isInteractive ? (isReady ? 0 : -1) : undefined}
          data-has-y-labels={ticks.length > 0 ? '' : undefined}
          data-active={current === null ? undefined : ''}
          style={{ blockSize: height }}
          onKeyDown={isReady ? onKeyDown : undefined}
          onFocus={() => {
            if (isReady) onFocus();
          }}
          onBlur={onBlur}
          onPointerMove={isReady ? onPointerMove : undefined}
          onPointerLeave={isReady ? onPointerLeave : undefined}
          onPointerDown={isReady ? onPointerDown : undefined}
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
          {/* A state in the plot's space, under the gridlines' labels: a still placeholder while loading, the
              app's content or a sentence when empty or failed. Nothing in the ready face. */}
          {status === 'loading' ? (
            <span className="skeleton line-chart-skeleton" aria-hidden="true" />
          ) : isReady ? null : (
            <div className="line-chart-state">
              {statusContent ?? (
                <p className="line-chart-message" data-tone={status === 'error' ? 'error' : undefined}>
                  {status === 'error' ? statusLabels.error : statusLabels.empty}
                </p>
              )}
            </div>
          )}
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
                    data-align={readoutAlign(x)}
                    data-place={readout.place}
                    style={readoutStyle}
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
              comes between the app's words. With `labels.roleDescription` given too, a Persian page hears no
              English from the chart. */}
          {/* The same region says a state once, in the page from the first render so the word is heard. */}
          <span className="line-chart-live" aria-live="polite" aria-atomic="true">
            {!isReady ? (
              isInteractive && status === 'loading' ? (
                statusLabels.loading
              ) : isInteractive && status === 'error' ? (
                statusLabels.error
              ) : null
            ) : announced === null ? null : (
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
      {/* The table of the same strings, its toggle, and with scripts off a shown copy that carries no ids. A
          state has no toggle, and loading no table. */}
      {status === 'loading' ? null : (
        <ChartTable
          block="line-chart"
          columns={drawn.map((line) => line.label)}
          rows={xLabels}
          cell={(row, column) => drawn[column]?.points[row]?.valueLabel}
          id={(row, column) => (row < 0 ? headerId(column) : undefined)}
          name={name}
          view={shownView}
          labels={labels}
          onToggle={onToggle}
          hasToggle={isReady}
        />
      )}
    </figure>
  );
}
