import { describe, expect, it } from 'vitest';
import { valueDomain } from './domain';

describe('valueDomain', () => {
  it('runs from zero to the nice ceiling of the values, below zero for negative values, and takes the given domain as given', () => {
    expect(valueDomain([12, 84.2, 40])).toEqual([0, 100]);
    expect(valueDomain([-12, 4, 30])).toEqual([-20, 40]);
    expect(valueDomain([12, 84.2], [0, 200])).toEqual([0, 200]);
    // Given, it is not widened unless asked, and its order is kept.
    expect(valueDomain([12, 84.2], [50, 100])).toEqual([50, 100]);
    expect(valueDomain([12, 84.2], [100, 0])).toEqual([100, 0]);
  });

  it('is [0, 1] with no values, or none that is finite', () => {
    expect(valueDomain([])).toEqual([0, 1]);
    expect(valueDomain([Number.NaN, Number.POSITIVE_INFINITY])).toEqual([0, 1]);
  });

  it('stays finite for values near the largest number, and ignores a given domain that is not', () => {
    // The nice ceiling of 1.7e308 is past the largest number, so the domain is the values' own extent.
    expect(valueDomain([1.7e308, 2])).toEqual([0, 1.7e308]);
    expect(valueDomain([-1.7e308, 1.7e308])).toEqual([-1.7e308, 1.7e308]);
    expect(valueDomain([10, 84.2], [0, Number.POSITIVE_INFINITY])).toEqual([0, 100]);
    expect(valueDomain([10, 84.2], [Number.NaN, 100])).toEqual([0, 100]);
  });

  it('includes zero when asked, and returns the given domain widened to zero when asked', () => {
    // A domain from the values always holds zero, asked or not.
    expect(valueDomain([40, 84.2], undefined, { includeZero: true })).toEqual([0, 100]);
    expect(valueDomain([-40, -12], undefined, { includeZero: true })).toEqual([-40, 0]);
    expect(valueDomain([40, 84.2], undefined, { includeZero: false })).toEqual([0, 100]);
    // A given domain without zero reaches it at the near end, in the order it was given.
    expect(valueDomain([60], [50, 100], { includeZero: true })).toEqual([0, 100]);
    expect(valueDomain([-60], [-100, -50], { includeZero: true })).toEqual([-100, 0]);
    expect(valueDomain([60], [100, 50], { includeZero: true })).toEqual([100, 0]);
    // One that holds zero already is returned as it is.
    expect(valueDomain([60], [-10, 100], { includeZero: true })).toEqual([-10, 100]);
  });
});
