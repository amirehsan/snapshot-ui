import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { AppShell } from '../app-shell';
import * as library from '../index';
import { MenuItem, MenuSeparator } from '../menu';
import { Sidebar, SidebarGroup, SidebarItem } from '../sidebar';
import { ThemeMenu, type ThemeChoice } from '../theme-switch';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Axe's label-in-name check, skipped on menu rows alone, as the stories' MENU_ROW_A11Y scopes it. */
const ROW_RULE = { id: 'label-content-name-mismatch', selector: '*:not(.menu-item)' };

/** The account's items: Settings, the theme, Help, a rule and Sign out, as the consumer's rail holds them. */
function Items({ onTheme }: { onTheme?: (choice: ThemeChoice) => void }): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  return (
    <>
      <MenuItem id="settings">Settings</MenuItem>
      <ThemeMenu
        value={theme}
        onChange={(choice) => {
          setTheme(choice);
          onTheme?.(choice);
        }}
      />
      <MenuItem id="help">Help</MenuItem>
      <MenuSeparator />
      <MenuItem id="sign-out">Sign out</MenuItem>
    </>
  );
}

type AccountProps = Partial<Omit<AccountMenuProps, 'children'>> & { onTheme?: (choice: ThemeChoice) => void };

/** Ada's account menu, alone. */
function Account({ onTheme, ...props }: AccountProps): ReactElement {
  return (
    <AccountMenu name="Ada Lovelace" detail="ada@example.com" {...props}>
      <Items onTheme={onTheme} />
    </AccountMenu>
  );
}

/** The menu in a rail's footer, in an AppShell the test folds by its prop. */
function InRail({ collapsed = false, ...props }: AccountProps & { collapsed?: boolean }): ReactElement {
  return (
    <AppShell
      isSidebarCollapsed={collapsed}
      sidebar={
        <Sidebar aria-label="Main" footer={<Account {...props} />}>
          <SidebarGroup label="Overview">
            <SidebarItem href="#home" icon={<svg />}>
              Home
            </SidebarItem>
          </SidebarGroup>
        </Sidebar>
      }
    >
      <p>The page.</p>
    </AppShell>
  );
}

/** The rail's trigger: the one drawn in the fixed rail, since the drawer copy renders nothing while closed. */
const trigger = (): HTMLElement => {
  const found = document.querySelector<HTMLElement>('.account-menu-trigger');
  if (!found) throw new Error('No account trigger');
  return found;
};

