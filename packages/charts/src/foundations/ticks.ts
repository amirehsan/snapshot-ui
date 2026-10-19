/*
 * Which positions along a chart's category or time axis are labelled: pure, with no React and no DOM. Private
 * to the package.
 */

/** The first, the middle (Math.floor((count - 1) / 2)) and the last index, without repeats. */
export function defaultTicks(count: number): number[] {
  if (count < 1) return [];
  return [...new Set([0, Math.floor((count - 1) / 2), count - 1])];
}
