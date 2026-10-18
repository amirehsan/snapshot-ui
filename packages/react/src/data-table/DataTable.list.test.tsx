import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import type { Key } from 'react-aria-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { showFace } from '../../test/dom';
import { Button } from '../button';
import { EmptyState } from '../empty-state';
import { RouterProvider } from '../link';
import {
  columnsWithTotal,
  COLUMNS,
  groupOf,
  hrefOf,
  keyOf,
  TRANSACTIONS,
  type Transaction,
} from '../stories/transactions';
import { QUIET_MS } from '../utils/quiet';
import { DataTable, type DataTableColumn, type DataTableProps } from '.';

const FIVE = TRANSACTIONS.slice(0, 5);

/** The table's columns laid out for a list item: payee and date first, category second, amount at the end. */
const LIST_COLUMNS: readonly DataTableColumn<Transaction>[] = COLUMNS.map((column) =>
  column.id === 'category'
    ? { ...column, listSlot: 'meta' }
    : column.id === 'date'
      ? { ...column, listSlot: 'meta' }
      : column.id === 'amount'
        ? { ...column, listSlot: 'end' }
        : column,
);

type Props = Partial<DataTableProps<Transaction>>;

interface ListProps extends Omit<Props, 'selectedKeys' | 'onSelectionChange'> {
  /** Selection on, with these keys selected at first. */
  initial?: Key[];
  onChange?: (keys: Key[]) => void;
}

const navigate = vi.fn();

/** The household's list grouped by day, inside a router whose navigate is a spy; selection in state with `initial`. */
function List({ initial, onChange, ...props }: ListProps): ReactElement {
  const [keys, setKeys] = useState<Key[]>(initial ?? []);
  const selection =
    initial === undefined
      ? {}
      : {
          selectedKeys: keys,
          onSelectionChange: (next: Key[]) => {
            onChange?.(next);
            setKeys(next);
          },
        };
  return (
    <RouterProvider navigate={navigate}>
      <DataTable
        aria-label="Transactions"
        items={FIVE}
        columns={LIST_COLUMNS}
        getKey={keyOf}
        getRowHref={hrefOf}
        getGroup={groupOf}
        {...(props as object)}
        {...selection}
      />
    </RouterProvider>
  );
}

const list = (): HTMLElement => screen.getByRole('grid');
const items = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.data-table-item')];

function itemAt(index: number): HTMLElement {
  const item = items()[index];
  if (item === undefined) throw new Error(`No item ${String(index)}`);
  return item;
}

const selected = (): string[] =>
  items()
    .filter((item) => item.getAttribute('aria-selected') === 'true')
    .map((item) => item.getAttribute('data-key') ?? '');

const focusItem = (index: number): void => {
  act(() => {
    itemAt(index).focus();
  });
};

// The list face's tests: the table face is hidden, as it is under 40rem of the box.
beforeEach(() => {
  showFace('list');
});

afterEach(() => {
  navigate.mockClear();
  vi.useRealTimers();
});

