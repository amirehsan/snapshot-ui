import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRef, useState, type ReactElement, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { PickerOption } from '../picker';
import type { PopoverProps } from '../popover/Popover';
import { FilterChip, FilterChipPlaceContext, type ChipPlace, type FilterChipLabels } from './FilterChip';

/**
 * How many times the library's Popover has rendered outside the Select's state, which is React Aria's hidden
 * pass, through a spy that renders the real one.
 */
const hiddenPopovers = vi.hoisted(() => ({ count: 0 }));

vi.mock('../popover/Popover', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../popover/Popover')>();
  const { useContext } = await import('react');
  const { SelectStateContext } = await import('react-aria-components');
  return {
    ...actual,
    Popover: (props: PopoverProps) => {
      // Only a list chip's popover sits in a Select; a custom chip's panel is counted by its class.
      const state = useContext(SelectStateContext);
      const isList = String(props.className).includes('select-popover');
      if (isList && state === null) hiddenPopovers.count += 1;
      return actual.Popover(props);
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Axe's label-in-name check, skipped on option rows alone: a row is named by its label and described by its hint,
 * as the stories' MENU_ROW_A11Y scopes it. It still runs on the chip's trigger and everything else.
 */
const ROW_RULE = { id: 'label-content-name-mismatch', selector: '*:not(.menu-item)' };

function element(selector: string, scope: ParentNode = document): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** The pill: the chip's root, outside React Aria's Select. */
const pill = (): HTMLElement => element('.filter-chip');

/** The chip's trigger, found by its class, since its name changes with its value. */
const trigger = (): HTMLButtonElement => element('.filter-chip-trigger') as HTMLButtonElement;

/** The open list's options, by their label. */
const shown = (): string[] =>
  screen.getAllByRole('option').map((option) => element('.menu-item-label', option).textContent);

/** Six categories, the first with a hint, in the list's order. */
const SIX = (
  <>
    <PickerOption id="food" description="Groceries and dining">
      Food
    </PickerOption>
    <PickerOption id="rent">Rent</PickerOption>
    <PickerOption id="salary">Salary</PickerOption>
    <PickerOption id="transport">Transport</PickerOption>
    <PickerOption id="utilities">Utilities</PickerOption>
    <PickerOption id="health">Health</PickerOption>
  </>
);

const TWELVE = [
  'Food',
  'Rent',
  'Salary',
  'Transport',
  'Utilities',
  'Health',
  'Travel',
  'Clothing',
  'Internet',
  'Education',
  'Gifts',
  'Refunds',
];

interface SingleProps {
  initial?: Key | null;
  onChange?: (value: Key | null) => void;
  onClear?: () => void;
  labels?: Partial<FilterChipLabels>;
  valueLabel?: string;
  isDisabled?: boolean;
  isSecondary?: boolean;
  isFilterable?: boolean;
  children?: ReactNode;
}

/** A single chip whose value the test holds, as an app that keeps it in its URL does. */
function Single({ initial = null, onChange, children = SIX, ...props }: SingleProps): ReactElement {
  const [value, setValue] = useState<Key | null>(initial);
  return (
    <FilterChip
      label="Category"
      selectionMode="single"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      {...props}
    >
      {children}
    </FilterChip>
  );
}

interface MultipleProps {
  initial?: readonly Key[];
  onChange?: (value: Key[]) => void;
  onClear?: () => void;
  labels?: Partial<FilterChipLabels>;
  valueLabel?: string;
  isDisabled?: boolean;
  isSecondary?: boolean;
}

/** A multiple chip whose value the test holds. */
function Multiple({ initial = [], onChange, ...props }: MultipleProps): ReactElement {
  const [value, setValue] = useState<readonly Key[]>(initial);
  return (
    <FilterChip
      label="Tags"
      selectionMode="multiple"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      {...props}
    >
      {SIX}
    </FilterChip>
  );
}

/** A custom chip holding a field and an Apply button that closes the panel. */
function Custom({
  valueLabel,
  onClear,
  isDisabled,
}: {
  valueLabel?: string;
  onClear?: () => void;
  isDisabled?: boolean;
}): ReactElement {
  return (
    <FilterChip label="Amount" valueLabel={valueLabel} onClear={onClear} isDisabled={isDisabled}>
      {({ close }) => (
        <>
          <label>
            Over <input name="over" />
          </label>
          <button type="button" onClick={close}>
            Apply
          </button>
        </>
      )}
    </FilterChip>
  );
}

/** A place FilterBar would provide, for the section face and the row's rules. */
function place(overrides: Partial<ChipPlace>): ChipPlace {
  return {
    place: 'sheet',
    hasMore: false,
    panelLabels: null,
    clearWord: 'Clear',
    close: () => undefined,
    onSecondaryCleared: () => undefined,
    ...overrides,
  };
}

describe('FilterChip', () => {
  it('is a button named by its label while inactive, with aria-haspopup listbox', () => {
    render(<Single />);
    const button = screen.getByRole('button', { name: 'Category' });
    expect(button).toBe(trigger());
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(element('.filter-chip-label', button)).toHaveTextContent('Category');
    expect(element('.filter-chip-chevron', button)).toHaveAttribute('aria-hidden', 'true');
    expect(button.querySelector('.filter-chip-value')).toBeNull();
    expect(pill()).not.toHaveAttribute('data-active');
    expect(pill()).not.toHaveAttribute('data-open');
    expect(document.querySelector('.filter-chip-clear')).toBeNull();
    // The Select's root holds the trigger and has no role of its own.
    expect(button.closest('.filter-chip-select')).not.toHaveAttribute('role');
  });

  it('is named by its label and then its summary while active, which axe label-in-name check passes', async () => {
    const { container } = render(<Multiple initial={['food', 'rent']} />);
    const button = screen.getByRole('button', { name: 'Tags Food, Rent' });
    expect(button).toBe(trigger());
    const [label, value] = (button.getAttribute('aria-labelledby') ?? '').split(' ');
    expect(document.getElementById(label ?? '')).toHaveClass('filter-chip-label');
    expect(document.getElementById(value ?? '')).toHaveClass('filter-chip-value');
    expect(pill()).toHaveAttribute('data-active', '');
    // The text it shows is the name, word for word: a space the flex row does not draw parts label and value,
    // since axe joins the text of the spans as written. jsdom lays nothing out, so axe here reads no visible text;
    // the stories run the check in a browser.
    expect(button.textContent).toBe('Tags Food, Rent');
    await expectNoA11yViolations(container, { runOnly: ['label-content-name-mismatch', 'button-name'] });
  });

  it('summarizes in list order whatever the value order', () => {
    render(<Multiple initial={['rent', 'food']} />);
    expect(element('.filter-chip-value')).toHaveTextContent(/^Food, Rent$/);
  });

  it('writes Food, Food, Rent and Food, Rent and 2 more by default, and labels.summary when given', () => {
    const { unmount } = render(<Multiple initial={['food']} />);
    expect(element('.filter-chip-value')).toHaveTextContent(/^Food$/);
    unmount();
    const four = render(<Multiple initial={['health', 'salary', 'rent', 'food']} />);
    expect(element('.filter-chip-value')).toHaveTextContent(/^Food, Rent and 2 more$/);
    expect(trigger()).toHaveAccessibleName('Tags Food, Rent and 2 more');
    four.unmount();
    const summary = vi.fn((texts: readonly string[]) => `${String(texts.length)}: ${texts.join(' + ')}`);
    render(<Multiple initial={['salary', 'food']} labels={{ summary }} />);
    expect(element('.filter-chip-value')).toHaveTextContent(/^2: Food \+ Salary$/);
    expect(summary).toHaveBeenLastCalledWith(['Food', 'Salary']);
  });

  it('shows valueLabel over the summary', () => {
    render(<Single initial="food" valueLabel="Groceries" />);
    expect(element('.filter-chip-value')).toHaveTextContent(/^Groceries$/);
    expect(trigger()).toHaveAccessibleName('Category Groceries');
  });

  it('chooses and closes in single mode, and toggles and stays open in multiple mode, calling onChange each time', async () => {
    const user = userEvent.setup();
    const onSingle = vi.fn();
    const { unmount } = render(<Single onChange={onSingle} />);
    await user.click(trigger());
    expect(pill()).toHaveAttribute('data-open', '');
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    expect(onSingle).toHaveBeenLastCalledWith('rent');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(pill()).not.toHaveAttribute('data-open');
    expect(trigger()).toHaveAccessibleName('Category Rent');
    unmount();

    const onMultiple = vi.fn();
    render(<Multiple onChange={onMultiple} />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    expect(onMultiple).toHaveBeenLastCalledWith(['rent']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onMultiple).toHaveBeenLastCalledWith(['rent', 'food']);
    await user.keyboard('{ArrowDown}{ArrowDown} ');
    expect(onMultiple).toHaveBeenLastCalledWith(['rent', 'food', 'salary']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(onMultiple).toHaveBeenCalledTimes(3);
    // The chip is active behind the open list, in list order.
    expect(element('.filter-chip-value')).toHaveTextContent(/^Food, Rent and 1 more$/);
  });

  it('offers no empty choice in single mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Single initial="rent" onChange={onChange} />);
    await user.click(trigger());
    expect(shown()).toEqual(['Food', 'Rent', 'Salary', 'Transport', 'Utilities', 'Health']);
    // Pressing the chosen option again keeps it: React Aria disallows an empty choice in single mode.
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    expect(onChange).not.toHaveBeenCalledWith(null);
    expect(trigger()).toHaveAccessibleName('Category Rent');
  });

  it('clears through onChange(null) or onChange([]), or onClear, and puts focus on the trigger', async () => {
    const user = userEvent.setup();
    const onSingle = vi.fn();
    const single = render(<Single initial="rent" onChange={onSingle} />);
    await user.click(screen.getByRole('button', { name: 'Clear Category' }));
    expect(onSingle).toHaveBeenLastCalledWith(null);
    expect(pill()).not.toHaveAttribute('data-active');
    expect(trigger()).toHaveFocus();
    expect(document.querySelector('.filter-chip-clear')).toBeNull();
    single.unmount();

    const onMultiple = vi.fn();
    const multiple = render(<Multiple initial={['rent', 'food']} onChange={onMultiple} />);
    // By keyboard: Tab from the trigger reaches the clear button, a tab stop.
    await user.tab();
    expect(trigger()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Clear Tags' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onMultiple).toHaveBeenLastCalledWith([]);
    expect(trigger()).toHaveFocus();
    multiple.unmount();

    const onClear = vi.fn();
    const onChange = vi.fn();
    render(<Single initial="rent" onChange={onChange} onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Clear Category' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
  });

  it('draws the clear button as the trigger sibling, outside the Select, and never opens the list from it', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<Single initial="rent" onClear={onClear} />);
    const clear = element('.filter-chip-clear');
    expect(clear.parentElement).toBe(pill());
    expect(clear.closest('.filter-chip-select')).toBeNull();
    expect(clear.previousElementSibling).toHaveClass('filter-chip-select');
    expect(clear).not.toHaveAttribute('aria-haspopup');
    expect(element('.filter-chip-clear-icon', clear)).toHaveAttribute('aria-hidden', 'true');
    expect(element('.filter-chip-clear-icon svg', clear)).toBeInTheDocument();
    await user.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(pill()).not.toHaveAttribute('data-open');
  });

  it('names the clear button Clear and the label, or labels.clear', () => {
    const { unmount } = render(<Single initial="rent" />);
    expect(screen.getByRole('button', { name: 'Clear Category' })).toHaveClass('filter-chip-clear');
    unmount();
    render(<Single initial="rent" labels={{ clear: (label) => `پاک کردن ${label}` }} />);
    expect(screen.getByRole('button', { name: 'پاک کردن Category' })).toBeInTheDocument();
  });

  it('ignores letters and Left and Right on a closed single chip, and opens on Enter, Space, Arrow Down and Arrow Up', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Single onChange={onChange} />);
    await user.tab();
    expect(trigger()).toHaveFocus();
    // React Aria's Select would choose Salary on "s", then Transport and Rent on the arrows, unseen.
    await user.keyboard('s{ArrowRight}{ArrowLeft}r');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger()).toHaveAccessibleName('Category');
    unmount();
    // React Aria's multiple mode is already quiet on a closed trigger (useSelect.mjs:54-61,85-86); the same guard
    // runs for it.
    const onMultiple = vi.fn();
    const multiple = render(<Multiple onChange={onMultiple} />);
    await user.tab();
    await user.keyboard('s{ArrowRight}{ArrowLeft}');
    expect(onMultiple).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
    multiple.unmount();
    for (const key of ['{Enter}', ' ', '{ArrowDown}', '{ArrowUp}']) {
      const each = render(<Single />);
      await user.tab();
      await user.keyboard(key);
      expect(screen.getByRole('listbox'), key).toBeInTheDocument();
      expect(document.activeElement?.closest('[role="listbox"]'), key).not.toBeNull();
      await user.keyboard('{Escape}');
      each.unmount();
    }
  });

  it('lets a letter reach the open list typeahead', async () => {
    const user = userEvent.setup();
    render(<Single />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveTextContent('Food');
    await user.keyboard('t');
    expect(document.activeElement).toHaveTextContent('Transport');
  });

  it('keeps an open list on Tab, and closes it on Escape with focus on the trigger', async () => {
    const user = userEvent.setup();
    render(<Multiple initial={['food']} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('shows the filter from 9 options, Select rule, and starts it empty each time', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Single />);
    await user.click(trigger());
    expect(screen.queryByRole('searchbox')).toBeNull();
    await user.keyboard('{Escape}');
    unmount();

    render(
      <Single>
        {TWELVE.map((name) => (
          <PickerOption key={name} id={name.toLowerCase()}>
            {name}
          </PickerOption>
        ))}
      </Single>,
    );
    await user.click(trigger());
    const filter = screen.getByRole('searchbox', { name: 'Filter' });
    expect(filter).toHaveFocus();
    await user.type(filter, 'tr');
    expect(shown()).toEqual(['Transport', 'Travel']);
    await user.keyboard('{Escape}{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.click(trigger());
    expect(screen.getByRole('searchbox', { name: 'Filter' })).toHaveValue('');
    expect(shown()).toHaveLength(12);
  });

  it('opens a padded panel dialog named by the trigger for a custom chip, and closes it through close', async () => {
    const user = userEvent.setup();
    render(<Custom valueLabel="Over $100" onClear={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Amount Over $100' });
    expect(button).toBe(trigger());
    expect(button).not.toHaveAttribute('aria-haspopup', 'listbox');
    await user.click(button);
    const dialog = screen.getByRole('dialog', { name: 'Amount Over $100' });
    expect(dialog).toHaveClass('filter-chip-dialog');
    expect(dialog.closest('.popover')).toHaveClass('filter-chip-panel', 'popover-padded');
    expect(pill()).toHaveAttribute('data-open', '');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(pill()).not.toHaveAttribute('data-open');
    // Enter and Space open the panel, as any dialog trigger; Escape closes it with focus on the trigger.
    for (const key of ['{Enter}', ' ']) {
      act(() => {
        trigger().focus();
      });
      await user.keyboard(key);
      expect(screen.getByRole('dialog'), key).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog'), key).toBeNull();
      expect(trigger(), key).toHaveFocus();
    }
    // The arrows do not open a panel: it is a dialog, not a list.
    await user.keyboard('{ArrowDown}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is active for a custom chip only with valueLabel, and clearable only with onClear', () => {
    const { rerender } = render(<Custom />);
    expect(pill()).not.toHaveAttribute('data-active');
    expect(trigger()).toHaveAccessibleName('Amount');
    rerender(<Custom valueLabel="" onClear={() => undefined} />);
    expect(pill()).not.toHaveAttribute('data-active');
    expect(document.querySelector('.filter-chip-clear')).toBeNull();
    rerender(<Custom valueLabel="Over $100" />);
    expect(pill()).toHaveAttribute('data-active', '');
    expect(document.querySelector('.filter-chip-clear')).toBeNull();
    rerender(<Custom valueLabel="Over $100" onClear={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Clear Amount' })).toBeInTheDocument();
  });

  it('draws no clear button and opens nothing while disabled', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Single initial="rent" isDisabled />);
    expect(pill()).toHaveAttribute('data-disabled', '');
    expect(pill()).toHaveAttribute('data-active', '');
    expect(trigger()).toBeDisabled();
    expect(document.querySelector('.filter-chip-clear')).toBeNull();
    await user.click(trigger());
    expect(screen.queryByRole('listbox')).toBeNull();
    unmount();
    render(<Custom valueLabel="Over $100" onClear={() => undefined} isDisabled />);
    expect(trigger()).toBeDisabled();
    expect(document.querySelector('.filter-chip-clear')).toBeNull();
    await user.click(trigger());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the library popover only with the Select state, never in React Aria hidden pass', async () => {
    const user = userEvent.setup();
    hiddenPopovers.count = 0;
    render(<Multiple initial={['food']} />);
    await user.click(trigger());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(hiddenPopovers.count).toBe(0);
  });

  it('draws a section with a title, the Select look and Any, under the sheet place', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FilterChipPlaceContext value={place({ place: 'sheet' })}>
        <Single />
      </FilterChipPlaceContext>,
    );
    expect(container.querySelector('.filter-chip')).toBeNull();
    const section = screen.getByRole('region', { name: 'Category' });
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveClass('filter-section');
    const title = screen.getByRole('heading', { level: 3, name: 'Category' });
    expect(title).toHaveClass('filter-section-title');
    expect(title.parentElement).toHaveClass('filter-section-head');
    const button = screen.getByRole('button', { name: 'Any Category' });
    expect(button).toHaveClass('input', 'select-trigger');
    expect(button.closest('.filter-section-select')).toHaveClass('field', 'select');
    expect(element('.select-value', button)).toHaveAttribute('data-placeholder');
    expect(element('.select-chevron', button)).toHaveAttribute('aria-hidden', 'true');
    // No clear while inactive, no pill and no guard: a letter reaches React Aria's Select as in Select.
    expect(section.querySelector('.filter-section-clear')).toBeNull();
    await user.click(button);
    expect(screen.getByRole('listbox', { name: 'Category' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    expect(button).toHaveAccessibleName('Rent Category');
    expect(element('.select-value', button)).not.toHaveAttribute('data-placeholder');

    // A custom chip draws its content under the title, called with the place's close.
    const close = vi.fn();
    render(
      <FilterChipPlaceContext value={place({ place: 'panel', panelLabels: new Set(['Amount']), close })}>
        <Custom valueLabel="Over $100" onClear={() => undefined} />
      </FilterChipPlaceContext>,
    );
    const amount = screen.getByRole('region', { name: 'Amount' });
    await user.click(within(amount).getByRole('button', { name: 'Apply' }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('shows a section Clear word named Clear and the label, which clears and focuses the section trigger', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterChipPlaceContext value={place({ place: 'sheet', clearWord: 'Reset' })}>
        <Multiple initial={['rent']} onChange={onChange} labels={{ clear: (label) => `Reset ${label}` }} />
      </FilterChipPlaceContext>,
    );
    const clear = screen.getByRole('button', { name: 'Reset Tags' });
    expect(clear).toHaveClass('button', 'button-tertiary', 'filter-section-clear');
    expect(clear).toHaveTextContent(/^Reset$/);
    await user.click(clear);
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole('button', { name: 'Any Tags' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Reset Tags' })).toBeNull();
  });

  it('renders nothing in the row for an inactive secondary chip while More is drawn, and stays in the row otherwise', () => {
    const { container, rerender } = render(
      <FilterChipPlaceContext value={place({ place: 'row', hasMore: true })}>
        <Single isSecondary />
      </FilterChipPlaceContext>,
    );
    expect(container).toBeEmptyDOMElement();
    // Active, it joins the row.
    rerender(
      <FilterChipPlaceContext value={place({ place: 'row', hasMore: true })}>
        <Single isSecondary initial="rent" key="a" />
      </FilterChipPlaceContext>,
    );
    expect(pill()).toHaveAttribute('data-active', '');
    // With no More drawn, an inactive secondary chip stays in the row, as a primary one does.
    rerender(
      <FilterChipPlaceContext value={place({ place: 'row', hasMore: false })}>
        <Single isSecondary key="b" />
      </FilterChipPlaceContext>,
    );
    expect(pill()).not.toHaveAttribute('data-active');
    rerender(
      <FilterChipPlaceContext value={place({ place: 'row', hasMore: true })}>
        <Single key="c" />
      </FilterChipPlaceContext>,
    );
    expect(pill()).toBeInTheDocument();
  });

  it('renders in the panel only when its label is in panelLabels', () => {
    const { container, rerender } = render(
      <FilterChipPlaceContext value={place({ place: 'panel', panelLabels: new Set(['Tags']) })}>
        <Single isSecondary />
      </FilterChipPlaceContext>,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <FilterChipPlaceContext value={place({ place: 'panel', panelLabels: new Set(['Category']) })}>
        <Single isSecondary />
      </FilterChipPlaceContext>,
    );
    expect(screen.getByRole('region', { name: 'Category' })).toBeInTheDocument();
  });

  it('calls onSecondaryCleared for a secondary chip cleared in the row', async () => {
    const user = userEvent.setup();
    const onSecondaryCleared = vi.fn();
    const onChange = vi.fn();
    render(
      <FilterChipPlaceContext value={place({ place: 'row', hasMore: true, onSecondaryCleared })}>
        <Single isSecondary initial="rent" onChange={onChange} />
      </FilterChipPlaceContext>,
    );
    await user.click(screen.getByRole('button', { name: 'Clear Category' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onSecondaryCleared).toHaveBeenCalledTimes(1);
    // The chip left the row with its value.
    expect(document.querySelector('.filter-chip')).toBeNull();
  });

  it('passes className, popoverClassName, ref and data attributes', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <FilterChip
        ref={ref}
        className="mine"
        popoverClassName="my-popover"
        label="Category"
        selectionMode="single"
        value="food"
        onChange={() => undefined}
      >
        {SIX}
      </FilterChip>,
    );
    expect(pill().className).toBe('filter-chip mine');
    expect(ref.current).toBe(pill());
    await user.click(trigger());
    expect(element('.menu-popover')).toHaveClass('select-popover', 'my-popover', 'popover-match-trigger');
    expect(screen.getByRole('listbox', { name: 'Category' })).toHaveClass('menu', 'select-list');
    await user.keyboard('{Escape}');

    render(
      <FilterChip label="Amount" popoverClassName="my-panel" valueLabel="Over $100">
        <p>Content</p>
      </FilterChip>,
    );
    await user.click(screen.getByRole('button', { name: 'Amount Over $100' }));
    expect(element('.filter-chip-panel')).toHaveClass('my-panel');
  });

  // One test per state, so each axe pass has its own time limit on a slow runner.
  const AXE_CASES: [
    name: string,
    chip: () => ReactElement,
    act?: (user: ReturnType<typeof userEvent.setup>) => Promise<void>,
  ][] = [
    ['inactive', () => <Single />],
    ['single active', () => <Single initial="rent" />],
    ['multiple active', () => <Multiple initial={['food', 'rent', 'salary', 'health']} />],
    [
      'open list',
      () => <Multiple initial={['food']} />,
      async (user) => {
        await user.click(trigger());
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      },
    ],
    [
      'custom panel open',
      () => <Custom valueLabel="Over $100" onClear={() => undefined} />,
      async (user) => {
        await user.click(trigger());
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      },
    ],
    ['disabled', () => <Single initial="rent" isDisabled />],
    [
      'as a section',
      () => (
        <FilterChipPlaceContext value={place({ place: 'sheet' })}>
          <Single initial="rent" />
          <Multiple />
        </FilterChipPlaceContext>
      ),
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, chip, act) => {
    const user = userEvent.setup();
    axe.configure({ rules: [ROW_RULE] });
    try {
      render(chip());
      if (act) await act(user);
      // An open list or panel portals to the body, so the whole body is checked.
      await expectNoA11yViolations(document.body);
    } finally {
      axe.reset();
    }
  });

  it('types its value by its selection mode, and takes no name, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    const singleWithArray = (
      // @ts-expect-error a single chip's value is one key or null
      <FilterChip label="Category" selectionMode="single" value={['food']} onChange={() => undefined}>
        {SIX}
      </FilterChip>
    );
    const multipleWithKey = (
      <FilterChip
        label="Tags"
        selectionMode="multiple"
        value={['food']}
        // @ts-expect-error a multiple chip calls onChange with every chosen key
        onChange={(value: Key) => String(value)}
      >
        {SIX}
      </FilterChip>
    );
    const customWithItems = (
      // @ts-expect-error a custom chip holds its own content and takes no items
      <FilterChip label="Amount" items={[{ id: 1 }]}>
        <p>Content</p>
      </FilterChip>
    );
    const withName = (
      // @ts-expect-error a chip submits nothing: its value is in the URL, and a FilterBar renders it twice
      <FilterChip label="Category" selectionMode="single" value={null} onChange={() => undefined} name="c">
        {SIX}
      </FilterChip>
    );
    expect([singleWithArray, multipleWithKey, customWithItems, withName]).toHaveLength(4);
  });
});
