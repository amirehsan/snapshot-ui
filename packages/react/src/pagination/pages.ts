/** One slot of the row: a page's control, or a gap that stands for the pages left out on one side. */
export type PageItem = { type: 'page'; page: number } | { type: 'gap'; side: 'start' | 'end' };

/** The page to show: a whole number from 1 to `pageCount`, and 1 when there are no pages. */
export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, Math.trunc(page)), Math.max(1, Math.trunc(pageCount)));
}

/** Whether `value` is a whole number of 1 or more. */
const isCount = (value: number): boolean => Number.isInteger(value) && value >= 1;

/**
 * The page at `nextSize` rows a page that holds the first row of `page` at `pageSize`, so changing the size keeps
 * that row in view. Page 1 for a page or a size that is not a whole positive number.
 */
export function pageForSize(page: number, pageSize: number, nextSize: number): number {
  if (!isCount(page) || !isCount(pageSize) || !isCount(nextSize)) return 1;
  return Math.floor(((page - 1) * pageSize) / nextSize) + 1;
}

/** The sizes the picker offers: whole positive ones, once each, smallest first, with `pageSize` among them. */
export function pageSizesOf(options: readonly number[], pageSize: number): number[] {
  return [...new Set([...options, pageSize])].filter(isCount).sort((a, b) => a - b);
}

/**
 * The first page, the last, the current one with `siblingCount` each side, and a gap where pages are left out.
 * The row always has `2 * siblingCount + 5` slots, wherever the current page is, so the controls never move
 * under the pointer; every page shows when there are no more pages than slots.
 */
export function pageItems(page: number, pageCount: number, siblingCount: number): PageItem[] {
  const pages = (from: number, to: number): PageItem[] =>
    Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => ({ type: 'page', page: from + index }));
  if (pageCount <= 2 * siblingCount + 5) return pages(1, pageCount);
  // The siblings' window, held clear of the first two and the last two slots.
  const start = Math.max(Math.min(page - siblingCount, pageCount - 2 * siblingCount - 2), 3);
  const end = Math.min(Math.max(page + siblingCount, 2 * siblingCount + 3), pageCount - 2);
  return [
    ...pages(1, 1),
    // A gap that would stand for page 2 alone shows page 2.
    ...(start > 3 ? [{ type: 'gap', side: 'start' } as const] : pages(2, 2)),
    ...pages(start, end),
    // Likewise a gap that would stand for the page before the last alone.
    ...(end < pageCount - 2 ? [{ type: 'gap', side: 'end' } as const] : pages(pageCount - 1, pageCount - 1)),
    ...pages(pageCount, pageCount),
  ];
}
