import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Download, Ellipsis, Receipt, RotateCw, Tag, Trash2 } from 'lucide-react';
import { useState, type ComponentType, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider, type Key } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { Dialog } from '../dialog';
import { EmptyState } from '../empty-state';
import { IconButton } from '../icon-button';
import { RouterProvider } from '../link';
import { focusOn } from '../stories/focus';
import { paint, tokenColor } from '../stories/paint';
import {
  COLUMNS,
  columnsWithTotal,
  groupOf,
  hrefOf,
  keyOf,
  manyTransactions,
  money,
  TRANSACTIONS,
  type Transaction,
} from '../stories/transactions';
import { PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { QUIET_MS } from '../utils/quiet';
import { DataTable, type DataTableBulkAction, type DataTableColumn, type DataTableProps } from './DataTable';

/** The args the stories take: each story renders its own table, so none. */
type StoryArgs = Record<string, never>;

/**
 * The household's transactions in DataTable's two faces. The table's stories sit in a box 60rem wide at most, the
 * width of a list page's content, inside a router whose navigate does nothing, and are tagged viewport-desktop,
 * so the list face changes none of their pictures. The list face's stories, the Phone ones, take the meta's tag
 * off and are tagged viewport-phone: at 375px the box is under 40rem and the list is the face drawn.
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

/** A box under 40rem for a play run at the 1200px the story tests default to, so the list is the face shown. */
const NARROW = '24rem';

/** The list face's items, in the order drawn. */
const listItems = (scope: ParentNode): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>('.data-table-list .data-table-item'),
];

function itemAt(scope: ParentNode, index: number): HTMLElement {
  const item = listItems(scope)[index];
  if (item === undefined) throw new Error(`No item ${String(index)}`);
  return item;
}

/** The selected items' keys, in the order drawn. */
const selectedItemsOf = (scope: ParentNode): string[] =>
  listItems(scope)
    .filter((item) => item.getAttribute('aria-selected') === 'true')
    .map((item) => item.getAttribute('data-key') ?? '');

/** Tabs into the list's grid, past its head, and arrows down to item `index`, as a keyboard reader arrives. */
async function focusItem(scope: ParentNode, index: number): Promise<HTMLElement> {
  const item = itemAt(scope, index);
  const grid = only(scope, '.data-table-list [role="grid"]');
  for (let step = 0; step < 8 && !grid.contains(document.activeElement); step += 1) await userEvent.tab();
  await expect(grid.contains(document.activeElement)).toBe(true);
  for (let step = 0; step < 12 && document.activeElement !== item; step += 1) {
    await userEvent.keyboard('{ArrowDown}');
  }
  await expect(item).toHaveFocus();
  return item;
}

/**
 * Presses at the centre of `element` as a pointer would: the browser's hit test finds what is drawn there (a
 * stretched link's ::after, or the item itself), and the press goes to that element at that point, in every
 * engine. Returns what was hit.
 */
async function pressAt(element: Element): Promise<HTMLElement> {
  const box = element.getBoundingClientRect();
  const clientX = box.left + box.width / 2;
  const clientY = box.top + box.height / 2;
  const hit = document.elementFromPoint(clientX, clientY);
  if (!(hit instanceof HTMLElement)) throw new Error('Nothing drawn there');
  await userEvent.pointer({ keys: '[MouseLeft]', target: hit, coords: { clientX, clientY } });
  return hit;
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
  { id: 'category', header: 'دسته', cell: (row) => row.category, hideBelow: 'md', listSlot: 'meta' },
  {
    id: 'amount',
    header: 'مبلغ',
    cell: (row) => row.amount,
    align: 'end',
    width: '10rem',
    total: '۳۲٬۸۶۷٬۰۰۰ تومان',
    listSlot: 'end',
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

/**
 * The three widths of the table's box the full-width checks draw: all columns, md gone, and under 40rem, where
 * the list face takes over from the table.
 */
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
    };
    for (const width of BOX_WIDTHS) {
      const holder = only(canvasElement, `[data-width="${width}"]`);
      for (const root of holder.querySelectorAll<HTMLElement>('.data-table')) {
        if (width === '38rem') {
          // Under 40rem the list is the face drawn, the full width of the box.
          await expect(getComputedStyle(only(root, '.data-table-grid')).display).toBe('none');
          await expect(edges(only(root, '.data-table-list'))).toEqual(edges(root));
          continue;
        }
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
 * header row stop at the shown ends where React Aria would wrap, Home and End reach them, and Ctrl+Home and Ctrl+End
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
    await focusOn(rowAt(edgeTable, 0));
    await userEvent.keyboard('{ArrowUp}');
    await expectFocus(edgeGrid, edgeHeaders[1], 'Arrow Up');
    // Left and Right stop at the header row's shown ends, where React Aria would wrap.
    await userEvent.keyboard('{ArrowLeft}');
    await expectFocus(edgeGrid, edgeHeaders[1], 'Arrow Left at the start');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expectFocus(edgeGrid, edgeHeaders[3], 'Arrow Right to the end');
    await userEvent.keyboard('{ArrowRight}');
    await expectFocus(edgeGrid, edgeHeaders[3], 'Arrow Right at the end');
    await userEvent.keyboard('{Home}');
    await expectFocus(edgeGrid, edgeHeaders[1], 'Home');
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

/** The widths of the box for the current bar: all columns, md gone, and the list. */
const BAR_COLUMNS = columnsOf(['category', 'account', 'date', 'payee', 'amount']);

/**
 * The current row's bar is drawn on its first shown cell: Category at full width and Account once Category has
 * left under 48rem; a cell that has left draws no bar, and every shown cell keeps its header's edges, so nothing
 * moves. Under 40rem the list is drawn, and the current item draws the bar at its own start. Run in all three
 * engines.
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
    const barred = { '100%': 'Category', '44rem': 'Account' };
    for (const width of BOX_WIDTHS) {
      const holder = only(canvasElement, `[data-width="${width}"]`);
      if (width === '38rem') {
        const item = only(holder, '.data-table-item[data-current]');
        await expect(getComputedStyle(item).borderLeftWidth).toBe('3px');
        await expect(getComputedStyle(item).borderLeftColor).toBe(tokenColor('--color-ink', item));
        continue;
      }
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

/** The columns with a slate line an app writes under the account, the secondary text a cell often holds. */
const NOTED = columnsOf(['date', 'payee', 'category', 'account', 'amount'], {
  account: {
    cell: (row) => (
      <>
        {row.account}
        <span style={{ display: 'block', color: 'var(--color-slate)', fontSize: 'var(--text-small)' }}>
          Ends 4821
        </span>
      </>
    ),
  },
});

/**
 * Slate text an app puts in a cell, in each state a row takes at once: at rest, the current row, a selected row
 * and a hovered one. The a11y check measures each after the play, in both themes, and fails the story under
 * 4.5:1: slate on the hover wash over the light canvas was 4.37.
 */
export const SlateInRowStates: Story = {
  tags: ['viewport-desktop', 'no-visual'],
  render: () => (
    <Box>
      <Selecting initial={['t2']} columns={NOTED} currentKey="t3" />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const row = rowAt(canvasElement, 0);
    await userEvent.hover(row);
    await waitFor(() => expect(row).toHaveAttribute('data-hovered', 'true'));
    await expect(selectedKeysOf(canvasElement)).toEqual(['t2']);
  },
};

/** The same in the list face: a hovered item, a selected one and the current one, the note in each. */
export const SlateInItemStates: Story = {
  tags: ['viewport-desktop', 'no-visual'],
  render: () => (
    <Box width="22rem">
      <Selecting initial={['t2']} columns={NOTED} currentKey="t3" />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(listItems(canvasElement).length).toBeGreaterThan(2));
    const item = itemAt(canvasElement, 0);
    await userEvent.hover(item);
    await waitFor(() => expect(item).toHaveAttribute('data-hovered', 'true'));
  },
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

/**
 * The bar's ring: two rows selected by X, then Tab from the table lands on the bar's Clear selection X first, and
 * Arrow Right moves to Categorize, which shows the ring.
 */
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
    const clear = within(canvasElement).getByRole('button', { name: 'Clear selection' });
    await waitFor(() => expect(clear).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}');
    const categorize = within(canvasElement).getByRole('button', { name: 'Categorize' });
    await waitFor(() => expect(categorize).toHaveFocus());
    await expect(categorize).toHaveAttribute('data-focus-visible');
    // The X's tip, shown while it had keyboard focus, has left with it.
    await waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull());
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
    await focusOn(before);
    await userEvent.tab();
    await waitFor(() => expect(rowAt(canvasElement, 0)).toHaveFocus());
    // Nothing selected: the next stop is after the table.
    await userEvent.tab();
    await waitFor(() => expect(after).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(rowAt(canvasElement, 0)).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}x');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t3']));
    // With the bar shown, the next stop is the bar's first control, the X, and Shift+Tab comes back to the third
    // row.
    await userEvent.tab();
    const clear = within(canvasElement).getByRole('button', { name: 'Clear selection' });
    await waitFor(() => expect(clear).toHaveFocus());
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
    // A large dialog's body is narrower than 40rem, so the table there draws its list face.
    const grid = only(dialog, '.data-table-list [role="grid"]');
    const first = itemAt(dialog, 0);
    await focusOn(first);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await expect(selectedItemsOf(dialog)).toEqual([]);
    await userEvent.keyboard('j');
    await waitFor(() => expect(itemAt(dialog, 1)).toHaveFocus());
    await userEvent.keyboard('x');
    await waitFor(() => expect(selectedItemsOf(dialog)).toEqual(['t2']));
    await userEvent.keyboard('n');
    await expect(itemAt(dialog, 1)).toHaveFocus();
    await expect(grid.contains(document.activeElement)).toBe(true);
  },
};

