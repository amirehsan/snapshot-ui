import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeftRight, ChartLine, Ellipsis, FileText, House, Target } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { Link } from '../link';
import { Sheet, SheetTrigger } from '../sheet';
import { tokenColor, washColor } from '../stories/paint';
import { DemoHeader } from '../stories/shell-fixture';
import { PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { BottomTabBar } from './BottomTabBar';
import { BottomTabBarItem } from './BottomTabBarItem';

/** The one element on the page that matches `selector`, wherever it was portaled. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/** The bar. */
const bar = (): HTMLElement => only('.tab-bar');

/** A bar item, a link or a button, by its name. */
const item = (name: string): HTMLElement => {
  const nav = bar();
  return within(nav).queryByRole('link', { name }) ?? within(nav).getByRole('button', { name });
};

/** A few paragraphs, so the bar sits over a page. */
function Page({ paragraphs = 4 }: { paragraphs?: number }): ReactElement {
  return (
    <div style={{ padding: 'var(--spacing-inset)', maxWidth: '40rem' }}>
      {Array.from({ length: paragraphs }, (_, index) => (
        <p key={index} style={{ margin: '0 0 16px' }}>
          {`Paragraph ${String(index + 1)}. Spending is on track this month, and twelve transactions are waiting for a category.`}
        </p>
      ))}
    </div>
  );
}

/** The More item, a button, as a story draws it. */
const MORE: ReactNode = <BottomTabBarItem icon={<Ellipsis />}>More</BottomTabBarItem>;

/** Home current, Transactions with 12 to review, Goals, and More. */
const FOUR: ReactNode = (
  <>
    <BottomTabBarItem href="#home" icon={<House />} isCurrent>
      Home
    </BottomTabBarItem>
    <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />} count={12} countLabel="to review">
      Transactions
    </BottomTabBarItem>
    <BottomTabBarItem href="#goals" icon={<Target />}>
      Goals
    </BottomTabBarItem>
    {MORE}
  </>
);

/** Tab until `target` has focus, failing after `limit` steps. */
async function tabTo(userEvent: { tab: () => Promise<void> }, target: HTMLElement, limit = 8): Promise<void> {
  for (let step = 0; step < limit && document.activeElement !== target; step += 1) await userEvent.tab();
  await expect(target).toHaveFocus();
}

const meta = {
  title: 'Components/BottomTabBar',
  component: BottomTabBar,
  args: { 'aria-label': 'Main', children: null },
  parameters: {
    layout: 'fullscreen',
    viewport: { options: VIEWPORT_OPTIONS },
  },
  globals: PHONE,
  tags: ['viewport-phone'],
} satisfies Meta<typeof BottomTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four tabs docked flush with the bottom: Home current as an ink pill, and a count chip on Transactions. */
export const Default: Story = {
  tags: ['viewport-phone', 'density'],
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>
    </>
  ),
  play: async () => {
    const box = bar().getBoundingClientRect();
    await expect(box.bottom).toBeCloseTo(window.innerHeight, 0);
    await expect(box.height).toBeCloseTo(64, 0);
    for (const tab of bar().querySelectorAll('.tab-bar-item')) {
      await expect(tab.getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
    }
    await expect(getComputedStyle(item('Home')).backgroundColor).toBe(tokenColor('--color-ink', bar()));
    const chip = item('Transactions, 12 to review').querySelector('.tab-bar-count');
    if (!chip) throw new Error('No count chip');
    await expect(chip).toHaveTextContent('12');
    const style = getComputedStyle(chip);
    await expect(style.backgroundColor).toBe(tokenColor('--color-ink', bar()));
    await expect(style.borderTopColor).toBe(tokenColor('--color-float', bar()));
  },
};

/** Five tabs, the most a bar holds, sharing the width equally. */
export const FiveItems: Story = {
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<House />} isCurrent>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />}>
          Transactions
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Target />}>
          Goals
        </BottomTabBarItem>
        <BottomTabBarItem href="#insights" icon={<ChartLine />}>
          Insights
        </BottomTabBarItem>
        {MORE}
      </BottomTabBar>
    </>
  ),
  play: async () => {
    const widths = [...bar().querySelectorAll('.tab-bar-item')].map(
      (tab) => tab.getBoundingClientRect().width,
    );
    await expect(widths).toHaveLength(5);
    const [first = 0] = widths;
    for (const width of widths) await expect(Math.abs(width - first)).toBeLessThanOrEqual(1);
  },
};

/** "Transactions" and "Documents" fit four tabs at 375px; at 320px "Transactions" ellipsizes and keeps its name. */
export const LongLabel: Story = {
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<House />} isCurrent>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />}>
          Transactions
        </BottomTabBarItem>
        <BottomTabBarItem href="#documents" icon={<FileText />}>
          Documents
        </BottomTabBarItem>
        {MORE}
      </BottomTabBar>
    </>
  ),
  play: async () => {
    const labels = [...bar().querySelectorAll('.tab-bar-item-label')];
    await expect(labels).toHaveLength(4);
    for (const label of labels) await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    // The bar spans the viewport, so the play narrows the bar itself to a 320px phone, and puts it back after:
    // the visual harness shoots the story once the play has run.
    const nav = bar();
    nav.style.insetInlineEnd = 'auto';
    nav.style.width = '320px';
    try {
      const label = item('Transactions').querySelector('.tab-bar-item-label');
      if (!label) throw new Error('No label');
      await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      await expect(item('Transactions')).toHaveAccessibleName('Transactions');
    } finally {
      nav.style.insetInlineEnd = '';
      nav.style.width = '';
    }
  },
};

