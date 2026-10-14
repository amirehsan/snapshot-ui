import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { I18nProvider, type Key } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { tokenColor, tokenPixels, washColor } from '../stories/paint';
import { FilterChip, type FilterChipLabels } from './FilterChip';

/**
 * The args the stories take. The props are a union of a list in two modes and the app's own content, which
 * Storybook's args type collapses, so every story renders its own chips and takes only the change handler.
 */
interface StoryArgs {
  onChange?: (value: Key | null) => void;
}

/**
 * Axe's settings for the stories that open a list, the ones Select's stories use: the Menu's row rule, and the
 * scrollable-region check skipped on the list alone. With a filter the field keeps focus and owns the list through
 * aria-activedescendant, so the list is no tab stop and the arrows scroll it; without one the options take real
 * focus. Every other rule, and those two everywhere else, still run.
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
  title: 'Components/FilterChip',
  component: FilterChip as ComponentType<StoryArgs>,
  parameters: {
    // The open stories open a list or a panel, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '520px' } },
  },
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** The pill whose label is `label`. */
function pillOf(scope: ParentNode, label: string): HTMLElement {
  const found = [...scope.querySelectorAll<HTMLElement>('.filter-chip')].find(
    (pill) => pill.querySelector('.filter-chip-label')?.textContent === label,
  );
  if (!found) throw new Error(`No chip ${label}`);
  return found;
}

const triggerOf = (scope: ParentNode, label: string): HTMLElement =>
  find(pillOf(scope, label), '.filter-chip-trigger');

