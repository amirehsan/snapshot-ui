/*
 * The charts' keys: the moves a key makes among the positions with data, the modifier guard and the drawn
 * direction they follow. Pure but for one DOM read, which runs only in an event handler. Private to the package.
 */

export type Move = 'next' | 'previous' | 'first' | 'last' | 'page-forward' | 'page-back';

/** How far Page Up and Page Down move: a week of days. Exported for the docs' Keys tables. */
export const PAGE = 7;

/** A key with Alt, Control or Meta is the browser's or the page's shortcut, never a move. Shift is not one. */
export function hasModifier(event: { altKey: boolean; ctrlKey: boolean; metaKey: boolean }): boolean {
  return event.altKey || event.ctrlKey || event.metaKey;
}

/**
 * Whether the drawing runs right to left: the nearest explicit `dir="ltr"` or `dir="rtl"`, the attribute
 * charts.css sets `--chart-flip` and `--chart-direction` from, so the keys and the pointer agree with what is
 * drawn. `dir="auto"` sets neither, so it is looked past, as the CSS looks past it.
 */
export function isRightToLeft(element: Element): boolean {
  return element.closest("[dir='ltr' i], [dir='rtl' i]")?.getAttribute('dir')?.toLowerCase() === 'rtl';
}

/** Where a move from `from` lands among `withData`; `from` itself when there is nowhere to go. */
export function moveFrom(withData: readonly number[], from: number, move: Move): number {
  const first = withData[0];
  const last = withData.at(-1);
  if (first === undefined || last === undefined) return from;
  switch (move) {
    case 'first':
      return first;
    case 'last':
      return last;
    case 'next':
      return withData.find((index) => index > from) ?? from;
    case 'previous':
      return withData.findLast((index) => index < from) ?? from;
    // A week on, or the nearest day with data past it; the newest when there is none.
    case 'page-forward':
      return withData.find((index) => index >= from + PAGE) ?? Math.max(from, last);
    case 'page-back':
      return withData.findLast((index) => index <= from - PAGE) ?? Math.min(from, first);
  }
}
