import { describe, expect, it } from 'vitest';
import { coordinate, percent } from './format';

describe('coordinate', () => {
  it('writes three decimals at most, with no trailing zeros', () => {
    expect(coordinate(33.333333)).toBe('33.333');
    expect(coordinate(66.6666667)).toBe('66.667');
    expect(coordinate(15.8)).toBe('15.8');
    expect(coordinate(100)).toBe('100');
    expect(coordinate(0.0004)).toBe('0');
    expect(coordinate(-12.3456)).toBe('-12.346');
  });

  it('writes -0 as 0, and a value that rounds to it too', () => {
    expect(coordinate(-0)).toBe('0');
    expect(coordinate(-0.0001)).toBe('0');
  });
});

describe('percent', () => {
  it('writes a coordinate as a percentage of the plot', () => {
    expect(percent(33.333333)).toBe('33.333%');
    expect(percent(0)).toBe('0%');
    expect(percent(-0)).toBe('0%');
    expect(percent(100)).toBe('100%');
    expect(percent(-25.5)).toBe('-25.5%');
  });
});