/**
 * The table face in an open Dialog keeps its keys too: a dialog wide enough for the table (a large dialog's body
 * is under 40rem, so the story widens its panel), Enter opens the row without selecting it, J moves, X selects,
 * and a letter typeahead would act on leaves focus where it is. Three engines.
 */
export const InDialogTable: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <style>{'.story-wide-dialog { width: min(56rem, 100%); }'}</style>
      <Dialog title="Pick transactions" isOpen size="lg" className="story-wide-dialog">
        <Selecting />
      </Dialog>
    </RouterProvider>
  ),
  play: async () => {
    navigate.mockClear();
    const dialog = await within(document.body).findByRole('dialog');
    await waitFor(() => expect(getComputedStyle(only(dialog, '.data-table-grid')).display).toBe('block'));
    const grid = only(dialog, '.data-table-grid [role="grid"]');
    const first = rowAt(dialog, 0);
    await focusOn(first);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await expect(selectedKeysOf(dialog)).toEqual([]);
    await userEvent.keyboard('j');
    await waitFor(() => expect(rowAt(dialog, 1)).toHaveFocus());
    await userEvent.keyboard('x');
    await waitFor(() => expect(selectedKeysOf(dialog)).toEqual(['t2']));
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

/** The rows did not load: the error in place of the empty body, an EmptyState with a Retry action. */
export const ErrorEmpty: Story = {
  render: () => (
    <Box>
      <Sorted
        items={[]}
        error={
          <EmptyState
            icon={<RotateCw />}
            title="The transactions did not load"
            description="Check your connection, then try again."
            action={<Button variant="secondary">Retry</Button>}
          />
        }
      />
    </Box>
  ),
};

/** The next page did not load: the rows stay, and the error is a line under them that a polite status says. */
export const ErrorWithRows: Story = {
  render: () => (
    <Box>
      <Sorted isLoading error="The next page did not load. Your connection may be down." />
    </Box>
  ),
};

/** Memo-like text that wraps: two lines, then an ellipsis, the row growing to hold them. */
const WRAPPING_COLUMNS: DataTableColumn<Transaction>[] = [
  ...columnsOf(['date', 'payee']),
  {
    id: 'memo',
    header: 'Memo',
    cell: (row) =>
      `${row.category} for the ${row.account.toLowerCase()} account, paid to ${row.payee}, reconciled with the October statement and the receipt the bank sent`,
    overflow: 'wrap',
  },
  ...columnsOf(['amount']),
];

/** A column with overflow wrap reads to two lines and clamps there; the other columns still end on one line. */
export const WrappingColumn: Story = {
  render: () => (
    <Box>
      <Sorted columns={WRAPPING_COLUMNS} items={EIGHT.slice(0, 4)} />
    </Box>
  ),
};

/** The payee over its category, and the amount over its account: a title and a slate line in each. */
const TWO_LINE_COLUMNS: DataTableColumn<Transaction>[] = columnsOf(['date', 'payee', 'account', 'amount'], {
  payee: {
    cell: (row) => (
      <>
        {row.payee}
        <span className="data-table-cell-meta">{row.category}</span>
      </>
    ),
  },
  amount: {
    cell: (row) => (
      <>
        {money(row.minor)}
        <span className="data-table-cell-meta">{row.account}</span>
      </>
    ),
  },
});

/**
 * Rows of two lines, a title over a slate line, as a list page often draws them: each 72px, its lines a quarter
 * rem apart and 13.5px off the rules, as one line is in its 48px row, and the one-line cells centered beside them.
 */
export const TwoLine: Story = {
  render: () => (
    <Box>
      <Sorted columns={TWO_LINE_COLUMNS} currentKey="t3" />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const row = rowAt(canvasElement, 0);
    const box = row.getBoundingClientRect();
    await expect(Math.abs(box.height - 72)).toBeLessThan(0.5);
    const payee = only(row, '[role="rowheader"]');
    await expect(Math.abs(parseFloat(getComputedStyle(payee).paddingTop) - 13.5)).toBeLessThan(0.1);
    const meta = only(payee, '.data-table-cell-meta');
    await expect(getComputedStyle(meta).color).toBe(tokenColor('--color-slate'));
    await expect(getComputedStyle(meta).fontWeight).toBe('450');
    await expect(getComputedStyle(meta).marginTop).toBe('4px');
    // The account, one line, centered on the row.
    const account = row.querySelectorAll('[role="gridcell"]')[1];
    if (account === undefined) throw new Error('No account cell');
    const range = document.createRange();
    range.selectNodeContents(account);
    const line = range.getBoundingClientRect();
    await expect(Math.abs((line.top + line.bottom) / 2 - (box.top + box.bottom) / 2)).toBeLessThanOrEqual(2);
  },
};

/**
 * The second line in each state a row takes: granite on a hovered row's wash and a selected row's, slate on the
 * current row, which takes no wash, and taupe on a disabled row. The a11y check measures each after the play, in
 * both themes.
 */
export const TwoLineStates: Story = {
  tags: ['viewport-desktop', 'no-visual'],
  render: () => (
    <Box>
      <Selecting initial={['t2']} columns={TWO_LINE_COLUMNS} currentKey="t3" disabledKeys={['t4']} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const metaOf = (index: number): HTMLElement => only(rowAt(canvasElement, index), '.data-table-cell-meta');
    const row = rowAt(canvasElement, 0);
    await userEvent.hover(row);
    await waitFor(() => expect(row).toHaveAttribute('data-hovered', 'true'));
    await expect(getComputedStyle(metaOf(0)).color).toBe(tokenColor('--color-granite'));
    await expect(selectedKeysOf(canvasElement)).toEqual(['t2']);
    await expect(getComputedStyle(metaOf(1)).color).toBe(tokenColor('--color-granite'));
    await expect(getComputedStyle(metaOf(2)).color).toBe(tokenColor('--color-slate'));
    await expect(getComputedStyle(metaOf(3)).color).toBe(tokenColor('--color-taupe'));
  },
};

/**
 * In a flex row beside a fixed column, as a page with a filter rail lays it out: the table takes the room left
 * and draws its table face, where a size container with no width of its own drew the list at none.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual'],
  render: () => (
    <RouterProvider navigate={noop}>
      <div style={{ display: 'flex', gap: 'var(--spacing-peer)', width: 'min(72rem, 100%)' }}>
        <div style={{ flex: 'none', inlineSize: '12rem' }}>Filters</div>
        <Sorted />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    const table = only(canvasElement, '.data-table');
    await expect(table.getBoundingClientRect().width).toBeGreaterThan(40 * 16);
    await expect(only(table, '.data-table-grid')).toBeVisible();
    await expect(getComputedStyle(only(table, '.data-table-list')).display).toBe('none');
  },
};

/** An actions column: its header draws nothing and is still named "Actions", each cell a row menu's button. */
const ACTION_COLUMNS: DataTableColumn<Transaction>[] = [
  ...COLUMNS,
  {
    id: 'actions',
    header: 'Actions',
    isHeaderHidden: true,
    // The 40px button and the cell's 16px either side.
    width: '4.5rem',
    cell: (row) => (
      <IconButton aria-label={`More for ${row.payee}`}>
        <Ellipsis />
      </IconButton>
    ),
  },
];

/**
 * Room in a cell: a row menu in a column too narrow for it is neither clipped nor followed by an ellipsis, and a
 * wrapping cell's two lines sit a part step off the row's rules, every cell of the row centered on it.
 */
export const CellRoom: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Sorted
        columns={[
          ...WRAPPING_COLUMNS,
          ...ACTION_COLUMNS.filter((column) => column.id === 'actions').map((column) => ({
            ...column,
            width: '3rem',
          })),
        ]}
        items={EIGHT.slice(0, 2)}
      />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const row = rowAt(canvasElement, 0);
    const cells = [...row.querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]')];
    const menu = cells.at(-1);
    if (menu === undefined) throw new Error('No menu cell');
    await expect(getComputedStyle(menu).overflow).toBe('visible');
    await expect(getComputedStyle(menu).textOverflow).toBe('clip');
    await expect(only(menu, 'button').getBoundingClientRect().width).toBe(40);
    // A text cell still truncates.
    await expect(getComputedStyle(cells[1] ?? menu).textOverflow).toBe('ellipsis');
    const memo = only(row, '[data-overflow="wrap"]');
    const text = only(memo, '.data-table-wrap').getBoundingClientRect();
    const box = row.getBoundingClientRect();
    await expect(text.top - box.top).toBeGreaterThanOrEqual(8);
    await expect(box.bottom - text.bottom).toBeGreaterThanOrEqual(8);
    // Every cell centered on the row: the date's line midway down it, as the button's.
    const middle = (element: Element | Range): number => {
      const { top, bottom } = element.getBoundingClientRect();
      return (top + bottom) / 2;
    };
    const date = cells[0];
    if (date === undefined) throw new Error('No date');
    const range = document.createRange();
    range.selectNodeContents(date);
    await expect(Math.abs(middle(range) - middle(row))).toBeLessThanOrEqual(2);
    await expect(Math.abs(middle(only(menu, 'button')) - middle(row))).toBeLessThanOrEqual(2);
  },
};

