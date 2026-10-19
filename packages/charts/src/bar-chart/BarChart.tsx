'use client';

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
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
import { hasModifier, isRightToLeft, type Move } from '../foundations/keys';
import { chartName } from '../foundations/naming';
import { placeReadout, READOUT_GAP, readoutAlign } from '../foundations/readout';
import { linearScale } from '../foundations/scale';
import { DEFAULT_STATUS_LABELS, type ChartStatus, type ChartStatusLabels } from '../foundations/status';
import { useChartActive, type ChartSource } from '../foundations/useChartActive';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { useWarnOnce } from '../utils/warn-once';
import {
  bandCentre,
  bandTicks,
  barExtent,
  barMark,
  firstStop,
  moveBar,
  nonzero,
  seriesColors,
  type BarStop,
} from './geometry';

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
  /** 'hatched' draws the series as the previous period: the color of the first filled series, striped, with its amounts in slate. Grouped charts only. @default 'fill' */
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
    /** The bands' labels, formatted: "Oct", "Groceries", "Whole Foods Market", "Other". In the app's order: a ranked list is sorted by the app. */
    categories: readonly string[];
    /** @default 'vertical' */
    orientation?: 'vertical' | 'horizontal';
    /** Whether the bands are periods in order or peers. Time bands start the keys at the newest. @default 'category' */
    bands?: 'category' | 'time';
    /** Which category labels show, by index. @default every one for 'category'; first, middle and last for 'time' in a vertical chart */
    categoryTicks?: readonly number[];
    /** The value gridlines and their labels, formatted. Absent, no gridlines but the zero line and no value axis labels. */
    valueTicks?: readonly { value: number; label: string }[];
    /** The value domain. Always widened to include zero. @default from the least to the greatest value, zero included, rounded out */
    valueDomain?: readonly [number, number];
    /** Amounts: none, every bar, or the bands at these indexes. @default 'all' for horizontal, 'none' for vertical */
    valueLabels?: 'none' | 'all' | readonly number[];
    /** Each band's total, formatted by the app, for the readout and a Total column in the table. */
    totals?: readonly (string | null)[];
    /** @default 'ready' */
    status?: ChartStatus;
    /** Drawn in the bars' place for 'empty' and 'error', such as an EmptyState with a Retry button. */
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

/**
 * The keys a chart moves by, toward the bar drawn in that direction: Up and Down through a horizontal chart's
 * rows, Left and Right across a vertical chart's bands, mirrored in right to left. The other pair is no move.
 */
const KEYS: Record<string, Move | ((rtl: boolean) => Move)> = {
  Home: 'first',
  End: 'last',
  PageUp: 'page-back',
  PageDown: 'page-forward',
};

const ACROSS: Record<string, (rtl: boolean) => Move> = {
  ArrowRight: (rtl) => (rtl ? 'previous' : 'next'),
  ArrowLeft: (rtl) => (rtl ? 'next' : 'previous'),
};

const DOWN: Record<string, Move> = { ArrowDown: 'next', ArrowUp: 'previous' };

/** The loading rows' widths, in percent of the track, repeating: a list's shape, not a chart's. */
const LOADING = [70, 50, 85, 40];

/** The loading bands' heights, in percent of the plot, repeating: a bar chart's shape, not a list's. */
const LOADING_BANDS = [60, 85, 45, 70];

/** A row's least height in px, `--size-target`, which the readout's place is reckoned in. */
const ROW = 40;

/** A bar's sign, which its data end's corners and its figure's side are drawn by. */
const signOf = (value: number): 'positive' | 'negative' | 'zero' =>
  value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero';

/** One series' value at the active band, as the readout says it. */
interface Reading {
  at: number;
  label: string;
  valueLabel: string;
  color: ChartColor;
  look: 'fill' | 'hatched';
}

