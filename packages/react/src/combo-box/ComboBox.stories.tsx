import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentType, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PickerOption } from '../picker';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { tokenColor, washColor } from '../stories/paint';
import { ComboBox, type ComboBoxBaseProps } from './ComboBox';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/**
 * Resolves once the open list's popover has been placed and has entered, and every transition on it has
 * finished, so a play reads its boxes at rest.
 */
async function atRest(): Promise<HTMLElement> {
  const popover = await waitFor(async () => {
    const found = only('.menu-popover');
    await expect(found).toHaveAttribute('data-placement');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    popover.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return popover;
}

/** The options the open list shows, by their text. */
const shown = (): string[] =>
  [...document.querySelectorAll('[role="listbox"] .picker-option')].map((option) => option.textContent);

const listbox = (): HTMLElement => within(document.body).getByRole('listbox');

/** Twelve of a household's merchants; three of them hold "co". */
const MERCHANTS = [
  'Café Luna',
  'City Bikes',
  'Coastline Rail',
  'Cobalt Coffee',
  'Corner Mart',
  'Green Grocer',
  'Harbor Books',
  'Northwind Fuel',
  'Oak Pharmacy',
  'Pine Bakery',
  'River Cinema',
  'Sunrise Gym',
];

const idOf = (name: string): string => name.toLowerCase().replace(/[^a-z]+/g, '-');

const TWELVE = MERCHANTS.map((name) => (
  <PickerOption key={name} id={idOf(name)}>
    {name}
  </PickerOption>
));

interface Merchant {
  id: string;
  name: string;
}

/** Four results a server sent for the last query. */
const RESULTS: Merchant[] = MERCHANTS.slice(1, 5).map((name) => ({ id: idOf(name), name }));

/**
 * Manual mode: the app holds the text and the items, as a server search does, and React Aria does not filter
 * them. `isLoading` shows the Spinner as if a request were out.
 */
function ServerSearch({ isLoading = false }: { isLoading?: boolean }): ReactElement {
  const [text, setText] = useState('');
  return (
    <ComboBox<Merchant>
      label="Merchant"
      placeholder="Type a merchant"
      items={RESULTS}
      inputValue={text}
      onInputChange={setText}
      isLoading={isLoading}
    >
      {(item) => <PickerOption>{item.name}</PickerOption>}
    </ComboBox>
  );
}

/** Tabs to the input and opens the list with every option, as a keyboard user does. */
async function openByKeyboard(): Promise<HTMLElement> {
  await userEvent.tab();
  await userEvent.keyboard('{ArrowDown}');
  return atRest();
}

const meta = {
  title: 'Components/ComboBox',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: ComboBox as ComponentType<ComboBoxBaseProps>,
  args: { label: 'Merchant', placeholder: 'Type a merchant', children: TWELVE },
  parameters: {
    // The open stories open a list, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '520px' } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(24rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ComboBoxBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A label and an empty input: the placeholder in taupe, the input's own, and the field button's slate chevron
 * at the pill's end.
 */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Merchant' });
    await expect(getComputedStyle(input, '::placeholder').color).toBe(tokenColor('--color-taupe'));
    await expect(input.getBoundingClientRect().height).toBe(
      parseFloat(getComputedStyle(input).getPropertyValue('--size-field')),
    );
    const button = canvas.getByRole('button', { name: 'Show options Merchant' });
    await expect(getComputedStyle(button).color).toBe(tokenColor('--color-slate'));
    // The button sits inside the pill's end, 6px in from it, and the text is padded clear of it.
    const control = find(canvasElement, '.combo-box-control').getBoundingClientRect();
    await expect(Math.round(control.right - button.getBoundingClientRect().right)).toBe(6);
    await expect(getComputedStyle(input).paddingRight).toBe('48px');
  },
};

/**
 * The list opened from the keyboard: the Menu's float panel under the whole control and as wide as it, every
 * option, the first one active, and the button held pressed, so it shows the wash.
 */
export const Open: Story = {
  tags: ['density'],
  parameters: { a11y: MENU_ROW_A11Y },
  play: async ({ canvasElement }) => {
    const popover = await openByKeyboard();
    const control = find(canvasElement, '.combo-box-control').getBoundingClientRect();
    const box = popover.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(control.width - 0.5);
    await expect(box.top).toBeGreaterThan(control.bottom);
    await expect(shown()).toEqual(MERCHANTS);
    const input = within(canvasElement).getByRole('combobox');
    await expect(input).toHaveFocus();
    const button = find(canvasElement, '.combo-box-button');
    await expect(button).toHaveAttribute('data-pressed', 'true');
    await expect(getComputedStyle(button).backgroundColor).toBe(washColor());
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** Typing filters: "co" keeps the three merchants that contain it. */
export const Filtered: Story = {
  parameters: { a11y: MENU_ROW_A11Y },
  play: async () => {
    await userEvent.tab();
    await userEvent.keyboard('co');
    await atRest();
    await waitFor(() => expect(shown()).toEqual(['Coastline Rail', 'Cobalt Coffee', 'Corner Mart']));
  },
};

/** Nothing matches: the list stays open and says so in slate, rather than vanishing. */
export const NoMatches: Story = {
  parameters: { a11y: MENU_ROW_A11Y },
  play: async () => {
    await userEvent.tab();
    await userEvent.keyboard('zzz');
    await atRest();
    const empty = await waitFor(() => only('.picker-empty'));
    await expect(empty).toHaveTextContent('No matches');
    await expect(getComputedStyle(empty).color).toBe(tokenColor('--color-slate'));
    await expect(listbox()).toBeVisible();
  },
};

/**
 * A server search loading: the 24px Spinner just before the button, the input's text padded clear of both, and
 * the list keeping the results it has.
 */
export const Loading: Story = {
  parameters: { a11y: MENU_ROW_A11Y },
  render: (): ReactElement => <ServerSearch isLoading />,
  play: async ({ canvasElement }) => {
    await openByKeyboard();
    // While the list is open React Aria hides all but the input and the list from assistive technology, so the
    // Spinner is found by its place; the list's own line says Loading when it has nothing yet.
    const spinner = find(canvasElement, '.combo-box-spinner [role="progressbar"]');
    await expect(spinner).toHaveAttribute('aria-label', 'Loading');
    const field = find(canvasElement, '.combo-box');
    await expect(field).toHaveAttribute('data-loading');
    const button = find(canvasElement, '.combo-box-button').getBoundingClientRect();
    const box = spinner.getBoundingClientRect();
    await expect(box.width).toBe(24);
    await expect(box.right).toBeLessThanOrEqual(button.left);
    await expect(Math.round(button.left - box.right)).toBe(2);
    await expect(getComputedStyle(find(canvasElement, '.combo-box-input')).paddingRight).toBe('72px');
    await expect(shown()).toEqual(RESULTS.map(({ name }) => name));
  },
};

/** A changed combo box with its chip and light orange edge, an invalid one with its error, and a disabled one. */
export const States: Story = {
  render: (): ReactElement => (
    <div style={{ display: 'grid', gap: 24 }}>
      <ComboBox label="Merchant" defaultValue="corner-mart" isChanged>
        {TWELVE}
      </ComboBox>
      <ComboBox label="Payee" placeholder="Type a merchant" isInvalid errorMessage="Choose a merchant">
        {TWELVE}
      </ComboBox>
      <ComboBox label="Archived merchant" defaultValue="harbor-books" isDisabled>
        {TWELVE}
      </ComboBox>
    </div>
  ),
  play: async ({ canvas }) => {
    const changed = canvas.getByRole('combobox', { name: 'Merchant' });
    await expect(changed).toHaveValue('Corner Mart');
    await expect(getComputedStyle(changed).borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(changed).toHaveAccessibleDescription('Changed');
    const invalid = canvas.getByRole('combobox', { name: 'Payee' });
    await expect(getComputedStyle(invalid).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(canvas.getByText('Choose a merchant')).toBeVisible();
    const disabled = canvas.getByRole('combobox', { name: 'Archived merchant' });
    await expect(disabled).toBeDisabled();
    await expect(getComputedStyle(disabled).color).toBe(tokenColor('--color-taupe'));
    const button = canvas.getByRole('button', { name: 'Show options Archived merchant' });
    await expect(button).toBeDisabled();
    await expect(getComputedStyle(button).color).toBe(tokenColor('--color-taupe'));
  },
};

/**
 * In right to left the label and the text start at the right, the button sits at the left, unmirrored, and the
 * open list aligns to the control's right edge, its start.
 */
export const RightToLeft: Story = {
  parameters: { a11y: MENU_ROW_A11Y },
  render: (): ReactElement => (
    <I18nProvider locale="fa-IR">
      {/* Room at the left, the line's end, so the list keeps its 12px from the screen's edge. */}
      <div dir="rtl" lang="fa" style={{ paddingInlineEnd: '1.5rem' }}>
        <ComboBox label="فروشنده" placeholder="نام فروشنده" labels={{ open: 'نمایش گزینه‌ها' }}>
          <PickerOption id="cafe">کافه لونا</PickerOption>
          <PickerOption id="mart">بقالی سر کوچه</PickerOption>
          <PickerOption id="books">کتاب‌فروشی بندر</PickerOption>
          <PickerOption id="bakery">نانوایی کاج</PickerOption>
        </ComboBox>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const popover = await openByKeyboard();
    const control = find(canvasElement, '.combo-box-control').getBoundingClientRect();
    const button = find(canvasElement, '.combo-box-button').getBoundingClientRect();
    await expect(button.right).toBeLessThan(control.left + control.width / 2);
    await expect(Math.round(button.left - control.left)).toBe(6);
    await expect(Math.abs(popover.getBoundingClientRect().right - control.right)).toBeLessThan(1);
    await expect(getComputedStyle(find(canvasElement, '.combo-box-button svg')).scale).toBe('none');
  },
};

/**
 * The keys: typing filters, Arrow Down opens with every option, Enter chooses and closes, and Escape closes the
 * list and puts the chosen text back in one press.
 */
export const Keys: Story = {
  tags: ['no-visual'],
  parameters: { a11y: MENU_ROW_A11Y },
  args: { onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Merchant' });
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('pine');
    await waitFor(() => expect(shown()).toEqual(['Pine Bakery']));
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
    await expect(input).toHaveValue('Pine Bakery');
    await expect(args.onChange).toHaveBeenLastCalledWith('pine-bakery');
    // Arrow Down opens every option with the chosen one active; End and Home jump.
    await userEvent.keyboard('{ArrowDown}');
    await atRest();
    await expect(shown()).toEqual(MERCHANTS);
    const active = (): string | null | undefined =>
      document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent;
    await waitFor(() => expect(active()).toBe('Pine Bakery'));
    await userEvent.keyboard('{End}');
    await expect(active()).toBe('Sunrise Gym');
    await userEvent.keyboard('{Home}');
    await expect(active()).toBe('Café Luna');
    // Typing over the chosen text, then Escape: the list closes and the chosen text is back.
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{End}x');
    await waitFor(() => expect(listbox()).toBeVisible());
    await expect(input).toHaveValue('Pine Bakeryx');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
    await expect(input).toHaveValue('Pine Bakery');
    await expect(input).toHaveFocus();
  },
};

/**
 * A press on the button opens every option and leaves focus in the input; the button takes none. The list opens
 * under the control at its start, its left edge here; the field has room at its left, so the list is not held
 * 12px inside the screen's edge.
 */
export const ButtonPress: Story = {
  tags: ['no-visual'],
  parameters: { a11y: MENU_ROW_A11Y },
  decorators: [
    (Story) => (
      <div style={{ paddingInlineStart: '1.5rem' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas, canvasElement }) => {
    find(canvasElement, '.combo-box-button').click();
    const popover = await atRest();
    await expect(shown()).toEqual(MERCHANTS);
    await expect(canvas.getByRole('combobox', { name: 'Merchant' })).toHaveFocus();
    const control = find(canvasElement, '.combo-box-control').getBoundingClientRect();
    await expect(Math.abs(popover.getBoundingClientRect().left - control.left)).toBeLessThan(1);
  },
};

/** Manual mode shows the items the app passes, unfiltered, whatever is typed. */
export const ManualMode: Story = {
  tags: ['no-visual'],
  parameters: { a11y: MENU_ROW_A11Y },
  render: (): ReactElement => <ServerSearch />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await userEvent.keyboard('zzz');
    await atRest();
    await expect(canvas.getByRole('combobox')).toHaveValue('zzz');
    await expect(shown()).toEqual(RESULTS.map(({ name }) => name));
  },
};

/** Typing over a chosen value and leaving the field puts the chosen text back. */
export const BlurRestores: Story = {
  tags: ['no-visual'],
  parameters: { a11y: MENU_ROW_A11Y },
  args: { defaultValue: 'green-grocer' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Merchant' });
    await expect(input).toHaveValue('Green Grocer');
    await userEvent.tab();
    await userEvent.keyboard('{End} and more');
    await waitFor(() => expect(listbox()).toBeVisible());
    await userEvent.tab();
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
    await expect(input).toHaveValue('Green Grocer');
    await expect(input).not.toHaveFocus();
  },
};
