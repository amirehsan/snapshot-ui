import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement, type ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { focusOn } from '../stories/focus';
import { BarChart, type BarChartProps, type BarSeries, type BarValue } from './BarChart';

/** An amount as the app formats it: the number to draw and the string to say it. */
const money = (value: number): BarValue => ({
  value,
  valueLabel: `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`,
});

/** A month's spending at its top ten merchants, sorted by the app, and the rest summed as "Other", last. */
const MERCHANTS = [
  'Whole Foods Market',
  'Shell',
  'Amazon',
  "Trader Joe's",
  'Comcast',
  'Blue Bottle Coffee',
  'Uber',
  'Walgreens',
  'Netflix',
  'Spotify',
  'Other',
];

const BY_MERCHANT: BarSeries = {
  label: 'October',
  values: [612.4, 284.15, 241.87, 198.2, 129.99, 86.5, 74.3, 52.18, 22.99, 11.99, 143.6].map(money),
};

const MERCHANT_TICKS = [
  { value: 0, label: '$0' },
  { value: 200, label: '$200' },
  { value: 400, label: '$400' },
  { value: 600, label: '$600' },
];

/** Spending by category, with two refunds that net their categories below zero, sorted to the bottom. */
const CATEGORIES = ['Groceries', 'Dining', 'Transport', 'Bills', 'Shopping', 'Travel'];

const BY_CATEGORY: BarSeries = {
  label: 'October',
  values: [640, 312.45, 188.1, 150, -45.2, -310].map(money),
};

const CATEGORY_TICKS = [
  { value: -250, label: '-$250' },
  { value: 0, label: '$0' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
];

/** Names as long as a statement writes them. */
const LONG = [
  'Whole Foods Market, Mission Street',
  'Pacific Gas and Electric Company, residential service',
  'Bay Area Rapid Transit, Clipper card reload',
  'Other',
];

const BY_LONG: BarSeries = { label: 'October', values: [412.3, 186.75, 60, 98.4].map(money) };

/** A Lifted panel up to 40rem wide, the card a chart sits in most. */
const Panel = ({ children, width = '40rem' }: { children: ReactNode; width?: string }): ReactElement => (
  <div
    style={{
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: width,
      padding: 24,
      borderRadius: 'var(--radius-surface)',
      backgroundColor: 'var(--color-lifted)',
    }}
  >
    {children}
  </div>
);

/** BarChart as a story may draw it: with a band held as a pointer would hold it, by props and not by a pointer. */
const HeldBarChart = BarChart as (props: BarChartProps & { defaultActive?: number }) => ReactElement;

const meta = {
  title: 'Components/BarChart',
  component: BarChart,
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Spending by merchant, October',
    orientation: 'horizontal',
    categories: MERCHANTS,
    series: [BY_MERCHANT],
    valueTicks: MERCHANT_TICKS,
  },
  render: (args) => (
    <Panel>
      <BarChart {...args} />
    </Panel>
  ),
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The element matching `selector` inside the canvas. */
const part = (canvasElement: HTMLElement, selector: string): HTMLElement => {
  const element = canvasElement.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
};

const barsOf = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('.bar-chart-bar'),
];

/** The bar at `index`, in drawn order. */
const barAt = (canvasElement: HTMLElement, index: number): HTMLElement => {
  const bar = barsOf(canvasElement)[index];
  if (!bar) throw new Error(`No bar ${String(index)}`);
  return bar;
};

/** The category the readout shows, or null when there is none. */
const readoutX = (canvasElement: HTMLElement): string | null =>
  canvasElement.querySelector('.bar-chart-readout .bar-chart-readout-x')?.textContent ?? null;

/** The category of the row the focused bar is in. */
const focusedCategory = (canvasElement: HTMLElement): string | null =>
  canvasElement.ownerDocument.activeElement?.closest('.bar-chart-row')?.querySelector('.bar-chart-category')
    ?.textContent ?? null;

/** Waits until the bars have taken their roving tab stop, which they do once scripts run. */
const interactive = async (canvasElement: HTMLElement): Promise<void> => {
  await waitFor(() => expect(barsOf(canvasElement)[0]).toHaveAttribute('tabindex'));
};

/** Ten merchants and "Other", sorted by the app: names at the start, bars from zero, amounts aligned at the end. */
export const Horizontal: Story = {};

/** Two refunds net Shopping and Travel below zero: their bars run toward the start from the boundary-colored zero line, their amounts still in the column. */
export const HorizontalNegatives: Story = {
  args: {
    'aria-label': 'Spending by category, October',
    categories: CATEGORIES,
    series: [BY_CATEGORY],
    valueTicks: CATEGORY_TICKS,
  },
};

/** Long names wrap in the label column, which takes 40% of the chart at most; nothing is cut short or rotated. */
export const LongLabelsHorizontal: Story = {
  args: { categories: LONG, series: [BY_LONG], valueTicks: undefined },
};

/** In a 20rem panel the chart is under 24rem, so each name takes a line of its own above its bar. */
export const Narrow: Story = {
  render: (args) => (
    <Panel width="20rem">
      <BarChart {...args} />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const label = part(canvasElement, '.bar-chart-category').getBoundingClientRect();
    const track = part(canvasElement, '.bar-chart-track').getBoundingClientRect();
    await expect(label.bottom).toBeLessThanOrEqual(track.top + 1);
  },
};

/** The third bar focused: the ring round its corners, and the readout over its row. */
export const ActiveBar: Story = {
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    const third = barAt(canvasElement, 2);
    await focusOn(third);
    await waitFor(() => expect(readoutX(canvasElement)).toBe('Amazon'));
    // The readout covers no part of the bar it describes.
    const panel = part(canvasElement, '.bar-chart-readout').getBoundingClientRect();
    const bar = third.getBoundingClientRect();
    await expect(panel.bottom <= bar.top || panel.top >= bar.bottom).toBe(true);
  },
};

/** A pointer holding the fourth row, set by props: the other rows step back to 40%. */
export const PointerBand: Story = {
  render: (args) => (
    <Panel>
      <HeldBarChart {...args} defaultActive={3} />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    await expect(part(canvasElement, '.bar-chart-rows')).toHaveAttribute('data-pointer', '');
    await expect(getComputedStyle(barAt(canvasElement, 0)).opacity).toBe('0.4');
    await expect(getComputedStyle(barAt(canvasElement, 3)).opacity).toBe('1');
  },
};

/** The toggle pressed: the table of the same strings in the chart's place. */
export const TableView: Story = {
  play: async ({ canvasElement }) => {
    const toggle = part(canvasElement, '.bar-chart-toggle');
    toggle.click();
    await waitFor(() => expect(part(canvasElement, '.bar-chart-table')).toBeVisible());
    await expect(part(canvasElement, '.bar-chart-chart')).not.toBeVisible();
    await expect(toggle).toHaveTextContent('Show as chart');
  },
};

/** Loading: still bars where the rows will be, as many as the categories it expects, and "Loading" said once. */
export const Loading: Story = {
  args: { status: 'loading' },
};

/** Nothing to show: the sentence in the rows' place, over the zero line, at the same height. */
export const Empty: Story = {
  args: { status: 'empty' },
};

/** A load that failed: the app's own content in the rows' place, here an EmptyState's markup with a retry. */
const ErrorStory: Story = {
  args: {
    status: 'error',
    statusContent: (
      <div className="empty-state">
        <p className="empty-state-title">The chart could not be loaded</p>
        <p className="empty-state-description">Check your connection, then try again.</p>
        <div className="empty-state-action">
          <button type="button" className="button button-secondary">
            Try again
          </button>
        </div>
      </div>
    ),
  },
};

// Exported by name, so the module's own `Error` stays the global one.
export { ErrorStory as Error };

/** In a card, as the consumer's Insights page draws it: the table toggle at the card's foot, clear of its curve. */
export const InCard: Story = {
  tags: ['density'],
  render: (args) => (
    <section className="card" aria-labelledby="bar-chart-card-title" style={{ maxWidth: '40rem' }}>
      <div className="card-header">
        <h2 className="card-title" id="bar-chart-card-title">
          Spending by merchant
        </h2>
      </div>
      <BarChart {...args} aria-label={undefined} aria-labelledby="bar-chart-card-title" />
    </section>
  ),
};

