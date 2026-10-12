import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

/** The color a token paints in the current theme, read by painting it. */
function tokenColor(name: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

/** The row, which is the label around a radio. */
function rowOf(radio: HTMLElement): HTMLElement {
  const row = radio.closest('label');
  if (!row) throw new Error('A radio has no row');
  return row;
}

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  args: { label: 'Newsletter frequency' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly">Weekly</Radio>
      <Radio value="monthly">Monthly</Radio>
      <Radio value="never">Never</Radio>
    </RadioGroup>
  ),
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing chosen: a ring and a label per row, with no fill. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'Newsletter frequency' })).toBeVisible();
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).not.toBeChecked();
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Weekly' }))).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    );
  },
};

/** The chosen row is the ink pill, and its ring holds a check. */
export const Selected: Story = {
  args: { defaultValue: 'monthly' },
  play: async ({ canvas }) => {
    const row = rowOf(canvas.getByRole('radio', { name: 'Monthly' }));
    await expect(canvas.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    await expect(getComputedStyle(row).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(row).color).toBe(tokenColor('--color-canvas'));
    const check = getComputedStyle(row.querySelector('.radio-indicator') ?? row, '::after');
    await expect(check.backgroundColor).toBe(tokenColor('--color-canvas'));
    await expect(check.maskImage).toContain('url(');
  },
};

/** A hint under the group, and a hint under an option, which the radio reads. */
export const WithDescriptions: Story = {
  args: { description: 'You can change this at any time.', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" description="Every Tuesday morning.">
        Weekly
      </Radio>
      <Radio value="monthly" description="The first Tuesday of the month.">
        Monthly
      </Radio>
      <Radio value="never">Never</Radio>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radiogroup')).toHaveAccessibleDescription(
      'You can change this at any time.',
    );
    await expect(canvas.getByRole('radio', { name: 'Weekly' })).toHaveAccessibleDescription(
      'Every Tuesday morning. You can change this at any time.',
    );
  },
};

/** `orientation="horizontal"` lays the rows out in a row that wraps. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal', defaultValue: 'monthly' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup');
    await expect(group).toHaveAttribute('data-orientation', 'horizontal');
    await expect(getComputedStyle(group.querySelector('.radio-items') ?? group).flexDirection).toBe('row');
  },
};

/** In a horizontal group the pills hug their labels, and a hint wraps to the width of its own pill. */
export const HorizontalHints: Story = {
  args: { orientation: 'horizontal', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" description="Every Tuesday morning.">
        Weekly
      </Radio>
      <Radio value="monthly" description="The first Tuesday of the month.">
        Monthly
      </Radio>
      <Radio value="never" description="No email at all.">
        Never
      </Radio>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Weekly', 'Monthly', 'Never']) {
      const radio = canvas.getByRole('radio', { name });
      const row = rowOf(radio);
      const hint = row.nextElementSibling;
      if (!(hint instanceof HTMLElement)) throw new Error('The hint is missing');
      // The hint takes the width of the pill, and does not stretch it to the width of the sentence.
      await expect(hint.getBoundingClientRect().width).toBeCloseTo(row.getBoundingClientRect().width, 0);
      await expect(row.getBoundingClientRect().width).toBeLessThan(180);
    }
  },
};

/** `isChanged` shows the clay chip, and nothing else: the rows keep their plain edge. */
export const Changed: Story = {
  args: { isChanged: true, defaultValue: 'monthly', description: 'You can change this at any time.' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Newsletter frequency' });
    await expect(canvas.getByText('Changed')).toBeVisible();
    for (const name of ['Weekly', 'Monthly']) {
      await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name }))).borderTopColor).toBe(
        'rgba(0, 0, 0, 0)',
      );
    }
    await expect(group).toHaveAccessibleDescription('You can change this at any time. Changed');
  },
};

