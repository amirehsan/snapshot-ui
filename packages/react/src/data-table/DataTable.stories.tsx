import type { Meta, StoryObj } from '@storybook/react-vite';
import { Receipt } from 'lucide-react';
import { useState, type ComponentType, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { I18nProvider, type Key } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { Dialog } from '../dialog';
import { EmptyState } from '../empty-state';
import { RouterProvider } from '../link';
import { paint, tokenColor } from '../stories/paint';
import {
  COLUMNS,
  columnsWithTotal,
  hrefOf,
  keyOf,
  manyTransactions,
  TRANSACTIONS,
  type Transaction,
} from '../stories/transactions';
import { QUIET_MS } from '../utils/quiet';
import { DataTable, type DataTableColumn, type DataTableProps } from './DataTable';

/** The args the stories take: each story renders its own table, so none. */
type StoryArgs = Record<string, never>;

/**
 * The household's transactions in DataTable's table face. Every story sits in a box 60rem wide at most, the
 * width of a list page's content, inside a router whose navigate does nothing, and is tagged viewport-desktop,
 * so the list face (Task 4) changes none of their pictures.
 */
const meta = {
  title: 'Components/DataTable',
  component: DataTable as unknown as ComponentType<StoryArgs>,
  parameters: { layout: 'padded' },
  tags: ['viewport-desktop'],
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const EIGHT = TRANSACTIONS.slice(0, 8);

const noop = (): void => undefined;

/** The story columns in the order of `ids`, each with `changes` applied. */
const columnsOf = (
  ids: readonly string[],
  changes: Partial<Record<string, Partial<DataTableColumn<Transaction>>>> = {},
): DataTableColumn<Transaction>[] =>
  ids.map((id) => {
    const column = COLUMNS.find((each) => each.id === id);
    if (column === undefined) throw new Error(`No column ${id}`);
    return { ...column, ...changes[id] };
  });

/** Whether a cell is drawn: not display none and not hidden, as a column that has left is. */
const isShown = (cell: Element): boolean =>
  getComputedStyle(cell).display !== 'none' && getComputedStyle(cell).visibility !== 'hidden';

/** A box the width of a list page's content, or `width`. */
function Box({
  children,
  width = 'min(60rem, 100%)',
}: {
  children: ReactNode;
  width?: string;
}): ReactElement {
  return (
    <RouterProvider navigate={noop}>
      <div style={{ width }}>{children}</div>
    </RouterProvider>
  );
}

type Props = Partial<DataTableProps<Transaction>>;

/** The table with its sort in state, newest first, as an app holds it in its URL. */
function Sorted({ items = EIGHT, ...props }: Props): ReactElement {
  const [sort, setSort] = useState<NonNullable<Props['sortDescriptor']>>({
    column: 'date',
    direction: 'descending',
  });
  const rows = [...items].sort((a, b) => {
    const order = sort.column === 'amount' ? a.minor - b.minor : a.date.localeCompare(b.date);
    return sort.direction === 'ascending' ? order : -order;
  });
  return (
    <DataTable
      aria-label="Transactions"
      items={rows}
      columns={COLUMNS}
      getKey={keyOf}
      getRowHref={hrefOf}
      sortDescriptor={sort}
      onSortChange={setSort}
      {...(props as object)}
    />
  );
}

const bodyRows = (scope: ParentNode): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>('.data-table-body > [role="row"]'),
];

function rowAt(scope: ParentNode, index: number): HTMLElement {
  const row = bodyRows(scope)[index];
  if (row === undefined) throw new Error(`No row ${String(index)}`);
  return row;
}

function only(scope: ParentNode, selector: string): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** Tabs into the table and arrows down to body row `index`, as a keyboard reader arrives. */
async function focusRow(scope: ParentNode, index: number): Promise<HTMLElement> {
  const row = rowAt(scope, index);
  const grid = only(scope, '[role="grid"]');
  for (let step = 0; step < 8 && !grid.contains(document.activeElement); step += 1) await userEvent.tab();
  await expect(grid.contains(document.activeElement)).toBe(true);
  for (let step = 0; step < 12 && document.activeElement !== row; step += 1) {
    await userEvent.keyboard('{ArrowDown}');
  }
  await expect(row).toHaveFocus();
  return row;
}

/** Eight rows sorted by date, newest first; Date and Amount sort, Payee opens the row. */
export const Default: Story = {
  tags: ['viewport-desktop', 'density'],
  render: () => (
    <Box>
      <Sorted />
    </Box>
  ),
};

/** The totals row under the rows: the frame's rule above it, its cells at 700. */
export const Totals: Story = {
  render: () => (
    <Box>
      <Sorted columns={columnsWithTotal(EIGHT)} />
    </Box>
  ),
};

/** The third row's detail is open: a 3px ink bar at its start and its payee at 700. */
export const Current: Story = {
  render: () => (
    <Box>
      <Sorted currentKey="t3" />
    </Box>
  ),
};

/** No rows: the app's EmptyState across every column. */
export const Empty: Story = {
  render: () => (
    <Box>
      <Sorted
        items={[]}
        emptyState={
          <EmptyState
            icon={<Receipt />}
            title="No transactions this month"
            description="Transactions you add or import show here."
          />
        }
      />
    </Box>
  ),
};

/** Loading with no rows yet: eight rows of skeleton lines in the table's shape. */
export const Loading: Story = {
  render: () => (
    <Box>
      <Sorted items={[]} isLoading />
    </Box>
  ),
};

/** In a card: the sticky header takes the card's lifted fill through --data-table-surface. */
export const InCard: Story = {
  render: () => (
    <Box>
      <Card as="section" aria-labelledby="in-card-title">
        <CardHeader>
          <CardTitle id="in-card-title">October</CardTitle>
        </CardHeader>
        <CardBody>
          <div style={{ '--data-table-surface': 'var(--color-lifted)' } as CSSProperties}>
            <Sorted aria-label={undefined} aria-labelledby="in-card-title" items={TRANSACTIONS.slice(0, 5)} />
          </div>
        </CardBody>
      </Card>
    </Box>
  ),
};

/** In a 44rem box Category (md) has left and Account (sm) stays. */
export const ColumnsHidden: Story = {
  render: () => (
    <Box width="min(44rem, 100%)">
      <Sorted />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const headers = within(canvasElement).getAllByRole('columnheader', { hidden: true });
    const shown = headers.filter((cell) => getComputedStyle(cell).visibility !== 'hidden');
    await expect(shown.map((cell) => cell.textContent)).toEqual(['Date', 'Payee', 'Account', 'Amount']);
  },
};

/** The keyboard's ring: Tab into the table and Arrow Down puts the inset ring on the second row. */
export const KeyboardFocus: Story = {
  render: () => (
    <Box>
      <Sorted />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const row = await focusRow(canvasElement, 1);
    await expect(row).toHaveAttribute('data-focus-visible');
    await expect(getComputedStyle(row).outlineStyle).toBe('solid');
    await expect(getComputedStyle(row).outlineColor).toBe(tokenColor('--focus-ring-color', row));
  },
};

/** The fourth row is disabled: taupe, no link and no wash. */
export const DisabledRow: Story = {
  render: () => (
    <Box>
      <Sorted disabledKeys={['t4']} />
    </Box>
  ),
};

/** Persian transactions from the app, written in Persian digits, read right to left. */
const PERSIAN: readonly { id: string; date: string; payee: string; category: string; amount: string }[] = [
  { id: 'p1', date: '۲۲ مهر', payee: 'فروشگاه سر کوچه', category: 'خوراک', amount: '-۱۲۵٬۰۰۰ تومان' },
  { id: 'p2', date: '۲۲ مهر', payee: 'مترو', category: 'رفت و آمد', amount: '-۸٬۰۰۰ تومان' },
  { id: 'p3', date: '۲۱ مهر', payee: 'اجاره خانه', category: 'اجاره', amount: '-۱۲٬۰۰۰٬۰۰۰ تومان' },
  { id: 'p4', date: '۲۱ مهر', payee: 'حقوق', category: 'درآمد', amount: '۴۵٬۰۰۰٬۰۰۰ تومان' },
];

type PersianRow = (typeof PERSIAN)[number];

const PERSIAN_COLUMNS: readonly DataTableColumn<PersianRow>[] = [
  { id: 'date', header: 'تاریخ', cell: (row) => row.date, allowsSorting: true, width: '7rem' },
  { id: 'payee', header: 'گیرنده', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'دسته', cell: (row) => row.category, hideBelow: 'md' },
  {
    id: 'amount',
    header: 'مبلغ',
    cell: (row) => row.amount,
    align: 'end',
    width: '10rem',
    total: '۳۲٬۸۶۷٬۰۰۰ تومان',
  },
];

/** The table in Persian: columns from the right, amounts at the left, the current bar at the right. */
function PersianTable(): ReactElement {
  return (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <DataTable
          aria-label="تراکنش‌ها"
          items={PERSIAN}
          columns={PERSIAN_COLUMNS}
          getKey={(row) => row.id}
          getRowHref={(row) => `/transactions/${row.id}`}
          currentKey="p2"
          sortDescriptor={{ column: 'date', direction: 'descending' }}
          onSortChange={noop}
          labels={{ total: 'جمع', loading: 'در حال بارگذاری' }}
        />
      </div>
    </I18nProvider>
  );
}

/** Right to left: the payee at the right, amounts at the left in Persian digits, the bar at the right. */
export const RightToLeft: Story = {
  render: () => (
    <Box>
      <PersianTable />
    </Box>
  ),
};

/** A page's header 64px tall fixed at the top. */
function PageHeader(): ReactElement {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        insetBlockStart: 0,
        insetInline: 0,
        blockSize: 64,
        zIndex: 30,
        background: 'var(--color-lifted)',
        borderBlockEnd: '1px solid var(--color-frame)',
      }}
    />
  );
}

