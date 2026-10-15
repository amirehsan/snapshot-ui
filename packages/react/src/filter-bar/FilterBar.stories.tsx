import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { I18nProvider, type Key } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { RangeCalendar, type DateRange } from '../calendar';
import { FilterChip } from '../filter-chip';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { SearchField } from '../search-field';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { tokenColor, tokenPixels } from '../stories/paint';
import { PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { FilterBar, type FilterBarLabels, type FilterBarProps } from './FilterBar';

/**
 * Axe's settings for the stories that open a list: the Menu's row rule, and the scrollable-region check skipped
 * on the list alone, as FilterChip's stories set them. Every other rule, and those two everywhere else, still run.
 */
const LIST_A11Y = {
  config: {
    rules: [
      ...MENU_ROW_A11Y.config.rules,
      { id: 'scrollable-region-focusable', selector: '*:not(select, textarea, .select-list)' },
    ],
  },
};

const meta = {
  title: 'Components/FilterBar',
  component: FilterBar as ComponentType<Partial<FilterBarProps>>,
  parameters: {
    // The open stories open a panel or a sheet, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '560px' } },
    viewport: { options: VIEWPORT_OPTIONS },
  },
} satisfies Meta<Partial<FilterBarProps>>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** The row, by its class: a modal popover hides it from the accessibility tree. */
const rowOf = (scope: ParentNode): HTMLElement => find(scope, '.filter-bar-row');

/** The labels of the chips in the row, More included, in the order they show. */
const rowLabels = (scope: ParentNode): string[] =>
  [...rowOf(scope).querySelectorAll('.filter-chip-label')].map((label) => label.textContent);

/** The trigger of the row's chip, or More, whose label is `label`. */
function triggerOf(scope: ParentNode, label: string): HTMLElement {
  const found = [...rowOf(scope).querySelectorAll<HTMLElement>('.filter-chip-trigger')].find(
    (trigger) => trigger.querySelector('.filter-chip-label')?.textContent === label,
  );
  if (!found) throw new Error(`No chip ${label} in the row`);
  return found;
}

/** The open popover, once it has been placed and its entrance has finished. */
async function popoverAtRest(selector: string): Promise<HTMLElement> {
  const popover = await waitFor(async () => {
    const found = document.querySelector<HTMLElement>(selector);
    if (!found) throw new Error('No popover yet');
    await expect(found).toHaveAttribute('data-placement');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    popover.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return popover;
}

/** The open sheet, once it has scrolled in and taken focus, as the Sheet's stories wait for it. */
async function sheetAtRest(): Promise<HTMLElement> {
  return waitFor(
    async () => {
      const overlay = find(document, '.sheet-overlay');
      await expect(overlay).not.toHaveAttribute('data-entering');
      const sheet = find(document, '.sheet');
      await expect(sheet).toHaveAttribute('data-expanded');
      await expect(find(document, '.sheet-content').contains(document.activeElement)).toBe(true);
      return sheet;
    },
    { timeout: 5000 },
  );
}

/** Tabs until `target` has focus, as a keyboard reader arrives. */
async function tabTo(target: HTMLElement): Promise<void> {
  for (let step = 0; step < 16 && document.activeElement !== target; step += 1) await userEvent.tab();
  await expect(target).toHaveFocus();
}

/** A household budget's categories and accounts. */
const CATEGORIES: [id: string, name: string][] = [
  ['food', 'Food'],
  ['rent', 'Rent'],
  ['salary', 'Salary'],
  ['transport', 'Transport'],
  ['utilities', 'Utilities'],
  ['health', 'Health'],
];

const ACCOUNTS: [id: string, name: string][] = [
  ['checking', 'Checking'],
  ['savings', 'Savings'],
  ['card', 'Credit card'],
];

const optionsOf = (list: [id: string, name: string][]): ReactNode =>
  list.map(([id, name]) => (
    <PickerOption key={id} id={id}>
      {name}
    </PickerOption>
  ));

/** Whole dollars from minor units, written with no Intl: 12500 is "125". */
const dollars = (cents: number): string => String(Math.trunc(cents / 100));

function amountLabel(over: number | null, under: number | null): string | undefined {
  if (over !== null && under !== null) return `$${dollars(over)} to $${dollars(under)}`;
  if (over !== null) return `Over $${dollars(over)}`;
  if (under !== null) return `Under $${dollars(under)}`;
  return undefined;
}

/** The range as the app writes it, here its two ISO dates, with no Intl. */
const dateLabel = (range: DateRange | null): string | undefined =>
  range === null ? undefined : `${range.start} to ${range.end}`;

interface Values {
  category: Key | null;
  accounts: readonly Key[];
  over: number | null;
  under: number | null;
  date: DateRange | null;
  tags: readonly Key[];
}

const NONE: Values = { category: null, accounts: [], over: null, under: null, date: null, tags: [] };

interface TransactionsProps {
  initial?: Partial<Values>;
  labels?: Partial<FilterBarLabels>;
  formatCount?: (count: number) => string;
  /** The options of "Category", for the many-options story. */
  categories?: [id: string, name: string][];
  /** Words for a right-to-left page. */
  words?: { search: string; category: string; accounts: string; amount: string; date: string; tags: string };
}

const ENGLISH = {
  search: 'Search transactions',
  category: 'Category',
  accounts: 'Account',
  amount: 'Amount',
  date: 'Date',
  tags: 'Tags',
};

/**
 * A household's transactions: a search, "Category" (single), "Account" (multiple), "Amount" (two money
 * fields), "Date" (a range calendar, secondary) and "Tags" (multiple, secondary). Every value is local state,
 * as an app keeps it in its URL.
 */
function Transactions({
  initial,
  labels,
  formatCount,
  categories = CATEGORIES,
  words = ENGLISH,
}: TransactionsProps): ReactElement {
  const [values, setValues] = useState<Values>({ ...NONE, ...initial });
  const set = (patch: Partial<Values>): void => {
    setValues((current) => ({ ...current, ...patch }));
  };
  return (
    <FilterBar
      search={<SearchField aria-label={words.search} placeholder={words.search} />}
      labels={labels}
      formatCount={formatCount}
      onClearAll={() => {
        setValues(NONE);
      }}
    >
      <FilterChip
        label={words.category}
        selectionMode="single"
        value={values.category}
        onChange={(category) => {
          set({ category });
        }}
      >
        {optionsOf(categories)}
      </FilterChip>
      <FilterChip
        label={words.accounts}
        selectionMode="multiple"
        value={values.accounts}
        onChange={(accounts) => {
          set({ accounts });
        }}
      >
        {optionsOf(ACCOUNTS)}
      </FilterChip>
      <FilterChip
        label={words.amount}
        valueLabel={amountLabel(values.over, values.under)}
        onClear={() => {
          set({ over: null, under: null });
        }}
      >
        {({ close }) => (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <NumberField
                label="Over"
                money={{ symbol: '$' }}
                value={values.over}
                onChange={(over) => {
                  set({ over });
                }}
              />
              <NumberField
                label="Under"
                money={{ symbol: '$' }}
                value={values.under}
                onChange={(under) => {
                  set({ under });
                }}
              />
            </div>
            <Button variant="secondary" onPress={close}>
              Done
            </Button>
          </div>
        )}
      </FilterChip>
      <FilterChip
        label={words.date}
        isSecondary
        valueLabel={dateLabel(values.date)}
        onClear={() => {
          set({ date: null });
        }}
      >
        <RangeCalendar
          aria-label={words.date}
          value={values.date}
          today="2026-09-18"
          onChange={(date) => {
            set({ date });
          }}
        />
      </FilterChip>
      <FilterChip
        label={words.tags}
        selectionMode="multiple"
        isSecondary
        value={values.tags}
        onChange={(tags) => {
          set({ tags });
        }}
      >
        {optionsOf(CATEGORIES)}
      </FilterChip>
    </FilterBar>
  );
}

const ACTIVE: Partial<Values> = { category: 'food', over: 10000, tags: ['rent'] };

/** Nothing active: the search, three chips at rest and More. */
export const Default: Story = {
  tags: ['density'],
  render: () => <Transactions />,
};

/**
 * Three active: "Category Food" and "Amount Over $100" in place, the secondary "Tags Rent" after the primary
 * chips, More for Date, and a tertiary Clear all at the far end.
 */
export const Active: Story = {
  render: () => <Transactions initial={ACTIVE} />,
  play: async ({ canvasElement }) => {
    await expect(rowLabels(canvasElement)).toEqual(['Category', 'Account', 'Amount', 'Tags', 'More']);
    const clearAll = within(canvasElement).getByRole('button', { name: 'Clear all' });
    // At the inline end of the bar.
    await expect(rect(find(canvasElement, '.filter-bar')).right - rect(clearAll).right).toBeCloseTo(0, 0);
  },
};

/** More from the keyboard: a float panel padded 16px holding Date and Tags as sections with a hairline between. */
export const MoreOpen: Story = {
  render: () => <Transactions />,
  play: async ({ canvasElement }) => {
    await tabTo(triggerOf(canvasElement, 'More'));
    await userEvent.keyboard('{Enter}');
    const panel = await popoverAtRest('.filter-bar-more-panel');
    const dialog = within(panel).getByRole('dialog', { name: 'More' });
    await expect(
      within(dialog)
        .getAllByRole('heading', { level: 3 })
        .map((title) => title.textContent),
    ).toEqual(['Date', 'Tags']);
    await expect(getComputedStyle(panel).paddingTop).toBe(`${String(tokenPixels('--spacing-inset'))}px`);
    const [, second] = panel.querySelectorAll('.filter-section');
    if (!second) throw new Error('No second section');
    await expect(getComputedStyle(second).borderTopStyle).toBe('solid');
    await expect(getComputedStyle(second).borderTopWidth).toBe('1px');
    await expect(getComputedStyle(second).paddingTop).toBe(`${String(tokenPixels('--spacing-peer'))}px`);
    const title = find(panel, '.filter-section-title');
    await expect(getComputedStyle(title).fontWeight).toBe('700');
    await expect(getComputedStyle(title).color).toBe(tokenColor('--color-ink'));
  },
};

/** In a 32rem box the row wraps under the search, and its chips wrap within it. */
export const Wrapped: Story = {
  render: () => (
    <div style={{ width: '32rem', maxWidth: '100%' }}>
      <Transactions initial={ACTIVE} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const search = find(canvasElement, '.filter-bar-search');
    const row = rowOf(canvasElement);
    // Nothing is measured: the browser wraps the row onto a line of its own, inside the box.
    if (getComputedStyle(row).display !== 'none') {
      await expect(rect(row).top).toBeGreaterThanOrEqual(rect(search).bottom);
      await expect(rect(row).right).toBeLessThanOrEqual(rect(find(canvasElement, '.filter-bar')).right + 0.5);
    }
  },
};

/** A phone: the search and "Filters" with the count of two in a neutral Badge, in place of the row. */
export const Phone: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  render: () => <Transactions initial={{ category: 'food', tags: ['rent'] }} />,
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(rowOf(canvasElement)).display).toBe('none');
    await expect(getComputedStyle(find(canvasElement, '.filter-bar-clear-all')).display).toBe('none');
    const button = find(canvasElement, '.filter-bar-sheet-button');
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName('Filters 2');
    // Beside the search, on its line, with the search taking the rest of it.
    const search = find(canvasElement, '.filter-bar-search');
    await expect(Math.abs(rect(search).top - rect(button).top)).toBeLessThan(rect(button).height);
    await expect(rect(button).left).toBeGreaterThan(rect(search).right);
  },
};