/** A header with nothing drawn: the actions column, its name kept for a screen reader. */
export const HeaderHidden: Story = {
  render: () => (
    <Box>
      <Sorted columns={ACTION_COLUMNS} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole('columnheader', { name: 'Actions' });
    await expect(header).toHaveAttribute('data-header-hidden');
    const label = only(header, '.data-table-column-label');
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};

/** A row that cannot be selected and still opens: disabledBehavior selection, its box disabled, its text ink. */
export const DisabledSelection: Story = {
  render: () => (
    <Box>
      <Selecting initial={['t2']} disabledKeys={['t4']} disabledBehavior="selection" />
    </Box>
  ),
};

/**
 * Rows already shown that load again: after QUIET_MS a 2px line along the header's rule pulses, and the status
 * says "Loading"; no text dims. With no rows the skeletons are the cue and the line never shows.
 */
export const Reloading: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <Sorted isLoading />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const face = only(canvasElement, '.data-table-grid');
    await expect(face).not.toHaveAttribute('data-reloading');
    await waitFor(() => expect(face).toHaveAttribute('data-reloading'), { timeout: QUIET_MS + 2000 });
    const header = within(canvasElement).getByRole('columnheader', { name: 'Payee' });
    const line = getComputedStyle(header, '::after');
    await expect(line.blockSize).toBe('2px');
    await expect(line.backgroundColor).toBe(paint('var(--color-ink)', header));
    // No row dims: its text keeps its own color, at full opacity.
    await expect(getComputedStyle(only(canvasElement, '.data-table-body')).opacity).toBe('1');
  },
};

/**
 * Rows focused by J keep clear of what covers the page (WCAG 2.4.11): under a 64px page header and the sticky
 * header row, and with a row selected, over the bulk-action bar at the viewport's bottom. From the last row the
 * bar leaves clear, J three times walks down under the bar, every focused row ending wholly above it; then, with
 * the focused row scrolled up against the header row, K three times walks back up under the header, every row
 * ending wholly below it. Three engines.
 */
export const ScrollClear: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ '--page-sticky-top': '64px', paddingBlockStart: 80 } as CSSProperties}>
      <PageHeader />
      <Box>
        <Selecting items={manyTransactions(40)} initial={['m1']} />
      </Box>
    </div>
  ),
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 0);
    const rows = bodyRows(canvasElement);
    const bar = only(canvasElement, '.data-table-bar');
    const header = within(canvasElement).getAllByRole('columnheader')[1];
    if (header === undefined) throw new Error('No header');
    const headerBottom = (): number => Math.floor(header.getBoundingClientRect().bottom);
    const barTop = (): number => Math.ceil(bar.getBoundingClientRect().top);
    // The table clears a row frames after focus moves, after React Aria's own scroll, and a page out of sight
    // gets its frames late, so the play polls for where the row ends rather than counting frames.
    const clear = async (index: number, step: string): Promise<void> => {
      const row = rowAt(canvasElement, index);
      await waitFor(
        async () => {
          await expect(row, `${step}: focus`).toHaveFocus();
          const box = row.getBoundingClientRect();
          await expect(box.top, `${step}: under the header row`).toBeGreaterThanOrEqual(headerBottom());
          await expect(box.bottom, `${step}: over the bar`).toBeLessThanOrEqual(barTop());
        },
        { timeout: 5000 },
      );
    };
    const press = async (key: 'j' | 'k', index: number): Promise<void> => {
      // A play that outlived its story, past a timeout, stops here rather than typing into the next story.
      if (!bar.isConnected) throw new Error('The story has gone');
      await userEvent.keyboard(key);
      await clear(index, `${key.toUpperCase()} to row ${String(index)}`);
    };
    // The first row the bar covers at rest, and the one above it, which nothing covers.
    const edge = rows.findIndex((row) => row.getBoundingClientRect().bottom > barTop());
    await expect(edge).toBeGreaterThan(0);
    await focusOn(rowAt(canvasElement, edge - 1));
    await clear(edge - 1, `row ${String(edge - 1)}`);
    for (let index = edge; index < edge + 3; index += 1) await press('j', index);
    // The focused row against the header row, so the rows above it sit under the header, still in the view.
    const top = rowAt(canvasElement, edge + 2).getBoundingClientRect().top;
    window.scrollBy({ top: top - headerBottom(), behavior: 'instant' });
    await expect(rowAt(canvasElement, edge + 1).getBoundingClientRect().bottom).toBeLessThanOrEqual(
      headerBottom() + 1,
    );
    for (let index = edge + 1; index > edge - 2; index -= 1) await press('k', index);
    window.scrollTo(0, 0);
  },
};

