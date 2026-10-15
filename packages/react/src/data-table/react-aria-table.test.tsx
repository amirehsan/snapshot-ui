/*
 * The spike's jsdom half (plan Task 2, Step 1): what React Aria 1.22.1's own Table does that DataTable relies on
 * or guards, tested on React Aria's parts with the library's Link and Checkbox and no wrapper. Each test names
 * the spec correction it pins. The browser half, which needs layout, is ReactAriaTable.stories.tsx.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  type Key,
  type Selection,
  type SortDescriptor,
} from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Checkbox } from '../checkbox';
import { Link, RouterProvider } from '../link';

afterEach(() => {
  vi.restoreAllMocks();
});

const NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

interface PlainProps {
  footer?: ReactNode;
  rows?: string[];
  empty?: boolean;
  selection?: boolean;
  links?: boolean;
  onSelectionChange?: (keys: Selection) => void;
  sort?: SortDescriptor;
  onSortChange?: (sort: SortDescriptor) => void;
  disabledBehavior?: 'all' | 'selection';
}

/** React Aria's Table of names and amounts, with the options each test turns on. */
function Plain({
  footer,
  rows = NAMES,
  empty = true,
  selection = false,
  links = false,
  onSelectionChange,
  sort,
  onSortChange,
  disabledBehavior,
}: PlainProps): ReactElement {
  const [selected, setSelected] = useState<Selection>(new Set<Key>());
  return (
    <Table
      aria-label="Spending"
      selectionMode={selection ? 'multiple' : 'none'}
      selectionBehavior="toggle"
      selectedKeys={selected}
      onSelectionChange={(keys) => {
        setSelected(keys);
        onSelectionChange?.(keys);
      }}
      sortDescriptor={sort}
      onSortChange={onSortChange}
      disabledBehavior={disabledBehavior}
    >
      <TableHeader>
        {selection ? (
          <Column>
            <Checkbox slot="selection" aria-label="Select all" />
          </Column>
        ) : null}
        <Column id="name" isRowHeader allowsSorting>
          Name
        </Column>
        <Column id="amount" allowsSorting>
          Amount
        </Column>
      </TableHeader>
      <TableBody renderEmptyState={empty ? () => 'Nothing here' : undefined}>
        {rows.map((name, index) => (
          <Row key={name} id={name} textValue={name}>
            {selection ? (
              <Cell>
                <Checkbox slot="selection" aria-label="Select" />
              </Cell>
            ) : null}
            <Cell>{links ? <Link href={`/spend/${name}`}>{name}</Link> : name}</Cell>
            <Cell>{`$${String(index + 1)}.00`}</Cell>
          </Row>
        ))}
      </TableBody>
      {footer}
    </Table>
  );
}

const bodyRows = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('tbody [role="row"]')];

function rowAt(index: number): HTMLElement {
  const row = bodyRows()[index];
  if (row === undefined) throw new Error(`No row ${String(index)}`);
  return row;
}

