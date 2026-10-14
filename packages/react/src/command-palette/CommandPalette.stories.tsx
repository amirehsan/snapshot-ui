import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowLeftRight,
  ChartColumn,
  Coffee,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  Wallet,
} from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Dialog } from '../dialog';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { tokenColor, washColor } from '../stories/paint';
import { TextField } from '../text-field';
import { CommandPalette, type CommandPaletteItem, type CommandPaletteProps } from './CommandPalette';

/**
 * A money app's index: two items with no section, then accounts, pages and payees, with icons, second lines,
 * words that match and are not drawn, balances at the end and key hints.
 */
const ITEMS: CommandPaletteItem[] = [
  {
    id: 'checking',
    label: 'Checking',
    description: 'Everyday',
    icon: <Landmark />,
    end: '$2,340.12',
    section: 'Accounts',
  },
  {
    id: 'savings',
    label: 'Savings',
    description: 'Emergency buffer',
    icon: <Wallet />,
    end: '$10,050.00',
    section: 'Accounts',
  },
  { id: 'credit', label: 'Credit card', icon: <CreditCard />, end: '$412.30', section: 'Accounts' },
  { id: 'new', label: 'New transaction', icon: <Plus />, keywords: 'add', shortcut: 'Mod N' },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Every account',
    icon: <ArrowLeftRight />,
    section: 'Pages',
  },
  { id: 'budgets', label: 'Budgets', icon: <PiggyBank />, keywords: 'spending limits', section: 'Pages' },
  { id: 'reports', label: 'Reports', icon: <ChartColumn />, shortcut: 'Mod R', section: 'Pages' },
  { id: 'settings', label: 'Settings', description: 'Profile, billing and security', icon: <Settings /> },
  {
    id: 'rent',
    label: 'Rent',
    description: 'Paid on the 1st',
    icon: <Receipt />,
    end: '$1,850.00',
    section: 'Payees',
  },
  {
    id: 'cafe',
    label: 'Café Lumière',
    description: 'Coffee and pastries',
    icon: <Coffee />,
    end: '$4.50',
    section: 'Payees',
  },
];

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/** The viewport's width without a scrollbar, which is what the fixed scrim spans. */
const viewportWidth = (): number => document.documentElement.clientWidth;

/** Resolves after two animation frames, the time React Aria takes to give focus back and the palette to act. */
const twoFrames = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

/**
 * Resolves once the open palette has entered and every transition on it and inside it has finished, so a play
 * reads its box at rest and not 8px low and transparent.
 */
