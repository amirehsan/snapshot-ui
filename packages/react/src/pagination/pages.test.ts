import { describe, expect, it } from 'vitest';
import { clampPage, pageItems, type PageItem } from './pages';

/** The items as a row of words: a page's number, or "…" for a gap. */
const row = (items: PageItem[]): string =>
  items.map((item) => (item.type === 'page' ? String(item.page) : '…')).join(' ');

describe('pageItems', () => {
  it('shows every page when there are no more pages than slots', () => {
    expect(row(pageItems(1, 7, 1))).toBe('1 2 3 4 5 6 7');
    expect(row(pageItems(4, 7, 1))).toBe('1 2 3 4 5 6 7');
    expect(row(pageItems(2, 4, 1))).toBe('1 2 3 4');
    expect(row(pageItems(1, 1, 1))).toBe('1');
    expect(pageItems(1, 0, 1)).toEqual([]);
  });

  it('draws the first, middle and last windows of 26 pages in 7 slots', () => {
    expect(row(pageItems(1, 26, 1))).toBe('1 2 3 4 5 … 26');
    expect(row(pageItems(12, 26, 1))).toBe('1 … 11 12 13 … 26');
    expect(row(pageItems(26, 26, 1))).toBe('1 … 22 23 24 25 26');
  });

  it('shows page 2 instead of a gap that would stand for it alone, and the page before the last likewise', () => {
    expect(row(pageItems(4, 26, 1))).toBe('1 2 3 4 5 … 26');
    expect(row(pageItems(23, 26, 1))).toBe('1 … 22 23 24 25 26');
    // One page further in, the gap stands for two pages and is drawn.
    expect(row(pageItems(5, 26, 1))).toBe('1 … 4 5 6 … 26');
    expect(row(pageItems(22, 26, 1))).toBe('1 … 21 22 23 … 26');
  });

  it('keeps the same number of slots for every page', () => {
    for (let page = 1; page <= 26; page += 1) {
      expect(pageItems(page, 26, 1), `page ${String(page)}`).toHaveLength(7);
      expect(pageItems(page, 26, 2), `page ${String(page)}, two siblings`).toHaveLength(9);
      expect(pageItems(page, 26, 0), `page ${String(page)}, no siblings`).toHaveLength(5);
    }
    // Eight pages are one more than the slots, so a gap appears and the count stays seven.
    for (let page = 1; page <= 8; page += 1) expect(pageItems(page, 8, 1)).toHaveLength(7);
  });

  it('always holds the first, the last and the current page, and names each gap by its side', () => {
    for (let page = 1; page <= 26; page += 1) {
      const items = pageItems(page, 26, 1);
      const pages = items.flatMap((item) => (item.type === 'page' ? [item.page] : []));
      expect(pages).toContain(1);
      expect(pages).toContain(26);
      expect(pages).toContain(page);
      // Ascending with no repeats.
      expect(pages).toEqual([...new Set(pages)].sort((a, b) => a - b));
    }
    expect(pageItems(12, 26, 1).filter((item) => item.type === 'gap')).toEqual([
      { type: 'gap', side: 'start' },
      { type: 'gap', side: 'end' },
    ]);
  });
});

describe('clampPage', () => {
  it('clamps a page to 1 to pageCount, and a count of 0 to page 1', () => {
    expect(clampPage(0, 26)).toBe(1);
    expect(clampPage(-3, 26)).toBe(1);
    expect(clampPage(27, 26)).toBe(26);
    expect(clampPage(12, 26)).toBe(12);
    expect(clampPage(2.7, 26)).toBe(2);
    expect(clampPage(1, 0)).toBe(1);
    expect(clampPage(5, 0)).toBe(1);
  });
});
