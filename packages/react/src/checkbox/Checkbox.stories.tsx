import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Checkbox } from './Checkbox';

/** The color a CSS value paints in the current theme, read by painting it. */
function paint(value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

const token = (name: string): string => paint(`var(${name})`);

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'Remember me on this device' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The box is the Raised fill with the boundary edge, and the whole row is the label. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('checkbox', { name: 'Remember me on this device' });
    await expect(input).not.toBeChecked();
    const box = input.closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).borderTopColor).toBe(token('--color-boundary'));
    await expect(getComputedStyle(box).backgroundColor).toBe(token('--color-raised'));
    // Nothing is drawn inside an empty box.
    await expect(getComputedStyle(box, '::after').display).toBe('none');
  },
};

/** Checked is an ink fill with a canvas mark, so the mark reads in both themes. */
export const Checked: Story = {
  args: { defaultSelected: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('checkbox');
    await expect(input).toBeChecked();
    const box = input.closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).backgroundColor).toBe(token('--color-ink'));
    await expect(getComputedStyle(box).borderTopColor).toBe(token('--color-ink'));
    // The mark is a mask over the canvas color: not an image with a color of its own.
    const mark = getComputedStyle(box, '::after');
    await expect(mark.backgroundColor).toBe(token('--color-canvas'));
    await expect(mark.display).toBe('block');
    await expect(mark.maskImage).toContain('polyline');
  },
};

/** Mixed: a canvas bar on the ink fill, for a parent whose children are partly checked. */
export const Indeterminate: Story = {
  args: { isIndeterminate: true, children: 'Select all channels' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('checkbox', { name: 'Select all channels' });
    await expect(input).toBePartiallyChecked();
    const box = input.closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).backgroundColor).toBe(token('--color-ink'));
    await expect(getComputedStyle(box, '::after').maskImage).toContain('M4 10h12');
  },
};

/** The hint sits under the label's text, not under the box. */
export const WithDescription: Story = {
  args: {
    children: 'Show service descriptions',
    description: 'Off hides the copy under each service card.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toHaveAccessibleDescription(
      'Off hides the copy under each service card.',
    );
  },
};

/** Invalid turns the edge to the error color and shows the error line. */
export const Invalid: Story = {
  args: { isInvalid: true, errorMessage: 'Accept the terms to continue.', children: 'I accept the terms' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('checkbox');
    await expect(input).toBeInvalid();
    await expect(canvas.getByText('Accept the terms to continue.')).toBeVisible();
    const box = input.closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).borderTopColor).toBe(token('--color-error'));
  },
};

/** Only the edge turns: a checked box that is invalid still reads as checked. */
export const InvalidAndChecked: Story = {
  args: {
    isInvalid: true,
    defaultSelected: true,
    errorMessage: 'This option is not available on your plan.',
    children: 'Export every page as PDF',
  },
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox').closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).borderTopColor).toBe(token('--color-error'));
    await expect(getComputedStyle(box).backgroundColor).toBe(token('--color-ink'));
  },
};

/** The disabled fill, a taupe label and a faint edge, with the not-allowed cursor. */
export const Disabled: Story = {
  args: { isDisabled: true, description: 'Managed by your workspace admin.' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('checkbox');
    await expect(input).toBeDisabled();
    const row = input.closest('label');
    const box = row?.querySelector('.checkbox-box');
    if (!row || !box) throw new Error('No row');
    await expect(getComputedStyle(row).cursor).toBe('not-allowed');
    await expect(getComputedStyle(row).color).toBe(token('--color-taupe'));
    await expect(getComputedStyle(box).backgroundColor).toBe(token('--color-disabled'));
  },
};

/** A disabled box that is checked keeps its mark, in the quiet taupe. */
export const DisabledChecked: Story = {
  args: { isDisabled: true, defaultSelected: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox').closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).backgroundColor).toBe(token('--color-disabled'));
    await expect(getComputedStyle(box, '::after').backgroundColor).toBe(token('--color-taupe'));
    await expect(getComputedStyle(box, '::after').display).toBe('block');
  },
};

