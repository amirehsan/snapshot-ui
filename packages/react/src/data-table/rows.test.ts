import { describe, expect, it } from 'vitest';
import type { DataTableColumn } from './DataTable';
import { rowHeaderOf, SKELETON_WIDTHS, skeletonWidth, textOf } from './rows';

interface Spend {
  payee: string;
  amount: number;
}

const date: DataTableColumn<Spend> = { id: 'date', header: 'Date', cell: () => '12 Oct' };
const payee: DataTableColumn<Spend> = { id: 'payee', header: 'Payee', cell: (spend) => spend.payee };
const amount: DataTableColumn<Spend> = { id: 'amount', header: 'Amount', cell: (spend) => spend.amount };

describe('rows', () => {
  it('takes the column marked isRowHeader, else the first', () => {
    expect(rowHeaderOf([date, payee, amount])).toBe(date);
    const marked = { ...payee, isRowHeader: true };
    expect(rowHeaderOf([date, marked, amount])).toBe(marked);
    const second = { ...amount, isRowHeader: true };
    expect(rowHeaderOf([date, marked, second])).toBe(marked);
    expect(rowHeaderOf<Spend>([])).toBeUndefined();
  });

  it('writes a row text from textValue, else the string cell, else the empty string', () => {
    const spend = { payee: 'Corner Mart', amount: 1250 };
    expect(textOf(spend, payee)).toBe('Corner Mart');
    expect(textOf(spend, amount)).toBe('1250');
    expect(textOf(spend, { ...payee, textValue: (item) => `${item.payee}, 12 October` })).toBe(
      'Corner Mart, 12 October',
    );
    const node: DataTableColumn<Spend> = { id: 'node', header: 'Node', cell: () => ({}) as never };
    expect(textOf(spend, node)).toBe('');
    expect(textOf(spend, undefined)).toBe('');
  });

  it('cycles the skeleton widths through a fixed pattern of 40% to 80%', () => {
    for (const width of SKELETON_WIDTHS) {
      const percent = Number(width.replace('%', ''));
      expect(percent).toBeGreaterThanOrEqual(40);
      expect(percent).toBeLessThanOrEqual(80);
    }
    expect(skeletonWidth(0, 0)).toBe('72%');
    expect(skeletonWidth(0, 1)).toBe('48%');
    expect(skeletonWidth(1, 0)).toBe('64%');
    // The pattern repeats, and the same row and column always draw the same width.
    expect(skeletonWidth(3, 0)).toBe(skeletonWidth(0, 0));
    expect(skeletonWidth(5, 4)).toBe(skeletonWidth(5, 4));
    // Neighbouring rows differ, so a column of bars is not one straight edge.
    expect(skeletonWidth(0, 2)).not.toBe(skeletonWidth(1, 2));
  });
});
