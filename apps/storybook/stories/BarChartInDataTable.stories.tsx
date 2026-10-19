import { BarChart, type BarValue } from '@snapshot-ui/charts';
import { DataTable, RouterProvider, type DataTableColumn } from '@snapshot-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

/**
 * The two packages together, which neither package's own stories may do. A BarChart in a DataTable cell: the
 * table raises what takes focus in a cell above the row's link with a relative position, and a bar is a tab stop
 * placed absolutely in its track, so the table leaves bars out of that rule and a focused bar keeps its box
 * (insights spec correction 90).
 */

const meta = {
  title: 'Compositions/BarChart in a DataTable',
  tags: ['no-visual', 'webkit', 'firefox'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const money = (value: number): BarValue => ({ value, valueLabel: `$${value.toFixed(2)}` });

interface Row {
  id: string;
  category: string;
  october: number;
  september: number;
}

const ROWS: Row[] = [
  { id: 'groceries', category: 'Groceries', october: 742.6, september: 698.15 },
  { id: 'dining', category: 'Dining', october: 412.45, september: 455 },
  { id: 'transport', category: 'Transport', october: 288.1, september: 301.75 },
];

const COLUMNS: readonly DataTableColumn<Row>[] = [
  { id: 'category', header: 'Category', cell: (row) => row.category, isRowHeader: true },
  {
    id: 'trend',
    header: 'October against September',
    width: '20rem',
    cell: (row) => (
      // The opt-in class raises the whole chart above the row's link, so a pointer reaches its bars too.
      <div className="data-table-control">
        <BarChart
          aria-label={`${row.category}, October against September`}
          orientation="horizontal"
          categories={['October', 'September']}
          series={[{ label: row.category, values: [money(row.october), money(row.september)] }]}
          valueLabels="none"
        />
      </div>
    ),
  },
];

/** The box of a bar, rounded to whole pixels for the comparison. */
const boxOf = (element: Element): { width: number; height: number; left: number; top: number } => {
  const { width, height, left, top } = element.getBoundingClientRect();
  return {
    width: Math.round(width),
    height: Math.round(height),
    left: Math.round(left),
    top: Math.round(top),
  };
};

/** A focused bar in a cell keeps its place and its size, and stays placed absolutely in its track. */
export const FocusedBarKeepsItsBox: Story = {
  render: () => (
    <RouterProvider navigate={() => undefined}>
      <div style={{ maxWidth: '40rem' }}>
        <DataTable
          aria-label="Spending by category"
          items={ROWS}
          columns={COLUMNS}
          getKey={(row) => row.id}
          getRowHref={(row) => `#${row.id}`}
        />
      </div>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    const bar = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>('.data-table-cell .bar-chart-bar[tabindex="0"]');
      if (!found) throw new Error('No tab stop yet');
      return found;
    });
    const before = boxOf(bar);
    await expect(before.width).toBeGreaterThan(0);
    await expect(before.height).toBeGreaterThan(0);
    await waitFor(() => {
      if (bar.ownerDocument.activeElement !== bar) bar.focus();
      return expect(bar).toHaveFocus();
    });
    await expect(getComputedStyle(bar).position).toBe('absolute');
    const after = boxOf(bar);
    for (const side of ['width', 'height', 'left', 'top'] as const) {
      await expect(Math.abs(after[side] - before[side]), side).toBeLessThanOrEqual(1);
    }
  },
};