/** The Filters sheet: every filter as a section in declared order, Clear all and an ink Done in its footer. */
export const PhoneSheet: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  render: () => <Transactions initial={{ category: 'food', tags: ['rent'] }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(find(canvasElement, '.filter-bar-sheet-button'));
    const sheet = await sheetAtRest();
    const dialog = within(sheet).getByRole('dialog', { name: 'Filters' });
    await expect(
      within(dialog)
        .getAllByRole('heading', { level: 3 })
        .map((title) => title.textContent),
    ).toEqual(['Category', 'Account', 'Amount', 'Date', 'Tags']);
    const footer = find(dialog, '.sheet-footer');
    await expect(
      within(footer)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Clear all', 'Done']);
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  },
};

/** Persian digits through a formatCount the app writes. */
const persianDigits = (count: number): string =>
  String(count).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);

const PERSIAN_LABELS: Partial<FilterBarLabels> = {
  filters: 'فیلترها',
  more: 'بیشتر',
  clearAll: 'پاک کردن همه',
  done: 'تمام',
  clear: 'پاک کردن',
};

const PERSIAN_WORDS = {
  search: 'جستجوی تراکنش‌ها',
  category: 'دسته',
  accounts: 'حساب',
  amount: 'مبلغ',
  date: 'تاریخ',
  tags: 'برچسب',
};

