/*
 * The bar chart's geometry and its moves: pure, with no React and no DOM, so the server draws every bar from the
 * props alone and the keys are tested without a browser. Private to the package.
 */
import type { ChartColor } from '../foundations/color';
import { moveFrom, type Move } from '../foundations/keys';
import { defaultTicks } from '../foundations/ticks';

/** A coordinate far past the track, for a value far outside the domain: drawn off the track, never at an infinity. */
const FAR = 1e6;

/** Three decimals at most, the most a chart writes into its HTML. */
const round = (value: number): number => Math.round(value * 1000) / 1000;

const clamp = (value: number): number => Math.min(Math.max(value, -FAR), FAR);

/**
 * A bar's place along the value axis, in percent: from `base` to `base + value`, so a positive bar starts at its
 * base and a negative one ends there. The base is zero for a bar and the running sum before it for a stack's
 * segment. `scale` maps a value onto 0 to 100 from the axis's start. Three decimals.
 */
export function barExtent(
  value: number,
  scale: (value: number) => number,
  base = 0,
): { start: number; size: number } {
  const zero = clamp(scale(base));
  const end = clamp(scale(base + value));
  return { start: round(Math.min(zero, end)), size: round(Math.abs(end - zero)) };
}

/** Band `index` of `count` is centred at (index + 0.5) / count of the category axis, in percent. */
export function bandCentre(index: number, count: number): number {
  return round(((index + 0.5) / count) * 100);
}

/**
 * The bands whose labels show, in order and once each: the ones asked for that are bands, else every one for
 * category bands and the first, the middle and the last for time bands.
 */
export function bandTicks(count: number, bands: 'category' | 'time', given?: readonly number[]): number[] {
  if (given === undefined)
    return bands === 'time' ? defaultTicks(count) : Array.from({ length: count }, (_, at) => at);
  return [...new Set(given)]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < count)
    .sort((a, b) => a - b);
}

/**
 * Each series' color, by meaning and then by place: a pinned `color` stays; filled series take ink, then slate;
 * a hatched series, the previous period, takes the first filled series' color, so it never reads as a second
 * category. A stack of peers takes the palette's slots in series order instead, hatched or not, and slate for
 * the fifth, the app's "Other"; the sixth and later are slate whatever they pin.
 */
export function seriesColors(
  series: readonly { color?: ChartColor; look?: 'fill' | 'hatched' }[],
  isStacked?: boolean,
): ChartColor[] {
  if (isStacked)
    return series.map(
      (line, at) =>
        (at < 5 ? line.color : null) ?? (at < 4 ? (`chart-${String(at + 1)}` as ChartColor) : 'slate'),
    );
  let filled = 0;
  const byPlace = series.map((line) => {
    if (line.look === 'hatched') return null;
    const place = filled++;
    return line.color ?? (place === 0 ? 'ink' : 'slate');
  });
  const first = byPlace.find((color) => color !== null) ?? 'ink';
  return series.map((line, at) => byPlace[at] ?? line.color ?? first);
}

/** Whether a value draws a bar of some length, which is then at least 1px. A zero is a bar of none. */
export function nonzero(value: number): boolean {
  return value !== 0;
}

/** A stack's segment: its run along the value axis, from the sum before it, and whether it ends its sign. */
export interface Segment {
  from: number;
  to: number;
  outer: boolean;
}

/**
 * Stacks by sign: in each band, positives from zero up in series order and negatives from zero down, so a stack
 * diverges at zero. Each segment runs from the running sum of its sign before it; the last nonzero segment of
 * each sign is the outermost, which alone takes the data end's corners. A zero sits where its sign has reached,
 * a segment of no length, never the outermost. `values[series][band]`; the result is `[series][band]`, with no
 * segment where a value is null or not finite.
 */
export function stackBySign(values: readonly (readonly (number | null)[])[]): Segment[][] {
  const bands = Math.max(0, ...values.map((row) => row.length));
  const out = values.map((): Segment[] => []);
  for (let band = 0; band < bands; band++) {
    // The running sum of each sign, and the series of its outermost segment so far.
    const sum = [0, 0];
    const last = [-1, -1];
    out.forEach((segments, series) => {
      const value = values[series]?.[band];
      if (value == null || !Number.isFinite(value)) return;
      const sign = value < 0 ? 1 : 0;
      const from = sum[sign] ?? 0;
      segments[band] = { from, to: from + value, outer: false };
      sum[sign] = from + value;
      if (value !== 0) last[sign] = series;
    });
    for (const series of last) {
      const segment = out[series]?.[band];
      if (segment) segment.outer = true;
    }
  }
  return out;
}

/** One bar, by its band (the category's index) and its series' index. */
export interface BarStop {
  band: number;
  series: number;
}

/** A bar's name as the active mark: a string, so it is compared with `===`. */
export function barMark(stop: BarStop): string {
  return `${String(stop.band)}:${String(stop.series)}`;
}

/**
 * Where Tab lands first: the first band with a value for category bands, the newest for time bands, and in it
 * the first series with a value. `series` are each series' values by band, null for no value. Null with none.
 */
export function firstStop(
  series: readonly (readonly unknown[])[],
  bands: 'category' | 'time',
): BarStop | null {
  const count = Math.max(0, ...series.map((values) => values.length));
  const order = Array.from({ length: count }, (_, at) => (bands === 'time' ? count - 1 - at : at));
  for (const band of order) {
    const at = series.findIndex((values) => values[band] != null);
    if (at !== -1) return { band, series: at };
  }
  return null;
}

/**
 * Where a move from `from` lands among `stops`, the bars with a value in drawn order. Next and previous step bar
 * by bar, through a group and on to the next band's first, or by band across stacks (`byBand`); first, last and
 * the pages move by band, as `moveFrom` does. A move by band keeps the series where the band has one and else
 * takes the band's nearest series with a value, the earlier on a tie. `from` itself when there is nowhere to go.
 */
export function moveBar(stops: readonly BarStop[], from: BarStop, move: Move, byBand?: boolean): BarStop {
  const at = stops.findIndex((stop) => stop.band === from.band && stop.series === from.series);
  if (!byBand && (move === 'next' || move === 'previous')) {
    return stops[at + (move === 'next' ? 1 : -1)] ?? from;
  }
  const band = moveFrom([...new Set(stops.map((stop) => stop.band))], from.band, move);
  let found = from;
  let distance = Infinity;
  for (const stop of stops) {
    const apart = Math.abs(stop.series - from.series);
    if (stop.band === band && apart < distance) {
      found = stop;
      distance = apart;
    }
  }
  return found;
}

/**
 * Where a move along `from`'s stack lands: the segment drawn beside it, toward greater values for a `step` of 1
 * and smaller for -1, by each segment's `level` along the value axis (the sum of its two ends will do); series
 * order between segments at one level. `from` itself at either end of its stack.
 */
export function moveAlong(
  stops: readonly BarStop[],
  from: BarStop,
  step: number,
  level: (stop: BarStop) => number,
): BarStop {
  const stack = stops.filter((stop) => stop.band === from.band).sort((a, b) => level(a) - level(b));
  return stack[stack.findIndex((stop) => stop.series === from.series) + step] ?? from;
}
