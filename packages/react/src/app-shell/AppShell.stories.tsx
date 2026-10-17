import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleUser } from 'lucide-react';
import type { ReactElement } from 'react';
import { I18nProvider, RouterProvider } from 'react-aria-components';
import { expect, fn, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { DataTable } from '../data-table';
import { SidebarGroup, SidebarItem } from '../sidebar';
import { StatTile } from '../stat-tile';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import { COLUMNS, groupOf, keyOf, manyTransactions } from '../stories/transactions';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { AppShell, type AppShellProps } from './AppShell';

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

/** The workspace, which the shell offsets beside the rail. */
const workspace = (): HTMLElement => only('.app-shell-workspace');

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

/** A short page: a card with a line of text and a button. */
function Page(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 24, padding: 'var(--spacing-inset)' }}>
      <Card>
        <CardHeader>
          <CardTitle>This month</CardTitle>
        </CardHeader>
        <CardBody>
          <p style={{ margin: 0 }}>Spending is on track. Twelve transactions are waiting for a category.</p>
        </CardBody>
      </Card>
      <div>
        <Button>Review transactions</Button>
      </div>
    </div>
  );
}

/** A long working page: a row of stat tiles over a 36-row DataTable, the content the rail's motion moves. */
function LongPage(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 24, padding: 'var(--spacing-inset)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: 24 }}>
        <StatTile
          label="Spending"
          value="$1,284.50"
          change={{ direction: 'up', label: 'Up 12% from last month' }}
          caption="Across all accounts"
        />
        <StatTile
          label="Income"
          value="$5,420.00"
          change={{ direction: 'up', label: 'Up $420 from last month', tone: 'gain' }}
          caption="Paid into checking"
        />
        <StatTile
          label="Savings"
          value="$12,000.00"
          change={{ direction: 'flat', label: 'No change in 3 weeks' }}
          caption="Emergency fund"
        />
      </div>
      <DataTable
        aria-label="Transactions"
        items={manyTransactions(36)}
        columns={COLUMNS}
        getKey={keyOf}
        getGroup={groupOf}
      />
    </div>
  );
}

/** The shell with the demo rail, the demo header and the page. */
function Shell(props: Partial<AppShellProps>): ReactElement {
  return (
    <AppShell sidebar={<DemoNav />} header={<DemoHeader />} {...props}>
      <Page />
    </AppShell>
  );
}

const meta = {
  title: 'Components/AppShell',
  component: AppShell,
  // Every story renders its own shell, so the props table is the only use of these.
  args: { children: null },
  parameters: {
    layout: 'fullscreen',
    viewport: { options: VIEWPORT_OPTIONS },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The rail, 288px wide and floating 16px inside the top, the start and the bottom, and the page beside it. */
export const Desktop: Story = {
  tags: ['viewport-desktop', 'density'],
  globals: DESKTOP,
  render: () => <Shell />,
  play: async () => {
    const box = rail().getBoundingClientRect();
    await expect(box.width).toBeCloseTo(288, 0);
    await expect(box.left).toBeCloseTo(16, 0);
    await expect(box.top).toBeCloseTo(16, 0);
    await expect(window.innerHeight - box.bottom).toBeCloseTo(16, 0);
    await expect(workspace().getBoundingClientRect().left).toBeCloseTo(320, 0);
  },
};

/** Collapsed to a 72px column of icons, the page 104px in, the count a dot on its item. */
export const Collapsed: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  render: () => <Shell defaultSidebarCollapsed />,
  play: async () => {
    await expect(rail().getBoundingClientRect().width).toBeCloseTo(72, 0);
    await expect(workspace().getBoundingClientRect().left).toBeCloseTo(104, 0);
    for (const item of rail().querySelectorAll('.sidebar-item')) {
      const { width, height } = item.getBoundingClientRect();
      await expect(width).toBeCloseTo(40, 0);
      await expect(height).toBeCloseTo(40, 0);
    }
    const dot = rail().querySelector('.sidebar-item-count')?.getBoundingClientRect();
    await expect(dot?.width).toBeCloseTo(8, 0);
    await expect(dot?.height).toBeCloseTo(8, 0);
  },
};

/** On a phone the rail is gone and the header's menu button opens it as a drawer. */
export const Phone: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  render: () => <Shell />,
  play: async ({ canvas }) => {
    await expect(getComputedStyle(rail()).display).toBe('none');
    await expect(canvas.getByRole('button', { name: 'Open the menu' })).toBeVisible();
    const margin = getComputedStyle(workspace());
    await expect(margin.marginInlineStart).toBe('0px');
    await expect(margin.marginInlineEnd).toBe('0px');
  },
};

