/**
 * Rows first, then columns, in logical directions: `start` is the left in left to right and the right in right
 * to left.
 */
export type PadPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'center-start'
  | 'center'
  | 'center-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

/** The nine positions in reading order, top row first, start to end: the DOM order and the linear arrows' order. */
export const PAD_POSITIONS: readonly PadPosition[] = [
  'top-start',
  'top-center',
  'top-end',
  'center-start',
  'center',
  'center-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
];

/** The four keys the pad handles itself. */
export type PadKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

/**
 * Where an arrow goes from the cell at `from` (ruling 21). Left and Right run through all nine in reading order
 * and wrap, swapped in right to left; Up and Down move three on within the column and stop at its ends. Disabled
 * cells are skipped in the direction of travel; null means stay.
 */
export function padMove(
  from: number,
  key: PadKey,
  isRtl: boolean,
  disabled: ReadonlySet<number>,
): number | null {
  const forward = key === 'ArrowRight' ? !isRtl : key === 'ArrowLeft' ? isRtl : undefined;
  if (forward !== undefined) {
    for (let step = 1; step < 9; step++) {
      const next = (from + (forward ? step : 9 - step)) % 9;
      if (!disabled.has(next)) return next;
    }
    return null;
  }
  const delta = key === 'ArrowDown' ? 3 : -3;
  for (let next = from + delta; next >= 0 && next < 9; next += delta) {
    if (!disabled.has(next)) return next;
  }
  return null;
}
