import type { KeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleTableKey, nextVisibleCell } from './keys';

/** A grid row of five cells, the third hidden as a container query would hide it, inside a root. */
function grid(direction: 'ltr' | 'rtl' = 'ltr', hidden: number[] = [2]): HTMLElement {
  const root = document.createElement('div');
  const cells = [0, 1, 2, 3, 4]
    .map((index) => {
      const role = index === 1 ? 'rowheader' : 'gridcell';
      // A column that has left keeps its cell, zero wide and hidden, as data-table.css draws it.
      const style = hidden.includes(index) ? ' style="visibility: hidden; width: 0"' : '';
      const link = index === 1 ? '<a href="/t1">Corner Mart</a>' : `cell ${String(index)}`;
      return `<td role="${role}" tabindex="-1" data-index="${String(index)}"${style}>${link}</td>`;
    })
    .join('');
  root.innerHTML = `<table><tbody><tr role="row" tabindex="-1" style="direction: ${direction}">${cells}</tr></tbody></table>`;
  document.body.append(root);
  return root;
}

const rowOf = (root: HTMLElement): HTMLElement => {
  const row = root.querySelector<HTMLElement>('[role="row"]');
  if (row === null) throw new Error('No row');
  return row;
};

const cellAt = (root: HTMLElement, index: number): HTMLElement => {
  const cell = root.querySelector<HTMLElement>(`[data-index="${String(index)}"]`);
  if (cell === null) throw new Error(`No cell ${String(index)}`);
  return cell;
};

/** A keydown as React hands it to the root's capture handler. */
function press(root: HTMLElement, key: string, modifiers: { ctrlKey?: boolean } = {}) {
  const event = {
    key,
    ctrlKey: modifiers.ctrlKey ?? false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    nativeEvent: { isComposing: false },
    currentTarget: root,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  handleTableKey(event as unknown as KeyboardEvent<HTMLElement>);
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
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
  });

  it('finds the first and last shown cell', () => {
    const root = grid('ltr', [0, 4]);
    expect(nextVisibleCell(cellAt(root, 2), 'first')).toBe(cellAt(root, 1));
    expect(nextVisibleCell(cellAt(root, 2), 'last')).toBe(cellAt(root, 3));
  });

  it('finds the first shown cell from the row itself', () => {
    const root = grid('ltr', [0]);
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
    // A key with Ctrl is React Aria's.
    cellAt(root, 1).focus();
    expect(press(root, 'ArrowRight', { ctrlKey: true }).stopPropagation).not.toHaveBeenCalled();
    // Home and End from a cell, when the row's first or last cell is hidden.
    const ends = grid('ltr', [0, 4]);
    cellAt(ends, 2).focus();
    press(ends, 'Home');
    expect(cellAt(ends, 1)).toHaveFocus();
    press(ends, 'End');
    expect(cellAt(ends, 3)).toHaveFocus();
  });

  it('reads Arrow Right as the previous cell on a right-to-left row', () => {
    const root = grid('rtl');
    cellAt(root, 3).focus();
    press(root, 'ArrowRight');
    expect(cellAt(root, 1)).toHaveFocus();
    press(root, 'ArrowLeft');
    expect(cellAt(root, 3)).toHaveFocus();
  });
});
