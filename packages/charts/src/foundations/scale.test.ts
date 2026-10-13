import { describe, expect, it } from 'vitest';
import { extent, linearScale, niceDomain } from './scale';

describe('linearScale', () => {
  it('stays finite for a domain wider than a number can hold, such as -1e308 to 1e308', () => {
    const scale = linearScale([-1e308, 1e308], [0, 100]);
    expect(scale(0)).toBe(50);
    expect(scale(1e308)).toBe(100);
    expect(scale(-1e308)).toBe(0);
  });

  it('maps the domain onto the range, an inverted range included', () => {
    expect(linearScale([0, 100], [0, 1])(25)).toBe(0.25);
    expect(linearScale([0, 100], [100, 0])(25)).toBe(75);
    expect(linearScale([10, 20], [100, 0])(20)).toBe(0);
    // Past the domain it keeps going: the scale does not clamp.
    expect(linearScale([0, 10], [0, 100])(-5)).toBe(-50);
  });

  it('maps every value to the middle of the range when the domain has no width', () => {
    expect(linearScale([5, 5], [100, 0])(5)).toBe(50);
    expect(linearScale([5, 5], [100, 0])(80)).toBe(50);
  });
});

describe('extent', () => {
  it('returns the least and the greatest finite value, ignoring NaN and Infinity', () => {
    expect(extent([12, 30, 4, 18])).toEqual([4, 30]);
    expect(extent([Number.NaN, 7, Number.POSITIVE_INFINITY, -2, Number.NEGATIVE_INFINITY])).toEqual([-2, 7]);
    expect(extent([5])).toEqual([5, 5]);
  });

  it('includes zero when asked', () => {
    expect(extent([12, 30], { includeZero: true })).toEqual([0, 30]);
    expect(extent([-12, -3], { includeZero: true })).toEqual([-12, 0]);
    expect(extent([12, 30], { includeZero: false })).toEqual([12, 30]);
  });

  it('returns undefined for no finite value', () => {
    expect(extent([])).toBeUndefined();
    expect(extent([Number.NaN, Number.POSITIVE_INFINITY])).toBeUndefined();
    expect(extent([], { includeZero: true })).toBeUndefined();
  });
});

describe('niceDomain', () => {
  it('rounds the domain outward to four steps of 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(niceDomain(0, 84.2)).toEqual([0, 100]);
    expect(niceDomain(0, 1284.5)).toEqual([0, 1500]);
    expect(niceDomain(-12, 30)).toEqual([-20, 40]);
    expect(niceDomain(0, 0.7)).toEqual([0, 0.8]);
    expect(niceDomain(0, 0.3)).toEqual([0, 0.3]);
    expect(niceDomain(0, 4)).toEqual([0, 4]);
  });

  it('gives [0, 1] for nothing and a domain from zero for one value', () => {
    expect(niceDomain(0, 0)).toEqual([0, 1]);
    expect(niceDomain(5, 5)).toEqual([0, 6]);
    expect(niceDomain(-5, -5)).toEqual([-6, 0]);
  });
});
