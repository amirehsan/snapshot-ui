import type { Meta, StoryObj } from '@storybook/react-vite';
import { LifeBuoy, LogOut, Settings } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { Card, CardBody } from '../card';
import { MenuItem, MenuSeparator } from '../menu';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { focusOn } from '../stories/focus';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { ThemeMenu, type ThemeChoice } from '../theme-switch';
import { Heading, Text } from '../typography';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';

const meta = {
  title: 'Components/AccountMenu',
  parameters: {
    a11y: MENU_ROW_A11Y,
    viewport: { options: VIEWPORT_OPTIONS },
    // Several stories open a menu, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '560px' } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/** The first element under `scope` that matches `selector`. */
function find(scope: ParentNode, selector: string): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** Resolves once every popover open is placed and has entered, and its transitions are done. */
async function atRest(count = 1): Promise<HTMLElement[]> {
  const popovers = await waitFor(async () => {
    const found = [...document.querySelectorAll<HTMLElement>('.menu-popover')];
    await expect(found).toHaveLength(count);
    for (const popover of found) {
      await expect(popover).toHaveAttribute('data-placement');
      await expect(popover).not.toHaveAttribute('data-entering');
    }
    return found;
  });
  await Promise.all(
    popovers.flatMap((popover) =>
      popover.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
    ),
  );
  return popovers;
}

/** The menu item with this name, whichever of the three item roles its menu's selection gives it. */
function item(name: string): HTMLElement {
  for (const role of ['menuitem', 'menuitemradio', 'menuitemcheckbox'] as const) {
    const found = within(document.body).queryByRole(role, { name });
    if (found) return found;
  }
  throw new Error(`No menu item named ${name}`);
}

/** The person's items: Settings, the theme as a submenu, Help, a rule and Sign out, which is not danger. */
function Items({
  theme = 'system',
  onTheme,
  labels,
}: {
  theme?: ThemeChoice;
  onTheme?: (choice: ThemeChoice) => void;
  labels?: { settings: string; help: string; signOut: string };
}): ReactElement {
  const [value, setValue] = useState<ThemeChoice>(theme);
  const words = labels ?? { settings: 'Settings', help: 'Help', signOut: 'Sign out' };
  return (
    <>
      <MenuItem id="settings" icon={<Settings />}>
        {words.settings}
      </MenuItem>
      <ThemeMenu
        value={value}
        onChange={(choice) => {
          setValue(choice);
          onTheme?.(choice);
        }}
        labels={
          labels === undefined ? undefined : { label: 'پوسته', system: 'سیستم', light: 'روشن', dark: 'تیره' }
        }
      />
      <MenuItem id="help" icon={<LifeBuoy />}>
        {words.help}
      </MenuItem>
      <MenuSeparator />
      <MenuItem id="sign-out" icon={<LogOut />}>
        {words.signOut}
      </MenuItem>
    </>
  );
}

/** Ada's account menu, with her email as the detail. */
function Ada(props: Partial<Omit<AccountMenuProps, 'children'>> & { theme?: ThemeChoice }): ReactElement {
  const { theme, ...rest } = props;
  return (
    <AccountMenu name="Ada Lovelace" detail="ada@example.com" {...rest}>
      <Items theme={theme} />
    </AccountMenu>
  );
}

/** A short page beside the rail. */
const PAGE = (
  <div style={{ padding: 'var(--spacing-inset)' }}>
    <Card>
      <CardBody>
        <Text>Spending is on track this month.</Text>
      </CardBody>
    </Card>
  </div>
);

/** The shell's rail with Ada's menu in its footer, folded or not, its drawer open or not. */
function Rail({
  collapsed = false,
  drawerOpen = false,
}: {
  collapsed?: boolean;
  drawerOpen?: boolean;
}): ReactElement {
  return (
    <AppShell
      sidebar={<DemoNav footer={<Ada />} />}
      header={<DemoHeader />}
      defaultSidebarCollapsed={collapsed}
      defaultDrawerOpen={drawerOpen}
    >
      {PAGE}
    </AppShell>
  );
}

/** A column as tall as an open menu, the trigger at its foot, as a rail's footer holds it. */
const FOOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  boxSizing: 'border-box',
  inlineSize: 'min(18rem, 100%)',
  minBlockSize: '440px',
};

/** Resolves once the open drawer has slid in and every transition in it has finished. */
async function drawerAtRest(): Promise<void> {
  const panel = await waitFor(async () => {
    const found = only('.drawer');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    panel.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
}

// ---- Shot ----------------------------------------------------------------------------------------------------

/** In the rail's footer: Ada's avatar, her name and email, and the chevron, the row filling the footer. */
export const InRail: Story = {
  tags: ['density', 'viewport-desktop'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => <Rail />,
  play: async () => {
    const trigger = find(only('.sidebar:not(.sidebar-drawer)'), '.account-menu-trigger');
    await expect(trigger).toHaveAccessibleName('Ada Lovelace');
    await expect(trigger).toHaveAccessibleDescription('ada@example.com');
  },
};

/** The rail folded: the avatar alone in a pill on the rail's axis, the name its name and its tip. */
export const Compact: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => <Rail collapsed />,
  play: async () => {
    const trigger = find(only('.sidebar:not(.sidebar-drawer)'), '.account-menu-trigger');
    await expect(trigger).toHaveAttribute('data-compact');
    await expect(trigger).toHaveAccessibleName('Ada Lovelace');
  },
};

/** On a phone the rail is a drawer, and the trigger sits in its footer the same way, full. */
export const InDrawer: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  parameters: { layout: 'fullscreen' },
  render: () => <Rail drawerOpen />,
  play: async () => {
    await drawerAtRest();
    const trigger = find(only('.sidebar-drawer'), '.account-menu-trigger');
    await expect(trigger).not.toHaveAttribute('data-compact');
  },
};

/** Open upward from the foot: Settings, Theme showing System, Help, a rule and Sign out. */
export const Open: Story = {
  render: () => (
    <div style={FOOT}>
      <Ada defaultOpen placement="top start" />
    </div>
  ),
  play: async () => {
    const [popover] = await atRest();
    const menu = within(document.body).getByRole('menu', { name: 'Account' });
    await expect(popover).toContainElement(menu);
    await expect(within(item('Theme')).getByText('System')).toHaveClass('menu-item-end');
  },
};

/** The Theme submenu opened by keys, at its side, its first row level with Theme and System checked. */
export const ThemeSubmenuOpen: Story = {
  render: () => (
    <div style={FOOT}>
      <Ada placement="top start" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await focusOn(find(canvasElement, '.account-menu-trigger'));
    await userEvent.keyboard('{Enter}');
    await atRest();
    await waitFor(() => expect(item('Settings')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    await atRest(2);
    await waitFor(() => expect(item('System')).toHaveFocus());
    const theme = item('Theme');
    await expect(theme).toHaveAttribute('data-open', 'true');
    // The submenu's first row is level with Theme.
    const first = item('System').getBoundingClientRect();
    await expect(Math.abs(first.top - theme.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
  },
};

/** Compact at a header's end, for an app with no rail, opening downward at its end. */
export const InHeader: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-peer)',
        maxInlineSize: '48rem',
      }}
    >
      <Heading level={2}>Spending</Heading>
      <Ada isCompact />
    </div>
  ),
};

// ---- Checks, not shot ------------------------------------------------------------------------------------------

/**
 * Ada's menu with a theme the play reads back, at the foot of a column; under a Persian locale and `dir="rtl"`
 * with `rtl`.
 */
function Keyed({ rtl = false }: { rtl?: boolean }): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('light');
  const menu = (
    <div style={FOOT} data-theme-chosen={theme}>
      {rtl ? (
        <AccountMenu name="آدا لاولیس" detail="ada@example.com" placement="top start">
          <Items
            theme="light"
            onTheme={setTheme}
            labels={{ settings: 'تنظیمات', help: 'راهنما', signOut: 'خروج' }}
          />
        </AccountMenu>
      ) : (
        <AccountMenu name="Ada Lovelace" detail="ada@example.com" placement="top start">
          <Items theme="light" onTheme={setTheme} />
        </AccountMenu>
      )}
    </div>
  );
  return rtl ? (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        {menu}
      </div>
    </I18nProvider>
  ) : (
    menu
  );
}

