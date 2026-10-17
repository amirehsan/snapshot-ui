import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria-components';
import { expect } from 'storybook/test';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  args: { label: 'Uploading invoice.pdf', value: 45 },
  // Each bar in a box as wide as the toast column, the tray's, or the canvas when it is narrower.
  render: (args) => (
    <div style={{ width: 'min(28rem, 100%)' }}>
      <ProgressBar {...args} />
    </div>
  ),
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The element with this class inside the canvas. */
const part = (canvasElement: HTMLElement, name: string): HTMLElement => {
  const element = canvasElement.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** A column of bars a peer step apart. */
const COLUMN = { display: 'grid', gap: 'var(--spacing-peer)', width: 'min(28rem, 100%)' };

/** The label and the value in Meter's head, over an 8px frame track with an ink fill to 45%. */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const track = part(canvasElement, 'progress-bar-track').getBoundingClientRect();
    const fill = part(canvasElement, 'progress-bar-fill').getBoundingClientRect();
    await expect(track.height).toBe(8);
    await expect(Math.abs(fill.width - track.width * 0.45)).toBeLessThanOrEqual(1);
    await expect(Math.abs(fill.left - track.left)).toBeLessThanOrEqual(0.5);
  },
};

/** Empty, under way and done; the value in the app's words; and work of unknown length. */
export const States: Story = {
  render: () => (
    <div style={COLUMN}>
      <ProgressBar label="Waiting: receipt.jpg" value={0} />
      <ProgressBar label="Uploading invoice.pdf" value={45} />
      <ProgressBar label="Uploaded statement.pdf" value={100} />
      <ProgressBar label="Uploading contract.pdf" value={30} valueLabel="1.2 of 4 MB" />
      <ProgressBar label="Reading receipt.jpg" isIndeterminate />
    </div>
  ),
};

/** Named by aria-label, with no head: the upload row's use, in a 20rem box. */
export const NoHead: Story = {
  render: () => (
    <div style={{ width: 'min(20rem, 100%)' }}>
      <ProgressBar aria-label="Uploading invoice.pdf" value={60} showValueLabel={false} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Uploading invoice.pdf' })).toBeInTheDocument();
    await expect(canvasElement.querySelector('.progress-bar-head')).toBeNull();
  },
};

/** A Persian page: the fill grows from the right, and the value is the app's words in Persian digits. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={COLUMN}>
        <ProgressBar label="در حال بارگذاری فاکتور" value={45} valueLabel="۴۵٪" />
        <ProgressBar label="در حال خواندن رسید" isIndeterminate />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const track = part(canvasElement, 'progress-bar-track').getBoundingClientRect();
    const fill = part(canvasElement, 'progress-bar-fill').getBoundingClientRect();
    await expect(Math.abs(fill.right - track.right)).toBeLessThanOrEqual(0.5);
  },
};

/** The role on the track, its four values, and a value past the range clamped to its end. */
export const Values: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={COLUMN}>
      <ProgressBar label="Uploading invoice.pdf" value={45} />
      <ProgressBar label="Uploading receipt.jpg" value={140} />
      <ProgressBar label="Uploading contract.pdf" minValue={10} maxValue={20} value={15} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [first, over, ranged] = canvas.getAllByRole('progressbar');
    if (!first || !over || !ranged) throw new Error('Three bars');
    await expect(first).toHaveClass('progress-bar-track');
    await expect(first).toHaveAccessibleName('Uploading invoice.pdf');
    await expect(first).toHaveAttribute('aria-valuemin', '0');
    await expect(first).toHaveAttribute('aria-valuemax', '100');
    await expect(first).toHaveAttribute('aria-valuenow', '45');
    await expect(first).toHaveAttribute('aria-valuetext', '45%');
    await expect(over).toHaveAttribute('aria-valuenow', '100');
    await expect(over).toHaveAttribute('aria-valuetext', '100%');
    const track = over.getBoundingClientRect();
    const fill = over.querySelector('.progress-bar-fill')?.getBoundingClientRect();
    await expect(Math.abs((fill?.width ?? 0) - track.width)).toBeLessThanOrEqual(0.5);
    await expect(ranged).toHaveAttribute('aria-valuenow', '15');
    await expect(ranged).toHaveAttribute('aria-valuetext', '50%');
  },
};

/** Work of unknown length: no value, a segment that slides over 1.6s and starts again, and rests off the track. */
export const Indeterminate: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={COLUMN}>
      <ProgressBar label="Reading receipt.jpg" isIndeterminate />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const track = canvas.getByRole('progressbar', { name: 'Reading receipt.jpg' });
    for (const name of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext'])
      await expect(track).not.toHaveAttribute(name);
    await expect(track).toHaveAttribute('data-indeterminate');
    const segment = getComputedStyle(part(canvasElement, 'progress-bar-fill'));
    await expect(segment.animationName).toBe('progress-bar-slide');
    await expect(segment.animationDuration).toBe('1.6s');
    await expect(segment.animationIterationCount).toBe('infinite');
    const fill = part(canvasElement, 'progress-bar-fill');
    const width = fill.getBoundingClientRect().width;
    await expect(Math.abs(width - track.getBoundingClientRect().width * 0.4)).toBeLessThanOrEqual(0.5);
    // With the slide cancelled, as Playwright's screenshots and a reader's `animation: none` cancel it, the
    // segment rests at the first frame, wholly before the track's start, so the track reads empty.
    const [slide] = fill.getAnimations();
    if (!slide) throw new Error('No slide');
    slide.cancel();
    try {
      const lane = track.getBoundingClientRect();
      const rest = fill.getBoundingClientRect();
      await expect(Math.abs(rest.right - lane.left)).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(rest.left - (lane.left - lane.width * 0.4))).toBeLessThanOrEqual(0.5);
    } finally {
      slide.play();
    }
  },
};
