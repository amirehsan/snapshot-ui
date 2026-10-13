import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement, ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { LineChart, type LinePoint, type LineSeries } from './LineChart';

/** October, as the app formats its days. */
const DAYS = Array.from({ length: 31 }, (_, index) => `Oct ${String(index + 1)}`);

const point = (value: number): LinePoint => ({ value, valueLabel: `$${value.toFixed(2)}` });

/** A day's spending this month, Oct 1 to Oct 31: rising to $84.20 with the dips a real month has. */
const THIS = [
  42.1, 38.5, 55, 61.2, 47.8, 33.4, 29.9, 52.6, 64.3, 58, 49.5, 71.2, 66.8, 54.1, 45.7, 39.2, 62.4, 77.9,
  70.3, 58.8, 51.6, 48.2, 66, 73.5, 80.1, 69.4, 57.3, 62.9, 75.6, 81.8, 84.2,
];

/** Last month's, day by day: the context, flatter. */
const LAST = [
  35, 41.2, 47.5, 44.8, 39.1, 36.6, 42.3, 50.4, 53.7, 49.9, 46.2, 52.8, 58.1, 55.6, 51.3, 47, 53.9, 60.2,
  57.4, 54, 50.7, 56.3, 61.8, 59.5, 63.2, 60, 56.8, 62.5, 66.1, 64.4, 61,
];

const THIS_MONTH: LineSeries = { label: 'This month', points: THIS.map(point) };
const LAST_MONTH: LineSeries = { label: 'Last month', points: LAST.map(point) };

/** This month up to Oct 18; the days still to come are gaps. */
const SO_FAR: LineSeries = {
  label: 'This month',
  points: THIS.map((value, index) => (index < 18 ? point(value) : null)),
};

