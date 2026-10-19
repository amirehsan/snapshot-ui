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
  play: async ({ canvasElement }) => {
    await interactive(canvasElement);
    // A bar with room above it, two bars below zero, whose readout goes above the line, and the tallest.
    for (const at of [0, 1, 7, 3]) {
      const bar = barAt(canvasElement, at);
      await focusOn(bar);
      await waitFor(() => expect(readoutX(canvasElement)).toBe(MONTHS[at]));
      const panel = part(canvasElement, '.bar-chart-readout');
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