/**
 * The drawer open on a phone while the rail is collapsed: the drawer shows every label whatever the collapsed
 * state says, and focus starts on the current item.
 */
export const PhoneDrawerOpen: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  parameters: { docs: { story: { inline: false, height: '640px' } } },
  render: () => <Shell defaultDrawerOpen defaultSidebarCollapsed />,
  play: async () => {
    await drawerAtRest();
    const dialog = within(document.body).getByRole('dialog', { name: 'Menu' });
    await expect(document.body).toContainElement(dialog);
    const current = within(dialog).getByRole('link', { name: 'Home' });
    await waitFor(() => expect(current).toHaveFocus());
    // The panel is 320px, and the item is that less its 1px edges and the nav's two 12px gutters.
    await expect(current.getBoundingClientRect().width).toBeCloseTo(294, 0);
    await expect(current.querySelector('.sidebar-item-label')?.getBoundingClientRect().width).toBeGreaterThan(
      1,
    );
    const close = within(dialog).getByRole('button', { name: 'Close menu' });
    await expect(close.parentElement).toHaveClass('sidebar-head');
  },
};

/** Under a right-to-left locale the rail floats on the right and the page is offset from the right. */
export const RightToLeft: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  render: () => (
    <I18nProvider locale="ar-EG">
      <div dir="rtl">
        <Shell />
      </div>
    </I18nProvider>
  ),
  play: async () => {
    const box = rail().getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    await expect(width - box.right).toBeCloseTo(16, 0);
    await expect(width - workspace().getBoundingClientRect().right).toBeCloseTo(320, 0);
    // The collapse button straddles the rail's left edge, its end edge in right to left. Its inset is measured
    // from the padding box, so its middle is on the inner side of the 1px border.
    const button = only('.sidebar-collapse').getBoundingClientRect();
    await expect(Math.abs(button.left + button.width / 2 - box.left)).toBeLessThanOrEqual(1);
  },
};

/** The collapse button folds the rail to icons and back. */
export const CollapseToggle: Story = {
  tags: ['no-visual', 'viewport-desktop'],
  globals: DESKTOP,
  render: () => <Shell />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Collapse the menu' });
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(only('.app-shell')).toHaveAttribute('data-sidebar', 'collapsed');
    await waitFor(() => expect(rail().getBoundingClientRect().width).toBeCloseTo(72, 0));
    await expect(button).toHaveAccessibleName('Expand the menu');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(only('.app-shell')).not.toHaveAttribute('data-sidebar');
    await waitFor(() => expect(rail().getBoundingClientRect().width).toBeCloseTo(288, 0));
    await expect(button).toHaveAccessibleName('Collapse the menu');
  },
};

