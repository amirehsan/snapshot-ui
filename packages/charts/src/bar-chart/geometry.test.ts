import { describe, expect, it } from 'vitest';
import { linearScale } from '../foundations/scale';
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

/** A horizontal track's scale: the domain onto 0 to 100 from the inline start. */
const track = (domain: readonly [number, number]): ((value: number) => number) =>
  linearScale(domain, [0, 100]);

describe('barExtent', () => {
  it.each([
    // [domain, value, start, size]
    [[0, 100], 40, 0, 40],
    [[0, 100], 0, 0, 0],
    [[0, 100], 100, 0, 100],
    // Zero sits at 25% of [-50, 150]: a positive bar starts there, a negative one ends there.
    [[-50, 150], 100, 25, 50],
    [[-50, 150], -50, 0, 25],
    [[-50, 150], -10, 20, 5],
    [[-50, 150], 0, 25, 0],
  ] as const)('places %j %d from zero: start %d, size %d', (domain, value, start, size) => {
    expect(barExtent(value, track(domain))).toEqual({ start, size });
  });

  it('writes three decimals at most, in a domain far wider than the values', () => {
    // 1 of 3000 is 0.0333...%, written as 0.033; a negative of 7 from a zero at 1/3 rounds the same way.
    expect(barExtent(1, track([0, 3000]))).toEqual({ start: 0, size: 0.033 });
    const { start, size } = barExtent(-7, track([-1000, 2000]));
    expect(start).toBe(33.1);
    expect(size).toBe(0.233);
    for (const number of [start, size]) expect(String(number)).toMatch(/^-?\d+(?:\.\d{1,3})?$/);
  });

  it("places a stack's segment from the running sum before it, its base", () => {
    // A segment of 30 on 100 of [0, 200]: from 50% to 65% of the track.
    expect(barExtent(30, track([0, 200]), 100)).toEqual({ start: 50, size: 15 });
    // A negative of -20 under -40 of [-100, 100]: from 30% back to 20%.
    expect(barExtent(-20, track([-100, 100]), -40)).toEqual({ start: 20, size: 10 });
  });

  it('keeps a value far outside the domain a number, a million past the track at most', () => {
    const { start, size } = barExtent(1e300, track([0, 100]));
    expect(start).toBe(0);
    expect(size).toBe(1e6);
  });
});

describe('barExtent, vertical', () => {
  /** A vertical plot's scale: the domain onto 100 at the bottom to 0 at the top. */
  const plot = (domain: readonly [number, number]): ((value: number) => number) =>
    linearScale(domain, [100, 0]);

  it.each([
    // [domain, value, start from the top, size]
    [[0, 100], 40, 60, 40],
    [[0, 100], 0, 100, 0],
    // Zero sits 75% down [-50, 150]: a positive bar ends there from above, a negative one starts there.
    [[-50, 150], 100, 25, 50],
    [[-50, 150], -50, 75, 25],
    [[-50, 150], 0, 75, 0],
  ] as const)('places %j %d from zero: top %d, size %d', (domain, value, start, size) => {
    expect(barExtent(value, plot(domain))).toEqual({ start, size });
  });
});

describe('bandTicks', () => {
  it('shows every category band and the first, middle and last time band by default', () => {
    expect(bandTicks(5, 'category')).toEqual([0, 1, 2, 3, 4]);
    expect(bandTicks(31, 'time')).toEqual([0, 15, 30]);
    expect(bandTicks(1, 'time')).toEqual([0]);
    expect(bandTicks(0, 'category')).toEqual([]);
  });

  it('takes the bands asked for once each, in order, and drops any that is not a band', () => {
    expect(bandTicks(12, 'time', [11, 0, 5, 5, -1, 12, 2.5])).toEqual([0, 5, 11]);
    expect(bandTicks(3, 'category', [])).toEqual([]);
  });
});