/** The open popover, once it has been placed and its entrance has finished. */
async function atRest(selector = '.popover'): Promise<HTMLElement> {
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

/** Waits until no popover is on the page. */
async function closed(): Promise<void> {
  await waitFor(() => expect(document.querySelector('.popover')).toBeNull());
}

/** Tabs until `target` has focus, as a keyboard reader arrives. */
async function tabTo(target: HTMLElement): Promise<void> {
  for (let step = 0; step < 8 && document.activeElement !== target; step += 1) await userEvent.tab();
  await expect(target).toHaveFocus();
}

/** A household budget's categories, the first two with a hint. */
const CATEGORIES: [id: string, name: string, hint?: string][] = [
  ['food', 'Food', 'Groceries and dining'],
  ['rent', 'Rent', 'Home and storage'],
  ['salary', 'Salary'],
  ['transport', 'Transport'],
  ['utilities', 'Utilities'],
  ['health', 'Health'],
  ['travel', 'Travel'],
  ['gifts', 'Gifts'],
  ['clothing', 'Clothing'],
  ['internet', 'Internet'],
  ['education', 'Education'],
  ['refunds', 'Refunds'],
];

const options = (count: number): ReactNode =>
  CATEGORIES.slice(0, count).map(([id, name, hint]) => (
    <PickerOption key={id} id={id} description={hint}>
      {name}
    </PickerOption>
  ));

/** A row of chips, as a FilterBar lays them out. */
function Row({ children }: { children: ReactNode }): ReactElement {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>;
}

interface CategoryProps {
  initial?: Key | null;
  count?: number;
  isDisabled?: boolean;
  onChange?: (value: Key | null) => void;
  label?: string;
  labels?: Partial<FilterChipLabels>;
}

/** "Category": one choice from eight categories, or `count`. */
function Category({
  initial = null,
  count = 8,
  isDisabled,
  onChange,
  label = 'Category',
  labels,
}: CategoryProps): ReactElement {
  const [value, setValue] = useState<Key | null>(initial);
  return (
    <FilterChip
      label={label}
      selectionMode="single"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      isDisabled={isDisabled}
      labels={labels}
    >
      {options(count)}
    </FilterChip>
  );
}

/** "Tags": several choices from six. */
function Tags({ initial = [] }: { initial?: readonly Key[] }): ReactElement {
  const [value, setValue] = useState<readonly Key[]>(initial);
  return (
    <FilterChip label="Tags" selectionMode="multiple" value={value} onChange={setValue}>
      {options(6)}
    </FilterChip>
  );
}

/** "Amount": two money fields in a panel; the app writes the value it shows and clears it. */
function Amount({ over = null, isDisabled }: { over?: number | null; isDisabled?: boolean }): ReactElement {
  const [min, setMin] = useState<number | null>(over);
  const [max, setMax] = useState<number | null>(null);
  const valueLabel =
    min === null && max === null
      ? undefined
      : max === null
        ? `Over $${String((min ?? 0) / 100)}`
        : `$${String((min ?? 0) / 100)} to $${String(max / 100)}`;
  return (
    <FilterChip
      label="Amount"
      valueLabel={valueLabel}
      onClear={() => {
        setMin(null);
        setMax(null);
      }}
      isDisabled={isDisabled}
    >
      {({ close }) => (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <NumberField label="Over" money={{ symbol: '$' }} value={min} onChange={setMin} />
            <NumberField label="Under" money={{ symbol: '$' }} value={max} onChange={setMax} />
          </div>
          <Button variant="secondary" onPress={close}>
            Done
          </Button>
        </div>
      )}
    </FilterChip>
  );
}

/** Three chips at rest: a pill of the boundary edge on nothing, its label at 500 and a slate chevron. */
export const Default: Story = {
  tags: ['density'],
  render: () => (
    <Row>
      <Category />
      <Tags />
      <Amount />
    </Row>
  ),
};

/** Three chips with a value: the ink fill, the label at 450, the value at 700 and the clear button. */
export const Active: Story = {
  tags: ['density'],
  render: () => (
    <Row>
      <Category initial="food" />
      <Tags initial={['health', 'salary', 'rent', 'food']} />
      <Amount over={10000} />
    </Row>
  ),
};

/** Opened from the keyboard: the list under the chip, the chosen row's ink pill and check, the chevron turned. */
export const OpenSingle: Story = {
  parameters: { a11y: LIST_A11Y },
  render: () => (
    <Row>
      <Category initial="rent" />
      <Tags />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    await tabTo(triggerOf(canvasElement, 'Category'));
    await userEvent.keyboard('{Enter}');
    const popover = await atRest();
    await expect(within(popover).getByRole('listbox', { name: 'Category' })).toBeInTheDocument();
    await expect(pillOf(canvasElement, 'Category')).toHaveAttribute('data-open');
    await waitFor(() => expect(document.activeElement).toHaveAttribute('aria-selected', 'true'));
  },
};

/** Two rows toggled from the keyboard: their checks, the list still open, the chip active behind it. */
export const OpenMultiple: Story = {
  parameters: { a11y: LIST_A11Y },
  render: () => (
    <Row>
      <Category />
      <Tags />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    await tabTo(triggerOf(canvasElement, 'Tags'));
    await userEvent.keyboard('{Enter}');
    await atRest();
    await userEvent.keyboard('{Enter}{ArrowDown}{Enter}');
    const popover = await atRest();
    await expect(within(popover).getAllByRole('option', { selected: true })).toHaveLength(2);
    await expect(pillOf(canvasElement, 'Tags')).toHaveAttribute('data-active');
    await expect(find(pillOf(canvasElement, 'Tags'), '.filter-chip-value')).toHaveTextContent('Food, Rent');
  },
};

/** The app's own content: two money fields side by side in a panel padded 16px. */
export const CustomPanel: Story = {
  render: () => (
    <Row>
      <Amount />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    await tabTo(triggerOf(canvasElement, 'Amount'));
    await userEvent.keyboard('{Enter}');
    const popover = await atRest('.filter-chip-panel');
    await expect(within(popover).getByRole('dialog', { name: 'Amount' })).toBeInTheDocument();
    await expect(getComputedStyle(popover).paddingTop).toBe(`${String(tokenPixels('--spacing-inset'))}px`);
  },
};

/** Twelve categories: the list opens with its filter row focused. */
export const Filterable: Story = {
  parameters: { a11y: LIST_A11Y },
  render: () => (
    <Row>
      <Category count={12} />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    await tabTo(triggerOf(canvasElement, 'Category'));
    await userEvent.keyboard('{Enter}');
    const popover = await atRest();
    await waitFor(() => expect(within(popover).getByRole('searchbox', { name: 'Filter' })).toHaveFocus());
  },
};

/** Disabled, inactive and active: taupe text, a 15% ink edge, and the disabled fill for the active one. */
export const Disabled: Story = {
  render: () => (
    <Row>
      <Category isDisabled />
      <Category label="Account" initial="food" isDisabled />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const inactive = pillOf(canvasElement, 'Category');
    await expect(getComputedStyle(inactive).color).toBe(tokenColor('--color-taupe'));
    const active = pillOf(canvasElement, 'Account');
    await expect(getComputedStyle(active).backgroundColor).toBe(tokenColor('--color-disabled'));
    await expect(active.querySelector('.filter-chip-clear')).toBeNull();
  },
};

/** Keyboard focus on an active chip: the ring around the whole ink pill. */
export const KeyboardFocus: Story = {
  render: () => (
    <Row>
      <Category initial="food" />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    await tabTo(triggerOf(canvasElement, 'Category'));
    const pill = pillOf(canvasElement, 'Category');
    await expect(getComputedStyle(pill).outlineStyle).toBe('solid');
    await expect(getComputedStyle(pill).outlineColor).toBe(tokenColor('--focus-ring-color'));
  },
};

/** A Persian page's words for the summary and the clear button. */
const PERSIAN: Partial<FilterChipLabels> = {
  summary: (texts) => texts.join('، '),
  clear: (label) => `پاک کردن ${label}`,
};

/** Right to left: the label at the right, the clear button at the left end, the chevron and X unmirrored. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <Row>
          <FilterChip
            label="دسته"
            selectionMode="multiple"
            value={['rent', 'food']}
            onChange={() => undefined}
            labels={PERSIAN}
          >
            <PickerOption id="food">غذا</PickerOption>
            <PickerOption id="rent">اجاره</PickerOption>
            <PickerOption id="salary">حقوق</PickerOption>
          </FilterChip>
          <FilterChip label="برچسب" selectionMode="single" value={null} onChange={() => undefined}>
            <PickerOption id="a">الف</PickerOption>
          </FilterChip>
        </Row>
      </div>
    </I18nProvider>
  ),
};

const change = fn();

/**
 * A closed single chip ignores a letter and Left and Right, which React Aria's Select would turn into a choice
 * nobody sees; Arrow Down still opens it. The capture guard is checked in Chromium, WebKit and Firefox (R3).
 */
export const ClosedKeys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Category onChange={change} />,
  play: async ({ canvasElement, userEvent: user }) => {
    change.mockClear();
    const trigger = triggerOf(canvasElement, 'Category');
    trigger.focus();
    await expect(trigger).toHaveFocus();
    await user.keyboard('r');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowLeft}');
    await expect(change).not.toHaveBeenCalled();
    await expect(document.querySelector('[role="listbox"]')).toBeNull();
    await expect(trigger).toHaveAccessibleName('Category');
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    await user.keyboard('{Escape}');
    await closed();
  },
};