/**
 * Amounts as bars, drawn on the server as HTML. Standing up, a band per category or period with its bars from a
 * zero line, negatives below it, and its label under the plot; lying down, a row per category with its label at
 * the start, its bars from a zero line and its amounts in a column at the end. Two series sit side by side, and a
 * hatched one is the previous period in the same color. Each bar is a stop of a roving tab index, named by its
 * table cells, and the arrow keys move to the bar drawn in their direction; a pointer activates the band under
 * it. A toggle swaps the chart for a table of the same strings. Loading, empty and error draw in the bars'
 * place. Every figure is the app's string; `value` only places a bar, and the value axis always holds zero.
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
    valueLabels,
    totals,
    status = 'ready',
    statusContent,
    hasTexture = false,
    labels = DEFAULT_LABELS,
    statusLabels = DEFAULT_STATUS_LABELS,
    height = 240,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    defaultActive,
    ...rest
  } = props as DrawnProps;
  const id = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const isVertical = orientation === 'vertical';
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
  const colors = seriesColors(drawn);
  const lookOf = (at: number): 'fill' | 'hatched' => drawn[at]?.look ?? 'fill';

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
  // A vertical plot's y runs down, 100 at the bottom; a horizontal track's x from the inline start.
  const scale = linearScale(domain, isVertical ? [100, 0] : [0, 100]);
  const [low, high] = [Math.min(...domain), Math.max(...domain)];
  const zero = coordinate(scale(0));
  // The gridlines and their labels in every status, so the figure keeps its height when the data arrives.
  const ticks = (valueTicks ?? []).filter(
    ({ value }) => Number.isFinite(value) && value >= low && value <= high,
  );

  // The bars with a value, in drawn order: band by band, and in a band series by series. The DOM's order too.
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
    within: groupRef,
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

  /**
   * A bar's ref: one function for the chart's life, so React lets go of it only when the bar leaves the page. A
   * bar that leaves while it holds focus, to new categories, a new orientation or a status, first parks focus
   * on the group, focusable by script and never a tab stop, before React removes it, so focus never passes
   * through the body.
   */
  const holdFocus = useCallback((bar: HTMLElement | null) => {
    if (!bar) return;
    return () => {
      const group = groupRef.current;
      if (!group || bar.ownerDocument.activeElement !== bar) return;
      group.focus({ preventScroll: true });
    };
  }, []);

  // New categories, a new orientation or a status while a bar holds focus: once the chart is ready, focus goes
  // to its tab stop, the new first bar for new categories, never the body. A layout effect, so it moves before
  // the page paints.
  const shown = useRef({ key, status, orientation });
  useLayoutEffect(() => {
    const before = shown.current;
    shown.current = { key, status, orientation };
    const group = groupRef.current;
    if (!group || (before.key === key && before.status === status && before.orientation === orientation))
      return;
    const focused = group.ownerDocument.activeElement;
    // A bar kept by new categories is the same element, now another category's.
    const isStale =
      before.key !== key && focused instanceof HTMLElement && focused.classList.contains('bar-chart-bar');
    if (status !== 'ready' || !(isStale || focused === group)) return;
    group.querySelector<HTMLElement>('.bar-chart-bar[tabindex="0"]')?.focus();
  }, [key, status, orientation]);

  /** The chart's bars, in the order of `stops`. */
  const barsOf = (group: HTMLElement): HTMLElement[] => [
    ...group.querySelectorAll<HTMLElement>('.bar-chart-bar'),
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
    const key = KEYS[event.key] ?? (isVertical ? ACROSS : DOWN)[event.key];
    const bars = barsOf(event.currentTarget);
    const from = stops[bars.indexOf(event.target as HTMLElement)];
    if (key === undefined || from === undefined) return;
    event.preventDefault();
    const to = moveBar(
      stops,
      from,
      typeof key === 'function' ? key(isRightToLeft(event.currentTarget)) : key,
    );
    activate(to, 'key');
    bars[stops.indexOf(to)]?.focus();
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const to = event.relatedTarget;
    if (to instanceof Node && event.currentTarget.contains(to)) return;
    chart.clear();
  };

  // A press in the group focuses neither a bar nor the group, so a touch's hold and a pointer's band stay the
  // pointer's: the keys own focus, and a pointer never moves it. A state's own content, such as a Retry
  // button, keeps its press.
  const onMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
    if (!(event.target instanceof Element && event.target.closest('.bar-chart-state')))
      event.preventDefault();
  };

  /** Activates `band`'s bar under the pointer, read along `along` from each bar's box, or the band's first. */
  const snapTo = (
    band: number,
    bars: readonly Element[],
    under: (box: DOMRect) => boolean,
    from: ChartSource,
  ): void => {
    const inBand = stops.filter((stop) => stop.band === band);
    const stop = inBand.find((_, at) => {
      const box = bars[at]?.getBoundingClientRect();
      return box !== undefined && under(box);
    });
    const found = stop ?? inBand[0];
    if (found) activate(found, from);
  };

  /** A horizontal chart: the row under the pointer, read from each row's parts. */
  const snapRow = (event: PointerEvent<HTMLDivElement>, from: ChartSource): void => {
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
    snapTo(
      band,
      [...(rows[band]?.querySelectorAll('.bar-chart-bar') ?? [])],
      (box) => y >= box.top && y <= box.bottom,
      from,
    );
  };

  /** A vertical chart: the band under the pointer, from the inline start, or the nearest with a bar. */
  const snapBand = (event: PointerEvent<HTMLDivElement>, from: ChartSource): void => {
    const x = event.clientX;
    const box = event.currentTarget.querySelector('.bar-chart-bars')?.getBoundingClientRect();
    if (!box) return;
    const across = box.width > 0 ? (x - box.left) / box.width : 0;
    const fraction = isRightToLeft(event.currentTarget) ? 1 - across : across;
    const target = Math.min(Math.max(Math.floor(fraction * count), 0), count - 1);
    let band = -1;
    for (const stop of stops)
      if (band === -1 || Math.abs(stop.band - target) < Math.abs(band - target)) band = stop.band;
    snapTo(
      band,
      [
        ...(event.currentTarget
          .querySelectorAll('.bar-chart-band')
          [band]?.querySelectorAll('.bar-chart-bar') ?? []),
      ],
      (bar) => x >= bar.left && x <= bar.right,
      from,
    );
  };

  const snap = isVertical ? snapBand : snapRow;

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
  const shownLabels = valueLabels ?? (isVertical ? 'none' : 'all');
  const showsAmount = (band: number): boolean =>
    shownLabels === 'all' || (shownLabels !== 'none' && shownLabels.includes(band));
  const rowCount = isReady || count > 0 ? count : LOADING.length;
  const labelled = bandTicks(count, isVertical ? bands : 'category', categoryTicks);

  // The readout, from known values: above the active band's highest bar end when its lines fit and below its
  // lowest otherwise (vertical), or above or below the active row (horizontal), never over a bar.
  const readings: Reading[] =
    activeStop === undefined
      ? []
      : drawn.flatMap((line, at) => {
          const value = line.values[activeStop.band];
          return value
            ? [
                {
                  at,
                  label: line.label,
                  valueLabel: value.valueLabel,
                  color: colors[at] ?? 'ink',
                  look: lookOf(at),
                },
              ]
            : [];
        });
  const total = activeStop === undefined ? null : (totals?.[activeStop.band] ?? null);
  const lines = readings.length + 1 + (total === null ? 0 : 1);
  let along = 0;
  let readout: ReturnType<typeof placeReadout> | null = null;
  if (activeStop !== undefined) {
    const extents = drawn.flatMap((line) => {
      const value = line.values[activeStop.band];
      return value ? [{ ...barExtent(value.value, scale), isNegative: value.value < 0 }] : [];
    });
    if (isVertical) {
      along = bandCentre(activeStop.band, count);
      // Both ends of every bar in the band, so the panel clears them all, a negative bar's included.
      readout = placeReadout({
        marks: extents.flatMap(({ start, size }) =>
          [start, start + size].map((y) => Math.min(Math.max(y, 0), 100)),
        ),
        height,
        lines,
        gap: READOUT_GAP,
      });
    } else {
      // At the far end of the row's longest bar, along the track.
      let longest = -1;
      for (const { start, size, isNegative } of extents) {
        if (size <= longest) continue;
        longest = size;
        along = Math.min(Math.max(isNegative ? start : start + size, 0), 100);
      }
      readout = placeReadout({
        marks: [(activeStop.band / count) * 100, ((activeStop.band + 1) / count) * 100],
        height: count * ROW,
        lines,
        gap: READOUT_GAP,
      });
    }
  }

  const readoutPanel =
    activeStop === undefined || readout === null || chart.isReadoutHidden ? null : (
      <div
        className="bar-chart-readout"
        aria-hidden="true"
        data-align={readoutAlign(along)}
        data-place={readout.place}
        style={{
          ...(isVertical
            ? {}
            : { '--bar-chart-row': activeStop.band + 1, '--bar-chart-row-narrow': activeStop.band * 2 + 2 }),
          insetInlineStart: percent(along),
          [readout.place === 'above' ? 'insetBlockEnd' : 'insetBlockStart']: isVertical
            ? percent(readout.inset)
            : '100%',
        }}
      >
        <p className="bar-chart-readout-x">{categories[activeStop.band]}</p>
        <ul className="bar-chart-readout-list">
          {readings.map((reading) => (
            <li
              key={reading.at}
              className="bar-chart-readout-item"
              data-color={reading.color}
              data-look={reading.look}
            >
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
    );

  /** One bar, its name from its table cells and its place from zero, in percent, in either orientation. */
  const bar = (band: number, at: number, value: BarValue): ReactElement => {
    const mark = barMark({ band, series: at });
    const { start, size } = barExtent(value.value, scale);
    const isNegative = value.value < 0;
    // Each bar stands on zero: a negative one from its far end's side, so its least 1px runs from zero.
    const place = isVertical
      ? {
          ...(isNegative
            ? { insetBlockStart: percent(start) }
            : { insetBlockEnd: percent(100 - start - size) }),
          blockSize: percent(size),
          '--bar-chart-centre': percent(bandCentre(band, count)),
          '--bar-chart-index': at,
        }
      : {
          ...(isNegative
            ? { insetInlineEnd: percent(100 - start - size) }
            : { insetInlineStart: percent(start) }),
          inlineSize: percent(size),
          '--bar-chart-index': drawn.length > 1 ? at : undefined,
        };
    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a bar is a stop of the roving tab index, and taking focus makes it the active bar
      <span
        key={at}
        ref={holdFocus}
        className="bar-chart-bar"
        role="img"
        aria-roledescription={labels.bar}
        aria-labelledby={[cellId(band, -1), drawn.length > 1 ? cellId(-1, at) : '', cellId(band, at)]
          .filter(Boolean)
          .join(' ')}
        data-color={colors[at]}
        data-look={lookOf(at)}
        data-sign={signOf(value.value)}
        data-nonzero={nonzero(value.value) ? '' : undefined}
        data-active={active === mark ? '' : undefined}
        tabIndex={chart.isInteractive ? (mark === stop ? 0 : -1) : undefined}
        style={place}
        onFocus={() => {
          activate({ band, series: at }, 'key');
        }}
      />
    );
  };

  const message = (
    <div className="bar-chart-state">
      {statusContent ?? (
        <p className="bar-chart-message" data-tone={status === 'error' ? 'error' : undefined}>
          {status === 'error' ? statusLabels.error : statusLabels.empty}
        </p>
      )}
    </div>
  );

  /** A line at a value: across the plot standing up, along every row's track lying down. */
  const lineAt = (at: string): Record<'x1' | 'x2' | 'y1' | 'y2', string> =>
    isVertical ? { x1: '0', x2: '100', y1: at, y2: at } : { x1: at, x2: at, y1: '0', y2: '100' };

  // The gridlines and the zero line.
  const gridlines = (
    <div className="bar-chart-gridlines" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        {ticks.map((tick, at) => (
          <line key={at} className="bar-chart-grid" {...lineAt(coordinate(scale(tick.value)))} />
        ))}
        <line
          className="bar-chart-baseline"
          data-crosses={low < 0 && high > 0 ? '' : undefined}
          {...lineAt(zero)}
        />
      </svg>
    </div>
  );

  // The vertical plot keeps room outside the bars' ends for the labels it shows, and for the top gridline's.
  const shownValues = isReady
    ? stops
        .filter((at) => showsAmount(at.band))
        .map((at) => ({ ...at, value: drawn[at.series]?.values[at.band] }))
    : [];
  const bandCount = isReady || count > 0 ? count : LOADING_BANDS.length;

  // Standing up, the plot is a grid: the gridlines' labels in a column at the start as wide as the widest, the
  // bars' box beside them at the plot's height, and the category labels under the bars. The gridlines run
  // under both columns, so each label sits above its line as a line chart's does and no bar crosses a label.
  const plot = (
    <>
      {gridlines}
      {ticks.length > 0 ? (
        <div className="bar-chart-y-labels" aria-hidden="true">
          {ticks.map((tick, at) => (
            <span
              key={at}
              className="bar-chart-y-label"
              style={{ insetBlockStart: percent(scale(tick.value)) }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="bar-chart-bars" style={{ blockSize: height }}>
        {status === 'loading'
          ? Array.from({ length: bandCount }, (_, at) => (
              <span
                key={at}
                className="skeleton bar-chart-skeleton"
                aria-hidden="true"
                style={
                  {
                    blockSize: `${String(LOADING_BANDS[at % LOADING_BANDS.length])}%`,
                    '--bar-chart-centre': percent(bandCentre(at, bandCount)),
                  } as CSSProperties
                }
              />
            ))
          : isReady
            ? categories.map((_, band) => (
                <div
                  key={band}
                  className="bar-chart-band"
                  data-active={activeStop?.band === band ? '' : undefined}
                >
                  {drawn.map((line, at) => {
                    const value = line.values[band];
                    return value ? bar(band, at, value) : null;
                  })}
                </div>
              ))
            : message}
        {shownValues.length > 0 ? (
          <div className="bar-chart-values" aria-hidden="true">
            {shownValues.map(({ band, series: at, value }) => {
              if (!value) return null;
              const { start, size } = barExtent(value.value, scale);
              const isNegative = value.value < 0;
              // Outside the data end: above a positive bar's top, below a negative bar's bottom.
              const place = {
                ...(isNegative
                  ? { insetBlockStart: percent(start + size) }
                  : { insetBlockEnd: percent(100 - start) }),
                '--bar-chart-centre': percent(bandCentre(band, count)),
                '--bar-chart-index': at,
              };
              return (
                <span
                  key={`${String(band)}:${String(at)}`}
                  className="bar-chart-value"
                  data-sign={signOf(value.value)}
                  data-look={lookOf(at)}
                  data-keep={shownLabels !== 'all' || band === 0 || band === count - 1 ? '' : undefined}
                  style={place}
                >
                  <span className="bar-chart-value-text">{value.valueLabel}</span>
                </span>
              );
            })}
          </div>
        ) : null}
        {readoutPanel}
      </div>
      {/* Past eight bands a narrow chart shows every third category label; eight or fewer keep them all. */}
      <div
        className="bar-chart-categories"
        aria-hidden="true"
        data-bands={bands}
        data-dense={bandCount > 8 ? '' : undefined}
      >
        {bands === 'time'
          ? labelled.map((band) => (
              <span
                key={band}
                className="bar-chart-band-label"
                data-edge={
                  count > 1 ? (band === 0 ? 'start' : band === count - 1 ? 'end' : undefined) : undefined
                }
                style={{ insetInlineStart: percent(bandCentre(band, count)) }}
              >
                {categories[band]}
              </span>
            ))
          : categories.map((category, band) => (
              <span key={band} className="bar-chart-band-label" data-third={band % 3 === 0 ? '' : undefined}>
                {labelled.includes(band) ? category : null}
              </span>
            ))}
      </div>
    </>
  );

  const rows = (
    <>
      {gridlines}
      {status === 'loading'
        ? Array.from({ length: rowCount }, (_, at) => (
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
        : isReady
          ? categories.map((category, band) => (
              <div
                key={band}
                className="bar-chart-row"
                data-active={activeStop?.band === band ? '' : undefined}
              >
                <span className="bar-chart-category" aria-hidden="true">
                  {labelled.includes(band) ? category : null}
                </span>
                <div className="bar-chart-track">
                  {drawn.map((line, at) => {
                    const value = line.values[band];
                    return value ? bar(band, at, value) : null;
                  })}
                </div>
                <span className="bar-chart-amounts" aria-hidden="true">
                  {showsAmount(band)
                    ? drawn.map((line, at) => {
                        const value = line.values[band];
                        return value ? (
                          <span key={at} className="bar-chart-amount" data-look={lookOf(at)}>
                            {value.valueLabel}
                          </span>
                        ) : null;
                      })
                    : null}
                </span>
              </div>
            ))
          : message}
      {valueTicks !== undefined && valueTicks.length > 0 ? (
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
      {readoutPanel}
    </>
  );

  const groupStyle = isVertical
    ? ({ '--bar-chart-bands': bandCount, '--bar-chart-group': drawn.length } as CSSProperties)
    : ({
        '--bar-chart-rows': rowCount,
        '--bar-chart-rows-narrow': rowCount * 2,
        '--bar-chart-group': drawn.length,
      } as CSSProperties);

  return (
    <figure
      {...rest}
      aria-label={name.label}
      aria-labelledby={name.labelledBy}
      className={cx('bar-chart', className)}
      data-orientation={orientation}
      data-layout={layout}
      data-view={shownView}
      data-status={status}
      data-texture={hasTexture ? '' : undefined}
    >
      {/* Busy while loading, the chart's view only: the polite status after it stays outside, so it is heard. */}
      <div
        className="bar-chart-chart"
        hidden={shownView === 'table'}
        aria-busy={status === 'loading' ? true : undefined}
      >
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
          ref={groupRef}
          className={isVertical ? 'bar-chart-plot' : 'bar-chart-rows'}
          role="group"
          aria-roledescription={labels.roleDescription}
          {...name.stop}
          // Focusable by script and never a tab stop, in every status: it holds focus while a focused bar is gone,
          // so a status or new categories never drop focus to the body. An attribute that came and went with the
          // status was taken away in the commit before the effect that moves focus on, and blurred the group.
          tabIndex={chart.isInteractive ? -1 : undefined}
          data-room-start={
            isVertical && (ticks.length > 0 || shownValues.some(({ value }) => value && value.value >= 0))
              ? ''
              : undefined
          }
          data-room-end={
            isVertical && shownValues.some(({ value }) => value && value.value < 0) ? '' : undefined
          }
          data-pointer={isPointer && active !== null ? '' : undefined}
          style={groupStyle}
          onKeyDown={isReady ? onKeyDown : undefined}
          onBlur={isReady ? onBlur : undefined}
          onMouseDown={onMouseDown}
          onPointerMove={isReady ? onPointerMove : undefined}
          onPointerLeave={isReady ? onPointerLeave : undefined}
          onPointerDown={isReady ? onPointerDown : undefined}
        >
          {isVertical ? plot : rows}
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
