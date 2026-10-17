import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactElement } from 'react';
import { expect, fn } from 'storybook/test';
import { Card } from '../card';
import type { UploadItem } from './counts';
import { UploadList, type UploadListProps } from './UploadList';

/** The six statuses, one row each, as the docs page's first example shows them. */
const STATUSES: UploadItem[] = [
  { id: 1, name: 'receipt-march.pdf', status: 'waiting' },
  { id: 2, name: 'invoice-0142.pdf', status: 'uploading', progress: 0.45, progressLabel: '1.8 of 4 MB' },
  { id: 3, name: 'statement-september.pdf', status: 'reading' },
  { id: 4, name: 'lease-agreement.pdf', status: 'saved', href: '#lease' },
  {
    id: 5,
    name: 'corner-mart.jpg',
    status: 'review',
    reason: 'The total could not be read',
    href: '#corner-mart',
  },
  { id: 6, name: 'holiday-video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
];

const meta = {
  title: 'Components/UploadList',
  component: UploadList,
  args: {
    'aria-label': 'Uploads',
    items: STATUSES,
    onRetry: fn(),
    onRemove: fn(),
    onCancel: fn(),
  },
  parameters: { layout: 'padded' },
  // A card as wide as the tray, or the canvas when it is narrower; the rows run to its sides with their own inset.
  render: (args) => <InCard {...args} />,
} satisfies Meta<UploadListProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function InCard({
  width = 'min(28rem, 100%)',
  ...props
}: UploadListProps & { width?: string }): ReactElement {
  return (
    <Card
      style={
        {
          width,
          paddingInline: 0,
          paddingBlock: 'var(--spacing-part)',
          // The card names its corner, so the rows' buttons and bars are concentric with it.
          '--holder-radius': 'var(--radius-stadium)',
          '--holder-border': '1px',
          '--holder-pad': '0px',
        } as CSSProperties
      }
    >
      <UploadList {...props} />
    </Card>
  );
}

/** The one element with this class inside `scope`. */
function part(scope: ParentNode, name: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
}

/**
 * Waiting, uploading at 45% with the app's "1.8 of 4 MB", reading, saved and linked, needs review with its
 * reason, and failed with its reason, Retry and Remove.
 */
export const Statuses: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('.upload-row')];
    await expect(rows).toHaveLength(6);
    for (const row of rows) {
      // At least the target tall, the icon 24px wide.
      await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(56 - 0.5);
      await expect(part(row, 'upload-row-icon').getBoundingClientRect().width).toBeCloseTo(24, 0);
    }
    const buttons = [...canvasElement.querySelectorAll('.upload-row-actions .icon-button')];
    for (const button of buttons) {
      const { width, height } = button.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(40);
      await expect(height).toBeGreaterThanOrEqual(40);
    }
    // Concentric with the card the story names as holder, in Rounded, only in its corner regions: the first and
    // last rows' trailing buttons take its 40px less its 1px edge and their real 8px gap, 31px. Every other
    // button is far from a corner and keeps its pill.
    const corners = [rows[0], rows[5]].map((row) => row?.querySelector('.upload-row-actions > :last-child'));
    for (const button of buttons) {
      const radius = getComputedStyle(button).borderTopLeftRadius;
      if (corners.includes(button)) await expect(radius).toBe('31px');
      else await expect(Number.parseFloat(radius)).toBeGreaterThan(100);
    }
    // The progress at the status line's end, the bar a part step under it, spanning the text column.
    const uploading = rows[1];
    if (!uploading) throw new Error('No uploading row');
    const text = part(uploading, 'upload-row-text').getBoundingClientRect();
    const progress = part(uploading, 'upload-row-progress').getBoundingClientRect();
    await expect(progress.right).toBeCloseTo(text.right, 0);
    const bar = part(uploading, 'upload-row-bar').getBoundingClientRect();
    await expect(bar.width).toBeCloseTo(text.width, 0);
  },
};

/** "Receipt-2026-10-14-corner-mart-and-the-long-weekend.pdf" in a 22rem card: the stem ellipsizes, ".pdf" stays. */
export const LongNames: Story = {
  args: {
    items: [
      {
        id: 1,
        name: 'Receipt-2026-10-14-corner-mart-and-the-long-weekend.pdf',
        status: 'uploading',
        progress: 0.7,
      },
      {
        id: 2,
        name: 'Receipt-2026-10-14-corner-mart-and-the-long-weekend.pdf',
        status: 'saved',
        href: '#receipt',
      },
      {
        id: 3,
        name: 'Scan-of-the-whole-month-of-September-in-one-file.jpeg',
        status: 'failed',
        reason: 'Over 10 MB: split the scan into one file per receipt',
      },
    ],
  },
  render: (args) => <InCard {...args} width="min(22rem, 100%)" />,
  play: async ({ canvasElement }) => {
    for (const name of canvasElement.querySelectorAll<HTMLElement>('.upload-row-name')) {
      const stem = part(name, 'upload-row-stem');
      const ext = part(name, 'upload-row-ext');
      // The stem is cut, the extension whole and in view at its end.
      await expect(stem.scrollWidth).toBeGreaterThan(stem.clientWidth);
      await expect(ext.getBoundingClientRect().right).toBeLessThanOrEqual(
        name.getBoundingClientRect().right + 0.5,
      );
      await expect(ext.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        stem.getBoundingClientRect().right - 0.5,
      );
    }
    // The reason wraps rather than widen the card.
    const card = part(canvasElement, 'card').getBoundingClientRect();
    await expect(part(canvasElement, 'upload-row-reason').getBoundingClientRect().right).toBeLessThanOrEqual(
      card.right,
    );
  },
};