/** Right to left, on a Persian page: names at the right, bars toward the left, a refund toward the right, figures left to right. */
export const RightToLeftHorizontal: Story = {
  args: {
    'aria-label': 'هزینه بر اساس فروشگاه، مهر',
    categories: ['هایپراستار', 'اسنپ', 'دیجی‌کالا', 'فیلیمو', 'سایر', 'بازپرداخت سفر'],
    series: [{ label: 'مهر', values: [412.3, 186.75, 98.4, 12, 64.1, -42].map(money) }],
    valueTicks: [
      { value: 0, label: '$0' },
      { value: 200, label: '$200' },
      { value: 400, label: '$400' },
    ],
    labels: {
      showTable: 'نمایش جدول',
      showChart: 'نمایش نمودار',
      noScript: 'اسکریپت‌ها خاموش‌اند، پس داده‌های نمودار در جدول زیر است.',
      roleDescription: 'نمودار',
      bar: 'میله',
      total: 'جمع',
    },
  },
  render: (args) => (
    <div dir="rtl" lang="fa">
      <Panel>
        <BarChart {...args} />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rows = part(canvasElement, '.bar-chart-rows').getBoundingClientRect();
    const label = part(canvasElement, '.bar-chart-category').getBoundingClientRect();
    // The names stand at the right, and a positive bar grows from the zero line toward the left.
    await expect(Math.abs(label.right - rows.right)).toBeLessThanOrEqual(1);
    const [first] = barsOf(canvasElement);
    const track = part(canvasElement, '.bar-chart-track').getBoundingClientRect();
    await expect(first?.getBoundingClientRect().right).toBeLessThanOrEqual(track.right + 1);
    await expect(getComputedStyle(part(canvasElement, '.bar-chart-amount')).direction).toBe('ltr');
  },
};

/**
 * The keys, one by one: Tab lands on the first bar, Down, End, Home and Page Down move the stop, Left and Right
 * are left to the page, and Escape hides the readout once and then goes on.
 */
export const KeysHorizontal: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvasElement, userEvent }) => {
    await interactive(canvasElement);
    // Each key's last event, caught on its way down, so it is read once the chart has handled it, Escape's too,
    // which the chart stops from going further.
    const seen = new Map<string, KeyboardEvent>();
    const prevented = (key: string): boolean | undefined => seen.get(key)?.defaultPrevented;
    const record = (event: KeyboardEvent): void => {
      seen.set(event.key, event);
    };
    const view = canvasElement.ownerDocument.defaultView ?? window;
    view.addEventListener('keydown', record, true);
    try {
      await userEvent.tab();
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Whole Foods Market'));
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Shell'));
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Other'));
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Whole Foods Market'));
      await userEvent.keyboard('{PageDown}');
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Walgreens'));
      await expect(prevented('PageDown')).toBe(true);
      await userEvent.keyboard('{ArrowLeft}');
      await userEvent.keyboard('{ArrowRight}');
      await expect(prevented('ArrowLeft')).toBe(false);
      await expect(prevented('ArrowRight')).toBe(false);
      await expect(focusedCategory(canvasElement)).toBe('Walgreens');
      await expect(readoutX(canvasElement)).toBe('Walgreens');
      await userEvent.keyboard('{Escape}');
      await expect(prevented('Escape')).toBe(true);
      await waitFor(() => expect(readoutX(canvasElement)).toBeNull());
      await userEvent.keyboard('{Escape}');
      await expect(prevented('Escape')).toBe(false);
      // The stop is the bar last active: exactly one bar takes Tab.
      await expect(barsOf(canvasElement).filter((bar) => bar.tabIndex === 0)).toHaveLength(1);
    } finally {
      view.removeEventListener('keydown', record, true);
    }
  },
};

/** A bar is 24px thick in a 40px row, and the amount column is as wide as the widest amount. */
export const Thickness: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvasElement }) => {
    const track = part(canvasElement, '.bar-chart-track').getBoundingClientRect();
    await expect(Math.abs(track.height - 40)).toBeLessThanOrEqual(1);
    const bar = barAt(canvasElement, 0).getBoundingClientRect();
    await expect(Math.abs(bar.height - 24)).toBeLessThanOrEqual(1);
    // Centred in its row.
    await expect(Math.abs(bar.top + bar.height / 2 - (track.top + track.height / 2))).toBeLessThanOrEqual(1);
    const column = part(canvasElement, '.bar-chart-amounts').getBoundingClientRect().width;
    const widest = Math.max(
      ...[...canvasElement.querySelectorAll('.bar-chart-amount')].map((amount) => {
        const range = canvasElement.ownerDocument.createRange();
        range.selectNodeContents(amount);
        return range.getBoundingClientRect().width;
      }),
    );
    await expect(Math.abs(column - widest)).toBeLessThanOrEqual(1);
  },
};

/** Each bar is named by its row header and its cell in the hidden table: "Whole Foods Market $612.40". */
export const NamesFromCells: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvas }) => {
    for (const [index, merchant] of MERCHANTS.entries()) {
      const value = BY_MERCHANT.values[index];
      await expect(
        canvas.getByRole('img', { name: `${merchant} ${value?.valueLabel ?? ''}` }),
      ).toHaveAttribute('aria-roledescription', 'bar');
    }
  },
};

/** The chart as an app's grouping control swaps it: from merchants to categories, keeping no stale bar. */
const Grouping = (args: BarChartProps): ReactElement => {
  const [by, setBy] = useState<'merchant' | 'category'>('merchant');
  return (
    <Panel>
      <button
        type="button"
        className="button button-tertiary"
        onClick={() => {
          setBy((shown) => (shown === 'merchant' ? 'category' : 'merchant'));
        }}
      >
        Group by {by === 'merchant' ? 'category' : 'merchant'}
      </button>
      <BarChart
        {...args}
        categories={by === 'merchant' ? MERCHANTS : CATEGORIES}
        series={[by === 'merchant' ? BY_MERCHANT : BY_CATEGORY]}
        valueTicks={by === 'merchant' ? MERCHANT_TICKS : CATEGORY_TICKS}
      />
    </Panel>
  );
};

/**
 * New categories while a bar holds focus, as a grouping control's shortcut would bring them: focus goes to the
 * new first bar and never passes through the body, whether the focused bar's row is gone or still there. Any
 * element that loses focus to nothing is caught as it does, so a pass through the body cannot hide between two
 * reads.
 */
export const GroupingChange: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => <Grouping {...args} />,
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    const doc = canvasElement.ownerDocument;
    const toNothing: string[] = [];
    const record = (event: FocusEvent): void => {
      if (event.relatedTarget === null && event.target instanceof Element)
        toNothing.push(event.target.className);
    };
    doc.addEventListener('focusout', record);
    try {
      const toggle = part(canvasElement, '.button');
      // The ninth row is gone in the six categories.
      await focusOn(barAt(canvasElement, 8));
      // A press that does not move focus, as a key shortcut's would not.
      toggle.click();
      await expect(doc.activeElement).not.toBe(doc.body);
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Groceries'));
      await expect(barsOf(canvasElement).filter((bar) => bar.tabIndex === 0)).toEqual([doc.activeElement]);
      // The third row stays in the merchants, now another category's bar.
      await focusOn(barAt(canvasElement, 2));
      toggle.click();
      await expect(doc.activeElement).not.toBe(doc.body);
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Whole Foods Market'));
      await expect(toNothing).toEqual([]);
    } finally {
      doc.removeEventListener('focusout', record);
    }
  },
};

/**
 * A size container takes no width from its content, so its holder gives it one: in a flex row, a basis of
 * 20rem that grows to the row and shrinks with it. The chart fills its item, and two side by side in a 320px
 * frame share it with nothing past its edge.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div data-testid="row" style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 20rem' }}>
          <BarChart {...args} />
        </div>
      </div>
      <div data-testid="two-up" style={{ display: 'flex', gap: 8, width: 320, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 20rem' }}>
          <BarChart {...args} aria-label="Spending by merchant, October" />
        </div>
        <div style={{ flex: '1 1 20rem' }}>
          <BarChart {...args} aria-label="Spending by merchant, September" />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const row = canvas.getByTestId('row');
    const [alone, ...pair] = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    if (!alone) throw new Error('No chart');
    await expect(
      Math.abs(alone.getBoundingClientRect().width - row.getBoundingClientRect().width),
    ).toBeLessThanOrEqual(1);
    const twoUp = canvas.getByTestId('two-up');
    await expect(twoUp.scrollWidth).toBeLessThanOrEqual(twoUp.clientWidth);
    for (const chart of pair) {
      const holder = chart.parentElement?.getBoundingClientRect();
      await expect(Math.abs(chart.getBoundingClientRect().width - (holder?.width ?? 0))).toBeLessThanOrEqual(
        1,
      );
      // Each takes half of the frame less the gap, and its names move above its bars.
      await expect(Math.abs(chart.getBoundingClientRect().width - 156)).toBeLessThanOrEqual(1);
      await expect(
        getComputedStyle(part(chart, '.bar-chart-rows')).gridTemplateColumns.split(' '),
      ).toHaveLength(2);
    }
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/** The horizontal center of a box, in px. */
const centreOf = (box: DOMRect): number => box.left + box.width / 2;

