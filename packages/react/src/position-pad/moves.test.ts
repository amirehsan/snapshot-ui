import { describe, expect, it } from 'vitest';
import { PAD_POSITIONS, padMove, type PadKey, type PadPosition } from './moves';

const NONE = new Set<number>();

/** Where each key goes from each of the nine cells, in reading order, left to right; null stays. */
const LEFT_TO_RIGHT: Record<PadKey, (PadPosition | null)[]> = {
  ArrowRight: [
    'top-center',
    'top-end',
    'center-start',
    'center',
    'center-end',
    'bottom-start',
    'bottom-center',
    'bottom-end',
    'top-start',
  ],
  ArrowLeft: [
    'bottom-end',
    'top-start',
    'top-center',
    'top-end',
    'center-start',
    'center',
    'center-end',
    'bottom-start',
    'bottom-center',
  ],
  ArrowDown: [
    'center-start',
    'center',
    'center-end',
    'bottom-start',
    'bottom-center',
    'bottom-end',
    null,
    null,
    null,
  ],
  ArrowUp: [null, null, null, 'top-start', 'top-center', 'top-end', 'center-start', 'center', 'center-end'],
};

/** Right to left: Left and Right swap, since the row is drawn from the right; Up and Down are the same. */
const RIGHT_TO_LEFT: Record<PadKey, (PadPosition | null)[]> = {
  ArrowRight: LEFT_TO_RIGHT.ArrowLeft,
  ArrowLeft: LEFT_TO_RIGHT.ArrowRight,
  ArrowDown: LEFT_TO_RIGHT.ArrowDown,
  ArrowUp: LEFT_TO_RIGHT.ArrowUp,
};

const KEYS: PadKey[] = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];

const rows = (table: Record<PadKey, (PadPosition | null)[]>): [PadPosition, PadKey, PadPosition | null][] =>
  KEYS.flatMap((key) =>
    PAD_POSITIONS.map((position, at): [PadPosition, PadKey, PadPosition | null] => [
      position,
      key,
      table[key][at] ?? null,
    ]),
  );

const at = (position: PadPosition): number => PAD_POSITIONS.indexOf(position);
const named = (index: number | null): PadPosition | null =>
  index === null ? null : (PAD_POSITIONS[index] ?? null);

describe('PAD_POSITIONS', () => {
  it('lists the nine in reading order, top row first, start to end', () => {
    expect(PAD_POSITIONS).toEqual([
      'top-start',
      'top-center',
      'top-end',
      'center-start',
      'center',
      'center-end',
      'bottom-start',
      'bottom-center',
      'bottom-end',
    ]);
  });
});

describe('padMove', () => {
  it('has 36 moves in each direction', () => {
    expect(rows(LEFT_TO_RIGHT)).toHaveLength(36);
    expect(rows(RIGHT_TO_LEFT)).toHaveLength(36);
  });

  it.each(rows(LEFT_TO_RIGHT))('left to right, from %s, %s goes to %s', (from, key, to) => {
    expect(named(padMove(at(from), key, false, NONE))).toBe(to);
  });

  it.each(rows(RIGHT_TO_LEFT))('right to left, from %s, %s goes to %s', (from, key, to) => {
    expect(named(padMove(at(from), key, true, NONE))).toBe(to);
  });

  // The middle row disabled, as the DisabledPositions story draws it.
  const MIDDLE = new Set([at('center-start'), at('center'), at('center-end')]);

  it.each([
    ['top-end', 'ArrowRight', false, 'bottom-start'],
    ['bottom-start', 'ArrowLeft', false, 'top-end'],
    ['top-start', 'ArrowDown', false, 'bottom-start'],
    ['bottom-center', 'ArrowUp', false, 'top-center'],
    ['top-end', 'ArrowLeft', true, 'bottom-start'],
    ['bottom-start', 'ArrowRight', true, 'top-end'],
    ['top-end', 'ArrowDown', true, 'bottom-end'],
    ['top-center', 'ArrowRight', false, 'top-end'],
  ] as const)('skips the disabled middle row: from %s, %s (rtl %s) goes to %s', (from, key, isRtl, to) => {
    expect(named(padMove(at(from), key, isRtl, MIDDLE))).toBe(to);
  });

  it('stays at a column end when every cell that way is disabled', () => {
    const below = new Set([at('center'), at('bottom-center')]);
    expect(padMove(at('top-center'), 'ArrowDown', false, below)).toBeNull();
    expect(padMove(at('top-center'), 'ArrowUp', false, below)).toBeNull();
  });

  it('wraps past the last cell to the first enabled one', () => {
    const first = new Set([at('top-start')]);
    expect(named(padMove(at('bottom-end'), 'ArrowRight', false, first))).toBe('top-center');
    expect(named(padMove(at('top-center'), 'ArrowLeft', false, first))).toBe('bottom-end');
  });

  it('stays when every cell but the one it is on is disabled', () => {
    for (const position of PAD_POSITIONS) {
      const others = new Set(PAD_POSITIONS.filter((each) => each !== position).map(at));
      for (const key of KEYS) {
        expect(padMove(at(position), key, false, others), `${position} ${key}`).toBeNull();
        expect(padMove(at(position), key, true, others), `${position} ${key} rtl`).toBeNull();
      }
    }
  });
});
