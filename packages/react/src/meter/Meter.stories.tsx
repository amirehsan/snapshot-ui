import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import type { Key } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Card, CardBody } from '../card';
import { DataTable, type DataTableColumn } from '../data-table';
import { tokenColor } from '../stories/paint';
import { Meter, type MeterSegment } from './Meter';

const SPENT: MeterSegment = { value: 820, look: 'fill', label: 'Spent', valueLabel: '$820.00' };
const HELD: MeterSegment = { value: 200, look: 'hatched', label: 'Held', valueLabel: '$200.00' };
const PACE = { value: 900, label: "Where you'd be today: $900" };

const meta = {
  title: 'Components/Meter',
  component: Meter,
  // Padded, so the card takes its 24rem and the meter the card's width.
  parameters: { layout: 'padded' },
  args: {
    label: 'Groceries',
    max: 1200,
    segments: [SPENT, HELD],
    valueLabel: '$1,020 of $1,200',
  },
  // Each meter in a card 24rem wide, the surface it sits on most.
  render: (args) => (
    <Card style={{ width: '100%', maxWidth: '24rem' }}>
      <CardBody>
        <Meter {...args} />
      </CardBody>
    </Card>
  ),
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The element with this class inside the canvas, or every one of them. */
const part = (canvasElement: HTMLElement, name: string): HTMLElement => {
  const element = canvasElement.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};
const parts = (canvasElement: HTMLElement, name: string): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>(`.${name}`),
];

/** The x of the middle of an element's box. */
const centreOf = (element: Element): number => {
  const { left, width } = element.getBoundingClientRect();
  return left + width / 2;
};

/** An ink fill for spent, ink stripes for held, a 2px cut between them and the frame remainder. */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const track = part(canvasElement, 'meter-track').getBoundingClientRect();
    const [spent, held] = parts(canvasElement, 'meter-segment').map((segment) =>
      segment.getBoundingClientRect(),
    );
    await expect(Math.abs((spent?.width ?? 0) - track.width * 0.68333)).toBeLessThanOrEqual(1);
    await expect(Math.abs((held?.width ?? 0) - track.width * 0.16667)).toBeLessThanOrEqual(1);
  },
};

/** The marker for today's pace stands over the track at three quarters, and the legend names each mark. */
export const WithPace: Story = {
  args: { pace: PACE, hasLegend: true },
  play: async ({ canvasElement }) => {
    const track = part(canvasElement, 'meter-track').getBoundingClientRect();
    const marker = part(canvasElement, 'meter-pace');
    await expect(Math.abs(centreOf(marker) - (track.left + track.width * 0.75))).toBeLessThanOrEqual(1);
  },
};

/** Over the limit both looks turn warning, the bar fills to its end, and the words say "over". */
export const OverLimit: Story = {
  tags: ['density'],
  args: {
    segments: [{ ...SPENT, value: 1140 }, HELD],
    valueLabel: '$1,340 of $1,200, $140 over',
    hasLegend: true,
  },
  play: async ({ canvasElement }) => {
    const root = part(canvasElement, 'meter');
    await expect(root).toHaveAttribute('data-over');
    const [fill, held] = parts(canvasElement, 'meter-segment');
    if (!fill || !held) throw new Error('Two segments');
    await expect(getComputedStyle(fill).backgroundColor).toBe(tokenColor('--color-warning', root));
    const track = part(canvasElement, 'meter-track').getBoundingClientRect();
    await expect(Math.abs(held.getBoundingClientRect().right - track.right)).toBeLessThanOrEqual(1);
  },
};

/** Named by aria-label: only the value text shows above the bar. */
export const NoLabel: Story = {
  args: {
    label: undefined,
    'aria-label': 'Dining out',
    max: 300,
    segments: [{ ...SPENT, value: 80, valueLabel: '$80.00' }],
    valueLabel: '$80 of $300',
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('meter', { name: 'Dining out' })).toBeInTheDocument();
    await expect(canvasElement.querySelector('.meter-label')).toBeNull();
  },
};

/** Right to left the bar fills from the right, and the marker stands a quarter of the way from the left. */
export const RightToLeft: Story = {
  args: { pace: PACE, hasLegend: true },
  render: (args) => (
    <div dir="rtl" style={{ width: '100%' }}>
      <Card style={{ width: '100%', maxWidth: '24rem' }}>
        <CardBody>
          <Meter {...args} />
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const track = part(canvasElement, 'meter-track').getBoundingClientRect();
    const [first] = parts(canvasElement, 'meter-segment');
    if (!first) throw new Error('No segment');
    await expect(Math.abs(first.getBoundingClientRect().right - track.right)).toBeLessThanOrEqual(1);
    const marker = part(canvasElement, 'meter-pace');
    await expect(Math.abs(centreOf(marker) - (track.right - track.width * 0.75))).toBeLessThanOrEqual(1);
  },
};