/**
 * Page Down and Page Up move by the rows that fit in the view (risk R4), not to the first and last row: from the
 * first row of thirty, Page Down lands on a row still under the page's end, and Page Up comes back to the first.
 * Focus is checked on a row before every key: a key that reaches the header's Select all box instead is not the
 * table's, and user-event would apply a text field's Page Down to that input. Three engines.
 */
export const PageKeys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  // Thirty rows: more than a page of the 900px window, and half the drawing of sixty, which a busy runner's
  // Firefox took past the time limit to lay out with both faces and the selection column.
  render: () => (
    <Box>
      <Selecting items={manyTransactions(30)} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 0);
    const rows = bodyRows(canvasElement);
    const first = rowAt(canvasElement, 0);
    /** A key, unless the story has gone: a play that outlived its time limit stops rather than type into the next. */
    const press = async (keys: string): Promise<void> => {
      if (!first.isConnected) throw new Error('The story has gone');
      await userEvent.keyboard(keys);
    };
    /** The body row that holds focus, once focus has left `from`, polled rather than read at once. */
    const focusedFrom = (from: Element): Promise<number> =>
      waitFor(() => {
        const index = rows.findIndex((row) => row === document.activeElement);
        if (index < 0 || document.activeElement === from) throw new Error('Focus has not moved to a row');
        return index;
      });
    try {
      await focusOn(first);
      // The rows that fit under the 40px header row in the window, which scrolls the page.
      const header =
        within(canvasElement).getAllByRole('columnheader')[0]?.getBoundingClientRect().height ?? 0;
      const fit = Math.floor((window.innerHeight - header) / first.getBoundingClientRect().height);
      await expect(fit).toBeLessThan(rows.length - 1);
      await press('{PageDown}');
      const reached = await focusedFrom(first);
      await expect(reached).toBe(fit);
      await expect(reached).toBeLessThan(rows.length - 1);
      await press('{PageUp}');
      await waitFor(() => expect(first).toHaveFocus());
      await press('x');
      await waitFor(() => expect(selectedKeysOf(canvasElement)).toHaveLength(1));
      await expect(first).toHaveFocus();
      // Shift extends the selection over the page it moves by, which the bar, shown now, makes a row shorter.
      await press('{Shift>}{PageDown}{/Shift}');
      const extended = await focusedFrom(first);
      await expect(extended).toBeGreaterThan(1);
      await waitFor(() => expect(selectedKeysOf(canvasElement)).toHaveLength(extended + 1));
    } finally {
      window.scrollTo(0, 0);
    }
  },
};

/** Shift with a press on a row's box selects the range from the anchor, as Shift with an arrow does. Three engines. */
export const ShiftPressRange: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box>
      <Selecting />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const box = (index: number): HTMLElement => only(rowAt(canvasElement, index), '.checkbox-box');
    await userEvent.click(box(1));
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2']));
    // One user, so the Shift it holds down is on its press.
    const user = userEvent.setup();
    await user.keyboard('{Shift>}');
    await user.click(box(4));
    await user.keyboard('{/Shift}');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2', 't3', 't4', 't5']));
    await userEvent.click(box(6));
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2', 't3', 't4', 't5', 't7']));
  },
};

// ---- The list face, under 40rem of the table's box ------------------------------------------------------------

/** Twelve rows in nine days: the payee over its category, the amount at the end, each day under its heading. */
export const Phone: Story = {
  tags: ['!viewport-desktop', 'viewport-phone', 'density'],
  render: () => (
    <Box>
      <Sorted items={TRANSACTIONS} getGroup={groupOf} currentKey="t3" />
    </Box>
  ),
};

/**
 * Two items selected in the table face before the box narrowed: out of Select mode the list draws no boxes, so
 * each selected item keeps the checked box's mark beside its wash, and the bar shows the count.
 */
export const PhoneSelected: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  render: () => (
    <Box>
      <Selecting initial={['t2', 't4']} getGroup={groupOf} />
    </Box>
  ),
};

/** Select pressed: every item's box, Select all leading the head with its dash, Done at its end, and the bar. */
export const PhoneSelecting: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  render: () => (
    <Box>
      <Selecting initial={['t2', 't4']} getGroup={groupOf} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    only(canvasElement, '.data-table-list-mode').click();
    await waitFor(() => expect(listItems(canvasElement)[0]?.querySelector('.checkbox')).not.toBeNull());
    await expect(within(canvasElement).getByRole('checkbox', { name: 'Select all' })).toBePartiallyChecked();
  },
};

/** No rows: the app's EmptyState in the list. */
export const PhoneEmpty: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  render: () => (
    <Box>
      <Sorted
        items={[]}
        getGroup={groupOf}
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

/** Loading with no rows yet: eight skeleton items, two lines and an end line each. */
export const PhoneLoading: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  render: () => (
    <Box>
      <Sorted items={[]} getGroup={groupOf} isLoading />
    </Box>
  ),
};

/** The Persian days, written by the app. */
const PERSIAN_DAYS: Record<string, string> = { '۲۲ مهر': 'سه‌شنبه ۲۲ مهر', '۲۱ مهر': 'دوشنبه ۲۱ مهر' };

/** Right to left: the days and payees at the right, the amounts at the left, the current bar at the right. */
export const PhoneRightToLeft: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  render: () => (
    <Box>
      <I18nProvider locale="fa-IR">
        <div dir="rtl" lang="fa">
          <DataTable
            aria-label="تراکنش‌ها"
            items={PERSIAN}
            columns={PERSIAN_COLUMNS}
            getKey={(row) => row.id}
            getRowHref={(row) => `/transactions/${row.id}`}
            getGroup={(row) => ({ id: row.date, label: PERSIAN_DAYS[row.date] ?? row.date })}
            currentKey="p2"
            labels={{ total: 'جمع', loading: 'در حال بارگذاری' }}
          />
        </div>
      </I18nProvider>
    </Box>
  ),
};

/** Sorted by amount, so no getGroup: one list with no headings, and the totals line under it. */
export const Ungrouped: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  render: () => {
    const rows = [...EIGHT].sort((a, b) => a.minor - b.minor);
    return (
      <Box>
        <DataTable
          aria-label="Transactions"
          items={rows}
          columns={columnsWithTotal(EIGHT).map((column) =>
            column.id === 'date' ? { ...column, listSlot: 'meta' } : column,
          )}
          getKey={keyOf}
          getRowHref={hrefOf}
          labels={{ total: 'Page total' }}
        />
      </Box>
    );
  },
};

/** Beside an open panel on a small laptop the table's box is 36rem, so it is the list there too (ruling 8). */
export const BesidePanel: Story = {
  render: () => (
    <Box>
      <div style={{ display: 'grid', gridTemplateColumns: '36rem 1fr', gap: '1.5rem' }}>
        <Sorted items={TRANSACTIONS} getGroup={groupOf} currentKey="t3" />
        <div aria-hidden="true" style={{ border: '1px dashed var(--color-frame)', borderRadius: 24 }} />
      </div>
    </Box>
  ),
};

/**
 * The list's keys, as the table's: J and J move down two items, K back up one, X selects that item out of Select
 * mode, Enter opens it through the router without selecting it, and a letter a payee starts with moves nothing.
 * Three engines, since the handler dispatches the arrows itself.
 */
