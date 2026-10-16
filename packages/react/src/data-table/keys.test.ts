import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, Fragment, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleTableKey, nextVisibleCell, type TableKeyActions } from './keys';

/** The element an open modal covers, which a test can set: the table sits under that modal when it is the root. */
const modal = vi.hoisted(() => ({ covers: null as Element | null }));
vi.mock('../overlay/useOverlayStack', () => ({
  isUnderModal: (element: Element) => element === modal.covers,
}));

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

/** The handler's actions with spies; nothing in these grids can be selected. */
const actionsOf = (direction: 'ltr' | 'rtl' = 'ltr') => ({
  direction,
  keyOf: () => null,
  toggle: vi.fn(),
  extend: vi.fn(),
  typeahead: () => true,
});

/** A keydown as React hands it to the root's capture handler, from the focused element, in `direction`. */
function press(
  root: HTMLElement,
  key: string,
  modifiers: Modifiers = {},
  direction: 'ltr' | 'rtl' = 'ltr',
  actions = actionsOf(direction),
) {
  const event = {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...modifiers,
    nativeEvent: new globalThis.KeyboardEvent('keydown', { key, ...modifiers }),
    target: root.ownerDocument.activeElement ?? root,
    currentTarget: root,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  handleTableKey(event as unknown as KeyboardEvent<HTMLElement>, actions);
  return event;
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  modal.covers = null;
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
  it('extends the selection to the shown cell row where it takes a Shift arrow or Ctrl+Shift+Home or End, and nowhere else', () => {
    const root = grid([0, 2, 4]);
    const actions = actionsOf();
    // Shift+Arrow Right over the hidden cell: React Aria would have extended to this row, so the handler does.
    cellAt(root, 1, 2).focus();
    press(root, 'ArrowRight', { shiftKey: true }, 'ltr', actions);
    expect(cellAt(root, 3, 2)).toHaveFocus();
    expect(actions.extend).toHaveBeenCalledTimes(1);
    expect(actions.extend).toHaveBeenLastCalledWith(rowOf(root, 2));
    // From the row into its cells, past the hidden first cell.
    rowOf(root, 1).focus();
    press(root, 'ArrowRight', { shiftKey: true }, 'ltr', actions);
    expect(cellAt(root, 1, 1)).toHaveFocus();
    expect(actions.extend).toHaveBeenLastCalledWith(rowOf(root, 1));
    // Ctrl+Shift+End to the last row's last shown cell extends to that row, as React Aria does.
    press(root, 'End', { shiftKey: true, ctrlKey: true }, 'ltr', actions);
    expect(cellAt(root, 3, 2)).toHaveFocus();
    expect(actions.extend).toHaveBeenLastCalledWith(rowOf(root, 2));
    expect(actions.extend).toHaveBeenCalledTimes(3);
    // Shift+Home in a row moves without extending, as React Aria's Home does without Ctrl.
    press(root, 'Home', { shiftKey: true }, 'ltr', actions);
    expect(cellAt(root, 1, 2)).toHaveFocus();
    // The header row is never selected; and an arrow without Shift extends nothing.
    headerAt(root, 1).focus();
    press(root, 'ArrowRight', { shiftKey: true }, 'ltr', actions);
    expect(headerAt(root, 3)).toHaveFocus();
    cellAt(root, 1, 1).focus();
    press(root, 'ArrowRight', {}, 'ltr', actions);
    expect(actions.extend).toHaveBeenCalledTimes(3);
  });
});

/**
 * A grid as DataTable draws it, rendered by React with the handler on its root's capture phase: two rows with a
 * link, a disabled row without one, the totals row, a cell with an input, a button and a checkbox, the second
 * row's checkbox cell and the header's select-all box, then the bar, and a button portaled out of the root as a
 * Menu opened in a cell is.
 */
const MARKUP = `
<table role="grid">
  <thead><tr role="row"><th role="columnheader" tabindex="-1" data-selection=""><input type="checkbox" aria-label="Select all" /></th><th role="columnheader" tabindex="-1">Payee</th><th role="columnheader" tabindex="-1">Note</th></tr></thead>
  <tbody>
    <tr role="row" tabindex="-1" data-key="t1"><td role="rowheader" tabindex="-1"><a class="data-table-link" href="/t1">Corner Mart</a></td><td role="gridcell" tabindex="-1"><input aria-label="Note" /><button type="button">More</button><input type="checkbox" aria-label="Flag" /></td></tr>
    <tr role="row" tabindex="-1" data-key="t2"><td role="gridcell" tabindex="-1" data-selection=""><label class="checkbox-field"><input type="checkbox" aria-label="Select" /></label></td><td role="rowheader" tabindex="-1"><a class="data-table-link" href="/t2">City Transit</a></td><td role="gridcell" tabindex="-1">Bus</td></tr>
    <tr role="row" tabindex="-1" data-key="t3" aria-disabled="true"><td role="rowheader" tabindex="-1">Northside Rent</td><td role="gridcell" tabindex="-1"></td></tr>
  </tbody>
  <tfoot><tr role="row" tabindex="-1" data-key="__total"><td role="rowheader" tabindex="-1">Total</td><td role="gridcell" tabindex="-1"></td></tr></tfoot>
</table>
<div class="data-table-bar" role="toolbar" aria-label="Bulk actions"><button type="button">Delete</button></div>
`;

