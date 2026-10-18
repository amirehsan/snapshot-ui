/*
 * Where a chart's readout goes, from known values: pure, with no React and no DOM, so nothing is measured.
 * Private to the package.
 */

/**
 * The readout's place, in px at the default text size: a line of `--text-small` (14px at 1.43), the panel's
 * padding and border, and the gap between it and the marks (`margin-block-*` in charts.css, the 6px radius of a
 * dot and 4px of air). Known before anything is drawn, so the place needs no measurement.
 */
export const READOUT_LINE = 20;
export const READOUT_EDGES = 14;
export const READOUT_GAP = 10;

/**
 * The readout sits above the highest active mark, its bottom a gap over it, when the lines it holds fit there;
 * else under the lowest, so it covers none of them; else on the side with more room, above on a tie. `marks`
 * are each mark's place down the plot, 0 at the top to 100 at the bottom, and `height` the plot's in px. The
 * inset is the panel's block end from the plot's bottom when above, its block start from the top when below,
 * in percent. With no marks it reads one at the top.
 */
export function placeReadout(input: { marks: readonly number[]; height: number; lines: number }): {
  place: 'above' | 'below';
  inset: number;
} {
  const { marks, height, lines } = input;
  const highest = marks.length > 0 ? Math.min(...marks) : 0;
  const lowest = marks.length > 0 ? Math.max(...marks) : 0;
  const needed = lines * READOUT_LINE + READOUT_EDGES + READOUT_GAP;
  const above = (highest / 100) * height;
  const below = ((100 - lowest) / 100) * height;
  const isAbove = above >= needed || (below < needed && above >= below);
  return isAbove ? { place: 'above', inset: 100 - highest } : { place: 'below', inset: lowest };
}

/**
 * How the readout hangs from its place along the plot, 0 to 100 from the start: centred in the middle half,
 * where half the plot lies on either side, or from the place inward in the outer quarters.
 */
export function readoutAlign(along: number): 'start' | 'center' | 'end' {
  return along < 25 ? 'start' : along > 75 ? 'end' : 'center';
}