/**
 * The submenu's keys: Enter opens the menu on Settings, Arrow Down reaches Theme, Arrow Right opens the submenu on
 * the chosen Light, Arrow Left closes it back to Theme, then Arrow Right, Arrow Down and Enter choose Dark, which
 * closes every level and leaves focus on the trigger. Under a Persian locale the two arrows swap.
 */
export const SubmenuKeys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-separate)' }}>
      <div data-case="ltr">
        <Keyed />
      </div>
      <div data-case="rtl">
        <Keyed rtl />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [name, open, close, theme] of [
      ['ltr', '{ArrowRight}', '{ArrowLeft}', 'Theme'],
      ['rtl', '{ArrowLeft}', '{ArrowRight}', 'پوسته'],
    ] as const) {
      const scope = find(canvasElement, `[data-case="${name}"]`);
      const trigger = find(scope, '.account-menu-trigger');
      await focusOn(trigger);
      await userEvent.keyboard('{Enter}');
      await atRest();
      await waitFor(() => expect(within(document.body).getAllByRole('menuitem')[0]).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      const row = item(theme);
      await waitFor(() => expect(row).toHaveFocus());
      await userEvent.keyboard(open);
      await atRest(2);
      const radios = () => within(document.body).getAllByRole('menuitemradio');
      // Focus on the chosen item, the second.
      await waitFor(() => expect(radios()[1]).toHaveFocus());
      await expect(radios()[1]).toHaveAttribute('aria-checked', 'true');
      await userEvent.keyboard(close);
      await waitFor(() => expect(document.querySelectorAll('.menu-popover')).toHaveLength(1));
      await waitFor(() => expect(row).toHaveFocus());
      await userEvent.keyboard(open);
      await atRest(2);
      await waitFor(() => expect(radios()[1]).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(radios()[2]).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(document.querySelectorAll('.menu-popover')).toHaveLength(0));
      await waitFor(() => expect(trigger).toHaveFocus());
      await expect(find(scope, '[data-theme-chosen]')).toHaveAttribute('data-theme-chosen', 'dark');
      // Still there two frames later: nothing took focus from the trigger after the menu left.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await expect(trigger).toHaveFocus();
    }
  },
};

