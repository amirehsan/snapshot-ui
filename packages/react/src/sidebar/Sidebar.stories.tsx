import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeftRight, CalendarClock, House, Receipt, Target, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { Card, CardBody } from '../card';
import { firstLineOffset, lineCount, tokenColor } from '../stories/paint';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { Sidebar } from './Sidebar';
import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';

/** The one element on the page that matches `selector`, wherever it was portaled. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/** The rail copy, the one that is not in the drawer. */
const rail = (): HTMLElement => only('.sidebar:not(.sidebar-drawer)');

/** A rail item by its name. */
const item = (name: string): HTMLElement => within(rail()).getByRole('link', { name });

/** Resolves once the open drawer has slid in and every transition in it has finished. */
async function drawerAtRest(): Promise<HTMLElement> {
  const panel = await waitFor(async () => {
    const found = only('.drawer');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    panel.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return panel;
}

/** A short page beside the rail. */
const PAGE: ReactNode = (
  <div style={{ padding: 'var(--spacing-inset)' }}>
    <Card>
      <CardBody>
        <p style={{ margin: 0 }}>Spending is on track this month.</p>
      </CardBody>
    </Card>
  </div>
);

/** The shell every story renders in, with the demo header and a short page, the story as its rail. */
const inShell =
  ({
    collapsed = false,
    drawerOpen = false,
  }: { collapsed?: boolean; drawerOpen?: boolean } = {}): Decorator =>
  (Story) => (
    <AppShell
      sidebar={<Story />}
      header={<DemoHeader />}
      defaultSidebarCollapsed={collapsed}
      defaultDrawerOpen={drawerOpen}
    >
      {PAGE}
    </AppShell>
  );

/** A group with a long label that wraps onto a second line. */
const LONG_GROUPS: ReactNode = (
  <SidebarGroup label="Payments" isCurrent>
    <SidebarItem href="#home" icon={<House />} isCurrent>
      Home
    </SidebarItem>
    <SidebarItem href="#scheduled" icon={<CalendarClock />}>
      Scheduled and recurring payments
    </SidebarItem>
    <SidebarItem href="#receipts" icon={<Receipt />}>
      Receipts
    </SidebarItem>
  </SidebarGroup>
);

/** Counts on two items, one of them current. */
const COUNT_GROUPS: ReactNode = (
  <>
    <SidebarGroup label="Overview" isCurrent>
      <SidebarItem href="#home" icon={<House />} isCurrent count={3} countLabel="new">
        Home
      </SidebarItem>
      <SidebarItem href="#transactions" icon={<ArrowLeftRight />} count={12} countLabel="to review">
        Transactions
      </SidebarItem>
      <SidebarItem href="#goals" icon={<Target />}>
        Goals
      </SidebarItem>
    </SidebarGroup>
    <SidebarGroup label="Accounts">
      <SidebarItem href="#wallet" icon={<Wallet />}>
        Wallet
      </SidebarItem>
    </SidebarGroup>
  </>
);

/** Tab until `target` has focus, failing after `limit` steps. */
async function tabTo(
  userEvent: { tab: () => Promise<void> },
  target: HTMLElement,
  limit = 12,
): Promise<void> {
  for (let step = 0; step < limit && document.activeElement !== target; step += 1) await userEvent.tab();
  await expect(target).toHaveFocus();
}

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  args: { 'aria-label': 'Main', children: null },
  parameters: {
    layout: 'fullscreen',
    viewport: { options: VIEWPORT_OPTIONS },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The rail: the brand, the search, three groups with the current page in ink, and the account row. */
export const Expanded: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell()],
  render: () => <DemoNav />,
};

/** Icons only, the names as tooltips, the count a dot. */
export const Collapsed: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell({ collapsed: true })],
  render: () => <DemoNav />,
};

/** A long label wraps onto a second line, with the icon beside its first. */
export const LongLabels: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell()],
  render: () => <DemoNav>{LONG_GROUPS}</DemoNav>,
  play: async () => {
    const long = item('Scheduled and recurring payments');
    const label = long.querySelector('.sidebar-item-label');
    const icon = long.querySelector('.sidebar-item-icon');
    if (!label || !icon) throw new Error('No label or icon');
    await expect(lineCount(label)).toBe(2);
    await expect(Math.abs(firstLineOffset(icon, label))).toBeLessThanOrEqual(1);
  },
};