/**
 * Checks one chart: the zero line on the bars' zero edge, and each gridline on its value label, within 1px. In
 * right to left a bar's start is its right edge.
 */
const expectLinesInPlace = async (chart: HTMLElement): Promise<void> => {
  const rtl = getComputedStyle(part(chart, '.bar-chart-rows')).direction === 'rtl';
  const zero = centreOf(part(chart, '.bar-chart-baseline').getBoundingClientRect());
  for (const bar of chart.querySelectorAll<HTMLElement>('.bar-chart-bar[data-nonzero]')) {
    const box = bar.getBoundingClientRect();
    const isNegative = bar.dataset.sign === 'negative';
    // A positive bar starts at zero, a negative one ends there.
    const edge = isNegative !== rtl ? box.right : box.left;
    await expect(Math.abs(edge - zero), bar.getAttribute('aria-labelledby') ?? '').toBeLessThanOrEqual(1);
  }
  const lines = [...chart.querySelectorAll('.bar-chart-grid')];
  const labels = [...chart.querySelectorAll<HTMLElement>('.bar-chart-tick')];
  await expect(lines.length).toBe(labels.length);
  for (const [at, line] of lines.entries()) {
    const x = centreOf(line.getBoundingClientRect());
    const label = labels[at];
    if (!label) throw new Error('No label');
    const box = label.getBoundingClientRect();
    const edge = label.dataset.edge;
    const atStart = rtl ? box.right : box.left;
    const atEnd = rtl ? box.left : box.right;
    const anchor = edge === 'start' ? atStart : edge === 'end' ? atEnd : centreOf(box);
    await expect(Math.abs(anchor - x), label.textContent).toBeLessThanOrEqual(1);
  }
  // The lines stay on the track, never on the names or the amounts.
  const track = part(chart, '.bar-chart-track').getBoundingClientRect();
  const layer = part(chart, '.bar-chart-gridlines').getBoundingClientRect();
  await expect(Math.abs(layer.left - track.left)).toBeLessThanOrEqual(1);
  await expect(Math.abs(layer.right - track.right)).toBeLessThanOrEqual(1);
};

/** Refunds below zero, left to right, right to left and narrow: the zero line and the gridlines where they belong. */
export const LinesInPlace: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: {
    'aria-label': 'Spending by category, October',
    categories: CATEGORIES,
    series: [BY_CATEGORY],
    valueTicks: CATEGORY_TICKS,
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Panel>
        <BarChart {...args} />
      </Panel>
      <div dir="rtl">
        <Panel>
          <BarChart {...args} aria-label="Spending by category, October, right to left" />
        </Panel>
      </div>
      <Panel width="20rem">
        <BarChart {...args} aria-label="Spending by category, October, narrow" />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const charts = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    await expect(charts).toHaveLength(3);
    // The narrow one has put its names above its bars.
    const [, , narrow] = charts;
    if (!narrow) throw new Error('No narrow chart');
    await expect(
      getComputedStyle(part(narrow, '.bar-chart-rows')).gridTemplateColumns.split(' '),
    ).toHaveLength(2);
    for (const chart of charts) await expectLinesInPlace(chart);
  },
};

/** The first row's readout goes under its row, just below the bar, not under the whole chart. */
export const ReadoutBelow: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    const first = barAt(canvasElement, 0);
    await focusOn(first);
    await waitFor(() =>
      expect(part(canvasElement, '.bar-chart-readout')).toHaveAttribute('data-place', 'below'),
    );
    const panel = part(canvasElement, '.bar-chart-readout').getBoundingClientRect();
    const bar = first.getBoundingClientRect();
    await expect(panel.top).toBeGreaterThanOrEqual(bar.bottom);
    await expect(panel.top - bar.bottom).toBeLessThanOrEqual(24);
  },
};

/* Standing up: months, two series side by side, and the previous period. */

/** Twelve months, the newest last, as the app labels them. */
const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

/** A year of spending by month. */
const SPENDING_BY_MONTH: BarSeries = {
  label: 'Spending',
  values: [3820, 4610, 3390, 3125, 3540, 3480, 3710, 4020, 4390, 3960, 3610, 3885].map(money),
};

const SPENDING_TICKS = [
  { value: 0, label: '$0' },
  { value: 2500, label: '$2,500' },
  { value: 5000, label: '$5,000' },
];

/** Net cash flow by month: December's gifts and June's car repair took it below zero. */
const NET_BY_MONTH: BarSeries = {
  label: 'Net',
  values: [640, -820, 1210, 1480, 905, 1130, 760, -310, 455, 1020, 1395, 980].map(money),
};

const NET_TICKS = [
  { value: -1000, label: '-$1,000' },
  { value: 0, label: '$0' },
  { value: 1000, label: '$1,000' },
  { value: 2000, label: '$2,000' },
];

/** Half a year of money in beside money out: income in gain, spending in ink, as the consumer's month view. */
const HALF_YEAR = MONTHS.slice(6);

const INCOME: BarSeries = {
  label: 'Income',
  color: 'gain',
  values: [5200, 5200, 5450, 5200, 5200, 6100].map(money),
};

const SPENDING: BarSeries = {
  label: 'Spending',
  color: 'ink',
  values: [3710, 4020, 4390, 3960, 3610, 3885].map(money),
};

const INCOME_TICKS = [
  { value: 0, label: '$0' },
  { value: 2500, label: '$2,500' },
  { value: 5000, label: '$5,000' },
  { value: 7500, label: '$7,500' },
];

/** October beside September, by category: the previous period in the same ink, striped. */
const COMPARE_CATEGORIES = ['Groceries', 'Dining', 'Transport', 'Bills', 'Shopping'];

const OCTOBER: BarSeries = { label: 'October', values: [640, 312.45, 188.1, 150, 96.2].map(money) };

const SEPTEMBER: BarSeries = {
  label: 'September',
  look: 'hatched',
  values: [598.3, 355, 201.75, 150, 142.8].map(money),
};

