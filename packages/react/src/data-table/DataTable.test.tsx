import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { EmptyState } from '../empty-state';
import { RouterProvider } from '../link';
import { QUIET_MS } from '../utils/quiet';
import {
  COLUMNS,
  columnsWithTotal,
  hrefOf,
  keyOf,
  TRANSACTIONS,
  type Transaction,
} from '../stories/transactions';
import { DataTable, type DataTableColumn, type DataTableProps } from '.';

const FIVE = TRANSACTIONS.slice(0, 5);

type Props = Partial<DataTableProps<Transaction>>;

const noop = (): void => undefined;

/** The household's table, with whatever a test changes. Its Date and Amount sort, so it takes onSortChange. */
function Spending(props: Props): ReactElement {
  return (
    <DataTable
      aria-label="Transactions"
      items={FIVE}
      columns={COLUMNS}
      getKey={keyOf}
      onSortChange={noop}
      {...(props as object)}
    />
  );
}

const grid = (): HTMLElement => screen.getByRole('grid');
const bodyRows = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('tbody [role="row"]')];

function rowAt(index: number): HTMLElement {
  const row = bodyRows()[index];
  if (row === undefined) throw new Error(`No row ${String(index)}`);
  return row;
}

const header = (name: string): HTMLElement => screen.getByRole('columnheader', { name });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DataTable', () => {
  it('is a grid named by aria-label or aria-labelledby, with a columnheader per column', () => {
    const { unmount } = render(<Spending />);
    expect(grid()).toHaveAccessibleName('Transactions');
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Date',
      'Payee',
      'Category',
      'Account',
      'Amount',
    ]);
    unmount();
    render(
      <>
        <h2 id="title">October</h2>
        <DataTable aria-labelledby="title" items={FIVE} columns={COLUMNS} getKey={keyOf} />
      </>,
    );
    expect(grid()).toHaveAccessibleName('October');
  });

  it('makes the column marked isRowHeader the row header, else the first, and warns once for two', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(<Spending />);
    expect(within(rowAt(0)).getByRole('rowheader')).toHaveTextContent('Corner Mart');
    unmount();
    const unmarked = COLUMNS.map((column) => ({ ...column, isRowHeader: undefined }));
    const second = render(<Spending columns={unmarked} />);
    expect(within(rowAt(0)).getByRole('rowheader')).toHaveTextContent('14 Oct');
    second.unmount();
    expect(warn).not.toHaveBeenCalled();
    const twice = COLUMNS.map((column) =>
      column.id === 'account' ? { ...column, isRowHeader: true } : column,
    );
    const { rerender } = render(<Spending columns={twice} />);
    rerender(<Spending columns={twice} items={TRANSACTIONS.slice(0, 4)} />);
    expect(within(rowAt(0)).getByRole('rowheader')).toHaveTextContent('Corner Mart');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/isRowHeader/);
  });

  it('draws ArrowUpDown on a sortable header, and ArrowUp or ArrowDown with aria-sort on the sorted one', () => {
    const { rerender } = render(<Spending sortDescriptor={{ column: 'date', direction: 'descending' }} />);
    expect(header('Date')).toHaveAttribute('aria-sort', 'descending');
    expect(
      header('Date').querySelector('.data-table-sort[aria-hidden="true"] .lucide-arrow-down'),
    ).not.toBeNull();
    expect(header('Amount')).toHaveAttribute('aria-sort', 'none');
    expect(header('Amount').querySelector('.data-table-sort .lucide-arrow-up-down')).not.toBeNull();
    // A column that cannot sort has no mark and no aria-sort.
    expect(header('Payee').querySelector('.data-table-sort')).toBeNull();
    expect(header('Payee')).not.toHaveAttribute('aria-sort');
    rerender(<Spending sortDescriptor={{ column: 'amount', direction: 'ascending' }} />);
    expect(header('Amount')).toHaveAttribute('aria-sort', 'ascending');
    expect(header('Amount').querySelector('.data-table-sort .lucide-arrow-up')).not.toBeNull();
    expect(header('Date').querySelector('.data-table-sort .lucide-arrow-up-down')).not.toBeNull();
  });

  it('calls onSortChange ascending on a press, Enter or Space, and descending on the sorted ascending column', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const { rerender } = render(<Spending onSortChange={onSortChange} />);
    fireEvent.click(header('Amount'));
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'amount', direction: 'ascending' });
    act(() => {
      header('Date').focus();
    });
    await user.keyboard('{Enter}');
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'date', direction: 'ascending' });
    await user.keyboard(' ');
    expect(onSortChange).toHaveBeenCalledTimes(3);
    rerender(
      <Spending onSortChange={onSortChange} sortDescriptor={{ column: 'date', direction: 'ascending' }} />,
    );
    fireEvent.click(header('Date'));
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'date', direction: 'descending' });
    // React Aria's cycle has no unsorted state: descending goes back to ascending.
    rerender(
      <Spending onSortChange={onSortChange} sortDescriptor={{ column: 'date', direction: 'descending' }} />,
    );
    fireEvent.click(header('Date'));
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'date', direction: 'ascending' });
  });

  it('shows only what sortDescriptor says: a press changes nothing until the prop changes', () => {
    const onSortChange = vi.fn();
    const { rerender } = render(
      <Spending onSortChange={onSortChange} sortDescriptor={{ column: 'date', direction: 'descending' }} />,
    );
    fireEvent.click(header('Amount'));
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(header('Date')).toHaveAttribute('aria-sort', 'descending');
    expect(header('Amount')).toHaveAttribute('aria-sort', 'none');
    rerender(
      <Spending onSortChange={onSortChange} sortDescriptor={{ column: 'amount', direction: 'ascending' }} />,
    );
    expect(header('Amount')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('puts the library Link around the row header cell with getRowHref, and none without it or on a disabled row', () => {
    const { rerender } = render(<Spending />);
    expect(document.querySelector('a')).toBeNull();
    expect(rowAt(0)).not.toHaveAttribute('data-link');
    rerender(<Spending getRowHref={hrefOf} disabledKeys={['t4']} />);
    const link = within(rowAt(0)).getByRole('link', { name: 'Corner Mart' });
    expect(link).toHaveClass('link', 'data-table-link');
    expect(link).toHaveAttribute('href', '/transactions/t1');
    expect(link.closest('[role="rowheader"]')).not.toBeNull();
    expect(rowAt(0)).toHaveAttribute('data-link', '');
    expect(within(rowAt(3)).queryByRole('link')).toBeNull();
    expect(rowAt(3)).not.toHaveAttribute('data-link');
  });

  it('opens the row link through RouterProvider, and leaves a modifier click to the browser', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <Spending getRowHref={hrefOf} />
      </RouterProvider>,
    );
    const link = within(rowAt(1)).getByRole('link', { name: 'City Transit' });
    await user.click(link);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    // A Ctrl click is the browser's: a new tab, so the router is not called and nothing prevents it.
    const ctrl = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 });
    link.dispatchEvent(ctrl);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(ctrl.defaultPrevented).toBe(false);
  });

  it('marks the current row data-current and its link aria-current true', () => {
    const { rerender } = render(<Spending getRowHref={hrefOf} currentKey="t2" />);
    expect(rowAt(1)).toHaveAttribute('data-current', '');
    expect(within(rowAt(1)).getByRole('link')).toHaveAttribute('aria-current', 'true');
    expect(rowAt(0)).not.toHaveAttribute('data-current');
    expect(within(rowAt(0)).getByRole('link')).not.toHaveAttribute('aria-current');
    // React Aria drops aria-current on its row; only the link carries it.
    expect(rowAt(1)).not.toHaveAttribute('aria-current');
    rerender(<Spending getRowHref={hrefOf} currentKey={null} />);
    expect(document.querySelector('[data-current]')).toBeNull();
    expect(document.querySelector('[aria-current]')).toBeNull();
  });

  it('sets end-aligned headers and cells data-align end and wraps the figure in the numeral span', () => {
    render(<Spending />);
    expect(header('Amount')).toHaveAttribute('data-align', 'end');
    expect(header('Date')).not.toHaveAttribute('data-align');
    const amount = within(rowAt(0)).getAllByRole('gridcell').at(-1);
    expect(amount).toHaveAttribute('data-align', 'end');
    const figure = amount?.querySelector('.data-table-figure');
    expect(figure).toHaveTextContent('-$42.18');
    expect(within(rowAt(0)).getAllByRole('gridcell')[0]?.querySelector('.data-table-figure')).toBeNull();
  });

  it('writes a column width on its header cell style', () => {
    render(<Spending />);
    // As a property, which the stylesheet reads as the cell's width and sets to zero when the column leaves.
    expect(header('Date').style.getPropertyValue('--data-table-column-width')).toBe('7rem');
    expect(header('Amount').style.getPropertyValue('--data-table-column-width')).toBe('8rem');
    expect(header('Payee').getAttribute('style')).toBeNull();
  });

  it('marks hideBelow headers and cells data-hide-below, and never hides the row header', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(<Spending />);
    expect(header('Category')).toHaveAttribute('data-hide-below', 'md');
    expect(header('Account')).toHaveAttribute('data-hide-below', 'sm');
    const cells = within(rowAt(0)).getAllByRole('gridcell');
    expect(cells.map((cell) => cell.getAttribute('data-hide-below'))).toEqual([null, 'md', 'sm', null]);
    expect(warn).not.toHaveBeenCalled();
    unmount();
    const hidden: DataTableColumn<Transaction>[] = COLUMNS.map((column) =>
      column.isRowHeader === true ? { ...column, hideBelow: 'sm' } : column,
    );
    render(<Spending columns={hidden} />);
    expect(header('Payee')).not.toHaveAttribute('data-hide-below');
    expect(within(rowAt(0)).getByRole('rowheader')).not.toHaveAttribute('data-hide-below');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/never leaves/);
  });

  it('adds a totals row in tfoot with labels.total in the row header cell, reachable by the arrows and never selected, only while there are rows', async () => {
    const user = userEvent.setup();
    const columns = columnsWithTotal(FIVE);
    const { rerender } = render(<Spending columns={columns} getRowHref={hrefOf} />);
    const footer = document.querySelector('tfoot');
    expect(footer).toHaveClass('data-table-footer');
    const total = footer?.querySelector<HTMLElement>('[role="row"]');
    if (!total) throw new Error('No totals row');
    expect(within(total).getByRole('rowheader')).toHaveTextContent(/^Total$/);
    expect(total.querySelector('.data-table-figure')).toHaveTextContent('$1,601.17');
    expect(within(total).queryByRole('link')).toBeNull();
    expect(total).not.toHaveAttribute('aria-selected');
    expect(total).not.toHaveAttribute('data-disabled');
    act(() => {
      rowAt(4).focus();
    });
    await user.keyboard('{ArrowDown}');
    expect(total).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(total).not.toHaveAttribute('aria-selected');
    rerender(<Spending columns={columns} labels={{ total: 'Sum' }} />);
    expect(document.querySelector('tfoot [role="rowheader"]')).toHaveTextContent(/^Sum$/);
    // The row-header column's own total wins over the label.
    rerender(
      <Spending
        columns={columns.map((column) => (column.id === 'payee' ? { ...column, total: '5 payees' } : column))}
      />,
    );
    expect(document.querySelector('tfoot [role="rowheader"]')).toHaveTextContent(/^5 payees$/);
    rerender(<Spending columns={columns} items={[]} emptyState={<EmptyState title="Nothing" />} />);
    expect(document.querySelector('tfoot')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Nothing' })).toBeInTheDocument();
  });

  it('draws emptyState in the empty body, and warns once without one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(
      <Spending items={[]} emptyState={<EmptyState title="No transactions this month" />} />,
    );
    const body = document.querySelector('tbody');
    expect(body).toHaveAttribute('data-empty');
    const cell = body?.querySelector('td');
    expect(cell).toHaveAttribute('colspan', '5');
    expect(
      within(cell as HTMLElement).getByRole('heading', { name: 'No transactions this month' }),
    ).toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();
    unmount();
    const { rerender } = render(<Spending items={[]} />);
    rerender(<Spending items={[]} labels={{ total: 'Sum' }} />);
    expect(document.querySelector('tbody td')).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/emptyState/);
  });

  it('draws loadingRowCount skeleton rows inside the empty body while loading with no rows, the grid counting only the empty row', () => {
    const { rerender } = render(<Spending items={[]} isLoading />);
    expect(document.querySelectorAll('.data-table-skeleton-row')).toHaveLength(8);
    expect(bodyRows()).toHaveLength(1);
    expect(document.querySelectorAll('tbody td')).toHaveLength(1);
    const first = document.querySelector('.data-table-skeleton-row');
    const cells = [...(first?.querySelectorAll('.data-table-skeleton-cell') ?? [])];
    expect(cells).toHaveLength(5);
    expect(cells.map((cell) => cell.getAttribute('data-hide-below'))).toEqual([null, null, 'md', 'sm', null]);
    expect(cells[4]).toHaveAttribute('data-align', 'end');
    expect((cells[0] as HTMLElement).style.flexBasis).toBe('7rem');
    expect((cells[1] as HTMLElement).getAttribute('style')).toBeNull();
    for (const cell of cells) expect(cell.querySelector('.skeleton[aria-hidden="true"]')).not.toBeNull();
    // The one cell React Aria draws is a row header, so it holds the loading words, hidden from sight.
    expect(document.querySelector('tbody td .data-table-loading')).toHaveTextContent(/^Loading$/);
    rerender(<Spending items={[]} isLoading loadingRowCount={3} />);
    expect(document.querySelectorAll('.data-table-skeleton-row')).toHaveLength(3);
  });

  it('keeps the rows while loading with rows, and marks the root aria-busy either way', () => {
    const { container, rerender } = render(<Spending isLoading />);
    expect(bodyRows()).toHaveLength(5);
    expect(document.querySelector('.data-table-skeleton-row')).toBeNull();
    const busy = container.querySelector('.data-table-grid');
    expect(busy).toHaveAttribute('aria-busy', 'true');
    // The status is outside the busy part, so a screen reader is not asked to hold it back.
    const status = screen.getByRole('status');
    expect(busy?.contains(status)).toBe(false);
    rerender(<Spending items={[]} isLoading />);
    expect(container.querySelector('.data-table-grid')).toHaveAttribute('aria-busy', 'true');
    rerender(<Spending />);
    expect(container.querySelector('[aria-busy]')).toBeNull();
    expect(screen.getByRole('status')).toBe(status);
  });

  it('says labels.loading in its status QUIET_MS after loading starts, and nothing for a shorter load', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Spending labels={{ loading: 'Loading transactions' }} />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('data-table-status');
    expect(status).toBeEmptyDOMElement();
    rerender(<Spending labels={{ loading: 'Loading transactions' }} isLoading />);
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(QUIET_MS - 1);
    });
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(status).toHaveTextContent('Loading transactions');
    rerender(<Spending labels={{ loading: 'Loading transactions' }} />);
    expect(status).toBeEmptyDOMElement();
    // A load shorter than the pause says nothing, even when the same words come back.
    rerender(<Spending labels={{ loading: 'Loading transactions' }} isLoading />);
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(QUIET_MS / 2);
    });
    rerender(<Spending labels={{ loading: 'Loading transactions' }} />);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status).toBeEmptyDOMElement();
  });

  it('draws the same skeleton widths on every render', () => {
    const widths = (): string[] =>
      [...document.querySelectorAll<HTMLElement>('.data-table-skeleton-row .skeleton')].map(
        (line) => line.style.inlineSize,
      );
    const { rerender } = render(<Spending items={[]} isLoading />);
    const first = widths();
    expect(first).toHaveLength(40);
    expect(new Set(first).size).toBeGreaterThan(1);
    rerender(<Spending items={[]} isLoading labels={{ loading: 'Loading' }} />);
    expect(widths()).toEqual(first);
  });

  it('draws disabled rows with data-disabled and no link, and skips them on the arrows', async () => {
    const user = userEvent.setup();
    render(<Spending getRowHref={hrefOf} disabledKeys={['t2']} />);
    expect(rowAt(1)).toHaveAttribute('data-disabled');
    expect(within(rowAt(1)).queryByRole('link')).toBeNull();
    act(() => {
      rowAt(0).focus();
    });
    await user.keyboard('{ArrowDown}');
    expect(rowAt(2)).toHaveFocus();
  });

  it('warns once for a sortDescriptor that names no column', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(<Spending sortDescriptor={{ column: 'when', direction: 'ascending' }} />);
    rerender(<Spending sortDescriptor={{ column: 'when', direction: 'descending' }} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/sortDescriptor names "when", which is no column's id/);
    rerender(<Spending sortDescriptor={{ column: 'date', direction: 'descending' }} />);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('draws only the first row for a key that two rows share, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(<Spending />);
    unmount();
    expect(warn).not.toHaveBeenCalled();
    // React Aria throws for a repeated key outside production and can loop forever in it, so the table never
    // hands it one: the first row with the key is drawn and the next is left out.
    const shared = (item: Transaction): string => (item.id === 't3' ? 't1' : item.id);
    const { rerender } = render(<Spending items={FIVE.slice(0, 3)} getKey={shared} />);
    rerender(<Spending items={FIVE.slice(0, 4)} getKey={shared} />);
    expect(bodyRows().map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      'Corner Mart',
      'City Transit',
      'Acme Payroll',
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/getKey gives "t1" to more than one row/);
  });

  it('warns once when a column sorts and there is no onSortChange', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(<Spending />);
    unmount();
    // A table whose columns do not sort needs none.
    const still = COLUMNS.map((column) => ({ ...column, allowsSorting: undefined }));
    render(<Spending columns={still} onSortChange={undefined} />).unmount();
    expect(warn).not.toHaveBeenCalled();
    const { rerender } = render(<Spending onSortChange={undefined} />);
    rerender(<Spending onSortChange={undefined} items={FIVE.slice(0, 3)} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/"date" allowsSorting, and there is no onSortChange/);
  });

  it('moves past a column that has left in the direction of the locale, as React Aria does, not of the CSS', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="fa-IR">
        <Spending />
      </I18nProvider>,
    );
    // jsdom applies no container query, so Category is hidden here as the stylesheet hides it under 48rem.
    for (const cell of document.querySelectorAll<HTMLElement>('[data-hide-below="md"]')) {
      cell.style.visibility = 'hidden';
    }
    const cells = [...rowAt(0).querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]')];
    const [, payee, , account] = cells;
    if (payee === undefined || account === undefined) throw new Error('No cells');
    act(() => {
      account.focus();
    });
    // In Persian Arrow Right goes to the previous column, Category, which has left; the CSS says left to right.
    await user.keyboard('{ArrowRight}');
    expect(payee).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(account).toHaveFocus();
  });

  it('passes className and ref to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Spending className="extra" ref={ref} />);
    const root = container.firstElementChild;
    expect(root).toHaveClass('data-table', 'extra');
    expect(ref.current).toBe(root);
    expect(root?.children[0]).toHaveClass('data-table-grid');
    expect(root?.children[1]).toHaveClass('data-table-status');
  });

  const AXE_CASES: [state: string, props: Props][] = [
    [
      'sorted',
      { sortDescriptor: { column: 'date', direction: 'descending' }, onSortChange: () => undefined },
    ],
    ['current', { getRowHref: hrefOf, currentKey: 't2' }],
    ['totals', { columns: columnsWithTotal(FIVE), getRowHref: hrefOf }],
    ['empty', { items: [], emptyState: <EmptyState title="No transactions this month" /> }],
    ['loading', { items: [], isLoading: true }],
    ['a disabled row', { getRowHref: hrefOf, disabledKeys: ['t3'] }],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_state, props) => {
    const { container } = render(<Spending {...props} />);
    await expectNoA11yViolations(container);
  });

  it('requires a name and refuses an unknown alignment, width or direction in its types', () => {
    const base = { items: FIVE, columns: COLUMNS, getKey: keyOf };
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a table needs a name, from aria-label or aria-labelledby (spec correction 21)
    const nameless = <DataTable {...base} />;
    // @ts-expect-error a column sits at the start or the end, never centered
    const centered: DataTableColumn<Transaction> = { id: 'x', header: 'X', cell: () => '', align: 'center' };
    // @ts-expect-error a column leaves at sm or md only
    const large: DataTableColumn<Transaction> = { id: 'x', header: 'X', cell: () => '', hideBelow: 'lg' };
    // @ts-expect-error a direction is ascending or descending
    const up = <DataTable {...base} aria-label="T" sortDescriptor={{ column: 'date', direction: 'up' }} />;
    expect(nameless).toBeTruthy();
    expect(centered).toBeTruthy();
    expect(large).toBeTruthy();
    expect(up).toBeTruthy();
  });
});