/** Sixty rows under a 64px header: after a scroll the header cells sit under it, at --page-sticky-top. */
export const StickyHeader: Story = {
  render: () => (
    <div style={{ '--page-sticky-top': '64px', paddingBlockStart: 80 } as CSSProperties}>
      <PageHeader />
      <Box>
        <Sorted items={manyTransactions(60)} />
      </Box>
    </div>
  ),
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 600);
    await waitFor(() => expect(window.scrollY).toBe(600));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    for (const header of within(canvasElement).getAllByRole('columnheader', { hidden: true })) {
      if (getComputedStyle(header).visibility === 'hidden') continue;
      await expect(Math.round(header.getBoundingClientRect().top)).toBe(64);
    }
  },
};

/** A press on a header sorts: ascending first, then descending; the mark and aria-sort follow the prop. */
export const SortCycle: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Sorted />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const amount = within(canvasElement).getByRole('columnheader', { name: 'Amount' });
    const date = within(canvasElement).getByRole('columnheader', { name: 'Date' });
    await expect(date).toHaveAttribute('aria-sort', 'descending');
    await expect(amount.querySelector('.lucide-arrow-up-down')).not.toBeNull();
    await userEvent.click(amount);
    await expect(amount).toHaveAttribute('aria-sort', 'ascending');
    await expect(amount.querySelector('.lucide-arrow-up')).not.toBeNull();
    await expect(date).toHaveAttribute('aria-sort', 'none');
    await expect(within(rowAt(canvasElement, 0)).getByRole('rowheader')).toHaveTextContent('Northside Rent');
    await userEvent.click(amount);
    await expect(amount).toHaveAttribute('aria-sort', 'descending');
    await expect(within(rowAt(canvasElement, 0)).getByRole('rowheader')).toHaveTextContent('Acme Payroll');
    // The sorted header is ink; one at rest is slate.
    await expect(getComputedStyle(amount).color).toBe(tokenColor('--color-ink', amount));
    await expect(getComputedStyle(date).color).toBe(tokenColor('--color-slate', date));
  },
};