/** The clear button by keyboard: Tab reaches it, Enter clears, and focus lands on the trigger with its ring. */
export const ClearFocus: Story = {
  tags: ['no-visual'],
  render: () => (
    <Row>
      <Category initial="rent" onChange={change} />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    change.mockClear();
    const clear = within(canvasElement).getByRole('button', { name: 'Clear Category' });
    await tabTo(clear);
    // The canvas ring inside, on the ink fill.
    const icon = find(clear, '.filter-chip-clear-icon');
    await expect(getComputedStyle(icon).outlineColor).toBe(tokenColor('--color-canvas'));
    await userEvent.keyboard('{Enter}');
    await expect(change).toHaveBeenLastCalledWith(null);
    const trigger = triggerOf(canvasElement, 'Category');
    await expect(trigger).toHaveFocus();
    await expect(getComputedStyle(pillOf(canvasElement, 'Category')).outlineStyle).toBe('solid');
    await expect(document.querySelector('[role="listbox"]')).toBeNull();
  },
};

/** The popover is modal (ruling 10): while one chip's list is open the next chip is hidden from the page. */
export const Modality: Story = {
  tags: ['no-visual'],
  render: () => (
    <Row>
      <Category />
      <Tags />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const tags = triggerOf(canvasElement, 'Tags');
    await userEvent.click(triggerOf(canvasElement, 'Category'));
    await atRest();
    await waitFor(() => expect(tags.closest('[inert], [aria-hidden="true"]')).not.toBeNull());
    // A press outside closes the list first; focus goes back to the chip that opened it.
    await userEvent.click(document.body);
    await closed();
    await expect(tags.closest('[inert], [aria-hidden="true"]')).toBeNull();
    await expect(triggerOf(canvasElement, 'Category')).toHaveFocus();
  },
};

