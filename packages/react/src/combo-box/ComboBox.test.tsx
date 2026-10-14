import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import type { Key } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf } from '../../test/dom';
import { PickerOption, PickerSection } from '../picker';
import type { PopoverProps } from '../popover/Popover';
import { ComboBox, type ComboBoxBaseProps } from './ComboBox';

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

function element(selector: string, scope: ParentNode = document): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/**
 * The field's root. React Aria builds a combo box's collection by rendering its children into a template first,
 * so the root is not the container's first element.
 */
const root = (container: HTMLElement): HTMLElement => element(':scope > .combo-box', container);

const input = (): HTMLInputElement => screen.getByRole('combobox');

/**
 * The field button, found by its class: while the list is open React Aria hides everything but the input and
 * the list from assistive technology, the button too.
 */
const button = (): HTMLButtonElement => element('.combo-box-button') as HTMLButtonElement;

/** The options the open list shows, by their text. */
const shown = (): string[] =>
  [...document.querySelectorAll('[role="listbox"] .picker-option')].map((option) => option.textContent);

const MERCHANTS = ['Café Luna', 'Corner Mart', 'Green Grocer', 'Harbor Books', 'Pine Bakery'];

/** Five merchants, the docs' basic list. */
function Five(props: Partial<Omit<ComboBoxBaseProps, 'children'>>): ReactElement {
  return (
    <ComboBox label="Merchant" {...props}>
      <PickerOption id="cafe">Café Luna</PickerOption>
      <PickerOption id="corner">Corner Mart</PickerOption>
      <PickerOption id="grocer">Green Grocer</PickerOption>
      <PickerOption id="books">Harbor Books</PickerOption>
      <PickerOption id="bakery">Pine Bakery</PickerOption>
    </ComboBox>
  );
}