/** Right to left: the search at the right, the chips leftward from it, Clear all at the left end, Persian digits. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <Transactions
          initial={{ category: 'food', tags: ['rent'] }}
          labels={PERSIAN_LABELS}
          words={PERSIAN_WORDS}
          formatCount={persianDigits}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(find(canvasElement, '.filter-bar-sheet-button .badge')).toHaveTextContent('۲');
  },
};

/** The count, read from the chips' props, through each change: the Badge and the button's name follow. */
export const Count: Story = {
  tags: ['no-visual'],
  parameters: { a11y: LIST_A11Y },
  render: () => <Transactions />,
  play: async ({ canvasElement }) => {
    const button = find(canvasElement, '.filter-bar-sheet-button');
    await expect(button.querySelector('.badge')).toBeNull();
    await userEvent.click(triggerOf(canvasElement, 'Category'));
    await popoverAtRest('.select-popover');
    await userEvent.click(within(document.body).getByRole('option', { name: 'Rent' }));
    await waitFor(() => expect(document.querySelector('.select-popover')).toBeNull());
    await expect(find(button, '.badge')).toHaveTextContent('1');
    // Hidden above the phone width, where it has no name, so its text is read: the name a phone hears.
    await expect(button.textContent).toBe('Filters 1');
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Clear Category' }));
    await expect(button.querySelector('.badge')).toBeNull();
  },
};

