import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRef, useState, type ReactElement } from 'react';
import { I18nProvider, type Key } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf } from '../../test/dom';
import { PickerOption } from '../picker';
import type { PopoverProps } from '../popover/Popover';
import { MultiSelect, type MultiSelectBaseProps } from './MultiSelect';

/**
 * How many times the library's Popover has rendered outside the combo box's state, which is React Aria's hidden
 * pass, through a spy that renders the real one.
 */
const hiddenPopovers = vi.hoisted(() => ({ count: 0 }));

vi.mock('../popover/Popover', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../popover/Popover')>();
  const { useContext } = await import('react');
  const { ComboBoxStateContext } = await import('react-aria-components');
  return {
    ...actual,
    Popover: (props: PopoverProps) => {
      if (useContext(ComboBoxStateContext) === null) hiddenPopovers.count += 1;
      return actual.Popover(props);
    },
  };
});

/** Option rows are named by their label and described by their hint, so axe's label-in-name check is off. */
const ROW_A11Y = { rules: { 'label-content-name-mismatch': { enabled: false } } };

/**
 * While the list is open React Aria hides everything but the input and the list from assistive technology,
 * the tags too, and leaves them focusable by design, so a press can still remove one and Shift+Tab still
 * reaches them, closing the list. Axe's `aria-hidden-focus` is skipped on the value alone, by the rule's
 * selector, as the stories' MENU_ROW_A11Y scopes its own exception; it runs on everything else.
 */
const OPEN_VALUE_RULE = {
  id: 'aria-hidden-focus',
  selector: '[aria-hidden="true"]:not(.multi-select-value)',
};

function element(selector: string, scope: ParentNode = document): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/**
 * The field's root. React Aria builds a combo box's collection by rendering its children into a template first,
 * so the root is not the container's first element.
 */
const root = (container: HTMLElement): HTMLElement => element(':scope > .multi-select', container);

const input = (): HTMLInputElement => screen.getByRole('combobox');
const frame = (): HTMLElement => element('.multi-select-control');
const button = (): HTMLButtonElement => element('.combo-box-button') as HTMLButtonElement;

/** The tags' texts, in the order drawn. */
const tags = (): string[] =>
  [...document.querySelectorAll('.multi-select-tag-text')].map((text) => text.textContent);
const tag = (text: string): HTMLElement => screen.getByRole('row', { name: text });

/** The options the open list shows, by their text. */
const shown = (): string[] =>
  [...document.querySelectorAll('[role="listbox"] .picker-option')].map((option) => option.textContent);

const CATEGORIES = ['Food', 'Rent', 'Fun', 'Travel', 'Health'];

/** Five budget categories. */
function Five(props: Partial<Omit<MultiSelectBaseProps, 'children'>>): ReactElement {
  return (
    <MultiSelect label="Categories" {...props}>
      {CATEGORIES.map((name) => (
        <PickerOption key={name} id={name.toLowerCase()}>
          {name}
        </PickerOption>
      ))}
    </MultiSelect>
  );
}