/** The drawer from the keyboard: focus starts on the current item, stays inside, and Escape gives it back. */
export const DrawerKeyboard: Story = {
  tags: ['no-visual', 'viewport-phone'],
  globals: PHONE,
  render: () => <Shell />,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Open the menu' });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(within(dialog).getByRole('link', { name: 'Home' })).toHaveFocus());
    for (let step = 0; step < 12; step += 1) {
      await userEvent.tab();
      await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await userEvent.keyboard('{Escape}');
    // The panel slides out in 180ms and React Aria gives focus back in the next animation frame.
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** The router the drawer story navigates through, which records each press and leaves the frame where it is. */
const navigate = fn();

/**
 * Pressing an item in the drawer, the page already open included, closes it. The press goes through a
 * `RouterProvider`, as an app's would, so the story frame never leaves its page.
 */
export const DrawerClosesOnItemPress: Story = {
  tags: ['no-visual', 'viewport-phone'],
  globals: PHONE,
  render: () => (
    <RouterProvider navigate={navigate}>
      <Shell />
    </RouterProvider>
  ),
  play: async ({ canvas, userEvent }) => {
    navigate.mockClear();
    const trigger = canvas.getByRole('button', { name: 'Open the menu' });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(dialog).getByRole('link', { name: 'Home' }));
    await expect(navigate).toHaveBeenCalledWith('#home', undefined);
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** A collapsed item's name, its count and its words, on hover. */
export const CollapsedTooltip: Story = {
  tags: ['no-visual', 'viewport-desktop'],
  globals: DESKTOP,
  render: () => <Shell defaultSidebarCollapsed />,
  play: async ({ userEvent }) => {
    const item = within(rail()).getByRole('link', { name: 'Transactions, 12 to review' });
    await userEvent.hover(item);
    const tip = await waitFor(() => within(document.body).getByRole('tooltip'), { timeout: 1000 });
    await expect(tip).toHaveTextContent('Transactions');
    await expect(tip).toHaveTextContent('12 to review');
    await userEvent.unhover(item);
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toBeNull());
  },
};

/** Thirty items with the current one last: the rail scrolls it into view as it mounts. */
export const RevealsCurrent: Story = {
  tags: ['no-visual', 'viewport-desktop'],
  globals: DESKTOP,
  render: () => (
    <AppShell
      header={<DemoHeader />}
      sidebar={
        <DemoNav>
          <SidebarGroup label="Accounts" isCurrent>
            {Array.from({ length: 30 }, (_, index) => (
              <SidebarItem
                key={index}
                href={`#account-${String(index + 1)}`}
                icon={<CircleUser />}
                isCurrent={index === 29}
              >
                {`Account ${String(index + 1)}`}
              </SidebarItem>
            ))}
          </SidebarGroup>
        </DemoNav>
      }
    >
      <Page />
    </AppShell>
  ),
  play: async () => {
    const nav = only('.sidebar:not(.sidebar-drawer) .sidebar-nav');
    await expect(nav.scrollTop).toBeGreaterThan(0);
    const item = within(nav).getByRole('link', { name: 'Account 30' }).getBoundingClientRect();
    const box = nav.getBoundingClientRect();
    await expect(item.top).toBeGreaterThanOrEqual(box.top);
    await expect(item.bottom).toBeLessThanOrEqual(box.bottom);
  },
};

/**
 * The collapse and the expand over a working page: stat tiles and a long DataTable. The icons hold their place
 * while the rail's edge moves, and no label wraps on the way.
 */
export const CollapseMotion: Story = {
  tags: ['no-visual', 'viewport-desktop'],
  globals: DESKTOP,
  render: () => (
    <AppShell sidebar={<DemoNav />} header={<DemoHeader title="Transactions" />}>
      <LongPage />
    </AppShell>
  ),
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Collapse the menu' });
    const icons = (): number[] =>
      [...rail().querySelectorAll('.sidebar-item-icon, .sidebar-search-icon, .sidebar-brand-mark')].map(
        (icon) => icon.getBoundingClientRect().left,
      );
    /** The top of every icon, group label and footer part: collapsing changes the rail's width and nothing else. */
    const tops = (): number[] =>
      [
        ...rail().querySelectorAll(
          '.sidebar-brand-mark, .sidebar-search-icon, .sidebar-group-label, .sidebar-item-icon, .sidebar-footer > *',
        ),
      ].map((part) => part.getBoundingClientRect().top);
    /** The largest move of any part's top from where it rests expanded. */
    const climb = (): number =>
      Math.max(...tops().map((top, index) => Math.abs(top - (atRest.tops[index] ?? Number.NaN))));
    /** Every row of the rail one line high: no label wraps onto a second line for a frame. */
    const rows = (): number[] =>
      [
        ...rail().querySelectorAll('.sidebar-item, .sidebar-search, .sidebar-group-label, .sidebar-brand'),
      ].map((row) => Math.round(row.getBoundingClientRect().height));
    const atRest = { icons: icons(), rows: rows(), tops: tops() };
    for (const [name, width] of [
      ['Expand the menu', 72],
      ['Collapse the menu', 288],
    ] as const) {
      await userEvent.click(button);
      // Hold every transition the press started and step it, as a frame strip would, through its end.
      const moving = document.getAnimations();
      await expect(moving.length).toBeGreaterThan(0);
      const end = Math.max(...moving.map((each) => Number(each.effect?.getComputedTiming().endTime ?? 0)));
      for (const each of moving) each.pause();
      for (let time = 0; time <= end; time += 16) {
        for (const each of moving) each.currentTime = time;
        // Each icon keeps its place: it moves no more than the 3px the padding settles it by, and never toward the
        // middle of the rail.
        const drift = icons().map((left, index) => Math.abs(left - (atRest.icons[index] ?? 0)));
        await expect(Math.max(...drift)).toBeLessThanOrEqual(3.5);
        await expect(rows()).toEqual(atRest.rows);
        // And it stays at its height: every icon's top is where it rests, in each frame.
        await expect(climb()).toBeLessThanOrEqual(0.5);
      }
      for (const each of moving) each.finish();
      await waitFor(() => expect(rail().getBoundingClientRect().width).toBeCloseTo(width, 0));
      // Settled, collapsed or expanded, every part sits at the same height.
      await expect(climb()).toBeLessThanOrEqual(0.5);
      await expect(button).toHaveAccessibleName(name);
      // The rail and the page beside it travel on one curve.
      await expect(getComputedStyle(rail()).transitionTimingFunction).toBe('cubic-bezier(0.2, 0, 0, 1)');
      await expect(getComputedStyle(workspace()).transitionTimingFunction).toBe('cubic-bezier(0.2, 0, 0, 1)');
    }
  },
};