/**
 * A choice made in the More panel keeps its section there until the panel closes, so a multiple list stays under
 * the pointer; the chip is in the row at once, and after the panel closes.
 */
export const MoreKeepsChoice: Story = {
  tags: ['no-visual'],
  parameters: { a11y: LIST_A11Y },
  render: () => <Transactions />,
  play: async ({ canvasElement }) => {
    await userEvent.click(triggerOf(canvasElement, 'More'));
    const panel = await popoverAtRest('.filter-bar-more-panel');
    await userEvent.click(within(panel).getByRole('button', { name: 'Any Tags' }));
    const list = await popoverAtRest('.select-popover');
    await userEvent.click(within(list).getByRole('option', { name: 'Health' }));
    await expect(within(list).getByRole('option', { name: 'Health' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(rowLabels(canvasElement)).toEqual(['Category', 'Account', 'Amount', 'Tags', 'More']);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('.select-popover')).toBeNull());
    await expect(within(panel).getByRole('region', { name: 'Tags' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('.filter-bar-more-panel')).toBeNull());
    await expect(triggerOf(canvasElement, 'Tags').closest('.filter-chip')).toHaveAttribute('data-active');
    await waitFor(() => expect(triggerOf(canvasElement, 'More')).toHaveFocus());
  },
};

/**
 * More leaves as its panel closes: with Date active, Tags is the last chip behind More, and a choice in the
 * panel makes it active. Focus goes to Tags in the row, once React Aria has lifted the inert page.
 */
export const MoreLeavesFocus: Story = {
  tags: ['no-visual'],
  parameters: { a11y: LIST_A11Y },
  render: () => <Transactions initial={{ date: { start: '2026-09-01', end: '2026-09-30' } }} />,
  play: async ({ canvasElement }) => {
    await expect(rowLabels(canvasElement)).toEqual(['Category', 'Account', 'Amount', 'Date', 'More']);
    await userEvent.click(triggerOf(canvasElement, 'More'));
    const panel = await popoverAtRest('.filter-bar-more-panel');
    await userEvent.click(within(panel).getByRole('button', { name: 'Any Tags' }));
    const list = await popoverAtRest('.select-popover');
    await userEvent.click(within(list).getByRole('option', { name: 'Rent' }));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('.select-popover')).toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('.filter-bar-more-panel')).toBeNull());
    await expect(canvasElement.querySelector('.filter-bar-more')).toBeNull();
    await waitFor(() => expect(triggerOf(canvasElement, 'Tags')).toHaveFocus());
  },
};

/**
 * A secondary chip whose last option is unchecked in the row keeps its place while its list is open, so the list
 * stays under the pointer; as the list closes the chip goes behind More, and More takes focus, never the page.
 */