/**
 * The hover look: a row with a link takes the 5% ink wash over the table's fill; a disabled row and the totals
 * row take none. The row is not React Aria's hoverable item (its press is the link's), so the play sets the
 * hover attribute the stylesheet pairs with :hover rather than moving a pointer the test cannot move for real.
 */
export const HoverWash: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Sorted columns={columnsWithTotal(EIGHT)} disabledKeys={['t4']} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const hovered = (row: HTMLElement): string => {
      row.setAttribute('data-hovered', 'true');
      const { backgroundColor } = getComputedStyle(row);
      row.removeAttribute('data-hovered');
      return backgroundColor;
    };
    const first = rowAt(canvasElement, 0);
    await expect(hovered(first)).toBe(
      paint('color-mix(in srgb, var(--color-ink) 5%, var(--color-canvas))', first),
    );
    const disabled = canvasElement.querySelector<HTMLElement>('.data-table-body [data-disabled]');
    if (disabled === null) throw new Error('No disabled row');
    await expect(hovered(disabled)).toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(disabled).color).toBe(tokenColor('--color-taupe', disabled));
    await expect(hovered(only(canvasElement, '.data-table-footer [role="row"]'))).toBe('rgba(0, 0, 0, 0)');
  },
};

/** The three widths of the table's box the full-width check draws: all columns, md gone, md and sm gone. */
const BOX_WIDTHS = ['100%', '44rem', '38rem'] as const;

/** The left and right edges of a box, rounded to a tenth of a pixel. */
const edges = (element: Element): [number, number] => {
  const { left, right } = element.getBoundingClientRect();
  return [Math.round(left * 10) / 10, Math.round(right * 10) / 10];
};

const shownCells = (row: Element): HTMLElement[] =>
  [...row.children].filter(
    (cell): cell is HTMLElement =>
      cell instanceof HTMLElement &&
      getComputedStyle(cell).display !== 'none' &&
      getComputedStyle(cell).visibility !== 'hidden',
  );

/**
 * The table is the full width of its box at every width, its header and its rows ruled edge to edge, and in the
 * loading body each skeleton cell sits under its header cell, an end-aligned line ending under its header's
 * end. A column that has left keeps its cells at zero width, so React Aria's empty cell, which spans every
 * column, and the header count the same columns (spec correction 26). Run in all three engines.
 */
export const FullWidth: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box>
      <div style={{ display: 'grid', gap: 32 }}>
        {BOX_WIDTHS.map((width) => (
          <div
            key={width}
            style={{ display: 'grid', gap: 16, width: `min(${width}, 100%)` }}
            data-width={width}
          >
            <Sorted columns={columnsWithTotal(TRANSACTIONS.slice(0, 3))} items={TRANSACTIONS.slice(0, 3)} />
            <Sorted items={[]} isLoading loadingRowCount={2} aria-label="Loading transactions" />
          </div>
        ))}
      </div>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const expected = {
      '100%': ['Date', 'Payee', 'Category', 'Account', 'Amount'],
      '44rem': ['Date', 'Payee', 'Account', 'Amount'],
      '38rem': ['Date', 'Payee', 'Amount'],
    };
    for (const width of BOX_WIDTHS) {
      const holder = only(canvasElement, `[data-width="${width}"]`);
      for (const root of holder.querySelectorAll<HTMLElement>('.data-table')) {
        const table = only(root, '.data-table-table');
        const [start, end] = edges(root);
        await expect(edges(table), `table in ${width}`).toEqual([start, end]);
        const headers = shownCells(only(root, 'thead [role="row"]'));
        await expect(
          headers.map((cell) => cell.textContent),
          `columns in ${width}`,
        ).toEqual(expected[width]);
        // The header cells, and their rule, run from the table's start to its end with no gap.
        await expect(edges(headers[0] ?? table)[0]).toBe(start);
        await expect(edges(headers.at(-1) ?? table)[1]).toBe(end);
        for (const [index, cell] of headers.slice(1).entries()) {
          await expect(edges(cell)[0]).toBeCloseTo(edges(headers[index] ?? cell)[1], 0);
        }
        const rows = [...root.querySelectorAll('tbody [role="row"], tfoot [role="row"]')];
        const skeleton = root.querySelector('.data-table-skeleton-row');
        if (skeleton === null) {
          for (const row of rows) {
            const cells = shownCells(row);
            await expect(cells.map(edges), `a row in ${width}`).toEqual(headers.map(edges));
          }
          continue;
        }
        await expect(edges(skeleton)).toEqual([start, end]);
        const cells = shownCells(skeleton);
        await expect(cells.map(edges), `skeleton cells in ${width}`).toEqual(headers.map(edges));
        // The amount's line ends under the amount header's text, at the cell's end less its padding.
        const amount = cells.at(-1);
        const line = amount?.querySelector('.skeleton');
        const label = headers.at(-1)?.querySelector('.data-table-column-inner');
        if (!line || !label) throw new Error(`No amount line in ${width}`);
        await expect(edges(line)[1]).toBeCloseTo(edges(label)[1], 0);
      }
    }
  },
};

