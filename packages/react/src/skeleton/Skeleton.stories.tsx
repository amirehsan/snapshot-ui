import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Card, CardBody } from '../card';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every skeleton inside the canvas. */
const skeletons = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('.skeleton'),
];

/** A paragraph of body text and a row of small text, each at its step's own line height. */
const BODY = { margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--text-body--line-height)' };
const SMALL = { margin: 0, fontSize: 'var(--text-small)', lineHeight: 'var(--text-small--line-height)' };

/** The height of one line box of an element's text. */
const lineHeight = (element: Element): number => parseFloat(getComputedStyle(element).lineHeight);

/** A line, a 12rem line, a block a field tall and a 40px circle, stacked a part step apart. */
export const Shapes: Story = {
  tags: ['density'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-part)', justifyItems: 'start' }}>
      <Skeleton />
      <Skeleton width="12rem" />
      <Skeleton shape="block" />
      <Skeleton shape="circle" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [line, short, block, circle] = skeletons(canvasElement).map((each) => each.getBoundingClientRect());
    if (!line || !short || !block || !circle) throw new Error('Four skeletons');
    await expect(short.width).toBeLessThan(line.width);
    await expect(block.height).toBeGreaterThan(line.height);
    await expect(circle.width).toBe(40);
    await expect(circle.height).toBe(40);
  },
};

/**
 * Three lines at 100%, 90% and 60% that stand for a paragraph of body text, and one for a row of small text:
 * each line box holding a skeleton is the height of the line box of the text beside it.
 */
export const TextLines: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-peer)' }}>
      <p data-testid="body-text" style={BODY}>
        Groceries, rent and the electricity bill came out this week.
      </p>
      <p data-testid="body-skeleton" style={BODY}>
        <Skeleton />
        <Skeleton width="90%" />
        <Skeleton width="60%" />
      </p>
      <p data-testid="small-text" style={SMALL}>
        12 October, card ending 4421
      </p>
      <p data-testid="small-skeleton" style={SMALL}>
        <Skeleton width="70%" />
      </p>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const [text, skeleton] of [
      ['body-text', 'body-skeleton'],
      ['small-text', 'small-skeleton'],
    ] as const) {
      const holder = canvas.getByTestId(skeleton);
      const lines = holder.querySelectorAll('.skeleton').length;
      // Each skeleton takes one line box of its holder's text, so the holder is as tall as that many lines.
      await expect(
        Math.abs(holder.getBoundingClientRect().height - lines * lineHeight(canvas.getByTestId(text))),
      ).toBeLessThan(1);
    }
  },
};

/**
 * A card that is loading: a circle and two lines for its header, a block for its body and a line under it. The
 * line keeps the block clear of the card's bottom corners, where a field-sized block would have to take the
 * card's concentric corner.
 */
export const OnCard: Story = {
  render: () => (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-part)' }}>
          <Skeleton shape="circle" />
          <div style={{ flex: 1, display: 'grid', gap: '0.25rem' }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </div>
        </div>
        <Skeleton shape="block" height="6rem" />
        <Skeleton width="30%" />
      </CardBody>
    </Card>
  ),
};

/** Every skeleton is hidden from assistive technology and holds no text. */
export const Hidden: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-part)' }}>
      <Skeleton />
      <Skeleton shape="block" />
      <Skeleton shape="circle" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const all = skeletons(canvasElement);
    await expect(all).toHaveLength(3);
    for (const skeleton of all) {
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      await expect(skeleton.textContent).toBe('');
    }
  },
};

/** The pulse runs over 1.6s, forever. */
export const Pulse: Story = {
  tags: ['no-visual'],
  render: () => <Skeleton />,
  play: async ({ canvasElement }) => {
    const [skeleton] = skeletons(canvasElement);
    if (!skeleton) throw new Error('No skeleton');
    const style = getComputedStyle(skeleton);
    await expect(style.animationName).toBe('skeleton-pulse');
    await expect(style.animationDuration).toBe('1.6s');
    await expect(style.animationIterationCount).toBe('infinite');
  },
};
