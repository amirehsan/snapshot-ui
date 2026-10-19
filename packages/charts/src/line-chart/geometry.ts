/*
 * The line chart's geometry and its moves: pure, with no React and no DOM, so the server draws the chart from
 * its props alone and the keys and the pointer are tested without a browser. Private to the package.
 */
import { valueDomain } from '../foundations/domain';
import type { LineSeries } from './LineChart';

// The moves live with the keys every chart shares, and the default ticks with the bar chart's time bands;
// re-exported so the line chart's geometry still reads whole.
export { moveFrom, type Move } from '../foundations/keys';
export { defaultTicks } from '../foundations/ticks';

/** Where position `index` of `count` sits across the plot, 0 to 100, oldest at 0; one position sits at 50. */
export function xPosition(index: number, count: number): number {
  return count > 1 ? (index / (count - 1)) * 100 : 50;
}

/**
 * `yDomain` as given, else niceDomain over the data with zero included; [0, 1] with no data. A nice domain
 * that would pass the largest number is the data's own extent instead, and a `yDomain` that is not finite is
 * ignored, so every coordinate stays a number (`valueDomain`).
 */
export function chartDomain(
  series: readonly LineSeries[],
  yDomain?: readonly [number, number],
): [number, number] {
  const values = series.flatMap(({ points }) => points.flatMap((point) => (point ? [point.value] : [])));
  return valueDomain(values, yDomain);
}

/** The positions, below `count`, where at least one series has a point, in order. */
export function positionsWithData(series: readonly LineSeries[], count: number): number[] {
  const found: number[] = [];
  for (let index = 0; index < count; index++)
    if (series.some(({ points }) => points[index])) found.push(index);
  return found;
}

/** The position with data nearest a fraction (0 to 1) of the plot's width from the oldest side; the older on a tie. */
export function nearestWithData(
  withData: readonly number[],
  count: number,
  fraction: number,
): number | undefined {
  const target = Math.min(Math.max(fraction, 0), 1) * Math.max(count - 1, 0);
  let nearest: number | undefined;
  for (const index of withData) {
    // In order, so a later position must be strictly nearer to win a tie.
    if (nearest === undefined || Math.abs(index - target) < Math.abs(nearest - target)) nearest = index;
  }
  return nearest;
}

/** What one series says at a position: which series, its label and its value, both the app's strings. */
export interface Reading {
  series: 1 | 2;
  label: string;
  valueLabel: string;
}

/**
 * Each series' point at `index`, in series order, leaving out a series with no point there. The readout and the
 * announcement both draw from it, each part an element of its own, so the library joins the app's words with
 * no punctuation of its own.
 */
export function readingsAt(series: readonly LineSeries[], index: number): Reading[] {
  return series.flatMap(({ label, points }, at) => {
    const point = points[index];
    return point ? [{ series: at === 0 ? 1 : 2, label, valueLabel: point.valueLabel }] : [];
  });
}