export const ListKeys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <div style={{ width: NARROW }}>
        <Selecting getGroup={groupOf} />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    await focusItem(canvasElement, 0);
    await userEvent.keyboard('j');
    await waitFor(() => expect(itemAt(canvasElement, 1)).toHaveFocus());
    await userEvent.keyboard('j');
    await waitFor(() => expect(itemAt(canvasElement, 2)).toHaveFocus());
    await userEvent.keyboard('k');
    await waitFor(() => expect(itemAt(canvasElement, 1)).toHaveFocus());
    await userEvent.keyboard('x');
    await waitFor(() => expect(selectedItemsOf(canvasElement)).toEqual(['t2']));
    // Out of Select mode the selected item draws its mark, not a box.
    await expect(itemAt(canvasElement, 1).querySelector('.checkbox')).toBeNull();
    await expect(getComputedStyle(only(itemAt(canvasElement, 1), '.data-table-item-mark')).display).not.toBe(
      'none',
    );
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    await userEvent.keyboard('n');
    await expect(itemAt(canvasElement, 1)).toHaveFocus();
    await expect(selectedItemsOf(canvasElement)).toEqual(['t2']);
  },
};

/** A press on an item's amount lands on its stretched link: it opens and never selects. Three engines. */
export const ListPressOpens: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <div style={{ width: NARROW }}>
        <Selecting getGroup={groupOf} initial={['t1']} />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    const amount = only(itemAt(canvasElement, 2), '.data-table-item-end .data-table-figure');
    // The hit test finds the row's link over the amount, as in the table face, and the press is made there, at
    // the amount's own point: user-event does not hit-test, so the press goes to what the browser found.
    const hit = await pressAt(amount);
    await expect(hit.closest('.data-table-link')).toBe(only(itemAt(canvasElement, 2), '.data-table-link'));
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t3');
    await expect(selectedItemsOf(canvasElement)).toEqual(['t1']);
  },
};

/**
 * Select mode (amendment 3), by keys: Enter on Select shows every box and Select all, focus staying on the button
 * now named Done; Shift+Tab reaches Select all; Done hides the boxes, keeps the selection and keeps focus on the
 * button, named Select again. Three engines.
 */
export const SelectMode: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box width={NARROW}>
      <Selecting getGroup={groupOf} initial={['t2']} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const button = only(canvasElement, '.data-table-list-mode');
    await expect(button).toHaveAccessibleName('Select');
    await expect(listItems(canvasElement)[0]?.querySelector('.checkbox')).toBeNull();
    await focusOn(button);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(button).toHaveAccessibleName('Done'));
    await expect(button).toHaveFocus();
    await expect(canvasElement.querySelectorAll('.data-table-list .data-table-item .checkbox')).toHaveLength(
      8,
    );
    const all = within(canvasElement).getByRole('checkbox', { name: 'Select all' });
    await expect(all).toBePartiallyChecked();
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(all).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(button).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(button).toHaveAccessibleName('Select'));
    await expect(button).toHaveFocus();
    await expect(canvasElement.querySelector('.data-table-list .data-table-item .checkbox')).toBeNull();
    await expect(selectedItemsOf(canvasElement)).toEqual(['t2']);
  },
};

/** The faces switch on the table's own box: the table at 40rem, the list at 39.9rem, and back. */
export const FaceSwitch: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box width="40rem">
      <Sorted getGroup={groupOf} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const box = only(canvasElement, '.data-table').parentElement;
    if (box === null) throw new Error('No box');
    const grid = only(canvasElement, '.data-table-grid');
    const list = only(canvasElement, '.data-table-list');
    await expect(getComputedStyle(grid).display).toBe('block');
    await expect(getComputedStyle(list).display).toBe('none');
    box.style.width = '39.9rem';
    await waitFor(() => expect(getComputedStyle(list).display).toBe('block'));
    await expect(getComputedStyle(grid).display).toBe('none');
    box.style.width = '40rem';
    await waitFor(() => expect(getComputedStyle(grid).display).toBe('block'));
    await expect(getComputedStyle(list).display).toBe('none');
  },
};

/** A day's heading sticks under a 64px page header while its items scroll, and the next day's takes its place. */
export const StickyDay: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ '--page-sticky-top': '64px', paddingBlockStart: 80 } as CSSProperties}>
      <PageHeader />
      <Box width={NARROW}>
        <Sorted items={manyTransactions(40)} getGroup={groupOf} />
      </Box>
    </div>
  ),
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 0);
    const headings = [...canvasElement.querySelectorAll<HTMLElement>('.data-table-section-header')];
    const day = headings[1];
    if (day === undefined) throw new Error('No second day');
    // Scroll the second day's heading past the page header: it stops under it, at 64px.
    window.scrollBy({ top: day.getBoundingClientRect().top - 64 + 20, behavior: 'instant' });
    await waitFor(() => expect(Math.round(day.getBoundingClientRect().top)).toBe(64));
    await expect(getComputedStyle(day).position).toBe('sticky');
    window.scrollTo(0, 0);
  },
};

/** R3's sizes: both faces' server HTML for 50 and 200 rows, written in the story; recorded, with no threshold. */
function Sizes(): ReactElement {
  const sizes = [50, 200].map((count) => {
    const html = renderToString(
      <DataTable
        aria-label="Transactions"
        items={manyTransactions(count)}
        columns={COLUMNS}
        getKey={keyOf}
        getRowHref={hrefOf}
        getGroup={groupOf}
      />,
    );
    return { count, bytes: new TextEncoder().encode(html).length };
  });
  return (
    <ul>
      {sizes.map(({ count, bytes }) => (
        <li key={count} data-rows={count} data-bytes={bytes}>
          {`${String(count)} rows: ${String(bytes)} bytes`}
        </li>
      ))}
    </ul>
  );
}

export const R3Sizes: Story = {
  tags: ['no-visual'],
  render: () => <Sizes />,
  play: async ({ canvasElement }) => {
    const bytes = [...canvasElement.querySelectorAll('[data-bytes]')].map((item) =>
      Number(item.getAttribute('data-bytes')),
    );
    await expect(bytes).toHaveLength(2);
    await expect(bytes[1]).toBeGreaterThan(bytes[0] ?? 0);
  },
};

// ---- The list face's covers, keys and modes (Task 4's review round) ---------------------------------------------

/** Forty rows under a 64px page header in a list-wide box, grouped by day or not, with selection on. */
function CoveredList({ grouped }: { grouped: boolean }): ReactElement {
  return (
    <div style={{ '--page-sticky-top': '64px', paddingBlockStart: 80 } as CSSProperties}>
      <PageHeader />
      <Box width={NARROW}>
        <Selecting items={manyTransactions(40)} getGroup={grouped ? groupOf : undefined} />
      </Box>
    </div>
  );
}

/** Presses Select above the list, so the head sticks over it, and waits for the boxes. */
async function enterSelectMode(scope: HTMLElement): Promise<void> {
  only(scope, '.data-table-list-mode').click();
  await waitFor(() => expect(scope.querySelector('.data-table-list[data-selecting]')).not.toBeNull());
}

/** The bottom of what covers the top of the list where `item` is: the page header, the sticky head, its heading. */
function coverOf(scope: HTMLElement, item: HTMLElement): number {
  const head =
    scope.querySelector('.data-table-list-head[data-selecting]')?.getBoundingClientRect().bottom ?? 0;
  const heading =
    item.closest('.data-table-section')?.querySelector('.data-table-section-header')?.getBoundingClientRect()
      .bottom ?? 0;
  return Math.max(64, head, heading);
}