/** The keys `keyOf` gives: t1 and t2; the disabled row, the totals and the header give none. */
const SELECTABLE = new Set(['t1', 't2']);

function mount(direction: 'ltr' | 'rtl' = 'ltr') {
  const actions = {
    direction,
    keyOf: (row: Element) => {
      const key = row.getAttribute('data-key');
      return key !== null && SELECTABLE.has(key) ? key : null;
    },
    toggle: vi.fn<(key: string | number) => void>(),
    extend: vi.fn<(row: Element) => void>(),
    // React Aria's typeahead would move to a row or header starting with one of these.
    typeahead: vi.fn((character: string) => /^[a-z7ش]$/i.test(character)),
  } satisfies TableKeyActions;
  const view = render(
    createElement(
      Fragment,
      null,
      createElement(
        'div',
        {
          'data-testid': 'root',
          onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
            handleTableKey(event, actions);
          },
        },
        createElement('div', { dangerouslySetInnerHTML: { __html: MARKUP } }),
        createPortal(createElement('button', { type: 'button', 'data-portal': '' }, 'Split'), document.body),
      ),
    ),
  );
  const root = view.getByTestId('root');
  const q = (selector: string): HTMLElement => find(document.body, selector);
  // What passes the root reaches the document; what the handler stops does not.
  const reached = vi.fn();
  document.addEventListener('keydown', reached);
  const arrows: string[] = [];
  q('[role="grid"]').addEventListener('keydown', (event) => {
    if (event.key.startsWith('Arrow')) arrows.push(event.key);
  });
  const clicks: MouseEvent[] = [];
  for (const link of document.querySelectorAll('a')) {
    link.addEventListener('click', (event) => {
      clicks.push(event);
      // jsdom does not navigate; a browser would, so the test keeps the page.
      event.preventDefault();
    });
  }
  const cleanupListener = (): void => {
    document.removeEventListener('keydown', reached);
  };
  return { root, actions, q, reached, arrows, clicks, cleanupListener };
}

/** Focuses `element` and presses `key` on it, returning the native event. */
function key(element: HTMLElement, init: KeyboardEventInit): Event {
  act(() => {
    element.focus();
  });
  const event = new globalThis.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  fireEvent(element, event);
  return event;
}

