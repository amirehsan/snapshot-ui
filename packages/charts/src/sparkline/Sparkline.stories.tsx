import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Sparkline } from './Sparkline';

/** Thirty days of spending, oldest first: a rise with the dips a real month has. */
const SERIES = [
  42, 38, 45, 51, 47, 44, 52, 58, 55, 49, 53, 61, 64, 59, 57, 63, 70, 66, 62, 68, 74, 71, 69, 76, 82, 78, 75,
  81, 88, 92,
];

const meta = {
  title: 'Components/Sparkline',
  component: Sparkline,
  args: { data: SERIES },
  // Each sparkline on a Lifted panel, the card it sits in most.
  render: (args) => (
    <div
      style={{
        display: 'inline-block',
        padding: 24,
        borderRadius: 'var(--radius-surface)',
        backgroundColor: 'var(--color-lifted)',
      }}
    >
      <Sparkline {...args} />
    </div>
  ),
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The element with this class inside the canvas. */
const part = (canvasElement: HTMLElement, name: string): Element => {
  const element = canvasElement.querySelector(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** The centre of an element's box. */
const centreOf = (element: Element): { x: number; y: number } => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};

/** A rising month: a 2px ink line to a dot in a ring of the panel's color, in its 96 by 32 box. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const box = part(canvasElement, 'sparkline').getBoundingClientRect();
    await expect(box.width).toBe(96);
    await expect(box.height).toBe(32);
    // The newest value is the series' greatest: the dot is at the plot's top end, and inside the box.
    const plot = part(canvasElement, 'sparkline-plot').getBoundingClientRect();
    const dot = part(canvasElement, 'sparkline-end');
    await expect(Math.abs(centreOf(dot).x - plot.right)).toBeLessThanOrEqual(1);
    await expect(Math.abs(centreOf(dot).y - plot.top)).toBeLessThanOrEqual(1);
    const ring = dot.getBoundingClientRect();
    await expect(ring.right).toBeLessThanOrEqual(box.right + 0.5);
    await expect(ring.top).toBeGreaterThanOrEqual(box.top - 0.5);
  },
};

/** A 10% ink wash under the line, down to the bottom of the plot. */
export const WithArea: Story = {
  args: { hasArea: true },
};

/** Thirty equal values: a line across the middle. */
export const Flat: Story = {
  args: { data: Array.from({ length: 30 }, () => 64) },
  play: async ({ canvasElement }) => {
    const plot = part(canvasElement, 'sparkline-plot').getBoundingClientRect();
    const dot = part(canvasElement, 'sparkline-end');
    await expect(Math.abs(centreOf(dot).y - (plot.top + plot.height / 2))).toBeLessThanOrEqual(1);
  },
};

/** Stretched to 20rem by 3rem: the line keeps its 2px and the dot stays round. */
export const Wide: Story = {
  args: { style: { width: '20rem', height: '3rem' } },
  play: async ({ canvasElement }) => {
    const line = getComputedStyle(part(canvasElement, 'sparkline-line'));
    await expect(line.strokeWidth).toBe('2px');
    await expect(line.vectorEffect).toBe('non-scaling-stroke');
    const dot = part(canvasElement, 'sparkline-end').getBoundingClientRect();
    await expect(dot.width).toBe(12);
    await expect(dot.height).toBe(12);
  },
};

/** No end point: the line alone. */
export const WithoutEndPoint: Story = {
  args: { hasEndPoint: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.sparkline-end')).toBeNull();
  },
};

/** In a right-to-left region the newest value is at the left: the drawing is mirrored and the dot follows. */
export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <div
        style={{
          display: 'inline-block',
          padding: 24,
          borderRadius: 'var(--radius-surface)',
          backgroundColor: 'var(--color-lifted)',
        }}
      >
        <Sparkline {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const plot = part(canvasElement, 'sparkline-plot').getBoundingClientRect();
    const dot = part(canvasElement, 'sparkline-end');
    await expect(Math.abs(centreOf(dot).x - plot.left)).toBeLessThanOrEqual(1);
    // The svg is mirrored, so the line's first point, the oldest, is drawn at the right.
    await expect(getComputedStyle(part(canvasElement, 'sparkline-plot svg')).scale).toBe('-1 1');
  },
};