describe('seriesColors', () => {
  it('draws one series ink and two filled series ink and slate, by place', () => {
    expect(seriesColors([{}])).toEqual(['ink']);
    expect(seriesColors([{}, {}])).toEqual(['ink', 'slate']);
  });

  it('keeps a pinned color, such as gain for money that arrived', () => {
    expect(seriesColors([{ color: 'gain' }, { color: 'ink' }])).toEqual(['gain', 'ink']);
    expect(seriesColors([{}, { color: 'gain' }])).toEqual(['ink', 'gain']);
    // The place is the series' own, pinned or not: a second series is slate beside a pinned first.
    expect(seriesColors([{ color: 'gain' }, {}])).toEqual(['gain', 'slate']);
  });

  it("draws a hatched series in the first filled series' color, never as a second color", () => {
    expect(seriesColors([{}, { look: 'hatched' }])).toEqual(['ink', 'ink']);
    expect(seriesColors([{ color: 'gain' }, { look: 'hatched' }])).toEqual(['gain', 'gain']);
    // The previous period first: still the filled series' color, and the filled series is the one series.
    expect(seriesColors([{ look: 'hatched' }, {}])).toEqual(['ink', 'ink']);
    // A hatched series that pins a color keeps it; with no filled series, it is ink.
    expect(seriesColors([{}, { look: 'hatched', color: 'slate' }])).toEqual(['ink', 'slate']);
    expect(seriesColors([{ look: 'hatched' }])).toEqual(['ink']);
  });
});

describe('seriesColors, stacked', () => {
  it('takes the palette in order and slate for the fifth and every one after', () => {
    expect(
      seriesColors(
        Array.from({ length: 6 }, () => ({})),
        true,
      ),
    ).toEqual(['chart-1', 'chart-2', 'chart-3', 'chart-4', 'slate', 'slate']);
  });

  it('keeps a pinned color to the fifth, draws a hatched series as its slot, and the sixth slate whatever it pins', () => {
    expect(
      seriesColors(
        [{ color: 'chart-3' }, {}, { look: 'hatched' }, {}, { color: 'ink' }, { color: 'chart-1' }],
        true,
      ),
    ).toEqual(['chart-3', 'chart-2', 'chart-3', 'chart-4', 'ink', 'slate']);
  });
});

describe('stackBySign', () => {
  it('stacks positives up from zero and negatives down, each sign in series order, the outermost of each marked', () => {
    // values[series][band]: the first band mixes signs, the second starts below zero.
    expect(
      stackBySign([
        [40, -10],
        [30, 20],
        [-15, -5],
      ]),
    ).toEqual([
      [
        { from: 0, to: 40, outer: false },
        { from: 0, to: -10, outer: false },
      ],
      [
        { from: 40, to: 70, outer: true },
        { from: 0, to: 20, outer: true },
      ],
      [
        { from: 0, to: -15, outer: true },
        { from: -10, to: -15, outer: true },
      ],
    ]);
  });

  it('leaves no segment for a null, and skips it in the running sum', () => {
    const stack = stackBySign([
      [10, null],
      [null, 5],
      [20, 7],
    ]);
    expect(stack[0]?.[0]).toEqual({ from: 0, to: 10, outer: false });
    expect(stack[0]?.[1]).toBeUndefined();
    expect(stack[1]?.[0]).toBeUndefined();
    expect(stack[1]?.[1]).toEqual({ from: 0, to: 5, outer: false });
    expect(stack[2]?.[0]).toEqual({ from: 10, to: 30, outer: true });
    expect(stack[2]?.[1]).toEqual({ from: 5, to: 12, outer: true });
  });

  it('places a zero where its sign has reached, never as the outermost, and moves nothing', () => {
    expect(stackBySign([[10], [0], [5]])).toEqual([
      [{ from: 0, to: 10, outer: false }],
      [{ from: 10, to: 10, outer: false }],
      [{ from: 10, to: 15, outer: true }],
    ]);
    expect(stackBySign([[0], [-5]])).toEqual([
      [{ from: 0, to: 0, outer: false }],
      [{ from: 0, to: -5, outer: true }],
    ]);
  });

  it('makes one series each its own outermost segment', () => {
    expect(stackBySign([[10, -5, 0]])).toEqual([
      [
        { from: 0, to: 10, outer: true },
        { from: 0, to: -5, outer: true },
        { from: 0, to: 0, outer: false },
      ],
    ]);
  });

  it('leaves an empty band empty, and takes a value that is not finite as none', () => {
    const stack = stackBySign([
      [null, 4],
      [Number.NaN, 2],
    ]);
    expect(stack[0]?.[0]).toBeUndefined();
    expect(stack[1]?.[0]).toBeUndefined();
    expect(stack[1]?.[1]).toEqual({ from: 4, to: 6, outer: true });
    expect(stackBySign([])).toEqual([]);
  });
});

describe('bandCentre', () => {
  it('centres band i of n at (i + 0.5) / n of the axis, with three decimals', () => {
    expect(bandCentre(0, 4)).toBe(12.5);
    expect(bandCentre(3, 4)).toBe(87.5);
    expect(bandCentre(0, 3)).toBe(16.667);
    expect(bandCentre(0, 1)).toBe(50);
  });
});

