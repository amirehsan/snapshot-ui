import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, waitFor } from 'storybook/test';
import { Button } from '../button';
import { paint, tokenColor, tokenPixels, washColor } from '../stories/paint';
import { SearchField, type SearchFieldBaseProps } from './SearchField';

const meta = {
  title: 'Components/SearchField',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: SearchField as ComponentType<SearchFieldBaseProps>,
  args: { label: 'Search transactions', placeholder: 'Merchant or note' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(24rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<SearchFieldBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** A label and an empty field: the magnifier at the start, and no clear button while there is nothing to clear. */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('searchbox', { name: 'Search transactions' });
    await expect(input).toHaveAttribute('placeholder', 'Merchant or note');
    await expect(getComputedStyle(find(canvasElement, '.search-field-clear')).display).toBe('none');
    // Under a visible label the placeholder keeps the input's taupe.
    await expect(getComputedStyle(input, '::placeholder').color).toBe(tokenColor('--color-taupe'));
    // The control is the input's height, whatever line height it sits in.
    await expect(find(canvasElement, '.search-field-control').getBoundingClientRect().height).toBe(
      input.getBoundingClientRect().height,
    );
  },
};

/** With text the clear button shows at the end: a ghost circle a field step smaller than the field. */
export const WithValue: Story = {
  tags: ['density'],
  args: { defaultValue: 'coffee' },
  play: async ({ canvasElement }) => {
    const clear = find(canvasElement, '.search-field-clear');
    await expect(getComputedStyle(clear).display).not.toBe('none');
    await expect(clear).toHaveAccessibleName('Clear search');
  },
};

/**
 * In a toolbar there is no label row, so the field is named by `aria-label` and its placeholder is the only words
 * a sighted reader gets. It is slate there, not taupe.
 */
export const Unlabelled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <SearchField aria-label="Search transactions" placeholder="Search transactions" />
      </div>
      <Button variant="secondary">Export</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('searchbox', { name: 'Search transactions' });
    await expect(input.closest('.search-field')).toHaveAttribute('data-unlabelled', '');
    await expect(getComputedStyle(input, '::placeholder').color).toBe(tokenColor('--color-slate'));
  },
};

/** Disabled, an unlabelled field's placeholder is the disabled text, taupe, and not slate. */
export const UnlabelledDisabled: Story = {
  tags: ['no-visual'],
  args: {
    label: undefined,
    'aria-label': 'Search archived',
    placeholder: 'Search archived',
    isDisabled: true,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('searchbox', { name: 'Search archived' });
    await expect(input.closest('.search-field')).toHaveAttribute('data-unlabelled', '');
    await expect(getComputedStyle(input, '::placeholder').color).toBe(tokenColor('--color-taupe'));
  },
};

/** A read-only field shows its text and no clear button, since the text cannot be cleared. */
export const ReadOnly: Story = {
  tags: ['no-visual'],
  args: { defaultValue: 'coffee', isReadOnly: true },
  play: async ({ canvasElement }) => {
    await expect(find(canvasElement, '.search-field')).toHaveAttribute('data-readonly');
    await expect(getComputedStyle(find(canvasElement, '.search-field-clear')).display).toBe('none');
  },
};

/** A hint, a disabled field with a value and an invalid one with its error line. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <SearchField
        label="Search transactions"
        placeholder="Merchant or note"
        description="Searches the merchant, the note and the amount."
      />
      <SearchField label="Search archived" defaultValue="coffee" isDisabled />
      <SearchField
        label="Search notes"
        defaultValue="c"
        isInvalid
        errorMessage="Search needs two letters or more"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const disabled = canvas.getByRole('searchbox', { name: 'Search archived' });
    await expect(disabled).toBeDisabled();
    const field = disabled.closest('.search-field');
    if (!field) throw new Error('No field');
    await expect(getComputedStyle(find(field, '.search-field-icon')).color).toBe(tokenColor('--color-taupe'));
    const invalid = canvas.getByRole('searchbox', { name: 'Search notes' });
    await expect(getComputedStyle(invalid).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(canvas.getByText('Search needs two letters or more')).toBeVisible();
  },
};

/** Keyboard focus firms the edge to ink and draws the ring outside it. */
export const KeyboardFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const input = canvas.getByRole('searchbox', { name: 'Search transactions' });
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).outlineStyle).toBe('solid');
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-ink'));
  },
};

