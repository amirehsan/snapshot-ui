import type { Meta, StoryObj } from '@storybook/react-vite';
import { Receipt } from 'lucide-react';
import { useState, type ComponentType, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
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
    // Tab from the first table walks its row links, so the play puts focus on the second table's first row.
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