export const SecondaryUncheckedFocus: Story = {
  tags: ['no-visual'],
  parameters: { a11y: LIST_A11Y },
  render: () => <Transactions initial={{ tags: ['rent'] }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(triggerOf(canvasElement, 'Tags'));
    const list = await popoverAtRest('.select-popover');
    await userEvent.click(within(list).getByRole('option', { name: 'Rent' }));
    await expect(within(list).getByRole('option', { name: 'Rent' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    // Inactive, and still in the row with its list open.
    await expect(triggerOf(canvasElement, 'Tags').closest('.filter-chip')).not.toHaveAttribute('data-active');
    await expect(list.isConnected).toBe(true);
    await expect(list.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('.select-popover')).toBeNull());
    await expect(rowLabels(canvasElement)).toEqual(['Category', 'Account', 'Amount', 'More']);
    await waitFor(() => expect(triggerOf(canvasElement, 'More')).toHaveFocus());
    await expect(document.activeElement).not.toBe(document.body);
  },
};

/** Clear all by keyboard: every filter clears and focus lands on the first chip, never on the page. */
export const ClearAllFocus: Story = {
  tags: ['no-visual'],
  render: () => <Transactions initial={ACTIVE} />,
  play: async ({ canvasElement }) => {
    const clearAll = within(canvasElement).getByRole('button', { name: 'Clear all' });
    await tabTo(clearAll);
    await userEvent.keyboard('{Enter}');
    await expect(canvasElement.querySelector('.filter-bar-clear-all')).toBeNull();
    await expect(triggerOf(canvasElement, 'Category')).toHaveFocus();
    await expect(canvasElement.querySelector('.filter-chip[data-active]')).toBeNull();
  },
};

/**
 * A secondary chip cleared in the row leaves it for More, so focus goes to More; with every secondary chip
 * active More is not drawn until one clears, and focus still lands on it.
 */
export const SecondaryClearFocus: Story = {
  tags: ['no-visual'],
  render: () => (
    <Transactions initial={{ tags: ['rent'], date: { start: '2026-09-01', end: '2026-09-30' } }} />
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.filter-bar-more')).toBeNull();
    const clear = within(canvasElement).getByRole('button', { name: 'Clear Tags' });
    await tabTo(clear);
    await userEvent.keyboard('{Enter}');
    await expect(rowLabels(canvasElement)).toEqual(['Category', 'Account', 'Amount', 'Date', 'More']);
    await expect(triggerOf(canvasElement, 'More')).toHaveFocus();
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Clear Date' }));
    await expect(triggerOf(canvasElement, 'More')).toHaveFocus();
    await expect(document.activeElement).not.toBe(document.body);
  },
};

/** Two hundred categories, for R6: the options a long chip builds in the row, and again in the sheet. */
const MANY: [id: string, name: string][] = Array.from({ length: 200 }, (_, index) => [
  `c${String(index + 1)}`,
  `Category ${String(index + 1)}`,
]);

/** Waits until the open list's popover holds focus, its filter or an option, so Escape reaches it. */
async function focusInList(): Promise<void> {
  await popoverAtRest('.select-popover');
  await waitFor(() =>
    expect(document.querySelector('.select-popover')?.contains(document.activeElement)).toBe(true),
  );
}

/**
 * R6: a 200-option chip in the row and in the sheet. The play opens each list and records the time from the
 * press to the list in the story's parameters and the console, which the design record reads; it sets no
 * threshold.
 */
export const ManyOptions: Story = {
  tags: ['no-visual'],
  parameters: { a11y: LIST_A11Y, r6: {} as Record<string, number> },
  render: () => <Transactions categories={MANY} />,
  play: async ({ canvasElement, parameters }) => {
    const times = parameters.r6 as Record<string, number>;
    let start = performance.now();
    await userEvent.click(triggerOf(canvasElement, 'Category'));
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    times['row list'] = performance.now() - start;
    await focusInList();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeNull());
    start = performance.now();
    find(canvasElement, '.filter-bar-sheet-button').click();
    await waitFor(() => expect(document.querySelector('.sheet .filter-section')).not.toBeNull());
    times['sheet sections'] = performance.now() - start;
    // The sheet's content takes no pointer until it has slid up and moved focus in, so the list is opened from a
    // sheet at rest.
    const sheet = await sheetAtRest();
    start = performance.now();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Any Category' }));
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    times['sheet list'] = performance.now() - start;
    console.info(`R6 ManyOptions ${JSON.stringify(times)}`);
    await focusInList();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeNull());
  },
};

/** More's panel is modal (ruling 10): while it is open the row is hidden, and an outside press closes it first. */
export const Modality: Story = {
  tags: ['no-visual'],
  render: () => <Transactions />,
  play: async ({ canvasElement }) => {
    const category = triggerOf(canvasElement, 'Category');
    await userEvent.click(triggerOf(canvasElement, 'More'));
    await popoverAtRest('.filter-bar-more-panel');
    await waitFor(() => expect(category.closest('[inert], [aria-hidden="true"]')).not.toBeNull());
    await userEvent.click(document.body);
    await waitFor(() => expect(document.querySelector('.filter-bar-more-panel')).toBeNull());
    await expect(category.closest('[inert], [aria-hidden="true"]')).toBeNull();
    await waitFor(() => expect(triggerOf(canvasElement, 'More')).toHaveFocus());
  },
};