/**
 * In right to left the magnifier sits at the right, the start of the line, and the clear button at the left.
 * Neither is mirrored.
 */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <SearchField label="جستجو" defaultValue="قهوه" clearLabel="پاک کردن جستجو" />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const input = find(canvasElement, '.search-field-input');
    const style = getComputedStyle(input);
    // Where the text starts: the input's right edge less its border and its start padding.
    const textStart =
      input.getBoundingClientRect().right -
      parseFloat(style.borderRightWidth) -
      parseFloat(style.paddingRight);
    const icon = find(canvasElement, '.search-field-icon').getBoundingClientRect();
    const clear = find(canvasElement, '.search-field-clear').getBoundingClientRect();
    await expect(icon.right).toBeGreaterThan(textStart);
    await expect(clear.left).toBeLessThan(textStart);
    await expect(clear.right).toBeLessThan(
      input.getBoundingClientRect().left + parseFloat(style.paddingLeft),
    );
  },
};

/** Escape clears and takes the clear button away; Enter submits the text. */
export const Keys: Story = {
  tags: ['no-visual'],
  args: { onSubmit: fn(), onClear: fn() },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole('searchbox', { name: 'Search transactions' });
    await userEvent.click(input);
    await userEvent.keyboard('rent');
    await expect(getComputedStyle(find(canvasElement, '.search-field-clear')).display).not.toBe('none');
    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveValue('');
    await expect(args.onClear).toHaveBeenCalledOnce();
    await expect(getComputedStyle(find(canvasElement, '.search-field-clear')).display).toBe('none');
    await userEvent.keyboard('coffee{Enter}');
    await expect(args.onSubmit).toHaveBeenCalledWith('coffee');
  },
};

/** A press of the clear button empties the field and leaves focus in the input. */
export const ClearPress: Story = {
  tags: ['no-visual'],
  args: { defaultValue: 'coffee' },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('searchbox', { name: 'Search transactions' });
    find(canvasElement, '.search-field-clear').click();
    await waitFor(() => expect(input).toHaveValue(''));
    await expect(input).toHaveFocus();
  },
};

/**
 * Under the pointer the clear button takes the 5% ink wash and its glyph turns ink, and the input keeps the
 * hover edge it had a moment before, as the pointer crossed it.
 */
export const HoverButton: Story = {
  tags: ['no-visual'],
  args: { defaultValue: 'coffee' },
  play: async ({ canvasElement, userEvent }) => {
    const clear = find(canvasElement, '.search-field-clear');
    const input = find(canvasElement, '.search-field-input');
    await userEvent.hover(clear);
    await expect(getComputedStyle(input).borderTopColor).toBe(
      paint('color-mix(in srgb, var(--color-ink) 65%, transparent)', find(canvasElement, '.search-field')),
    );
    await expect(getComputedStyle(clear).backgroundColor).toBe(
      washColor(find(canvasElement, '.search-field')),
    );
    await expect(getComputedStyle(clear).color).toBe(tokenColor('--color-ink'));
    await userEvent.unhover(clear);
  },
};

/** In compact density the clear button draws at 24px and is still hit at 40px. */
export const CompactHitArea: Story = {
  tags: ['no-visual'],
  args: { defaultValue: 'coffee' },
  decorators: [
    (Story) => (
      <div data-density="compact">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const clear = find(canvasElement, '.search-field-clear');
    // A coarse pointer's compact field is 44px, so the drawn button follows the field.
    const field = find(canvasElement, '.search-field-input').getBoundingClientRect().height;
    await expect(clear.getBoundingClientRect().height).toBe(field - 12);
    if (field === 36) await expect(clear.getBoundingClientRect().width).toBe(24);
    const target = `${tokenPixels('--size-target')}px`;
    await expect(getComputedStyle(clear, '::before').height).toBe(target);
    await expect(getComputedStyle(clear, '::before').width).toBe(target);
  },
};