/**
 * K from an item onto the one above it, which sits wholly in the view but under what covers the list's top: the
 * item ends clear of it (WCAG 2.4.11), under the page header alone without groups, and under the stuck head and
 * the item's day heading with them.
 */
async function scrollClearPlay(canvasElement: HTMLElement): Promise<void> {
  window.scrollTo(0, 0);
  const index = 12;
  const above = itemAt(canvasElement, index - 1);
  const from = itemAt(canvasElement, index);
  await focusOn(from);
  // The item above at 4px from the window's top, wholly in the view and under the 64px page header.
  window.scrollBy({ top: above.getBoundingClientRect().top - 4, behavior: 'instant' });
  await waitFor(() => expect(Math.round(above.getBoundingClientRect().top)).toBe(4));
  if (!above.isConnected) throw new Error('The story has gone');
  await userEvent.keyboard('k');
  await waitFor(
    async () => {
      await expect(above).toHaveFocus();
      await expect(above.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        coverOf(canvasElement, above) - 1,
      );
    },
    { timeout: 5000 },
  );
  window.scrollTo(0, 0);
}

/** An ungrouped list under a 64px page header: K onto an item under the header scrolls it clear. Three engines. */
export const ListScrollClear: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <CoveredList grouped={false} />,
  play: async ({ canvasElement }) => {
    await scrollClearPlay(canvasElement);
  },
};

/**
 * A grouped list in Select mode: the head sticks under the page header and the day headings under the head, and
 * K onto an item under them scrolls it clear of all three. Three engines.
 */
export const ListScrollClearGrouped: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <CoveredList grouped />,
  play: async ({ canvasElement }) => {
    await enterSelectMode(canvasElement);
    await scrollClearPlay(canvasElement);
  },
};

/**
 * Page Down from the first item moves by the items that fit in the window under what covers it: the page header,
 * and in Select mode the head, and a day heading where there are groups. Page Up comes back.
 */
async function pageKeysPlay(canvasElement: HTMLElement): Promise<void> {
  window.scrollTo(0, 0);
  const first = itemAt(canvasElement, 0);
  await focusOn(first);
  const head = canvasElement.querySelector('.data-table-list-head[data-selecting]');
  const heading = canvasElement.querySelector('.data-table-section-header');
  const covered =
    64 + (head?.getBoundingClientRect().height ?? 0) + (heading?.getBoundingClientRect().height ?? 0);
  const fit = Math.floor((window.innerHeight - covered) / first.getBoundingClientRect().height);
  await userEvent.keyboard('{PageDown}');
  await waitFor(() =>
    expect(listItems(canvasElement).indexOf(document.activeElement as HTMLElement)).toBe(fit),
  );
  await userEvent.keyboard('{PageUp}');
  await waitFor(() => expect(first).toHaveFocus());
  window.scrollTo(0, 0);
}

/** Page Down in an ungrouped list under a 64px page header moves by the items under it, not one more. */
export const ListPageKeys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <CoveredList grouped={false} />,
  play: async ({ canvasElement }) => {
    await pageKeysPlay(canvasElement);
  },
};

/** Page Down in a grouped list in Select mode moves by the items under the page header, the head and a heading. */
export const ListPageKeysGrouped: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <CoveredList grouped />,
  play: async ({ canvasElement }) => {
    await enterSelectMode(canvasElement);
    await pageKeysPlay(canvasElement);
  },
};

/**
 * In Select mode the head sticks under the page header, Select all and Done in reach, and the day headings stick
 * under it rather than under the page header.
 */
export const StickySelectHead: Story = {
  tags: ['no-visual'],
  render: () => <CoveredList grouped />,
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 0);
    await enterSelectMode(canvasElement);
    const head = only(canvasElement, '.data-table-list-head');
    const day = [...canvasElement.querySelectorAll<HTMLElement>('.data-table-section-header')][1];
    if (day === undefined) throw new Error('No second day');
    window.scrollBy({ top: day.getBoundingClientRect().top - 64 + 20, behavior: 'instant' });
    await waitFor(() => expect(Math.round(head.getBoundingClientRect().top)).toBe(64));
    await expect(Math.round(day.getBoundingClientRect().top)).toBe(
      Math.round(head.getBoundingClientRect().bottom),
    );
    await expect(within(head).getByRole('button', { name: 'Done' })).toBeVisible();
    // Out of Select mode the head scrolls away with the page, and the headings stick at the page header again.
    within(head).getByRole('button', { name: 'Done' }).click();
    await waitFor(() => expect(Math.round(day.getBoundingClientRect().top)).toBe(64));
    window.scrollTo(0, 0);
  },
};

/**
 * Rows already shown that load again, as a list: after QUIET_MS one quiet line, at the foot of the first day's
 * heading only, or along the top of an ungrouped list, out of the flow, so no item moves as it comes.
 */
export const ListReloading: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box width={NARROW}>
      <div style={{ display: 'grid', gap: 32 }}>
        <div data-list="grouped">
          <Sorted getGroup={groupOf} isLoading />
        </div>
        <div data-list="ungrouped">
          <Sorted isLoading />
        </div>
      </div>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const grouped = only(canvasElement, '[data-list="grouped"]');
    const ungrouped = only(canvasElement, '[data-list="ungrouped"]');
    const top = itemAt(ungrouped, 0).getBoundingClientRect().top;
    await waitFor(() => expect(only(grouped, '.data-table-list')).toHaveAttribute('data-reloading'), {
      timeout: QUIET_MS + 2000,
    });
    const headings = [...grouped.querySelectorAll('.data-table-section-header')];
    await expect(headings.length).toBeGreaterThan(1);
    const [first, ...rest] = headings.map((heading) => getComputedStyle(heading, '::after'));
    await expect(first?.blockSize).toBe('2px');
    await expect(first?.backgroundColor).toBe(paint('var(--color-ink)', grouped));
    for (const line of rest) await expect(line.content).toBe('none');
    await waitFor(() => expect(only(ungrouped, '.data-table-list')).toHaveAttribute('data-reloading'));
    const line = getComputedStyle(only(ungrouped, '.data-table-grid-list'), '::before');
    await expect(line.blockSize).toBe('2px');
    await expect(line.marginBlockEnd).toBe('-2px');
    await expect(itemAt(ungrouped, 0).getBoundingClientRect().top).toBe(top);
  },
};

/**
 * A grid with no rows takes focus itself, React Aria's tab stop, and shows the inset ring there (WCAG 2.4.7): the
 * table's and the list's.
 */
export const EmptyFocusRing: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box>
      <div style={{ display: 'grid', gap: 32 }}>
        {['min(60rem, 100%)', NARROW].map((width) => (
          <div key={width} style={{ width }}>
            <Sorted items={[]} emptyState={<EmptyState title="No transactions" />} />
          </div>
        ))}
      </div>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const grids = [
      only(canvasElement, '.data-table-grid [role="grid"]'),
      [...canvasElement.querySelectorAll<HTMLElement>('.data-table-list [role="grid"]')][1],
    ];
    for (const grid of grids) {
      if (grid === undefined) throw new Error('No grid');
      for (let step = 0; step < 6 && document.activeElement !== grid; step += 1) await userEvent.tab();
      await expect(grid).toHaveFocus();
      const style = getComputedStyle(grid);
      await expect(style.outlineStyle).toBe('solid');
      await expect(style.outlineWidth).not.toBe('0px');
      await expect(style.outlineColor).toBe(paint('var(--focus-ring-color)', grid));
    }
  },
};

/**
 * A selection made in the table face, seen after the box really narrows: the list draws the selected item with
 * its mark and wash and the bar keeps the count; every item holds the mark's slot, so the titles stay in line.
 */
