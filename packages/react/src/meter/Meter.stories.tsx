import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Card, CardBody } from '../card';
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
