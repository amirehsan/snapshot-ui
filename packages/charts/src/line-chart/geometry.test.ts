import { describe, expect, it } from 'vitest';
import {
  chartDomain,
  defaultTicks,
  moveFrom,
  nearestWithData,
  positionsWithData,
  readingsAt,
  xPosition,
} from './geometry';
import type { LineSeries } from './LineChart';

/** A series from values, a null for a gap, each labelled as a price. */
const series = (label: string, values: readonly (number | null)[]): LineSeries => ({
  label,
  points: values.map((value) => (value === null ? null : { value, valueLabel: `$${value.toFixed(2)}` })),
});

describe('xPosition', () => {
  it('places positions evenly from 0 to 100, and one position at 50', () => {
    expect([0, 1, 2, 3, 4].map((index) => xPosition(index, 5))).toEqual([0, 25, 50, 75, 100]);
    expect(xPosition(0, 2)).toBe(0);
    expect(xPosition(1, 2)).toBe(100);
    expect(xPosition(0, 1)).toBe(50);
  });
});

describe('chartDomain', () => {
  it('runs the domain from zero to the nice ceiling of the data, below zero for negative data, and takes yDomain as given', () => {
    expect(chartDomain([series('This month', [12, 84.2, null, 40])])).toEqual([0, 100]);
    expect(chartDomain([series('A', [-12, 4]), series('B', [30, null])])).toEqual([-20, 40]);
    expect(chartDomain([series('This month', [12, 84.2])], [0, 200])).toEqual([0, 200]);
  });

  it('is [0, 1] with no data', () => {
    expect(chartDomain([series('This month', [])])).toEqual([0, 1]);
    expect(chartDomain([series('This month', [null, null])])).toEqual([0, 1]);
  });

  it('stays finite for values near the largest number, and ignores a yDomain that is not', () => {
    // The nice ceiling of 1.7e308 is past the largest number, so the domain is the data's own extent.
    expect(chartDomain([series('A', [1.7e308, 2])])).toEqual([0, 1.7e308]);
    expect(chartDomain([series('A', [-1.7e308, 1.7e308])])).toEqual([-1.7e308, 1.7e308]);
    expect(chartDomain([series('A', [10, 84.2])], [0, Number.POSITIVE_INFINITY])).toEqual([0, 100]);
    expect(chartDomain([series('A', [10, 84.2])], [Number.NaN, 100])).toEqual([0, 100]);
  });
});

describe('positionsWithData', () => {
  it('lists the positions where any series has a point, and none past the shorter series', () => {
    const first = series('This month', [1, null, 3, null, null]);
    const second = series('Last month', [null, null, null, 4]);
    expect(positionsWithData([first, second], 5)).toEqual([0, 2, 3]);
    // Positions past the count are not drawn, so they are not reached.
    expect(positionsWithData([first, second], 3)).toEqual([0, 2]);
    expect(positionsWithData([series('Empty', [])], 4)).toEqual([]);
  });
});

describe('moveFrom', () => {
  const withData = [0, 1, 2, 5, 6, 9, 10, 11, 20];

  it('moves to the next and the previous position with data, skipping gaps, and stays at either end', () => {
    expect(moveFrom(withData, 2, 'next')).toBe(5);
    expect(moveFrom(withData, 5, 'previous')).toBe(2);
    expect(moveFrom(withData, 20, 'next')).toBe(20);
    expect(moveFrom(withData, 0, 'previous')).toBe(0);
    expect(moveFrom([], 3, 'next')).toBe(3);
  });

  it('goes to the first and the last position with data', () => {
    expect(moveFrom(withData, 6, 'first')).toBe(0);
    expect(moveFrom(withData, 6, 'last')).toBe(20);
    expect(moveFrom([], 6, 'last')).toBe(6);
  });

  it('moves seven back or forward and lands on data, or at the end', () => {
    // 2 + 7 is 9, which has data.
    expect(moveFrom(withData, 2, 'page-forward')).toBe(9);
    // 6 + 7 is 13, a gap: the nearest position with data past it is 20.
    expect(moveFrom(withData, 6, 'page-forward')).toBe(20);
    // 11 + 7 is 18: past it only 20, the last.
    expect(moveFrom(withData, 11, 'page-forward')).toBe(20);
    expect(moveFrom(withData, 20, 'page-forward')).toBe(20);
    // 20 - 7 is 13, a gap: the nearest position with data before it is 11.
    expect(moveFrom(withData, 20, 'page-back')).toBe(11);
    expect(moveFrom(withData, 9, 'page-back')).toBe(2);
    // 5 - 7 is past the start, so it lands on the first.
    expect(moveFrom(withData, 5, 'page-back')).toBe(0);
    expect(moveFrom(withData, 0, 'page-back')).toBe(0);
  });
});

describe('nearestWithData', () => {
  it('picks the position with data nearest a fraction of the width, the older on a tie, and none with no data', () => {
    // Five positions at 0, 25, 50, 75 and 100 percent; data at 0, 1 and 4.
    expect(nearestWithData([0, 1, 4], 5, 0)).toBe(0);
    expect(nearestWithData([0, 1, 4], 5, 0.3)).toBe(1);
    expect(nearestWithData([0, 1, 4], 5, 0.7)).toBe(4);
    // 0.625 of the width is position 2.5, as near 1 as 4 is not: 1.5 from 1 and 1.5 from 4, a tie, the older wins.
    expect(nearestWithData([0, 1, 4], 5, 0.625)).toBe(1);
    expect(nearestWithData([0, 4], 5, 0.5)).toBe(0);
    // A pointer just past either edge snaps to the end.
    expect(nearestWithData([0, 1, 4], 5, -0.1)).toBe(0);
    expect(nearestWithData([0, 1, 4], 5, 1.2)).toBe(4);
    expect(nearestWithData([0], 1, 0.9)).toBe(0);
    expect(nearestWithData([], 5, 0.5)).toBeUndefined();
  });
});

describe('defaultTicks', () => {
  it('ticks the first, the middle and the last position, without repeats', () => {
    expect(defaultTicks(31)).toEqual([0, 15, 30]);
    expect(defaultTicks(30)).toEqual([0, 14, 29]);
    expect(defaultTicks(3)).toEqual([0, 1, 2]);
    expect(defaultTicks(2)).toEqual([0, 1]);
    expect(defaultTicks(1)).toEqual([0]);
    expect(defaultTicks(0)).toEqual([]);
  });
});

describe('readingsAt', () => {
  it('reads each series with a point there, in order, leaving out a series with no point', () => {
    const first = series('This month', [84.2, null]);
    const second = series('Last month', [61, 90]);
    expect(readingsAt([first, second], 0)).toEqual([
      { series: 1, label: 'This month', valueLabel: '$84.20' },
      { series: 2, label: 'Last month', valueLabel: '$61.00' },
    ]);
    // A gap in the first series: only the second is read, and it keeps its own number.
    expect(readingsAt([first, second], 1)).toEqual([
      { series: 2, label: 'Last month', valueLabel: '$90.00' },
    ]);
    expect(readingsAt([first, second], 5)).toEqual([]);
  });
});
