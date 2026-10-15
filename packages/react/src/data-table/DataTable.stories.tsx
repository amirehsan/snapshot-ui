import type { Meta, StoryObj } from '@storybook/react-vite';
import { Receipt } from 'lucide-react';
import { useState, type ComponentType, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
    const shown = headers.filter((cell) => getComputedStyle(cell).display !== 'none');
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
      if (getComputedStyle(header).display === 'none') continue;
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
 * The arrows step over a column that has left: in a 44rem box Category is hidden, and Arrow Right from the
 * payee lands on Account, Arrow Left back on the payee (spec correction 8). Run in all three engines.
 */
export const ArrowsSkipHidden: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Box width="min(44rem, 100%)">
      <Sorted />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const row = await focusRow(canvasElement, 0);
    const cells = [...row.querySelectorAll<HTMLElement>('[role="gridcell"], [role="rowheader"]')];
    await expect(getComputedStyle(cells[2] ?? row).display).toBe('none');
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[0]?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[1]?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[3]?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(cells[1]?.contains(document.activeElement)).toBe(true));
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