export const SelectionAcrossSwitch: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box width="60rem">
      <Selecting getGroup={groupOf} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const box = only(canvasElement, '.data-table').parentElement;
    if (box === null) throw new Error('No box');
    await userEvent.click(only(rowAt(canvasElement, 1), '.checkbox-box'));
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual(['t2']));
    box.style.width = NARROW;
    await waitFor(() =>
      expect(getComputedStyle(only(canvasElement, '.data-table-list')).display).toBe('block'),
    );
    await expect(selectedItemsOf(canvasElement)).toEqual(['t2']);
    const selected = itemAt(canvasElement, 1);
    const mark = only(selected, '.data-table-item-mark');
    await expect(getComputedStyle(mark).backgroundColor).toBe(paint('var(--color-ink)', mark));
    await expect(getComputedStyle(mark, '::after').content).not.toBe('none');
    const titleStart = (item: HTMLElement): number =>
      Math.round(only(item, '.data-table-item-title').getBoundingClientRect().left);
    await expect(titleStart(selected)).toBe(titleStart(itemAt(canvasElement, 0)));
    await expect(within(canvasElement).getByRole('toolbar', { name: 'Bulk actions' })).toHaveTextContent(
      '1 selected',
    );
  },
};

/**
 * In Select mode a press on an item, off its controls, toggles it, on its title and on its amount; Enter still
 * opens it and selects nothing. After Done a press opens again and never selects (ruling 2; open question 8).
 * Three engines.
 */
export const SelectModeTaps: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <RouterProvider navigate={navigate}>
      <div style={{ width: NARROW }}>
        <Selecting getGroup={groupOf} />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    await enterSelectMode(canvasElement);
    const item = itemAt(canvasElement, 1);
    await pressAt(only(item, '.data-table-item-title'));
    await waitFor(() => expect(selectedItemsOf(canvasElement)).toEqual(['t2']));
    await pressAt(only(item, '.data-table-item-end .data-table-figure'));
    await waitFor(() => expect(selectedItemsOf(canvasElement)).toEqual([]));
    await pressAt(only(itemAt(canvasElement, 2), '.data-table-item-meta'));
    await waitFor(() => expect(selectedItemsOf(canvasElement)).toEqual(['t3']));
    await expect(navigate).not.toHaveBeenCalled();
    // Enter on the focused item opens it, and never toggles it.
    await focusOn(itemAt(canvasElement, 2));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await expect(selectedItemsOf(canvasElement)).toEqual(['t3']);
    // Done: a press opens again, and selects nothing.
    only(canvasElement, '.data-table-list-mode').click();
    await waitFor(() => expect(canvasElement.querySelector('.data-table-list[data-selecting]')).toBeNull());
    await pressAt(only(itemAt(canvasElement, 0), '.data-table-item-title'));
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));
    await expect(navigate.mock.calls[1]?.[0]).toBe('/transactions/t1');
    await expect(selectedItemsOf(canvasElement)).toEqual(['t3']);
  },
};

/** Items with no link: in Select mode a press toggles them, and out of it a press does nothing. Three engines. */
export const SelectModeTapsNoLink: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box width={NARROW}>
      <Selecting getGroup={groupOf} getRowHref={undefined} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await pressAt(only(itemAt(canvasElement, 0), '.data-table-item-title'));
    await expect(selectedItemsOf(canvasElement)).toEqual([]);
    await enterSelectMode(canvasElement);
    await pressAt(only(itemAt(canvasElement, 0), '.data-table-item-title'));
    await waitFor(() => expect(selectedItemsOf(canvasElement)).toEqual(['t1']));
    await pressAt(only(itemAt(canvasElement, 3), '.data-table-item-end'));
    await waitFor(() => expect(selectedItemsOf(canvasElement)).toEqual(['t1', 't4']));
  },
};

// ---- listBelow, and the bar's actions as data (rulings 24 and 25) ------------------------------------------

/** A box 34rem wide, as a table beside an open 24rem panel at 1440px is: under 40rem and over 32rem. */
const BESIDE_PANEL = '34rem';

/**
 * listBelow="32rem" in a 34rem box: the table face, where the default would draw the list, with its Category
 * column (`hideBelow: 'md'`) gone, as under 48rem.
 */
export const ListBelow32: Story = {
  render: () => (
    <Box width={BESIDE_PANEL}>
      <Sorted listBelow="32rem" currentKey="t3" />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await expect(only(canvasElement, '.data-table-grid')).toBeVisible();
    await expect(getComputedStyle(only(canvasElement, '.data-table-list')).display).toBe('none');
    // The Category column has left, as under 48rem, and the others are drawn.
    await expect(isShown(only(canvasElement, 'th[data-hide-below="md"]'))).toBe(false);
    await expect(within(canvasElement).getByRole('columnheader', { name: 'Account' })).toBeVisible();
  },
};

/** The same table at 375: its box is under 32rem, so the list face is drawn, as every phone held upright does. */
export const ListBelow32Phone: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
  globals: PHONE,
  render: () => (
    <Box>
      <Sorted listBelow="32rem" getGroup={groupOf} currentKey="t3" />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(getComputedStyle(only(canvasElement, '.data-table-grid')).display).toBe('none'),
    );
    await expect(only(canvasElement, '.data-table-list')).toBeVisible();
  },
};

/** The four actions the bar's data stories draw: Categorize and Export promoted, Archive and Delete in More. */
const BULK_ACTIONS: DataTableProps<Transaction>['bulkActions'] = [
  { id: 'categorize', label: 'Categorize', icon: <Tag />, isPromoted: true, onAction: noop },
  { id: 'export', label: 'Export', icon: <Download />, isPromoted: true, onAction: noop },
  { id: 'archive', label: 'Archive', icon: <Archive />, onAction: noop },
  { id: 'delete', label: 'Delete', icon: <Trash2 />, onAction: noop },
];

/** The app's "Select all 1,240 matching", a tertiary button after the count. */
const SELECT_ALL_MATCHING = <Button variant="tertiary">Select all 1,240 matching</Button>;

/** The names of the open More menu's items. */
const moreItemsOf = (): string[] =>
  [...document.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]')].map(
    (item) => item.textContent,
  );

/** Whether the open menu holds focus. */
const menuHasFocus = (): boolean =>
  document.querySelector('[role="menu"]')?.contains(document.activeElement) === true;

/**
 * Three selected with the actions as data: the X at the bar's start, the count, "Select all 1,240 matching",
 * Categorize and Export as buttons and More at the end, on one line, the X and More the corner inset in.
 */
export const BulkActionsData: Story = {
  render: () => (
    <Box>
      <Selecting
        initial={['t2', 't4', 't5']}
        bulkActions={BULK_ACTIONS}
        selectAllMatching={SELECT_ALL_MATCHING}
      />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const bar = only(canvasElement, '.data-table-bar');
    const controls = within(bar).getAllByRole('button');
    await expect(
      controls.map((control) => control.getAttribute('aria-label') ?? control.textContent),
    ).toEqual(['Clear selection', 'Select all 1,240 matching', 'Categorize', 'Export', 'More actions']);
    // One line: every control's middle within a pixel of the X's.
    const middle = (element: Element): number => {
      const box = element.getBoundingClientRect();
      return box.top + box.height / 2;
    };
    const first = controls[0];
    const more = controls.at(-1);
    if (first === undefined || more === undefined) throw new Error('No X or More');
    for (const control of controls) {
      await expect(Math.abs(middle(control) - middle(first))).toBeLessThan(1);
    }
    // The X and More are controls in a single-row holder: each stands the corner inset in from its end.
    const inset = parseFloat(getComputedStyle(bar).borderBottomLeftRadius) - 1;
    await expect(
      first.getBoundingClientRect().left - bar.getBoundingClientRect().left,
    ).toBeGreaterThanOrEqual(inset - 0.5);
    await expect(
      bar.getBoundingClientRect().right - more.getBoundingClientRect().right,
    ).toBeGreaterThanOrEqual(inset - 0.5);
  },
};

