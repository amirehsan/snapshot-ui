import { render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Button } from '../button';
import { Dialog } from '../dialog';
import * as library from '../index';
import { Menu, MenuItem, MenuTrigger } from '../menu';
import { ThemeMenu, ThemeSwitch, type ThemeChoice, type ThemeMenuProps } from './ThemeSwitch';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Axe's label-in-name check, skipped on menu rows alone, as the stories' MENU_ROW_A11Y scopes it. */
const ROW_RULE = { id: 'label-content-name-mismatch', selector: '*:not(.menu-item)' };

/** The three choices a radio group draws, in order, by their radios' names. */
const radios = (): string[] =>
  screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent ?? '');

/** A menu holding a ThemeMenu between two items, opened by its default, as an account menu holds one. */
function Account({
  value = 'system',
  onChange = () => undefined,
  display,
  defaultOpen = true,
}: Partial<ThemeMenuProps> & { defaultOpen?: boolean }): ReactElement {
  return (
    <MenuTrigger defaultOpen={defaultOpen}>
      <Button variant="secondary">Ada Lovelace</Button>
      <Menu>
        <MenuItem id="settings">Settings</MenuItem>
        <ThemeMenu value={value} onChange={onChange} display={display} />
        <MenuItem id="help">Help</MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

/** An app's own state for the theme, as its cookie would hold it. */
function Controlled({ onChange }: { onChange: (choice: ThemeChoice) => void }): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  return (
    <Account
      defaultOpen={false}
      value={theme}
      onChange={(choice) => {
        setTheme(choice);
        onChange(choice);
      }}
    />
  );
}

describe('ThemeSwitch', () => {
  it('is exported from the package with its types', () => {
    expect(library.ThemeSwitch).toBe(ThemeSwitch);
    expect(library.ThemeMenu).toBe(ThemeMenu);
  });

  it('draws System, Light and Dark in that order, with hidden icons', () => {
    render(<ThemeSwitch value="system" onChange={() => undefined} />);
    expect(radios()).toEqual(['System', 'Light', 'Dark']);
    for (const radio of screen.getAllByRole('radio')) {
      const icon = radio.closest('label')?.querySelector('svg');
      expect(icon).not.toBeNull();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
    // The radios' values are the choices, which a form would send.
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'system',
      'light',
      'dark',
    ]);
  });

  it('draws the words alone without icons', () => {
    render(<ThemeSwitch value="dark" onChange={() => undefined} hasIcons={false} />);
    expect(radios()).toEqual(['System', 'Light', 'Dark']);
    expect(document.querySelector('svg')).toBeNull();
  });

  it('selects the given value, and none for null', () => {
    const { rerender } = render(<ThemeSwitch value="light" onChange={() => undefined} />);
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(screen.getAllByRole('radio').filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(
      1,
    );
    rerender(<ThemeSwitch value={null} onChange={() => undefined} />);
    expect(screen.getAllByRole('radio').filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(
      0,
    );
  });

  it('calls onChange with the choice and writes nothing else', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    const setCookie = vi.fn();
    Object.defineProperty(document, 'cookie', { configurable: true, get: () => '', set: setCookie });
    try {
      render(<ThemeSwitch value="system" onChange={onChange} />);
      await user.click(screen.getByText('Dark'));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('dark');
      // Controlled only: the value the app passes is what it draws until the app passes another.
      expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
      expect(setItem).not.toHaveBeenCalled();
      expect(setCookie).not.toHaveBeenCalled();
      expect(document.documentElement).not.toHaveAttribute('data-theme');
    } finally {
      delete (document as { cookie?: string }).cookie;
      if (cookie) Object.defineProperty(Document.prototype, 'cookie', cookie);
    }
  });

  it('applies a choice by the arrows, as a radio group does', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeSwitch value="system" onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'System' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('light');
  });

  it('draws RadioGroup rows for look radio', () => {
    render(<ThemeSwitch look="radio" value="dark" onChange={() => undefined} />);
    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(group).toHaveClass('radio-group');
    expect(group).not.toHaveClass('segmented');
    expect(group).toHaveAttribute('aria-orientation', 'vertical');
    expect(group.querySelectorAll('.radio')).toHaveLength(3);
    expect(radios()).toEqual(['System', 'Light', 'Dark']);
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it("is a segmented control by default, with the theme-switch class before the app's", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ThemeSwitch value="system" onChange={() => undefined} size="sm" className="mine" ref={ref} />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveClass('field', 'segmented', 'segmented-sm', 'theme-switch', 'mine');
    expect(group.className.indexOf('theme-switch')).toBeLessThan(group.className.indexOf('mine'));
    expect(ref.current).toBe(group);
  });

  it('is named Theme, or by the app', () => {
    const { rerender } = render(<ThemeSwitch value="system" onChange={() => undefined} />);
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    rerender(<ThemeSwitch value="system" onChange={() => undefined} aria-label="Appearance" />);
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="appearance">Appearance</h2>
        <ThemeSwitch value="system" onChange={() => undefined} aria-labelledby="appearance" />
      </>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).not.toHaveAttribute('aria-label');
    rerender(<ThemeSwitch value="system" onChange={() => undefined} label="Color mode" />);
    expect(screen.getByRole('radiogroup', { name: 'Color mode' })).toBeInTheDocument();
    rerender(
      <ThemeSwitch
        value="system"
        onChange={() => undefined}
        labels={{ label: 'Thema', system: 'System', light: 'Hell', dark: 'Dunkel' }}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Thema' })).toBeInTheDocument();
    expect(radios()).toEqual(['System', 'Hell', 'Dunkel']);
  });

  it('shows no Changed chip and no edge, and says none', () => {
    render(<ThemeSwitch value="dark" onChange={() => undefined} label="Theme" />);
    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    // The label row keeps the chip's element, which the stylesheet shows only under data-changed.
    expect(group).not.toHaveAttribute('data-changed');
    expect(group).toHaveAccessibleDescription('');
  });

  it('reads nothing from window at render', () => {
    const matchMedia = vi.fn();
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const readCookie = vi.fn(() => '');
    Object.defineProperty(document, 'cookie', { configurable: true, get: readCookie, set: () => undefined });
    const getAttribute = vi.spyOn(document.documentElement, 'getAttribute');
    try {
      const html = renderToString(<ThemeSwitch value="dark" onChange={() => undefined} />);
      expect(html).toContain('class="field segmented theme-switch"');
      const { unmount } = render(<ThemeSwitch value="dark" onChange={() => undefined} />);
      render(<ThemeSwitch look="radio" value={null} onChange={() => undefined} />);
      render(<Account value="light" />);
      unmount();
      expect(matchMedia).not.toHaveBeenCalled();
      expect(getItem).not.toHaveBeenCalled();
      expect(readCookie).not.toHaveBeenCalled();
      expect(getAttribute).not.toHaveBeenCalledWith('data-theme');
    } finally {
      delete (window as { matchMedia?: unknown }).matchMedia;
      delete (document as { cookie?: string }).cookie;
    }
  });

  it('takes no uncontrolled value, no Changed state and needs onChange', () => {
    const onChange = (): void => undefined;
    const cases = [
      // @ts-expect-error controlled only: a value and its handler
      <ThemeSwitch key="handler" value="dark" />,
      // @ts-expect-error a theme is applied at once and is never Changed
      <ThemeSwitch key="changed" value="dark" onChange={onChange} isChanged />,
      // @ts-expect-error controlled only: no first value
      <ThemeSwitch key="default" defaultValue="dark" value="dark" onChange={onChange} />,
      // @ts-expect-error a choice is one of the three
      <ThemeSwitch key="choice" value="sepia" onChange={onChange} />,
    ];
    expect(cases).toHaveLength(4);
  });
});

describe('ThemeMenu', () => {
  it('opens a submenu from a Theme item that shows the current choice as its end', async () => {
    const user = userEvent.setup();
    render(<Account value="system" />);
    const theme = screen.getByRole('menuitem', { name: 'Theme' });
    expect(theme).toHaveAttribute('aria-haspopup', 'menu');
    expect(theme).toHaveAttribute('aria-expanded', 'false');
    expect(theme).toHaveAttribute('data-has-submenu');
    const end = within(theme).getByText('System');
    expect(end).toHaveClass('menu-item-end');
    expect(theme.getAttribute('aria-describedby')?.split(' ')).toContain(end.id);
    expect(theme.querySelector('.menu-item-submenu')).not.toBeNull();
    theme.focus();
    await user.keyboard('{ArrowRight}');
    const submenu = await screen.findByRole('menu', { name: 'Theme' });
    expect(theme).toHaveAttribute('aria-expanded', 'true');
    expect(theme).toHaveAttribute('data-open');
    expect(
      within(submenu)
        .getAllByRole('menuitemradio')
        .map((item) => item.textContent),
    ).toEqual(['System', 'Light', 'Dark']);
  });

  it('shows no end on the Theme item for null', () => {
    render(<Account value={null} />);
    const theme = screen.getByRole('menuitem', { name: 'Theme' });
    expect(theme.querySelector('.menu-item-end')).toBeNull();
  });

  it('marks the chosen item checked among three menuitemradio items', async () => {
    const user = userEvent.setup();
    render(<Account value="dark" />);
    screen.getByRole('menuitem', { name: 'Theme' }).focus();
    await user.keyboard('{ArrowRight}');
    const submenu = await screen.findByRole('menu', { name: 'Theme' });
    const items = within(submenu).getAllByRole('menuitemradio');
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    // Arrow Right opens it with focus on the chosen item.
    expect(within(submenu).getByRole('menuitemradio', { name: 'Dark' })).toHaveFocus();
    for (const item of items) expect(item.querySelector('.menu-item-icon svg')).not.toBeNull();
  });

  it('marks none checked for null', async () => {
    const user = userEvent.setup();
    render(<Account value={null} />);
    screen.getByRole('menuitem', { name: 'Theme' }).focus();
    await user.keyboard('{ArrowRight}');
    const submenu = await screen.findByRole('menu', { name: 'Theme' });
    expect(
      within(submenu)
        .getAllByRole('menuitemradio')
        .map((item) => item.getAttribute('aria-checked')),
    ).toEqual(['false', 'false', 'false']);
  });

  it('calls onChange and closes every level', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Ada Lovelace' });
    trigger.focus();
    await user.keyboard('{Enter}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Theme' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await screen.findByRole('menu', { name: 'Theme' });
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('dark');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    // The Theme item shows the new choice when the menu opens again.
    await user.click(trigger);
    expect(within(screen.getByRole('menuitem', { name: 'Theme' })).getByText('Dark')).toBeInTheDocument();
  });

  it('closes the submenu alone on Escape and Arrow Left, with focus back on Theme', async () => {
    const user = userEvent.setup();
    render(<Account value="light" />);
    const theme = screen.getByRole('menuitem', { name: 'Theme' });
    theme.focus();
    await user.keyboard('{ArrowRight}');
    await screen.findByRole('menu', { name: 'Theme' });
    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument();
    expect(theme).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await screen.findByRole('menu', { name: 'Theme' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(theme).toHaveFocus();
  });

  it('takes the Escape that closes the submenu, so nothing around the menu hears it', async () => {
    const user = userEvent.setup();
    const heard = vi.fn();
    const listen = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') heard();
    };
    document.addEventListener('keydown', listen);
    try {
      render(<Account value="light" />);
      const theme = screen.getByRole('menuitem', { name: 'Theme' });
      theme.focus();
      await user.keyboard('{ArrowRight}');
      await screen.findByRole('menu', { name: 'Theme' });
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument();
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(theme).toHaveFocus();
      expect(heard).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', listen);
    }
  });

  it('closes one level per Escape inside a dialog, which stays open', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog isOpen onOpenChange={onOpenChange} title="Profile">
        <Account value="light" defaultOpen={false} />
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Ada Lovelace' });
    trigger.focus();
    await user.keyboard('{Enter}{ArrowDown}{ArrowRight}');
    await screen.findByRole('menu', { name: 'Theme' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Theme' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('draws a Theme section with display section', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Account value="light" display="section" onChange={onChange} />);
    expect(screen.queryByRole('menuitem', { name: 'Theme' })).not.toBeInTheDocument();
    const section = screen.getByRole('group', { name: 'Theme' });
    expect(section).toHaveClass('menu-section');
    const items = within(section).getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual(['System', 'Light', 'Dark']);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    await user.click(within(section).getByRole('menuitemradio', { name: 'System' }));
    expect(onChange).toHaveBeenCalledWith('system');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('takes its words from labels', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger defaultOpen>
        <Button>Konto</Button>
        <Menu>
          <ThemeMenu
            value="light"
            onChange={() => undefined}
            labels={{ label: 'Thema', light: 'Hell', dark: 'Dunkel' }}
          />
        </Menu>
      </MenuTrigger>,
    );
    const theme = screen.getByRole('menuitem', { name: 'Thema' });
    expect(within(theme).getByText('Hell')).toHaveClass('menu-item-end');
    theme.focus();
    await user.keyboard('{ArrowRight}');
    const submenu = await screen.findByRole('menu', { name: 'Thema' });
    expect(
      within(submenu)
        .getAllByRole('menuitemradio')
        .map((item) => item.textContent),
    ).toEqual(['System', 'Hell', 'Dunkel']);
  });
});

describe('ThemeSwitch accessibility', () => {
  const AXE_CASES: [name: string, element: ReactElement][] = [
    ['segmented', <ThemeSwitch key="segmented" value="system" onChange={() => undefined} />],
    ['radio', <ThemeSwitch key="radio" look="radio" value="dark" onChange={() => undefined} />],
    ['null', <ThemeSwitch key="null" value={null} onChange={() => undefined} />],
    ["the menu's section", <Account key="section" value="light" display="section" />],
    ["the menu's submenu item", <Account key="submenu" value="light" />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    // A menu row is named by its label and described by its end value, so axe's label-in-name check skips menu
    // rows alone, as the stories' MENU_ROW_A11Y scopes it, and still runs on everything else.
    axe.configure({ rules: [ROW_RULE] });
    try {
      render(element);
      // An open menu portals to the body, so the whole body is checked.
      await expectNoA11yViolations(document.body);
    } finally {
      axe.reset();
    }
  });
});
