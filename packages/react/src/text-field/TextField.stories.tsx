import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { TextField } from './TextField';

const NEAR_BUDGET = 'A shared space for the whole Northwind design team';
const OVER_BUDGET = 'A shared space for the whole Northwind design team and its guests';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: { label: 'Workspace name', placeholder: 'Northwind Studio' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A label and a control. The placeholder is taupe and never replaces the label. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Workspace name' });
    await expect(input).toHaveAttribute('placeholder', 'Northwind Studio');
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-boundary'));
  },
};

/** The hint is the control's accessible description. */
export const WithDescription: Story = {
  args: { description: 'Shown in the header and in every invite.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Workspace name' })).toHaveAccessibleDescription(
      'Shown in the header and in every invite.',
    );
  },
};

/** `isChanged` shows the clay chip and the light signal orange edge, and the chip is read with the field. */
export const Changed: Story = {
  args: {
    isChanged: true,
    defaultValue: 'Northwind Studio',
    description: 'Shown in the header and in every invite.',
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Workspace name' });
    await expect(canvas.getByText('Changed')).toBeVisible();
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(input).toHaveAccessibleDescription('Shown in the header and in every invite. Changed');
  },
};

/** The error line appears with the invalid state, and the edge turns to the error color. */
export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: '!', errorMessage: 'Enter a name for the workspace.' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Workspace name' });
    await expect(canvas.getByText('Enter a name for the workspace.')).toBeVisible();
    await expect(input).toBeInvalid();
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-error'));
  },
};

/** Invalid outranks changed: the error edge and the error line show, and the chip leaves. */
export const InvalidAndChanged: Story = {
  args: {
    isChanged: true,
    isInvalid: true,
    defaultValue: '!',
    errorMessage: 'Enter a name for the workspace.',
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Workspace name' });
    await expect(canvas.queryByText('Changed')).not.toBeInTheDocument();
    await expect(canvas.getByText('Enter a name for the workspace.')).toBeVisible();
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(input).toHaveAccessibleDescription('Enter a name for the workspace.');
  },
};

/** From 70% of the budget the count appears, quiet and slate. */
export const WithCounter: Story = {
  args: {
    label: 'Short description',
    description: 'One sentence, for search results.',
    budget: 60,
    defaultValue: NEAR_BUDGET,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('50 of about 60');
  },
};

/** Past the budget the count turns to ink at 700. Typing was never blocked, and the value still saves. */
export const OverBudget: Story = {
  args: {
    label: 'Short description',
    description: 'One sentence, for search results.',
    budget: 60,
    defaultValue: OVER_BUDGET,
  },
  play: async ({ canvas }) => {
    const counter = canvas.getByRole('status');
    await expect(counter).toHaveTextContent('65 of about 60');
    await expect(counter).toHaveAttribute('data-over');
    await expect(getComputedStyle(counter).fontWeight).toBe('700');
    await expect(canvas.getByRole('textbox')).toBeValid();
  },
};

/** The disabled fill, taupe text and a faint edge. */
export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'Northwind Studio' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Workspace name' });
    await expect(input).toBeDisabled();
    await expect(getComputedStyle(input).cursor).toBe('not-allowed');
    await expect(getComputedStyle(input).backgroundColor).toBe(tokenColor('--color-disabled'));
  },
};

/** A long label wraps and the chip drops under it, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    label: 'The name your team sees in the header, in every invite and in the billing emails',
    isChanged: true,
    defaultValue: 'Northwind Studio',
  },
};

/** Keyboard focus firms the edge to ink and draws the ring outside it. */
export const Focused: Story = {
  args: { defaultValue: 'Northwind Studio' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    // Tabbing into a field selects its text. Collapse it, so the baseline shows the ring and not a highlight.
    await userEvent.keyboard('{End}');
    const input = canvas.getByRole('textbox', { name: 'Workspace name' });
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(input).outlineStyle).toBe('solid');
    await expect(getComputedStyle(input).outlineWidth).toBe('2px');
    await expect(getComputedStyle(input).outlineColor).toBe(tokenColor('--focus-ring-color'));
  },
};

/** The changed edge outranks the firmer one, so the ring alone shows that a changed field has focus. */
export const ChangedAndFocused: Story = {
  args: { isChanged: true, defaultValue: 'Northwind Studio' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    const input = canvas.getByRole('textbox', { name: 'Workspace name' });
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(getComputedStyle(input).outlineStyle).toBe('solid');
    await expect(getComputedStyle(input).outlineWidth).toBe('2px');
  },
};

/** Typing is never blocked at the budget, and the count follows. */
export const Typing: Story = {
  tags: ['no-visual'],
  args: { label: 'Short description', description: 'One sentence, for search results.', budget: 10 },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Short description' });
    await userEvent.type(input, 'fourteen chars');
    await expect(input).toHaveValue('fourteen chars');
    await expect(input).toBeValid();
    await expect(canvas.getByRole('status')).toHaveTextContent('14 of about 10');
  },
};

/**
 * The stylesheet also serves markup without React Aria: a plain input says it is
 * invalid with aria-invalid, and that edge outranks a changed field's, as
 * data-invalid does. The fixture takes no pointer events, so a pointer left
 * over from an earlier story cannot hover an input and change the edge read.
 */
export const PlainHtml: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 16, pointerEvents: 'none' }}>
      <div className="field">
        <label className="field-label" htmlFor="plain-name">
          Workspace name
        </label>
        <input id="plain-name" className="input" defaultValue="Northwind Studio" />
      </div>
      <div className="field" data-changed="">
        <label className="field-label" htmlFor="plain-handle">
          Handle
        </label>
        <input id="plain-handle" className="input" aria-invalid="true" defaultValue="!" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const plain = canvas.getByRole('textbox', { name: 'Workspace name' });
    const invalid = canvas.getByRole('textbox', { name: 'Handle' });
    await expect(getComputedStyle(plain).borderTopColor).toBe(tokenColor('--color-boundary'));
    await expect(getComputedStyle(invalid).borderTopColor).toBe(tokenColor('--color-error'));
  },
};
