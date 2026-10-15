import type { Meta, StoryObj } from '@storybook/react-vite';
import { Receipt, SearchX } from 'lucide-react';
import { I18nProvider } from 'react-aria-components';
import { expect } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: { title: 'No transactions this month' },
  // Each in a box 40rem wide at most, the width of a list page's card.
  decorators: [
    (Story) => (
      <div style={{ width: 'min(40rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The element with this class inside the canvas. */
const part = (canvasElement: HTMLElement, name: string): HTMLElement => {
  const element = canvasElement.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** The x of the middle of an element's box. */
const centreOf = (element: Element): number => {
  const { left, width } = element.getBoundingClientRect();
  return left + width / 2;
};

/** A slate receipt, the title in ink, a slate line that says what to do, and one secondary action under them. */
export const Default: Story = {
  tags: ['density'],
  args: {
    icon: <Receipt />,
    title: 'No transactions this month',
    description: 'Transactions you add or import show here.',
    action: <Button variant="secondary">Import transactions</Button>,
  },
};

/** The title alone: what is missing, and nothing to do about it. */
export const TitleOnly: Story = {
  args: { title: 'Nothing to review' },
};

/** A card's empty body: the card's title is the level 2 heading, so the empty state's is level 3. */
export const InCard: Story = {
  render: () => (
    <Card as="section" aria-labelledby="recent-activity-title">
      <CardHeader>
        <CardTitle id="recent-activity-title">Recent activity</CardTitle>
      </CardHeader>
      <CardBody>
        <EmptyState
          headingLevel={3}
          icon={<SearchX />}
          title="No matches"
          description="Try fewer filters."
          action={<Button variant="tertiary">Clear filters</Button>}
        />
      </CardBody>
    </Card>
  ),
};

/** The same column on a Persian page: centered, so nothing moves but the words. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <EmptyState
          icon={<Receipt />}
          title="تراکنشی در این ماه نیست"
          description="تراکنش‌هایی که اضافه یا وارد می‌کنید اینجا نشان داده می‌شوند."
          action={<Button variant="secondary">وارد کردن تراکنش‌ها</Button>}
        />
      </div>
    </I18nProvider>
  ),
};

/** The title is an h3 by default and an h2 or h4 at headingLevel 2 or 4, with one look at every level. */
export const HeadingLevels: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <EmptyState headingLevel={2} title="Level two" />
      <EmptyState title="Level three" />
      <EmptyState headingLevel={4} title="Level four" />
    </div>
  ),
  play: async ({ canvas }) => {
    const tags = [2, 3, 4].map((level) => canvas.getByRole('heading', { level }));
    await expect(tags.map((heading) => heading.tagName)).toEqual(['H2', 'H3', 'H4']);
    const sizes = tags.map((heading) => getComputedStyle(heading).fontSize);
    await expect(new Set(sizes).size).toBe(1);
    for (const heading of tags) await expect(getComputedStyle(heading).fontWeight).toBe('700');
  },
};

/** The icon is drawn 24px in slate and hidden from assistive technology; the title is centered under it. */
export const IconHidden: Story = {
  tags: ['no-visual'],
  args: {
    icon: <Receipt />,
    description: 'Transactions you add or import show here.',
  },
  play: async ({ canvas, canvasElement }) => {
    const icon = part(canvasElement, 'empty-state-icon');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    const svg = icon.querySelector('svg');
    if (!svg) throw new Error('No icon drawn');
    const box = svg.getBoundingClientRect();
    await expect(box.width).toBe(24);
    await expect(box.height).toBe(24);
    const title = part(canvasElement, 'empty-state-title');
    await expect(Math.abs(centreOf(icon) - centreOf(title))).toBeLessThan(1);
    // The icon says nothing: the only image or text a reader meets is the title and the line.
    await expect(canvas.queryByRole('img')).toBeNull();
    await expect(canvas.getByRole('heading', { level: 3 })).toHaveAccessibleName(
      'No transactions this month',
    );
  },
};
