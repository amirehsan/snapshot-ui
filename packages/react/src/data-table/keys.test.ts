import type { KeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleTableKey, nextVisibleCell } from './keys';

/**
 * A grid as React Aria's Table draws it: a header row of five column headers and two body rows of five cells,
 * the second cell the row header, inside a root. The columns at `hidden` have left, their cells kept zero wide
 * and hidden as data-table.css draws them. `style` is the rows' own CSS, which the handler must not read.
 */
function grid(hidden: number[] = [2], style = ''): HTMLElement {
  const root = document.createElement('div');
  const hide = (index: number): string =>
    hidden.includes(index) ? ' style="visibility: hidden; width: 0"' : '';
  const headers = [0, 1, 2, 3, 4]
    .map(
      (index) =>
        `<th role="columnheader" tabindex="-1" data-header="${String(index)}"${hide(index)}>H${String(index)}</th>`,
    )
    .join('');
  const body = [1, 2]
    .map((row) => {
      const cells = [0, 1, 2, 3, 4]
        .map((index) => {
          const role = index === 1 ? 'rowheader' : 'gridcell';
          const link =
            index === 1 ? `<a href="/t${String(row)}">Payee ${String(row)}</a>` : `cell ${String(index)}`;
          return `<td role="${role}" tabindex="-1" data-index="${String(row)}-${String(index)}"${hide(index)}>${link}</td>`;
        })
        .join('');
      return `<tr role="row" tabindex="-1" data-row="${String(row)}" style="${style}">${cells}</tr>`;
    })
    .join('');
  root.innerHTML = `<table role="grid"><thead><tr role="row" style="${style}">${headers}</tr></thead><tbody>${body}</tbody></table>`;
  document.body.append(root);
  return root;
}