/** Hover washes an inactive chip 5% ink and leaves an active one ink. */
export const HoverWash: Story = {
  tags: ['no-visual'],
  render: () => (
    <Row>
      <Category />
      <Tags initial={['food']} />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const inactive = pillOf(canvasElement, 'Category');
    await userEvent.hover(triggerOf(canvasElement, 'Category'));
    await expect(getComputedStyle(inactive).backgroundColor).toBe(washColor());
    await userEvent.unhover(triggerOf(canvasElement, 'Category'));
    await expect(getComputedStyle(inactive).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    const active = pillOf(canvasElement, 'Tags');
    await userEvent.hover(triggerOf(canvasElement, 'Tags'));
    await expect(getComputedStyle(active).backgroundColor).toBe(tokenColor('--color-ink'));
  },
};

/**
 * The clear button is the pill's last 2rem and its full height, 32 by 40 at the comfortable size, and touches
 * the trigger without reaching over it: the trigger's hit area is its own width, and the button has none beyond
 * its box.
 */
export const ClearHitArea: Story = {
  tags: ['no-visual'],
  render: () => (
    <Row>
      <Category initial="food" />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const pill = pillOf(canvasElement, 'Category');
    const clear = find(pill, '.filter-chip-clear');
    const trigger = triggerOf(canvasElement, 'Category');
    await expect(rect(clear).width).toBeCloseTo(32, 1);
    // The pill's height less its two 1px edges.
    await expect(rect(clear).height).toBeCloseTo(rect(pill).height - 2, 1);
    await expect(rect(pill).height).toBeCloseTo(tokenPixels('--size-control'), 1);
    await expect(rect(clear).left).toBeGreaterThanOrEqual(rect(trigger).right - 0.5);
    // The trigger's hit area is as wide as the trigger.
    const hit = getComputedStyle(trigger, '::before');
    await expect(hit.left).toBe('0px');
    await expect(hit.right).toBe('0px');
    // The point just past the trigger's end is the clear button's.
    const y = rect(clear).top + rect(clear).height / 2;
    await expect(document.elementFromPoint(rect(clear).left + 1, y)?.closest('.filter-chip-clear')).toBe(
      clear,
    );
    await expect(document.elementFromPoint(rect(trigger).right - 1, y)?.closest('.filter-chip-trigger')).toBe(
      trigger,
    );
    // The icon is a 24px circle with a 12px X.
    const icon = find(clear, '.filter-chip-clear-icon');
    await expect(rect(icon).width).toBeCloseTo(24, 1);
    await expect(rect(find(icon, 'svg')).width).toBeCloseTo(12, 1);
  },
};
