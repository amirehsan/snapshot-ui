import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import type { Key } from 'react-aria-components';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf } from '../../test/dom';
import { PickerOption, PickerSection } from '../picker';
import { Select, type SelectBaseProps } from './Select';

/** Option rows are named by their label and described by their hint, so axe's label-in-name check is off. */
const ROW_A11Y = { rules: { 'label-content-name-mismatch': { enabled: false } } };

function Icon(): ReactElement {
  return <svg data-testid="icon" />;
}

function element(selector: string, scope: ParentNode = document): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/**
 * The field's root. React Aria builds a Select's collection by rendering its children into a template first, so
 * the root is not the container's first element.
 */
const root = (container: HTMLElement): HTMLElement => element(':scope > .select', container);

/** The trigger, found by its class, since its name is its value and its label together. */
const trigger = (): HTMLButtonElement => element('.select-trigger') as HTMLButtonElement;

/** Five options, the docs' basic list. */
function Five(props: Partial<Omit<SelectBaseProps, 'children'>>): ReactElement {
  return (
    <Select label="Category" {...props}>
      <PickerOption id="food">Food</PickerOption>
      <PickerOption id="rent">Rent</PickerOption>
      <PickerOption id="salary">Salary</PickerOption>
      <PickerOption id="transport">Transport</PickerOption>
      <PickerOption id="utilities">Utilities</PickerOption>
    </Select>
  );
}

/** Options in two sections: `spending` in the first, `income` in the second. */
function Sectioned({
  spending,
  income,
  isFilterable,
}: {
  spending: string[];
  income: string[];
  isFilterable?: boolean;
}): ReactElement {
  return (
    <Select label="Category" isFilterable={isFilterable}>
      <PickerSection title="Spending">
        {spending.map((name) => (
          <PickerOption key={name} id={name}>
            {name}
          </PickerOption>
        ))}
      </PickerSection>
      <PickerSection title="Income">
        {income.map((name) => (
          <PickerOption key={name} id={name}>
            {name}
          </PickerOption>
        ))}
      </PickerSection>
    </Select>
  );
}

const SPENDING = ['Café', 'Groceries', 'Home rent', 'Transport', 'Utilities'];
const INCOME = ['Salary', 'Refunds', 'Interest', 'Gifts'];

