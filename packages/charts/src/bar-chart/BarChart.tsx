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
  moveAlong,
  moveBar,
  nearestStop,
  nonzero,
  seriesColors,
  stackBySign,
  type BarStop,
} from './geometry';

export type { ChartColor } from '../foundations/color';
export type { ChartStatus, ChartStatusLabels } from '../foundations/status';

/** One bar: the number places it, the string says it. */
export interface BarValue {
  value: number;
  /** Formatted: "$420.00", "-$1,240.00", "۴۲۰ دلار". */
  valueLabel: string;
  /**
   * Makes the bar a link to what it stands for, such as its transactions for the period shown: an anchor that
   * works before hydration, from a server page and with a modifier key, and its table cell links too. Data, so a
   * server component can pass it.
   */
  href?: string;
}

export interface BarSeries {
  /** "Groceries", "October", "Income". Names the series in the legend, the readout, each bar's name and the table. */
  label: string;
  /** One per category, aligned with `categories`. `null` is no value: no bar, skipped by the keys, an empty cell. */
  values: readonly (BarValue | null)[];
  /** Pins the series to a color, so it keeps it when another series is filtered out. @default ink, then slate; stacked, chart-1 to chart-4, then slate */
  color?: ChartColor;
  /** 'hatched' draws the series as the previous period: the color of the first filled series, striped, with its amounts in slate. Grouped charts only: a stack draws it as a fill, with a warning. @default 'fill' */
  look?: 'fill' | 'hatched';
}

/** Grouped bars hold one or two series side by side; stacked bars up to five end to end, the fifth the app's "Other". */
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
    /** Amounts: none, every bar, or the bands at these indexes. A stack shows its band's total from `totals`. @default 'all' for horizontal, 'none' for vertical */
    valueLabels?: 'none' | 'all' | readonly number[];
    /** Each band's total, formatted by the app, for the readout, a Total column in the table and a stack's labels. The chart never sums. */
    totals?: readonly (string | null)[];
    /** @default 'ready' */
    status?: ChartStatus;
    /** Drawn in the bars' place for 'empty' and 'error', such as an EmptyState with a Retry button. */
    statusContent?: ReactNode;
    /** Draws each stacked series' texture as well as its color: solid, stripes at 45 and 135 degrees, both, then solid slate. Always on in forced colors. @default false */
    hasTexture?: boolean;
    /** @default { showTable: 'Show as table', showChart: 'Show as chart', noScript: "Scripts are off, so the chart's data is in the table below.", roleDescription: 'chart', bar: 'bar', total: 'Total' } */
    labels?: BarChartLabels;
    /** @default { loading: 'Loading', empty: 'Nothing to show for this period', error: 'The chart could not be loaded' } */
    statusLabels?: ChartStatusLabels;
    /** The plot's height in px, vertical only; a horizontal chart is as tall as its rows. @default 240 */
    height?: number;
    /**
     * Called with a bar's band and series index when it is pressed: a click or a tap anywhere in its band, or
     * Enter, or Space on a bar with no `href`, which makes that bar a button. A linked bar's press goes on to its
     * link. A click with a modifier key or the middle button is the browser's, a new tab or window, never a press.
     */
    onBarPress?: (category: number, series: number) => void;
    /**
     * Opens a link's href through your router, as RouterProvider's `navigate` does: a plain click or Enter on a bar
     * or a table link calls it in place of the browser's navigation, and a click with a modifier key stays the
     * browser's. The charts import no React Aria, so they cannot read RouterProvider; pass it the same function.
     */
    navigate?: (href: string) => void;
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

