import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType, ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PickerOption } from '../picker';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { tokenColor } from '../stories/paint';
import { MultiSelect, type MultiSelectBaseProps } from './MultiSelect';

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

/** The tags' texts, in the order drawn. */
const tagTexts = (scope: ParentNode): string[] =>
  [...scope.querySelectorAll('.multi-select-tag-text')].map((text) => text.textContent);

const listbox = (): HTMLElement => within(document.body).getByRole('listbox');

/** The field size the frame reads, in pixels, under whatever density and shape wrap it. */
const fieldSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).getPropertyValue('--size-field'));

/** Twelve budget categories. */
const CATEGORIES = [
  'Food',
  'Rent',
  'Utilities',
  'Transport',
  'Health',
  'Insurance',
  'Fun',
  'Travel',
  'Gifts',
  'Education',
  'Savings',
  'Subscriptions',
];

const idOf = (name: string): string => name.toLowerCase();

const TWELVE = CATEGORIES.map((name) => (
  <PickerOption key={name} id={idOf(name)}>
    {name}
  </PickerOption>
));

const meta = {
  title: 'Components/MultiSelect',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: MultiSelect as ComponentType<MultiSelectBaseProps>,
  args: {
    label: 'Categories',
    placeholder: 'Add a category',
    defaultValue: ['food', 'rent'],
    children: TWELVE,
  },
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
} satisfies Meta<MultiSelectBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two chosen values: bone pills, each a word at 500 and a small slate X, in a frame a field tall with the
 * chevron button at its end.
 */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const frame = find(canvasElement, '.multi-select-control');
    await expect(frame.getBoundingClientRect().height).toBe(fieldSize(frame));
    await expect(tagTexts(canvasElement)).toEqual(['Food', 'Rent']);
    const tag = find(canvasElement, '.multi-select-tag');
    await expect(getComputedStyle(tag).backgroundColor).toBe(tokenColor('--color-bone'));
    await expect(getComputedStyle(tag).fontWeight).toBe('500');
    await expect(tag.getBoundingClientRect().height).toBe(fieldSize(frame) - 12);
    const remove = find(canvasElement, '.multi-select-tag-remove');
    await expect(getComputedStyle(remove).color).toBe(tokenColor('--color-slate'));
    await expect(remove.getBoundingClientRect().width).toBe(20);
  },
};

/** Nothing chosen: the placeholder in taupe, the input's own, and no tags. */
export const Empty: Story = {
  args: { defaultValue: [] },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Categories' });
    await expect(input).toHaveAttribute('placeholder', 'Add a category');
    await expect(getComputedStyle(input, '::placeholder').color).toBe(tokenColor('--color-taupe'));
    await expect(canvasElement.querySelector('.multi-select-tag')).toBeNull();
  },
};

/**
 * Eight chosen values: the frame grows a row at a time, to three rows, and its corner is the 24px surface step
 * rather than a stadium that would clip the tags at its ends.
 */
export const ManyValues: Story = {
  args: { defaultValue: CATEGORIES.slice(0, 8).map(idOf) },
  play: async ({ canvasElement }) => {
    const frame = find(canvasElement, '.multi-select-control');
    await expect(tagTexts(canvasElement)).toHaveLength(8);
    const rows = new Set(
      [...canvasElement.querySelectorAll('.multi-select-tag')].map((tag) =>
        Math.round(tag.getBoundingClientRect().top),
      ),
    );
    await expect(rows.size).toBeGreaterThanOrEqual(2);
    await expect(frame.getBoundingClientRect().height).toBeGreaterThan(fieldSize(frame) * 2);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * The list opened from the keyboard: the frame ringed, the Menu's float panel under the whole frame, and the
 * chosen rows with their check and no ink pill.
 */
export const Open: Story = {
  tags: ['density'],
  parameters: { a11y: MENU_ROW_A11Y },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.tab();
    await userEvent.tab();
    const input = canvas.getByRole('combobox', { name: 'Categories' });
    await expect(input).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    const popover = await atRest();
    const frame = find(canvasElement, '.multi-select-control');
    await expect(getComputedStyle(frame).outlineStyle).toBe('solid');
    const box = popover.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(frame.getBoundingClientRect().width - 0.5);
    const food = within(document.body).getByRole('option', { name: 'Food' });
    await expect(food).toHaveAttribute('aria-selected', 'true');
    await expect(getComputedStyle(food).backgroundColor).not.toBe(tokenColor('--color-ink'));
  },
};

/** Backspace in the empty input focuses the last tag: the tag rings itself and the frame draws nothing. */
export const TagFocus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Backspace}');
    const rent = within(canvasElement).getByRole('row', { name: 'Rent' });
    await expect(rent).toHaveFocus();
    await expect(getComputedStyle(rent).outlineStyle).toBe('solid');
    await expect(getComputedStyle(find(canvasElement, '.multi-select-control')).outlineStyle).toBe('none');
    await expect(tagTexts(canvasElement)).toEqual(['Food', 'Rent']);
  },
};