/** The first and last columns leave under 48rem: Category first and Account last, both md. */
const EDGE_COLUMNS = columnsOf(['category', 'date', 'payee', 'amount', 'account'], {
  account: { hideBelow: 'md' },
});

/** After `step`, focus is on `element`, and the grid's one tab stop is never a cell or header that has left. */
async function expectFocus(grid: HTMLElement, element: HTMLElement | undefined, step: string): Promise<void> {
  await waitFor(() => expect(element?.contains(document.activeElement), `focus after ${step}`).toBe(true));
  const stops = [...grid.querySelectorAll('[tabindex="0"]')];
  await expect(stops.every(isShown), `tab stop after ${step}`).toBe(true);
}

/**
 * The arrows step over a column that has left: in a 44rem box Category is hidden, and Arrow Right from the
 * payee lands on Account, Arrow Left back on the payee (spec correction 8). In a second table the first and last
 * columns have left: Arrow Up from the first row lands on the first shown header, Arrow Left and Right in the
 * header row wrap past them as React Aria wraps, Home and End stop at the shown ends, and Ctrl+Home and Ctrl+End
 * (off a Mac, where React Aria takes them) reach the first and last shown cells. Run in all three engines.
 */
export const ArrowsSkipHidden: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box width="min(44rem, 100%)">
      <div style={{ display: 'grid', gap: 32 }}>
        <Sorted />
        <div data-edges="">
          <Sorted aria-label="Transactions with edge columns" columns={EDGE_COLUMNS} />
        </div>
      </div>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const row = await focusRow(canvasElement, 0);
    const cells = [...row.querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]')];
    await expect(getComputedStyle(cells[2] ?? row).visibility).toBe('hidden');
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[0]?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[1]?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[3]?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(cells[1]?.contains(document.activeElement)).toBe(true));

    // The header row of the same table: Payee's header, then over Category to Account's and back.
    const grid = only(canvasElement, '[role="grid"]');
    const headers = [...grid.querySelectorAll<HTMLElement>('[role="columnheader"]')];
    await userEvent.keyboard('{ArrowUp}');
    await expectFocus(grid, headers[1], 'Arrow Up');
    await userEvent.keyboard('{ArrowRight}');
    await expectFocus(grid, headers[3], 'Arrow Right');
    await userEvent.keyboard('{ArrowLeft}');
    await expectFocus(grid, headers[1], 'Arrow Left');

    // The table whose first and last columns have left.
    const edgeTable = only(canvasElement, '[data-edges]');
    const edgeGrid = only(edgeTable, '[role="grid"]');
    const edgeHeaders = [...edgeGrid.querySelectorAll<HTMLElement>('[role="columnheader"]')];
    await expect(edgeHeaders.map((cell) => isShown(cell))).toEqual([false, true, true, true, false]);
    // The play puts focus on the second table's first row directly.
    rowAt(edgeTable, 0).focus();
    await expect(rowAt(edgeTable, 0)).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expectFocus(edgeGrid, edgeHeaders[1], 'Arrow Up');
    await userEvent.keyboard('{ArrowLeft}');
    await expectFocus(edgeGrid, edgeHeaders[3], 'Arrow Left');
    await userEvent.keyboard('{ArrowRight}');
    await expectFocus(edgeGrid, edgeHeaders[1], 'Arrow Right');
    await userEvent.keyboard('{End}');
    await expectFocus(edgeGrid, edgeHeaders[3], 'End');
    await userEvent.keyboard('{Home}');
    await expectFocus(edgeGrid, edgeHeaders[1], 'Home');
    const first = rowAt(edgeTable, 0).querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]');
    await userEvent.keyboard('{ArrowDown}');
    await expectFocus(edgeGrid, first[1], 'Arrow Down');
    if (/^Mac/i.test(navigator.platform)) return;
    const last = bodyRows(edgeTable).at(-1);
    if (last === undefined) throw new Error('No last row');
    const lastCells = last.querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]');
    await userEvent.keyboard('{Control>}{End}{/Control}');
    await expectFocus(edgeGrid, lastCells[3], 'Ctrl+End');
    await userEvent.keyboard('{Control>}{Home}{/Control}');
    await expectFocus(edgeGrid, first[1], 'Ctrl+Home');
  },
};

/** An app's own checkbox in a cell, a span with the checkbox role, as a star or a flag toggle is drawn. */
function FlagBox({ name }: { name: string }): ReactElement {
  const [checked, setChecked] = useState(false);
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-label={`Flag ${name}`}
      tabIndex={0}
      data-flag=""
      style={{ display: 'inline-block', inlineSize: 24, blockSize: 24, border: '1px solid currentColor' }}
      onClick={() => {
        setChecked((value) => !value);
      }}
      onKeyDown={(event) => {
        if (event.key !== ' ') return;
        event.preventDefault();
        setChecked((value) => !value);
      }}
    />
  );
}

/** The router's navigate, a spy, so a play can tell a press that opened the row from one that did not. */
const navigate = fn();