/** At 320px the submenu opens over the menu where neither side has room, and stays inside the viewport. */
export const SubmenuOnAPhone: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: { viewport: { value: 'narrow' } },
  parameters: {
    viewport: { options: { narrow: { name: 'Narrow phone', styles: { width: '320px', height: '640px' } } } },
  },
  render: () => (
    <div style={FOOT}>
      <Ada placement="top start" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    await focusOn(find(canvasElement, '.account-menu-trigger'));
    await userEvent.keyboard('{Enter}');
    await atRest();
    await waitFor(() => expect(item('Settings')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    const popovers = await atRest(2);
    for (const popover of popovers) {
      const box = popover.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(-1);
      await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
      await expect(box.top).toBeGreaterThanOrEqual(-1);
      await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 1);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** Settings chosen by Enter closes the menu and gives focus back to the trigger. */
export const ChoiceReturnsFocus: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={FOOT}>
      <Ada placement="top start" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = find(canvasElement, '.account-menu-trigger');
    await focusOn(trigger);
    await userEvent.keyboard('{Enter}');
    await atRest();
    await waitFor(() => expect(item('Settings')).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelectorAll('.menu-popover')).toHaveLength(0));
    await waitFor(() => expect(trigger).toHaveFocus());
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await expect(trigger).toHaveFocus();
  },
};

/** The rail, folded by the play's `fold` event while its menu is open, as a SidePanel opening folds it. */
function FoldingRail(): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const fold = (): void => {
      setCollapsed(true);
    };
    window.addEventListener('story-fold', fold);
    return () => {
      window.removeEventListener('story-fold', fold);
    };
  }, []);
  return (
    <AppShell
      sidebar={<DemoNav footer={<Ada />} />}
      header={<DemoHeader />}
      isSidebarCollapsed={collapsed}
      onSidebarCollapsedChange={setCollapsed}
    >
      {PAGE}
    </AppShell>
  );
}

/**
 * The rail folds while the menu is open: the trigger is the same element, now compact, so Escape gives focus back
 * to it and never to the body.
 */