const COMPARE_TICKS = [
  { value: 0, label: '$0' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
];

/** October's days. */
const DAYS = Array.from({ length: 31 }, (_, at) => `Oct ${String(at + 1)}`);

const BY_DAY: BarSeries = {
  label: 'October',
  values: DAYS.map((_, at) => money(40 + ((at * 37) % 90) + (at % 7 === 5 ? 120 : 0))),
};

/** Category names longer than a band, clamped at two lines with the whole name in the readout and the table. */
const LONG_CATEGORIES = [
  'Groceries and household',
  'Restaurants and takeaway',
  'Transport and fuel',
  'Utilities and phone',
  'Subscriptions',
];

const BY_LONG_CATEGORY: BarSeries = {
  label: 'October',
  values: [612.4, 284.15, 198.2, 150, 41.97].map(money),
};

/** The vertical charts' panel: the width of a card's body on a wide screen. */
const Wide = ({ children }: { children: ReactNode }): ReactElement => <Panel width="44rem">{children}</Panel>;

/** The band a bar stands in, by its band's place among the bands. */
const bandOf = (canvasElement: HTMLElement, bar: Element | null): number => {
  const band = bar?.closest('.bar-chart-band');
  return band ? [...canvasElement.querySelectorAll('.bar-chart-band')].indexOf(band) : -1;
};

/** Twelve months of spending, standing up: the time ticks first, middle and last, and the newest month last. */
export const Default: Story = {
  args: {
    'aria-label': 'Spending by month',
    orientation: 'vertical',
    bands: 'time',
    categories: MONTHS,
    series: [SPENDING_BY_MONTH],
    valueTicks: SPENDING_TICKS,
  },
  render: (args) => (
    <Wide>
      <BarChart {...args} />
    </Wide>
  ),
};

/** Net cash flow: December and June below the boundary-colored zero line, their rounded ends at the bottom. */
export const Negatives: Story = {
  args: {
    'aria-label': 'Net cash flow by month',
    orientation: 'vertical',
    bands: 'time',
    categories: MONTHS,
    series: [NET_BY_MONTH],
    valueTicks: NET_TICKS,
  },
  render: Default.render,
};

/** Income in gain beside spending in ink, each month a pair 2px apart, with a legend that names both. */
export const IncomeAndSpending: Story = {
  args: {
    'aria-label': 'Income and spending by month',
    orientation: 'vertical',
    bands: 'time',
    categories: HALF_YEAR,
    categoryTicks: [0, 1, 2, 3, 4, 5],
    series: [INCOME, SPENDING],
    valueTicks: INCOME_TICKS,
  },
  render: Default.render,
};

/** October beside September by category: September in the same ink, striped inside a full-strength border. */
export const CompareToPrevious: Story = {
  args: {
    'aria-label': 'Spending by category, October against September',
    orientation: 'vertical',
    categories: COMPARE_CATEGORIES,
    series: [OCTOBER, SEPTEMBER],
    valueTicks: COMPARE_TICKS,
  },
  render: Default.render,
};

/** Lying down: ten merchants this period beside the last, the last striped, its amounts in slate. */
export const CompareHorizontal: Story = {
  args: {
    'aria-label': 'Spending by merchant, October against September',
    series: [
      BY_MERCHANT,
      {
        label: 'September',
        look: 'hatched',
        values: [588.1, 301.4, 198.75, 210.6, 129.99, 64.2, 91.15, 47.3, 22.99, 11.99, 160.45].map(money),
      },
    ],
  },
};

/** Thirty-one days: thin bars, the first, middle and last day labelled, the readout at any band. */
export const TimeBands: Story = {
  args: {
    'aria-label': 'Spending by day, October',
    orientation: 'vertical',
    bands: 'time',
    categories: DAYS,
    series: [BY_DAY],
    valueTicks: [
      { value: 0, label: '$0' },
      { value: 100, label: '$100' },
      { value: 200, label: '$200' },
    ],
  },
  render: Default.render,
};

/** Every figure at its bar's end: above the bars above zero, below the bars below it, 4px off. */
export const ValueLabels: Story = {
  args: {
    'aria-label': 'Net cash flow by month, with figures',
    orientation: 'vertical',
    bands: 'time',
    categories: HALF_YEAR,
    categoryTicks: [0, 1, 2, 3, 4, 5],
    series: [{ ...NET_BY_MONTH, values: NET_BY_MONTH.values.slice(6) }],
    valueTicks: undefined,
    valueLabels: 'all',
  },
  render: Default.render,
};

/** Category names longer than their band: two lines and an ellipsis, never rotated; one line under 30rem. */
export const LongLabels: Story = {
  args: {
    'aria-label': 'Spending by category, October',
    orientation: 'vertical',
    categories: LONG_CATEGORIES,
    series: [BY_LONG_CATEGORY],
    valueTicks: COMPARE_TICKS,
  },
  render: Default.render,
};

/** Right to left, on a Persian page: the newest month at the left, a bad month below zero, figures left to right. */
export const RightToLeft: Story = {
  args: {
    'aria-label': 'جریان نقدی خالص بر اساس ماه',
    orientation: 'vertical',
    bands: 'time',
    categories: ['اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر'],
    categoryTicks: [0, 1, 2, 3, 4, 5],
    series: [{ label: 'خالص', values: [760, -310, 455, 1020, 1395, 980].map(money) }],
    valueTicks: NET_TICKS,
    valueLabels: [1, 5],
    labels: RightToLeftHorizontal.args?.labels,
  },
  render: (args) => (
    <div dir="rtl" lang="fa">
      <Wide>
        <BarChart {...args} />
      </Wide>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const bars = barsOf(canvasElement);
    const [first, last] = [bars[0], bars.at(-1)];
    if (!first || !last) throw new Error('No bars');
    // The oldest band at the right and the newest at the left.
    await expect(first.getBoundingClientRect().left).toBeGreaterThan(last.getBoundingClientRect().left);
    await expect(getComputedStyle(part(canvasElement, '.bar-chart-value-text')).direction).toBe('ltr');
  },
};

/**
 * The keys standing up: Tab lands on the newest month, Left and Right move band by band, Home, End and the
 * pages by band, Up and Down are left to the page, and Escape hides the readout once and then goes on.
 */
export const Keys: Story = {
  ...Default,
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvasElement, userEvent }) => {
    await interactive(canvasElement);
    const seen = new Map<string, KeyboardEvent>();
    const prevented = (key: string): boolean | undefined => seen.get(key)?.defaultPrevented;
    const record = (event: KeyboardEvent): void => {
      seen.set(event.key, event);
    };
    const doc = canvasElement.ownerDocument;
    const band = (): number => bandOf(canvasElement, doc.activeElement);
    const view = doc.defaultView ?? window;
    view.addEventListener('keydown', record, true);
    try {
      await userEvent.tab();
      await waitFor(() => expect(band()).toBe(11));
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(band()).toBe(10));
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(band()).toBe(11));
      await userEvent.keyboard('{ArrowRight}');
      await expect(prevented('ArrowRight')).toBe(true);
      await expect(band()).toBe(11);
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(band()).toBe(0));
      await userEvent.keyboard('{PageDown}');
      await waitFor(() => expect(band()).toBe(7));
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(band()).toBe(11));
      await userEvent.keyboard('{PageUp}');
      await waitFor(() => expect(band()).toBe(4));
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.keyboard('{ArrowDown}');
      await expect(prevented('ArrowUp')).toBe(false);
      await expect(prevented('ArrowDown')).toBe(false);
      await expect(band()).toBe(4);
      await expect(readoutX(canvasElement)).toBe('Mar');
      await userEvent.keyboard('{Escape}');
      await expect(prevented('Escape')).toBe(true);
      await waitFor(() => expect(readoutX(canvasElement)).toBeNull());
      await userEvent.keyboard('{Escape}');
      await expect(prevented('Escape')).toBe(false);
      await expect(barsOf(canvasElement).filter((bar) => bar.tabIndex === 0)).toEqual([doc.activeElement]);
    } finally {
      view.removeEventListener('keydown', record, true);
    }
  },
};

/**
 * The keys through a comparison: standing up, Right steps from this period's bar to last period's in the same
 * band, then on to the next band; lying down, Down does the same through a row. Each bar says its period.
 */
export const KeysCompare: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Wide>
        <BarChart
          aria-label="Spending by category, October against September"
          categories={COMPARE_CATEGORIES}
          series={[OCTOBER, SEPTEMBER]}
        />
      </Wide>
      <Panel>
        <BarChart
          aria-label="Spending by category, October against September, lying down"
          orientation="horizontal"
          categories={COMPARE_CATEGORIES}
          series={[OCTOBER, SEPTEMBER]}
        />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement, canvas, userEvent }) => {
    await interactive(canvasElement);
    const [standing, lying] = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    if (!standing || !lying) throw new Error('No charts');
    const doc = canvasElement.ownerDocument;
    const barOf = (chart: HTMLElement, at: number): HTMLElement => {
      const bar = barsOf(chart)[at];
      if (!bar) throw new Error(`No bar ${String(at)}`);
      return bar;
    };
    await userEvent.tab();
    await waitFor(() => expect(doc.activeElement).toBe(barOf(standing, 0)));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(doc.activeElement).toBe(barOf(standing, 1)));
    await expect(doc.activeElement).toHaveAttribute('data-look', 'hatched');
    // Its name says its period, so the stripes are never the only cue.
    const [named] = canvas.getAllByRole('img', { name: 'Groceries September $598.30' });
    await expect(named).toBe(barOf(standing, 1));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(doc.activeElement).toBe(barOf(standing, 2)));
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(doc.activeElement).toBe(barOf(standing, 1)));
    await focusOn(barOf(lying, 0));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(doc.activeElement).toBe(barOf(lying, 1)));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(doc.activeElement).toBe(barOf(lying, 2)));
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(doc.activeElement).toBe(barOf(lying, 1)));
  },
};

/**
 * Twelve grouped bands in a 248px plot, a phone's card: each bar 5.2px, (248 / 12 * 0.6 - 2) / 2, the two of a
 * pair 2px apart and centred on their band, with nothing measured by the chart.
 */
export const GroupThickness: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ width: 248 }}>
      <BarChart
        aria-label="Income and spending by month"
        bands="time"
        categories={MONTHS}
        series={[
          { ...INCOME, values: [...INCOME.values, ...INCOME.values] },
          { ...SPENDING, values: SPENDING_BY_MONTH.values },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const plot = part(canvasElement, '.bar-chart-bars').getBoundingClientRect();
    await expect(Math.abs(plot.width - 248)).toBeLessThanOrEqual(1);
    const bars = barsOf(canvasElement);
    await expect(bars).toHaveLength(24);
    const band = plot.width / 12;
    for (let at = 0; at < 12; at++) {
      const [left, right] = [
        bars[at * 2]?.getBoundingClientRect(),
        bars[at * 2 + 1]?.getBoundingClientRect(),
      ];
      if (!left || !right) throw new Error('No pair');
      await expect(Math.abs(left.width - 5.2), `band ${String(at)}`).toBeLessThanOrEqual(1);
      await expect(Math.abs(right.width - 5.2), `band ${String(at)}`).toBeLessThanOrEqual(1);
      await expect(Math.abs(right.left - left.right - 2), `band ${String(at)} gap`).toBeLessThanOrEqual(1);
      const centre = plot.left + (at + 0.5) * band;
      await expect(
        Math.abs((left.left + right.right) / 2 - centre),
        `band ${String(at)} centre`,
      ).toBeLessThanOrEqual(1);
    }
  },
};