/** Columns with a cell of the app's own controls: its checkbox, a label around an input, an opt-in mark. */
const CONTROL_COLUMNS: readonly DataTableColumn<Transaction>[] = [
  ...columnsOf(['date', 'payee', 'amount']),
  {
    id: 'controls',
    header: 'Flag',
    width: '10rem',
    cell: (row) => (
      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <FlagBox name={row.payee} />
        <label data-label="">
          <input type="checkbox" aria-label={`Reviewed ${row.payee}`} />
        </label>
        <span className="data-table-control" data-opt-in="">
          Note
        </span>
      </span>
    ),
  },
];

/**
 * A cell's own controls take their own press over the stretched row link: an app's span with the checkbox role,
 * a label, and anything with the opt-in data-table-control class are what the browser finds under the pointer,
 * and a press on the checkbox checks it and never opens the row. Run in all three engines.
 */
export const CellControlsRaised: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <div style={{ width: 'min(60rem, 100%)' }}>
        <DataTable
          aria-label="Transactions"
          items={EIGHT}
          columns={CONTROL_COLUMNS}
          getKey={keyOf}
          getRowHref={hrefOf}
        />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    const row = rowAt(canvasElement, 1);
    const at = (element: Element): Element | null => {
      const { left, top, width, height } = element.getBoundingClientRect();
      return document.elementFromPoint(left + width / 2, top + height / 2);
    };
    const flag = only(row, '[data-flag]');
    await expect(at(flag)).toBe(flag);
    await expect(at(only(row, '[data-label] input'))).toBe(only(row, '[data-label] input'));
    await expect(at(only(row, '[data-opt-in]'))).toBe(only(row, '[data-opt-in]'));
    // Elsewhere on the row the stretched link is what the browser finds.
    const amount = row.querySelectorAll('[role="gridcell"]')[1];
    if (amount === undefined) throw new Error('No amount cell');
    await expect(at(amount)?.closest('.data-table-link')).not.toBeNull();
    await userEvent.click(flag);
    await expect(flag).toHaveAttribute('aria-checked', 'true');
    await expect(navigate).not.toHaveBeenCalled();
  },
};

/** The widths of the box for the current bar: all columns, md gone, md and sm gone. */
const BAR_COLUMNS = columnsOf(['category', 'account', 'date', 'payee', 'amount']);

/**
 * The current row's bar is drawn on its first shown cell: Category at full width, Account once Category has
 * left under 48rem, and Date once both have left under 40rem; a cell that has left draws no bar, and every shown
 * cell keeps its header's edges, so nothing moves. Run in all three engines.
 */
export const CurrentBarPastHidden: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box>
      <div style={{ display: 'grid', gap: 32 }}>
        {BOX_WIDTHS.map((width) => (
          <div key={width} style={{ width: `min(${width}, 100%)` }} data-width={width}>
            <Sorted columns={BAR_COLUMNS} currentKey="t2" />
          </div>
        ))}
      </div>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const barred = { '100%': 'Category', '44rem': 'Account', '38rem': 'Date' };
    for (const width of BOX_WIDTHS) {
      const holder = only(canvasElement, `[data-width="${width}"]`);
      const current = only(holder, '.data-table-row[data-current]');
      const headers = [...only(holder, 'thead [role="row"]').children];
      const cells = [...current.children] as HTMLElement[];
      const shown = cells.filter(isShown);
      const index = cells.indexOf(shown[0] ?? current);
      await expect(headers[index]?.textContent, `bar in ${width}`).toBe(barred[width]);
      await expect(getComputedStyle(shown[0] ?? current).borderLeftWidth, `bar in ${width}`).toBe('3px');
      await expect(getComputedStyle(shown[0] ?? current).borderLeftColor).toBe(
        tokenColor('--color-ink', current),
      );
      for (const cell of cells.filter((each) => each !== shown[0])) {
        await expect(getComputedStyle(cell).borderLeftWidth, `no bar in ${width}`).toBe('0px');
      }
      for (const cell of shown) {
        await expect(edges(cell), `edges in ${width}`).toEqual(edges(headers[cells.indexOf(cell)] ?? cell));
      }
    }
  },
};

/** Loading says "Loading" once, after the quiet pause, in a status outside the busy grid. */
export const LoadingStatus: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Sorted items={[]} isLoading />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const status = only(canvasElement, '.data-table-status');
    const busy = only(canvasElement, '[aria-busy="true"]');
    await expect(busy).toHaveClass('data-table-grid');
    await expect(busy.contains(status)).toBe(false);
    await waitFor(() => expect(status).toHaveTextContent('Loading'), { timeout: QUIET_MS + 2000 });
    await expect(canvasElement.querySelectorAll('.data-table-skeleton-row')).toHaveLength(8);
  },
};

/** The bar's two actions in every selection story: a secondary Categorize and a danger Delete. */
const ACTIONS = (
  <>
    <Button variant="secondary">Categorize</Button>
    <Button variant="danger">Delete</Button>
  </>
);

/** The sorted table with selection in local state, as a page holds it, and the bar's two actions. */
function Selecting({ initial = [], ...props }: Props & { initial?: Key[] }): ReactElement {
  const [keys, setKeys] = useState<Key[]>(initial);
  return (
    <Sorted
      {...props}
      selectedKeys={keys}
      onSelectionChange={setKeys}
      bulkActions={props.bulkActions ?? ACTIONS}
    />
  );
}