describe('nonzero', () => {
  it('is false for zero only', () => {
    expect(nonzero(0)).toBe(false);
    expect(nonzero(-0)).toBe(false);
    expect(nonzero(0.001)).toBe(true);
    expect(nonzero(-3)).toBe(true);
  });
});

describe('barMark', () => {
  it('names a bar by its band and its series', () => {
    expect(barMark({ band: 3, series: 1 })).toBe('3:1');
  });
});

const v = (value: number): { value: number } => ({ value });

describe('firstStop', () => {
  // Two series over five bands; the first band has no value in either, the second only in the second series.
  const SERIES = [
    [null, null, v(3), v(4), null],
    [null, v(1), v(2), null, null],
  ];

  it('lands on the first band with a value for category bands, in its first series with one', () => {
    expect(firstStop(SERIES, 'category')).toEqual({ band: 1, series: 1 });
    expect(firstStop([[v(1), v(2)]], 'category')).toEqual({ band: 0, series: 0 });
  });

  it('lands on the newest band with a value for time bands', () => {
    expect(firstStop(SERIES, 'time')).toEqual({ band: 3, series: 0 });
  });

  it('skips leading nulls, and is null with no value at all', () => {
    expect(firstStop([[null, null, v(0)]], 'category')).toEqual({ band: 2, series: 0 });
    expect(firstStop([[null, null]], 'category')).toBeNull();
    expect(firstStop([], 'time')).toBeNull();
  });
});

describe('moveBar', () => {
  // One series over eleven rows, with no value at rows 2 and 3: the keys skip them, and a zero is a bar.
  const ONE: BarStop[] = [0, 1, 4, 5, 6, 7, 8, 9, 10].map((band) => ({ band, series: 0 }));

  it.each([
    ['next', { band: 0, series: 0 }, { band: 1, series: 0 }],
    ['next', { band: 1, series: 0 }, { band: 4, series: 0 }],
    ['next', { band: 10, series: 0 }, { band: 10, series: 0 }],
    ['previous', { band: 4, series: 0 }, { band: 1, series: 0 }],
    ['previous', { band: 0, series: 0 }, { band: 0, series: 0 }],
    ['first', { band: 7, series: 0 }, { band: 0, series: 0 }],
    ['last', { band: 1, series: 0 }, { band: 10, series: 0 }],
    // Seven rows on, or the nearest with a value past that; the last when there is none.
    ['page-forward', { band: 0, series: 0 }, { band: 7, series: 0 }],
    ['page-forward', { band: 5, series: 0 }, { band: 10, series: 0 }],
    ['page-back', { band: 10, series: 0 }, { band: 1, series: 0 }],
    ['page-back', { band: 5, series: 0 }, { band: 0, series: 0 }],
  ] as const)('moves %s from %j to %j in one series with gaps', (move, from, to) => {
    expect(moveBar(ONE, from, move)).toEqual(to);
  });

  // Two series over three rows: the second row has a value in the second series only.
  const TWO: BarStop[] = [
    { band: 0, series: 0 },
    { band: 0, series: 1 },
    { band: 1, series: 1 },
    { band: 2, series: 0 },
    { band: 2, series: 1 },
  ];

  it('moves through a group bar by bar in drawn order, then on to the next row', () => {
    expect(moveBar(TWO, { band: 0, series: 0 }, 'next')).toEqual({ band: 0, series: 1 });
    expect(moveBar(TWO, { band: 0, series: 1 }, 'next')).toEqual({ band: 1, series: 1 });
    expect(moveBar(TWO, { band: 2, series: 0 }, 'previous')).toEqual({ band: 1, series: 1 });
  });

  it('keeps the series on Home, End and Page where the band has one, else the nearest with a value', () => {
    expect(moveBar(TWO, { band: 2, series: 1 }, 'first')).toEqual({ band: 0, series: 1 });
    expect(moveBar(TWO, { band: 0, series: 0 }, 'last')).toEqual({ band: 2, series: 0 });
    expect(moveBar(TWO, { band: 2, series: 0 }, 'page-back')).toEqual({ band: 0, series: 0 });
    // The second row has no first series, so Home from the first series of row 2 lands on its first with a value.
    expect(moveBar(TWO.slice(2), { band: 2, series: 0 }, 'first')).toEqual({ band: 1, series: 1 });
  });

  it('stays where it is with nowhere to go', () => {
    expect(moveBar([], { band: 0, series: 0 }, 'next')).toEqual({ band: 0, series: 0 });
  });

  // Three series stacked over three bands: the second band has no third series, the third only the third.
  const STACKED: BarStop[] = [
    { band: 0, series: 0 },
    { band: 0, series: 1 },
    { band: 0, series: 2 },
    { band: 1, series: 0 },
    { band: 1, series: 1 },
    { band: 2, series: 2 },
  ];

  it.each([
    ['next', { band: 0, series: 1 }, { band: 1, series: 1 }],
    // The band beside has no third series: the nearest series with a value, the second.
    ['next', { band: 0, series: 2 }, { band: 1, series: 1 }],
    ['next', { band: 1, series: 0 }, { band: 2, series: 2 }],
    ['previous', { band: 2, series: 2 }, { band: 1, series: 1 }],
    ['previous', { band: 0, series: 1 }, { band: 0, series: 1 }],
    ['next', { band: 2, series: 2 }, { band: 2, series: 2 }],
    ['first', { band: 2, series: 2 }, { band: 0, series: 2 }],
    ['last', { band: 0, series: 0 }, { band: 2, series: 2 }],
  ] as const)('moves %s from %j to %j across stacks, by band', (move, from, to) => {
    expect(moveBar(STACKED, from, move, true)).toEqual(to);
  });
});

