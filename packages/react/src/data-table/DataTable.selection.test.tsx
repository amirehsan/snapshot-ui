import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement, type ReactNode } from 'react';
import type { Key, Selection } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Button } from '../button';
import { Dialog } from '../dialog';
import { RouterProvider } from '../link';
import {
  columnsWithTotal,
  COLUMNS,
  hrefOf,
  keyOf,
  TRANSACTIONS,
  type Transaction,
} from '../stories/transactions';
import { QUIET_MS } from '../utils/quiet';
import { DataTable, type DataTableLabels, type DataTableProps } from '.';

const FIVE = TRANSACTIONS.slice(0, 5);

type Props = Partial<DataTableProps<Transaction>>;

interface SelectingProps extends Omit<Props, 'selectedKeys' | 'onSelectionChange'> {
  /** The keys selected at first. */
  initial?: Key[];
  /** Told every change, after the table hands it over. */
  onChange?: (keys: Key[]) => void;
  /** A bulk action that empties the selection itself, as Delete does once it has deleted. */
  emptying?: boolean;
}

const navigate = vi.fn();

/** The household's table with selection in state, as a page holds it, inside a router whose navigate is a spy. */
function Selecting({ initial = [], onChange, emptying = false, ...props }: SelectingProps): ReactElement {
  const [keys, setKeys] = useState<Key[]>(initial);
  const actions: ReactNode = emptying ? (
    <Button
      variant="secondary"
      onPress={() => {
        setKeys([]);
      }}
    >
      Archive
    </Button>
  ) : (
    props.bulkActions
  );
  return (
    <RouterProvider navigate={navigate}>
      <DataTable
        aria-label="Transactions"
        items={FIVE}
        columns={COLUMNS}
        getKey={keyOf}
        getRowHref={hrefOf}
        onSortChange={() => undefined}
        {...(props as object)}
        bulkActions={actions}
        selectedKeys={keys}
        onSelectionChange={(next) => {
          onChange?.(next);
          setKeys(next);
        }}
      />
    </RouterProvider>
  );
}

const bodyRows = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('tbody [role="row"]')];

function rowAt(index: number): HTMLElement {
  const row = bodyRows()[index];
  if (row === undefined) throw new Error(`No row ${String(index)}`);
  return row;
}

const selected = (): string[] =>
  bodyRows()
    .filter((row) => row.getAttribute('aria-selected') === 'true')
    .map((row) => row.getAttribute('data-key') ?? '');

const grid = (): HTMLElement => screen.getByRole('grid');

const focusRow = (index: number): void => {
  act(() => {
    rowAt(index).focus();
  });
};

