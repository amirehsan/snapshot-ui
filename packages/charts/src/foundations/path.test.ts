import { describe, expect, it } from 'vitest';
import { areaPath, linePath } from './path';

describe('linePath', () => {
  it('joins the points with straight segments', () => {
    expect(
      linePath([
        { x: 0, y: 100 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ]),
    ).toBe('M0 100L50 50L100 0');
  });

  it('starts a new subpath after a gap', () => {
    expect(linePath([{ x: 0, y: 10 }, { x: 50, y: 20 }, null, { x: 75, y: 30 }, { x: 100, y: 40 }])).toBe(
      'M0 10L50 20M75 30L100 40',
    );
  });

  it('draws a point alone between two gaps as a zero-length segment', () => {
    expect(linePath([{ x: 0, y: 10 }, null, { x: 50, y: 20 }, null])).toBe('M0 10L0 10M50 20L50 20');
  });

  it('writes at most three decimals and never -0', () => {
    expect(linePath([{ x: 33.33333, y: -0.0001 }])).toBe('M33.333 0L33.333 0');
    expect(
      linePath([
        { x: 66.6666, y: 12.5 },
        { x: 100, y: 1e-7 },
      ]),
    ).toBe('M66.667 12.5L100 0');
  });

  it('returns an empty path for no points', () => {
    expect(linePath([])).toBe('');
    expect(linePath([null, null])).toBe('');
  });
});

describe('areaPath', () => {
  it('closes the area under each run down to the baseline', () => {
    expect(
      areaPath(
        [
          { x: 0, y: 40 },
          { x: 50, y: 20 },
          { x: 100, y: 60 },
        ],
        100,
      ),
    ).toBe('M0 100L0 40L50 20L100 60L100 100Z');
    // With a gap, two closed shapes.
    expect(
      areaPath([{ x: 0, y: 40 }, { x: 25, y: 20 }, null, { x: 75, y: 30 }, { x: 100, y: 10 }], 100),
    ).toBe('M0 100L0 40L25 20L25 100ZM75 100L75 30L100 10L100 100Z');
    // A point alone draws none, beside a run or by itself.
    expect(areaPath([{ x: 0, y: 40 }, null, { x: 50, y: 20 }, { x: 100, y: 60 }], 100)).toBe(
      'M50 100L50 20L100 60L100 100Z',
    );
    expect(areaPath([{ x: 50, y: 20 }], 100)).toBe('');
    expect(areaPath([], 100)).toBe('');
  });
});