/**
 * A changed multi-select with its chip and light orange edge, an invalid one with its error and no tags, and a
 * disabled one, its tags taupe with no X.
 */
export const States: Story = {
  render: (): ReactElement => (
    <div style={{ display: 'grid', gap: 24 }}>
      <MultiSelect label="Categories" defaultValue={['food', 'travel']} isChanged>
        {TWELVE}
      </MultiSelect>
      <MultiSelect
        label="Budget lines"
        placeholder="Add a category"
        isInvalid
        errorMessage="Choose at least one category"
      >
        {TWELVE}
      </MultiSelect>
      <MultiSelect label="Archived categories" defaultValue={['gifts', 'savings']} isDisabled>
        {TWELVE}
      </MultiSelect>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const [changed, invalid, disabled] = [...canvasElement.querySelectorAll('.multi-select-control')];
    if (!changed || !invalid || !disabled) throw new Error('Expected three frames');
    await expect(getComputedStyle(changed).borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(canvas.getByRole('combobox', { name: 'Categories' })).toHaveAccessibleDescription(/Changed/);
    await expect(getComputedStyle(invalid).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(canvas.getByText('Choose at least one category')).toBeVisible();
    await expect(canvas.getByRole('combobox', { name: 'Archived categories' })).toBeDisabled();
    await expect(disabled.querySelector('.multi-select-tag-remove')).toBeNull();
    await expect(getComputedStyle(find(disabled, '.multi-select-tag')).color).toBe(
      tokenColor('--color-taupe'),
    );
  },
};

/** In right to left the tags run from the frame's right, and the button sits at its left, unmirrored. */
export const RightToLeft: Story = {
  render: (): ReactElement => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <MultiSelect
          label="دسته‌ها"
          defaultValue={['food', 'rent', 'fun']}
          labels={{ open: 'نمایش گزینه‌ها', remove: 'حذف', selected: 'انتخاب‌شده' }}
        >
          <PickerOption id="food">خوراک</PickerOption>
          <PickerOption id="rent">اجاره</PickerOption>
          <PickerOption id="fun">تفریح</PickerOption>
          <PickerOption id="travel">سفر</PickerOption>
        </MultiSelect>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const frame = find(canvasElement, '.multi-select-control').getBoundingClientRect();
    const first = find(canvasElement, '.multi-select-tag').getBoundingClientRect();
    const button = find(canvasElement, '.combo-box-button').getBoundingClientRect();
    await expect(first.right).toBeGreaterThan(frame.left + frame.width / 2);
    await expect(Math.round(frame.right - first.right)).toBe(9);
    await expect(button.right).toBeLessThan(frame.left + frame.width / 2);
    await expect(getComputedStyle(find(canvasElement, '.combo-box-button svg')).scale).toBe('none');
  },
};

/**
 * The keys: Enter toggles and the list stays open; Backspace twice from the empty input removes the last tag;
 * Delete on a tag removes it; the arrows move between tags.
 */
export const Keys: Story = {
  tags: ['no-visual'],
  parameters: { a11y: MENU_ROW_A11Y },
  args: { defaultValue: ['food', 'rent', 'fun'], onChange: fn() },
  play: async ({ args, canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Categories' });
    await userEvent.click(input);
    await userEvent.keyboard('trav');
    await waitFor(() => expect(listbox()).toBeVisible());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(['food', 'rent', 'fun', 'travel']);
    await expect(listbox()).toBeVisible();
    await expect(input).toHaveValue('');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
    // Backspace twice: the first focuses the last tag, the second removes it.
    await userEvent.keyboard('{Backspace}');
    await expect(within(canvasElement).getByRole('row', { name: 'Travel' })).toHaveFocus();
    await expect(tagTexts(canvasElement)).toHaveLength(4);
    await userEvent.keyboard('{Backspace}');
    await expect(tagTexts(canvasElement)).toEqual(['Food', 'Rent', 'Fun']);
    await expect(within(canvasElement).getByRole('row', { name: 'Fun' })).toHaveFocus();
    // The arrows move between tags; Delete removes the focused one and focus moves to its neighbor.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(within(canvasElement).getByRole('row', { name: 'Rent' })).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    await expect(tagTexts(canvasElement)).toEqual(['Food', 'Fun']);
    await expect(within(canvasElement).getByRole('row', { name: 'Fun' })).toHaveFocus();
  },
};

/** The frame rings for its input, never for a focused tag. */
export const FrameRing: Story = {
  tags: ['no-visual'],
  play: async ({ canvas, canvasElement }) => {
    const frame = find(canvasElement, '.multi-select-control');
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('row', { name: 'Food' })).toHaveFocus();
    await expect(getComputedStyle(frame).outlineStyle).toBe('none');
    await userEvent.tab();
    await expect(canvas.getByRole('combobox', { name: 'Categories' })).toHaveFocus();
    await expect(getComputedStyle(frame).outlineStyle).toBe('solid');
    // The focus edge is ink; Chrome draws the 1.5px edge at a whole device pixel, so its color is what is read.
    await expect(getComputedStyle(frame).borderTopColor).toBe(tokenColor('--color-ink'));
  },
};

/** A press on the frame's padding, outside a tag and the input, focuses the input. */
export const PressFrame: Story = {
  tags: ['no-visual'],
  play: async ({ canvas, canvasElement }) => {
    const frame = find(canvasElement, '.multi-select-control');
    frame.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
    await expect(canvas.getByRole('combobox', { name: 'Categories' })).toHaveFocus();
  },
};

/** The list opens against the frame: its left edge is the frame's, and it is at least as wide. */
export const PopoverAlign: Story = {
  tags: ['no-visual'],
  parameters: { a11y: MENU_ROW_A11Y },
  decorators: [
    (Story) => (
      <div style={{ paddingInlineStart: '1.5rem' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    find(canvasElement, '.combo-box-button').click();
    const popover = await atRest();
    const frame = find(canvasElement, '.multi-select-control').getBoundingClientRect();
    const box = popover.getBoundingClientRect();
    await expect(Math.abs(box.left - frame.left)).toBeLessThan(1);
    await expect(box.width).toBeGreaterThanOrEqual(frame.width - 0.5);
    await expect(box.top).toBeGreaterThan(frame.bottom);
  },
};

/** A form gets one value per chosen key. */
export const FormSubmit: Story = {
  tags: ['no-visual'],
  render: (args): ReactElement => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <MultiSelect {...args} label="Categories" name="categories" />
    </form>
  ),
  play: async ({ canvasElement }) => {
    const form = find(canvasElement, 'form') as HTMLFormElement;
    await expect(new FormData(form).getAll('categories')).toEqual(['food', 'rent']);
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Remove Food' }));
    await expect(new FormData(form).getAll('categories')).toEqual(['rent']);
  },
};

/** One row is exactly a field tall, at rest and with the input's focus edge. */
export const OneRowHeight: Story = {
  tags: ['no-visual'],
  play: async ({ canvas, canvasElement }) => {
    const frame = find(canvasElement, '.multi-select-control');
    await expect(frame.getBoundingClientRect().height).toBe(fieldSize(frame));
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('combobox', { name: 'Categories' })).toHaveFocus();
    await expect(getComputedStyle(frame).borderTopColor).toBe(tokenColor('--color-ink'));
    await expect(frame.getBoundingClientRect().height).toBe(fieldSize(frame));
  },
};