/** A count on the current item inverts: a canvas chip with ink numerals and an ink border. */
export const CountOnCurrent: Story = {
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<House />}>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem
          href="#transactions"
          icon={<ArrowLeftRight />}
          isCurrent
          count={12}
          countLabel="to review"
        >
          Transactions
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Target />}>
          Goals
        </BottomTabBarItem>
        {MORE}
      </BottomTabBar>
    </>
  ),
  play: async () => {
    const chip = item('Transactions, 12 to review').querySelector('.tab-bar-count');
    if (!chip) throw new Error('No count chip');
    const style = getComputedStyle(chip);
    await expect(style.backgroundColor).toBe(tokenColor('--color-canvas', bar()));
    await expect(style.color).toBe(tokenColor('--color-ink', bar()));
    await expect(style.borderTopColor).toBe(tokenColor('--color-ink', bar()));
  },
};

/** The ring on the current item inverts to canvas and goes inside the ink pill. */
export const KeyboardFocusOnCurrent: Story = {
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>
    </>
  ),
  play: async ({ userEvent }) => {
    const target = item('Home');
    await tabTo(userEvent, target);
    const style = getComputedStyle(target);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor('--color-canvas', bar()));
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
  },
};

/** Right to left: the order mirrors, Home at the right edge, and the chip sits at the icon's left corner. */
export const RightToLeft: Story = {
  decorators: [
    (Story) => (
      <I18nProvider locale="ar-EG">
        <div dir="rtl">
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>
    </>
  ),
  play: async () => {
    const tabs = [...bar().querySelectorAll('.tab-bar-item')];
    const [first] = tabs;
    if (!first) throw new Error('No items');
    for (const tab of tabs.slice(1)) {
      await expect(tab.getBoundingClientRect().left).toBeLessThan(first.getBoundingClientRect().left);
    }
    await expect(document.documentElement.clientWidth - first.getBoundingClientRect().right).toBeLessThan(8);
    const counted = item('Transactions, 12 to review');
    const icon = counted.querySelector('.tab-bar-item-icon')?.getBoundingClientRect();
    const chip = counted.querySelector('.tab-bar-count')?.getBoundingClientRect();
    if (!icon || !chip) throw new Error('No icon or chip');
    await expect(chip.left + chip.width / 2).toBeLessThan(icon.left + icon.width / 2);
  },
};

/** In an AppShell the page keeps the bar's 64px clear under its end, so its last paragraph ends above the bar. */
export const InShell: Story = {
  render: () => (
    <AppShell header={<DemoHeader />} bottomBar={<BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>}>
      <Page paragraphs={40} />
    </AppShell>
  ),
  play: async () => {
    // No safe area in the harness, so the reserve is the bar's height alone.
    await expect(getComputedStyle(only('.app-shell-workspace')).paddingBottom).toBe('64px');
    window.scrollTo(0, document.documentElement.scrollHeight);
    const paragraphs = only('.app-shell-main').querySelectorAll('p');
    const last = paragraphs[paragraphs.length - 1];
    if (!last) throw new Error('No page');
    await waitFor(() =>
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(bar().getBoundingClientRect().top),
    );
  },
};

/** More opens a sheet of the other pages, which Escape closes, giving focus back to More. */
export const MoreOpensSheet: Story = {
  tags: ['no-visual', 'viewport-phone'],
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<House />} isCurrent>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />}>
          Transactions
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Target />}>
          Goals
        </BottomTabBarItem>
        <SheetTrigger>
          {MORE}
          <Sheet title="More" isTitleHidden>
            <nav aria-label="More pages">
              <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
                {['Accounts', 'Documents', 'Insights', 'Ask', 'Settings'].map((page) => (
                  <li key={page}>
                    <Link href={`#${page.toLowerCase()}`}>{page}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Sheet>
        </SheetTrigger>
      </BottomTabBar>
    </>
  ),
  play: async ({ userEvent }) => {
    const more = item('More');
    await userEvent.click(more);
    const dialog = await within(document.body).findByRole('dialog', { name: 'More' });
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    // React Aria moves focus in only once the sheet has risen.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true), { timeout: 5000 });
    await userEvent.keyboard('{Escape}');
    await waitFor(
      async () => {
        await expect(within(document.body).queryByRole('dialog')).toBeNull();
        await expect(more).toHaveFocus();
      },
      { timeout: 1500 },
    );
  },
};

/** Under a hover pointer an item takes the 5% ink wash and ink text; the current item keeps its ink fill. */
export const Hover: Story = {
  tags: ['no-visual', 'viewport-phone'],
  render: () => (
    <>
      <Page />
      <BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>
    </>
  ),
  play: async ({ userEvent }) => {
    const goals = item('Goals');
    await userEvent.hover(goals);
    await expect(getComputedStyle(goals).backgroundColor).toBe(washColor(bar()));
    await expect(getComputedStyle(goals).color).toBe(tokenColor('--color-ink', bar()));
    const home = item('Home');
    await userEvent.hover(home);
    await expect(getComputedStyle(home).backgroundColor).toBe(tokenColor('--color-ink', bar()));
  },
};