/** A touch this long or longer is a hold, which shows the readout and follows no link: the platforms' long press. */
const HOLD = 500;

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
    onBarPress,
    navigate,
    onClick,
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
  // A stack of two or more: end to end by sign, in the palette; one series ignores the layout.
  const isStacked = layout === 'stacked' && drawn.length > 1;
  const group = isStacked ? 1 : drawn.length;
  const colors = seriesColors(drawn, isStacked);
  const lookOf = (at: number): 'fill' | 'hatched' => (isStacked ? undefined : drawn[at]?.look) ?? 'fill';
  // Each segment from the running sum of its sign before it, so the stacks diverge at zero.
  const stack = isStacked
    ? stackBySign(drawn.map((line) => line.values.map((value) => value?.value ?? null)))
    : [];
  /**
   * The texture's slot, from the color the series draws in: a palette slot's own number, slate's 5, so a pinned
   * "Other" is always the fifth look, and ink or gain by place.
   */
  const slotOf = (at: number): number | undefined =>
    isStacked
      ? colors[at] === 'slate'
        ? 5
        : Number(colors[at]?.slice(6)) || Math.min(at + 1, 5)
      : undefined;
  useWarnOnce(
    isStacked && drawn.length > 5 ? 'BarChart: a stack holds five series; any more draw in slate.' : null,
  );
  useWarnOnce(
    isStacked && drawn.some((line) => line.look === 'hatched')
      ? "BarChart: a stack draws look 'hatched' as a fill."
      : null,
  );

  // The domain always holds zero: a bar that starts anywhere else misstates its value. A stack's is its sums'.
  const domain = domainOf(
    isStacked
      ? stack.flat().map((segment) => segment.to)
      : drawn.flatMap((line) => line.values.flatMap((value) => (value ? [value.value] : []))),
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
  const hrefOf = (stop?: BarStop): string | undefined => stop && drawn[stop.series]?.values[stop.band]?.href;
  // The bars that link, each with a target in its band, in drawn order: the targets' order in the DOM.
  const linked = stops.filter((stop) => hrefOf(stop) !== undefined);
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
  // A bar whose value went away hands the stop to the nearest series of its band, else to the first stop.
  const [lastBand, lastSeries] = (chart.stop ?? '').split(':').map(Number);
  const near =
    chart.stop !== null && markedFor === key ? nearestStop(stops, lastBand ?? 0, lastSeries ?? 0) : undefined;
  const stop = near ? barMark(near) : first && barMark(first);
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

  // Focus parked on the group by a bar that left, for new categories, a new orientation, a status or new data,
  // or held by a bar that new categories made another's: once the chart is ready, it goes to the tab stop, the
  // new first bar for new categories, never the body. The group is never a tab stop and a press never focuses
  // it, so focus on it while ready is always parked. A layout effect after every commit, so focus moves before
  // the page paints, whatever changed.
  const shownKey = useRef(key);
  useLayoutEffect(() => {
    const before = shownKey.current;
    shownKey.current = key;
    const element = groupRef.current;
    const focused = element?.ownerDocument.activeElement ?? null;
    // Focus in the chart moves for new categories, since a bar they kept is now another category's.
    if (status === 'ready' && element?.contains(focused) && (before !== key || focused === element))
      element.querySelector<HTMLElement>('.bar-chart-bar[tabindex="0"]')?.focus();
  });

  /** The chart's bars, in the order of `stops`. */
  const barsOf = (group: Element): HTMLElement[] => [
    ...group.querySelectorAll<HTMLElement>('.bar-chart-bar'),
  ];

  /** The bar at `target`: a bar, or the bar a link's target in its band stands for. */
  const stopAt = (group: Element, target: EventTarget): BarStop | undefined => {
    const hit = (target as Element).closest('.bar-chart-hit');
    return hit
      ? linked[[...group.querySelectorAll('.bar-chart-hit')].indexOf(hit)]
      : stops[barsOf(group).indexOf(target as HTMLElement)];
  };

  // A touch's press: when it began, whether it is down, and whether it was held long enough to be a reading.
  const touch = useRef({ at: 0, down: false, held: false });

  // Focus a reader gave a link before the chart hydrated stays there, and that bar becomes the tab stop, so Tab
  // does not jump back to the first bar.
  useLayoutEffect(() => {
    const group = groupRef.current;
    const at = group ? barsOf(group).indexOf(group.ownerDocument.activeElement as HTMLElement) : -1;
    const found = stops[at];
    if (found) activate(found, 'key');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // A key with Alt, Control or Meta is the browser's or the page's shortcut, never a move.
    if (hasModifier(event)) return;
    // Enter on a link is the browser's click, which presses it; Space on a link scrolls nothing. A bar that
    // presses and does not link is a button, which both keys press.
    const pressed = stops[barsOf(event.currentTarget).indexOf(event.target as HTMLElement)];
    if (pressed && (event.key === ' ' || event.key === 'Enter')) {
      const isLink = hrefOf(pressed) !== undefined;
      if (isLink ? event.key === ' ' : onBarPress) event.preventDefault();
      if (!isLink) onBarPress?.(pressed.band, pressed.series);
      return;
    }
    if (event.key === 'Escape') {
      // Stopped as well as prevented, so a Dialog around the chart closes on the next Escape, not this one.
      if (chart.current !== null && !chart.isReadoutHidden) {
        event.preventDefault();
        event.stopPropagation();
        chart.hideReadout();
      }
      return;
    }
    // Across the bands, and in a stack also along it: Up and Down standing up, Left and Right lying down.
    const across = KEYS[event.key] ?? (isVertical ? ACROSS : DOWN)[event.key];
    const key = across ?? (isStacked ? (isVertical ? DOWN : ACROSS)[event.key] : undefined);
    const bars = barsOf(event.currentTarget);
    const from = stops[bars.indexOf(event.target as HTMLElement)];
    if (key === undefined || from === undefined) return;
    event.preventDefault();
    const move = typeof key === 'function' ? key(isRightToLeft(event.currentTarget)) : key;
    // Along a stack toward greater values: Up standing up, toward the drawn end lying down.
    const to = across
      ? moveBar(stops, from, move, isStacked)
      : moveAlong(stops, from, (move === 'next') !== isVertical ? 1 : -1, (at) => {
          const segment = stack[at.series]?.[at.band];
          return segment ? segment.from + segment.to : 0;
        });
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

  /**
   * Activates `band`'s bar under the pointer, or the band's first: read across the band where its bars stand
   * side by side, and along it where they lie one under the other or stack.
   */
  const snapTo = (
    band: number,
    bars: readonly Element[],
    event: PointerEvent<HTMLDivElement>,
    from: ChartSource,
  ): void => {
    const inBand = stops.filter((stop) => stop.band === band);
    // How far the pointer is from each bar's box, along the band in a stack and across it side by side: the
    // nearest is taken, so past a stack's end it is the outermost on that side of zero, and a pair is split at
    // its middle, as a linked band's targets are.
    let found = inBand[0];
    let nearest = Infinity;
    inBand.forEach((stop, at) => {
      const box = bars[at]?.getBoundingClientRect();
      if (!box) return;
      const apart =
        isVertical === isStacked
          ? Math.max(box.top - event.clientY, event.clientY - box.bottom, 0)
          : Math.max(box.left - event.clientX, event.clientX - box.right, 0);
      if (apart < nearest) {
        nearest = apart;
        found = stop;
      }
    });
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
    snapTo(band, [...(rows[band]?.querySelectorAll('.bar-chart-bar') ?? [])], event, from);
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
      event,
      from,
    );
  };

  /** The bar a link's target under the pointer stands for, so the readout says what a press opens; else the band's. */
  const snap = (event: PointerEvent<HTMLDivElement>, from: ChartSource): void => {
    const found = stopAt(event.currentTarget, event.target);
    if (found) activate(found, from);
    else (isVertical ? snapBand : snapRow)(event, from);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== 'touch') snap(event, 'pointer');
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== 'touch') return;
    touch.current = { at: event.timeStamp, down: true, held: false };
    snap(event, 'touch');
  };

  // A touch held past HOLD is a reading: its click follows nothing. A tap is a press.
  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'touch')
      touch.current = { at: 0, down: false, held: event.timeStamp - touch.current.at >= HOLD };
  };

  // A hold keeps the readout in view, not the platform's link menu; a mouse's menu, with its new tab, stays.
  const onContextMenu = (event: MouseEvent<HTMLDivElement>): void => {
    if (touch.current.down) event.preventDefault();
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

  /**
   * A press: a bar's, a link's target's, or with no link under it the band the pointer holds; then a link's
   * href through `navigate`. A click with a modifier key or another button is the browser's, a new tab or window;
   * a held touch is a reading.
   */
  const onFigureClick = (event: MouseEvent<HTMLElement>): void => {
    onClick?.(event);
    const group = groupRef.current;
    const isInGroup = group?.contains(event.target as Node);
    const held = touch.current.held;
    touch.current.held = false;
    if (held && isInGroup) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented || event.button !== 0 || hasModifier(event) || event.shiftKey) return;
    const pressed =
      group &&
      isInGroup &&
      (stopAt(group, event.target) ??
        (isPointer && hrefOf(activeStop) === undefined ? activeStop : undefined));
    if (pressed) onBarPress?.(pressed.band, pressed.series);
    const link = (event.target as Element).closest('a[href]');
    if (navigate && link) {
      event.preventDefault();
      navigate(link.getAttribute('href') ?? '');
    }
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
  // A stack's figures are its totals, since the chart never sums one.
  useWarnOnce(
    isStacked && !totals && shownLabels !== 'none'
      ? "BarChart: a stack is labelled by its totals; pass totals, or valueLabels 'none'."
      : null,
  );
  /**
   * The figures a band shows, where its amounts show: each bar's, at its end or in the amount column, or a
   * stack's total, at the far end of the side its band nets to.
   */
  const figuresOf = (band: number): { band: number; series: number; value: BarValue }[] => {
    if (!showsAmount(band)) return [];
    if (!isStacked)
      return drawn.flatMap((line, series) => {
        const value = line.values[band];
        return value ? [{ band, series, value }] : [];
      });
    const total = totals?.[band];
    const ends = stack.map((line) => line[band]?.to ?? 0);
    const [up, down] = [Math.max(0, ...ends), Math.min(0, ...ends)];
    return total == null
      ? []
      : [{ band, series: 0, value: { value: up + down < 0 ? down : up, valueLabel: total } }];
  };
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
    const extents = drawn.flatMap((line, at) => {
      const value = line.values[activeStop.band];
      return value
        ? [
            {
              // A stack's segment from the sum before it; a bar from zero.
              ...barExtent(value.value, scale, stack[at]?.[activeStop.band]?.from),
              isNegative: value.value < 0,
            },
          ]
        : [];
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
      // At the end farthest from zero of the row's bars, a stack's far end, along the track.
      let farthest = -1;
      for (const { start, size, isNegative } of extents) {
        const end = isNegative ? start : start + size;
        const far = Math.abs(end - scale(0));
        if (far > farthest) {
          farthest = far;
          along = Math.min(Math.max(end, 0), 100);
        }
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
              data-series={slotOf(reading.at)}
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

  /**
   * One bar, its name from its table cells and its place from zero, in percent, in either orientation, and with
   * an href its target in its band.
   */
  const bar = (band: number, at: number, value: BarValue): [ReactElement, ReactElement | null] => {
    const mark = barMark({ band, series: at });
    // A stack's segment from the sum before it; a bar from zero.
    const segment = stack[at]?.[band];
    const { start, size } = barExtent(value.value, scale, segment?.from);
    const isNegative = value.value < 0;
    // A segment that stands on another, which a gap starts.
    const isJoined = Boolean(segment?.from) && value.value !== 0;
    // Each bar is placed from its end at zero, so its least size grows from the line: a positive one from below,
    // a negative one from above. A segment on another is placed from its far end instead, so its least size
    // grows toward zero, over the segment under it, which drew before it, and the stack's end stays exact.
    const fromStart = isNegative !== isJoined;
    const place = isVertical
      ? {
          ...(fromStart
            ? { insetBlockStart: percent(start) }
            : { insetBlockEnd: percent(100 - start - size) }),
          blockSize: percent(size),
          '--bar-chart-centre': percent(bandCentre(band, count)),
          '--bar-chart-index': isStacked ? 0 : at,
        }
      : {
          ...(fromStart
            ? { insetInlineEnd: percent(100 - start - size) }
            : { insetInlineStart: percent(start) }),
          inlineSize: percent(size),
          '--bar-chart-index': group > 1 ? at : undefined,
        };
    const href = value.href;
    // A bar that links is an anchor, which says it is a link; one that only presses is a button; else an image.
    const Bar = href === undefined ? 'span' : 'a';
    const isFirst = stops.find((stop) => stop.band === band)?.series === at;
    // Its target in its band: the whole band for the band's first bar; for a second side by side the half
    // nearer it; for a segment on another its own run, the outermost of its sign on to the plot's edge. Each
    // written in the same percent as the bars, so nothing is measured.
    const farAtStart = isVertical !== isNegative;
    const run = isStacked && !isFirst;
    const across = isVertical
      ? {
          insetInlineStart: percent(isFirst || run ? (band / count) * 100 : bandCentre(band, count)),
          inlineSize: percent((isFirst || run ? 100 : 50) / count),
        }
      : { '--bar-chart-row': band + 1, '--bar-chart-row-narrow': band * 2 + (isFirst ? 1 : 2) };
    const along = run
      ? {
          [isVertical ? 'insetBlockStart' : 'insetInlineStart']:
            segment?.outer && farAtStart ? undefined : percent(start),
          [isVertical ? 'insetBlockEnd' : 'insetInlineEnd']:
            segment?.outer && !farAtStart ? undefined : percent(100 - start - size),
        }
      : {};
    return [
      <Bar
        key={at}
        ref={holdFocus}
        className="bar-chart-bar"
        href={href}
        role={href === undefined ? (onBarPress ? 'button' : 'img') : undefined}
        aria-roledescription={href === undefined && !onBarPress ? labels.bar : undefined}
        aria-labelledby={[cellId(band, -1), drawn.length > 1 ? cellId(-1, at) : '', cellId(band, at)]
          .filter(Boolean)
          .join(' ')}
        data-color={colors[at]}
        data-look={lookOf(at)}
        data-sign={signOf(value.value)}
        data-nonzero={nonzero(value.value) ? '' : undefined}
        data-series={slotOf(at)}
        // A stack's outermost segment of its sign keeps the data end's corners, and one on another takes a gap.
        data-outer={segment?.outer ? '' : undefined}
        data-joined={isJoined ? '' : undefined}
        data-active={active === mark ? '' : undefined}
        tabIndex={chart.isInteractive ? (mark === stop ? 0 : -1) : undefined}
        style={place}
        onFocus={() => {
          activate({ band, series: at }, 'key');
        }}
      />,
      href === undefined ? null : (
        // The pointer's way to the link, hidden from assistive technology, which reads the bar: never a stop.
        // eslint-disable-next-line jsx-a11y/anchor-has-content -- a press target over the band, aria-hidden: the bar beside it is the link a reader meets, named by its cells
        <a
          key={`${String(at)}-hit`}
          className="bar-chart-hit"
          href={href}
          aria-hidden="true"
          tabIndex={-1}
          data-whole={isFirst ? '' : undefined}
          style={{ ...across, ...along }}
        />
      ),
    ];
  };

  /**
   * A table cell's text, linked to its bar's href: one series links its category cells, as a row's link does,
   * and two or more link each value's cell, named as its bar is, by the row's header, the column's and itself.
   */
  const linkIn = (text: string | undefined, row: number, column: number): ReactNode => {
    const href =
      column < 0 === drawn.length < 2 ? hrefOf({ band: row, series: Math.max(column, 0) }) : undefined;
    return href === undefined ? (
      text
    ) : (
      <a
        className="link"
        href={href}
        aria-labelledby={
          column < 0 ? undefined : `${cellId(row, -1)} ${cellId(-1, column)} ${cellId(row, column)}`
        }
      >
        {text}
      </a>
    );
  };

  /** A band's bars, and its links' targets after them, series by series. */
  const barsIn = (band: number): [(ReactElement | null)[], (ReactElement | null)[]] => {
    const drawnBars = drawn.map((line, at) => {
      const value = line.values[band];
      return value ? bar(band, at, value) : [null, null];
    });
    return [drawnBars.map(([shown]) => shown), drawnBars.map(([, hit]) => hit)];
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
  const shownValues = isReady ? categories.flatMap((_, band) => figuresOf(band)) : [];
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
                  {barsIn(band).flat()}
                </div>
              ))
            : message}
        {shownValues.length > 0 ? (
          <div className="bar-chart-values" aria-hidden="true">
            {shownValues.map(({ band, series: at, value }) => {
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
          ? categories.map((category, band) => {
              const [shown, hits] = barsIn(band);
              return (
                <div
                  key={band}
                  className="bar-chart-row"
                  data-active={activeStop?.band === band ? '' : undefined}
                >
                  <span className="bar-chart-category" aria-hidden="true">
                    {labelled.includes(band) ? category : null}
                  </span>
                  <div className="bar-chart-track">{shown}</div>
                  <span className="bar-chart-amounts" aria-hidden="true">
                    {figuresOf(band).map(({ series: at, value }) => (
                      <span key={at} className="bar-chart-amount" data-look={lookOf(at)}>
                        {value.valueLabel}
                      </span>
                    ))}
                  </span>
                  {/* After the row's parts, so a target is the row's grid child and lies over its bars. */}
                  {hits}
                </div>
              );
            })
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
    ? ({ '--bar-chart-bands': bandCount, '--bar-chart-group': group } as CSSProperties)
    : ({
        '--bar-chart-rows': rowCount,
        '--bar-chart-rows-narrow': rowCount * 2,
        '--bar-chart-group': group,
      } as CSSProperties);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- the figure hears its links' clicks as they bubble, a bar's, a target's or a table link's, Enter's included, to press a bar and route a link
    <figure
      {...rest}
      aria-label={name.label}
      aria-labelledby={name.labelledBy}
      className={cx('bar-chart', className)}
      data-orientation={orientation}
      data-layout={isStacked ? 'stacked' : 'grouped'}
      data-view={shownView}
      data-status={status}
      data-texture={hasTexture ? '' : undefined}
      onClick={onFigureClick}
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
              series: slotOf(at),
              color: colors[at],
              look: lookOf(at) === 'hatched' ? 'hatched' : 'swatch',
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
            isVertical && (ticks.length > 0 || shownValues.some(({ value }) => value.value >= 0))
              ? ''
              : undefined
          }
          data-room-end={isVertical && shownValues.some(({ value }) => value.value < 0) ? '' : undefined}
          data-pointer={isPointer && active !== null ? '' : undefined}
          // Bars that are buttons take a press anywhere in their band; links take theirs on their targets.
          data-press={onBarPress && linked.length === 0 ? '' : undefined}
          style={groupStyle}
          onKeyDown={isReady ? onKeyDown : undefined}
          onBlur={isReady ? onBlur : undefined}
          onMouseDown={onMouseDown}
          onPointerMove={isReady ? onPointerMove : undefined}
          onPointerLeave={isReady ? onPointerLeave : undefined}
          onPointerDown={isReady ? onPointerDown : undefined}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onContextMenu={onContextMenu}
        >
          {isVertical ? plot : rows}
        </div>
      </div>
      {status === 'loading' ? null : (
        <ChartTable
          block="bar-chart"
          columns={[...drawn.map((line) => line.label), ...(totals ? [labels.total] : [])]}
          rows={categories.map((category, row) => linkIn(category, row, -1))}
          cell={(row, column) =>
            column < drawn.length
              ? linkIn(drawn[column]?.values[row]?.valueLabel, row, column)
              : (totals?.[row] ?? undefined)
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