/** Right to left: the first band's bar at the right edge, and Left moves to the next band, toward the newest. */
export const Mirrored: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: {
    'aria-label': 'Spending by month',
    orientation: 'vertical',
    categories: MONTHS,
    series: [SPENDING_BY_MONTH],
  },
  render: (args) => (
    <div dir="rtl">
      <Wide>
        <BarChart {...args} />
      </Wide>
    </div>
  ),
  play: async ({ canvasElement, userEvent }) => {
    await interactive(canvasElement);
    const plot = part(canvasElement, '.bar-chart-bars').getBoundingClientRect();
    const first = barAt(canvasElement, 0).getBoundingClientRect();
    const band = plot.width / 12;
    // Centred on the first band from the right.
    await expect(Math.abs(first.left + first.width / 2 - (plot.right - band / 2))).toBeLessThanOrEqual(1);
    await focusOn(barAt(canvasElement, 0));
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(canvasElement.ownerDocument.activeElement).toBe(barAt(canvasElement, 1)));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvasElement.ownerDocument.activeElement).toBe(barAt(canvasElement, 0)));
  },
};

/** The vertical middle of a box, in px. */
const middleOf = (box: DOMRect): number => box.top + box.height / 2;

/**
 * Checks one standing chart: every bar on the zero line within 1px, a positive one by its bottom and a negative
 * one by its top; each gridline under its label; each value label 4px off its bar's end and centred on it.
 */
const expectStandingLinesInPlace = async (chart: HTMLElement): Promise<void> => {
  const zero = middleOf(part(chart, '.bar-chart-baseline').getBoundingClientRect());
  for (const bar of chart.querySelectorAll<HTMLElement>('.bar-chart-bar[data-nonzero]')) {
    const box = bar.getBoundingClientRect();
    const edge = bar.dataset.sign === 'negative' ? box.top : box.bottom;
    await expect(Math.abs(edge - zero), bar.getAttribute('aria-labelledby') ?? '').toBeLessThanOrEqual(1);
  }
  const lines = [...chart.querySelectorAll('.bar-chart-grid')];
  const labels = [...chart.querySelectorAll<HTMLElement>('.bar-chart-y-label')];
  await expect(lines.length).toBe(labels.length);
  for (const [at, line] of lines.entries()) {
    const y = middleOf(line.getBoundingClientRect());
    const label = labels[at]?.getBoundingClientRect();
    if (!label) throw new Error('No label');
    // Above its line, at the plot's start.
    await expect(Math.abs(label.bottom - y), labels[at]?.textContent ?? '').toBeLessThanOrEqual(1);
  }
  const bars = barsOf(chart);
  for (const value of chart.querySelectorAll<HTMLElement>('.bar-chart-value')) {
    const box = value.getBoundingClientRect();
    if (box.width === 0) continue;
    const index = value.style.getPropertyValue('--bar-chart-index');
    const centre = value.style.getPropertyValue('--bar-chart-centre');
    const bar = bars.find(
      (candidate) =>
        candidate.style.getPropertyValue('--bar-chart-centre') === centre &&
        candidate.style.getPropertyValue('--bar-chart-index') === index,
    );
    if (!bar) throw new Error('No bar for a value label');
    const end = bar.getBoundingClientRect();
    const gap = value.dataset.sign === 'negative' ? box.top - end.bottom : end.top - box.bottom;
    await expect(Math.abs(gap - 4), value.textContent).toBeLessThanOrEqual(1);
    await expect(
      Math.abs(box.left + box.width / 2 - (end.left + end.width / 2)),
      value.textContent,
    ).toBeLessThanOrEqual(1);
  }
};

/** Net cash flow left to right, right to left and narrow: the zero line, the gridlines and the figures in place. */
export const LinesInPlaceStanding: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: {
    'aria-label': 'Net cash flow by month',
    orientation: 'vertical',
    bands: 'time',
    categories: HALF_YEAR,
    series: [{ ...NET_BY_MONTH, values: NET_BY_MONTH.values.slice(6) }],
    valueTicks: NET_TICKS,
    valueLabels: 'all',
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Wide>
        <BarChart {...args} />
      </Wide>
      <div dir="rtl">
        <Wide>
          <BarChart {...args} aria-label="Net cash flow by month, right to left" />
        </Wide>
      </div>
      <Panel width="20rem">
        <BarChart {...args} aria-label="Net cash flow by month, narrow" />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const charts = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    await expect(charts).toHaveLength(3);
    const [, , narrow] = charts;
    if (!narrow) throw new Error('No narrow chart');
    // Under 30rem the figures of 'all' keep only the first and the last band's.
    const shown = [...narrow.querySelectorAll('.bar-chart-value')].filter(
      (value) => getComputedStyle(value).display !== 'none',
    );
    await expect(shown.map((value) => value.textContent)).toEqual(['$760.00', '$980.00']);
    for (const chart of charts) await expectStandingLinesInPlace(chart);
  },
};

/**
 * The readout standing up: above its band's highest bar end where its lines fit, below the band's lowest
 * otherwise, never over a bar of the band and close to it.
 */
export const ReadoutStanding: Story = {
  ...Negatives,
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Wide>
        <BarChart {...args} />
      </Wide>
      {/* A phone's card: a 280px chart with a legend over its plot. */}
      <div style={{ width: 280 }}>
        <BarChart
          aria-label="Income and spending by month, on a phone"
          bands="time"
          categories={HALF_YEAR}
          series={[INCOME, SPENDING]}
          valueTicks={INCOME_TICKS}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    const [wide, phone] = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    if (!wide || !phone) throw new Error('No charts');
    // A bar with room above it, two bars below zero, whose readout goes above the line, and the tallest.
    for (const at of [0, 1, 7, 3]) {
      const bar = barAt(wide, at);
      await focusOn(bar);
      await waitFor(() => expect(readoutX(wide)).toBe(MONTHS[at]));
      const panel = part(wide, '.bar-chart-readout');
      const box = panel.getBoundingClientRect();
      const end = bar.getBoundingClientRect();
      const month = MONTHS[at] ?? '';
      if (panel.dataset.place === 'above') {
        await expect(box.bottom, month).toBeLessThanOrEqual(end.top + 1);
        await expect(end.top - box.bottom, month).toBeLessThanOrEqual(24);
      } else {
        await expect(box.top, month).toBeGreaterThanOrEqual(end.bottom - 1);
        await expect(box.top - end.bottom, month).toBeLessThanOrEqual(24);
      }
    }
    // On a phone every figure keeps to one line, so the panel stays the height its place counted, and it never
    // rises over the legend and out of the chart.
    const figure = phone.getBoundingClientRect();
    for (const bar of barsOf(phone)) {
      await focusOn(bar);
      await waitFor(() => expect(phone.querySelector('.bar-chart-readout')).not.toBeNull());
      for (const value of phone.querySelectorAll<HTMLElement>('.bar-chart-readout-value')) {
        const line = parseFloat(getComputedStyle(value).lineHeight);
        await expect(value.getBoundingClientRect().height, value.textContent).toBeLessThanOrEqual(line + 1);
      }
      const panel = part(phone, '.bar-chart-readout').getBoundingClientRect();
      await expect(panel.top, bar.getAttribute('aria-labelledby') ?? '').toBeGreaterThanOrEqual(
        figure.top - 1,
      );
    }
  },
};

/** The consumer's card as its grouping control turns it: Month standing up, Category lying down. */
const Turning = (): ReactElement => {
  const [by, setBy] = useState<'month' | 'category'>('month');
  return (
    <Panel width="44rem">
      <button
        type="button"
        className="button button-tertiary"
        onClick={() => {
          setBy((shown) => (shown === 'month' ? 'category' : 'month'));
        }}
      >
        Group by {by === 'month' ? 'category' : 'month'}
      </button>
      {by === 'month' ? (
        <BarChart
          aria-label="Spending"
          bands="time"
          categories={MONTHS}
          series={[SPENDING_BY_MONTH]}
          valueTicks={SPENDING_TICKS}
        />
      ) : (
        <BarChart
          aria-label="Spending"
          orientation="horizontal"
          categories={CATEGORIES}
          series={[BY_CATEGORY]}
          valueTicks={CATEGORY_TICKS}
        />
      )}
    </Panel>
  );
};

/**
 * The grouping turns the chart on its side while a bar holds focus: focus goes to the new first stop, the
 * first category lying down and the newest month standing up, and no element ever loses focus to nothing.
 */