/** The selected rows' keys, in the order drawn. */
const selectedKeysOf = (scope: ParentNode): string[] =>
  bodyRows(scope)
    .filter((row) => row.getAttribute('aria-selected') === 'true')
    .map((row) => row.getAttribute('data-key') ?? '');

/** Three rows selected: their boxes checked, the header box's dash, the 8% rows and the bar under the table. */
export const Selected: Story = {
  tags: ['viewport-desktop', 'density'],
  render: () => (
    <Box>
      <Selecting initial={['t2', 't4', 't5']} />
    </Box>
  ),
};

/** Every row selected: every box checked, the header's too. */
export const AllSelected: Story = {
  render: () => (
    <Box>
      <Selecting initial={EIGHT.map(keyOf)} />
    </Box>
  ),
};

/** Persian digits, written by the app, as formatCount gives them. */
const persianDigits = (count: number): string =>
  String(count).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);

/** The Persian table with selection in local state. */
function PersianSelecting({ initial }: { initial: Key[] }): ReactElement {
  const [keys, setKeys] = useState<Key[]>(initial);
  return (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <DataTable
          aria-label="تراکنش‌ها"
          items={PERSIAN}
          columns={PERSIAN_COLUMNS}
          getKey={(row) => row.id}
          getRowHref={(row) => `/transactions/${row.id}`}
          sortDescriptor={{ column: 'date', direction: 'descending' }}
          onSortChange={noop}
          selectedKeys={keys}
          onSelectionChange={setKeys}
          formatCount={persianDigits}
          bulkActions={
            <>
              <Button variant="secondary">دسته‌بندی</Button>
              <Button variant="danger">حذف</Button>
            </>
          }
          labels={{
            total: 'جمع',
            loading: 'در حال بارگذاری',
            selectAll: 'انتخاب همه',
            select: 'انتخاب',
            clearSelection: 'پاک کردن انتخاب',
            selected: (count) => `${count} انتخاب شده`,
            toolbar: 'کارهای گروهی',
          }}
        />
      </div>
    </I18nProvider>
  );
}

/** Right to left with two selected: the checkboxes at the right, the count in Persian digits at the bar's right. */
export const SelectedRightToLeft: Story = {
  render: () => (
    <Box>
      <PersianSelecting initial={['p1', 'p3']} />
    </Box>
  ),
};

/** The bar's ring: two rows selected by X, then Tab from the table lands on Categorize with the ring. */
export const BarKeyboardFocus: Story = {
  render: () => (
    <Box>
      <Selecting />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await focusRow(canvasElement, 0);
    await userEvent.keyboard('x');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('x');
    await expect(selectedKeysOf(canvasElement)).toEqual(['t1', 't2']);
    await userEvent.tab();
    const categorize = within(canvasElement).getByRole('button', { name: 'Categorize' });
    await waitFor(() => expect(categorize).toHaveFocus());
    await expect(categorize).toHaveAttribute('data-focus-visible');
  },
};

/**
 * The keys in order: J and J move down two rows, K back up one, X selects that row, Space unselects it, X again,
 * Enter opens it through the router without selecting it, and Shift with Arrow Up extends from it. Run in all
 * three engines, since the handler dispatches the arrows itself (spec correction 7).
 */
export const Keys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <div style={{ width: 'min(60rem, 100%)' }}>
        <Selecting />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    await focusRow(canvasElement, 0);
    await userEvent.keyboard('j');
    await waitFor(() => expect(rowAt(canvasElement, 1)).toHaveFocus());
    await userEvent.keyboard('j');
    await waitFor(() => expect(rowAt(canvasElement, 2)).toHaveFocus());
    await userEvent.keyboard('k');
    await waitFor(() => expect(rowAt(canvasElement, 1)).toHaveFocus());
    await userEvent.keyboard('x');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2']));
    await expect(rowAt(canvasElement, 1)).toHaveFocus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual([]));
    await userEvent.keyboard('x');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2']));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    await expect(selectedKeysOf(canvasElement)).toEqual(['t2']);
    // Shift and an arrow extend from the anchor X set, t2, as from Space's.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(rowAt(canvasElement, 3)).toHaveFocus());
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2', 't3']));
  },
};

/** A Persian layout's J and X: key ت with code KeyJ moves down, key ط with code KeyX selects. Three engines. */
export const PersianLayoutKeys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box>
      <Selecting />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const first = await focusRow(canvasElement, 0);
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ت', code: 'KeyJ', bubbles: true, cancelable: true }),
    );
    await waitFor(() => expect(rowAt(canvasElement, 1)).toHaveFocus());
    rowAt(canvasElement, 1).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ط', code: 'KeyX', bubbles: true, cancelable: true }),
    );
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2']));
    rowAt(canvasElement, 1).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ن', code: 'KeyK', bubbles: true, cancelable: true }),
    );
    await waitFor(() => expect(first).toHaveFocus());
  },
};

/** A letter never moves focus, with selection on: React Aria's typeahead would go to City Transit. Three engines. */
export const TypeaheadStopped: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box>
      <Selecting />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const first = await focusRow(canvasElement, 0);
    for (const letter of ['c', 'i', 'n', 'a']) {
      await userEvent.keyboard(letter);
      await expect(first).toHaveFocus();
    }
    await expect(selectedKeysOf(canvasElement)).toEqual([]);
  },
};

/**
 * Ctrl+Enter on a row: the handler dispatches a click carrying Ctrl on the row's link, so React Aria's link
 * leaves it to the browser, and the row is not selected. The play records what reached the link and keeps the
 * page where it is, so what each browser would then open is not seen here. Three engines; the record reads
 * each engine's result.
 */