describe('React Aria Table, as DataTable relies on it', () => {
  it('drops aria-current and aria-busy given to Row and Table, and keeps data attributes', () => {
    // Spec correction 2: so the current row's mark is data-current with aria-current on its link, and the
    // busy state goes on an element the library draws.
    const busy = { 'aria-busy': 'true', 'data-busy': '' } as object;
    const current = { 'aria-current': 'true', 'data-current': '' } as object;
    render(
      <Table aria-label="Spending" {...busy}>
        <TableHeader>
          <Column isRowHeader>Name</Column>
        </TableHeader>
        <TableBody>
          <Row id="a" {...current}>
            <Cell>Alpha</Cell>
          </Row>
        </TableBody>
      </Table>,
    );
    const grid = screen.getByRole('grid');
    expect(grid).not.toHaveAttribute('aria-busy');
    expect(grid).toHaveAttribute('data-busy', '');
    const [row] = bodyRows();
    expect(row).not.toHaveAttribute('aria-current');
    expect(row).toHaveAttribute('data-current', '');
  });

  it('renders renderEmptyState with no rows and no footer, and never with a footer row', () => {
    // Spec correction 3: a footer row counts in the collection, so totals render only while there are rows.
    const { unmount } = render(<Plain rows={[]} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(document.querySelector('tbody')).toHaveAttribute('data-empty', 'true');
    // React Aria's empty body is one row whose one cell spans every column (spec correction 4).
    const emptyCells = document.querySelectorAll('tbody tr > *');
    expect(emptyCells).toHaveLength(1);
    expect(emptyCells[0]).toHaveAttribute('colspan', '2');
    unmount();
    render(
      <Plain
        rows={[]}
        footer={
          <TableFooter>
            <Row id="__total">
              <Cell>Total</Cell>
              <Cell>$0.00</Cell>
            </Row>
          </TableFooter>
        }
      />,
    );
    expect(screen.queryByText('Nothing here')).toBeNull();
    expect(document.querySelector('tfoot')).toHaveTextContent('Total');
  });

  it('throws for a footer row with fewer cells than columns', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      render(
        <Plain
          footer={
            <TableFooter>
              <Row id="__total">
                <Cell>Total</Cell>
              </Row>
            </TableFooter>
          }
        />,
      ),
    ).toThrow(/Cell count must match column count/);
  });

  it('focuses a footer row that is isDisabled with disabledBehavior selection, and never selects it', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Plain
        rows={['Alpha']}
        selection
        disabledBehavior="selection"
        onSelectionChange={onSelectionChange}
        footer={
          <TableFooter>
            <Row id="__total" isDisabled textValue="Total">
              <Cell />
              <Cell>Total</Cell>
              <Cell>$1.00</Cell>
            </Row>
          </TableFooter>
        }
      />,
    );
    // The disabled behavior is the table's: 'selection' keeps a disabled row focusable and unselectable.
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    const [alpha] = bodyRows();
    act(() => {
      alpha?.focus();
    });
    await user.keyboard('{ArrowDown}');
    const total = document.querySelector<HTMLElement>('tfoot [role="row"]');
    expect(total).toHaveFocus();
    await user.keyboard(' ');
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(total).not.toHaveAttribute('aria-selected', 'true');
  });

  it('names a row checkbox by its own aria-label and the row header, through aria-labelledby', () => {
    // Spec correction 5: labels.selectRow(row) would read the row twice, so the label is "Select".
    render(<Plain selection rows={['Alpha']} />);
    const box = within(rowAt(0)).getByRole('checkbox');
    expect(box).toHaveAccessibleName('Select Alpha');
    const labelledBy = box.getAttribute('aria-labelledby')?.split(' ') ?? [];
    expect(labelledBy).toHaveLength(2);
    expect(labelledBy).toContain(box.id);
  });

  it('selects a focused row on Enter when the row has no action, which the handler must stop', async () => {
    // The control for spec correction 6: with selection on, React Aria's Enter selects a row with no action.
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Plain selection links onSelectionChange={onSelectionChange} />);
    const [alpha] = bodyRows();
    act(() => {
      alpha?.focus();
    });
    await user.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(alpha).toHaveAttribute('aria-selected', 'true');
  });

  it('never selects a row on a click on the link in its cell', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <Plain selection links onSelectionChange={onSelectionChange} />
      </RouterProvider>,
    );
    // A selection first, so React Aria's own rule (a click selects once anything is selected) would apply.
    const bravo = rowAt(1);
    await user.click(within(rowAt(0)).getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    await user.click(within(bravo).getByRole('link', { name: 'Bravo' }));
    expect(navigate).toHaveBeenCalledWith('/spend/Bravo', undefined);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(bravo).not.toHaveAttribute('aria-selected', 'true');
  });

  it('stops typeahead when a capture listener on an ancestor stops the letter', async () => {
    const user = userEvent.setup();
    const stop = (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.key.length === 1 && event.key !== ' ') event.stopPropagation();
    };
    const { unmount } = render(<Plain />);
    // Without the guard, "c" moves focus to Charlie.
    let [alpha] = bodyRows();
    act(() => {
      alpha?.focus();
    });
    await user.keyboard('c');
    expect(bodyRows()[2]).toHaveFocus();
    unmount();
    render(
      // A capture listener, as DataTable's root has.
      <div onKeyDownCapture={stop}>
        <Plain />
      </div>,
    );
    [alpha] = bodyRows();
    act(() => {
      alpha?.focus();
    });
    await user.keyboard('c');
    expect(alpha).toHaveFocus();
  });

  it('moves to a sorted column descending on a press when it is ascending', () => {
    const onSortChange = vi.fn();
    const { rerender } = render(<Plain onSortChange={onSortChange} />);
    const name = screen.getByRole('columnheader', { name: 'Name' });
    fireEvent.click(name);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'name', direction: 'ascending' });
    rerender(<Plain onSortChange={onSortChange} sort={{ column: 'name', direction: 'ascending' }} />);
    expect(name).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(name);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'name', direction: 'descending' });
  });
});