/** Read-only looks like an enabled box and cannot be pressed. It is not offered as a button. */
export const ReadOnly: Story = {
  tags: ['no-visual'],
  args: { isReadOnly: true, defaultSelected: true },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('checkbox');
    const row = input.closest('label');
    if (!row) throw new Error('No row');
    await expect(getComputedStyle(row).cursor).toBe('default');
    await userEvent.click(row);
    await userEvent.keyboard(' ');
    await expect(input).toBeChecked();
  },
};

/** A long label wraps beside the box, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    children:
      'Send me a weekly summary of every change my team made to the site, including the ones I made myself',
    description: 'You can switch this off at any time from the notification settings.',
  },
};

/** Keyboard focus draws the ring around the box, outside it. */
export const Focused: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const input = canvas.getByRole('checkbox');
    await expect(input).toHaveFocus();
    const box = input.closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).outlineStyle).toBe('solid');
    await expect(getComputedStyle(box).outlineWidth).toBe('2px');
    await expect(getComputedStyle(box).outlineColor).toBe(token('--focus-ring-color'));
  },
};

/** The ring is outside the ink fill, so ink still reads against the page. */
export const FocusedChecked: Story = {
  args: { defaultSelected: true },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const input = canvas.getByRole('checkbox');
    await expect(input).toHaveFocus();
    const box = input.closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).outlineWidth).toBe('2px');
    await expect(getComputedStyle(box).backgroundColor).toBe(token('--color-ink'));
  },
};

/** Hover darkens the edge of an empty box to ink at 70%. */
export const Hovered: Story = {
  tags: ['no-visual'],
  play: async ({ canvas, userEvent }) => {
    const row = canvas.getByRole('checkbox').closest('label');
    const box = row?.querySelector('.checkbox-box');
    if (!row || !box) throw new Error('No row');
    await userEvent.hover(row);
    await expect(getComputedStyle(box).borderTopColor).toBe(
      paint('color-mix(in srgb, var(--color-ink) 70%, transparent)'),
    );
  },
};

/** Click and Space toggle the box. Enter does not. */
export const Toggle: Story = {
  tags: ['no-visual'],
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('checkbox');
    await userEvent.click(canvas.getByText('Remember me on this device'));
    await expect(input).toBeChecked();
    await userEvent.keyboard('{Enter}');
    await expect(input).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(input).not.toBeChecked();
  },
};

/**
 * The whole row is the label. The box is 20px, and the row around it is at least
 * 40px tall, so the gap, the padding and the text all press the box.
 */
export const RowIsTheTarget: Story = {
  tags: ['no-visual'],
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('checkbox');
    const row = input.closest('label');
    const box = row?.querySelector('.checkbox-box');
    const text = row?.querySelector('.checkbox-text');
    if (!row || !box || !text) throw new Error('No row');
    const rowBox = row.getBoundingClientRect();
    await expect(rowBox.height).toBeGreaterThanOrEqual(40);
    await expect(box.getBoundingClientRect().width).toBe(20);
    // Points inside the row that are not the box and not the text: the gap between them, and the
    // padding above the box. Each one is the row itself, so a press lands on the label.
    const gap = {
      x: (box.getBoundingClientRect().right + text.getBoundingClientRect().left) / 2,
      y: rowBox.top + rowBox.height / 2,
    };
    const corner = { x: rowBox.left + 1, y: rowBox.top + 1 };
    for (const point of [gap, corner]) {
      const hit = document.elementFromPoint(point.x, point.y);
      await expect(hit && row.contains(hit)).toBe(true);
    }
    const target = document.elementFromPoint(gap.x, gap.y);
    if (!target) throw new Error('Nothing at the gap');
    await userEvent.click(target);
    await expect(input).toBeChecked();
  },
};
