import { describe, expect, it } from 'vitest';
import { linearScale } from '../foundations/scale';
import { bandCentre, barExtent, barMark, firstStop, moveBar, nonzero, type BarStop } from './geometry';

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

  it('keeps a value far outside the domain a number, a million past the track at most', () => {
    const { start, size } = barExtent(1e300, track([0, 100]));
    expect(start).toBe(0);
    expect(size).toBe(1e6);
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

  it("keeps the series on Home, End and Page where the band has one, else the band's first with a value", () => {
    expect(moveBar(TWO, { band: 2, series: 1 }, 'first')).toEqual({ band: 0, series: 1 });
    expect(moveBar(TWO, { band: 0, series: 0 }, 'last')).toEqual({ band: 2, series: 0 });
    expect(moveBar(TWO, { band: 2, series: 0 }, 'page-back')).toEqual({ band: 0, series: 0 });
    // The second row has no first series, so Home from the first series of row 2 lands on its first with a value.
    expect(moveBar(TWO.slice(2), { band: 2, series: 0 }, 'first')).toEqual({ band: 1, series: 1 });
  });

  it('stays where it is with nowhere to go', () => {
    expect(moveBar([], { band: 0, series: 0 }, 'next')).toEqual({ band: 0, series: 0 });
  });
});