describe('DataTable list face', () => {
  it('draws a second grid named as the table, with a rowgroup per group named by its label', () => {
    const { container } = render(<List />);
    // Both faces are in the DOM; the table's is hidden here as the container query hides it.
    expect(container.querySelectorAll('[role="grid"]')).toHaveLength(2);
    expect(container.querySelector('.data-table-list [role="grid"]')).toBe(list());
    expect(list()).toHaveAccessibleName('Transactions');
    expect(list()).toHaveClass('data-table-grid-list');
    const groups = within(list()).getAllByRole('rowgroup');
    expect(groups.map((group) => group.getAttribute('aria-labelledby') === null)).toEqual([
      false,
      false,
      false,
    ]);
    expect(groups.map((group) => group.textContent.length > 0)).toEqual([true, true, true]);
    expect(within(list()).getByRole('rowgroup', { name: 'Wednesday 14 October' })).toBeInTheDocument();
    expect(within(list()).getByRole('rowgroup', { name: 'Tuesday 13 October' })).toBeInTheDocument();
    expect(within(list()).getByRole('rowgroup', { name: 'Monday 12 October' })).toBeInTheDocument();
    // Items keep items order inside their groups.
    expect(items().map((item) => item.getAttribute('data-key'))).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });

  it('draws one list with no rowgroup and no heading without getGroup', () => {
    render(<List getGroup={undefined} />);
    expect(within(list()).queryAllByRole('rowgroup')).toHaveLength(0);
    expect(document.querySelector('.data-table-section-header')).toBeNull();
    expect(items()).toHaveLength(5);
  });

  it('puts title, meta and end cells in their slots, the row header the title by default, and leaves hidden cells out', () => {
    render(<List />);
    const first = itemAt(0);
    expect(first.querySelector('.data-table-item-title')).toHaveTextContent(/^Corner Mart$/);
    // Meta cells in column order, each a part of its own; the library writes no separator.
    const meta = first.querySelector('.data-table-item-meta');
    expect([...(meta?.children ?? [])].map((part) => part.textContent)).toEqual(['14 Oct', 'Groceries']);
    const end = first.querySelector('.data-table-item-end');
    expect(end?.querySelector('.data-table-figure')).toHaveTextContent('-$42.18');
    // Account has no listSlot and is not the row header: hidden.
    expect(first).not.toHaveTextContent('Checking');
    // An item is named by the row's text, as the table's row is.
    expect(first).toHaveAccessibleName('Corner Mart');
    // Without listSlot every column but the row header is hidden.
    const plainColumns: DataTableColumn<Transaction>[] = [
      { id: 'payee', header: 'Payee', cell: (row) => row.payee },
      { id: 'category', header: 'Category', cell: (row) => row.category },
      { id: 'amount', header: 'Amount', cell: (row) => String(row.minor), align: 'end' },
    ];
    render(<List columns={plainColumns} getGroup={undefined} />);
    const plain = document.querySelectorAll('.data-table-list')[1]?.querySelector('.data-table-item');
    expect(plain?.querySelector('.data-table-item-title')).toHaveTextContent(/^Corner Mart$/);
    expect(plain?.querySelector('.data-table-item-meta')).toBeNull();
    expect(plain?.querySelector('.data-table-item-end')).toBeNull();
  });

  it('describes each item by its meta line and end cells, a part a word apart, and an item with neither by nothing', () => {
    render(<List />);
    // The name stays the row's, so a row checkbox reads "Select Corner Mart"; the rest of the item is its
    // description, which React Aria's name alone left unsaid (spec correction 59).
    expect(itemAt(0)).toHaveAccessibleName('Corner Mart');
    expect(itemAt(0)).toHaveAccessibleDescription('14 Oct Groceries -$42.18');
    const ids = itemAt(0).getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids).toHaveLength(3);
    for (const id of ids) expect(document.getElementById(id)).toHaveClass('data-table-item-part');
    // Ids are the item's own: no two items share one.
    const all = items().flatMap((item) => item.getAttribute('aria-describedby')?.split(' ') ?? []);
    expect(new Set(all).size).toBe(all.length);
    const titleOnly: DataTableColumn<Transaction>[] = [
      { id: 'payee', header: 'Payee', cell: (row) => row.payee },
      { id: 'category', header: 'Category', cell: (row) => row.category },
    ];
    render(<List columns={titleOnly} getGroup={undefined} />);
    const plain = document.querySelectorAll('.data-table-list')[1]?.querySelector('.data-table-item');
    expect(plain).not.toHaveAttribute('aria-describedby');
  });

  it('writes the part ids in the server HTML, which the item reads once it is drawn', () => {
    const html = renderToString(<List />);
    const part = /class="data-table-item-part" id="([^"]+)"/.exec(html);
    expect(part?.[1]).toBeTruthy();
    // React Aria's GridListItem keeps no aria-describedby, so the server writes the ids and the client the link.
    const item = /<div[^>]*class="data-table-item"[^>]*>/.exec(html)?.[0];
    expect(item).toContain('role="row"');
    expect(item).not.toContain('aria-describedby');
  });

  it('opens an item through its link, marks the current item, and never selects on a press', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} currentKey="t2" />);
    const link = within(itemAt(1)).getByRole('link', { name: 'City Transit' });
    expect(link).toHaveAttribute('href', '/transactions/t2');
    expect(link).toHaveAttribute('aria-current', 'true');
    expect(itemAt(1)).toHaveAttribute('data-current');
    expect(itemAt(0)).not.toHaveAttribute('data-current');
    await user.click(link);
    expect(navigate).toHaveBeenCalledWith('/transactions/t2', undefined);
    // A press on the item's own padding, or on its meta line, reaches React Aria's item, which would select it.
    fireEvent.pointerDown(itemAt(2), { pointerType: 'mouse', button: 0 });
    fireEvent.mouseDown(itemAt(2));
    fireEvent.pointerUp(itemAt(2), { pointerType: 'mouse', button: 0 });
    fireEvent.click(itemAt(2), { detail: 0 });
    const meta = itemAt(3).querySelector('.data-table-item-meta');
    if (meta === null) throw new Error('No meta line');
    await user.click(meta);
    expect(selected()).toEqual([]);
  });

  it('draws no boxes until Select, then every box and Select all beside Done, focus kept on the button', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} />);
    expect(within(list()).queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('checkbox', { name: 'Select all' })).toBeNull();
    // The grid still says it is multiselectable and each item whether it is selected.
    expect(list()).toHaveAttribute('aria-multiselectable', 'true');
    expect(itemAt(0)).toHaveAttribute('aria-selected', 'false');
    const button = screen.getByRole('button', { name: 'Select' });
    // Its name says what it does next; it is not a toggle button whose name stays.
    expect(button).not.toHaveAttribute('aria-pressed');
    await user.click(button);
    expect(button).toHaveAccessibleName('Done');
    expect(button).toHaveFocus();
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeInTheDocument();
    expect(within(list()).getAllByRole('checkbox')).toHaveLength(5);
    expect(within(itemAt(0)).getByRole('checkbox', { name: 'Select Corner Mart' })).toBeInTheDocument();
    // Select all comes first and the button stays at the end of the head.
    const head = document.querySelector('.data-table-list-head');
    expect(head?.lastElementChild).toBe(button);
    await user.click(button);
    expect(button).toHaveAccessibleName('Select');
    expect(button).toHaveFocus();
    expect(within(list()).queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('toggles an item on a press in Select mode, off its controls, and still opens it on Enter', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} />);
    const face = document.querySelector('.data-table-list');
    expect(face).not.toHaveAttribute('data-selecting');
    await user.click(screen.getByRole('button', { name: 'Select' }));
    // The list says it is in Select mode, so its links take no pointer and the head sticks (spec correction 69).
    expect(face).toHaveAttribute('data-selecting');
    const meta = (index: number): Element => {
      const found = itemAt(index).querySelector('.data-table-item-meta');
      if (found === null) throw new Error('No meta line');
      return found;
    };
    await user.click(meta(1));
    expect(selected()).toEqual(['t2']);
    await user.click(meta(1));
    expect(selected()).toEqual([]);
    // A screen reader's virtual click on the item toggles it too.
    fireEvent.click(itemAt(2), { detail: 0 });
    expect(selected()).toEqual(['t3']);
    // Enter opens the focused item and toggles nothing.
    focusItem(2);
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledWith('/transactions/t3', undefined);
    expect(selected()).toEqual(['t3']);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(face).not.toHaveAttribute('data-selecting');
    // Out of Select mode a press selects nothing, as ruling 2 says.
    await user.click(meta(3));
    expect(selected()).toEqual(['t3']);
  });

  it('toggles nothing on a press on a disabled item in Select mode, nor on an item without a link out of it', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} disabledKeys={['t2']} disabledBehavior="selection" getRowHref={undefined} />);
    const meta = itemAt(0).querySelector('.data-table-item-meta');
    if (meta === null) throw new Error('No meta line');
    await user.click(meta);
    expect(selected()).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Select' }));
    await user.click(meta);
    expect(selected()).toEqual(['t1']);
    const disabledMeta = itemAt(1).querySelector('.data-table-item-meta');
    if (disabledMeta === null) throw new Error('No meta line');
    await user.click(disabledMeta);
    expect(selected()).toEqual(['t1']);
  });

  it('keeps the selection on Done, a selected item keeping its mark and the bar its count', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} />);
    await user.click(screen.getByRole('button', { name: 'Select' }));
    await user.click(within(itemAt(1)).getByRole('checkbox'));
    await user.click(within(itemAt(3)).getByRole('checkbox'));
    expect(selected()).toEqual(['t2', 't4']);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(selected()).toEqual(['t2', 't4']);
    expect(within(list()).queryAllByRole('checkbox')).toHaveLength(0);
    // Every item holds a mark, hidden by the stylesheet unless the item is selected; it says nothing.
    const mark = itemAt(1).querySelector('.data-table-item-mark');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(itemAt(1)).toHaveAttribute('data-selected');
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toHaveTextContent('2 selected');
  });

  it('holds the mark slot on every item while anything is selected, and draws no icon in the HTML', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} />);
    // Nothing selected: no item holds a mark, so the text starts at the item's edge.
    expect(document.querySelectorAll('.data-table-list .data-table-item-mark')).toHaveLength(0);
    focusItem(1);
    await user.keyboard('x');
    // One selected: every item holds the slot, so the selected one's text does not move (spec correction 61).
    const marks = document.querySelectorAll('.data-table-list .data-table-item-mark');
    expect(marks).toHaveLength(5);
    expect(document.querySelectorAll('.data-table-list .data-table-item-mark svg')).toHaveLength(0);
    // In Select mode the boxes take the slot instead.
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(document.querySelectorAll('.data-table-list .data-table-item-mark')).toHaveLength(0);
    expect(within(list()).getAllByRole('checkbox')).toHaveLength(5);
  });

  it('shows a selection made in the table face by its marks and the bar, with no boxes', () => {
    render(<List initial={['t1', 't3']} />);
    expect(selected()).toEqual(['t1', 't3']);
    expect(within(list()).queryAllByRole('checkbox')).toHaveLength(0);
    expect(itemAt(0).querySelector('.data-table-item-mark')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toHaveTextContent('2 selected');
  });

  it('selects with the item checkbox, X and Space, and the Select all checkbox above the list, never passing all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<List initial={[]} onChange={onChange} disabledKeys={['t4']} />);
    // X and Space select out of Select mode too, as in the table face.
    focusItem(0);
    fireEvent.keyDown(itemAt(0), { key: 'x', code: 'KeyX' });
    expect(selected()).toEqual(['t1']);
    await user.keyboard(' ');
    expect(selected()).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Select' }));
    await user.click(within(itemAt(2)).getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(['t3']);
    const all = screen.getByRole('checkbox', { name: 'Select all' });
    expect(all).toBePartiallyChecked();
    await user.click(all);
    expect(onChange).toHaveBeenLastCalledWith(['t1', 't2', 't3', 't5']);
    expect(all).toBeChecked();
    for (const call of onChange.mock.calls) expect(call[0]).not.toBe('all');
    await user.click(all);
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(all).not.toBeChecked();
    expect(all).not.toBePartiallyChecked();
    // A disabled item's box is disabled.
    expect(within(itemAt(3)).getByRole('checkbox')).toBeDisabled();
  });

  it('takes J, K, X and Enter as the table does, and lets every letter reach the page', async () => {
    const user = userEvent.setup();
    const onPageKey = vi.fn();
    document.addEventListener('keydown', onPageKey);
    render(<List initial={[]} />);
    focusItem(0);
    await user.keyboard('j');
    expect(itemAt(1)).toHaveFocus();
    await user.keyboard('j');
    expect(itemAt(2)).toHaveFocus();
    await user.keyboard('k');
    expect(itemAt(1)).toHaveFocus();
    await user.keyboard('x');
    expect(selected()).toEqual(['t2']);
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledWith('/transactions/t2', undefined);
    expect(selected()).toEqual(['t2']);
    // The list takes no typeahead, so a letter a payee starts with moves nothing and still reaches the page.
    onPageKey.mockClear();
    await user.keyboard('n');
    expect(itemAt(1)).toHaveFocus();
    expect(onPageKey).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', onPageKey);
  });

  it('extends from the item X toggled with Shift and the arrows, through the list anchor', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} />);
    focusItem(1);
    await user.keyboard('x');
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');
    expect(selected()).toEqual(['t2', 't3', 't4']);
  });

  it('opens on Enter from the item box, and the head keys are its controls own', async () => {
    const user = userEvent.setup();
    render(<List initial={[]} />);
    const button = screen.getByRole('button', { name: 'Select' });
    act(() => {
      button.focus();
    });
    await user.keyboard('x');
    expect(selected()).toEqual([]);
    await user.keyboard('{Enter}');
    expect(button).toHaveAccessibleName('Done');
    const box = within(itemAt(0)).getByRole('checkbox');
    act(() => {
      box.focus();
    });
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledWith('/transactions/t1', undefined);
    expect(selected()).toEqual([]);
  });

  it('passes disallowTypeAhead to the GridList', async () => {
    const user = userEvent.setup();
    render(<List />);
    focusItem(0);
    // React Aria's typeahead would move to City Transit, the next item starting with C.
    await user.keyboard('c');
    expect(itemAt(0)).toHaveFocus();
    await user.keyboard('g');
    expect(itemAt(0)).toHaveFocus();
  });

  it('shows the totals line under the list with labels.total and the end totals', () => {
    const columns = columnsWithTotal(FIVE).map((column) =>
      column.id === 'amount' ? { ...column, listSlot: 'end' as const } : column,
    );
    render(<List columns={columns} labels={{ total: 'Page total' }} />);
    const total = document.querySelector('.data-table-list-total');
    // Under the list, in the list face, outside the grid: a line, not a row.
    expect(total?.parentElement).toHaveClass('data-table-list');
    expect(list().compareDocumentPosition(total as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(list().contains(total)).toBe(false);
    expect(total?.firstElementChild).toHaveTextContent(/^Page total$/);
    expect(total?.querySelector('.data-table-figure')).toHaveTextContent('$1,601.17');
    // No totals line without rows, as the table has no totals row.
    render(<List columns={columns} items={[]} emptyState={<EmptyState title="Nothing" />} />);
    expect(document.querySelectorAll('.data-table-list-total')).toHaveLength(1);
  });

  it('names each total by its column when more than one column sits at the item end', () => {
    const rows = FIVE;
    const two: DataTableColumn<Transaction>[] = [
      ...columnsWithTotal(rows).map((column) =>
        column.id === 'amount' ? { ...column, listSlot: 'end' as const } : column,
      ),
      {
        id: 'fee',
        header: 'Fee',
        cell: () => '$0.50',
        align: 'end',
        listSlot: 'end',
        total: '$2.50',
      },
    ];
    render(<List columns={two} />);
    const figures = [...document.querySelectorAll('.data-table-list-total-figure')];
    expect(figures.map((figure) => figure.textContent)).toEqual(['Amount$1,601.17', 'Fee$2.50']);
    expect(figures[0]?.querySelector('.data-table-list-total-name')).toHaveTextContent('Amount');
    // One end column: the line's "Total" says it, and no figure is named.
    render(<List columns={columnsWithTotal(rows)} />);
    expect(
      document.querySelectorAll('.data-table-list-total')[1]?.querySelector('.data-table-list-total-name'),
    ).toBeNull();
  });

  it('marks the list reloading after QUIET_MS while rows already shown load again', () => {
    vi.useFakeTimers();
    const { rerender } = render(<List />);
    const face = document.querySelector('.data-table-list');
    expect(face).not.toHaveAttribute('data-reloading');
    rerender(<List isLoading />);
    expect(face).toHaveAttribute('aria-busy', 'true');
    expect(face).not.toHaveAttribute('data-reloading');
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(face).toHaveAttribute('data-reloading');
    // The items stay, and no skeleton is drawn.
    expect(items()).toHaveLength(5);
    expect(document.querySelector('.data-table-skeleton-item')).toBeNull();
    rerender(<List />);
    expect(face).not.toHaveAttribute('data-reloading');
  });

  it('draws the error in the list body when no rows loaded, over loading and the empty state', () => {
    render(
      <List
        items={[]}
        isLoading
        initial={[]}
        emptyState={<EmptyState title="No transactions" />}
        error={<EmptyState title="Transactions did not load" />}
      />,
    );
    expect(within(list()).getByRole('heading', { name: 'Transactions did not load' })).toBeInTheDocument();
    expect(within(list()).queryByRole('heading', { name: 'No transactions' })).toBeNull();
    const face = document.querySelector('.data-table-list');
    expect(face).not.toHaveAttribute('aria-busy');
    expect(document.querySelector('.data-table-skeleton-item')).toBeNull();
    // No head and no totals while there is nothing to select or add up; the line under rows stays empty.
    expect(document.querySelector('.data-table-list-head')).toBeNull();
    expect(document.querySelector('.data-table-error')).toBeEmptyDOMElement();
  });

  it('draws the empty state, and two-line skeleton items while loading, busy and said once', () => {
    vi.useFakeTimers();
    const { rerender } = render(<List items={[]} emptyState={<EmptyState title="Nothing" />} />);
    expect(within(list()).getByRole('heading', { name: 'Nothing' })).toBeInTheDocument();
    expect(document.querySelector('.data-table-list-head')).toBeNull();
    rerender(<List items={[]} isLoading initial={[]} />);
    const face = document.querySelector('.data-table-list');
    expect(face).toHaveAttribute('aria-busy', 'true');
    const skeletons = document.querySelectorAll('.data-table-skeleton-item');
    expect(skeletons).toHaveLength(8);
    expect(skeletons[0]?.querySelectorAll('.data-table-skeleton-text .skeleton')).toHaveLength(2);
    expect(within(list()).queryAllByRole('row')).toHaveLength(1);
    // No head while nothing can be selected.
    expect(document.querySelector('.data-table-list-head')).toBeNull();
    const status = document.querySelector('.data-table-status:not(.data-table-count)');
    expect(face?.contains(status ?? null)).toBe(false);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status).toHaveTextContent('Loading');
  });

  it('shares one bar and one count between the faces', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<List initial={['t1']} bulkActions={<Button variant="secondary">Categorize</Button>} />);
    expect(document.querySelectorAll('.data-table-bar')).toHaveLength(1);
    expect(document.querySelectorAll('.data-table-count')).toHaveLength(1);
    // The table face draws the same row selected.
    expect(document.querySelector('tbody [data-key="t1"]')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(itemAt(2), { key: 'x', code: 'KeyX' });
    expect(document.querySelector('tbody [data-key="t3"]')).toHaveAttribute('aria-selected', 'true');
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    await waitFor(() => {
      expect(document.querySelector('.data-table-count')).toHaveTextContent('2 selected');
    });
  });

  const AXE_CASES: [state: string, props: ListProps, selecting?: boolean][] = [
    ['grouped', {}],
    ['ungrouped', { getGroup: undefined }],
    ['selected', { initial: ['t1', 't3'] }],
    ['selecting', { initial: ['t2'] }, true],
    ['current', { currentKey: 't3' }],
    ['empty', { items: [], emptyState: <EmptyState title="No transactions" /> }],
    ['loading', { items: [], isLoading: true }],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_state, props, selecting = false) => {
    const { container } = render(<List {...props} />);
    if (selecting) {
      act(() => {
        screen.getByRole('button', { name: 'Select' }).click();
      });
    }
    await expectNoA11yViolations(container);
  });
});