/** The error line appears with the invalid state, and every row's edge turns to the error color. */
export const Invalid: Story = {
  args: { isInvalid: true, isRequired: true, errorMessage: 'Choose a frequency.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Choose a frequency.')).toBeVisible();
    await expect(canvas.getByRole('radiogroup')).toHaveAttribute('data-invalid');
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Weekly' }))).borderTopColor).toBe(
      tokenColor('--color-error'),
    );
  },
};

/** Invalid outranks changed: the error edge and the error line show, and the chip leaves. */
export const InvalidAndChanged: Story = {
  args: {
    isChanged: true,
    isInvalid: true,
    defaultValue: 'never',
    errorMessage: 'Pick a frequency to stay informed.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('Changed')).not.toBeInTheDocument();
    await expect(canvas.getByText('Pick a frequency to stay informed.')).toBeVisible();
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Never' }))).borderTopColor).toBe(
      tokenColor('--color-error'),
    );
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Weekly' }))).borderTopColor).toBe(
      tokenColor('--color-error'),
    );
    await expect(canvas.getByRole('radiogroup')).toHaveAccessibleDescription(
      'Pick a frequency to stay informed.',
    );
  },
};

/** A disabled group: taupe labels, faint rings, the chosen check kept on the disabled fill. */
export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'weekly' },
  play: async ({ canvas }) => {
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeDisabled();
    const row = rowOf(canvas.getByRole('radio', { name: 'Weekly' }));
    await expect(getComputedStyle(row).cursor).toBe('not-allowed');
    await expect(getComputedStyle(row).backgroundColor).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(row).color).toBe(tokenColor('--color-taupe'));
  },
};

/** One disabled option in a live group. The keys skip it. */
export const DisabledItem: Story = {
  args: { label: 'Plan', defaultValue: 'free' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="free">Free</Radio>
      <Radio value="team" isDisabled>
        Team
      </Radio>
      <Radio value="business">Business</Radio>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Team' })).toBeDisabled();
    await expect(canvas.getByRole('radio', { name: 'Business' })).toBeEnabled();
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Team' }))).cursor).toBe(
      'not-allowed',
    );
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Business' }))).cursor).toBe(
      'pointer',
    );
  },
};

/** A read-only choice cannot change, so its rows take no wash and no pointer. */
export const ReadOnly: Story = {
  tags: ['no-visual'],
  args: { isReadOnly: true, defaultValue: 'weekly' },
  play: async ({ canvas, userEvent }) => {
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Never' }))).cursor).toBe(
      'default',
    );
    await userEvent.click(canvas.getByText('Never'));
    await expect(canvas.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Never' })).not.toBeChecked();
  },
};

/** Long labels wrap inside the row, and the chip drops under a long group label, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    label: 'How often should we email you about the activity in your workspaces and projects?',
    isChanged: true,
    defaultValue: 'weekly',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" description="A summary of everything that happened, every Tuesday morning.">
        A weekly summary of every workspace, project and invite you belong to
      </Radio>
      <Radio value="never">Never</Radio>
    </RadioGroup>
  ),
};

/** One word with no break in it wraps inside its row and never scrolls the group sideways. */
export const LongWord: Story = {
  args: { defaultValue: 'long' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="long">
        Antidisestablishmentarianismantidisestablishmentarianismantidisestablishmentarianism
      </Radio>
      <Radio value="short">Short</Radio>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup');
    const row = rowOf(canvas.getByRole('radio', { name: /^Antidisestablishment/ }));
    // Text that cannot break pokes out of its box and widens what holds it.
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** A radio named by `aria-label` has no text, and its row is still a target of 40px or more. */
export const Labelless: Story = {
  args: { orientation: 'horizontal', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" aria-label="Weekly" />
      <Radio value="monthly" aria-label="Monthly" />
      <Radio value="never" aria-label="Never" />
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Weekly', 'Monthly', 'Never']) {
      const row = rowOf(canvas.getByRole('radio', { name }));
      await expect(row.querySelector('.radio-text')).toBeNull();
      // A horizontal row hugs its content, so the padding and the dot are all that hold the width.
      const { width, height } = row.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(40);
      await expect(height).toBeGreaterThanOrEqual(40);
    }
  },
};

/** Keyboard focus on the chosen row draws the ring inside the ink pill, in the canvas color. */
export const FocusedSelected: Story = {
  args: { defaultValue: 'weekly' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const row = rowOf(canvas.getByRole('radio', { name: 'Weekly' }));
    await expect(canvas.getByRole('radio', { name: 'Weekly' })).toHaveFocus();
    await expect(getComputedStyle(row).outlineStyle).toBe('solid');
    await expect(getComputedStyle(row).outlineWidth).toBe('2px');
    await expect(getComputedStyle(row).outlineColor).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(row).outlineOffset).toBe('-4px');
  },
};