export const TurnWhileFocused: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Turning />,
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    const doc = canvasElement.ownerDocument;
    const toNothing: string[] = [];
    const record = (event: FocusEvent): void => {
      if (event.relatedTarget === null && event.target instanceof Element)
        toNothing.push(event.target.className);
    };
    doc.addEventListener('focusout', record);
    try {
      const toggle = part(canvasElement, '.button');
      await focusOn(barAt(canvasElement, 4));
      // A press that does not move focus, as a key shortcut's would not.
      toggle.click();
      await expect(doc.activeElement).not.toBe(doc.body);
      await waitFor(() => expect(focusedCategory(canvasElement)).toBe('Groceries'));
      await focusOn(barAt(canvasElement, 2));
      toggle.click();
      await expect(doc.activeElement).not.toBe(doc.body);
      await waitFor(() => expect(bandOf(canvasElement, doc.activeElement)).toBe(11));
      await expect(barsOf(canvasElement).filter((bar) => bar.tabIndex === 0)).toEqual([doc.activeElement]);
      await expect(toNothing).toEqual([]);
    } finally {
      doc.removeEventListener('focusout', record);
    }
  },
};

/** The statuses an app's fetch takes the chart through, in turn: loading, ready, a failure, ready again. */
const STATUSES = ['ready', 'loading', 'ready', 'error'] as const;

/** A chart standing up and one lying down, both taken through the same statuses by one control. */
const Statuses = (): ReactElement => {
  const [at, setAt] = useState(0);
  const status = STATUSES[at % STATUSES.length] ?? 'ready';
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <button
        type="button"
        className="button button-tertiary"
        onClick={() => {
          setAt((shown) => shown + 1);
        }}
      >
        Next status, now {status}
      </button>
      <Wide>
        <BarChart
          aria-label="Spending by month"
          bands="time"
          categories={MONTHS}
          series={[SPENDING_BY_MONTH]}
          status={status}
        />
      </Wide>
      <Panel>
        <BarChart
          aria-label="Spending by category"
          orientation="horizontal"
          categories={CATEGORIES}
          series={[BY_CATEGORY]}
          status={status}
        />
      </Panel>
    </div>
  );
};

/**
 * A status while a bar holds focus, in both orientations: ready, loading, ready, a failure, ready. Focus waits on
 * the chart's group, which is never a tab stop, and goes back to the bar when the chart is ready, and no element
 * ever loses focus to nothing, which a status that took the group's focusability away in its commit did.
 */
export const StatusWhileFocused: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Statuses />,
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    const doc = canvasElement.ownerDocument;
    const toNothing: string[] = [];
    const record = (event: FocusEvent): void => {
      if (event.relatedTarget === null && event.target instanceof Element)
        toNothing.push(event.target.className);
    };
    doc.addEventListener('focusout', record);
    try {
      const control = part(canvasElement, '.button');
      for (const chart of canvasElement.querySelectorAll<HTMLElement>('.bar-chart')) {
        const group = part(chart, '[role="group"]');
        const bar = barAt(chart, 2);
        await focusOn(bar);
        for (const next of ['loading', 'ready', 'error', 'ready'] as const) {
          // A press that does not move focus, as a fetch's answer would not.
          control.click();
          await waitFor(() => expect(chart).toHaveAttribute('data-status', next));
          await expect(doc.activeElement).not.toBe(doc.body);
          if (next === 'ready') await waitFor(() => expect(doc.activeElement).toBe(barAt(chart, 2)));
          else await waitFor(() => expect(doc.activeElement).toBe(group));
          await expect(group).toHaveAttribute('tabindex', '-1');
        }
      }
      await expect(toNothing).toEqual([]);
    } finally {
      doc.removeEventListener('focusout', record);
    }
  },
};

/**
 * A month of days against the last month in a phone's card: each bar thinner than 4px, where stripes would be
 * noise, so the previous period's bars are their outline alone, a 1px border in the series' color.
 */
export const HatchedThin: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 320 }}>
      <BarChart
        aria-label="Spending by day, October against September"
        bands="time"
        categories={DAYS}
        series={[BY_DAY, { ...BY_DAY, label: 'September', look: 'hatched' }]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const hatched = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart-bar[data-look="hatched"]')];
    await expect(hatched).toHaveLength(31);
    for (const bar of hatched) {
      await expect(bar.getBoundingClientRect().width).toBeLessThan(4);
      await expect(getComputedStyle(bar).borderTopWidth).toBe('1px');
    }
  },
};

/* Stacked: the category mix by month, the top four categories and "Other" end to end. */

/** The month's top four categories, the same four all half year, and the rest summed as "Other", last. */
const MIX: BarSeries[] = [
  { label: 'Groceries', values: [612.4, 640, 598.3, 655.1, 621.75, 640].map(money) },
  { label: 'Dining', values: [312.45, 280.1, 355, 298.6, 330.2, 312.45].map(money) },
  { label: 'Transport', values: [188.1, 201.75, 176.4, 215.3, 190, 188.1].map(money) },
  { label: 'Bills', values: [150, 150, 150, 165.2, 150, 150].map(money) },
  { label: 'Other', values: [243.6, 210.4, 265.15, 198.9, 230.35, 226.8].map(money) },
];

/** Each band's total, as the app sums and formats it: the chart never adds a figure it must say. */
const totalsOf = (series: readonly BarSeries[], count: number): string[] =>
  Array.from({ length: count }, (_, band) => {
    const sum = series.reduce((total, line) => total + (line.values[band]?.value ?? 0), 0);
    return money(Math.round(sum * 100) / 100).valueLabel;
  });

const MIX_TOTALS = totalsOf(MIX, HALF_YEAR.length);

const MIX_TICKS = [
  { value: 0, label: '$0' },
  { value: 500, label: '$500' },
  { value: 1000, label: '$1,000' },
  { value: 1500, label: '$1,500' },
];

/** Net change by account: a card's spending below zero every month, savings drawn on in July. */
const BY_ACCOUNT: BarSeries[] = [
  { label: 'Checking', values: [820, -340, 410, 150, -220, 560].map(money) },
  { label: 'Savings', values: [300, 300, -500, 300, 300, 300].map(money) },
  { label: 'Credit card', values: [-640, -410, -720, -380, -560, -490].map(money) },
  { label: 'Brokerage', values: [250, -120, 180, 90, -60, 210].map(money) },
  { label: 'Other', values: [140, 95, -130, 155, 120, 135].map(money) },
];

/** A stack with an amount far smaller than its gap, above zero in May and below it in June. */
const SMALL_IN_A_STACK: BarSeries[] = [
  { label: 'Groceries', values: [600, -600].map(money) },
  { label: 'Gifts', values: [10, -10].map(money) },
  { label: 'Other', values: [300, -300].map(money) },
];

const ACCOUNT_TICKS = [
  { value: -1000, label: '-$1,000' },
  { value: 0, label: '$0' },
  { value: 1000, label: '$1,000' },
];

/**
 * The category mix by month: teal, violet, olive and magenta in that order and slate "Other" on top, 2px of
 * the card between segments, only the top segment rounded, and each month's total over its stack.
 */
export const Stacked: Story = {
  args: {
    'aria-label': 'Spending by category and month',
    orientation: 'vertical',
    bands: 'time',
    categories: HALF_YEAR,
    categoryTicks: [0, 1, 2, 3, 4, 5],
    layout: 'stacked',
    series: MIX,
    totals: MIX_TOTALS,
    valueLabels: 'all',
    valueTicks: MIX_TICKS,
  },
  render: Default.render,
};

/**
 * A stack across zero: positives up from the boundary-colored zero line and negatives down, each sign in
 * series order, the outermost segment of each sign rounded, and each net total at the end of its side.
 */
export const StackedNegatives: Story = {
  args: {
    'aria-label': 'Net change by account and month',
    orientation: 'vertical',
    bands: 'time',
    categories: HALF_YEAR,
    categoryTicks: [0, 1, 2, 3, 4, 5],
    layout: 'stacked',
    series: BY_ACCOUNT,
    totals: totalsOf(BY_ACCOUNT, HALF_YEAR.length),
    valueLabels: 'all',
    valueTicks: ACCOUNT_TICKS,
  },
  render: Default.render,
};

/**
 * The textures on request: the first slot solid, the second striped at 45 degrees, the third at 135, the fourth
 * both, and "Other" solid slate, each inside a 1px border of its color, the legend's keys with them.
 */
export const Textures: Story = {
  args: { ...Stacked.args, 'aria-label': 'Spending by category and month, textured', hasTexture: true },
  render: Default.render,
};

/** The numbers of a computed background layer's first two values, such as 0 and 100 for "0% 100%". */
const firstLayer = (value: string): number[] =>
  [...(value.split(',')[0] ?? '').matchAll(/-?[\d.]+/g)].map((match) => Number(match[0]));

/**
 * A textured segment on another keeps its outline on the side its gap takes: a 1px layer of its color along
 * its zero-ward edge, the foot above zero and the top below it standing up, and lying down the inline start or
 * end, so the right edge of a positive segment right to left. A segment on the line has its border there.
 */
