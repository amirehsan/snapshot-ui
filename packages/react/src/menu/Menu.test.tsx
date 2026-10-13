import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogOut, Settings, User } from 'lucide-react';
import { createRef, useState, type ReactElement } from 'react';
import type { Key, Selection } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { holdFrames } from '../../test/dom';
import { Button } from '../button';
import { Dialog } from '../dialog';
import * as library from '../index';
import { Menu, MenuList, MenuTrigger, type MenuProps } from './Menu';
import { MenuItem } from './MenuItem';
import { MenuSection } from './MenuSection';
import { MenuSeparator } from './MenuSeparator';

afterEach(() => {
  vi.restoreAllMocks();
});

/** The open menu's popover, which React Aria portals to the body. */
function popover(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.popover');
  if (!element) throw new Error('No popover');
  return element;
}

/** The item with this name, whichever of the three item roles its menu's selection gives it. */
function item(name: string): HTMLElement {
  for (const role of ['menuitem', 'menuitemradio', 'menuitemcheckbox'] as const) {
    const found = screen.queryByRole(role, { name });
    if (found) return found;
  }
  throw new Error(`No menu item named ${name}`);
}

/** An account menu: icons, a description, a shortcut, a disabled item, a rule and a danger item. */
function Account({
  defaultOpen,
  ...props
}: Partial<MenuProps<object>> & { defaultOpen?: boolean }): ReactElement {
  return (
    <MenuTrigger defaultOpen={defaultOpen}>
      <Button variant="secondary">Account</Button>
      <Menu {...props}>
        <MenuItem id="profile" icon={<User data-testid="profile-icon" />}>
          Profile
        </MenuItem>
        <MenuItem id="settings" icon={<Settings />} description="Account and billing" shortcut="Mod ,">
          Settings
        </MenuItem>
        <MenuItem id="export" isDisabled>
          Export
        </MenuItem>
        <MenuSeparator />
        <MenuItem id="logout" icon={<LogOut />} shortcut="Q" variant="danger">
          Log out
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

/** A theme section in single selection and two toggles in multiple, as an app's view menu holds them. */
function View({
  defaultOpen,
  onTheme,
  onToggles,
}: {
  defaultOpen?: boolean;
  onTheme?: (keys: Selection) => void;
  onToggles?: (keys: Selection) => void;
}): ReactElement {
  const [theme, setTheme] = useState<Selection>(new Set(['dark']));
  const [toggles, setToggles] = useState<Selection>(new Set(['grid']));
  return (
    <MenuTrigger defaultOpen={defaultOpen}>
      <Button variant="secondary">View</Button>
      <Menu>
        <MenuSection
          title="Theme"
          selectionMode="single"
          selectedKeys={theme}
          onSelectionChange={(keys) => {
            setTheme(keys);
            onTheme?.(keys);
          }}
        >
          <MenuItem id="light">Light</MenuItem>
          <MenuItem id="dark">Dark</MenuItem>
          <MenuItem id="system">System</MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuSection
          title="Show"
          selectionMode="multiple"
          selectedKeys={toggles}
          onSelectionChange={(keys) => {
            setToggles(keys);
            onToggles?.(keys);
          }}
        >
          <MenuItem id="grid">Grid</MenuItem>
          <MenuItem id="rulers">Rulers</MenuItem>
        </MenuSection>
      </Menu>
    </MenuTrigger>
  );
}

describe('Menu', () => {
  it('renders nothing until its trigger opens it, then a menu named by the trigger', async () => {
    const user = userEvent.setup();
    render(<Account />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Account' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Account' });
    expect(menu).toHaveAttribute('aria-labelledby', trigger.id);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('data-pressed', 'true');
  });

  it('opens in the popover, which carries the menu-popover class and the one given for it', () => {
    render(<Account defaultOpen popoverClassName="account-popover" />);
    expect(popover().className).toBe('overlay popover menu-popover account-popover');
    expect(popover()).toHaveAttribute('data-trigger', 'MenuTrigger');
    expect(popover()).toContainElement(screen.getByRole('menu'));
  });

  it('puts the menu class, then the className, and the ref on the menu element', () => {
    const ref = createRef<HTMLDivElement>();
    const { unmount } = render(<Account defaultOpen className="mine" ref={ref} />);
    const menu = screen.getByRole('menu');
    expect(menu.className).toBe('menu mine');
    expect(ref.current).toBe(menu);
    unmount();
    render(<Account defaultOpen className={({ isEmpty }) => (isEmpty ? 'empty' : 'full')} />);
    expect(screen.getByRole('menu').className).toBe('menu full');
  });

  it('takes an aria-label, as a list rendered without a trigger needs', () => {
    render(
      <MenuList aria-label="Quick actions">
        <MenuItem id="new">New project</MenuItem>
      </MenuList>,
    );
    const menu = screen.getByRole('menu', { name: 'Quick actions' });
    expect(menu).toHaveClass('menu');
    expect(document.querySelector('.popover')).toBeNull();
  });

  it('draws an item as its icon, hidden, its label, which names it, its description and its key', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    render(<Account defaultOpen />);
    const settings = item('Settings');
    expect(settings).toHaveClass('menu-item');
    expect(settings.tagName).toBe('DIV');
    const icon = settings.querySelector('.menu-item-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(within(settings).getByText('Settings')).toHaveClass('menu-item-label');
    expect(within(settings).getByText('Settings').parentElement).toHaveClass('menu-item-text');
    const description = within(settings).getByText('Account and billing');
    expect(description).toHaveClass('menu-item-description');
    expect(settings.getAttribute('aria-describedby')?.split(' ')).toContain(description.id);
    const key = settings.querySelector('kbd');
    expect(key).toHaveClass('menu-item-shortcut');
    expect(key).toHaveTextContent('\u2318 ,');
    // The parts come in this order: icon, text, key.
    expect([...settings.children].map((child) => child.className)).toEqual([
      'menu-item-icon',
      'menu-item-text',
      'menu-item-shortcut',
    ]);
  });

  it('draws an end value before the key, which describes the item and stays out of its name', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    const { unmount } = render(
      <MenuTrigger defaultOpen>
        <Button>Accounts</Button>
        <Menu>
          <MenuItem id="checking" description="Everyday" end="$2,340.12" shortcut="Mod 1">
            Checking
          </MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    const checking = item('Checking');
    const end = within(checking).getByText('$2,340.12');
    expect(end.tagName).toBe('SPAN');
    expect(end).toHaveClass('menu-item-end');
    expect([...checking.children].map((child) => child.className)).toEqual([
      'menu-item-text',
      'menu-item-end',
      'menu-item-shortcut',
    ]);
    // Named by its label alone; the value, the second line and the key describe it, the value first.
    expect(checking).toHaveAccessibleName('Checking');
    expect(checking).toHaveAccessibleDescription('$2,340.12 Everyday \u2318 1');
    expect(checking.getAttribute('aria-describedby')?.split(' ')[0]).toBe(end.id);
    unmount();

    // A description the caller names stays, after the value.
    render(
      <>
        <p id="note">Joint account</p>
        <MenuTrigger defaultOpen>
          <Button>Accounts</Button>
          <Menu>
            <MenuItem id="savings" end="$10,050.00" aria-describedby="note">
              Savings
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </>,
    );
    expect(item('Savings')).toHaveAccessibleDescription('$10,050.00 Joint account');
  });

  it('draws nothing for an icon, a description or a shortcut it is not given', () => {
    render(<Account defaultOpen />);
    const profile = item('Profile');
    expect(profile.querySelector('.menu-item-description')).toBeNull();
    expect(profile.querySelector('.menu-item-shortcut')).toBeNull();
    expect(profile.querySelector('.menu-item-end')).toBeNull();
    expect(profile).not.toHaveAttribute('aria-describedby');
    expect(item('Export').querySelector('.menu-item-icon')).toBeNull();
  });

  it('marks a danger item with menu-item-danger and nothing else', () => {
    render(<Account defaultOpen />);
    expect(item('Log out').className).toBe('menu-item menu-item-danger');
    expect(item('Profile').className).toBe('menu-item');
  });

  it('marks a disabled item for the eye and for assistive technology', () => {
    render(<Account defaultOpen />);
    expect(item('Export')).toHaveAttribute('data-disabled', 'true');
    expect(item('Export')).toHaveAttribute('aria-disabled', 'true');
  });

  it("takes a className function of the item's state, merged after the library classes", () => {
    render(
      <MenuTrigger defaultOpen>
        <Button>More</Button>
        <Menu>
          <MenuItem id="a" variant="danger" className={({ isDisabled }) => (isDisabled ? 'off' : 'on')}>
            Archive
          </MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    expect(item('Archive').className).toBe('menu-item menu-item-danger on');
  });

  it('draws a section with its heading, which names its group, and a separator as a rule', () => {
    const ref = createRef<HTMLElement>();
    render(
      <MenuTrigger defaultOpen>
        <Button>More</Button>
        <Menu>
          <MenuSection title="Workspace" className="mine" ref={ref}>
            <MenuItem id="invite">Invite people</MenuItem>
          </MenuSection>
          <MenuSeparator className="rule" />
          <MenuItem id="help">Help</MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    const group = screen.getByRole('group', { name: 'Workspace' });
    expect(group.tagName).toBe('SECTION');
    expect(group.className).toBe('menu-section mine');
    expect(ref.current).toBe(group);
    const heading = within(group).getByText('Workspace');
    expect(heading.tagName).toBe('HEADER');
    expect(heading).toHaveClass('menu-heading');
    const rule = screen.getByRole('separator');
    expect(rule.className).toBe('menu-separator rule');
  });

  it('draws a section with no heading when it has no title', () => {
    render(
      <MenuTrigger defaultOpen>
        <Button>More</Button>
        <Menu>
          <MenuSection aria-label="Workspace">
            <MenuItem id="invite">Invite people</MenuItem>
          </MenuSection>
        </Menu>
      </MenuTrigger>,
    );
    expect(document.querySelector('.menu-heading')).toBeNull();
    expect(screen.getByRole('group', { name: 'Workspace' })).toHaveClass('menu-section');
  });

  it('makes a single selection radios, with a check on every row and the selected one marked', () => {
    render(<View defaultOpen />);
    const theme = screen.getByRole('group', { name: 'Theme' });
    const rows = within(theme).getAllByRole('menuitemradio');
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.querySelector('.menu-item-check svg')).not.toBeNull();
      expect(row.querySelector('.menu-item-check')).toHaveAttribute('aria-hidden', 'true');
      expect(row).toHaveAttribute('data-selection-mode', 'single');
    }
    expect(item('Dark')).toHaveAttribute('data-selected', 'true');
    expect(item('Dark')).toHaveAttribute('aria-checked', 'true');
    expect(item('Light')).not.toHaveAttribute('data-selected');
    expect(item('Light')).toHaveAttribute('aria-checked', 'false');
    // The check comes last, after the text.
    expect(item('Dark').lastElementChild).toHaveClass('menu-item-check');
  });

  it('makes a multiple selection checkboxes, each with its check', () => {
    render(<View defaultOpen />);
    const show = screen.getByRole('group', { name: 'Show' });
    const rows = within(show).getAllByRole('menuitemcheckbox');
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row.querySelector('.menu-item-check')).not.toBeNull();
    expect(item('Grid')).toHaveAttribute('data-selection-mode', 'multiple');
    expect(item('Grid')).toHaveAttribute('aria-checked', 'true');
  });

  it('draws no check room in a menu that selects nothing', () => {
    render(<Account defaultOpen />);
    expect(document.querySelector('.menu-item-check')).toBeNull();
  });

  it('calls onAction with the key of the item pressed, and closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn<(key: Key) => void>();
    render(<Account onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(item('Settings'));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction.mock.calls[0]?.[0]).toBe('settings');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on a choice in single mode, by press and by Space, and calls onSelectionChange', async () => {
    const user = userEvent.setup();
    const onTheme = vi.fn<(keys: Selection) => void>();
    render(<View onTheme={onTheme} />);
    const trigger = screen.getByRole('button', { name: 'View' });
    await user.click(trigger);
    await user.click(item('Light'));
    expect(onTheme).toHaveBeenCalledOnce();
    expect([...(onTheme.mock.calls[0]?.[0] as Set<Key>)]).toEqual(['light']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Space chooses without closing in React Aria's own default; the library's closes it too.
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(item('Light')).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');
    expect(onTheme).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('stays open on a choice in multiple mode, by press, by Space and by Enter', async () => {
    const user = userEvent.setup();
    const onToggles = vi.fn<(keys: Selection) => void>();
    render(<View onToggles={onToggles} />);
    await user.click(screen.getByRole('button', { name: 'View' }));
    await user.click(item('Rulers'));
    expect(onToggles).toHaveBeenCalledOnce();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(item('Rulers')).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    expect(onToggles).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onToggles).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('takes its close-on-select default from a selection mode on the menu itself, from the keyboard too', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MenuTrigger>
        <Button>Columns</Button>
        <Menu selectionMode="multiple" defaultSelectedKeys={['name']}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="owner">Owner</MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(item('Owner'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(item('Owner')).toHaveAttribute('aria-checked', 'true');
    // React Aria's own default closes on Enter whatever the selection; a multiple choice stays open.
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(item('Owner')).toHaveAttribute('aria-checked', 'false');
    unmount();

    render(
      <MenuTrigger>
        <Button>Sort</Button>
        <Menu selectionMode="single" defaultSelectedKeys={['name']}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="date">Date</MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(item('Name')).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    // React Aria's own default leaves a menu open on Space; a single choice closes it.
    await user.keyboard(' ');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it("lets an item's own shouldCloseOnSelect and the caller's on the menu override the default", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MenuTrigger>
        <Button>Columns</Button>
        <Menu selectionMode="multiple">
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="reset" shouldCloseOnSelect>
            Reset
          </MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(item('Reset'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    unmount();

    render(
      <MenuTrigger>
        <Button>Sort</Button>
        <Menu selectionMode="single" shouldCloseOnSelect={false}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="date">Date</MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Sort' }));
    await user.click(item('Date'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it("renders an item with href as a link that navigates through the library's RouterProvider", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn<(path: string) => void>();
    render(
      <library.RouterProvider navigate={navigate}>
        <MenuTrigger>
          <Button>Help</Button>
          <Menu>
            <MenuItem id="docs" href="/docs/components/button">
              Button
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </library.RouterProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Help' }));
    const link = item('Button');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('role', 'menuitem');
    expect(link).toHaveAttribute('href', '/docs/components/button');
    await user.click(link);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate.mock.calls[0]?.[0]).toBe('/docs/components/button');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders the element its render prop returns, as a router link would be', () => {
    render(
      <MenuTrigger defaultOpen>
        <Button>Help</Button>
        <Menu>
          <MenuItem
            id="docs"
            href="/docs"
            render={({ children, ...props }) =>
              'href' in props ? (
                <a {...props} data-router-link="">
                  {children}
                </a>
              ) : (
                <div {...props}>{children}</div>
              )
            }
          >
            Docs
          </MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    const link = item('Docs');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('data-router-link');
    expect(link).toHaveClass('menu-item');
    expect(link.querySelector('.menu-item-label')).toHaveTextContent('Docs');
  });

  it('opens from the keyboard on the first item with Arrow Down and on the last with Arrow Up', async () => {
    const user = userEvent.setup();
    render(<Account />);
    const trigger = screen.getByRole('button', { name: 'Account' });
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(item('Profile')).toHaveFocus();
    });
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    await user.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(item('Log out')).toHaveFocus();
    });
  });

  it('opens from Enter on the first item', async () => {
    const user = userEvent.setup();
    render(<Account />);
    await user.tab();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(item('Profile')).toHaveFocus();
    });
  });

  it('opens from a pointer press with focus on the menu, unless the menu itself has a selected row', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Account />);
    await user.click(screen.getByRole('button', { name: 'Account' }));
    // React Aria's own: a pointer opens the list itself, so no row looks chosen until one is hovered.
    await waitFor(() => {
      expect(screen.getByRole('menu')).toHaveFocus();
    });
    expect(document.querySelector('.menu-item[data-focused]')).toBeNull();
    unmount();

    // A section selects on its own, so its chosen row does not take focus as the menu opens.
    const { unmount: unmountView } = render(<View />);
    await user.click(screen.getByRole('button', { name: 'View' }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toHaveFocus();
    });
    unmountView();

    // A selection on the menu does: focus starts on its chosen row.
    render(
      <MenuTrigger>
        <Button>Sort</Button>
        <Menu selectionMode="single" defaultSelectedKeys={['date']}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="date">Date</MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Sort' }));
    await waitFor(() => {
      expect(item('Date')).toHaveFocus();
    });
  });

  it('moves with the arrows without wrapping, skips a disabled item, and jumps with Home and End', async () => {
    const user = userEvent.setup();
    render(<Account />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(item('Profile')).toHaveFocus();
    });
    await user.keyboard('{ArrowUp}');
    expect(item('Profile')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item('Settings')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item('Log out')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item('Log out')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('Profile')).toHaveFocus();
    await user.keyboard('{End}');
    expect(item('Log out')).toHaveFocus();
  });

  it('wraps when asked to with shouldFocusWrap', async () => {
    const user = userEvent.setup();
    render(<Account shouldFocusWrap />);
    await user.tab();
    await user.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(item('Log out')).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    expect(item('Profile')).toHaveFocus();
  });

  it('moves to an item by the letters typed, its label being its text value', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>More</Button>
        <Menu>
          <MenuItem id="profile">Profile</MenuItem>
          <MenuItem id="settings">Settings</MenuItem>
          <MenuItem id="logout" textValue="Log out">
            <b>Log</b> out
          </MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(item('Profile')).toHaveFocus();
    });
    await user.keyboard('s');
    expect(item('Settings')).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await user.keyboard('l');
    expect(item('Log out')).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<Account />);
    const trigger = screen.getByRole('button', { name: 'Account' });
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(item('Profile')).toHaveFocus();
    });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('gives focus back to its trigger in a dialog as it leaves, so the dialog cannot take it', async () => {
    const user = userEvent.setup();
    // Every frame held back, as on a loaded machine whose next frame comes late. React Aria gives focus back
    // in a frame, and until then focus would rest on the body, where the dialog takes it 500ms after it
    // opened.
    holdFrames();
    render(
      <Dialog defaultOpen title="Edit the project">
        <Account />
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Account' });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement);
    });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(trigger).toHaveFocus();
  });

  it('keeps Tab inside the open menu, as React Aria holds focus in its popover', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Account />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(item('Profile')).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    await user.tab();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(item('Settings')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement);
  });

  it('copies the scope of its trigger onto the popover, not of what holds focus', () => {
    render(
      <>
        <div data-theme="light" data-shape="square">
          <button type="button">Elsewhere</button>
        </div>
        <div data-theme="dark" data-shape="soft">
          <Account defaultOpen />
        </div>
      </>,
    );
    expect(popover()).toHaveAttribute('data-theme', 'dark');
    expect(popover()).toHaveAttribute('data-shape', 'soft');
  });

  it('is exported from the package with its trigger and parts, and the list stays private', () => {
    for (const name of ['Menu', 'MenuTrigger', 'MenuItem', 'MenuSection', 'MenuSeparator']) {
      expect(library, name).toHaveProperty(name);
    }
    expect(library).not.toHaveProperty('MenuList');
    expect(library).not.toHaveProperty('Shortcut');
  });

  it('exports React Aria’s Key type, so an app types its item ids with no React Aria import', () => {
    // Fails `pnpm typecheck` if the package stops exporting the type.
    const ids: library.Key[] = ['rename', 7];
    expect(ids).toHaveLength(2);
  });

  it('has no axe violations open, with a section, a separator, a selected row and a disabled row', async () => {
    render(
      <MenuTrigger defaultOpen>
        <Button>View</Button>
        <Menu>
          <MenuSection title="Theme" selectionMode="single" defaultSelectedKeys={['dark']}>
            <MenuItem id="light">Light</MenuItem>
            <MenuItem id="dark" description="Easier on the eyes at night">
              Dark
            </MenuItem>
            <MenuItem id="system" isDisabled>
              System
            </MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuItem id="settings" icon={<Settings />} shortcut="Mod ,">
            Settings
          </MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await expectNoA11yViolations(document.body);
  });
});