export const ModifierEnter: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <div style={{ width: 'min(60rem, 100%)' }}>
        <Selecting />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    const clicks: MouseEvent[] = [];
    // React Aria's press handling stops a link's click at React's root, so the play listens in the capture phase,
    // and keeps the page: a new tab, or in WebKit the same tab navigating, is not the play's to open.
    const keep = (event: MouseEvent): void => {
      if (!(event.target instanceof Element) || event.target.closest('.data-table-link') === null) return;
      clicks.push(event);
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) event.preventDefault();
    };
    window.addEventListener('click', keep, true);
    try {
      await focusRow(canvasElement, 1);
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      await waitFor(() => expect(clicks).toHaveLength(1));
      await expect(clicks[0]?.ctrlKey).toBe(true);
      await expect((clicks[0]?.target as Element).getAttribute('href')).toBe('/transactions/t2');
      await expect(navigate).not.toHaveBeenCalled();
      await expect(selectedKeysOf(canvasElement)).toEqual([]);
      // Without the modifier the router opens it.
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
      await expect(clicks[1]?.ctrlKey).toBe(false);
      await expect(selectedKeysOf(canvasElement)).toEqual([]);
    } finally {
      window.removeEventListener('click', keep, true);
    }
  },
};

/**
 * The table is one tab stop (spec 7.2): Tab from before it lands in it once, the next Tab leaves it for the bar,
 * Shift+Tab from the bar returns to the row last focused, and with nothing selected Tab leaves for what follows.
 * No row link and no checkbox is in the tab order; the arrows reach them. Three engines.
 */
export const TabStop: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box>
      <button type="button">Before</button>
      <Selecting />
      <button type="button">After</button>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const before = within(canvasElement).getByRole('button', { name: 'Before' });
    const after = within(canvasElement).getByRole('button', { name: 'After' });
    const grid = only(canvasElement, '[role="grid"]');
    for (const element of grid.querySelectorAll('a, input')) {
      await expect(element).toHaveAttribute('tabindex', '-1');
    }
    before.focus();
    await userEvent.tab();
    await waitFor(() => expect(rowAt(canvasElement, 0)).toHaveFocus());
    // Nothing selected: the next stop is after the table.
    await userEvent.tab();
    await waitFor(() => expect(after).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(rowAt(canvasElement, 0)).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}x');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t3']));
    // With the bar shown, the next stop is the bar, and Shift+Tab comes back to the third row.
    await userEvent.tab();
    const categorize = within(canvasElement).getByRole('button', { name: 'Categorize' });
    await waitFor(() => expect(categorize).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(rowAt(canvasElement, 2)).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(before).toHaveFocus());
  },
};

/**
 * Shift with an arrow extends the selection next to a column that has left (spec 7.2, spec correction 30): in a
 * 44rem box Category is hidden, X on the first row sets the anchor, and on the second row Shift+Arrow Right from
 * the payee, whose next cell has left, lands on Account and extends to that row, as React Aria would have; Shift+
 * Arrow Left back over the hidden cell keeps it, and Shift+Arrow Down extends a row further. Three engines.
 */
export const ShiftPastHidden: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box width="min(44rem, 100%)">
      <Selecting />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await focusRow(canvasElement, 0);
    await userEvent.keyboard('x');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t1']));
    const row = rowAt(canvasElement, 1);
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(row).toHaveFocus());
    const cells = [...row.querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]')];
    // The checkbox, Date, Payee, Category (left at 44rem), Account, Amount.
    await expect(cells.map((cell) => isShown(cell))).toEqual([true, true, true, false, true, true]);
    const grid = only(canvasElement, '[role="grid"]');
    for (const index of [0, 1, 2]) {
      await userEvent.keyboard('{ArrowRight}');
      await expectFocus(grid, cells[index], `Arrow Right to cell ${String(index)}`);
    }
    // Moving without Shift changed nothing.
    await expect(selectedKeysOf(canvasElement)).toEqual(['t1']);
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await expectFocus(grid, cells[4], 'Shift+Arrow Right');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t1', 't2']));
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    await expectFocus(grid, cells[2], 'Shift+Arrow Left');
    await expect(selectedKeysOf(canvasElement)).toEqual(['t1', 't2']);
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t1', 't2', 't3']));
  },
};

/** Escape in the table clears the selection; the bar leaves and focus stays on the row. */
export const EscapeClears: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Selecting initial={['t1', 't2']} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('toolbar', { name: 'Bulk actions' })).toBeVisible();
    const row = await focusRow(canvasElement, 1);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual([]));
    await expect(within(canvasElement).queryByRole('toolbar')).toBeNull();
    await expect(row).toHaveFocus();
  },
};

/** Clear selection, and Escape in the bar, clear and put focus back in the table. */
export const ClearFocus: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Selecting initial={['t1', 't2']} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const grid = only(canvasElement, '[role="grid"]');
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Clear selection' }));
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual([]));
    await expect(within(canvasElement).queryByRole('toolbar')).toBeNull();
    await waitFor(() => expect(grid.contains(document.activeElement)).toBe(true));
    // Again by Escape from an action.
    await userEvent.keyboard('x');
    const categorize = await within(canvasElement).findByRole('button', { name: 'Categorize' });
    categorize.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual([]));
    await waitFor(() => expect(grid.contains(document.activeElement)).toBe(true));
  },
};

