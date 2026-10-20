import { describe, expect, it } from 'vitest';
import { chartName, named } from './naming';

const HEADERS = ['chart-series-1', 'chart-series-2'];

describe('named', () => {
  it('names with a string that is given and not only spaces', () => {
    expect(named('Spending')).toBe(true);
    expect(named(' Spending ')).toBe(true);
    expect(named('')).toBe(false);
    expect(named(' \t\n')).toBe(false);
    expect(named(undefined)).toBe(false);
  });
});

describe('chartName', () => {
  it.each([
    [
      'aria-labelledby, which wins over aria-label',
      { 'aria-labelledby': 'heading', 'aria-label': 'Spending' },
      { labelledBy: 'heading', label: undefined, stop: { 'aria-labelledby': 'heading' } },
    ],
    [
      'aria-label alone, which is also the caption',
      { 'aria-label': 'Spending' },
      { labelledBy: undefined, label: 'Spending', stop: { 'aria-label': 'Spending' } },
    ],
    [
      'a blank aria-labelledby, falling to aria-label',
      { 'aria-labelledby': '  ', 'aria-label': 'Spending' },
      { labelledBy: undefined, label: 'Spending', stop: { 'aria-label': 'Spending' } },
    ],
    [
      'both blank, falling to the column headers',
      { 'aria-labelledby': ' ', 'aria-label': '' },
      {
        labelledBy: undefined,
        label: undefined,
        stop: { 'aria-labelledby': 'chart-series-1 chart-series-2' },
      },
    ],
    [
      'neither, falling to the column headers',
      {},
      {
        labelledBy: undefined,
        label: undefined,
        stop: { 'aria-labelledby': 'chart-series-1 chart-series-2' },
      },
    ],
  ])('names a chart by %s', (_case, name, expected) => {
    expect(chartName(name, HEADERS)).toEqual(expected);
  });
});