/** A Select whose value the caller holds, as an app that keeps it in its URL does. */
function Controlled({ onChange }: { onChange: (value: Key | null) => void }): ReactElement {
  const [value, setValue] = useState<Key | null>('food');
  return (
    <Five
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

/** Answers `(pointer: coarse)` with true, as a phone does, until the test ends. */
function coarsePointer(): void {
  const spy = vi.spyOn(window, 'matchMedia').mockImplementation((media: string) => ({
    matches: media === '(pointer: coarse)',
    media,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
  onTestFinished(() => {
    spy.mockRestore();
  });
}

describe('Select', () => {
  it('is a field whose button opens a listbox, named by its value and its label', async () => {
    const user = userEvent.setup();
    const { container } = render(<Five defaultValue="food" description="Where the money went." />);
    expect(root(container)).toHaveClass('field', 'select');
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
    const button = screen.getByRole('button', { name: 'Food Category' });
    expect(button).toBe(trigger());
    expect(button).toHaveClass('input', 'select-trigger');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAccessibleDescription('Where the money went.');
    expect(element('.select-chevron', button)).toHaveAttribute('aria-hidden', 'true');
    expect([...root(container).children].map((child) => child.className).slice(0, 3)).toEqual([
      'field-head',
      'input select-trigger',
      'field-description',
    ]);
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.click(button);
    const list = screen.getByRole('listbox');
    expect(list).toHaveClass('menu', 'select-list');
    expect(list.closest('.popover')).toHaveClass('menu-popover', 'select-popover', 'popover-match-trigger');
    expect(root(container)).toHaveAttribute('data-open');
  });

  it('shows the placeholder, Choose an option by default, with data-placeholder', () => {
    const { unmount } = render(<Five />);
    expect(element('.select-value')).toHaveTextContent('Choose an option');
    expect(element('.select-value')).toHaveAttribute('data-placeholder');
    unmount();
    const { container } = render(<Five aria-label="Category" label={undefined} placeholder="Any category" />);
    expect(element('.select-value')).toHaveTextContent('Any category');
    // Named only by aria-label. The placeholder is slate either way, so the root carries no mark for it.
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
    expect(container.querySelector('.field-head')).toBeNull();
  });

  it('takes value and onChange, and defaultValue alone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Controlled onChange={onChange} />);
    expect(element('.select-value')).toHaveTextContent('Food');
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    expect(onChange).toHaveBeenCalledWith('rent');
    expect(element('.select-value')).toHaveTextContent('Rent');
    unmount();

    // A value the caller holds still: the choice is reported and the trigger does not move.
    const fixed = vi.fn();
    const { unmount: unmountFixed } = render(<Five value="food" onChange={fixed} />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Salary' }));
    expect(fixed).toHaveBeenCalledWith('salary');
    expect(element('.select-value')).toHaveTextContent('Food');
    unmountFixed();

    render(<Five defaultValue="transport" />);
    expect(element('.select-value')).toHaveTextContent('Transport');
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Utilities' }));
    expect(element('.select-value')).toHaveTextContent('Utilities');
  });

  it('shows the chosen option icon and label in the trigger, and not its hint, end value or check', () => {
    render(
      <Select label="Category" defaultValue="food">
        <PickerOption id="food" icon={<Icon />} description="Groceries and markets" end="$1,204.50">
          Food
        </PickerOption>
      </Select>,
    );
    const value = element('.select-value');
    expect(value.querySelector('[data-testid="icon"]')).not.toBeNull();
    expect(element('.select-value-label', value)).toHaveTextContent('Food');
    for (const part of ['.menu-item-description', '.menu-item-end', '.menu-item-check', '.menu-item-label']) {
      expect(value.querySelector(part), part).toBeNull();
    }
    expect(value).toHaveTextContent(/^Food$/);
    expect(screen.getByRole('button', { name: 'Food Category' })).toBeInTheDocument();
  });

  it('opens on Enter, Space, Arrow Down and Arrow Up, and closes on Escape with focus back on the trigger', async () => {
    const user = userEvent.setup();
    for (const key of ['{Enter}', ' ', '{ArrowDown}', '{ArrowUp}']) {
      const { unmount } = render(<Five />);
      await user.tab();
      expect(trigger(), key).toHaveFocus();
      await user.keyboard(key);
      expect(screen.getByRole('listbox'), key).toBeInTheDocument();
      expect(document.activeElement?.closest('[role="listbox"]'), key).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox'), key).toBeNull();
      expect(trigger(), key).toHaveFocus();
      unmount();
    }
  });

  it('chooses the next option by a letter, and the previous and next by Left and Right, while closed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Five onChange={onChange} />);
    await user.tab();
    await user.keyboard('s');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(element('.select-value')).toHaveTextContent('Salary');
    await user.keyboard('{ArrowRight}');
    expect(element('.select-value')).toHaveTextContent('Transport');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(element('.select-value')).toHaveTextContent('Rent');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith('rent');
  });

  it('stops the arrows at the ends of the list', async () => {
    const user = userEvent.setup();
    render(<Five />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveTextContent('Food');
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toHaveTextContent('Food');
    await user.keyboard('{End}');
    expect(document.activeElement).toHaveTextContent('Utilities');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveTextContent('Utilities');
    await user.keyboard('{Home}');
    expect(document.activeElement).toHaveTextContent('Food');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(element('.select-value')).toHaveTextContent('Food');
  });

  it('shows no filter at 8 options and a filter at 9, counted across sections', async () => {
    const user = userEvent.setup();
    // Eight options and two headings: no filter.
    const { unmount } = render(<Sectioned spending={SPENDING} income={INCOME.slice(0, 3)} />);
    await user.click(trigger());
    expect(screen.getAllByRole('option')).toHaveLength(8);
    expect(screen.queryByRole('searchbox')).toBeNull();
    unmount();
    // One more option: the filter, named Filter, unlabelled and so with a slate placeholder.
    render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    const filter = screen.getByRole('searchbox', { name: 'Filter' });
    expect(filter).toHaveAttribute('placeholder', 'Filter');
    expect(filter.closest('.search-field')).toHaveAttribute('data-unlabelled', '');
    expect(filter.closest('.select-filter')?.parentElement).toBe(screen.getByRole('listbox').parentElement);
  });

  it('shows the filter by isFilterable at 3 options, and none by isFilterable false at 12', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Sectioned spending={SPENDING.slice(0, 2)} income={INCOME.slice(0, 1)} isFilterable />,
    );
    await user.click(trigger());
    expect(screen.getByRole('searchbox', { name: 'Filter' })).toBeInTheDocument();
    unmount();
    render(
      <Sectioned spending={[...SPENDING, 'Health', 'Travel', 'Pets']} income={INCOME} isFilterable={false} />,
    );
    await user.click(trigger());
    expect(screen.getAllByRole('option')).toHaveLength(12);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('keeps an option when every word of the text appears in it, case and accents aside, and hides a section left empty', async () => {
    const user = userEvent.setup();
    render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    const filter = screen.getByRole('searchbox', { name: 'Filter' });
    // The options left; the empty line sits in a row of its own, which is not one.
    const names = (): string[] =>
      [...document.querySelectorAll('.picker-option')].map((option) => option.textContent);

    await user.type(filter, 'cafe');
    expect(names()).toEqual(['Café']);
    await user.clear(filter);
    await user.type(filter, 'RENT home');
    expect(names()).toEqual(['Home rent']);
    await user.clear(filter);
    await user.type(filter, 'rent car');
    expect(names()).toEqual([]);
    await user.clear(filter);
    await user.type(filter, 'salary');
    expect(names()).toEqual(['Salary']);
    expect(screen.queryByRole('group', { name: 'Spending' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Income' })).toBeInTheDocument();
    await user.clear(filter);
    expect(names()).toHaveLength(9);
  });

  it('says No matches, or labels.empty, when the filter keeps nothing', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    await user.type(screen.getByRole('searchbox', { name: 'Filter' }), 'zzz');
    expect(element('.picker-empty')).toHaveTextContent('No matches');
    expect(element('.picker-empty').closest('[role="listbox"]')).not.toBeNull();
    unmount();
    render(
      <Select label="دسته" isFilterable labels={{ filter: 'جستجو', empty: 'چیزی پیدا نشد' }}>
        <PickerOption id="food">غذا</PickerOption>
      </Select>,
    );
    await user.click(trigger());
    await user.type(screen.getByRole('searchbox', { name: 'جستجو' }), 'zzz');
    expect(element('.picker-empty')).toHaveTextContent('چیزی پیدا نشد');
  });

  it('clears the text with the first Escape and closes on the second', async () => {
    const user = userEvent.setup();
    render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    const filter = screen.getByRole('searchbox', { name: 'Filter' });
    await user.type(filter, 'rent');
    await user.keyboard('{Escape}');
    expect(filter).toHaveValue('');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('chooses the active option with the arrows and Enter from the filter', async () => {
    const user = userEvent.setup();
    render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    const filter = screen.getByRole('searchbox', { name: 'Filter' });
    // "re" keeps Home rent, Refunds and Interest, and React Aria makes the first one kept the active one; focus
    // stays in the field while the arrows move the active one.
    await user.type(filter, 're');
    await waitFor(() => {
      expect(filter.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Home rent' }).id,
      );
    });
    expect(filter).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(filter.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Refunds' }).id,
    );
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(element('.select-value')).toHaveTextContent('Refunds');
  });

  it('starts the filter empty each time the list opens', async () => {
    const user = userEvent.setup();
    render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    await user.type(screen.getByRole('searchbox', { name: 'Filter' }), 'sal');
    await user.click(screen.getByRole('option', { name: 'Salary' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.click(trigger());
    expect(screen.getByRole('searchbox', { name: 'Filter' })).toHaveValue('');
    expect(screen.getAllByRole('option')).toHaveLength(9);
  });

  it('focuses the filter when the list opens, and not on a coarse pointer', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    expect(screen.getByRole('searchbox', { name: 'Filter' })).toHaveFocus();
    unmount();

    coarsePointer();
    render(<Sectioned spending={SPENDING} income={INCOME} />);
    await user.click(trigger());
    const filter = screen.getByRole('searchbox', { name: 'Filter' });
    expect(filter).not.toHaveFocus();
    // Focus is in the list, whose options take real focus here instead of the filter's virtual focus.
    expect(element('.select-popover').contains(document.activeElement)).toBe(true);
    expect(screen.getByRole('listbox').contains(document.activeElement)).toBe(true);
    // The arrows move the active option, Enter chooses it, and the list closes with focus on the trigger.
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('option', { name: 'Café' }));
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(element('.select-value')).toHaveTextContent('Café');
    expect(trigger()).toHaveFocus();
  });

  it('focuses the filter of a list opened by defaultOpen, on a coarse pointer too', () => {
    coarsePointer();
    render(
      <Select label="Category" defaultOpen isFilterable>
        <PickerOption id="food">Food</PickerOption>
      </Select>,
    );
    expect(screen.getByRole('searchbox', { name: 'Filter' })).toHaveFocus();
  });

  it('shows the Changed chip and reads it with the trigger while changed and valid', () => {
    const { container, rerender } = render(<Five defaultValue="food" isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = element('.field-changed');
    expect(chip).toHaveTextContent('Changed');
    expect(trigger().getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    rerender(<Five defaultValue="food" isChanged changedLabel="Unsaved" />);
    expect(element('.field-changed')).toHaveTextContent('Unsaved');
    rerender(<Five defaultValue="food" isChanged isInvalid errorMessage="Choose a category" />);
    expect(container.querySelector('.field-changed')).toBeNull();
    expect(trigger()).toHaveAccessibleDescription('Choose a category');
    rerender(<Five defaultValue="food" />);
    expect(root(container)).not.toHaveAttribute('data-changed');
  });

  it('submits the chosen key through the hidden select', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Five name="category" defaultValue="rent" />
      </form>,
    );
    expect(new FormData(formOf(container)).get('category')).toBe('rent');
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Salary' }));
    expect(new FormData(formOf(container)).get('category')).toBe('salary');
  });

  it('puts the popover under the trigger at its start, with a 320px height cap', async () => {
    const user = userEvent.setup();
    render(<Five />);
    await user.click(trigger());
    const popover = element('.select-popover');
    expect(popover).toHaveAttribute('data-placement', 'bottom');
    const cap = parseFloat(popover.style.maxHeight);
    expect(cap).toBeGreaterThan(0);
    expect(cap).toBeLessThanOrEqual(320);
  });

  it('passes className, popoverClassName, ref and data attributes', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Five
        ref={ref}
        className={({ isOpen }) => (isOpen ? 'mine is-open' : 'mine')}
        popoverClassName="my-popover"
        data-testid="category"
      />,
    );
    expect(root(container).className.startsWith('field select')).toBe(true);
    expect(root(container)).toHaveClass('mine');
    expect(ref.current).toBe(root(container));
    expect(root(container)).toHaveAttribute('data-testid', 'category');
    await user.click(trigger());
    expect(root(container)).toHaveClass('is-open');
    expect(element('.select-popover')).toHaveClass('my-popover');
  });

  it('takes its options as items with a function child', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 'food', name: 'Food', total: '$1,204.50' },
      { id: 'rent', name: 'Rent', total: '$2,100.00' },
    ];
    render(
      <Select label="Category" items={items} defaultValue="rent">
        {(item) => <PickerOption end={item.total}>{item.name}</PickerOption>}
      </Select>,
    );
    expect(element('.select-value')).toHaveTextContent('Rent');
    await user.click(trigger());
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Food$1,204.50',
      'Rent$2,100.00',
    ]);
  });

  it('draws the disabled and invalid states on its root', () => {
    const { container, rerender } = render(<Five defaultValue="food" isDisabled />);
    expect(root(container)).toHaveAttribute('data-disabled');
    expect(trigger()).toBeDisabled();
    rerender(<Five isInvalid errorMessage="Choose a category" />);
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(screen.getByText('Choose a category')).toHaveClass('field-error');
  });

  it('has no axe violations closed, open, filterable, changed, invalid and disabled', async () => {
    for (const [name, select] of [
      ['closed', <Five key="closed" defaultValue="food" description="Where the money went." />],
      [
        'open',
        <Select key="open" label="Category" defaultValue="food" defaultOpen>
          <PickerOption id="food" icon={<Icon />} description="Groceries and markets" end="$1,204.50">
            Food
          </PickerOption>
          <PickerOption id="rent">Rent</PickerOption>
        </Select>,
      ],
      [
        'filterable',
        <Select key="filterable" label="Category" defaultOpen isFilterable>
          <PickerSection title="Spending">
            <PickerOption id="food">Food</PickerOption>
          </PickerSection>
        </Select>,
      ],
      ['changed', <Five key="changed" defaultValue="food" isChanged />],
      ['invalid', <Five key="invalid" isInvalid errorMessage="Choose a category" />],
      ['disabled', <Five key="disabled" defaultValue="food" isDisabled />],
      ['unlabelled', <Five key="unlabelled" label={undefined} aria-label="Category" />],
    ] as const) {
      const { unmount } = render(select);
      // An open list portals to the body, so the whole body is checked.
      await expectNoA11yViolations(document.body, ROW_A11Y).catch((error: unknown) => {
        throw new Error(`${name}: ${String(error)}`);
      });
      unmount();
    }
  });

  it('exposes value, defaultValue and onChange, and requires a name, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error selectedKey is deprecated in React Aria; the Select takes value
    const withSelectedKey = <Five selectedKey="food" />;
    const withOnSelectionChange = (
      // @ts-expect-error onSelectionChange is deprecated in React Aria; the Select takes onChange
      <Select label="Category" onSelectionChange={() => undefined}>
        <PickerOption id="food">Food</PickerOption>
      </Select>
    );
    const nameless = (
      // @ts-expect-error a select with no label, aria-label or aria-labelledby has no name
      <Select>
        <PickerOption id="food">Food</PickerOption>
      </Select>
    );
    const byAriaLabel = (
      <Select aria-label="Category" value="food" onChange={() => undefined}>
        <PickerOption id="food">Food</PickerOption>
      </Select>
    );
    expect([withSelectedKey, withOnSelectionChange, nameless, byAriaLabel]).toHaveLength(4);
  });
});

describe('Select, in a section', () => {
  it('counts no heading as an option', async () => {
    const user = userEvent.setup();
    render(<Sectioned spending={SPENDING} income={INCOME.slice(0, 3)} />);
    await user.click(trigger());
    const spending = screen.getByRole('group', { name: 'Spending' });
    expect(within(spending).getAllByRole('option')).toHaveLength(5);
  });
});
