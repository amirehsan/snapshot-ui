import type { Meta, StoryObj } from '@storybook/react-vite';
import axe from 'axe-core';
import type { ReactElement, ReactNode } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { DialogTrigger } from '../dialog';
import { Link } from '../link';
import { firstLineOffset, tokenColor } from '../stories/paint';
import { Switch } from '../switch';
import { Text } from '../typography';
import { Drawer, type DrawerProps } from './Drawer';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/**
 * Resolves once the open panel has entered and every transition on it and inside it has finished, so a play
 * reads its box at rest and not part way in from its edge.
 */
async function atRest(): Promise<HTMLElement> {
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

/** The viewport's width without a scrollbar, which is what the fixed scrim spans. */
const viewportWidth = (): number => document.documentElement.clientWidth;

/** A list of links, the way a navigation drawer holds its pages. */
function NavList({ label, pages }: { label: string; pages: string[] }): ReactElement {
  return (
    <nav aria-label={label}>
      <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
        {pages.map((page) => (
          <li key={page}>
            <Link href={`#${page.toLowerCase().replaceAll(' ', '-')}`}>{page}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const PAGES = ['Overview', 'Projects', 'Members', 'Billing', 'Reports', 'Settings'];

/** Forty pages, more than any viewport the suite shoots holds. */
const MANY_PAGES = Array.from({ length: 40 }, (_, index) => `Project ${String(index + 1)}`);

/** The signed-in person, the row a navigation drawer pins under its list. */
const ACCOUNT: ReactNode = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        flex: 'none',
        placeItems: 'center',
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-bone)',
        fontWeight: 500,
      }}
    >
      AL
    </span>
    <div style={{ minWidth: 0 }}>
      <Text as="span" style={{ display: 'block' }}>
        Ada Lovelace
      </Text>
      <Text as="span" size="small" tone="muted" style={{ display: 'block' }}>
        ada@northwind.example
      </Text>
    </div>
  </div>
);

/** A trigger and its drawer, open on the first render. */
function Opened({ trigger = 'Open the menu', ...args }: DrawerProps & { trigger?: string }): ReactElement {
  return (
    <DialogTrigger defaultOpen>
      <Button variant="secondary">{trigger}</Button>
      <Drawer {...args} />
    </DialogTrigger>
  );
}

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  args: {
    title: 'Menu',
    children: <NavList label="Workspace" pages={PAGES} />,
    footer: ACCOUNT,
  },
  parameters: {
    // Every story opens a modal, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '480px' } },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A navigation drawer from the start edge: the title and the close button, a list of six pages and an account
 * row pinned under it. The panel floats 16px inside the left edge, the top and the bottom, its full height.
 */
export const Start: Story = {
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-side', 'left');
    const box = panel.getBoundingClientRect();
    await expect(box.left).toBeCloseTo(16, 1);
    await expect(box.top).toBeCloseTo(16, 1);
    await expect(box.bottom).toBeCloseTo(window.innerHeight - 16, 1);
    await expect(box.width).toBeCloseTo(Math.min(320, viewportWidth() - 32), 1);
    await expect(within(document.body).getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    // The title's first line and the X are on one line.
    const close = within(document.body).getByRole('button', { name: 'Close' });
    await expect(Math.abs(firstLineOffset(close, only('.drawer-title')))).toBeLessThanOrEqual(1);
  },
};

/** A filter form from the end edge, with its action pinned in the footer. */
export const End: Story = {
  args: {
    placement: 'end',
    title: 'Filters',
    children: (
      <div style={{ display: 'grid', gap: 24 }}>
        <CheckboxGroup label="Status" defaultValue={['active']}>
          <Checkbox value="active">Active</Checkbox>
          <Checkbox value="paused">Paused</Checkbox>
          <Checkbox value="archived">Archived</Checkbox>
        </CheckboxGroup>
        <Switch defaultSelected>Only projects I own</Switch>
      </div>
    ),
    footer: (
      <Button slot="close" style={{ width: '100%' }}>
        Show 12 projects
      </Button>
    ),
  },
  render: (args) => <Opened {...args} trigger="Filter the projects" />,
  play: async () => {
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-side', 'right');
    const box = panel.getBoundingClientRect();
    await expect(viewportWidth() - box.right).toBeCloseTo(16, 1);
    await expect(box.top).toBeCloseTo(16, 1);
    await expect(box.bottom).toBeCloseTo(window.innerHeight - 16, 1);
  },
};

/**
 * A list taller than the viewport scrolls inside the panel, and the header and the footer stay. Nothing
 * scrolls sideways, at 375px as at 1280.
 */
export const LongList: Story = {
  args: {
    children: <NavList label="Projects" pages={MANY_PAGES} />,
  },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    const body = only('.drawer-body');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const footer = only('.drawer-footer').getBoundingClientRect();
    await expect(footer.top).toBeGreaterThanOrEqual(0);
    await expect(footer.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(panel.getBoundingClientRect().bottom).toBeCloseTo(window.innerHeight - 16, 1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(viewportWidth() - 16 + 0.5);
  },
};

/**
 * The navigation list names itself, so the title is kept for assistive technology only, and the header is
 * just the close button, at the end.
 */
export const HiddenTitle: Story = {
  args: { isTitleHidden: true },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    await expect(within(document.body).getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    const close = within(document.body).getByRole('button', { name: 'Close' }).getBoundingClientRect();
    const edge = panel.getBoundingClientRect();
    await expect(edge.right - close.right).toBeGreaterThanOrEqual(0);
    await expect(edge.right - close.right).toBeLessThanOrEqual(24);
    // The hidden title takes no room: the header is as tall as the button and the padding over it.
    const header = only('.drawer-header').getBoundingClientRect();
    await expect(header.height).toBeCloseTo(close.height + 24, 1);
  },
};

/**
 * A drawer opened from a trigger in a dark card is dark while the page is light, and the scrim keeps the
 * page's opacity. The play opens it from the keyboard, so the trigger holds focus when the drawer opens:
 * that is the origin the panel copies its theme from.
 */
export const InDarkScope: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      data-testid="dark-scope"
      style={{ padding: 24, borderRadius: 'var(--radius-stadium)', background: 'var(--color-canvas)' }}
    >
      <Card>
        <CardBody>
          <p>A card in a dark block.</p>
          <DialogTrigger>
            <Button variant="secondary">Open the menu</Button>
            <Drawer {...args} />
          </DialogTrigger>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Open the menu' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-theme', 'dark');
    await expect(only('.drawer-overlay')).not.toHaveAttribute('data-theme');
    const scope = canvas.getByTestId('dark-scope');
    await expect(getComputedStyle(panel).backgroundColor).toBe(tokenColor('--color-float', scope));
  },
};

/** Twelve paragraphs and no control, more than any viewport the suite runs holds. */
const LONG_TEXT: ReactNode = Array.from({ length: 12 }, (_, index) => (
  <p key={index} style={{ margin: '0 0 1em' }}>
    {`Note ${String(index + 1)}. The workspace keeps every project, its members and their history, and the owner decides who joins and what each member may change.`}
  </p>
));

/**
 * A body of text with no control in it, taller than the viewport, is a tab stop of its own while it
 * scrolls, so the keyboard can reach it and scroll it, in Safari too. Axe's scrollable-region rule passes.
 */
export const KeyboardScroll: Story = {
  tags: ['no-visual'],
  args: { title: 'Release notes', children: LONG_TEXT, footer: undefined },
  render: (args) => <Opened {...args} trigger="Read the release notes" />,
  play: async ({ userEvent }) => {
    await atRest();
    const body = only('.drawer-body');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await waitFor(() => expect(body).toHaveAttribute('tabindex', '0'));
    const dialog = within(document.body).getByRole('dialog', { name: 'Release notes' });
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.tab();
    await expect(within(document.body).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await expect(body).toHaveFocus();
    // The ring is drawn inside the body, which runs flush to the panel's sides.
    const ring = getComputedStyle(body);
    await expect(ring.outlineStyle).toBe('solid');
    await expect(parseFloat(ring.outlineOffset)).toBeLessThan(0);
    const { violations } = await axe.run(only('.drawer'), {
      runOnly: { type: 'rule', values: ['scrollable-region-focusable'] },
    });
    await expect(violations).toEqual([]);
  },
};

/**
 * A navigation drawer whose list names itself and whose shell closes it: a hidden title and no close
 * button. Nothing in the header shows, so there is no header, and the body's own 24px is the top of the
 * panel, as the rail's is. The hidden title still names the drawer.
 */
export const NoHeader: Story = {
  tags: ['no-visual'],
  args: { isTitleHidden: true, hasCloseButton: false },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    await expect(within(document.body).getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    await expect(document.querySelector('.drawer-header')).toBeNull();
    const inner = panel.getBoundingClientRect().top + parseFloat(getComputedStyle(panel).borderTopWidth);
    const first = within(document.body).getByRole('link', { name: 'Overview' }).getBoundingClientRect();
    await expect(only('.drawer-body').getBoundingClientRect().top).toBeCloseTo(inner, 1);
    // The list starts 24px down, the body's padding, and no header band sits above it.
    await expect(only('.drawer-body ul').getBoundingClientRect().top - inner).toBeCloseTo(24, 1);
    await expect(first.top).toBeGreaterThanOrEqual(inner + 24);
  },
};

/**
 * A footer that holds a long address with no break in it wraps it inside the panel. The panel is 320px wide
 * on any screen wider than 352px, so this holds at 375 as at 1280.
 */
export const LongFooterText: Story = {
  tags: ['no-visual'],
  args: {
    footer: 'ada.lovelace.analytical.engine.correspondence@northwind-computing-society.example',
  },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    const footer = only('.drawer-footer');
    await expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
    const range = document.createRange();
    range.selectNodeContents(footer);
    const text = range.getBoundingClientRect();
    await expect(text.right).toBeLessThanOrEqual(panel.getBoundingClientRect().right - 24 + 0.5);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * Opened from the keyboard, focus moves into the drawer, Tab cycles through the close button and the links
 * and never reaches the page, and Escape closes it and gives focus back to the trigger. Opened by a press,
 * a press on the scrim closes it.
 */
export const FocusTrap: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <DialogTrigger>
      <Button variant="secondary">Open the menu</Button>
      <Drawer {...args} />
    </DialogTrigger>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Open the menu' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(dialog).toHaveFocus());
    const close = body.getByRole('button', { name: 'Close' });
    await userEvent.tab();
    await expect(close).toHaveFocus();
    for (const page of PAGES) {
      await userEvent.tab();
      await expect(body.getByRole('link', { name: page })).toHaveFocus();
    }
    // Past the last link, Tab cycles back to the close button and never reaches the page.
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.click(trigger);
    await body.findByRole('dialog', { name: 'Menu' });
    await atRest();
    await userEvent.click(only('.drawer-overlay'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
