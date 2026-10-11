import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { TextArea } from './TextArea';

/** The color a token paints in the current theme, read by painting it. */
function tokenColor(name: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

/** The corner radius a token paints in the current shape, read by painting it. */
function tokenRadius(name: string): string {
  const probe = document.createElement('span');
  probe.style.borderTopLeftRadius = `var(${name})`;
  document.body.append(probe);
  const { borderTopLeftRadius } = getComputedStyle(probe);
  probe.remove();
  return borderTopLeftRadius;
}

const TWO_LINES =
  'A shared space for the Northwind design team.\nBriefs, reviews and the weekly notes live here.';
const NEAR_BUDGET = 'A shared space for the Northwind design team.\nBriefs and reviews.';
const OVER_BUDGET = 'A shared space for the Northwind design team.\nBriefs, reviews, notes and the guests.';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  args: { label: 'Short description', placeholder: 'A shared space for the Northwind design team' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A label and a box three lines tall. The placeholder is taupe and never replaces the label. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(textarea.tagName).toBe('TEXTAREA');
    await expect(textarea).toHaveAttribute('placeholder', 'A shared space for the Northwind design team');
    const style = getComputedStyle(textarea);
    // The edge is the input's own, and the box is the textarea's: a control corner, not a pill, never under 6rem.
    await expect(style.borderTopColor).toBe(tokenColor('--color-boundary'));
    await expect(style.borderTopLeftRadius).toBe(tokenRadius('--radius-control'));
    await expect(style.minHeight).toBe('96px');
    await expect(textarea.getBoundingClientRect().height).toBeGreaterThanOrEqual(96);
    await expect(style.resize).toBe('vertical');
  },
};

/** The hint is the control's accessible description. */
export const WithDescription: Story = {
  args: { description: 'One or two sentences, shown in search results and invites.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Short description' })).toHaveAccessibleDescription(
      'One or two sentences, shown in search results and invites.',
    );
  },
};

/** `isChanged` shows the clay chip and the light signal orange edge, and the chip is read with the field. */
export const Changed: Story = {
  args: {
    isChanged: true,
    defaultValue: TWO_LINES,
    description: 'One or two sentences, shown in search results and invites.',
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(canvas.getByText('Changed')).toBeVisible();
    const style = getComputedStyle(textarea);
    await expect(style.borderTopColor).toBe(tokenColor('--color-signal-light'));
    // The box keeps its own corners while the input's changed edge is drawn.
    await expect(style.borderTopLeftRadius).toBe(tokenRadius('--radius-control'));
    await expect(textarea).toHaveAccessibleDescription(
      'One or two sentences, shown in search results and invites. Changed',
    );
  },
};

/** The error line appears with the invalid state, and the edge turns to the error color. */
export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: '!', errorMessage: 'Write at least one full sentence.' },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(canvas.getByText('Write at least one full sentence.')).toBeVisible();
    await expect(textarea).toBeInvalid();
    await expect(getComputedStyle(textarea).borderTopColor).toBe(tokenColor('--color-error'));
  },
};

/** Invalid outranks changed: the error edge and the error line show, and the chip leaves. */
export const InvalidAndChanged: Story = {
  args: {
    isChanged: true,
    isInvalid: true,
    defaultValue: '!',
    errorMessage: 'Write at least one full sentence.',
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(canvas.queryByText('Changed')).not.toBeInTheDocument();
    await expect(canvas.getByText('Write at least one full sentence.')).toBeVisible();
    await expect(getComputedStyle(textarea).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(textarea).toHaveAccessibleDescription('Write at least one full sentence.');
  },
};

/** From 70% of the budget the count appears, quiet and slate. A line break counts as one character. */
export const WithCounter: Story = {
  args: {
    description: 'One or two sentences, for search results.',
    budget: 80,
    defaultValue: NEAR_BUDGET,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('65 of about 80');
  },
};

/** Past the budget the count turns to ink at 700. Typing was never blocked, and the value still saves. */
export const OverBudget: Story = {
  args: {
    description: 'One or two sentences, for search results.',
    budget: 80,
    defaultValue: OVER_BUDGET,
  },
  play: async ({ canvas }) => {
    const counter = canvas.getByRole('status');
    await expect(counter).toHaveTextContent('84 of about 80');
    await expect(counter).toHaveAttribute('data-over');
    await expect(getComputedStyle(counter).fontWeight).toBe('700');
    await expect(canvas.getByRole('textbox')).toBeValid();
  },
};

/** The disabled fill, taupe text and a faint edge, on the same box. */
export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: TWO_LINES },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(textarea).toBeDisabled();
    const style = getComputedStyle(textarea);
    await expect(style.cursor).toBe('not-allowed');
    await expect(style.backgroundColor).toBe(tokenColor('--color-disabled'));
    await expect(style.borderTopLeftRadius).toBe(tokenRadius('--radius-control'));
  },
};

/** A long label wraps and the chip drops under it, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    label: 'The description your team sees in search results, in every invite and in the billing emails',
    isChanged: true,
    defaultValue: 'A shared space.\nBriefs and notes.',
  },
};

/** `rows` sets the height in lines. Six lines are taller than the 6rem floor. */
export const Tall: Story = {
  args: { rows: 6, defaultValue: TWO_LINES },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(textarea).toHaveAttribute('rows', '6');
    await expect(textarea.getBoundingClientRect().height).toBeGreaterThan(150);
  },
};

/** Keyboard focus firms the edge to ink and draws the ring outside it. */
export const Focused: Story = {
  args: { defaultValue: TWO_LINES },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    // Tabbing into a field can select its text. Collapse it, so the baseline shows the ring and not a highlight.
    await userEvent.keyboard('{Control>}{End}{/Control}');
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(textarea).toHaveFocus();
    const style = getComputedStyle(textarea);
    await expect(style.borderTopColor).toBe(tokenColor('--color-ink'));
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('2px');
    await expect(style.outlineColor).toBe(tokenColor('--focus-ring-color'));
  },
};

/** The changed edge outranks the firmer one, so the ring alone shows that a changed field has focus. */
export const ChangedAndFocused: Story = {
  args: { isChanged: true, defaultValue: TWO_LINES },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{Control>}{End}{/Control}');
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await expect(textarea).toHaveFocus();
    const style = getComputedStyle(textarea);
    await expect(style.borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('2px');
  },
};

/** Enter adds a line and never submits. Typing is never blocked at the budget, and the count follows. */
export const Typing: Story = {
  tags: ['no-visual'],
  args: { description: 'One or two sentences, for search results.', budget: 10 },
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Short description' });
    await userEvent.type(textarea, 'fourteen{Enter}chars');
    await expect(textarea).toHaveValue('fourteen\nchars');
    await expect(textarea).toBeValid();
    await expect(canvas.getByRole('status')).toHaveTextContent('14 of about 10');
  },
};