/** A selected row is the 8% wash, held under the pointer; an unselected one hovered is 5%. */
export const HoverSelected: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Selecting initial={['t1']} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const hovered = (row: HTMLElement): string => {
      row.setAttribute('data-hovered', 'true');
      const { backgroundColor } = getComputedStyle(row);
      row.removeAttribute('data-hovered');
      return backgroundColor;
    };
    const first = rowAt(canvasElement, 0);
    const second = rowAt(canvasElement, 1);
    const eight = paint('color-mix(in srgb, var(--color-ink) 8%, var(--color-canvas))', first);
    await expect(getComputedStyle(first).backgroundColor).toBe(eight);
    await expect(hovered(first)).toBe(eight);
    await expect(hovered(second)).toBe(
      paint('color-mix(in srgb, var(--color-ink) 5%, var(--color-canvas))', second),
    );
    // The checked box marks it too: never color alone.
    await expect(within(first).getByRole('checkbox')).toBeChecked();
  },
};

/**
 * Sixty rows with two selected: scrolled so the table's end is below the viewport, the bar sits 16px over the
 * bottom edge (the tab bar's reserve is 0 here); scrolled to the end, it sits under the table.
 */
export const StickyBar: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Selecting items={manyTransactions(60)} initial={['m1', 'm2']} />
      <p style={{ blockSize: 400 }}>After the table</p>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const bar = only(canvasElement, '.data-table-bar');
    window.scrollTo(0, 400);
    await waitFor(() => expect(window.scrollY).toBe(400));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const table = only(canvasElement, '.data-table-table');
    await expect(table.getBoundingClientRect().bottom).toBeGreaterThan(window.innerHeight);
    await expect(Math.round(window.innerHeight - bar.getBoundingClientRect().bottom)).toBe(16);
    // At the end of the page the bar has come to rest under the table.
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await expect(bar.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      table.getBoundingClientRect().bottom,
    );
    window.scrollTo(0, 0);
  },
};

/**
 * A table in an open Dialog keeps its keys (spec 7.2): the modal it sits in is the top-most, so the handler does
 * not stand down. Enter opens the row without selecting it, J moves, X selects, and a letter that React Aria's
 * typeahead would act on leaves focus where it is. Three engines.
 */
export const InDialog: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <Dialog title="Pick transactions" isOpen size="lg">
        <Selecting />
      </Dialog>
    </RouterProvider>
  ),
  play: async () => {
    navigate.mockClear();
    const dialog = await within(document.body).findByRole('dialog');
    const grid = only(dialog, '[role="grid"]');
    const first = rowAt(dialog, 0);
    first.focus();
    await expect(first).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await expect(selectedKeysOf(dialog)).toEqual([]);
    await userEvent.keyboard('j');
    await waitFor(() => expect(rowAt(dialog, 1)).toHaveFocus());
    await userEvent.keyboard('x');
    await waitFor(() => expect(selectedKeysOf(dialog)).toEqual(['t2']));
    // React Aria's typeahead would move to Northside Rent.
    await userEvent.keyboard('n');
    await expect(rowAt(dialog, 1)).toHaveFocus();
    await expect(grid.contains(document.activeElement)).toBe(true);
  },
};

/** The bar's Delete, which asks first: a confirm dialog whose Delete clears the selection, as an app's does. */
function ConfirmingDelete(): ReactElement {
  const [keys, setKeys] = useState<Key[]>(['t2', 't3']);
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Sorted
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
        title="Delete two transactions?"
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
            Delete them
          </Button>
        }
      />
    </Box>
  );
}

/**
 * A bulk action that asks in a dialog: its confirm clears the selection, so the bar leaves while focus is in the
 * dialog. Once the dialog has closed, focus is on the table, not the page (spec 7.1).
 */
export const ConfirmClears: Story = {
  tags: ['no-visual'],
  render: () => <ConfirmingDelete />,
  play: async ({ canvasElement }) => {
    const grid = only(canvasElement, '[role="grid"]');
    within(canvasElement).getByRole('button', { name: 'Delete' }).focus();
    await userEvent.keyboard('{Enter}');
    const dialog = await within(document.body).findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Delete them' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    confirm.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull(), { timeout: 3000 });
    await expect(within(canvasElement).queryByRole('toolbar')).toBeNull();
    await waitFor(() => expect(grid.contains(document.activeElement)).toBe(true));
  },
};

/**
 * A press on a row without a link selects nothing (ruling 2, spec 7.1): on its date, its payee, its amount and
 * the checkbox cell around the box, before and after a row is selected; only the box selects. Three engines.
 */
export const PressNeverSelects: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box>
      <Selecting getRowHref={undefined} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const row = rowAt(canvasElement, 1);
    const cell = (index: number, scope: HTMLElement = row): HTMLElement => {
      const found = scope.querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]')[index];
      if (found === undefined) throw new Error(`No cell ${String(index)}`);
      return found;
    };
    // The checkbox cell's corner, outside the box's 40px hit area, then the date, the payee and the amount.
    const corner = cell(0).getBoundingClientRect();
    await userEvent.pointer({
      keys: '[MouseLeft]',
      target: cell(0),
      coords: { clientX: corner.left + 2, clientY: corner.top + 2 },
    });
    for (const index of [1, 2, 5]) await userEvent.click(cell(index));
    await expect(selectedKeysOf(canvasElement)).toEqual([]);
    await userEvent.click(only(row, '.checkbox-box'));
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2']));
    await userEvent.click(cell(2, rowAt(canvasElement, 2)));
    await expect(selectedKeysOf(canvasElement)).toEqual(['t2']);
  },
};