describe('AccountMenu', () => {
  it('is exported from the package', () => {
    expect(library.AccountMenu).toBe(AccountMenu);
  });

  it("names the trigger by the person's name and describes it by the detail", () => {
    render(<Account />);
    const button = screen.getByRole('button', { name: 'Ada Lovelace' });
    expect(button).toBe(trigger());
    expect(button).toHaveAccessibleDescription('ada@example.com');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-label');
    expect(button).not.toHaveAttribute('data-compact');
    // The parts, in order: the avatar, the two lines, the chevron; the avatar and the chevron hidden.
    expect([...button.children].map((child) => child.className)).toEqual([
      'avatar',
      'account-menu-text',
      'account-menu-chevron',
    ]);
    expect(button.querySelector('.avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(button.querySelector('.account-menu-chevron')).toHaveAttribute('aria-hidden', 'true');
    expect(within(button).getByText('Ada Lovelace')).toHaveClass('account-menu-name');
    const detail = within(button).getByText('ada@example.com');
    expect(detail).toHaveClass('account-menu-detail');
    expect(button).toHaveAttribute('aria-describedby', detail.id);
  });

  it('draws no detail line and no description without detail', () => {
    render(
      <AccountMenu name="Ada Lovelace">
        <MenuItem id="settings">Settings</MenuItem>
      </AccountMenu>,
    );
    const button = screen.getByRole('button', { name: 'Ada Lovelace' });
    expect(button.querySelector('.account-menu-detail')).toBeNull();
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('draws initials without avatarSrc, and the picture with it', () => {
    const { unmount } = render(<Account />);
    expect(trigger().querySelector('.avatar')).toHaveTextContent('AL');
    expect(trigger().querySelector('img')).toBeNull();
    unmount();
    render(<Account avatarSrc="/ada.png" />);
    expect(trigger().querySelector('img')).toHaveAttribute('src', '/ada.png');
  });

  it('opens a menu named Account, or by menuLabel, holding the items', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Account />);
    await user.click(trigger());
    const menu = screen.getByRole('menu', { name: 'Account' });
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Settings', 'ThemeSystem', 'Help', 'Sign out']);
    expect(menu.closest('.popover')).toHaveClass('menu-popover', 'account-menu');
    unmount();
    render(<Account menuLabel="Konto" defaultOpen />);
    expect(screen.getByRole('menu', { name: 'Konto' })).toBeInTheDocument();
  });

  it("puts className and ref on the menu, and the rest of a menu's props on it", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    const onAction = vi.fn();
    render(<Account className="mine" ref={ref} onAction={onAction} popoverClassName="lifted" />);
    await user.click(trigger());
    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('menu', 'mine');
    expect(ref.current).toBe(menu);
    expect(menu.closest('.popover')).toHaveClass('account-menu', 'lifted');
    await user.click(within(menu).getByRole('menuitem', { name: 'Help' }));
    expect(onAction.mock.calls.map(([key]) => key as unknown)).toEqual(['help']);
  });

  it('is compact in a folded rail, with the name in a tooltip and as its name', async () => {
    const { rerender } = render(<InRail />);
    expect(trigger()).not.toHaveAttribute('data-compact');
    expect(trigger().querySelector('.account-menu-name')).not.toBeNull();
    rerender(<InRail collapsed />);
    const button = screen.getByRole('button', { name: 'Ada Lovelace' });
    expect(button).toBe(trigger());
    expect(button).toHaveAttribute('data-compact');
    // Named by a visually hidden copy of the name, not an aria-label, so the avatar's initials stay out of it.
    expect(button).not.toHaveAttribute('aria-label');
    expect(button.querySelector('.avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(
      button.querySelector('.account-menu-name, .account-menu-detail, .account-menu-chevron'),
    ).toBeNull();
    expect(button.children).toHaveLength(2);
    expect(button.children[1]).toHaveTextContent('Ada Lovelace');
    expect(button.children[1]).toHaveStyle({ position: 'absolute' });
    // Focus by the keyboard opens a tip at once.
    fireEvent.keyDown(document.body, { key: 'Tab' });
    act(() => {
      button.focus();
    });
    const tip = await screen.findByRole('tooltip');
    expect(tip).toHaveTextContent('Ada Lovelace');
    fireEvent.keyDown(button, { key: 'Escape' });
  });

  it('is compact by isCompact anywhere, and a rail cannot fold one the app keeps full', () => {
    const { unmount } = render(<Account isCompact />);
    expect(trigger()).toHaveAttribute('data-compact');
    unmount();
    render(<InRail collapsed isCompact={false} />);
    expect(trigger()).not.toHaveAttribute('data-compact');
  });

  it('draws the compact face from the server when the rail is collapsed from the first paint', () => {
    const html = renderToString(<InRail collapsed />);
    expect(html).toMatch(/<button(?=[^>]*class="account-menu-trigger")(?=[^>]*data-compact="")[^>]*>/);
    expect(html).toMatch(/clip-path:inset\(50%\)[^>]*>Ada Lovelace<\/span><\/button>/);
    expect(html).not.toContain('account-menu-name');
    const full = renderToString(<InRail />);
    expect(full).toContain('<span class="account-menu-name">Ada Lovelace</span>');
    expect(full).not.toContain('data-compact');
  });

  it('opens top start in a Sidebar and bottom end elsewhere', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<InRail />);
    await user.click(trigger());
    expect(screen.getByRole('menu').closest('.popover')).toHaveAttribute('data-placement', 'top');
    unmount();
    const { unmount: unmountAlone } = render(<Account />);
    await user.click(trigger());
    expect(screen.getByRole('menu').closest('.popover')).toHaveAttribute('data-placement', 'bottom');
    unmountAlone();
    render(<Account placement="top end" />);
    await user.click(trigger());
    expect(screen.getByRole('menu').closest('.popover')).toHaveAttribute('data-placement', 'top');
  });

  it('returns focus to the trigger after a choice', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Account onAction={onAction} />);
    trigger().focus();
    await user.keyboard('{Enter}');
    const menu = screen.getByRole('menu', { name: 'Account' });
    expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAction.mock.calls.map(([key]) => key as unknown)).toEqual(['settings']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger()).toHaveFocus();
    });
  });

  it('returns focus to the trigger after a theme chosen in its submenu', async () => {
    const user = userEvent.setup();
    const onTheme = vi.fn();
    render(<Account onTheme={onTheme} />);
    trigger().focus();
    await user.keyboard('{Enter}{ArrowDown}{ArrowRight}');
    await screen.findByRole('menu', { name: 'Theme' });
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onTheme).toHaveBeenCalledWith('dark');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger()).toHaveFocus();
    });
  });

  it('keeps a trigger when the rail folds while the menu is open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<InRail />);
    const button = trigger();
    button.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    rerender(<InRail collapsed />);
    // The same element, now compact, so focus has a place to go back to.
    expect(trigger()).toBe(button);
    expect(button).toHaveAttribute('data-compact');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });

  it('requires a name and children', () => {
    const cases = [
      // @ts-expect-error the trigger is named by the person's name
      <AccountMenu key="name">
        <MenuItem id="settings">Settings</MenuItem>
      </AccountMenu>,
      // @ts-expect-error the menu's name is menuLabel, the trigger's the person's
      <AccountMenu key="label" name="Ada Lovelace" aria-label="Account">
        <MenuItem id="settings">Settings</MenuItem>
      </AccountMenu>,
    ];
    expect(cases).toHaveLength(2);
  });
});

describe('AccountMenu accessibility', () => {
  const AXE_CASES: [name: string, element: ReactElement, open: boolean][] = [
    ['closed', <Account key="closed" />, false],
    ['open', <Account key="open" />, true],
    ['compact', <Account key="compact" isCompact />, false],
    ['in a rail', <InRail key="rail" />, false],
    ['in a folded rail', <InRail key="folded" collapsed />, false],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element, open) => {
    const user = userEvent.setup();
    axe.configure({ rules: [ROW_RULE] });
    try {
      render(element);
      if (open) await user.click(trigger());
      await expectNoA11yViolations(document.body);
    } finally {
      axe.reset();
    }
  });
});