afterEach(() => {
  navigate.mockClear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DataTable selection', () => {
  it('turns selection on with selectedKeys and onSelectionChange, with a checkbox column first', () => {
    const { unmount } = render(<Selecting />);
    expect(grid()).toHaveAttribute('aria-multiselectable', 'true');
    const first = screen.getAllByRole('columnheader')[0];
    if (first === undefined) throw new Error('No column header');
    expect(first).toHaveAttribute('data-selection');
    expect(first).toHaveClass('data-table-column');
    expect(within(first).getByRole('checkbox')).toBeInTheDocument();
    for (const row of bodyRows()) {
      const cell = row.firstElementChild;
      expect(cell).toHaveAttribute('data-selection');
      expect(within(cell as HTMLElement).getByRole('checkbox')).toBeInTheDocument();
      expect(row).toHaveAttribute('aria-selected', 'false');
    }
    unmount();
    // Without both props there is no checkbox and the grid is not multiselectable.
    render(<DataTable aria-label="Transactions" items={FIVE} columns={COLUMNS} getKey={keyOf} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(grid()).not.toHaveAttribute('aria-multiselectable');
    expect(document.querySelector('[data-selection]')).toBeNull();
  });

  it('names the header checkbox Select all and a row checkbox Select and the row', () => {
    const { unmount } = render(<Selecting />);
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Corner Mart' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select City Transit' })).toBeInTheDocument();
    unmount();
    render(<Selecting labels={{ selectAll: 'Every row', select: 'Choose' }} />);
    expect(screen.getByRole('checkbox', { name: 'Every row' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Choose Green Grocer' })).toBeInTheDocument();
  });

  it('gives select-all and Mod+A the enabled rows keys, never all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selecting onChange={onChange} disabledKeys={['t4']} />);
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(onChange).toHaveBeenLastCalledWith(['t1', 't2', 't3', 't5']);
    expect(selected()).toEqual(['t1', 't2', 't3', 't5']);
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    focusRow(1);
    await user.keyboard('{Control>}a{/Control}');
    expect(onChange).toHaveBeenLastCalledWith(['t1', 't2', 't3', 't5']);
    for (const [keys] of onChange.mock.calls) expect(Array.isArray(keys)).toBe(true);
  });

  it('makes the header checkbox indeterminate while some rows are selected', () => {
    const { unmount } = render(<Selecting initial={['t1', 't3']} />);
    const all = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Select all' });
    expect(all.indeterminate).toBe(true);
    expect(all).not.toBeChecked();
    expect(selected()).toEqual(['t1', 't3']);
    unmount();
    render(<Selecting initial={['t1', 't2', 't3', 't4', 't5']} />);
    const every = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Select all' });
    expect(every).toBeChecked();
    expect(every.indeterminate).toBe(false);
  });

  it('never selects on a click on a row link', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selecting onChange={onChange} />);
    await user.click(within(rowAt(1)).getByRole('link', { name: 'City Transit' }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    // Once a row is selected, React Aria would select on a press; the link still only opens.
    await user.click(screen.getByRole('checkbox', { name: 'Select Corner Mart' }));
    expect(selected()).toEqual(['t1']);
    await user.click(within(rowAt(2)).getByRole('link', { name: 'Northside Rent' }));
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(selected()).toEqual(['t1']);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('toggles on Space and X, and opens on Enter, which never selects', async () => {
    const user = userEvent.setup();
    render(<Selecting />);
    focusRow(0);
    await user.keyboard(' ');
    expect(selected()).toEqual(['t1']);
    await user.keyboard('x');
    expect(selected()).toEqual([]);
    await user.keyboard('{ArrowDown}');
    expect(rowAt(1)).toHaveFocus();
    await user.keyboard('x');
    expect(selected()).toEqual(['t2']);
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    expect(selected()).toEqual(['t2']);
    // From a cell too.
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledTimes(2);
    // X from a cell toggles its row.
    await user.keyboard('X');
    expect(selected()).toEqual([]);
    expect(rowAt(1).contains(document.activeElement)).toBe(true);
  });

  it('moves down and up on J and K as on the arrows', async () => {
    const user = userEvent.setup();
    render(<Selecting />);
    focusRow(0);
    await user.keyboard('j');
    expect(rowAt(1)).toHaveFocus();
    await user.keyboard('j');
    expect(rowAt(2)).toHaveFocus();
    await user.keyboard('k');
    expect(rowAt(1)).toHaveFocus();
    // Up from the first row reaches the headers, as Arrow Up does: the select-all checkbox's.
    await user.keyboard('kk');
    expect(screen.getAllByRole('columnheader')[0]?.contains(document.activeElement)).toBe(true);
    expect(selected()).toEqual([]);
  });

  it('keeps focus on a row when a letter is typed', async () => {
    const user = userEvent.setup();
    render(<Selecting />);
    focusRow(0);
    // React Aria's typeahead would move to City Transit, the next row starting with C.
    await user.keyboard('c');
    expect(rowAt(0)).toHaveFocus();
    await user.keyboard('ci');
    expect(rowAt(0)).toHaveFocus();
    expect(navigate).not.toHaveBeenCalled();
    expect(selected()).toEqual([]);
  });

  it('extends the selection with Shift and the arrows, keeping its anchor through the app', async () => {
    const user = userEvent.setup();
    render(<Selecting />);
    focusRow(1);
    await user.keyboard(' ');
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');
    expect(selected()).toEqual(['t2', 't3', 't4']);
    // Back up shrinks the range, as React Aria's own selection does, since its anchor came back with the keys.
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(selected()).toEqual(['t2', 't3']);
    // X sets the anchor as Space does.
    await user.keyboard('{ArrowDown}{ArrowDown}x{Shift>}{ArrowUp}{/Shift}');
    expect(selected()).toEqual(['t2', 't3', 't4', 't5']);
  });

  it('extends past a column that has left on Shift+Arrow Right', async () => {
    const user = userEvent.setup();
    render(<Selecting />);
    // jsdom applies no container query, so Category is hidden here as the stylesheet hides it under 48rem.
    for (const cell of document.querySelectorAll<HTMLElement>('[data-hide-below="md"]')) {
      cell.style.visibility = 'hidden';
    }
    focusRow(2);
    await user.keyboard('x');
    await user.keyboard('{ArrowUp}');
    const cells = [...rowAt(1).children] as HTMLElement[];
    const payee = cells[2];
    const account = cells[4];
    act(() => {
      payee?.focus();
    });
    expect(payee?.contains(document.activeElement)).toBe(true);
    // Category, the next cell, has left: the handler focuses Account and extends as React Aria would have.
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(account).toHaveFocus();
    expect(selected()).toEqual(['t2', 't3']);
  });

  it('clears on Escape in the table, and lets Escape through with nothing selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const outside = vi.fn();
    document.addEventListener('keydown', outside);
    render(<Selecting initial={['t1', 't2']} onChange={onChange} />);
    focusRow(0);
    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(outside).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(outside).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', outside);
  });

  it('shows the bar while a row is selected: a toolbar named Bulk actions with the count, the actions and Clear selection', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Selecting
        initial={['t1', 't3']}
        bulkActions={
          <>
            <Button variant="secondary">Categorize</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />,
    );
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(bar).toHaveClass('data-table-bar');
    // The bar follows the face, inside the root.
    expect(bar.parentElement).toBe(container.querySelector('.data-table'));
    expect(bar.previousElementSibling).toHaveClass('data-table-error');
    expect(bar.previousElementSibling?.previousElementSibling).toHaveClass('data-table-grid');
    expect(bar.querySelector('.data-table-bar-count')).toHaveTextContent(/^2 selected$/);
    const actions = bar.querySelector('.data-table-bar-actions');
    expect(
      within(actions as HTMLElement)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Categorize', 'Delete']);
    const clear = within(bar).getByRole('button', { name: 'Clear selection' });
    expect(clear).toHaveClass('button-tertiary', 'data-table-bar-clear');
    await user.click(screen.getByRole('checkbox', { name: 'Select Corner Mart' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Northside Rent' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('writes the count with formatCount and labels.selected, counting only keys in items', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const persian = (count: number): string =>
      String(count).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
    const labels: Partial<DataTableLabels> = { selected: (count) => `${count} انتخاب شده` };
    const { rerender } = render(
      <Selecting initial={['t1', 'gone', 't2', 'away']} formatCount={persian} labels={labels} />,
    );
    expect(document.querySelector('.data-table-bar-count')).toHaveTextContent(/^۲ انتخاب شده$/);
    // Only stale keys: no row in items is selected, so there is no bar.
    rerender(<Selecting initial={['gone']} formatCount={persian} labels={labels} items={FIVE} key="stale" />);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('says the count in its status once, QUIET_MS after the last change', () => {
    vi.useFakeTimers();
    render(<Selecting />);
    const status = document.querySelector('.data-table-count');
    expect(status).toHaveClass('data-table-status');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toBeEmptyDOMElement();
    focusRow(0);
    fireEvent.keyDown(rowAt(0), { key: 'x', code: 'KeyX' });
    act(() => {
      vi.advanceTimersByTime(QUIET_MS - 1);
    });
    expect(status).toBeEmptyDOMElement();
    focusRow(1);
    fireEvent.keyDown(rowAt(1), { key: 'x', code: 'KeyX' });
    act(() => {
      vi.advanceTimersByTime(QUIET_MS - 1);
    });
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(status).toHaveTextContent(/^2 selected$/);
    // It empties at once when the selection does.
    fireEvent.keyDown(rowAt(1), { key: 'Escape', code: 'Escape' });
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status).toBeEmptyDOMElement();
  });

  it('clears on Clear selection and on Escape in the bar, with focus on the table', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Selecting initial={['t1', 't2']} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(grid().contains(document.activeElement)).toBe(true);
    unmount();
    render(
      <Selecting
        initial={['t3']}
        onChange={onChange}
        bulkActions={<Button variant="secondary">Categorize</Button>}
      />,
    );
    act(() => {
      screen.getByRole('button', { name: 'Categorize' }).focus();
    });
    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(grid().contains(document.activeElement)).toBe(true);
  });

  it('puts focus on the table when the selection empties while the bar holds focus', async () => {
    const user = userEvent.setup();
    render(<Selecting initial={['t1']} emptying />);
    await user.click(screen.getByRole('button', { name: 'Archive' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(grid().contains(document.activeElement)).toBe(true);
  });

  it('leaves focus where the reader moved it when the selection empties later', async () => {
    const user = userEvent.setup();
    function Page(): ReactElement {
      const [keys, setKeys] = useState<Key[]>(['t1']);
      return (
        <>
          <DataTable
            aria-label="Transactions"
            items={FIVE}
            columns={COLUMNS}
            getKey={keyOf}
            selectedKeys={keys}
            onSelectionChange={setKeys}
            bulkActions={<Button variant="secondary">Categorize</Button>}
          />
          <button
            type="button"
            onClick={() => {
              setKeys([]);
            }}
          >
            Next page
          </button>
        </>
      );
    }
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Categorize' }));
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveFocus();
  });

  it('warns once naming the selected keys that are not in items', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(<Selecting initial={['t1']} />);
    unmount();
    expect(warn).not.toHaveBeenCalled();
    const { rerender } = render(<Selecting initial={['t1', 't41', 't42']} />);
    rerender(<Selecting initial={['t1', 't41', 't42']} items={FIVE.slice(0, 4)} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      'DataTable: selectedKeys holds keys that are not in items: t41, t42. Clear the selection when the rows change.',
    );
  });

  it('never selects the totals row, by Space, X or select-all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selecting columns={columnsWithTotal(FIVE)} onChange={onChange} />);
    const total = document.querySelector<HTMLElement>('tfoot [role="row"]');
    if (total === null) throw new Error('No totals row');
    // Its first cell is the checkbox column's, empty.
    expect(total.firstElementChild).toHaveAttribute('data-selection');
    expect(total.firstElementChild).toBeEmptyDOMElement();
    focusRow(4);
    await user.keyboard('{ArrowDown}');
    expect(total).toHaveFocus();
    await user.keyboard(' x');
    expect(onChange).not.toHaveBeenCalled();
    expect(total).not.toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(onChange).toHaveBeenLastCalledWith(['t1', 't2', 't3', 't4', 't5']);
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
  });

  it('is one tab stop: no row link or checkbox is in the tab order', () => {
    render(<Selecting initial={['t1']} />);
    for (const link of document.querySelectorAll('.data-table-link')) {
      expect(link).toHaveAttribute('tabindex', '-1');
    }
    for (const box of grid().querySelectorAll('input[type="checkbox"]')) {
      expect(box).toHaveAttribute('tabindex', '-1');
    }
  });

  it('keeps its keys inside an open Dialog: Enter opens, J moves, X selects and a letter stays', async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Pick transactions" isOpen>
        <Selecting />
      </Dialog>,
    );
    focusRow(0);
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(selected()).toEqual([]);
    await user.keyboard('j');
    expect(rowAt(1)).toHaveFocus();
    await user.keyboard('x');
    expect(selected()).toEqual(['t2']);
    // React Aria's typeahead would move to Northside Rent.
    await user.keyboard('n');
    expect(rowAt(1)).toHaveFocus();
  });

  it('stands its keys down while a Dialog is open over the table', () => {
    render(
      <>
        <Selecting />
        <Dialog title="Something else" isOpen>
          <p>Over the table</p>
        </Dialog>
      </>,
    );
    const row = rowAt(0);
    // React Aria's Dialog keeps focus in itself; a key the table still hears is not the table's.
    fireEvent.keyDown(row, { key: 'x', code: 'KeyX' });
    fireEvent.keyDown(row, { key: 'j', code: 'KeyJ' });
    expect(selected()).toEqual([]);
    expect(document.activeElement).not.toBe(rowAt(1));
  });

  it('puts focus on the table once a dialog a bulk action opened closes, its confirm having cleared the selection', async () => {
    const user = userEvent.setup();
    function Page(): ReactElement {
      const [keys, setKeys] = useState<Key[]>(['t1']);
      const [open, setOpen] = useState(false);
      return (
        <>
          <DataTable
            aria-label="Transactions"
            items={FIVE}
            columns={COLUMNS}
            getKey={keyOf}
            selectedKeys={keys}
            onSelectionChange={setKeys}
            bulkActions={
              <Button
                variant="danger"
                onPress={() => {
                  setOpen(true);
                }}
              >
                Delete
              </Button>
            }
          />
          <Dialog
            title="Delete one transaction?"
            isOpen={open}
            onOpenChange={setOpen}
            actions={
              <Button
                variant="danger"
                onPress={() => {
                  setKeys([]);
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            }
          />
        </>
      );
    }
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await waitFor(() => {
      expect(grid().contains(document.activeElement)).toBe(true);
    });
  });

  it('forgets the bar once focus leaves it for the page', async () => {
    const user = userEvent.setup();
    function Page(): ReactElement {
      const [keys, setKeys] = useState<Key[]>(['t1']);
      return (
        <>
          <DataTable
            aria-label="Transactions"
            items={FIVE}
            columns={COLUMNS}
            getKey={keyOf}
            selectedKeys={keys}
            onSelectionChange={setKeys}
            bulkActions={<Button variant="secondary">Categorize</Button>}
          />
          {keys.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setKeys([]);
              }}
            >
              Done
            </button>
          ) : null}
        </>
      );
    }
    render(<Page />);
    act(() => {
      screen.getByRole('button', { name: 'Categorize' }).focus();
    });
    // Focus leaves the bar for the page, and what holds it then empties the selection and leaves too.
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(grid().contains(document.activeElement)).toBe(false);
  });

  it('never selects on a press on a cell of a row without a link, nor around a row checkbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selecting getRowHref={undefined} onChange={onChange} />);
    const cells = [...rowAt(1).querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]')];
    // The checkbox cell around its box, the date, the payee and the amount.
    for (const cell of [cells[0], cells[1], cells[2], cells.at(-1)]) {
      if (cell === undefined) throw new Error('No cell');
      await user.click(cell);
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(selected()).toEqual([]);
    // The box itself still selects.
    await user.click(within(rowAt(1)).getByRole('checkbox'));
    expect(selected()).toEqual(['t2']);
    // And once a row is selected a press on another row's cell still selects nothing.
    await user.click(
      cells[2] === undefined ? rowAt(2) : (rowAt(2).querySelectorAll('[role="gridcell"]')[1] as HTMLElement),
    );
    expect(selected()).toEqual(['t2']);
  });

  it('hands React Aria only the selected keys in items, keeping the others for the app', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selecting initial={['gone']} onChange={onChange} />);
    const all = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Select all' });
    // A stale key selects no row: the header box is empty, not indeterminate.
    expect(all.indeterminate).toBe(false);
    expect(all).not.toBeChecked();
    // Escape has nothing of the table's to clear, so it reaches the page.
    const page = vi.fn();
    document.addEventListener('keydown', page);
    focusRow(0);
    await user.keyboard('{Escape}');
    document.removeEventListener('keydown', page);
    expect(page).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    // A row selected through React Aria keeps the stale key for the app to drop.
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['t1', 'gone']);
    expect(all.indeterminate).toBe(true);
  });

  it('opens the row on Enter on its checkbox and never toggles it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selecting onChange={onChange} />);
    focusRow(1);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(within(rowAt(1)).getByRole('checkbox'));
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    expect(onChange).not.toHaveBeenCalled();
    // Space on the box still toggles it.
    await user.keyboard(' ');
    expect(selected()).toEqual(['t2']);
  });

  it('lets a key no row or header starts with reach the page, such as a "/" shortcut', async () => {
    const user = userEvent.setup();
    const page = vi.fn();
    document.addEventListener('keydown', page);
    render(<Selecting />);
    focusRow(0);
    await user.keyboard('/');
    await user.keyboard('7');
    // A letter typeahead would act on stops: React Aria would move to City Transit.
    await user.keyboard('c');
    document.removeEventListener('keydown', page);
    expect(page.mock.calls.map(([event]) => (event as KeyboardEvent).key)).toEqual(['/', '7']);
    expect(rowAt(0)).toHaveFocus();
  });

  it('gives the totals row no aria-selected, since it is never selected', () => {
    render(<Selecting columns={columnsWithTotal(FIVE)} />);
    const total = document.querySelector('tfoot [role="row"]');
    expect(total).not.toHaveAttribute('aria-selected');
    for (const row of bodyRows()) expect(row).toHaveAttribute('aria-selected', 'false');
  });

  it('lets Escape in a text field in the bar be the field, keeping the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Selecting
        initial={['t1']}
        onChange={onChange}
        bulkActions={<input type="text" aria-label="Note for the selected rows" />}
      />,
    );
    act(() => {
      screen.getByRole('textbox', { name: 'Note for the selected rows' }).focus();
    });
    await user.keyboard('{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('does not say a count again that held before a quick run of changes', () => {
    vi.useFakeTimers();
    render(<Selecting initial={['t1', 't2']} />);
    const status = document.querySelector('.data-table-count');
    if (status === null) throw new Error('No count status');
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status).toHaveTextContent(/^2 selected$/);
    const changes: MutationRecord[] = [];
    const observer = new MutationObserver((records) => {
      changes.push(...records);
    });
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    focusRow(2);
    fireEvent.keyDown(rowAt(2), { key: 'x', code: 'KeyX' });
    fireEvent.keyDown(rowAt(2), { key: 'x', code: 'KeyX' });
    act(() => {
      vi.advanceTimersByTime(QUIET_MS * 2);
    });
    changes.push(...observer.takeRecords());
    observer.disconnect();
    expect(selected()).toEqual(['t1', 't2']);
    expect(status).toHaveTextContent(/^2 selected$/);
    expect(changes).toEqual([]);
  });

  it('selects the range from the anchor on a Shift press on a row checkbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selecting onChange={onChange} />);
    await user.click(within(rowAt(1)).getByRole('checkbox'));
    expect(selected()).toEqual(['t2']);
    await user.keyboard('{Shift>}');
    await user.click(within(rowAt(3)).getByRole('checkbox'));
    await user.keyboard('{/Shift}');
    expect(selected()).toEqual(['t2', 't3', 't4']);
    expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining(['t2', 't3', 't4']));
    // Back up from the same anchor, the range follows, as Shift with the arrows does.
    await user.keyboard('{Shift>}');
    await user.click(within(rowAt(0)).getByRole('checkbox'));
    await user.keyboard('{/Shift}');
    expect(selected()).toEqual(['t1', 't2']);
    // Without Shift the box toggles its row alone.
    await user.click(within(rowAt(4)).getByRole('checkbox'));
    expect(selected()).toEqual(['t1', 't2', 't5']);
  });

  const AXE_CASES: [state: string, props: SelectingProps, focusBar?: boolean][] = [
    ['some selected', { initial: ['t1', 't3'] }],
    ['all selected', { initial: ['t1', 't2', 't3', 't4', 't5'] }],
    [
      'the bar focused',
      { initial: ['t2'], bulkActions: <Button variant="secondary">Categorize</Button> },
      true,
    ],
    ['a disabled row selected around', { initial: ['t2', 't4'], disabledKeys: ['t3'] }],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_state, props, focusBar = false) => {
    const { container } = render(<Selecting {...props} />);
    if (focusBar) {
      act(() => {
        screen.getByRole('button', { name: 'Categorize' }).focus();
      });
    }
    await expectNoA11yViolations(container);
  });

  it('takes selection as both props or neither, as keys, with labels.select', () => {
    const base = { 'aria-label': 'T', items: FIVE, columns: COLUMNS, getKey: keyOf };
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error selectedKeys without onSelectionChange
    const half = <DataTable {...base} selectedKeys={['t1']} />;
    // @ts-expect-error onSelectionChange takes the keys, never React Aria's Selection
    const all = <DataTable {...base} selectedKeys={[]} onSelectionChange={(keys: Selection) => keys} />;
    // @ts-expect-error a row checkbox's name is labels.select, not selectRow (spec correction 5)
    const named = <DataTable {...base} labels={{ selectRow: (row: string) => row }} />;
    expect(half).toBeTruthy();
    expect(all).toBeTruthy();
    expect(named).toBeTruthy();
  });
});