export const TexturedEdges: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Wide>
        <BarChart
          aria-label="Net change by account and month, textured"
          categories={HALF_YEAR}
          layout="stacked"
          series={BY_ACCOUNT}
          hasTexture
        />
      </Wide>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir}>
          <Panel>
            <BarChart
              aria-label={`Net change by account, textured, ${dir}`}
              orientation="horizontal"
              categories={HALF_YEAR}
              layout="stacked"
              series={BY_ACCOUNT}
              valueLabels="none"
              hasTexture
            />
          </Panel>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const charts = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    await expect(charts).toHaveLength(3);
    for (const [index, chart] of charts.entries()) {
      const isVertical = index === 0;
      const rtl = index === 2;
      for (const segment of chart.querySelectorAll<HTMLElement>('.bar-chart-bar')) {
        const style = getComputedStyle(segment);
        const label = segment.getAttribute('aria-labelledby') ?? '';
        const size = firstLayer(style.backgroundSize);
        if (!segment.hasAttribute('data-joined')) {
          await expect(size, label).toEqual([0, 0]);
          continue;
        }
        const isPositive = segment.dataset.sign === 'positive';
        const [x, y] = firstLayer(style.backgroundPosition);
        if (isVertical) {
          await expect(size, label).toEqual([100, 1]);
          await expect(y, label).toBe(isPositive ? 100 : 0);
        } else {
          await expect(size, label).toEqual([1, 100]);
          // The zero-ward side: a positive segment's inline start, the left left to right.
          await expect(x, label).toBe(isPositive !== rtl ? 0 : 100);
        }
      }
    }
  },
};

/** The vertical middle of a band's stack, its top and its foot, each a segment's box. */
const stackOf = (chart: HTMLElement, band: number): HTMLElement[] => [
  ...(chart.querySelectorAll('.bar-chart-band')[band]?.querySelectorAll<HTMLElement>('.bar-chart-bar') ?? []),
];

/**
 * Checks one stacked chart standing up, on the gridlines' scale: the first segment of each sign stands on the
 * zero line; each segment on another ends where its sum does, with its 2px gap inside its own length, and is
 * at least 3px, so a small one still draws 1px of its color; the stack's far ends are where its sums are; and
 * only the outermost segment of each sign has rounded corners.
 */
const expectStackInPlace = async (chart: HTMLElement, series: readonly BarSeries[]): Promise<void> => {
  const zero = middleOf(part(chart, '.bar-chart-baseline').getBoundingClientRect());
  const lines = [...chart.querySelectorAll('.bar-chart-grid')].map((line) =>
    middleOf(line.getBoundingClientRect()),
  );
  const [low, high] = [lines[0], lines.at(-1)];
  if (low === undefined || high === undefined) throw new Error('No gridlines');
  // Px per dollar, from the gridlines at -1,000 and 1,000.
  const perUnit = (low - high) / 2000;
  const bands = chart.querySelectorAll('.bar-chart-band').length;
  for (let band = 0; band < bands; band++) {
    const segments = stackOf(chart, band);
    let [up, down, top, foot] = [0, 0, zero, zero];
    for (const [at, segment] of segments.entries()) {
      const box = segment.getBoundingClientRect();
      const value = series[at]?.values[band]?.value ?? 0;
      const style = getComputedStyle(segment);
      const label = segment.getAttribute('aria-labelledby') ?? '';
      const before = value >= 0 ? up : down;
      // Where the segment's far end belongs, in px down the page.
      const far = zero - (before + value) * perUnit;
      if (before === 0) {
        // The first of its sign stands on the line.
        await expect(Math.abs((value >= 0 ? box.bottom : box.top) - zero), label).toBeLessThanOrEqual(1);
      } else {
        // On another: its far end where its sum is, its gap toward zero, and its gap and 1px of color at least.
        await expect(Math.abs((value >= 0 ? box.top : box.bottom) - far), label).toBeLessThanOrEqual(1);
        await expect(box.height, label).toBeGreaterThanOrEqual(Math.max(3, Math.abs(value) * perUnit) - 1);
      }
      await expect(value >= 0 ? style.borderBottomWidth : style.borderTopWidth, label).toBe(
        before === 0 ? '0px' : '2px',
      );
      if (value >= 0) {
        up += value;
        top = box.top;
      } else {
        down += value;
        foot = box.bottom;
      }
      // Inner joins are square; the zero end of every segment is square.
      const corners = [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomLeftRadius,
        style.borderBottomRightRadius,
      ];
      const atZeroEnd = value >= 0 ? corners.slice(2) : corners.slice(0, 2);
      await expect(atZeroEnd, label).toEqual(['0px', '0px']);
      if (!segment.hasAttribute('data-outer'))
        await expect(corners, label).toEqual(['0px', '0px', '0px', '0px']);
    }
    // The stack's ends are its sums, on the gridlines' scale.
    await expect(Math.abs(top - (zero - up * perUnit)), `band ${String(band)} top`).toBeLessThanOrEqual(1);
    await expect(Math.abs(foot - (zero - down * perUnit)), `band ${String(band)} foot`).toBeLessThanOrEqual(
      1,
    );
  }
};

/** A stack across zero, left to right, right to left and narrow: every segment on the line or on another. */
export const StackInPlace: Story = {
  ...StackedNegatives,
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { ...StackedNegatives.args, valueLabels: 'none' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Wide>
        <BarChart {...args} />
      </Wide>
      <div dir="rtl">
        <Wide>
          <BarChart {...args} aria-label="Net change by account and month, right to left" />
        </Wide>
      </div>
      <Panel width="20rem">
        <BarChart {...args} aria-label="Net change by account and month, narrow" />
      </Panel>
      <Wide>
        <BarChart
          aria-label="A small amount between two large ones"
          categories={['May', 'Jun']}
          layout="stacked"
          series={SMALL_IN_A_STACK}
          valueTicks={ACCOUNT_TICKS}
        />
      </Wide>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const charts = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    await expect(charts).toHaveLength(4);
    const [ltr, rtl, narrow, small] = charts;
    if (!ltr || !rtl || !narrow || !small) throw new Error('No charts');
    for (const chart of [ltr, rtl, narrow]) await expectStackInPlace(chart, BY_ACCOUNT);
    // $10 of [-1,000, 1,000] in 240px is about 1px: drawn 3px, its gap and 1px of violet, over Groceries' top.
    await expectStackInPlace(small, SMALL_IN_A_STACK);
    for (const band of [0, 1]) {
      const [, tiny] = stackOf(small, band);
      if (!tiny) throw new Error('No small segment');
      await expect(Math.abs(tiny.getBoundingClientRect().height - 3)).toBeLessThanOrEqual(0.5);
    }
  },
};

/**
 * Lying down, the gaps run along the row: each segment after the first of its sign starts where the one before
 * it ends, its 2px gap on its edge toward zero, which is its left edge left to right and its right edge right
 * to left for a positive one.
 */
export const StackGaps: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <div key={dir} dir={dir}>
          <Panel>
            <BarChart
              aria-label={`Net change by account, ${dir}`}
              orientation="horizontal"
              categories={HALF_YEAR}
              layout="stacked"
              series={BY_ACCOUNT}
              valueLabels="none"
            />
          </Panel>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const chart of canvasElement.querySelectorAll<HTMLElement>('.bar-chart')) {
      const rtl = chart.closest('[dir]')?.getAttribute('dir') === 'rtl';
      for (const row of chart.querySelectorAll('.bar-chart-row')) {
        const segments = [...row.querySelectorAll<HTMLElement>('.bar-chart-bar')];
        // The far end each sign has reached, in px along the row, from the zero edge of its first segment.
        const reached = new Map<string, number>();
        for (const segment of segments) {
          const sign = segment.dataset.sign ?? '';
          if (sign === 'zero') continue;
          const box = segment.getBoundingClientRect();
          const style = getComputedStyle(segment);
          // A positive segment grows toward the inline end, a negative one toward the start.
          const toRight = (sign === 'positive') !== rtl;
          const [near, far] = toRight ? [box.left, box.right] : [box.right, box.left];
          const gap = toRight ? style.borderLeftWidth : style.borderRightWidth;
          const label = segment.getAttribute('aria-labelledby') ?? '';
          const before = reached.get(sign);
          if (before !== undefined) await expect(Math.abs(near - before), label).toBeLessThanOrEqual(1);
          await expect(gap, label).toBe(segment.hasAttribute('data-joined') ? '2px' : '0px');
          await expect(segment.hasAttribute('data-joined'), label).toBe(before !== undefined);
          reached.set(sign, far);
        }
      }
    }
  },
};

/**
 * The readout over a stack: it lists every segment of the band and the total, above the stack's top where its
 * lines fit and below its foot otherwise, never over a segment and close to the stack.
 */