describe('the table keys', () => {
  it('dispatches Arrow Down for J and Arrow Up for K on the focused element', () => {
    const { q, reached, arrows, cleanupListener } = mount();
    const row = q('[data-key="t1"]');
    const j = key(row, { key: 'j', code: 'KeyJ' });
    expect(j.defaultPrevented).toBe(true);
    key(row, { key: 'k', code: 'KeyK' });
    expect(arrows).toEqual(['ArrowDown', 'ArrowUp']);
    // The letters themselves never pass the root; the arrows do, as React Aria hears them.
    expect(reached.mock.calls.map(([event]) => (event as KeyboardEvent).key)).toEqual([
      'ArrowDown',
      'ArrowUp',
    ]);
    cleanupListener();
  });

  it('matches J, K and X on a Persian layout by event.code: key ت with code KeyJ', () => {
    const { q, actions, arrows, cleanupListener } = mount();
    const row = q('[data-key="t2"]');
    key(row, { key: 'ت', code: 'KeyJ' });
    key(row, { key: 'ن', code: 'KeyK' });
    expect(arrows).toEqual(['ArrowDown', 'ArrowUp']);
    key(row, { key: 'ط', code: 'KeyX' });
    expect(actions.toggle).toHaveBeenCalledWith('t2');
    cleanupListener();
  });

  it('toggles the focused row on X, and nothing for the totals, empty or a disabled row', () => {
    const { q, actions, reached, cleanupListener } = mount();
    key(q('[data-key="t1"]'), { key: 'x', code: 'KeyX' });
    expect(actions.toggle).toHaveBeenLastCalledWith('t1');
    // From a cell of the row too.
    key(q('[data-key="t2"] [role="gridcell"]'), { key: 'X', code: 'KeyX', shiftKey: false });
    expect(actions.toggle).toHaveBeenLastCalledWith('t2');
    expect(actions.toggle).toHaveBeenCalledTimes(2);
    key(q('[data-key="t3"]'), { key: 'x', code: 'KeyX' });
    key(q('[data-key="__total"]'), { key: 'x', code: 'KeyX' });
    expect(actions.toggle).toHaveBeenCalledTimes(2);
    // X never reaches React Aria's typeahead.
    expect(reached).not.toHaveBeenCalled();
    cleanupListener();
  });

  it('clicks the row link on Enter from the row or a cell, and swallows Enter on a row without one', () => {
    const { q, clicks, reached, cleanupListener } = mount();
    const enter = key(q('[data-key="t1"]'), { key: 'Enter', code: 'Enter' });
    expect(enter.defaultPrevented).toBe(true);
    expect(clicks).toHaveLength(1);
    expect((clicks[0]?.target as HTMLAnchorElement | null)?.getAttribute('href')).toBe('/t1');
    key(q('[data-key="t2"] [role="gridcell"]'), { key: 'Enter', code: 'Enter' });
    expect(clicks).toHaveLength(2);
    expect(clicks[1]?.target).toBe(q('[data-key="t2"] a'));
    // No link: the key stops all the same, so React Aria never selects the row.
    key(q('[data-key="t3"]'), { key: 'Enter', code: 'Enter' });
    key(q('[data-key="__total"] [role="gridcell"]'), { key: 'Enter', code: 'Enter' });
    expect(clicks).toHaveLength(2);
    expect(reached).not.toHaveBeenCalled();
    cleanupListener();
  });

  it('dispatches a click with the modifiers on a modifier Enter', () => {
    const { q, clicks, cleanupListener } = mount();
    const plain = vi.spyOn(HTMLElement.prototype, 'click');
    key(q('[data-key="t1"]'), { key: 'Enter', code: 'Enter', ctrlKey: true });
    key(q('[data-key="t2"]'), { key: 'Enter', code: 'Enter', metaKey: true, shiftKey: true });
    key(q('[data-key="t2"]'), { key: 'Enter', code: 'Enter', altKey: true });
    expect(plain).not.toHaveBeenCalled();
    expect(
      clicks.map(({ ctrlKey, metaKey, shiftKey, altKey }) => [ctrlKey, metaKey, shiftKey, altKey]),
    ).toEqual([
      [true, false, false, false],
      [false, true, true, false],
      [false, false, false, true],
    ]);
    expect(clicks.every((click) => click.bubbles && click.cancelable && click.detail === 1)).toBe(true);
    cleanupListener();
  });

  it('opens the row on Enter on its checkbox, and swallows Enter on select-all, so Enter never selects', () => {
    const { q, clicks, reached, cleanupListener } = mount();
    const enter = key(q('[data-key="t2"] input[aria-label="Select"]'), { key: 'Enter', code: 'Enter' });
    expect(enter.defaultPrevented).toBe(true);
    expect(clicks).toHaveLength(1);
    expect(clicks[0]?.target).toBe(q('[data-key="t2"] a'));
    // The header's box has no row to open: the key stops all the same, so React Aria never selects every row.
    const all = key(q('input[aria-label="Select all"]'), { key: 'Enter', code: 'Enter' });
    expect(all.defaultPrevented).toBe(true);
    expect(clicks).toHaveLength(1);
    expect(reached).not.toHaveBeenCalled();
    cleanupListener();
  });

  it('leaves Enter on a control inside a cell to the control', () => {
    const { q, clicks, reached, cleanupListener } = mount();
    const enter = key(q('[data-key="t1"] button'), { key: 'Enter', code: 'Enter' });
    expect(enter.defaultPrevented).toBe(false);
    expect(reached).toHaveBeenCalledTimes(1);
    // The row's own link takes its Enter itself, as any link does.
    key(q('[data-key="t1"] a'), { key: 'Enter', code: 'Enter' });
    expect(reached).toHaveBeenCalledTimes(2);
    expect(clicks).toHaveLength(0);
    cleanupListener();
  });

  it('stops a printable key typeahead would act on, and lets every other key reach the page', () => {
    const { q, actions, reached, arrows, cleanupListener } = mount();
    const row = q('[data-key="t1"]');
    for (const letter of ['c', 'C', 'z', '7', 'ش']) key(row, { key: letter });
    expect(reached).not.toHaveBeenCalled();
    expect(actions.typeahead.mock.calls.map(([character]) => character)).toEqual(['c', 'C', 'z', '7', 'ش']);
    // A key no row or header starts with, such as a page's "/" shortcut, is not React Aria's to take.
    for (const through of [
      '/',
      '.',
      ' ',
      'ArrowDown',
      'ArrowRight',
      'Home',
      'End',
      'Escape',
      'PageDown',
      'Tab',
    ]) {
      key(row, { key: through });
    }
    expect(reached.mock.calls.map(([event]) => (event as KeyboardEvent).key)).toEqual([
      '/',
      '.',
      ' ',
      'ArrowDown',
      'ArrowRight',
      'Home',
      'End',
      'Escape',
      'PageDown',
      'Tab',
    ]);
    expect(arrows).toEqual(['ArrowDown', 'ArrowRight']);
    cleanupListener();
  });

  it('leaves keys with Ctrl, Alt or Meta held to React Aria, Enter apart', () => {
    const { q, actions, reached, arrows, cleanupListener } = mount();
    const row = q('[data-key="t1"]');
    key(row, { key: 'a', code: 'KeyA', ctrlKey: true });
    key(row, { key: 'a', code: 'KeyA', metaKey: true });
    key(row, { key: 'j', code: 'KeyJ', ctrlKey: true });
    key(row, { key: 'x', code: 'KeyX', altKey: true });
    expect(reached).toHaveBeenCalledTimes(4);
    expect(arrows).toEqual([]);
    expect(actions.toggle).not.toHaveBeenCalled();
    key(row, { key: 'Enter', code: 'Enter', ctrlKey: true });
    expect(reached).toHaveBeenCalledTimes(4);
    cleanupListener();
  });

  it('ignores a composing key, a key in an input in a cell, a key in the bar, and every key while the table is under a modal', () => {
    const { root, q, actions, reached, arrows, clicks, cleanupListener } = mount();
    const row = q('[data-key="t1"]');
    key(row, { key: 'j', code: 'KeyJ', isComposing: true });
    expect(reached).toHaveBeenCalledTimes(1);
    const input = q('[data-key="t1"] input[aria-label="Note"]');
    key(input, { key: 'j', code: 'KeyJ' });
    key(input, { key: 'x', code: 'KeyX' });
    key(input, { key: 'Enter', code: 'Enter' });
    expect(input).toHaveFocus();
    expect(reached).toHaveBeenCalledTimes(4);
    key(q('.data-table-bar button'), { key: 'x', code: 'KeyX' });
    key(q('.data-table-bar button'), { key: 'Enter', code: 'Enter' });
    expect(reached).toHaveBeenCalledTimes(6);
    // A modal over the table: the handler asks about the table's own root, and stands down.
    modal.covers = root;
    key(row, { key: 'j', code: 'KeyJ' });
    key(row, { key: 'x', code: 'KeyX' });
    key(row, { key: 'Enter', code: 'Enter' });
    key(row, { key: 'c', code: 'KeyC' });
    expect(reached).toHaveBeenCalledTimes(10);
    expect(arrows).toEqual([]);
    expect(actions.toggle).not.toHaveBeenCalled();
    expect(clicks).toHaveLength(0);
    // A checkbox in a cell types nothing, so X on it is the row's.
    modal.covers = null;
    key(q('[data-key="t1"] input[type="checkbox"]'), { key: 'x', code: 'KeyX' });
    expect(actions.toggle).toHaveBeenCalledWith('t1');
    cleanupListener();
  });

  it('keeps every key while the table is inside the top-most modal, as a table in a dialog is', () => {
    const { q, actions, reached, arrows, clicks, cleanupListener } = mount();
    // Some modal is open, and the table is not under it: the stack says so for anything but the root.
    modal.covers = document.body;
    const row = q('[data-key="t1"]');
    key(row, { key: 'j', code: 'KeyJ' });
    expect(arrows).toEqual(['ArrowDown']);
    key(row, { key: 'x', code: 'KeyX' });
    expect(actions.toggle).toHaveBeenCalledWith('t1');
    key(row, { key: 'Enter', code: 'Enter' });
    expect(clicks).toHaveLength(1);
    key(row, { key: 'c', code: 'KeyC' });
    expect(reached.mock.calls.map(([event]) => (event as KeyboardEvent).key)).toEqual(['ArrowDown']);
    cleanupListener();
  });

  it('lets a key from a portal opened in a cell through, though React bubbles it to the root', () => {
    const { q, actions, reached, cleanupListener } = mount();
    const portaled = q('[data-portal]');
    key(portaled, { key: 'x', code: 'KeyX' });
    key(portaled, { key: 'c', code: 'KeyC' });
    key(portaled, { key: 'Enter', code: 'Enter' });
    expect(reached).toHaveBeenCalledTimes(3);
    expect(actions.toggle).not.toHaveBeenCalled();
    cleanupListener();
  });
});