async function atRest(): Promise<HTMLElement> {
  const panel = await waitFor(async () => {
    const found = only('.command-palette');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  // The spinner turns forever, so only the animations that end are waited for.
  await Promise.all(
    panel
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
      .map((animation) => animation.finished.catch(() => null)),
  );
  return panel;
}

/** The palette's field. */
const field = (): HTMLElement => within(document.body).getByRole('textbox', { name: 'Search' });

/** The row the keyboard has made active: the one the field points at. */
function activeRow(): HTMLElement | null {
  const id = field().getAttribute('aria-activedescendant');
  return id === null ? null : document.getElementById(id);
}

/** The label of a row. */
const labelOf = (row: Element | null): string | undefined =>
  row?.querySelector('.menu-item-label')?.textContent ?? undefined;

/** The search button and its palette, opened through the button's state, open on the first render by default. */
function Opened({
  defaultOpen = true,
  ...args
}: CommandPaletteProps & { defaultOpen?: boolean }): ReactElement {
  const [isOpen, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button
        variant="secondary"
        onPress={() => {
          setOpen(true);
        }}
      >
        Search
      </Button>
      <CommandPalette {...args} isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
}

/** The palette closed, with a line under the button that says what was last opened from it. */
function WithResult(args: CommandPaletteProps): ReactElement {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <Opened
        {...args}
        defaultOpen={false}
        onAction={(item) => {
          setChosen(item.label);
        }}
      />
      <p data-testid="result">{chosen === null ? 'Nothing opened yet.' : `Opened ${chosen}.`}</p>
    </div>
  );
}

/** A note field beside the search button, which onAction focuses, as an app moving on to a page would. */
function NoteAfterAction(args: CommandPaletteProps): ReactElement {
  const [isOpen, setOpen] = useState(false);
  const note = useRef<HTMLInputElement>(null);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <Button
        variant="secondary"
        onPress={() => {
          setOpen(true);
        }}
      >
        Search
      </Button>
      <TextField label="Note" inputRef={note} />
      <CommandPalette
        {...args}
        isOpen={isOpen}
        onOpenChange={setOpen}
        onAction={() => {
          note.current?.focus();
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Components/CommandPalette',
  component: CommandPalette,
  args: { label: 'Search', items: ITEMS, onAction: () => undefined },
  parameters: {
    // Every story opens a modal, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '560px' } },
    a11y: {
      config: {
        rules: [
          ...MENU_ROW_A11Y.config.rules,
          // Axe's scrollable-region check, skipped on the palette's list alone, the one scroller, and still
          // skipping the select and textarea axe skips by default. The field keeps focus and owns the list
          // through aria-controls and aria-activedescendant, as a combobox owns its popup, which axe exempts:
          // the arrows, Home, End and the page keys move the active row, and React Aria scrolls it into view
          // (the Recent and Keys stories show it). A tab stop on the list would make the field no longer the
          // dialog's only one. Recorded in docs/design-system.md ("CommandPalette").
          {
            id: 'scrollable-region-focusable',
            selector: '*:not(select, textarea, .command-palette-list)',
          },
        ],
      },
    },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Opened with nothing typed: the remembered items first, under Recent, then everything. The surface floats
 * 12vh from the top of the viewport, so the list grows down from a field that stays put. The list is longer
 * than the surface, and the keyboard reaches all of it from the field: Arrow Up wraps to the last row, which
 * the list scrolls into view. The play then puts the list back at rest for the picture.
 */
export const Recent: Story = {
  args: { recentIds: ['transactions', 'budgets'] },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    const [first] = within(document.body).getAllByRole('group');
    if (!first) throw new Error('No section');
    await expect(first).toHaveAccessibleName('Recent');
    await expect(
      within(first)
        .getAllByRole('menuitem')
        .map((row) => labelOf(row)),
    ).toEqual(['Transactions', 'Budgets']);
    await expect(Math.abs(panel.getBoundingClientRect().top - window.innerHeight * 0.12)).toBeLessThanOrEqual(
      1,
    );
    await waitFor(() => expect(field()).toHaveFocus());
    const list = only('.command-palette-list');
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    await expect(list.scrollTop).toBe(0);
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(labelOf(activeRow())).toBe('Café Lumière'));
    const last = activeRow();
    if (!last) throw new Error('No active row');
    await waitFor(() => expect(list.scrollTop).toBeGreaterThan(0));
    const box = list.getBoundingClientRect();
    const row = last.getBoundingClientRect();
    await expect(row.top).toBeGreaterThanOrEqual(box.top - 0.5);
    await expect(row.bottom).toBeLessThanOrEqual(box.bottom + 0.5);
    // Back to rest: Arrow Left gives the field its caret back and leaves no row active, and the list returns
    // to the top, so the picture is the palette as it opened.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(field()).not.toHaveAttribute('aria-activedescendant'));
    list.scrollTop = 0;
    await waitFor(() => expect(list.querySelector('.menu-item[data-focus-visible]')).toBeNull());
    // A list that has scrolled keeps Chrome's scrolling layer, which rasterizes the key chip's corners a few
    // pixels differently from a list that never scrolled, and which of the two the picture gets depends on
    // timing. Hiding the list for a frame drops the layer, so it paints as it opened, every run.
    list.style.display = 'none';
    await twoFrames();
    list.style.removeProperty('display');
    await twoFrames();
    await expect(list.scrollTop).toBe(0);
  },
};

/**
 * Results for "re" in their sections, with icons, balances and a key, and the first row active from the
 * keyboard: the ink fill with every part in canvas, because the field keeps DOM focus and the fill is the
 * only sign of where Enter goes.
 */
export const Results: Story = {
  args: { defaultInputValue: 're' },
  render: (args) => <Opened {...args} />,
  play: async () => {
    await atRest();
    await waitFor(() => expect(field()).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(labelOf(activeRow())).toBe('Credit card'));
    const row = activeRow();
    if (!row) throw new Error('No active row');
    await expect(row).toHaveAttribute('data-focus-visible', 'true');
    await expect(getComputedStyle(row).backgroundColor).toBe(tokenColor('--color-ink'));
    const end = row.querySelector('.menu-item-end');
    if (!end) throw new Error('No end value');
    await expect(getComputedStyle(end).color).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(row).outlineStyle).toBe('none');
  },
};

/** Text that matches nothing: the empty line, centred in a body that keeps its height. */
export const NoMatch: Story = {
  args: { defaultInputValue: 'zzzzqx' },
  render: (args) => <Opened {...args} />,
  play: async () => {
    await atRest();
    await expect(only('.command-palette-empty')).toHaveTextContent('No results');
    const floor = Math.min(20 * 16, window.innerHeight * 0.5);
    await expect(only('.command-palette-body').getBoundingClientRect().height).toBeGreaterThanOrEqual(
      floor - 0.5,
    );
  },
};

/** While the app loads results, the spinner turns at the end of the field row, before the Esc key. */
export const Loading: Story = {
  args: { isLoading: true, defaultInputValue: 'tr' },
  render: (args) => <Opened {...args} />,
  play: async () => {
    await atRest();
    const spinner = within(document.body).getByRole('progressbar', { name: 'Loading' });
    const key = only('.command-palette-field kbd');
    await expect(spinner.getBoundingClientRect().right).toBeLessThanOrEqual(key.getBoundingClientRect().left);
  },
};

/**
 * A phone, in the 375px mode: the surface is the viewport less 16px on each side, a long unbroken second line
 * breaks anywhere, and nothing scrolls sideways. The surface is portaled, so the mode's width is what narrows
 * it. The key hints hide under a coarse pointer, which this runner does not have; the docs test checks them on
 * a touch screen.
 */
export const Narrow: Story = {
  args: {
    items: [
      ...ITEMS,
      {
        id: 'joint',
        label: 'Joint',
        description: 'Shared with ada.lovelace.and.charles.babbage@analytical-engine.example',
        icon: <Landmark />,
        end: '$412.30',
        section: 'Accounts',
      },
    ],
  },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    await expect(panel.getBoundingClientRect().width).toBeCloseTo(Math.min(640, viewportWidth() - 32), 1);
    const body = only('.command-palette-body');
    for (const element of [panel, body, ...body.querySelectorAll<HTMLElement>('.menu, .menu-item')]) {
      await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * Opened from a button in a dark card, the palette is dark while the page stays light, and the scrim keeps the
 * page's opacity. The play opens it from the keyboard, so the button holds focus when the palette opens.
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
          <Opened {...args} defaultOpen={false} />
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-theme', 'dark');
    await expect(only('.command-palette-overlay')).not.toHaveAttribute('data-theme');
    await expect(getComputedStyle(panel).backgroundColor).toBe(
      tokenColor('--color-float', canvas.getByTestId('dark-scope')),
    );
  },
};

/**
 * Every key, from the keyboard alone: Arrow Down past the last row comes back to the first, Arrow Up from the
 * first goes to the last, Home and End jump, Enter opens the row, and Escape closes at once with text typed.
 */
export const Keys: Story = {
  tags: ['no-visual'],
  render: (args) => <WithResult {...args} />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Search' });
    await userEvent.click(trigger);
    await atRest();
    // The whole list is longer than the surface, so Page Down moves the active row by a page of rows, past
    // the first and short of the last, and Page Up comes back up.
    const list = only('.command-palette-list');
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    await userEvent.keyboard('{ArrowDown}');
    await expect(labelOf(activeRow())).toBe('New transaction');
    await userEvent.keyboard('{PageDown}');
    const paged = labelOf(activeRow());
    await expect(paged).not.toBe('New transaction');
    await expect(paged).not.toBe('Café Lumière');
    await waitFor(() => expect(list.scrollTop).toBeGreaterThan(0));
    await userEvent.keyboard('{PageUp}');
    await expect(labelOf(activeRow())).not.toBe(paged);
    await userEvent.type(field(), 're');
    const names = within(document.body)
      .getAllByRole('menuitem')
      .map((row) => labelOf(row));
    await expect(names).toEqual(['Credit card', 'Reports', 'Rent', 'Café Lumière']);
    // Typing forward makes the first row active.
    await waitFor(() => expect(labelOf(activeRow())).toBe('Credit card'));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect(labelOf(activeRow())).toBe('Café Lumière');
    await userEvent.keyboard('{ArrowDown}');
    await expect(labelOf(activeRow())).toBe('Credit card');
    await userEvent.keyboard('{ArrowUp}');
    await expect(labelOf(activeRow())).toBe('Café Lumière');
    await userEvent.keyboard('{Home}');
    await expect(labelOf(activeRow())).toBe('Credit card');
    await userEvent.keyboard('{End}');
    await expect(labelOf(activeRow())).toBe('Café Lumière');
    await expect(field()).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByTestId('result')).toHaveTextContent('Opened Café Lumière.'));
    await expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await atRest();
    await userEvent.type(field(), 'bud');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** The pointer washes the row it is on, never the ink fill, and a press opens it and closes the palette. */
export const PointerWash: Story = {
  tags: ['no-visual'],
  render: (args) => <WithResult {...args} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await atRest();
    const budgets = within(document.body).getByRole('menuitem', { name: 'Budgets' });
    await userEvent.hover(budgets);
    await waitFor(() => expect(budgets).toHaveAttribute('data-focused', 'true'));
    await expect(budgets).not.toHaveAttribute('data-focus-visible');
    await expect(getComputedStyle(budgets).backgroundColor).toBe(washColor());
    await expect(getComputedStyle(budgets).backgroundColor).not.toBe(tokenColor('--color-ink'));
    await expect(field()).toHaveFocus();
    await userEvent.click(budgets);
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByTestId('result')).toHaveTextContent('Opened Budgets.'));
  },
};