/** Keyboard focus on a row that is not chosen draws the token ring outside the row. */
export const FocusedUnselected: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const row = rowOf(canvas.getByRole('radio', { name: 'Weekly' }));
    await expect(canvas.getByRole('radio', { name: 'Weekly' })).toHaveFocus();
    await expect(getComputedStyle(row).outlineStyle).toBe('solid');
    await expect(getComputedStyle(row).outlineColor).toBe(tokenColor('--focus-ring-color'));
    await expect(getComputedStyle(row).outlineOffset).toBe('2px');
  },
};

/**
 * A link in a row's label is a tab stop of its own. Focused by keyboard it draws
 * its own ring, and the row draws none: the row rings only for its own radio.
 */
export const LinkInLabel: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly">
        Weekly, like the <Link href="#sample">sample issue</Link>
      </Radio>
      <Radio value="monthly">Monthly</Radio>
    </RadioGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const radio = canvas.getByRole('radio', { name: 'Weekly, like the sample issue' });
    await expect(radio).toHaveFocus();
    await userEvent.tab();
    const link = canvas.getByRole('link', { name: 'sample issue' });
    await expect(link).toHaveFocus();
    await expect(getComputedStyle(rowOf(radio)).outlineStyle).toBe('none');
    await expect(getComputedStyle(link).outlineStyle).toBe('solid');
  },
};

/**
 * A row that can be chosen takes a 5% wash of ink under the pointer, and a firmer ring. Not a
 * baseline: the browser re-checks the real pointer a moment after the play function hovers and
 * clears the synthetic hover, so the screenshot would show the row at rest.
 */
export const Hovered: Story = {
  tags: ['no-visual'],
  args: { defaultValue: 'monthly' },
  play: async ({ canvas, userEvent }) => {
    const row = rowOf(canvas.getByRole('radio', { name: 'Weekly' }));
    await userEvent.hover(row);
    await expect(row).toHaveAttribute('data-hovered');
    await expect(getComputedStyle(row).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    // The chosen row is already ink and takes no wash.
    await expect(
      getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Monthly' }))).backgroundColor,
    ).toBe(tokenColor('--color-ink'));
  },
};

/** The arrow keys move the choice, and Tab leaves the group. */
export const ArrowKeys: Story = {
  tags: ['no-visual'],
  args: { defaultValue: 'weekly' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Monthly' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect(canvas.getByRole('radio', { name: 'Never' })).toBeChecked();
  },
};

/** A dark group inside a light page, and a light one inside it, each with its own tokens. */
export const NestedThemes: Story = {
  args: { defaultValue: 'monthly' },
  render: (args) => (
    <div data-theme="dark" style={{ padding: 24, background: 'var(--color-canvas)' }}>
      <RadioGroup {...args} label="Dark group">
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </RadioGroup>
      <div data-theme="light" style={{ marginTop: 24, padding: 24, background: 'var(--color-lifted)' }}>
        <RadioGroup {...args} label="Light group" isChanged>
          <Radio value="weekly">Weekly</Radio>
          <Radio value="monthly">Monthly</Radio>
        </RadioGroup>
      </div>
    </div>
  ),
};