/** A multi-select whose value the caller holds, as an app that keeps it in its URL does. */
function Controlled({ onChange }: { onChange: (value: Key[]) => void }): ReactElement {
  const [value, setValue] = useState<readonly Key[]>(['rent']);
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

describe('MultiSelect', () => {
  it('is a combobox named by its label, with the chosen values as a grid named Selected and the label', () => {
    const { container } = render(
      <Five defaultValue={['food', 'rent']} description="Where the money went." placeholder="Add one" />,
    );
    expect(root(container)).toHaveClass('field', 'multi-select');
    const field = screen.getByRole('combobox', { name: 'Categories' });
    expect(field).toHaveClass('multi-select-input');
    expect(field).not.toHaveClass('input');
    // The placeholder shows only while nothing is chosen.
    expect(field).not.toHaveAttribute('placeholder');
    expect(field.getAttribute('aria-describedby')?.split(' ')).toContain(element('.multi-select-value').id);
    const grid = screen.getByRole('grid', { name: 'Selected Categories' });
    expect(grid).toHaveClass('multi-select-tag-list');
    expect(grid.closest('.multi-select-tags')).not.toBeNull();
    expect(frame()).toHaveClass('input', 'multi-select-control');
    // In DOM order: the value with its tags, the input, then the button; no Spinner while nothing loads.
    expect([...frame().children].map((child) => child.className)).toEqual([
      'multi-select-value',
      'multi-select-input',
      'input-button combo-box-button',
    ]);
    expect(screen.getByRole('button', { name: 'Show options Categories' })).toBe(button());
    expect([...root(container).children].map((child) => child.className).slice(0, 3)).toEqual([
      'field-head',
      'input multi-select-control',
      'field-description',
    ]);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows the placeholder while nothing is chosen', () => {
    render(<Five placeholder="Add a category" />);
    expect(input()).toHaveAttribute('placeholder', 'Add a category');
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('writes data-unlabelled on the root only when no visible label names it', () => {
    const { container, unmount } = render(<Five placeholder="Add a category" />);
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
    unmount();
    const unlabelled = render(
      <Five label={undefined} aria-label="Categories" placeholder="Add a category" />,
    );
    expect(root(unlabelled.container)).toHaveAttribute('data-unlabelled', '');
    expect(screen.getByRole('combobox', { name: 'Categories' })).toBeInTheDocument();
  });

  it('takes value and onChange with an array, and defaultValue alone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Controlled onChange={onChange} />);
    expect(tags()).toEqual(['Rent']);
    await user.click(button());
    await user.click(screen.getByRole('option', { name: 'Food' }));
    expect(onChange).toHaveBeenLastCalledWith(['rent', 'food']);
    expect(tags()).toEqual(['Rent', 'Food']);
    unmount();

    render(<Five defaultValue={['fun']} />);
    expect(tags()).toEqual(['Fun']);
  });

  it('toggles an option on a press and on Enter, keeps the list open and empties the input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Five onChange={onChange} />);
    await user.type(input(), 'fo');
    expect(shown()).toEqual(['Food']);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['food']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input()).toHaveValue('');
    expect(input()).toHaveFocus();
    // The emptied input shows every option again; a press toggles one on, and another press off.
    expect(shown()).toEqual(CATEGORIES);
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    expect(onChange).toHaveBeenLastCalledWith(['food', 'rent']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Food' }));
    expect(onChange).toHaveBeenLastCalledWith(['rent']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('keeps the tags reachable while the list is open, when React Aria hides them from assistive technology', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Five defaultValue={['food']} />
        <button type="button">Next</button>
      </>,
    );
    const value = element('.multi-select-value');
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    expect(value).toHaveAttribute('aria-hidden', 'true');
    expect(value).not.toHaveAttribute('inert');
    // Shift+Tab from the input still reaches the tags, closes the list and changes nothing.
    await user.tab({ shift: true });
    expect(tag('Food')).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(tags()).toEqual(['Food']);
    expect(value).not.toHaveAttribute('aria-hidden');
  });

  it('removes a tag by its button while the list is open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Five defaultValue={['food']} onChange={onChange} />);
    await user.click(input());
    await user.keyboard('re{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['food', 'rent']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // React Aria hides it from assistive technology while the list is open; the pointer still reaches it.
    await user.click(screen.getByRole('button', { name: 'Remove Food', hidden: true }));
    expect(onChange).toHaveBeenLastCalledWith(['rent']);
    expect(tags()).toEqual(['Rent']);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('checks the chosen rows and draws no ink pill', async () => {
    const user = userEvent.setup();
    render(<Five defaultValue={['rent']} />);
    await user.click(button());
    const rent = screen.getByRole('option', { name: 'Rent' });
    expect(rent).toHaveAttribute('aria-selected', 'true');
    expect(rent).toHaveAttribute('data-selection-mode', 'multiple');
    expect(element('.menu-item-check', rent)).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getByRole('option', { name: 'Food' })).toHaveAttribute('aria-selected', 'false');
  });

  it('draws a tag per chosen option with its text value, in the order chosen', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect label="Categories">
        <PickerOption id="food" description="Groceries and markets">
          Food
        </PickerOption>
        <PickerOption id="rent" textValue="Rent and bills">
          <b>Rent</b> and bills
        </PickerOption>
        <PickerOption id="fun">Fun</PickerOption>
      </MultiSelect>,
    );
    await user.click(button());
    await user.click(screen.getByRole('option', { name: 'Rent and bills' }));
    await user.click(screen.getByRole('option', { name: 'Fun' }));
    await user.click(screen.getByRole('option', { name: 'Food' }));
    // The hint never reaches the tag; a label that is not a string shows its text value.
    expect(tags()).toEqual(['Rent and bills', 'Fun', 'Food']);
  });

  it('removes a tag by its button, named Remove and the tag text, or labels.remove', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Five defaultValue={['food', 'rent']} onChange={onChange} />);
    const remove = screen.getByRole('button', { name: 'Remove Food' });
    expect(remove).toHaveClass('multi-select-tag-remove');
    expect(remove).toHaveAttribute('tabindex', '-1');
    expect(element('svg', remove)).toHaveAttribute('aria-hidden', 'true');
    await user.click(remove);
    expect(onChange).toHaveBeenLastCalledWith(['rent']);
    expect(tags()).toEqual(['Rent']);
    unmount();

    render(
      <MultiSelect label="دسته‌ها" defaultValue={['food']} labels={{ remove: 'حذف', selected: 'انتخاب‌شده' }}>
        <PickerOption id="food">غذا</PickerOption>
      </MultiSelect>,
    );
    expect(screen.getByRole('button', { name: 'حذف غذا' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'انتخاب‌شده دسته‌ها' })).toBeInTheDocument();
  });

  it('removes a focused tag on Backspace and on Delete, and focuses the next one, or the previous one', async () => {
    const user = userEvent.setup();
    render(<Five defaultValue={['food', 'rent', 'fun']} />);
    await user.tab();
    expect(tag('Food')).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(tags()).toEqual(['Rent', 'Fun']);
    expect(tag('Rent')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tag('Fun')).toHaveFocus();
    await user.keyboard('{Delete}');
    expect(tags()).toEqual(['Rent']);
    expect(tag('Rent')).toHaveFocus();
  });

  it('focuses the last tag on Backspace in an empty input and removes it only on a second Backspace', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Five defaultValue={['food', 'rent']} onChange={onChange} />);
    await user.click(input());
    await user.keyboard('{Backspace}');
    expect(tag('Rent')).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    expect(tags()).toEqual(['Food', 'Rent']);
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['food']);
    expect(tags()).toEqual(['Food']);
    expect(tag('Food')).toHaveFocus();

    // Right after a choice the list is still open: Backspace closes it and focuses the last tag.
    await user.click(input());
    await user.keyboard('fu{ArrowDown}{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(tags()).toEqual(['Food', 'Fun']);
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(tag('Fun')).toHaveFocus();
    expect(tags()).toEqual(['Food', 'Fun']);
    await user.keyboard('{Backspace}');
    expect(tags()).toEqual(['Food']);

    // With text in the input, Backspace edits the text and leaves the tags alone.
    await user.click(input());
    await user.keyboard('ab{Backspace}');
    expect(input()).toHaveValue('a');
    expect(input()).toHaveFocus();
    expect(tags()).toEqual(['Food']);
  });

  it('focuses the input when the last tag is removed', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Five defaultValue={['food']} />);
    await user.click(input());
    await user.keyboard('{Backspace}{Backspace}');
    expect(tags()).toEqual([]);
    expect(screen.queryByRole('grid')).toBeNull();
    expect(input()).toHaveFocus();
    unmount();

    render(<Five defaultValue={['food']} />);
    await user.click(screen.getByRole('button', { name: 'Remove Food' }));
    expect(tags()).toEqual([]);
    expect(input()).toHaveFocus();
  });

  it('moves between tags with the arrows, and reverses them under a right-to-left locale', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Five defaultValue={['food', 'rent', 'fun']} />);
    await user.tab();
    expect(tag('Food')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tag('Rent')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tag('Food')).toHaveFocus();
    unmount();

    render(
      <I18nProvider locale="fa-IR">
        <div dir="rtl">
          <Five defaultValue={['food', 'rent', 'fun']} />
        </div>
      </I18nProvider>,
    );
    await user.tab();
    expect(tag('Food')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tag('Rent')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tag('Food')).toHaveFocus();
  });

  it('focuses the input on a press on the frame outside the tags', async () => {
    const user = userEvent.setup();
    render(<Five defaultValue={['food', 'rent']} />);
    await user.pointer({ keys: '[MouseLeft]', target: frame() });
    expect(input()).toHaveFocus();
    await user.pointer({ keys: '[MouseLeft]', target: element('.multi-select-tag-list') });
    expect(input()).toHaveFocus();
  });

  it('keeps the tag list one tab stop before the input, and the button out of the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Five defaultValue={['food', 'rent', 'fun']} />
        <button type="button">Next</button>
      </>,
    );
    expect(button()).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(tag('Food')).toHaveFocus();
    await user.tab();
    expect(input()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(input()).toHaveFocus();
    await user.tab({ shift: true });
    expect(tag('Food')).toHaveFocus();
  });

  it('closes the list and empties the input on one Escape, and leaves the value alone on Tab', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Five defaultValue={['food']} onChange={onChange} />
        <button type="button">Next</button>
      </>,
    );
    await user.click(input());
    await user.keyboard('re');
    expect(shown()).toEqual(['Rent']);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('');
    expect(input()).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();

    // Tab closes the list and moves on; the active option, Food, which is chosen, stays chosen.
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Food' })).toHaveAttribute('data-focused');
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(tags()).toEqual(['Food']);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    // Enter adds Rent; the Tab after it keeps it.
    await user.click(input());
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['food', 'rent']);
    await user.tab();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(tags()).toEqual(['Food', 'Rent']);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    // Shift+Tab with an active option leaves the value alone too.
    await user.click(input());
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await user.tab({ shift: true });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(tags()).toEqual(['Food', 'Rent']);
    expect(screen.queryByRole('listbox')).toBeNull();
    // Typed text with no active option is dropped on leaving.
    await user.click(input());
    await user.keyboard('zz');
    await user.tab();
    expect(input()).toHaveValue('');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('shows the tags read only, with no remove buttons and no removal, while isReadOnly', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Five defaultValue={['food', 'rent']} isReadOnly onChange={onChange} />);
    expect(input()).toHaveAttribute('readonly');
    expect(tags()).toEqual(['Food', 'Rent']);
    expect(document.querySelector('.multi-select-tag-remove')).toBeNull();
    // The tags stay a grid that is read and focused.
    expect(screen.getByRole('grid', { name: 'Selected Categories' })).toBeInTheDocument();
    await user.tab();
    expect(tag('Food')).toHaveFocus();
    await user.keyboard('{Backspace}{Delete}');
    await user.click(input());
    await user.keyboard('{Backspace}{Backspace}');
    expect(onChange).not.toHaveBeenCalled();
    expect(tags()).toEqual(['Food', 'Rent']);
  });

  it('names the tags by the aria-label or the aria-labelledby of a field with no visible label', () => {
    const { unmount } = render(<Five label={undefined} aria-label="Categories" defaultValue={['food']} />);
    expect(screen.getByRole('grid', { name: 'Selected Categories' })).toBeInTheDocument();
    unmount();

    const labelled = render(
      <>
        <h2 id="heading">Budget lines</h2>
        <Five label={undefined} aria-labelledby="heading" defaultValue={['food']} />
      </>,
    );
    expect(screen.getByRole('grid', { name: 'Selected Budget lines' })).toBeInTheDocument();
    labelled.unmount();

    const disabled = render(
      <Five label={undefined} aria-label="Categories" defaultValue={['food']} isDisabled />,
    );
    expect(screen.getByRole('group', { name: 'Selected Categories' })).toBeInTheDocument();
    disabled.unmount();

    render(
      <>
        <h2 id="heading">Budget lines</h2>
        <Five label={undefined} aria-labelledby="heading" defaultValue={['food']} isDisabled />
      </>,
    );
    expect(screen.getByRole('group', { name: 'Selected Budget lines' })).toBeInTheDocument();
  });

  it('never moves focus to the input when a removal of the last tag was refused', async () => {
    const user = userEvent.setup();
    function Refusing(): ReactElement {
      const [value, setValue] = useState<readonly Key[]>(['food']);
      return (
        <>
          {/* The app keeps at least one category: it refuses to empty the value. */}
          <Five
            value={value}
            onChange={(next) => {
              if (next.length > 0) setValue(next);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setValue(['food', 'rent']);
            }}
          >
            Add Rent
          </button>
        </>
      );
    }
    render(<Refusing />);
    await user.click(screen.getByRole('button', { name: 'Remove Food' }));
    expect(tags()).toEqual(['Food']);
    const add = screen.getByRole('button', { name: 'Add Rent' });
    await user.click(add);
    expect(tags()).toEqual(['Food', 'Rent']);
    expect(add).toHaveFocus();
  });

  it('draws no remove buttons and no removal while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <>
        <Five defaultValue={['food', 'rent']} isDisabled onChange={onChange} />
        <button type="button">Next</button>
      </>,
    );
    expect(root(container)).toHaveAttribute('data-disabled');
    expect(frame()).toHaveAttribute('data-disabled', '');
    expect(input()).toBeDisabled();
    expect(button()).toBeDisabled();
    expect(tags()).toEqual(['Food', 'Rent']);
    expect(container.querySelector('.multi-select-tag-remove')).toBeNull();
    // A disabled group, read and never focused: React Aria's grid would stay a tab stop with every tag disabled.
    expect(screen.queryByRole('grid')).toBeNull();
    const group = screen.getByRole('group', { name: 'Selected Categories' });
    expect(group).toHaveClass('multi-select-tag-list');
    expect(group).toHaveAttribute('aria-disabled', 'true');
    expect([...group.children].map((tag) => tag.className)).toEqual(['multi-select-tag', 'multi-select-tag']);
    // Nothing in the field takes focus: the next stop is past it.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    await user.keyboard('{Shift>}{Tab}{/Shift}{Backspace}{Delete}');
    expect(onChange).not.toHaveBeenCalled();
    await user.pointer({ keys: '[MouseLeft]', target: frame() });
    expect(input()).not.toHaveFocus();
  });

  it('opens the list against the frame, not the input', async () => {
    const user = userEvent.setup();
    render(<Five defaultValue={['food']} />);
    // jsdom lays nothing out, so the frame alone is given a width: the input's box stays empty.
    vi.spyOn(frame(), 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 333, 48));
    await user.click(button());
    const popover = element('.menu-popover');
    expect(popover.style.getPropertyValue('--trigger-width')).toBe('333px');
    expect(element('[role="listbox"]', popover)).toHaveClass('menu', 'multi-select-list');
    // The frame is a plain box: not a group, so it brings no role and no focus-within ring.
    expect(frame()).not.toHaveAttribute('role');
    expect(frame()).not.toHaveAttribute('data-focus-visible');
  });

  it("renders the library popover only with the combo box's state, never in React Aria's hidden pass", async () => {
    const user = userEvent.setup();
    hiddenPopovers.count = 0;
    render(<Five defaultValue={['food']} />);
    await user.click(button());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(hiddenPopovers.count).toBe(0);
  });

  it('keeps the list open with No matches, or labels.empty, and shows the Spinner while isLoading', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Five />);
    await user.type(input(), 'zzz');
    expect(element('.picker-empty', screen.getByRole('listbox'))).toHaveTextContent('No matches');
    unmount();

    const loading = render(<Five isLoading labels={{ loading: 'Fetching' }} />);
    expect(root(loading.container)).toHaveAttribute('data-loading', '');
    const spinner = screen.getByRole('progressbar', { name: 'Fetching' });
    expect(spinner.closest('.combo-box-spinner')?.parentElement).toBe(frame());
    expect(spinner.closest('.combo-box-spinner')?.nextElementSibling).toBe(button());
  });

  it('submits every chosen key with a form', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Five name="categories" defaultValue={['food', 'rent']} />
      </form>,
    );
    const form = formOf(container);
    expect(new FormData(form).getAll('categories')).toEqual(['food', 'rent']);
    await user.click(button());
    await user.click(screen.getByRole('option', { name: 'Travel' }));
    expect(new FormData(form).getAll('categories')).toEqual(['food', 'rent', 'travel']);
  });

  it('shows the Changed chip and reads it with the input while changed and valid', () => {
    const { container, rerender } = render(<Five defaultValue={['food']} isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = element('.field-changed');
    expect(chip).toHaveTextContent('Changed');
    expect(input().getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    rerender(<Five defaultValue={['food']} isChanged changedLabel="Unsaved" />);
    expect(element('.field-changed')).toHaveTextContent('Unsaved');
    rerender(<Five defaultValue={['food']} isChanged isInvalid errorMessage="Choose a category" />);
    expect(container.querySelector('.field-changed')).toBeNull();
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(input().getAttribute('aria-describedby')).toContain(element('.field-error').id);
  });

  it('passes className, popoverClassName, ref, inputRef and data attributes', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <Five
        ref={ref}
        inputRef={inputRef}
        className={({ isOpen }) => (isOpen ? 'mine is-open' : 'mine')}
        popoverClassName="my-popover"
        data-testid="categories"
      />,
    );
    expect(root(container).className.startsWith('field multi-select')).toBe(true);
    expect(root(container)).toHaveClass('mine');
    expect(ref.current).toBe(root(container));
    expect(inputRef.current).toBe(input());
    expect(root(container)).toHaveAttribute('data-testid', 'categories');
    await user.click(button());
    expect(root(container)).toHaveClass('is-open');
    expect(element('.menu-popover')).toHaveClass('my-popover');
  });

  it('has no axe violations empty, with tags, open, with a focused tag, changed, invalid and disabled', async () => {
    const user = userEvent.setup();
    const cases: [name: string, field: ReactElement, act?: () => Promise<void>][] = [
      ['empty', <Five key="empty" placeholder="Add a category" description="Pick any." />],
      ['with tags', <Five key="tags" defaultValue={['food', 'rent']} />],
      [
        'open',
        <Five key="open" defaultValue={['food']} />,
        async () => {
          await user.click(input());
          await user.keyboard('{ArrowDown}');
          expect(screen.getByRole('listbox')).toBeInTheDocument();
        },
      ],
      [
        'a focused tag',
        <Five key="focused" defaultValue={['food', 'rent']} />,
        async () => {
          await user.tab();
          expect(tag('Food')).toHaveFocus();
        },
      ],
      ['changed', <Five key="changed" defaultValue={['food']} isChanged />],
      ['invalid', <Five key="invalid" isInvalid errorMessage="Choose a category" />],
      ['disabled', <Five key="disabled" defaultValue={['food', 'rent']} isDisabled />],
      [
        'unlabelled',
        <Five key="unlabelled" label={undefined} aria-label="Categories" defaultValue={['fun']} />,
      ],
    ];
    axe.configure({ rules: [OPEN_VALUE_RULE] });
    try {
      for (const [name, field, act] of cases) {
        const { unmount } = render(field);
        if (act) await act();
        // An open list portals to the body, so the whole body is checked.
        await expectNoA11yViolations(document.body, ROW_A11Y).catch((error: unknown) => {
          throw new Error(`${name}: ${String(error)}`);
        });
        unmount();
      }
    } finally {
      axe.reset();
    }
  });

  it('exposes value as an array, refuses custom values and selectedKey, and requires a name, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error free text is TagInput's, a later part; the multi-select chooses from its list only
    const withCustomValue = <Five allowsCustomValue />;
    // @ts-expect-error selectedKey is deprecated in React Aria; the multi-select takes value
    const withSelectedKey = <Five selectedKey="food" />;
    const nameless = (
      // @ts-expect-error a multi-select with no label, aria-label or aria-labelledby has no name
      <MultiSelect>
        <PickerOption id="food">Food</PickerOption>
      </MultiSelect>
    );
    const byAriaLabel = (
      <MultiSelect
        aria-label="Categories"
        value={['food'] as readonly Key[]}
        onChange={(keys: Key[]) => keys.length}
      >
        <PickerOption id="food">Food</PickerOption>
      </MultiSelect>
    );
    expect([withCustomValue, withSelectedKey, nameless, byAriaLabel]).toHaveLength(4);
  });
});