/** More opened with Enter: Archive and Delete, the actions not drawn as buttons, above the bar. */
export const BulkMoreOpen: Story = {
  render: () => (
    <Box>
      <Selecting
        initial={['t2', 't4', 't5']}
        bulkActions={BULK_ACTIONS}
        selectAllMatching={SELECT_ALL_MATCHING}
      />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const more = within(canvasElement).getByRole('button', { name: 'More actions' });
    await focusOn(more);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(moreItemsOf()).toEqual(['Archive', 'Delete']));
    await waitFor(() => expect(menuHasFocus()).toBe(true));
  },
};

/** On a phone, in Select mode with two selected: the bar draws no promoted button, and More holds every action. */
export const BulkNarrowBar: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
  globals: PHONE,
  render: () => (
    <Box>
      <Selecting initial={['t2', 't4']} getGroup={groupOf} bulkActions={BULK_ACTIONS} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await enterSelectMode(canvasElement);
    const bar = only(canvasElement, '.data-table-bar');
    for (const button of bar.querySelectorAll('[data-action-id]')) {
      await expect(getComputedStyle(button).display).toBe('none');
    }
    const more = within(bar).getByRole('button', { name: 'More actions' });
    await focusOn(more);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(moreItemsOf()).toEqual(['Categorize', 'Export', 'Archive', 'Delete']));
  },
};

/** The bar's data actions and select-all place, in a box whose width a play sets. */
function ResizableBulk(): ReactElement {
  return (
    <Box width="60rem">
      <Selecting initial={['t1', 't2']} bulkActions={BULK_ACTIONS} selectAllMatching={SELECT_ALL_MATCHING} />
    </Box>
  );
}

/**
 * More reads the bar at the press (spec correction 14): the box narrowed under 40rem, More holds every action;
 * widened, it holds the unpromoted ones. Three engines, since it reads `getClientRects()` at the press.
 */
export const MoreReadsDrawnButtons: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ResizableBulk />,
  play: async ({ canvasElement }) => {
    const box = only(canvasElement, '.data-table').parentElement;
    if (box === null) throw new Error('No box');
    const more = within(canvasElement).getByRole('button', { name: 'More actions' });
    const categorize = within(canvasElement).getByRole('button', { name: 'Categorize' });
    /** A key, unless the story has gone: a play that outlived its time limit stops rather than type into the next. */
    const press = async (keys: string): Promise<void> => {
      if (!more.isConnected) throw new Error('The story has gone');
      await userEvent.keyboard(keys);
    };
    /** Opens More by Enter, reads its items, and closes it with Escape, focus back on More. */
    const open = async (): Promise<string[]> => {
      await focusOn(more);
      await press('{Enter}');
      await waitFor(() => expect(moreItemsOf().length).toBeGreaterThan(0));
      const items = moreItemsOf();
      await press('{Escape}');
      await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
      return items;
    };
    try {
      box.style.width = '30rem';
      await waitFor(() => expect(getComputedStyle(categorize).display).toBe('none'));
      await expect(await open()).toEqual(['Categorize', 'Export', 'Archive', 'Delete']);
      box.style.width = '60rem';
      await waitFor(() => expect(getComputedStyle(categorize).display).not.toBe('none'));
      await expect(await open()).toEqual(['Archive', 'Delete']);
    } finally {
      window.scrollTo(0, 0);
    }
  },
};

/**
 * A promoted button that the bar's narrowing hides while it has focus hands focus to More, which now holds its
 * action, never to the page.
 */
export const BarNarrowsUnderFocus: Story = {
  tags: ['no-visual'],
  render: () => <ResizableBulk />,
  play: async ({ canvasElement }) => {
    const box = only(canvasElement, '.data-table').parentElement;
    if (box === null) throw new Error('No box');
    const export_ = within(canvasElement).getByRole('button', { name: 'Export' });
    await focusOn(export_);
    box.style.width = '30rem';
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName('More actions'));
  },
};

/** The bar's actions with a Delete in More that empties the selection, as an app's does once it has deleted. */
function EmptyingBulk(): ReactElement {
  const [keys, setKeys] = useState<Key[]>(['t1', 't2']);
  return (
    <Box>
      <Sorted
        selectedKeys={keys}
        onSelectionChange={setKeys}
        bulkActions={[
          ...(BULK_ACTIONS as DataTableBulkAction[]).slice(0, 3),
          {
            id: 'delete',
            label: 'Delete',
            onAction: () => {
              setKeys([]);
            },
          },
        ]}
      />
    </Box>
  );
}

/**
 * Delete in More, pressed with the pointer, empties the selection: the bar and its menu leave together, and focus
 * goes to the table, never to the page. Three engines.
 */
export const MoreActionClears: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <EmptyingBulk />,
  play: async ({ canvasElement }) => {
    const more = within(canvasElement).getByRole('button', { name: 'More actions' });
    await userEvent.click(more);
    const remove = await waitFor(() => {
      const item = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
        (each) => each.textContent === 'Delete',
      );
      if (item === undefined) throw new Error('No Delete');
      return item;
    });
    await userEvent.click(remove);
    await waitFor(() => expect(canvasElement.querySelector('.data-table-bar')).toBeNull());
    await waitFor(() =>
      expect(only(canvasElement, '[role="grid"]').contains(document.activeElement)).toBe(true),
    );
  },
};

/** The arrows move through the bar's controls, and Escape clears with focus on the table. Three engines. */
export const BarArrows: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ResizableBulk />,
  play: async ({ canvasElement }) => {
    const bar = only(canvasElement, '.data-table-bar');
    const clear = within(bar).getByRole('button', { name: 'Clear selection' });
    const press = async (keys: string): Promise<void> => {
      if (!clear.isConnected) throw new Error('The story has gone');
      await userEvent.keyboard(keys);
    };
    await focusOn(clear);
    for (const name of ['Select all 1,240 matching', 'Categorize', 'Export', 'More actions']) {
      await press('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toHaveAccessibleName(name));
    }
    await press('{ArrowLeft}');
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName('Export'));
    await press('{Escape}');
    await waitFor(() => expect(selectedKeysOf(canvasElement)).toEqual([]));
    await waitFor(() =>
      expect(only(canvasElement, '[role="grid"]').contains(document.activeElement)).toBe(true),
    );
  },
};

/** listBelow="32rem" across its switch: the table at 34rem, the list at 30rem, the table again at 34rem. */
export const ListBelowSwitch: Story = {
  tags: ['no-visual'],
  render: () => (
    <Box width={BESIDE_PANEL}>
      <Sorted listBelow="32rem" />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const root = only(canvasElement, '.data-table');
    const box = root.parentElement;
    if (box === null) throw new Error('No box');
    const grid = only(canvasElement, '.data-table-grid');
    const list = only(canvasElement, '.data-table-list');
    await expect(getComputedStyle(grid).display).not.toBe('none');
    box.style.width = '30rem';
    await waitFor(() => expect(getComputedStyle(grid).display).toBe('none'));
    await expect(getComputedStyle(list).display).toBe('block');
    box.style.width = BESIDE_PANEL;
    await waitFor(() => expect(getComputedStyle(grid).display).not.toBe('none'));
    await expect(getComputedStyle(list).display).toBe('none');
    // Without the attribute the default switch, 40rem, draws the list in the same box.
    root.removeAttribute('data-list-below');
    await waitFor(() => expect(getComputedStyle(grid).display).toBe('none'));
  },
};