describe('nearestStop', () => {
  const STOPS: BarStop[] = [
    { band: 0, series: 0 },
    { band: 0, series: 3 },
    { band: 0, series: 4 },
    { band: 1, series: 2 },
  ];

  it('takes the series where the band has it, else the nearest, the earlier on a tie', () => {
    expect(nearestStop(STOPS, 0, 3)).toEqual({ band: 0, series: 3 });
    expect(nearestStop(STOPS, 0, 2)).toEqual({ band: 0, series: 3 });
    // 1 is as far from 0 as from 2, and the earlier wins.
    expect(nearestStop([...STOPS, { band: 0, series: 2 }].slice(1), 1, 1)).toEqual({ band: 1, series: 2 });
    expect(
      nearestStop(
        [
          { band: 0, series: 0 },
          { band: 0, series: 2 },
        ],
        0,
        1,
      ),
    ).toEqual({ band: 0, series: 0 });
  });

  it('finds nothing in a band with no bar', () => {
    expect(nearestStop(STOPS, 2, 0)).toBeUndefined();
  });
});

describe('moveAlong', () => {
  // One band's stack: the first series 0 to 40, the second 0 to -10, the third 40 to 60 and the fourth -10 to
  // -30, by level (from plus to): from the bottom, the fourth, the second, the first and the third.
  const LEVELS = [40, -10, 100, -40];
  const level = (stop: BarStop): number => (stop.band === 0 ? (LEVELS[stop.series] ?? 0) : 0);
  const STOPS: BarStop[] = [0, 1, 2, 3].map((series) => ({ band: 0, series }));
  const BESIDE = [...STOPS, { band: 1, series: 0 }];

  it.each([
    [{ band: 0, series: 0 }, 1, { band: 0, series: 2 }],
    [{ band: 0, series: 0 }, -1, { band: 0, series: 1 }],
    [{ band: 0, series: 1 }, -1, { band: 0, series: 3 }],
    [{ band: 0, series: 3 }, 1, { band: 0, series: 1 }],
  ] as const)('moves from %j by %d along its stack to %j', (from, step, to) => {
    expect(moveAlong(BESIDE, from, step, level)).toEqual(to);
  });

  it('stays at either end of its stack, never leaving its band', () => {
    expect(moveAlong(BESIDE, { band: 0, series: 3 }, -1, level)).toEqual({ band: 0, series: 3 });
    expect(moveAlong(BESIDE, { band: 0, series: 2 }, 1, level)).toEqual({ band: 0, series: 2 });
    expect(moveAlong(BESIDE, { band: 1, series: 0 }, 1, level)).toEqual({ band: 1, series: 0 });
  });

  it('keeps series order between segments at one level, such as a zero on the line', () => {
    const flat = (): number => 0;
    expect(moveAlong(STOPS, { band: 0, series: 1 }, 1, flat)).toEqual({ band: 0, series: 2 });
    expect(moveAlong(STOPS, { band: 0, series: 1 }, -1, flat)).toEqual({ band: 0, series: 0 });
  });
});