/** A combo box whose value the caller holds, as an app that keeps it in its URL does. */
function Controlled({ onChange }: { onChange: (value: Key | null) => void }): ReactElement {
  const [value, setValue] = useState<Key | null>('cafe');
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

interface Merchant {
  id: string;
  name: string;
}

/**
 * Manual mode: the app holds the text and the items, as a server search does. These two items never contain
 * what is typed, so a list that filtered them would be empty.
 */
function Manual({ isLoading = false, items }: { isLoading?: boolean; items: Merchant[] }): ReactElement {
  const [text, setText] = useState('');
  return (
    <ComboBox<Merchant>
      label="Merchant"
      items={items}
      inputValue={text}
      onInputChange={setText}
      isLoading={isLoading}
    >
      {(item) => <PickerOption>{item.name}</PickerOption>}
    </ComboBox>
  );
}

const SERVER_RESULTS: Merchant[] = [
  { id: 'cafe', name: 'Café Luna' },
  { id: 'corner', name: 'Corner Mart' },
];

const SERVER_MERCHANTS: Merchant[] = [
  { id: 'cafe', name: 'Café Luna' },
  { id: 'corner', name: 'Corner Mart' },
  { id: 'cobalt', name: 'Cobalt Coffee' },
  { id: 'grocer', name: 'Green Grocer' },
];

/** The app's search, as its server would answer it: the names that contain the text. */
const lookUp = (text: string): Merchant[] =>
  SERVER_MERCHANTS.filter(({ name }) => name.toLowerCase().includes(text.toLowerCase()));

/**
 * A server search. React Aria puts the chosen text back from the items, so `keepChosen` holds the chosen
 * merchant among them and skips the search for its own text, as the docs' example does; without it the items
 * are only the last results.
 */
function ServerSearch({ keepChosen }: { keepChosen: boolean }): ReactElement {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Merchant[]>(() => lookUp(''));
  const [chosen, setChosen] = useState<Merchant | null>(null);
  const items = keepChosen && chosen ? [chosen, ...results.filter(({ id }) => id !== chosen.id)] : results;
  return (
    <ComboBox<Merchant>
      label="Merchant"
      items={items}
      inputValue={text}
      onInputChange={(next) => {
        setText(next);
        if (keepChosen && chosen !== null && next === chosen.name) return;
        setResults(lookUp(next));
      }}
      onChange={(key) => {
        setChosen(items.find(({ id }) => id === key) ?? null);
      }}
    >
      {(item) => <PickerOption>{item.name}</PickerOption>}
    </ComboBox>
  );
}

describe('ComboBox', () => {
  it('is a combobox named by its label, with a button named Show options and the label', () => {
    const { container } = render(<Five description="Where you paid." placeholder="Type a merchant" />);
    expect(root(container)).toHaveClass('field', 'combo-box');
    const field = screen.getByRole('combobox', { name: 'Merchant' });
    expect(field).toHaveClass('input', 'combo-box-input');
    expect(field).toHaveAttribute('placeholder', 'Type a merchant');
    expect(field).toHaveAccessibleDescription('Where you paid.');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    const open = screen.getByRole('button', { name: 'Show options Merchant' });
    expect(open).toBe(button());
    expect(open).toHaveClass('input-button', 'combo-box-button');
    expect(element('svg', open)).toHaveAttribute('aria-hidden', 'true');
    // The input and the button share the positioned control; the Spinner is not drawn while nothing loads.
    const control = element('.combo-box-control');
    expect([...control.children]).toEqual([field, open]);
    expect(root(container).querySelector('.combo-box-spinner')).toBeNull();
    expect([...root(container).children].map((child) => child.className).slice(0, 3)).toEqual([
      'field-head',
      'combo-box-control',
      'field-description',
    ]);
    expect(root(container)).not.toHaveAttribute('data-loading');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('marks its root data-unlabelled only when no visible label names it', () => {
    const { container, unmount } = render(<Five />);
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
    unmount();
    const unlabelled = render(<Five label={undefined} aria-label="Merchant" placeholder="Type a merchant" />);
    expect(screen.getByRole('combobox', { name: 'Merchant' })).toBeInTheDocument();
    expect(root(unlabelled.container)).toHaveAttribute('data-unlabelled', '');
    expect(unlabelled.container.querySelector('.field-head')).toBeNull();
  });

  it('opens filtered as you type, contains at base sensitivity: "cafe" keeps "Café"', async () => {
    const user = userEvent.setup();
    const { container } = render(<Five />);
    await user.type(input(), 'cafe');
    const list = screen.getByRole('listbox');
    expect(list).toHaveClass('menu', 'combo-box-list');
    expect(list.closest('.popover')).toHaveClass('menu-popover');
    expect(shown()).toEqual(['Café Luna']);
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(input()).toHaveAttribute('aria-controls', list.id);
    expect(root(container)).toHaveAttribute('data-open');
    await user.clear(input());
    await user.type(input(), 'R');
    // Contains, not starts with: Corner, Green Grocer, Harbor and Pine Bakery all hold an r.
    expect(shown()).toEqual(['Corner Mart', 'Green Grocer', 'Harbor Books', 'Pine Bakery']);
  });

  it('opens with every option from the button and from Arrow Down, keeping focus in the input', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Five />);
    await user.click(button());
    expect(shown()).toEqual(MERCHANTS);
    expect(input()).toHaveFocus();
    unmount();

    render(<Five />);
    await user.tab();
    expect(input()).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(shown()).toEqual(MERCHANTS);
    expect(input()).toHaveFocus();
    // A virtual focus: the input names the active option and keeps the real focus.
    expect(input().getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Café Luna' }).id,
    );
  });

  it('moves the active option with the arrows, Home, End and the page keys, stopping at the ends', async () => {
    const user = userEvent.setup();
    render(<Five />);
    await user.tab();
    const active = (): string | undefined =>
      document.getElementById(input().getAttribute('aria-activedescendant') ?? '')?.textContent;
    await user.keyboard('{ArrowDown}');
    expect(active()).toBe('Café Luna');
    await user.keyboard('{ArrowUp}');
    expect(active()).toBe('Café Luna');
    await user.keyboard('{End}');
    expect(active()).toBe('Pine Bakery');
    await user.keyboard('{ArrowDown}');
    expect(active()).toBe('Pine Bakery');
    await user.keyboard('{Home}');
    expect(active()).toBe('Café Luna');
    await user.keyboard('{PageDown}');
    expect(active()).toBe('Pine Bakery');
    await user.keyboard('{PageUp}');
    expect(active()).toBe('Café Luna');
    expect(input()).toHaveFocus();
  });

  it('chooses on Enter and on a press, closes, and shows the chosen text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Five onChange={onChange} />);
    await user.type(input(), 'gr');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('Green Grocer');
    expect(onChange).toHaveBeenLastCalledWith('grocer');
    expect(input()).toHaveFocus();

    await user.click(button());
    await user.click(screen.getByRole('option', { name: 'Harbor Books' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('Harbor Books');
    expect(onChange).toHaveBeenLastCalledWith('books');
  });

  it('chooses the active option on Tab and moves on, and closes with no choice when none is active', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Five onChange={onChange} />
        <button type="button">Next</button>
      </>,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.tab();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('Corner Mart');
    expect(onChange).toHaveBeenLastCalledWith('corner');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();

    // Typed text with no active option: Tab leaves and the chosen text comes back.
    await user.click(input());
    await user.type(input(), 'zz');
    await user.tab();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('Corner Mart');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('takes value and onChange, and defaultValue alone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Controlled onChange={onChange} />);
    expect(input()).toHaveValue('Café Luna');
    await user.click(button());
    await user.click(screen.getByRole('option', { name: 'Pine Bakery' }));
    expect(onChange).toHaveBeenCalledWith('bakery');
    expect(input()).toHaveValue('Pine Bakery');
    unmount();

    const cleared = vi.fn();
    render(<Five defaultValue="books" onChange={cleared} />);
    expect(input()).toHaveValue('Harbor Books');
    // With the input uncontrolled, emptying it clears the value.
    await user.clear(input());
    expect(cleared).toHaveBeenLastCalledWith(null);
  });

  it('restores the chosen text and closes on Escape, and restores it on leaving the field', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Five defaultValue="cafe" />
        <button type="button">Next</button>
      </>,
    );
    await user.click(input());
    await user.keyboard('{End}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}');
    expect(input()).toHaveValue('Ca');
    expect(shown()).toEqual(['Café Luna']);
    // One Escape does both: the list closes and the chosen text comes back.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('Café Luna');
    expect(input()).toHaveFocus();

    await user.type(input(), 'zz');
    expect(input()).toHaveValue('Café Lunazz');
    // React Aria hides all but the input and the list from assistive technology while the list is open.
    await user.click(screen.getByText('Next'));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('Café Luna');
  });

  it('keeps typed text on leaving the field with allowsCustomValue', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Five allowsCustomValue />
        <button type="button">Next</button>
      </>,
    );
    await user.type(input(), 'Night market');
    await user.click(screen.getByText('Next'));
    expect(input()).toHaveValue('Night market');
  });

  it('keeps the list open with No matches, or labels.empty, when nothing matches', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Five />);
    await user.type(input(), 'zzz');
    const list = screen.getByRole('listbox');
    expect(shown()).toEqual([]);
    expect(element('.picker-empty', list)).toHaveTextContent('No matches');
    unmount();

    render(
      <ComboBox label="فروشنده" labels={{ empty: 'چیزی پیدا نشد', open: 'نمایش گزینه‌ها' }}>
        <PickerOption id="cafe">کافه لونا</PickerOption>
      </ComboBox>,
    );
    expect(screen.getByRole('button', { name: 'نمایش گزینه‌ها فروشنده' })).toBe(button());
    await user.type(input(), 'zzz');
    expect(element('.picker-empty', screen.getByRole('listbox'))).toHaveTextContent('چیزی پیدا نشد');
  });

  it('does not filter controlled items: manual mode shows what the app passes', async () => {
    const user = userEvent.setup();
    render(<Manual items={SERVER_RESULTS} />);
    await user.type(input(), 'zzz');
    expect(input()).toHaveValue('zzz');
    expect(shown()).toEqual(['Café Luna', 'Corner Mart']);
  });

  it('puts the chosen text back on Escape and on leaving, from a server search that keeps the chosen item', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ServerSearch keepChosen />
        <button type="button">Next</button>
      </>,
    );
    await user.type(input(), 'co');
    expect(shown()).toEqual(['Corner Mart', 'Cobalt Coffee']);
    await user.click(screen.getByRole('option', { name: 'Corner Mart' }));
    expect(input()).toHaveValue('Corner Mart');
    // React Aria writes the chosen text back through onInputChange, and the app skips that search.
    await user.click(button());
    expect(shown()).toEqual(['Corner Mart', 'Cobalt Coffee']);
    await user.keyboard('{Escape}');

    // A search that finds nothing: the chosen merchant is still among the items, so its text comes back.
    await user.type(input(), 'zz');
    expect(input()).toHaveValue('Corner Martzz');
    await user.keyboard('{Escape}');
    expect(input()).toHaveValue('Corner Mart');
    await user.type(input(), 'zz');
    await user.click(screen.getByText('Next'));
    expect(input()).toHaveValue('Corner Mart');
  });

  it('loses the chosen text to a server search that drops the chosen item, which is why the app keeps it', async () => {
    const user = userEvent.setup();
    render(<ServerSearch keepChosen={false} />);
    await user.type(input(), 'co');
    await user.click(screen.getByRole('option', { name: 'Corner Mart' }));
    expect(input()).toHaveValue('Corner Mart');
    await user.type(input(), 'zz');
    await user.keyboard('{Escape}');
    // React Aria finds the chosen key nowhere in the items, so it writes an empty text over a kept value.
    expect(input()).toHaveValue('');
  });

  it('shows the Spinner named Loading while isLoading, with data-loading on the root, and says Loading in an empty list', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<Manual items={[]} isLoading />);
    expect(root(container)).toHaveAttribute('data-loading', '');
    const spinner = screen.getByRole('progressbar', { name: 'Loading' });
    expect(spinner.closest('.combo-box-spinner')?.parentElement).toBe(element('.combo-box-control'));
    // Before the button, which it sits just in front of.
    expect(spinner.closest('.combo-box-spinner')?.nextElementSibling).toBe(button());
    await user.type(input(), 'co');
    expect(element('.picker-empty', screen.getByRole('listbox'))).toHaveTextContent('Loading');
    unmount();

    // While it loads the list keeps what it has.
    render(<Manual items={SERVER_RESULTS} isLoading />);
    await user.type(input(), 'co');
    expect(shown()).toEqual(['Café Luna', 'Corner Mart']);
    expect(document.querySelector('.picker-empty')).toBeNull();
  });

  it('names the Spinner and the loading line by labels.loading', async () => {
    const user = userEvent.setup();
    render(
      <ComboBox label="Merchant" items={[]} isLoading labels={{ loading: 'Fetching' }}>
        {(item: Merchant) => <PickerOption>{item.name}</PickerOption>}
      </ComboBox>,
    );
    expect(screen.getByRole('progressbar', { name: 'Fetching' })).toBeInTheDocument();
    await user.type(input(), 'co');
    expect(element('.picker-empty')).toHaveTextContent('Fetching');
  });

  it('keeps the button out of the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Five />
        <button type="button">Next</button>
      </>,
    );
    expect(button()).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(input()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('opens the popover against the control, not the input', async () => {
    const user = userEvent.setup();
    render(<Five />);
    // jsdom lays nothing out, so the control alone is given a width: the input's box stays empty.
    vi.spyOn(element('.combo-box-control'), 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 321, 48),
    );
    await user.click(button());
    const popover = element('.menu-popover');
    expect(popover.style.getPropertyValue('--trigger-width')).toBe('321px');
    expect(popover).toHaveAttribute('data-placement', 'bottom');
    const cap = parseFloat(popover.style.maxHeight);
    expect(cap).toBeGreaterThan(0);
    expect(cap).toBeLessThanOrEqual(320);
    // The control is a plain box: not a group, so it brings no role and no focus-within ring.
    expect(element('.combo-box-control')).not.toHaveAttribute('role');
    expect(element('.combo-box-control')).not.toHaveAttribute('data-focus-visible');
  });

  // React Aria renders a combo box's children once more, hidden, to build its collection, and its Popover renders
  // its content there too. Only the options belong in that pass, so the library's popover, with its focus
  // handling, renders only once the list opens.
  it("renders the library popover only with the combo box's state, never in React Aria's hidden pass", async () => {
    const user = userEvent.setup();
    hiddenPopovers.count = 0;
    render(<Five defaultValue="cafe" />);
    await user.click(button());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(hiddenPopovers.count).toBe(0);
  });

  it('shows the Changed chip and reads it with the input while changed and valid', () => {
    const { container, rerender } = render(<Five defaultValue="cafe" isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = element('.field-changed');
    expect(chip).toHaveTextContent('Changed');
    expect(input().getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    rerender(<Five defaultValue="cafe" isChanged changedLabel="Unsaved" />);
    expect(element('.field-changed')).toHaveTextContent('Unsaved');
    rerender(<Five defaultValue="cafe" isChanged isInvalid errorMessage="Choose a merchant" />);
    expect(container.querySelector('.field-changed')).toBeNull();
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(input()).toHaveAccessibleDescription('Choose a merchant');
    rerender(<Five defaultValue="cafe" />);
    expect(root(container)).not.toHaveAttribute('data-changed');
  });

  it('draws the disabled state on its root and turns off the input and the button', () => {
    const { container } = render(<Five defaultValue="cafe" isDisabled />);
    expect(root(container)).toHaveAttribute('data-disabled');
    expect(input()).toBeDisabled();
    expect(button()).toBeDisabled();
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
        data-testid="merchant"
      />,
    );
    expect(root(container).className.startsWith('field combo-box')).toBe(true);
    expect(root(container)).toHaveClass('mine');
    expect(ref.current).toBe(root(container));
    expect(inputRef.current).toBe(input());
    expect(root(container)).toHaveAttribute('data-testid', 'merchant');
    await user.click(button());
    expect(root(container)).toHaveClass('is-open');
    expect(element('.menu-popover')).toHaveClass('my-popover');
  });

  it('takes sections, and submits the chosen key under its name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <ComboBox label="Merchant" name="merchant" defaultValue="cafe">
          <PickerSection title="Food">
            <PickerOption id="cafe">Café Luna</PickerOption>
            <PickerOption id="bakery">Pine Bakery</PickerOption>
          </PickerSection>
          <PickerSection title="Shops">
            <PickerOption id="books">Harbor Books</PickerOption>
          </PickerSection>
        </ComboBox>
      </form>,
    );
    expect(new FormData(formOf(container)).get('merchant')).toBe('cafe');
    await user.click(button());
    expect(screen.getByRole('group', { name: 'Shops' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Harbor Books' }));
    expect(new FormData(formOf(container)).get('merchant')).toBe('books');
  });

  it('has no axe violations closed, open, with no matches, loading, changed, invalid and disabled', async () => {
    const user = userEvent.setup();
    const cases: [name: string, field: ReactElement, open?: string][] = [
      ['closed', <Five key="closed" defaultValue="cafe" description="Where you paid." />],
      ['open', <Five key="open" defaultValue="cafe" />, '{ArrowDown}'],
      ['no matches', <Five key="empty" />, 'zzz'],
      ['loading', <Manual key="loading" items={[]} isLoading />, 'co'],
      ['changed', <Five key="changed" defaultValue="cafe" isChanged />],
      ['invalid', <Five key="invalid" isInvalid errorMessage="Choose a merchant" />],
      ['disabled', <Five key="disabled" defaultValue="cafe" isDisabled />],
      ['unlabelled', <Five key="unlabelled" label={undefined} aria-label="Merchant" />],
    ];
    for (const [name, field, keys] of cases) {
      const { unmount } = render(field);
      if (keys) {
        await user.click(input());
        await user.keyboard(keys);
        expect(screen.getByRole('listbox'), name).toBeInTheDocument();
      }
      // An open list portals to the body, so the whole body is checked.
      await expectNoA11yViolations(document.body, ROW_A11Y).catch((error: unknown) => {
        throw new Error(`${name}: ${String(error)}`);
      });
      unmount();
    }
  });

  it('exposes value, defaultValue and onChange, and requires a name, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error selectedKey is deprecated in React Aria; the combo box takes value
    const withSelectedKey = <Five selectedKey="cafe" />;
    const withOnSelectionChange = (
      // @ts-expect-error onSelectionChange is deprecated in React Aria; the combo box takes onChange
      <ComboBox label="Merchant" onSelectionChange={() => undefined}>
        <PickerOption id="cafe">Café Luna</PickerOption>
      </ComboBox>
    );
    const nameless = (
      // @ts-expect-error a combo box with no label, aria-label or aria-labelledby has no name
      <ComboBox>
        <PickerOption id="cafe">Café Luna</PickerOption>
      </ComboBox>
    );
    const byAriaLabel = (
      <ComboBox aria-label="Merchant" value="cafe" onChange={() => undefined}>
        <PickerOption id="cafe">Café Luna</PickerOption>
      </ComboBox>
    );
    expect([withSelectedKey, withOnSelectionChange, nameless, byAriaLabel]).toHaveLength(4);
  });
});