/** A budget per row, with what is spent and what is held, as a budgets table holds them. */
interface Budget {
  id: string;
  name: string;
  spent: number;
  held: number;
}

const BUDGETS: Budget[] = [
  { id: 'groceries', name: 'Groceries', spent: 820, held: 200 },
  { id: 'dining', name: 'Dining out', spent: 140, held: 60 },
  { id: 'transport', name: 'Transport', spent: 300, held: 90 },
];

const BUDGET_COLUMNS: readonly DataTableColumn<Budget>[] = [
  { id: 'name', header: 'Budget', cell: (budget) => budget.name, isRowHeader: true },
  {
    id: 'spent',
    header: 'Spent',
    // Named with its row, since the column header names the cell.
    cell: (budget) => (
      <Meter
        aria-label={`Spent, ${budget.name}`}
        max={1200}
        segments={[
          { ...SPENT, value: budget.spent },
          { ...HELD, value: budget.held },
        ]}
        valueLabel={`$${String(budget.spent + budget.held)} of $1,200`}
        pace={PACE}
      />
    ),
    textValue: (budget) => `$${String(budget.spent + budget.held)}`,
  },
];

/** The budgets with selection on and one row selected, so rows show the hover and selected fills. */
function SelectableBudgets(): ReactElement {
  const [selected, setSelected] = useState<Key[]>(['dining']);
  return (
    <div style={{ width: '100%' }}>
      <DataTable
        aria-label="Budgets"
        items={BUDGETS}
        columns={BUDGET_COLUMNS}
        getKey={(budget) => budget.id}
        selectedKeys={selected}
        onSelectionChange={setSelected}
      />
    </div>
  );
}

/** A color as the pixel it paints, so two ways of writing one color compare equal. */
const pixelOf = (color: string): number[] => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas');
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return [...context.getImageData(0, 0, 1, 1).data];
};

/** The first color painted behind an element, going up the tree: what a cut in it should show. */
const fillBehind = (element: Element): string => {
  for (let at: Element | null = element.parentElement; at; at = at.parentElement) {
    const color = getComputedStyle(at).backgroundColor;
    if (!/^(?:transparent|rgba\(0, 0, 0, 0\))$/.test(color)) return color;
  }
  return getComputedStyle(document.body).backgroundColor;
};

/**
 * The cut between two segments and the ring round the pace marker are drawn in `--meter-surface`, and a DataTable
 * sets it to each row's own fill, so a meter on a plain row, a hovered row and a selected one draws its cuts in
 * that row's color, where a fixed Lifted drew a pale block (spec correction 64). In three engines.
 */
export const OnTableRows: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <SelectableBudgets />,
  play: async ({ canvas }) => {
    const rowOf = (name: string): HTMLElement => {
      const row = canvas.getByRole('rowheader', { name }).closest<HTMLElement>('[role="row"]');
      if (!row) throw new Error(`No row for ${name}`);
      return row;
    };
    const hovered = rowOf('Transport');
    await userEvent.hover(hovered);
    await waitFor(() => expect(hovered).toHaveAttribute('data-hovered', 'true'));
    await expect(rowOf('Dining out')).toHaveAttribute('aria-selected', 'true');
    // A hovered row takes its wash only where the page reports a hover, `@media (hover: hover)`, which a
    // headless engine may not: there the hovered row is a plain one, and the checks read two fills.
    const hasHover = matchMedia('(hover: hover)').matches;
    // Read again until the hovered row has drawn its wash, which an engine may paint a frame after its state.
    await waitFor(async () => {
      const fills = new Set<string>();
      for (const [state, row] of [
        ['plain', rowOf('Groceries')],
        ['hovered', hovered],
        ['selected', rowOf('Dining out')],
      ] as const) {
        const meter = row.querySelector<HTMLElement>('.meter');
        const cut = row.querySelector<HTMLElement>('.meter-segment + .meter-segment');
        const pace = row.querySelector<HTMLElement>('.meter-pace');
        if (!meter || !cut || !pace) throw new Error(`No meter in the ${state} row`);
        const fill = pixelOf(fillBehind(meter));
        fills.add(fill.join());
        await expect(pixelOf(getComputedStyle(cut).borderInlineStartColor), `${state}: the cut`).toEqual(
          fill,
        );
        await expect(pixelOf(getComputedStyle(pace).borderTopColor), `${state}: the pace ring`).toEqual(fill);
      }
      // Three fills where the page hovers, so the checks above read three rows that differ.
      await expect(fills.size).toBe(hasHover ? 3 : 2);
    });
  },
};