const TICKS = [
  { value: 0, label: '$0' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
];

/** A Lifted panel up to 40rem wide, the card a chart sits in most. */
const Panel = ({ children }: { children: ReactNode }): ReactElement => (
  <div
    style={{
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '40rem',
      padding: 24,
      borderRadius: 'var(--radius-surface)',
      backgroundColor: 'var(--color-lifted)',
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Components/LineChart',
  component: LineChart,
  args: { 'aria-label': 'Spending in October', series: [THIS_MONTH], xLabels: DAYS, yTicks: TICKS },
  render: (args) => (
    <Panel>
      <LineChart {...args} />
    </Panel>
  ),
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The element matching `selector` inside the canvas. */
const part = (canvasElement: HTMLElement, selector: string): HTMLElement => {
  const element = canvasElement.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
};

/** The x label the readout shows, or null when there is none. */
const readoutX = (canvasElement: HTMLElement): string | null =>
  canvasElement.querySelector('.line-chart-readout .line-chart-readout-x')?.textContent ?? null;

/** The live region's parts, in order. */
const liveParts = (canvasElement: HTMLElement): string[] =>
  [...canvasElement.querySelectorAll('.line-chart-live .line-chart-live-part')].map(
    (element) => element.textContent,
  );

/** One series: a 2px ink line over the gridlines, "$0", "$50" and "$100" above them, three days under it. */
export const Default: Story = {};

/** Both months: the second thinner and slate, under the first, and a legend that names both. */
export const TwoSeries: Story = {
  args: { series: [THIS_MONTH, LAST_MONTH] },
};

/** A 10% ink wash under the first series. */
export const WithArea: Story = {
  args: { hasArea: true },
};

/** This month up to Oct 18: the line stops there, and the days to come are gaps. */
export const Gaps: Story = {
  args: { series: [SO_FAR] },
  play: async ({ canvasElement }) => {
    const d = part(canvasElement, 'path.line-chart-line[data-series="1"]').getAttribute('d') ?? '';
    await expect(d.match(/M/g)).toHaveLength(1);
  },
};

/** Focused from the keyboard: the newest day, its crosshair, a ringed dot per series and the readout at the end. */
export const ActivePoint: Story = {
  args: { series: [THIS_MONTH, LAST_MONTH] },
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    await expect(readoutX(canvasElement)).toBe('Oct 31');
    await expect(part(canvasElement, '.line-chart-readout')).toHaveAttribute('data-align', 'end');
    // The panel stays inside the plot, with no measurement.
    const plot = part(canvasElement, '.line-chart-plot').getBoundingClientRect();
    const panel = part(canvasElement, '.line-chart-readout').getBoundingClientRect();
    await expect(panel.right).toBeLessThanOrEqual(plot.right + 0.5);
    // The dots are round at any width: 8px in a 2px ring.
    const dot = part(canvasElement, '.line-chart-dot').getBoundingClientRect();
    await expect(dot.width).toBe(12);
    await expect(dot.height).toBe(12);
  },
};

/** The first day: the readout starts at the inline start and reaches inward. */
export const ReadoutNearStart: Story = {
  args: { series: [THIS_MONTH, LAST_MONTH] },
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{Home}');
    await expect(readoutX(canvasElement)).toBe('Oct 1');
    await expect(part(canvasElement, '.line-chart-readout')).toHaveAttribute('data-align', 'start');
    const plot = part(canvasElement, '.line-chart-plot').getBoundingClientRect();
    const panel = part(canvasElement, '.line-chart-readout').getBoundingClientRect();
    await expect(panel.left).toBeGreaterThanOrEqual(plot.left - 0.5);
  },
};

/** The toggle pressed: the table of the same strings in place of the plot. */
export const TableView: Story = {
  args: { series: [THIS_MONTH, LAST_MONTH] },
  play: async ({ canvasElement }) => {
    const toggle = part(canvasElement, '.line-chart-toggle');
    toggle.click();
    await waitFor(() => expect(part(canvasElement, '.line-chart-table')).toBeVisible());
    await expect(part(canvasElement, '.line-chart-chart')).not.toBeVisible();
    await expect(toggle).toHaveTextContent('Show as chart');
  },
};

/** In a right-to-left region time runs right to left: the newest day is at the left. */
export const RightToLeft: Story = {
  args: { series: [THIS_MONTH, LAST_MONTH] },
  render: (args) => (
    <div dir="rtl">
      <Panel>
        <LineChart {...args} />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(part(canvasElement, '.line-chart-plot svg')).scale).toBe('-1 1');
    const labels = [...canvasElement.querySelectorAll('.line-chart-x-label')];
    const at = (text: string): DOMRect => {
      const label = labels.find((element) => element.textContent === text);
      if (!label) throw new Error(`No ${text}`);
      return label.getBoundingClientRect();
    };
    await expect(at('Oct 1').left).toBeGreaterThan(at('Oct 31').left);
    // The end labels stay inside the plot at either side.
    const plot = part(canvasElement, '.line-chart-plot').getBoundingClientRect();
    await expect(at('Oct 1').right).toBeLessThanOrEqual(plot.right + 0.5);
    await expect(at('Oct 31').left).toBeGreaterThanOrEqual(plot.left - 0.5);
  },
};

/**
 * A dir="auto" region of English inside a right-to-left page computes a left-to-right direction, which logical
 * insets alone would follow while the flip, set only by an explicit attribute, stays -1. The marks take their
 * direction from the same attribute as the flip, so the svg, the labels and the crosshair still agree.
 */
export const DirectionFromTheAttribute: Story = {
  tags: ['no-visual'],
  args: { series: [THIS_MONTH, LAST_MONTH] },
  render: (args) => (
    <div dir="rtl">
      <div dir="auto">
        <Panel>
          <LineChart {...args} />
        </Panel>
      </div>
    </div>
  ),
  play: async ({ canvasElement, userEvent }) => {
    await expect(getComputedStyle(part(canvasElement, '.line-chart-plot svg')).scale).toBe('-1 1');
    await expect(getComputedStyle(part(canvasElement, '.line-chart-plot')).direction).toBe('rtl');
    const plot = part(canvasElement, '.line-chart-plot').getBoundingClientRect();
    const newest = [...canvasElement.querySelectorAll('.line-chart-x-label')].find(
      (element) => element.textContent === 'Oct 31',
    );
    await expect(
      Math.abs((newest?.getBoundingClientRect().left ?? Number.NaN) - plot.left),
    ).toBeLessThanOrEqual(0.5);
    await userEvent.tab();
    const crosshair = part(canvasElement, '.line-chart-crosshair').getBoundingClientRect();
    await expect(Math.abs(crosshair.left + crosshair.width / 2 - plot.left)).toBeLessThanOrEqual(1);
    // The keys read the same attribute: Right is the older day.
    await userEvent.keyboard('{ArrowRight}');
    await expect(readoutX(canvasElement)).toBe('Oct 30');
  },
};

/** The keys, one by one, and the announcement where they stop. */
export const KeyboardMoves: Story = {
  tags: ['no-visual'],
  args: { series: [THIS_MONTH, LAST_MONTH] },
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    await expect(readoutX(canvasElement)).toBe('Oct 31');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(readoutX(canvasElement)).toBe('Oct 30');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(readoutX(canvasElement)).toBe('Oct 29');
    await userEvent.keyboard('{End}');
    await expect(readoutX(canvasElement)).toBe('Oct 31');
    await userEvent.keyboard('{PageUp}');
    await expect(readoutX(canvasElement)).toBe('Oct 24');
    await userEvent.keyboard('{Escape}');
    await expect(readoutX(canvasElement)).toBeNull();
    await expect(canvasElement.querySelector('.line-chart-crosshair')).not.toBeNull();
    await waitFor(() =>
      expect(liveParts(canvasElement)).toEqual(['Oct 24', 'This month $73.50', 'Last month $59.50']),
    );
  },
};

/** A mouse over the plot snaps to the nearest day; leaving clears it. */
export const PointerSnaps: Story = {
  tags: ['no-visual'],
  args: { series: [THIS_MONTH, LAST_MONTH] },
  play: async ({ canvasElement, userEvent }) => {
    const plot = part(canvasElement, '.line-chart-plot');
    const box = plot.getBoundingClientRect();
    await userEvent.pointer({
      target: plot,
      coords: { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 },
    });
    await expect(readoutX(canvasElement)).toBe('Oct 16');
    await expect(part(canvasElement, '.line-chart-readout')).toHaveAttribute('data-align', 'center');
    await userEvent.unhover(plot);
    await expect(readoutX(canvasElement)).toBeNull();
  },
};

/** Under dir="rtl" the keys follow the drawing: Right is the older day, Left the newer. */
export const RightToLeftKeys: Story = {
  tags: ['no-visual'],
  args: { series: [THIS_MONTH, LAST_MONTH] },
  render: RightToLeft.render,
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    await expect(readoutX(canvasElement)).toBe('Oct 31');
    await userEvent.keyboard('{ArrowRight}');
    await expect(readoutX(canvasElement)).toBe('Oct 30');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(readoutX(canvasElement)).toBe('Oct 31');
  },
};
