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
 * A bar's place along the value axis, in percent: from zero to its value, so a positive bar starts at zero and a
 * negative one ends there. `scale` maps a value onto 0 to 100 from the axis's start. Three decimals.
 */
export function barExtent(value: number, scale: (value: number) => number): { start: number; size: number } {
  const zero = clamp(scale(0));
  const end = clamp(scale(value));
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
 * category.
 */
export function seriesColors(
  series: readonly { color?: ChartColor; look?: 'fill' | 'hatched' }[],
): ChartColor[] {
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
 * by bar, through a group and on to the next band's first; first, last and the pages move by band, as
 * `moveFrom` does, keeping the series where the band has one and else taking the band's first with a value.
 * `from` itself when there is nowhere to go.
 */
export function moveBar(stops: readonly BarStop[], from: BarStop, move: Move): BarStop {
  const at = stops.findIndex((stop) => stop.band === from.band && stop.series === from.series);
  if (move === 'next' || move === 'previous') {
    return stops[at + (move === 'next' ? 1 : -1)] ?? from;
  }
  const bands = [...new Set(stops.map((stop) => stop.band))];
  const band = moveFrom(bands, from.band, move);
  const inBand = stops.filter((stop) => stop.band === band);
  return inBand.find((stop) => stop.series === from.series) ?? inBand[0] ?? from;
}
