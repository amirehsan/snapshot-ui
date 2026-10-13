import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ArrowLeftRight,
  ChartColumn,
  Coffee,
  Landmark,
  PiggyBank,
  Plus,
  Settings,
  Wallet,
} from 'lucide-react';
import { createRef, useState, type ReactElement } from 'react';
import type { Key } from 'react-aria-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Button } from '../button';
import { Dialog } from '../dialog';
import * as library from '../index';
import { CommandPalette, type CommandPaletteItem, type CommandPaletteProps } from './CommandPalette';

/**
 * Eight items: two with no section and three sections, listed out of order, so the palette has to group
 * them. Each kind of part is somewhere: icons, second lines, words that match and are not drawn, values at
 * the end and a key hint.
 */
const ITEMS: CommandPaletteItem[] = [
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Every account',
    icon: <ArrowLeftRight />,
    section: 'Pages',
  },
  { id: 'new', label: 'New transaction', icon: <Plus />, keywords: 'add create record', shortcut: 'Mod N' },
  {
    id: 'checking',
    label: 'Checking',
    description: 'Everyday',
    icon: <Landmark />,
    end: '$2,340.12',
    section: 'Accounts',
  },
  { id: 'budgets', label: 'Budgets', icon: <PiggyBank />, keywords: 'spending limits', section: 'Pages' },
  {
    id: 'cafe',
    label: 'Café Lumière',
    description: 'Coffee and pastries',
    icon: <Coffee />,
    end: '$4.50',
    section: 'Payees',
  },
  { id: 'settings', label: 'Settings', description: 'Profile, billing and security', icon: <Settings /> },
  { id: 'savings', label: 'Savings', icon: <Wallet />, end: '$10,050.00', section: 'Accounts' },
  { id: 'reports', label: 'Reports', icon: <ChartColumn />, section: 'Pages' },
];

/** The item in ITEMS with this id. */
function itemWith(id: Key): CommandPaletteItem {
  const found = ITEMS.find((item) => item.id === id);
  if (!found) throw new Error(`No item ${String(id)}`);
  return found;
}

/** The entry the palette remembers its recents in, for the storage key "search". */
const ENTRY = 'snapshot-ui:recent:search';

/** The open palette's panel, which React Aria portals to the body. */
function panel(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.command-palette');
  if (!element) throw new Error('No panel');
  return element;
}

/** The palette's field, named by its label. */
const input = (): HTMLElement => screen.getByRole('textbox', { name: 'Search' });

/** The palette's status line. */
function status(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.command-palette-status');
  if (!element) throw new Error('No status line');
  return element;
}

/** The names of the rows the list shows, top to bottom. React Aria's empty line is a menu item too, and no row. */
const rows = (): string[] =>
  [...document.querySelectorAll('.command-palette-list .menu-item')].map(
    (row) => row.querySelector('.menu-item-label')?.textContent ?? '',
  );

/** The headings of the sections the list shows, top to bottom. */
const headings = (): string[] =>
  [...document.querySelectorAll('.command-palette-list .menu-heading')].map((heading) => heading.textContent);

/** A palette open on the first render, with the fixture's items, and whatever else the test gives it. */
function open(props: Partial<CommandPaletteProps> = {}): ReturnType<typeof render> {
  return render(
    <CommandPalette label="Search" items={ITEMS} onAction={() => undefined} defaultOpen {...props} />,
  );
}

/** Types into the field as a person would, a change the field's React handler sees. */
function typeQuery(value: string): void {
  fireEvent.change(input(), { target: { value } });
}

/** Presses the palette's shortcut on the page, from wherever focus is. */
function pressShortcut(init: KeyboardEventInit = { key: 'k', metaKey: true }): void {
  fireEvent.keyDown(document.activeElement ?? document.body, init);
}