describe('DataTable list face, with an editable element in an item', () => {
  interface Receipt {
    id: string;
    merchant: string;
    memo: string;
  }
  const RECEIPTS: Receipt[] = [
    { id: 'a', merchant: 'Corner Mart', memo: 'Milk' },
    { id: 'b', merchant: 'City Transit', memo: 'Bus' },
  ];
  // The memo's editor is drawn on the item's meta line, through its listSlot.
  const COLUMNS: DataTableColumn<Receipt>[] = [
    { id: 'merchant', header: 'Merchant', cell: (row) => row.merchant, isRowHeader: true },
    {
      id: 'memo',
      header: 'Memo',
      listSlot: 'meta',
      cell: (row) => <input aria-label={`Memo, ${row.merchant}`} defaultValue={row.memo} />,
    },
  ];

  it('lets the editor keep its arrows, and gives focus back to the item on Escape', async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="Receipts" items={RECEIPTS} columns={COLUMNS} getKey={(row) => row.id} />);
    const memo = screen.getByRole('textbox', { name: 'Memo, City Transit' });
    await user.click(memo);
    expect(memo).toHaveFocus();
    // React Aria's item would take Up and Down to the item above and below, and Left and Right to its other
    // focusable children.
    await user.keyboard('{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}');
    expect(memo).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(itemAt(1)).toHaveFocus();
    // Back on the item, the arrows move between the items again.
    await user.keyboard('{ArrowUp}');
    expect(itemAt(0)).toHaveFocus();
  });
});