function find(root: HTMLElement, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** Body row `row` (1 or 2), its cell `index`, or header cell `index`. */
const rowOf = (root: HTMLElement, row = 1): HTMLElement => find(root, `[data-row="${String(row)}"]`);
const cellAt = (root: HTMLElement, index: number, row = 1): HTMLElement =>
  find(root, `[data-index="${String(row)}-${String(index)}"]`);
const headerAt = (root: HTMLElement, index: number): HTMLElement =>
  find(root, `[data-header="${String(index)}"]`);

interface Modifiers {
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

/** A keydown as React hands it to the root's capture handler, in the locale's `direction`. */
function press(root: HTMLElement, key: string, modifiers: Modifiers = {}, direction: 'ltr' | 'rtl' = 'ltr') {
  const event = {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...modifiers,
    nativeEvent: { isComposing: false },
    currentTarget: root,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  handleTableKey(event as unknown as KeyboardEvent<HTMLElement>, { direction });
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('keys', () => {
  it('finds the next and previous shown cell in a row, skipping cells that have left', () => {
    const root = grid();
    expect(nextVisibleCell(cellAt(root, 1), 1)).toBe(cellAt(root, 3));
    expect(nextVisibleCell(cellAt(root, 3), -1)).toBe(cellAt(root, 1));
    expect(nextVisibleCell(cellAt(root, 4), 1)).toBeNull();
    expect(nextVisibleCell(cellAt(root, 0), -1)).toBeNull();
    // A cell with display none is skipped too.
    cellAt(root, 3).style.display = 'none';
    expect(nextVisibleCell(cellAt(root, 1), 1)).toBe(cellAt(root, 4));
    // And so is a column header.
    expect(nextVisibleCell(headerAt(root, 1), 1)).toBe(headerAt(root, 3));
  });

  it('finds the first and last shown cell', () => {
    const root = grid([0, 4]);
    expect(nextVisibleCell(cellAt(root, 2), 'first')).toBe(cellAt(root, 1));
    expect(nextVisibleCell(cellAt(root, 2), 'last')).toBe(cellAt(root, 3));
  });

  it('finds the first shown cell from the row itself', () => {
    const root = grid([0]);
    expect(nextVisibleCell(rowOf(root), 1)).toBe(cellAt(root, 1));
    expect(nextVisibleCell(rowOf(root), -1)).toBe(cellAt(root, 4));
  });

  it('focuses the next shown cell on Arrow Right when React Aria would reach a hidden one, and lets the key through otherwise', () => {
    const root = grid();
    cellAt(root, 1).querySelector('a')?.focus();
    const over = press(root, 'ArrowRight');
    expect(over.preventDefault).toHaveBeenCalled();
    expect(over.stopPropagation).toHaveBeenCalled();
    expect(cellAt(root, 3)).toHaveFocus();
    // Account to Amount: both shown, so React Aria moves.
    const through = press(root, 'ArrowRight');
    expect(through.stopPropagation).not.toHaveBeenCalled();
    expect(cellAt(root, 3)).toHaveFocus();
    // Back over the hidden cell.
    press(root, 'ArrowLeft');
    expect(cellAt(root, 1)).toHaveFocus();
    // Home and End from a cell, when the row's first or last cell is hidden.
    const ends = grid([0, 4]);
    cellAt(ends, 2).focus();
    press(ends, 'Home');
    expect(cellAt(ends, 1)).toHaveFocus();
    press(ends, 'End');
    expect(cellAt(ends, 3)).toHaveFocus();
  });

  it('reads Arrow Right as the previous cell in the right-to-left direction it is given, not from the CSS', () => {
    // The locale is right to left and the CSS says nothing: React Aria reads the locale, and so does the handler.
    const root = grid();
    cellAt(root, 3).focus();
    press(root, 'ArrowRight', {}, 'rtl');
    expect(cellAt(root, 1)).toHaveFocus();
    press(root, 'ArrowLeft', {}, 'rtl');
    expect(cellAt(root, 3)).toHaveFocus();
    // A row whose CSS is right to left in a left-to-right locale moves as left to right.
    const css = grid([2], 'direction: rtl');
    cellAt(css, 1).focus();
    press(css, 'ArrowRight');
    expect(cellAt(css, 3)).toHaveFocus();
  });

  it('steps over a hidden column header on Arrow Right and Left, wrapping around the header row as React Aria does', () => {
    const root = grid();
    headerAt(root, 1).focus();
    const over = press(root, 'ArrowRight');
    expect(over.stopPropagation).toHaveBeenCalled();
    expect(headerAt(root, 3)).toHaveFocus();
    press(root, 'ArrowLeft');
    expect(headerAt(root, 1)).toHaveFocus();
    // Shown to shown is React Aria's.
    expect(press(root, 'ArrowLeft').stopPropagation).not.toHaveBeenCalled();

    // The first and last columns have left: React Aria wraps from one end of the header row to the other.
    const ends = grid([0, 4]);
    headerAt(ends, 1).focus();
    press(ends, 'ArrowLeft');
    expect(headerAt(ends, 3)).toHaveFocus();
    press(ends, 'ArrowRight');
    expect(headerAt(ends, 1)).toHaveFocus();
    // Right to left, Arrow Right is the previous header, and wraps the same way.
    press(ends, 'ArrowRight', {}, 'rtl');
    expect(headerAt(ends, 3)).toHaveFocus();
    press(ends, 'ArrowLeft', {}, 'rtl');
    expect(headerAt(ends, 1)).toHaveFocus();
  });

  it('takes Home and End in the header row past a hidden first or last header', () => {
    const root = grid([0, 4]);
    headerAt(root, 2).focus();
    press(root, 'Home');
    expect(headerAt(root, 1)).toHaveFocus();
    press(root, 'End');
    expect(headerAt(root, 3)).toHaveFocus();
  });

  it('moves Arrow Up from the first row to the first shown header when the first column has left', () => {
    const root = grid([0]);
    rowOf(root).focus();
    const up = press(root, 'ArrowUp');
    expect(up.stopPropagation).toHaveBeenCalled();
    expect(headerAt(root, 1)).toHaveFocus();
    // From the second row React Aria moves to the first.
    rowOf(root, 2).focus();
    expect(press(root, 'ArrowUp').stopPropagation).not.toHaveBeenCalled();
    // From a shown cell React Aria goes to its own column's header, which is shown.
    cellAt(root, 3).focus();
    expect(press(root, 'ArrowUp').stopPropagation).not.toHaveBeenCalled();
    // With the first column shown, React Aria's header is shown.
    const shown = grid([2]);
    rowOf(shown).focus();
    expect(press(shown, 'ArrowUp').stopPropagation).not.toHaveBeenCalled();
  });

  it('takes Ctrl+Home and Ctrl+End from a cell or a header to the first or last shown cell of the first or last row', () => {
    const root = grid([0, 4]);
    cellAt(root, 2, 2).focus();
    press(root, 'Home', { ctrlKey: true });
    expect(cellAt(root, 1, 1)).toHaveFocus();
    press(root, 'End', { ctrlKey: true });
    expect(cellAt(root, 3, 2)).toHaveFocus();
    headerAt(root, 2).focus();
    press(root, 'End', { ctrlKey: true, shiftKey: true });
    expect(cellAt(root, 3, 2)).toHaveFocus();
    // From a row, Ctrl+Home moves between rows, which is React Aria's.
    rowOf(root, 2).focus();
    expect(press(root, 'Home', { ctrlKey: true }).stopPropagation).not.toHaveBeenCalled();
  });

  it('takes the modifiers React Aria moves with, Shift and Ctrl (Alt on a Mac), and leaves Meta and the others to the browser', () => {
    const root = grid();
    cellAt(root, 1).focus();
    press(root, 'ArrowRight', { ctrlKey: true });
    expect(cellAt(root, 3)).toHaveFocus();
    press(root, 'ArrowLeft', { shiftKey: true });
    expect(cellAt(root, 1)).toHaveFocus();
    // Alt+Arrow Left is the browser's Back off a Mac, and React Aria has no Meta arrows.
    expect(press(root, 'ArrowRight', { altKey: true }).stopPropagation).not.toHaveBeenCalled();
    expect(press(root, 'ArrowRight', { metaKey: true }).stopPropagation).not.toHaveBeenCalled();
    expect(cellAt(root, 1)).toHaveFocus();

    // On a Mac React Aria moves with Alt, not Ctrl, and Home and End never reach the grid's corners.
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    press(root, 'ArrowRight', { altKey: true });
    expect(cellAt(root, 3)).toHaveFocus();
    expect(press(root, 'ArrowLeft', { ctrlKey: true }).stopPropagation).not.toHaveBeenCalled();
    expect(cellAt(root, 3)).toHaveFocus();
  });
});