export const FoldWhileOpen: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => <FoldingRail />,
  play: async () => {
    const trigger = find(only('.sidebar:not(.sidebar-drawer)'), '.account-menu-trigger');
    await focusOn(trigger);
    await userEvent.keyboard('{Enter}');
    await atRest();
    window.dispatchEvent(new Event('story-fold'));
    await waitFor(() => expect(trigger).toHaveAttribute('data-compact'));
    await expect(trigger.isConnected).toBe(true);
    await expect(document.querySelectorAll('.menu-popover')).toHaveLength(1);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelectorAll('.menu-popover')).toHaveLength(0));
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(find(only('.sidebar:not(.sidebar-drawer)'), '.account-menu-trigger')).toBe(trigger);
  },
};

/**
 * Whether the point (x, y) lies inside `box` with rounded corners of `radius`: outside each corner's square it is
 * the box's own test, and inside one it is the corner circle's, allowing 1px for an engine's rounding.
 */
function insideRounded(box: DOMRect, radius: number, x: number, y: number): boolean {
  if (x < box.left - 1 || x > box.right + 1 || y < box.top - 1 || y > box.bottom + 1) return false;
  const cx = x < box.left + radius ? box.left + radius : x > box.right - radius ? box.right - radius : x;
  const cy = y < box.top + radius ? box.top + radius : y > box.bottom - radius ? box.bottom - radius : y;
  return Math.hypot(x - cx, y - cy) <= radius + 1;
}

/** Points along each of a box's four rounded corners. */
function cornerPoints(box: DOMRect, radius: number): [number, number][] {
  const points: [number, number][] = [];
  const centers: [number, number, number][] = [
    [box.left + radius, box.top + radius, Math.PI],
    [box.right - radius, box.top + radius, 1.5 * Math.PI],
    [box.right - radius, box.bottom - radius, 0],
    [box.left + radius, box.bottom - radius, 0.5 * Math.PI],
  ];
  for (const [x, y, start] of centers) {
    for (let step = 0; step <= 8; step += 1) {
      const angle = start + (step / 8) * (Math.PI / 2);
      points.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)]);
    }
  }
  return points;
}

/**
 * The trigger's wash stays inside the rail's bottom corner curve, in Rounded comfortable and compact, Soft and
 * Square, expanded and folded: each point of the trigger's own rounded corners lies inside the rail's inside edge.
 */
export const TriggerClearOfCorner: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => <FoldingRail />,
  play: async () => {
    const root = document.documentElement;
    const { shape, density } = root.dataset;
    const rail = only('.sidebar:not(.sidebar-drawer)');
    const trigger = find(rail, '.account-menu-trigger');
    const check = async (): Promise<void> => {
      await waitFor(
        async () => {
          const railStyle = getComputedStyle(rail);
          const border = parseFloat(railStyle.borderTopWidth);
          const outer = rail.getBoundingClientRect();
          const inner = new DOMRect(
            outer.left + border,
            outer.top + border,
            outer.width - 2 * border,
            outer.height - 2 * border,
          );
          const innerRadius = Math.max(0, parseFloat(railStyle.borderBottomLeftRadius) - border);
          const box = trigger.getBoundingClientRect();
          const radius = Math.min(
            parseFloat(getComputedStyle(trigger).borderBottomLeftRadius),
            box.height / 2,
          );
          for (const [x, y] of cornerPoints(box, radius)) {
            await expect(insideRounded(inner, innerRadius, x, y), `${String(x)}, ${String(y)}`).toBe(true);
          }
        },
        { timeout: 5000 },
      );
    };
    try {
      for (const [nextShape, nextDensity] of [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
        ['soft', 'comfortable'],
        ['square', 'comfortable'],
      ] as const) {
        root.dataset.shape = nextShape;
        root.dataset.density = nextDensity;
        await check();
      }
      window.dispatchEvent(new Event('story-fold'));
      await waitFor(() => expect(trigger).toHaveAttribute('data-compact'));
      root.dataset.shape = 'rounded';
      root.dataset.density = 'comfortable';
      await check();
    } finally {
      root.dataset.shape = shape ?? 'rounded';
      root.dataset.density = density ?? 'comfortable';
    }
  },
};
