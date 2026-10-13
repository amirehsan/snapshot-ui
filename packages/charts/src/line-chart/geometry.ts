/*
 * The line chart's geometry and its moves: pure, with no React and no DOM, so the server draws the chart from
 * its props alone and the keys and the pointer are tested without a browser. Private to the package.
 */
import { extent, niceDomain } from '../foundations/scale';
import type { LineSeries } from './LineChart';

/** Where position `index` of `count` sits across the plot, 0 to 100, oldest at 0; one position sits at 50. */
export function xPosition(index: number, count: number): number {
  return count > 1 ? (index / (count - 1)) * 100 : 50;
}

/** Both ends finite, so a domain can be drawn. */
const finiteDomain = (domain: readonly [number, number] | undefined): domain is readonly [number, number] =>
  domain !== undefined && Number.isFinite(domain[0]) && Number.isFinite(domain[1]);

/**
 * `yDomain` as given, else niceDomain over the data with zero included; [0, 1] with no data. A nice domain
 * that would pass the largest number is the data's own extent instead, and a `yDomain` that is not finite is
 * ignored, so every coordinate stays a number.
 */
export function chartDomain(
  series: readonly LineSeries[],
  yDomain?: readonly [number, number],
): [number, number] {
  if (finiteDomain(yDomain)) return [yDomain[0], yDomain[1]];
  const values = series.flatMap(({ points }) => points.flatMap((point) => (point ? [point.value] : [])));
  const range = extent(values, { includeZero: true });
  if (!range) return [0, 1];
  const nice = niceDomain(range[0], range[1]);
  return finiteDomain(nice) ? nice : range;
}

/** The positions, below `count`, where at least one series has a point, in order. */
export function positionsWithData(series: readonly LineSeries[], count: number): number[] {
  const found: number[] = [];
  for (let index = 0; index < count; index++)
    if (series.some(({ points }) => points[index])) found.push(index);
  return found;
}

export type Move = 'next' | 'previous' | 'first' | 'last' | 'page-forward' | 'page-back';

/** How far Page Up and Page Down move: a week of days. */
const PAGE = 7;

/** Where a move from `from` lands among `withData`; `from` itself when there is nowhere to go. */
export function moveFrom(withData: readonly number[], from: number, move: Move): number {
  const first = withData[0];
  const last = withData.at(-1);
  if (first === undefined || last === undefined) return from;
  switch (move) {
    case 'first':
      return first;
    case 'last':
      return last;
    case 'next':
      return withData.find((index) => index > from) ?? from;
    case 'previous':
      return withData.findLast((index) => index < from) ?? from;
    // A week on, or the nearest day with data past it; the newest when there is none.
    case 'page-forward':
      return withData.find((index) => index >= from + PAGE) ?? Math.max(from, last);
    case 'page-back':
      return withData.findLast((index) => index <= from - PAGE) ?? Math.min(from, first);
  }
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

/** The first, the middle (Math.floor((count - 1) / 2)) and the last index, without repeats. */
export function defaultTicks(count: number): number[] {
  if (count < 1) return [];
  return [...new Set([0, Math.floor((count - 1) / 2), count - 1])];
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