/**
 * The palette closes and gives focus back before it runs onAction, so a field that onAction focuses keeps
 * focus: React Aria's restore has already run, and nothing takes focus after the app moves it.
 */
export const OnActionKeepsFocus: Story = {
  tags: ['no-visual'],
  render: (args) => <NoteAfterAction {...args} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await atRest();
    await userEvent.type(field(), 'bud');
    await userEvent.keyboard('{Enter}');
    const note = canvas.getByRole('textbox', { name: 'Note' });
    await waitFor(() => expect(note).toBe(document.activeElement));
    await twoFrames();
    await expect(note).toBe(document.activeElement);
  },
};

/**
 * The shortcut does nothing while another modal is open, so a dialog is never skipped past; once it has
 * closed, the shortcut opens the palette and closes it again.
 */
export const ShortcutUnderADialog: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <>
      <Dialog defaultOpen title="Rename the workspace" />
      <Opened {...args} defaultOpen={false} />
    </>
  ),
  play: async () => {
    const body = within(document.body);
    await waitFor(() =>
      expect(body.getByRole('dialog', { name: 'Rename the workspace' })).toBeInTheDocument(),
    );
    await userEvent.keyboard('{Control>}k{/Control}');
    await expect(body.queryByRole('dialog', { name: 'Search' })).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(body.getByRole('dialog', { name: 'Search' })).toBeInTheDocument());
    await atRest();
    await userEvent.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Search' })).not.toBeInTheDocument());
  },
};

/** Typing keeps the sections that hold a match, in the order the items first named them, and hides the rest. */
export const Sections: Story = {
  tags: ['no-visual'],
  render: (args) => <Opened {...args} />,
  play: async () => {
    await atRest();
    const headings = (): string[] =>
      [...document.querySelectorAll('.command-palette-list .menu-heading')].map(
        (heading) => heading.textContent,
      );
    await expect(headings()).toEqual(['Accounts', 'Pages', 'Payees']);
    await userEvent.type(field(), 'b');
    await waitFor(() => expect(headings()).toEqual(['Accounts', 'Pages']));
    await expect(
      within(document.body)
        .getAllByRole('menuitem')
        .map((row) => labelOf(row)),
    ).toEqual(['Settings', 'Savings', 'Budgets']);
  },
};