/** The same rail collapsed: every item a 40px square. */
export const LongLabelsCollapsed: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell({ collapsed: true })],
  render: () => <DemoNav>{LONG_GROUPS}</DemoNav>,
  play: async () => {
    for (const each of rail().querySelectorAll('.sidebar-item')) {
      const { width, height } = each.getBoundingClientRect();
      await expect(width).toBeCloseTo(40, 0);
      await expect(height).toBeCloseTo(40, 0);
    }
  },
};

/** Counts at the row's end: slate, and canvas on the current item. */
export const Counts: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell()],
  render: () => <DemoNav>{COUNT_GROUPS}</DemoNav>,
  play: async () => {
    const current = item('Home, 3 new').querySelector('.sidebar-item-count');
    const other = item('Transactions, 12 to review').querySelector('.sidebar-item-count');
    if (!current || !other) throw new Error('No counts');
    await expect(getComputedStyle(other).color).toBe(tokenColor('--color-slate', rail()));
    await expect(getComputedStyle(current).color).toBe(tokenColor('--color-canvas', rail()));
  },
};

/** Collapsed counts are 8px dots: ink, and canvas on the current item. */
export const CountsCollapsed: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell({ collapsed: true })],
  render: () => <DemoNav>{COUNT_GROUPS}</DemoNav>,
  play: async () => {
    const current = item('Home, 3 new').querySelector('.sidebar-item-count');
    const other = item('Transactions, 12 to review').querySelector('.sidebar-item-count');
    if (!current || !other) throw new Error('No counts');
    for (const dot of [current, other]) {
      await expect(dot.getBoundingClientRect().width).toBeCloseTo(8, 0);
      await expect(dot.getBoundingClientRect().height).toBeCloseTo(8, 0);
    }
    await expect(getComputedStyle(other).backgroundColor).toBe(tokenColor('--color-ink', rail()));
    await expect(getComputedStyle(current).backgroundColor).toBe(tokenColor('--color-canvas', rail()));
  },
};

/** The focus ring sits outside an item in the focus ring token. */
export const KeyboardFocus: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell()],
  render: () => <DemoNav />,
  play: async ({ userEvent }) => {
    const target = item('Transactions, 12 to review');
    await tabTo(userEvent, target);
    const style = getComputedStyle(target);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor('--focus-ring-color', rail()));
    await expect(parseFloat(style.outlineOffset)).toBeGreaterThan(0);
  },
};

/** The ring stays outside the current item's ink pill, where it reads against the float surface. */
export const KeyboardFocusOnCurrent: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  decorators: [inShell()],
  render: () => <DemoNav />,
  play: async ({ userEvent }) => {
    const target = item('Home');
    await tabTo(userEvent, target);
    const style = getComputedStyle(target);
    await expect(style.outlineStyle).toBe('solid');
    await expect(parseFloat(style.outlineOffset)).toBeGreaterThan(0);
    await expect(style.outlineColor).toBe(tokenColor('--color-ink', rail()));
  },
};

/** The rail as a drawer on a phone, with the current item focused and a close button in the head. */
export const Drawer: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  decorators: [inShell({ drawerOpen: true })],
  parameters: { docs: { story: { inline: false, height: '640px' } } },
  render: () => <DemoNav />,
  play: async () => {
    await drawerAtRest();
    const dialog = within(document.body).getByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(within(dialog).getByRole('link', { name: 'Home' })).toHaveFocus());
  },
};

/** Under a right-to-left locale the drawer comes from the right edge. */
export const DrawerRightToLeft: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  // The first decorator is the innermost: the shell inside the locale and the direction.
  decorators: [
    inShell({ drawerOpen: true }),
    (Story) => (
      <I18nProvider locale="ar-EG">
        <div dir="rtl">
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
  parameters: { docs: { story: { inline: false, height: '640px' } } },
  render: () => <DemoNav />,
  play: async () => {
    const panel = await drawerAtRest();
    await expect(panel).toHaveAttribute('data-side', 'right');
    await expect(document.documentElement.clientWidth - panel.getBoundingClientRect().right).toBeCloseTo(
      16,
      0,
    );
  },
};