export const ReadoutStacked: Story = {
  ...StackedNegatives,
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { ...StackedNegatives.args, valueLabels: 'none', height: 360 },
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    for (const band of [0, 2, 5]) {
      const segments = stackOf(canvasElement, band);
      const [first] = segments;
      if (!first) throw new Error('No stack');
      await focusOn(first);
      await waitFor(() => expect(readoutX(canvasElement)).toBe(HALF_YEAR[band]));
      const panel = part(canvasElement, '.bar-chart-readout');
      await expect(panel.querySelectorAll('li')).toHaveLength(segments.length + 1);
      const box = panel.getBoundingClientRect();
      const boxes = segments.map((segment) => segment.getBoundingClientRect());
      const [top, foot] = [Math.min(...boxes.map((b) => b.top)), Math.max(...boxes.map((b) => b.bottom))];
      const month = HALF_YEAR[band] ?? '';
      if (panel.dataset.place === 'above') {
        await expect(box.bottom, month).toBeLessThanOrEqual(top + 1);
        await expect(top - box.bottom, month).toBeLessThanOrEqual(24);
      } else {
        await expect(box.top, month).toBeGreaterThanOrEqual(foot - 1);
        await expect(box.top - foot, month).toBeLessThanOrEqual(24);
      }
    }
  },
};

/**
 * The keys through a stack: standing up, Up and Down move segment by segment along the stack, by what is drawn
 * above and below, and Left and Right to the same category in the band beside, mirrored in right to left; lying
 * down, Left and Right move along the bar and Up and Down across the rows.
 */
export const KeysStacked: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Wide>
        <BarChart
          aria-label="Net change by account and month"
          bands="time"
          categories={HALF_YEAR}
          layout="stacked"
          series={BY_ACCOUNT}
        />
      </Wide>
      <div dir="rtl">
        <Wide>
          <BarChart
            aria-label="Net change by account and month, right to left"
            bands="time"
            categories={HALF_YEAR}
            layout="stacked"
            series={BY_ACCOUNT}
          />
        </Wide>
      </div>
      <Panel>
        <BarChart
          aria-label="Spending by category and month, lying down"
          orientation="horizontal"
          categories={HALF_YEAR}
          layout="stacked"
          series={MIX}
          totals={MIX_TOTALS}
        />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement, userEvent }) => {
    await interactive(canvasElement);
    const [standing, mirrored, lying] = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
    if (!standing || !mirrored || !lying) throw new Error('No charts');
    const doc = canvasElement.ownerDocument;
    const seen = new Map<string, KeyboardEvent>();
    const record = (event: KeyboardEvent): void => {
      seen.set(event.key, event);
    };
    /** The focused segment, as [its band, its series], from its place in its band. */
    const at = (chart: HTMLElement): [number, string | null] => {
      const bar = doc.activeElement;
      const band = bar?.closest('.bar-chart-band, .bar-chart-row');
      const bands = [...chart.querySelectorAll('.bar-chart-band, .bar-chart-row')];
      const name = bar?.getAttribute('aria-labelledby')?.split(' ')[1] ?? '';
      return [band ? bands.indexOf(band) : -1, doc.getElementById(name)?.textContent ?? null];
    };
    const view = doc.defaultView ?? window;
    view.addEventListener('keydown', record, true);
    try {
      // Tab lands on the newest month's first account: Checking in October, 560 above zero.
      await userEvent.tab();
      await waitFor(() => expect(at(standing)).toEqual([5, 'Checking']));
      // October from the foot: Credit card below zero, then Checking, Savings, Brokerage and Other above.
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(at(standing)).toEqual([5, 'Savings']));
      await expect(seen.get('ArrowUp')?.defaultPrevented).toBe(true);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await waitFor(() => expect(at(standing)).toEqual([5, 'Credit card']));
      await userEvent.keyboard('{ArrowDown}');
      await expect(seen.get('ArrowDown')?.defaultPrevented).toBe(true);
      await expect(at(standing)).toEqual([5, 'Credit card']);
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(at(standing)).toEqual([4, 'Credit card']));
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(at(standing)).toEqual([0, 'Credit card']));
      // Right to left, Left goes on to the band after, drawn to the left.
      const [october] = stackOf(mirrored, 0);
      if (!october) throw new Error('No segment');
      await focusOn(october);
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(at(mirrored)).toEqual([1, 'Checking']));
      // Up is along the stack in either direction: from Checking, below zero in June, to Savings above it.
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(at(mirrored)).toEqual([1, 'Savings']));
      // Lying down, along the bar and across the rows.
      const [may] = [...lying.querySelectorAll<HTMLElement>('.bar-chart-bar')];
      if (!may) throw new Error('No segment');
      await focusOn(may);
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(at(lying)).toEqual([0, 'Dining']));
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(at(lying)).toEqual([1, 'Dining']));
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(at(lying)).toEqual([1, 'Groceries']));
      await expect(seen.get('ArrowLeft')?.defaultPrevented).toBe(true);
      await expect(lying.querySelectorAll('.bar-chart-bar[tabindex="0"]')).toHaveLength(1);
    } finally {
      view.removeEventListener('keydown', record, true);
    }
  },
};

/** The steps an app's data takes a stack through: a segment's value gone, a fetch, the data back. */
const STACK_STEPS = ['ready', 'fewer', 'loading', 'ready'] as const;

/** A stack whose data and status one control moves on, a step at a time. */
const StackChanges = (): ReactElement => {
  const [step, setStep] = useState(0);
  const now = STACK_STEPS[step % STACK_STEPS.length] ?? 'ready';
  // October's Dining goes, as a filter or a correction would take it.
  const series =
    now === 'fewer'
      ? MIX.map((line, at) => (at === 1 ? { ...line, values: line.values.slice(0, 5) } : line))
      : MIX;
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <button
        type="button"
        className="button button-tertiary"
        onClick={() => {
          setStep((shown) => shown + 1);
        }}
      >
        Next step, now {now}
      </button>
      <Wide>
        <BarChart
          aria-label="Spending by category and month"
          bands="time"
          categories={HALF_YEAR}
          layout="stacked"
          series={series}
          status={now === 'loading' ? 'loading' : 'ready'}
        />
      </Wide>
      {/* A second chart on the page, which holds focus while the first one's data and status move on. */}
      <Wide>
        <BarChart
          aria-label="Net change by account and month"
          bands="time"
          categories={HALF_YEAR}
          layout="stacked"
          series={BY_ACCOUNT}
        />
      </Wide>
    </div>
  );
};

/**
 * Focus on a stack's segment through the data and the status: the segment's value gone, then loading, then the
 * data back. Focus waits on the chart's group, never a tab stop, and goes to the tab stop whenever the chart is
 * ready, and no element ever loses focus to nothing.
 */
export const StackFocus: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <StackChanges />,
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    const doc = canvasElement.ownerDocument;
    const toNothing: string[] = [];
    const record = (event: FocusEvent): void => {
      if (event.relatedTarget === null && event.target instanceof Element)
        toNothing.push(event.target.className);
    };
    doc.addEventListener('focusout', record);
    try {
      const control = part(canvasElement, '.button');
      const [changing, other] = [...canvasElement.querySelectorAll<HTMLElement>('.bar-chart')];
      if (!changing || !other) throw new Error('No charts');
      const group = part(changing, '[role="group"]');
      const [, dining] = stackOf(changing, 5);
      if (!dining) throw new Error('No segment');
      await focusOn(dining);
      for (const next of ['fewer', 'loading', 'ready'] as const) {
        // A press that does not move focus, as a fetch's answer would not.
        control.click();
        await waitFor(() => expect(control).toHaveTextContent(`now ${next}`));
        await expect(doc.activeElement).not.toBe(doc.body);
        if (next === 'loading') await waitFor(() => expect(doc.activeElement).toBe(group));
        else
          await waitFor(() =>
            expect(doc.activeElement).toBe(group.querySelector('.bar-chart-bar[tabindex="0"]')),
          );
        // October's Dining went: the nearest category October still has, Groceries, holds the stop.
        if (next === 'fewer') await expect(doc.activeElement).toBe(stackOf(changing, 5)[0]);
      }
      // The other chart holds focus while the first moves on through its steps: focus stays where it is.
      const [held] = stackOf(other, 2);
      if (!held) throw new Error('No segment');
      await focusOn(held);
      for (let step = 0; step < 4; step++) {
        control.click();
        await waitFor(() => expect(control).toHaveTextContent(`now ${STACK_STEPS[step % 4] ?? ''}`));
        await expect(doc.activeElement).toBe(held);
      }
      await expect(toNothing).toEqual([]);
    } finally {
      doc.removeEventListener('focusout', record);
    }
  },
};