/** A button that opens the palette through its state, as an app's own search button does. */
function Triggered(props: Partial<CommandPaletteProps>): ReactElement {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        onPress={() => {
          setOpen(true);
        }}
      >
        Open search
      </Button>
      <CommandPalette
        label="Search"
        items={ITEMS}
        onAction={() => undefined}
        {...props}
        isOpen={isOpen}
        onOpenChange={setOpen}
      />
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('CommandPalette', () => {
  it('is a dialog named by its label, over a field named by it too, with the label as the placeholder', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Search' });
    expect(dialog).toHaveClass('command-palette-content');
    expect(input()).toHaveClass('command-palette-input');
    expect(input()).toHaveAttribute('placeholder', 'Search');
    expect(panel().className).toBe('overlay command-palette');
    expect(document.querySelector('.command-palette-overlay')).toHaveClass('overlay-scrim');
  });

  it('shows labels.placeholder in the field when given', () => {
    open({ labels: { placeholder: 'Search pages, accounts and payees' } });
    expect(input()).toHaveAttribute('placeholder', 'Search pages, accounts and payees');
  });

  it('wires the field to the list as an autocomplete with no browser suggestions', () => {
    open();
    expect(input()).toHaveAttribute('aria-autocomplete', 'list');
    expect(input()).toHaveAttribute('autocomplete', 'off');
    expect(input()).toHaveAttribute('spellcheck', 'false');
    expect(input()).toHaveAttribute('aria-controls', screen.getByRole('menu').id);
  });

  it('puts focus in the field on open', () => {
    open();
    expect(input()).toHaveFocus();
  });

  it('draws the field row in order: the glass, the field, the spinner while loading, then the Esc key', () => {
    open({ isLoading: true });
    const field = document.querySelector('.command-palette-field');
    const parts = [...(field?.querySelectorAll('svg.command-palette-glass, input, .spinner, kbd') ?? [])];
    expect(parts.map((part) => part.getAttribute('class'))).toEqual([
      expect.stringContaining('command-palette-glass'),
      'command-palette-input',
      expect.stringContaining('command-palette-spinner'),
      'kbd',
    ]);
    expect(field?.querySelector('.command-palette-glass')).toHaveAttribute('aria-hidden', 'true');
    expect(field?.querySelector('kbd')).toHaveTextContent('Esc');
  });

  it('draws the key hints in a footer, in the labels given', () => {
    open({ labels: { move: 'pour aller', open: 'pour ouvrir', escape: 'Échap' } });
    const footer = document.querySelector('.command-palette-footer');
    expect(footer).toHaveTextContent('pour aller');
    expect(footer).toHaveTextContent('pour ouvrir');
    expect(footer?.querySelectorAll('kbd')).toHaveLength(3);
    expect(document.querySelector('.command-palette-field kbd')).toHaveTextContent('Échap');
  });

  it('groups the items: those with no section first, then each section in the order it is first seen', () => {
    open();
    expect(headings()).toEqual(['Pages', 'Accounts', 'Payees']);
    expect(rows()).toEqual([
      'New transaction',
      'Settings',
      'Transactions',
      'Budgets',
      'Reports',
      'Checking',
      'Savings',
      'Café Lumière',
    ]);
    expect(screen.getByRole('group', { name: 'Accounts' })).toContainElement(
      screen.getByRole('menuitem', { name: 'Savings' }),
    );
  });

  it("draws an item's icon, second line, end value and key, named by its label and described by the rest", () => {
    open();
    const checking = screen.getByRole('menuitem', { name: 'Checking' });
    expect(checking.querySelector('.menu-item-icon svg')).toBeInTheDocument();
    expect(checking.querySelector('.menu-item-description')).toHaveTextContent('Everyday');
    expect(checking.querySelector('.menu-item-end')).toHaveTextContent('$2,340.12');
    expect(checking).toHaveAccessibleDescription('$2,340.12 Everyday');
    const add = screen.getByRole('menuitem', { name: 'New transaction' });
    expect(add.querySelector('.menu-item-shortcut')).toHaveTextContent(/^(?:⌘|Ctrl) N$/);
    // Keywords match, and are never drawn.
    expect(add).not.toHaveTextContent('create');
  });

  it('keeps an item when every word of the query is in it, in any order, ignoring case and accents', () => {
    open();
    typeQuery('ACCOUNT every');
    expect(rows()).toEqual(['Transactions']);
    typeQuery('lumiere cafe');
    expect(rows()).toEqual(['Café Lumière']);
    typeQuery('café');
    expect(rows()).toEqual(['Café Lumière']);
  });

  it('searches the label, the second line and the keywords', () => {
    open();
    typeQuery('billing');
    expect(rows()).toEqual(['Settings']);
    typeQuery('spending');
    expect(rows()).toEqual(['Budgets']);
    typeQuery('rep');
    expect(rows()).toEqual(['Reports']);
  });

  it('hides a section none of whose items match', () => {
    open();
    typeQuery('savings');
    expect(headings()).toEqual(['Accounts']);
    expect(rows()).toEqual(['Savings']);
  });

  it('runs a filter of its own on the items themselves', () => {
    const filter = vi.fn((item: CommandPaletteItem, query: string) => item.section === query);
    open({ filter });
    typeQuery('Accounts');
    expect(rows()).toEqual(['Checking', 'Savings']);
    expect(filter).toHaveBeenCalledWith(itemWith('savings'), 'Accounts');
  });

  it('shows the items as given in manual mode, whatever the field holds, still in their sections', () => {
    const shown = [itemWith('reports'), itemWith('budgets'), itemWith('new')];
    open({ filter: null, items: shown, defaultInputValue: 'zzzz' });
    expect(input()).toHaveValue('zzzz');
    expect(rows()).toEqual(['New transaction', 'Reports', 'Budgets']);
    expect(headings()).toEqual(['Pages']);
    typeQuery('anything at all');
    expect(rows()).toEqual(['New transaction', 'Reports', 'Budgets']);
  });

  it('is controlled by inputValue, reporting each change to onInputChange', () => {
    const onInputChange = vi.fn();
    open({ inputValue: 'bud', onInputChange });
    expect(input()).toHaveValue('bud');
    expect(rows()).toEqual(['Budgets']);
    typeQuery('budg');
    expect(onInputChange).toHaveBeenCalledWith('budg');
    // The caller owns the value, and it still says "bud".
    expect(input()).toHaveValue('bud');
  });

  it('opens with an empty field each time, unless the field is controlled', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    await user.type(input(), 'bud');
    expect(input()).toHaveValue('bud');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    expect(input()).toHaveValue('');
  });

  it('draws the empty line with text and no match, and none with no text', () => {
    const { unmount } = open({ items: [] });
    expect(document.querySelector('.command-palette-empty')).not.toBeInTheDocument();
    unmount();
    open({ labels: { empty: 'Nothing found' } });
    typeQuery('zzzz');
    expect(rows()).toEqual([]);
    expect(document.querySelector('.command-palette-empty')).toHaveTextContent('Nothing found');
  });

  it('draws the 24px spinner named labels.loading while loading, and keeps the list', () => {
    const { unmount } = open({ isLoading: true });
    const spinner = screen.getByRole('progressbar', { name: 'Loading' });
    expect(spinner).toHaveClass('spinner', 'spinner-md', 'command-palette-spinner');
    expect(rows()).toHaveLength(8);
    unmount();
    open({ isLoading: true, labels: { loading: 'Searching' } });
    expect(screen.getByRole('progressbar', { name: 'Searching' })).toBeInTheDocument();
  });

  it('draws no spinner while not loading', () => {
    open();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('holds the empty line back while loading, since a list still loading has not found nothing', () => {
    open({ filter: null, items: [], isLoading: true, defaultInputValue: 'zzzz' });
    expect(document.querySelector('.command-palette-empty')).not.toBeInTheDocument();
  });

  it('is controlled by isOpen, and tells onOpenChange when Escape asks to close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        label="Search"
        items={ITEMS}
        onAction={() => undefined}
        isOpen
        onOpenChange={onOpenChange}
      />,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    // The caller owns the state, and it still says open.
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('opens from defaultOpen and closes on its own', async () => {
    const user = userEvent.setup();
    open();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts className on the panel, after its classes, and ref on the dialog', () => {
    const ref = createRef<HTMLElement>();
    open({ className: 'mine', ref });
    expect(panel().className).toBe('overlay command-palette mine');
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });

  it('copies the theme of the trigger it opened from onto the panel', async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Triggered />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    expect(document.querySelector('.command-palette-overlay')).not.toHaveAttribute('data-theme');
  });

  it('keeps the page and its other parts private: the package exports CommandPalette and no trigger', () => {
    expect(library).toHaveProperty('CommandPalette');
    expect(library).not.toHaveProperty('CommandPaletteTrigger');
    expect(library).not.toHaveProperty('useRecents');
    expect(library).not.toHaveProperty('parseShortcut');
  });
});

describe('CommandPalette keys', () => {
  it('closes on Escape at once, with text in the field and a row active', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    await user.type(input(), 'budg');
    // Typing forward gives the first row the virtual focus.
    await waitFor(() => {
      expect(input()).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Budgets' }).id,
      );
    });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves the active row with the arrows, wrapping at both ends, while focus stays in the field', async () => {
    const user = userEvent.setup();
    open();
    typeQuery('a');
    const names = rows();
    const active = (): string | undefined => {
      const id = input().getAttribute('aria-activedescendant');
      return id === null
        ? undefined
        : document.getElementById(id)?.querySelector('.menu-item-label')?.textContent;
    };
    await user.keyboard('{ArrowDown}');
    expect(active()).toBe(names[0]);
    await user.keyboard('{ArrowUp}');
    expect(active()).toBe(names.at(-1));
    await user.keyboard('{ArrowDown}');
    expect(active()).toBe(names[0]);
    await user.keyboard('{End}');
    expect(active()).toBe(names.at(-1));
    await user.keyboard('{Home}');
    expect(active()).toBe(names[0]);
    expect(input()).toHaveFocus();
  });

  it('runs the active item on Enter, once, with the item as given, after the palette has closed', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onAction = vi.fn((item: CommandPaletteItem) => {
      calls.push(
        `action ${String(item.id)}, open ${String(document.querySelector('.command-palette') !== null)}`,
      );
    });
    const onOpenChange = vi.fn((isOpen: boolean) => {
      calls.push(`openChange ${String(isOpen)}`);
    });
    render(
      <CommandPalette
        label="Search"
        items={ITEMS}
        onAction={onAction}
        onOpenChange={onOpenChange}
        defaultOpen
      />,
    );
    await user.type(input(), 'budg');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(onAction).toHaveBeenCalled();
    });
    expect(onAction).toHaveBeenCalledExactlyOnceWith(itemWith('budgets'));
    expect(onAction.mock.calls[0]?.[0]).toBe(itemWith('budgets'));
    expect(calls).toEqual(['openChange false', 'action budgets, open false']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('gives focus back to what opened it before it runs onAction', async () => {
    const user = userEvent.setup();
    let focused: Element | null = null;
    render(
      <Triggered
        onAction={() => {
          focused = document.activeElement;
        }}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Open search' });
    await user.click(trigger);
    await user.type(input(), 'rep');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(focused).not.toBeNull();
    });
    expect(focused).toBe(trigger);
  });

  it("keeps Tab in the field, the dialog's one tab stop", async () => {
    const user = userEvent.setup();
    open();
    await user.type(input(), 'bud');
    await user.tab();
    expect(input()).toHaveFocus();
    await user.tab({ shift: true });
    expect(input()).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('chooses nothing on Enter while a composition is under way', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    open({ onAction });
    await user.type(input(), 'budg');
    fireEvent.keyDown(input(), { key: 'Enter', isComposing: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('never runs an earlier choice on a later close it did not make', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    // A caller that keeps the palette open when a choice asks to close it.
    const { rerender } = render(
      <CommandPalette label="Search" items={ITEMS} onAction={onAction} isOpen onOpenChange={onOpenChange} />,
    );
    await user.type(input(), 'budg{Enter}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Escape asks to close for no choice, and the caller closes it.
    await user.keyboard('{Escape}');
    rerender(
      <CommandPalette
        label="Search"
        items={ITEMS}
        onAction={onAction}
        isOpen={false}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('drops a choice the caller kept open when the shortcut closes it', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    const props = { label: 'Search', items: ITEMS, onAction, onOpenChange };
    // A caller that keeps the palette open when a choice asks to close it.
    const { rerender } = render(<CommandPalette {...props} isOpen />);
    await user.type(input(), 'budg{Enter}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    onOpenChange.mockClear();
    // The shortcut asks to close for no choice, and the caller closes it.
    pressShortcut();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    rerender(<CommandPalette {...props} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('drops a pending choice when it opens again during its exit', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const props = { label: 'Search', items: ITEMS, onAction, onOpenChange: () => undefined };
    const { rerender } = render(<CommandPalette {...props} isOpen />);
    // jsdom runs no animation, so the panel is given an exit that lasts until the test ends it, as the 180ms
    // fade does in a browser: React Aria keeps the panel on the page until it finishes.
    let finish = (): void => undefined;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    Object.defineProperty(panel(), 'getAnimations', {
      value: () => [{ playState: 'running', finished }],
      configurable: true,
    });
    await user.type(input(), 'budg{Enter}');
    rerender(<CommandPalette {...props} isOpen={false} />);
    expect(panel()).toHaveAttribute('data-exiting');
    // Opened again before the exit ends, so the panel never left the page for that choice. Opening drops it,
    // and the caller then closes the palette itself, which is no close of the palette's own.
    rerender(<CommandPalette {...props} isOpen />);
    rerender(<CommandPalette {...props} isOpen={false} />);
    await act(async () => {
      finish();
      await finished;
    });
    await waitFor(() => {
      expect(document.querySelector('.command-palette')).not.toBeInTheDocument();
    });
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('chooses a row on a press, and closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    open({ onAction });
    await user.click(screen.getByRole('menuitem', { name: 'Savings' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledExactlyOnceWith(itemWith('savings'));
    });
  });
});

describe('CommandPalette shortcut', () => {
  it('opens and closes on Mod+K, with Cmd or with Ctrl', () => {
    render(<CommandPalette label="Search" items={ITEMS} onAction={() => undefined} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut({ key: 'k', metaKey: true });
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    expect(input()).toHaveFocus();
    pressShortcut({ key: 'k', metaKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut({ key: 'K', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    pressShortcut({ key: 'k', ctrlKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('takes the key from the page it handles, and tells onOpenChange', () => {
    const onOpenChange = vi.fn();
    render(
      <CommandPalette label="Search" items={ITEMS} onAction={() => undefined} onOpenChange={onOpenChange} />,
    );
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true });
    act(() => {
      document.body.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('ignores Mod+K with Alt down, with no modifier, or another key', () => {
    render(<CommandPalette label="Search" items={ITEMS} onAction={() => undefined} />);
    pressShortcut({ key: 'k', metaKey: true, altKey: true });
    pressShortcut({ key: 'k' });
    pressShortcut({ key: 'j', metaKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('leaves a key that something on the page has taken, and one typed while composing', () => {
    render(
      <>
        <div
          data-testid="editor"
          ref={(element) => {
            element?.addEventListener('keydown', (event) => {
              event.preventDefault();
            });
          }}
        />
        <CommandPalette label="Search" items={ITEMS} onAction={() => undefined} />
      </>,
    );
    fireEvent.keyDown(screen.getByTestId('editor'), { key: 'k', metaKey: true });
    pressShortcut({ key: 'k', metaKey: true, isComposing: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is ignored while another modal is open, and works once it has closed', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dialog defaultOpen title="Rename the workspace" />
        <CommandPalette label="Search" items={ITEMS} onAction={() => undefined} />
      </>,
    );
    expect(screen.getByRole('dialog', { name: 'Rename the workspace' })).toBeInTheDocument();
    pressShortcut();
    expect(screen.queryByRole('dialog', { name: 'Search' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut();
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('installs no listener with shortcut false, and one otherwise', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const ownListeners = (): number =>
      add.mock.calls.filter(([type, , options]) => type === 'keydown' && options === undefined).length;
    const { unmount } = render(
      <CommandPalette label="Search" items={ITEMS} onAction={() => undefined} shortcut={false} />,
    );
    expect(ownListeners()).toBe(0);
    pressShortcut();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    render(<CommandPalette label="Search" items={ITEMS} onAction={() => undefined} />);
    expect(ownListeners()).toBe(1);
  });

  it('opens on Ctrl+K on a Persian layout, where the key types the letter noon', () => {
    render(<CommandPalette label="Search" items={ITEMS} onAction={() => undefined} />);
    pressShortcut({ key: '\u0646', code: 'KeyK', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('opens on a shortcut of its own, and not on Mod+K', () => {
    render(<CommandPalette label="Search" items={ITEMS} onAction={() => undefined} shortcut="Mod+J" />);
    pressShortcut({ key: 'k', metaKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut({ key: 'j', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('removes its listener when it leaves the page', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<CommandPalette label="Search" items={ITEMS} onAction={() => undefined} />);
    unmount();
    expect(remove.mock.calls.some(([type, , options]) => type === 'keydown' && options === undefined)).toBe(
      true,
    );
  });
});

describe('CommandPalette recents', () => {
  /** The rows of the Recent section, top to bottom, or null when there is none. */
  const recent = (): string[] | null => {
    const group = screen.queryByRole('group', { name: 'Recent' });
    return group === null
      ? null
      : within(group)
          .queryAllByRole('menuitem')
          .map((row) => row.querySelector('.menu-item-label')?.textContent ?? '');
  };

  it('shows the remembered items first, newest first, under Recent, while the field is empty', () => {
    localStorage.setItem(ENTRY, '["savings","budgets"]');
    open({ storageKey: 'search' });
    expect(headings()[0]).toBe('Recent');
    expect(recent()).toEqual(['Savings', 'Budgets']);
    // The recent copies come before every item, which are all still listed.
    expect(rows()).toHaveLength(10);
    typeQuery('sav');
    expect(recent()).toBeNull();
    expect(rows()).toEqual(['Savings']);
  });

  it('drops an id that is no longer an item, and shows at most recentLimit', () => {
    localStorage.setItem(ENTRY, '["gone","savings","budgets","reports"]');
    const { unmount } = open({ storageKey: 'search' });
    expect(recent()).toEqual(['Savings', 'Budgets', 'Reports']);
    unmount();
    open({ storageKey: 'search', recentLimit: 2 });
    expect(recent()).toEqual(['Savings', 'Budgets']);
  });

  it('shows no Recent with no storage key, or nothing remembered', () => {
    localStorage.setItem(ENTRY, '["savings"]');
    const { unmount } = open();
    expect(recent()).toBeNull();
    unmount();
    open({ storageKey: 'nothing-here' });
    expect(recent()).toBeNull();
  });

  it('remembers a chosen item at the front, and moves a repeat rather than doubling it', async () => {
    const user = userEvent.setup();
    localStorage.setItem(ENTRY, '["savings","budgets"]');
    render(<Triggered storageKey="search" />);
    const trigger = screen.getByRole('button', { name: 'Open search' });
    await user.click(trigger);
    await user.type(input(), 'rep{Enter}');
    expect(JSON.parse(localStorage.getItem(ENTRY) ?? 'null')).toEqual(['reports', 'savings', 'budgets']);
    await user.click(trigger);
    expect(recent()).toEqual(['Reports', 'Savings', 'Budgets']);
    await user.type(input(), 'budg{Enter}');
    expect(JSON.parse(localStorage.getItem(ENTRY) ?? 'null')).toEqual(['budgets', 'reports', 'savings']);
  });

  it('runs onAction with the item as given when a Recent row is chosen', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    localStorage.setItem(ENTRY, '["budgets"]');
    open({ storageKey: 'search', onAction });
    await user.keyboard('{ArrowDown}');
    const row = within(screen.getByRole('group', { name: 'Recent' })).getByRole('menuitem', {
      name: 'Budgets',
    });
    expect(input()).toHaveAttribute('aria-activedescendant', row.id);
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledExactlyOnceWith(itemWith('budgets'));
    });
    expect(onAction.mock.calls[0]?.[0]).toBe(itemWith('budgets'));
  });

  it('stores nothing with recentIds, shows them, and reports the new list to onRecentChange', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const onRecentChange = vi.fn();
    open({ storageKey: 'search', recentIds: ['transactions', 'budgets'], onRecentChange });
    expect(recent()).toEqual(['Transactions', 'Budgets']);
    await user.type(input(), 'budg{Enter}');
    expect(onRecentChange).toHaveBeenCalledExactlyOnceWith(['budgets', 'transactions']);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('reports the list as stored, every id a string, to onRecentChange without recentIds', async () => {
    const user = userEvent.setup();
    const onRecentChange = vi.fn();
    const numbered = ITEMS.map((item, index) => ({ ...item, id: index + 1 }));
    localStorage.setItem(ENTRY, '["2","7"]');
    open({ storageKey: 'search', items: numbered, onRecentChange });
    await user.type(input(), 'budg{Enter}');
    // Budgets is the fourth item, so its id is the number 4.
    expect(onRecentChange).toHaveBeenCalledExactlyOnceWith(['4', '2', '7']);
    expect(JSON.parse(localStorage.getItem(ENTRY) ?? 'null')).toEqual(['4', '2', '7']);
  });

  it.each([
    ['unreadable JSON', '["savings"'],
    ['a list that is not one of ids', '{"savings":true}'],
  ])('shows no Recent and no error with %s stored', (_name, value) => {
    const error = vi.spyOn(console, 'error');
    localStorage.setItem(ENTRY, value);
    open({ storageKey: 'search' });
    expect(recent()).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  it('shows no Recent and still chooses, with no error, where the browser blocks storage', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error');
    const onAction = vi.fn();
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    open({ storageKey: 'search', onAction });
    expect(recent()).toBeNull();
    await user.type(input(), 'budg{Enter}');
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledOnce();
    });
    expect(error).not.toHaveBeenCalled();
  });
});

describe('CommandPalette status line', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  /** Lets `ms` of time pass, and React catch up. */
  function wait(ms: number): void {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('is in the page from the first render, empty while the field is', () => {
    open();
    expect(status()).toHaveAttribute('role', 'status');
    expect(status()).toBeEmptyDOMElement();
    wait(1000);
    expect(status()).toBeEmptyDOMElement();
  });

  it('says the count 600ms after typing pauses, and not before', () => {
    open();
    typeQuery('a');
    wait(599);
    expect(status()).toBeEmptyDOMElement();
    wait(1);
    expect(status()).toHaveTextContent(/^\d+ results$/);
    typeQuery('zzzz');
    wait(600);
    expect(status()).toHaveTextContent('No results for zzzz');
  });

  it('waits again for each keystroke, so typing never interrupts', () => {
    open();
    typeQuery('s');
    wait(300);
    typeQuery('sav');
    wait(300);
    expect(status()).toBeEmptyDOMElement();
    wait(299);
    expect(status()).toBeEmptyDOMElement();
    wait(1);
    // One result is singular, in the English default.
    expect(status()).toHaveTextContent(/^1 result$/);
  });

  it('says the words of labels.status, given the count and the query', () => {
    open({ labels: { status: (count, query) => `${String(count)} for ${query}` } });
    typeQuery('budgets');
    wait(600);
    expect(status()).toHaveTextContent('1 for budgets');
  });

  it('counts the items as given in manual mode', () => {
    open({ filter: null, items: ITEMS.slice(0, 3) });
    typeQuery('zzzz');
    wait(600);
    expect(status()).toHaveTextContent('3 results');
  });

  it('waits while loading, and says the count when the results land', () => {
    function Async(): ReactElement {
      const [query, setQuery] = useState('');
      const [isLoading, setLoading] = useState(false);
      const [results, setResults] = useState<CommandPaletteItem[]>([]);
      return (
        <CommandPalette
          label="Search"
          defaultOpen
          filter={null}
          items={results}
          isLoading={isLoading}
          inputValue={query}
          onInputChange={(value) => {
            setQuery(value);
            setLoading(true);
            setTimeout(() => {
              setResults(ITEMS.filter((item) => item.label.toLowerCase().includes(value)));
              setLoading(false);
            }, 1000);
          }}
          onAction={() => undefined}
        />
      );
    }
    render(<Async />);
    typeQuery('s');
    wait(600);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    expect(status()).toBeEmptyDOMElement();
    wait(400);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(status()).toHaveTextContent('6 results');
  });
});

describe('CommandPalette accessibility', () => {
  it('has no axe violations open with results', async () => {
    localStorage.setItem(ENTRY, '["savings"]');
    open({ storageKey: 'search' });
    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations with the empty line', async () => {
    open();
    typeQuery('zzzz');
    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations while loading', async () => {
    open({ isLoading: true });
    await expectNoA11yViolations(document.body);
  });
});
