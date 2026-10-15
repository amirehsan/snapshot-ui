import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRef, useState, type ReactElement, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { FilterChip } from '../filter-chip';
import { PickerOption } from '../picker';
import type { PopoverProps } from '../popover/Popover';
import { SearchField } from '../search-field';
import { FilterBar, type FilterBarLabels } from './FilterBar';

/**
 * How many times the library's Popover has rendered outside a Select's state while it was a list's popover,
 * which is React Aria's hidden pass, through a spy that renders the real one.
 */
const hiddenPopovers = vi.hoisted(() => ({ count: 0 }));

vi.mock('../popover/Popover', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../popover/Popover')>();
  const { useContext } = await import('react');
  const { SelectStateContext } = await import('react-aria-components');
  return {
    ...actual,
    Popover: (props: PopoverProps) => {
      const state = useContext(SelectStateContext);
      if (String(props.className).includes('select-popover') && state === null) hiddenPopovers.count += 1;
      return actual.Popover(props);
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Axe's label-in-name check, skipped on option rows alone: a row is named by its label and described by its hint,
 * as the stories' MENU_ROW_A11Y scopes it. It still runs on every trigger and button.
 */
const ROW_RULE = { id: 'label-content-name-mismatch', selector: '*:not(.menu-item)' };

function element(selector: string, scope: ParentNode = document): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** The row, found by its class, since a modal popover hides it from the accessibility tree. */
const row = (): HTMLElement => element('.filter-bar-row');

/** The labels of the chips in the row, More included, in the order they show. */
const rowLabels = (): string[] =>
  [...row().querySelectorAll('.filter-chip-label')].map((label) => label.textContent);

/** The trigger of the row's chip named `label`. */
function rowTrigger(label: string): HTMLButtonElement {
  const found = [...row().querySelectorAll<HTMLButtonElement>('.filter-chip-trigger')].find(
    (trigger) => trigger.querySelector('.filter-chip-label')?.textContent === label,
  );
  if (!found) throw new Error(`No chip ${label} in the row`);
  return found;
}

/** The More button, by its class. */
const more = (): HTMLButtonElement => element('.filter-bar-more .filter-chip-trigger') as HTMLButtonElement;

/** The Filters button, by its class, since its name holds the count. */
const sheetButton = (): HTMLButtonElement => element('.filter-bar-sheet-button') as HTMLButtonElement;

const OPTIONS = (
  <>
    <PickerOption id="food">Food</PickerOption>
    <PickerOption id="rent">Rent</PickerOption>
    <PickerOption id="salary">Salary</PickerOption>
  </>
);

interface Values {
  category: Key | null;
  accounts: readonly Key[];
  amount: string | undefined;
  date: string | undefined;
  tags: readonly Key[];
}

const NONE: Values = { category: null, accounts: [], amount: undefined, date: undefined, tags: [] };

interface BarProps {
  initial?: Partial<Values>;
  /** Called with each chip's change, as an app writes its URL. */
  onWrite?: (name: keyof Values, value: unknown) => void;
  hasClearAll?: boolean;
  onClearAll?: () => void;
  activeCount?: number;
  formatCount?: (count: number) => string;
  labels?: Partial<FilterBarLabels>;
  search?: ReactNode;
  /** Wraps the chips in fragments, as an app that groups them does. */
  inFragments?: boolean;
}

/**
 * A household's filters, their values held by the test as an app holds them in its URL: Category (single),
 * Date (custom, secondary), Accounts (multiple), Tags (multiple, secondary) and Amount (custom), in that order.
 */
function Bar({
  initial,
  onWrite,
  hasClearAll = true,
  onClearAll,
  activeCount,
  formatCount,
  labels,
  search = <SearchField aria-label="Search transactions" />,
  inFragments = false,
}: BarProps): ReactElement {
  const [values, setValues] = useState<Values>({ ...NONE, ...initial });
  const write = <K extends keyof Values>(name: K, value: Values[K]): void => {
    setValues((current) => ({ ...current, [name]: value }));
    onWrite?.(name, value);
  };
  const category = (
    <FilterChip
      label="Category"
      selectionMode="single"
      value={values.category}
      onChange={(next) => {
        write('category', next);
      }}
    >
      {OPTIONS}
    </FilterChip>
  );
  const date = (
    <FilterChip
      label="Date"
      isSecondary
      valueLabel={values.date}
      onClear={() => {
        write('date', undefined);
      }}
    >
      {({ close }) => (
        <button
          type="button"
          onClick={() => {
            write('date', 'This month');
            close();
          }}
        >
          This month
        </button>
      )}
    </FilterChip>
  );
  const accounts = (
    <FilterChip
      label="Accounts"
      selectionMode="multiple"
      value={values.accounts}
      onChange={(next) => {
        write('accounts', next);
      }}
    >
      {OPTIONS}
    </FilterChip>
  );
  const tags = (
    <FilterChip
      label="Tags"
      selectionMode="multiple"
      isSecondary
      value={values.tags}
      onChange={(next) => {
        write('tags', next);
      }}
    >
      {OPTIONS}
    </FilterChip>
  );
  const amount = (
    <FilterChip
      label="Amount"
      valueLabel={values.amount}
      onClear={() => {
        write('amount', undefined);
      }}
    >
      <p>Two amounts</p>
    </FilterChip>
  );
  return (
    <FilterBar
      search={search}
      activeCount={activeCount}
      formatCount={formatCount}
      labels={labels}
      onClearAll={
        hasClearAll
          ? () => {
              setValues(NONE);
              onClearAll?.();
            }
          : undefined
      }
    >
      {inFragments ? (
        <>
          <>
            {category}
            {date}
          </>
          <>{accounts}</>
          <>
            {tags}
            <>{amount}</>
          </>
        </>
      ) : (
        <>
          {category}
          {date}
          {accounts}
          {tags}
          {amount}
        </>
      )}
    </FilterBar>
  );
}

describe('FilterBar', () => {
  it('is a group named Filters, or labels.filters, holding the chips, with the search first', () => {
    const { container, unmount } = render(<Bar />);
    const bar = element('.filter-bar', container);
    const group = screen.getByRole('group', { name: 'Filters' });
    expect(group).toBe(row());
    expect(bar.firstElementChild).toHaveClass('filter-bar-search');
    expect(within(element('.filter-bar-search', bar)).getByRole('searchbox')).toHaveAccessibleName(
      'Search transactions',
    );
    expect(bar.children[1]).toBe(group);
    for (const name of ['Category', 'Accounts', 'Amount']) {
      expect(within(group).getByRole('button', { name })).toHaveClass('filter-chip-trigger');
    }
    unmount();
    render(<Bar labels={{ filters: 'Filtres' }} search={false} />);
    expect(screen.getByRole('group', { name: 'Filtres' })).toBeInTheDocument();
    expect(document.querySelector('.filter-bar-search')).toBeNull();
  });

  it('counts active chips from props through fragments, and takes activeCount over it', () => {
    const { unmount } = render(
      <Bar inFragments initial={{ category: 'food', tags: ['rent'], amount: 'Over $100' }} />,
    );
    expect(element('.badge', sheetButton())).toHaveTextContent(/^3$/);
    expect(element('.badge', sheetButton())).toHaveClass('badge');
    expect(element('.badge', sheetButton()).className).toBe('badge');
    unmount();
    render(<Bar initial={{ category: 'food' }} activeCount={5} />);
    expect(element('.badge', sheetButton())).toHaveTextContent(/^5$/);
  });

  it('draws More only with an inactive secondary chip, and keeps a wrapped secondary chip in the row', () => {
    const noop = (): void => undefined;
    /** A secondary chip inside the app's own component, which the bar cannot read. */
    function Payee(): ReactElement {
      return (
        <FilterChip label="Payee" selectionMode="single" isSecondary value={null} onChange={noop}>
          {OPTIONS}
        </FilterChip>
      );
    }
    const primary = (
      <FilterChip label="Category" selectionMode="single" value={null} onChange={noop}>
        {OPTIONS}
      </FilterChip>
    );
    const { rerender, unmount } = render(<FilterBar>{primary}</FilterBar>);
    expect(document.querySelector('.filter-bar-more')).toBeNull();
    // Only a wrapped secondary chip: no More, and the chip stays in the row rather than vanish.
    rerender(
      <FilterBar>
        {primary}
        <Payee />
      </FilterBar>,
    );
    expect(document.querySelector('.filter-bar-more')).toBeNull();
    expect(rowLabels()).toEqual(['Category', 'Payee']);
    // A readable inactive secondary chip draws More; the wrapped one, which More cannot hold, stays in the row.
    rerender(
      <FilterBar>
        {primary}
        <Payee />
        <FilterChip label="Tags" selectionMode="multiple" isSecondary value={[]} onChange={noop}>
          {OPTIONS}
        </FilterChip>
      </FilterBar>,
    );
    expect(rowLabels()).toEqual(['Category', 'Payee', 'More']);
    unmount();
    // Every secondary chip active: no More.
    render(<Bar initial={{ date: 'This month', tags: ['rent'] }} />);
    expect(document.querySelector('.filter-bar-more')).toBeNull();
  });

  it('moves an inactive secondary chip into More and an active one into the row, after the primary ones', () => {
    const { unmount } = render(<Bar />);
    expect(rowLabels()).toEqual(['Category', 'Accounts', 'Amount', 'More']);
    unmount();
    render(<Bar initial={{ tags: ['rent'] }} />);
    expect(rowLabels()).toEqual(['Category', 'Accounts', 'Amount', 'Tags', 'More']);
    expect(rowTrigger('Tags').closest('.filter-chip')).toHaveAttribute('data-active', '');
  });

  it('opens More as a padded dialog named More, holding the inactive secondary chips as sections', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    expect(more()).toHaveAccessibleName('More');
    expect(more().closest('.filter-chip')).toHaveClass('filter-chip', 'filter-bar-more');
    expect(element('.filter-chip-chevron', more())).toHaveAttribute('aria-hidden', 'true');
    await user.click(more());
    const dialog = screen.getByRole('dialog', { name: 'More' });
    const panel = element('.filter-bar-more-panel');
    expect(panel).toHaveClass('popover', 'popover-padded');
    expect(panel).toContainElement(dialog);
    expect(more().closest('.filter-chip')).toHaveAttribute('data-open', '');
    expect(
      within(dialog)
        .getAllByRole('heading', { level: 3 })
        .map((title) => title.textContent),
    ).toEqual(['Date', 'Tags']);
    expect(within(dialog).getByRole('region', { name: 'Date' })).toHaveClass('filter-section');
    expect(within(dialog).getByRole('button', { name: 'Any Tags' })).toBeInTheDocument();
    // A custom chip's close closes the panel; focus goes back to More.
    await user.click(within(dialog).getByRole('button', { name: 'This month' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(rowLabels()).toEqual(['Category', 'Accounts', 'Amount', 'Date', 'More']);
    await waitFor(() => {
      expect(more()).toHaveFocus();
    });
  });

  it('keeps a chip in the open More panel after a choice makes it active, until the panel closes', async () => {
    const user = userEvent.setup();
    render(<Bar initial={{ date: 'This month' }} />);
    // Tags is the one chip behind More.
    await user.click(more());
    const dialog = screen.getByRole('dialog', { name: 'More' });
    await user.click(within(dialog).getByRole('button', { name: 'Any Tags' }));
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    // The list stays open in multiple mode; the section stays in the panel, and the row shows the chip at once.
    await user.keyboard('{Escape}');
    expect(within(dialog).getByRole('region', { name: 'Tags' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Rent Tags' })).toHaveFocus();
    expect(rowLabels()).toEqual(['Category', 'Accounts', 'Amount', 'Date', 'Tags', 'More']);
    // More stays while its panel is open, though nothing is left behind it; as the panel closes, More leaves,
    // and focus goes to the chip the panel made active, in the row.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('.filter-bar-more')).toBeNull();
    expect(rowTrigger('Tags')).toHaveFocus();
  });

  it('shows Clear all while any filter is active and onClearAll is given, calls it once, and puts focus on the first chip', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Bar />);
    expect(document.querySelector('.filter-bar-clear-all')).toBeNull();
    unmount();
    const { unmount: unmountNoHandler } = render(<Bar hasClearAll={false} initial={{ category: 'food' }} />);
    expect(document.querySelector('.filter-bar-clear-all')).toBeNull();
    unmountNoHandler();
    const onClearAll = vi.fn();
    render(<Bar onClearAll={onClearAll} initial={{ tags: ['rent'], amount: 'Over $100' }} />);
    const clearAll = screen.getByRole('button', { name: 'Clear all' });
    expect(clearAll).toHaveClass('button', 'button-tertiary', 'filter-bar-clear-all');
    // At the end of the bar, after the row.
    expect(clearAll.previousElementSibling).toBe(row());
    await user.click(clearAll);
    expect(onClearAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
    expect(rowTrigger('Category')).toHaveFocus();
  });

  it('gives focus to More after a secondary chip is cleared in the row', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Bar initial={{ tags: ['rent'] }} />);
    await user.click(screen.getByRole('button', { name: 'Clear Tags' }));
    expect(rowLabels()).toEqual(['Category', 'Accounts', 'Amount', 'More']);
    expect(more()).toHaveFocus();
    unmount();
    // With every secondary chip active there is no More; clearing one brings it back, and focus goes to it.
    render(<Bar initial={{ tags: ['rent'], date: 'This month' }} />);
    expect(document.querySelector('.filter-bar-more')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Clear Date' }));
    expect(more()).toHaveFocus();
    // A primary chip keeps focus on its own trigger.
    await user.click(rowTrigger('Accounts'));
    await user.click(screen.getByRole('option', { name: 'Food' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Clear Accounts' }));
    expect(rowTrigger('Accounts')).toHaveFocus();
  });

  it('keeps an open secondary chip in the row after its last option is unchecked, until the list closes, then focuses More', async () => {
    const user = userEvent.setup();
    render(<Bar initial={{ tags: ['rent'], date: 'This month' }} />);
    expect(document.querySelector('.filter-bar-more')).toBeNull();
    await user.click(rowTrigger('Tags'));
    const list = screen.getByRole('listbox', { name: 'Tags' });
    await user.click(within(list).getByRole('option', { name: 'Rent' }));
    // Inactive now, but its list is open: the chip stays in the row, and so does the list.
    expect(rowTrigger('Tags').closest('.filter-chip')).not.toHaveAttribute('data-active');
    expect(screen.getByRole('listbox', { name: 'Tags' })).toBe(list);
    expect(list.contains(document.activeElement)).toBe(true);
    // As the list closes the chip goes behind More, and More takes focus.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(rowLabels()).toEqual(['Category', 'Accounts', 'Amount', 'Date', 'More']);
    await waitFor(() => {
      expect(more()).toHaveFocus();
    });
  });

  it('keeps an open secondary custom chip in the row after its panel clears its value, until the panel closes, then focuses More', async () => {
    const user = userEvent.setup();
    /** A Date chip whose panel clears its own value and stays open. */
    function DateBar(): ReactElement {
      const [date, setDate] = useState<string | undefined>('This month');
      return (
        <FilterBar>
          <FilterChip label="Category" selectionMode="single" value={null} onChange={() => undefined}>
            {OPTIONS}
          </FilterChip>
          <FilterChip
            label="Date"
            isSecondary
            valueLabel={date}
            onClear={() => {
              setDate(undefined);
            }}
          >
            <button
              type="button"
              onClick={() => {
                setDate(undefined);
              }}
            >
              Any time
            </button>
          </FilterChip>
        </FilterBar>
      );
    }
    render(<DateBar />);
    expect(document.querySelector('.filter-bar-more')).toBeNull();
    await user.click(rowTrigger('Date'));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Any time' }));
    expect(rowTrigger('Date').closest('.filter-chip')).not.toHaveAttribute('data-active');
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(rowLabels()).toEqual(['Category', 'More']);
    await waitFor(() => {
      expect(more()).toHaveFocus();
    });
  });

  it('gives focus to the first chip when the sheet closes with the Filters button hidden, as a phone turned wide', async () => {
    const user = userEvent.setup();
    render(<Bar initial={{ category: 'food' }} />);
    await user.click(sheetButton());
    const sheet = screen.getByRole('dialog', { name: 'Filters' });
    // Turned past 768px with the sheet open: the stylesheet hides the Filters button and shows the row.
    sheetButton().style.display = 'none';
    await user.click(within(sheet).getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => {
      expect(rowTrigger('Category')).toHaveFocus();
    });
  });

  it('names the Filters button by its text and the count, written by formatCount', () => {
    const persian = (count: number): string =>
      String(count).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
    const { unmount } = render(<Bar initial={{ category: 'food', tags: ['rent'] }} formatCount={persian} />);
    expect(sheetButton()).toHaveAccessibleName('Filters ۲');
    expect(sheetButton()).toHaveClass('button', 'button-secondary');
    expect(element('svg', sheetButton())).toHaveAttribute('aria-hidden', 'true');
    unmount();
    render(<Bar />);
    expect(sheetButton()).toHaveAccessibleName('Filters');
    expect(sheetButton().querySelector('.badge')).toBeNull();
  });

  it('opens one sheet titled Filters holding every chip as a section in declared order', async () => {
    const user = userEvent.setup();
    render(<Bar initial={{ tags: ['rent'] }} />);
    await user.click(sheetButton());
    const sheet = screen.getByRole('dialog', { name: 'Filters' });
    expect(sheet).toHaveClass('sheet-content');
    expect(
      within(sheet)
        .getAllByRole('heading', { level: 3 })
        .map((title) => title.textContent),
    ).toEqual(['Category', 'Date', 'Accounts', 'Tags', 'Amount']);
    expect(within(sheet).getByRole('button', { name: 'Rent Tags' })).toBeInTheDocument();
    // The footer: Clear all while a filter is active, then Done.
    const footer = element('.sheet-footer', sheet);
    expect(
      within(footer)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Clear all', 'Done']);
    expect(within(footer).getByRole('button', { name: 'Done' })).toHaveClass('button', 'button-primary');
    expect(within(footer).getByRole('button', { name: 'Clear all' })).toHaveClass('button-tertiary');
  });

  it('writes each change at once while the sheet is open, with no draft', async () => {
    const user = userEvent.setup();
    const onWrite = vi.fn();
    render(<Bar onWrite={onWrite} />);
    await user.click(sheetButton());
    const sheet = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(within(sheet).getByRole('button', { name: 'Any Category' }));
    await user.click(screen.getByRole('option', { name: 'Salary' }));
    expect(onWrite).toHaveBeenLastCalledWith('category', 'salary');
    // The sheet is still open, the row behind it already shows the value, and the count follows.
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(rowTrigger('Category')).toHaveAccessibleName('Category Salary');
    expect(element('.badge', sheetButton())).toHaveTextContent(/^1$/);
  });

  it('closes the sheet on Done, named labels.done, and keeps focus on Done after Clear all in the sheet', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    render(
      <Bar
        initial={{ category: 'food' }}
        onClearAll={onClearAll}
        labels={{ done: 'Show 12 results', clearAll: 'Reset' }}
      />,
    );
    await user.click(sheetButton());
    const sheet = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(within(sheet).getByRole('button', { name: 'Reset' }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
    const done = within(sheet).getByRole('button', { name: 'Show 12 results' });
    expect(done).toHaveFocus();
    expect(within(sheet).queryByRole('button', { name: 'Reset' })).toBeNull();
    await user.click(done);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the panel and the sheet sections only while open', async () => {
    const user = userEvent.setup();
    hiddenPopovers.count = 0;
    render(<Bar initial={{ category: 'food', tags: ['rent'] }} />);
    expect(document.querySelector('.filter-section')).toBeNull();
    await user.click(more());
    expect(document.querySelectorAll('.filter-section')).toHaveLength(1);
    await user.keyboard('{Escape}');
    expect(document.querySelector('.filter-section')).toBeNull();
    await user.click(sheetButton());
    expect(document.querySelectorAll('.filter-section')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(document.querySelector('.filter-section')).toBeNull();
    // No list chip's library popover rendered in React Aria's hidden pass, in the row or a section.
    expect(hiddenPopovers.count).toBe(0);
  });

  it('passes className, ref and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <FilterBar className="mine" ref={ref} data-testid="filters">
        {false}
      </FilterBar>,
    );
    const bar = element('.filter-bar', container);
    expect(bar.className).toBe('filter-bar mine');
    expect(ref.current).toBe(bar);
    expect(bar).toHaveAttribute('data-testid', 'filters');
  });

  // One test per state, so each axe pass has its own time limit on a slow runner.
  const AXE_CASES: [
    name: string,
    bar: () => ReactElement,
    act?: (user: ReturnType<typeof userEvent.setup>) => Promise<void>,
  ][] = [
    ['at rest', () => <Bar />],
    [
      'with active chips',
      () => <Bar initial={{ category: 'food', tags: ['rent', 'salary'], amount: 'Over $100' }} />,
    ],
    [
      'with More open',
      () => <Bar />,
      async (user) => {
        await user.click(more());
        expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
      },
    ],
    [
      'with the sheet open and a list open in it',
      () => <Bar initial={{ category: 'food' }} />,
      async (user) => {
        await user.click(sheetButton());
        await user.click(screen.getByRole('button', { name: 'Any Tags' }));
        expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument();
      },
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, bar, then) => {
    const user = userEvent.setup();
    axe.configure({ rules: [ROW_RULE] });
    try {
      render(bar());
      if (then) await then(user);
      // An open panel or sheet portals to the body, so the whole body is checked.
      await expectNoA11yViolations(document.body);
    } finally {
      axe.reset();
    }
  });

  it('takes chips as children, in its types', () => {
    // The @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a filter bar holds its chips
    const withoutChildren = <FilterBar search={<SearchField aria-label="Search" />} />;
    expect(withoutChildren).toBeTruthy();
  });

  it('runs with no matchMedia, as a test environment may have none', async () => {
    const user = userEvent.setup();
    const stub = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    if (!stub) throw new Error('No matchMedia stub');
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true });
    try {
      render(<Bar />);
      await user.click(sheetButton());
      await user.click(screen.getByRole('button', { name: 'Any Category' }));
      expect(screen.getByRole('listbox', { name: 'Category' })).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, 'matchMedia', stub);
    }
  });
});
