import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { paint, tokenColor } from '../stories/paint';
import { Checkbox } from './Checkbox';

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
    await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-boundary'));
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-raised'));
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
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-ink'));
    // The mark is a mask over the canvas color: not an image with a color of its own.
    const mark = getComputedStyle(box, '::after');
    await expect(mark.backgroundColor).toBe(tokenColor('--color-canvas'));
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
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-ink'));
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
    await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-error'));
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
    await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-ink'));
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
    await expect(getComputedStyle(row).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-disabled'));
  },
};

/** A disabled box that is checked keeps its mark, in the quiet taupe. */
export const DisabledChecked: Story = {
  args: { isDisabled: true, defaultSelected: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox').closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(box, '::after').backgroundColor).toBe(tokenColor('--color-taupe'));
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

/**
 * No text, named by aria-label, as a table's row select is. The row is only as wide
 * as the box, so the box carries a 40px square hit area of its own, centred on it:
 * a point 9px to either side, above or below the box still presses the checkbox.
 */
export const Labelless: Story = {
  args: { children: undefined, 'aria-label': 'Select row 3' },
  // Room around the box, so the points the play function tests are inside the window.
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    const input = canvas.getByRole('checkbox', { name: 'Select row 3' });
    const row = input.closest('label');
    const box = row?.querySelector('.checkbox-box');
    if (!row || !box) throw new Error('No row');
    await expect(row.querySelector('.checkbox-text')).toBeNull();
    // The drawn box stays 20px, and the hit area around it is 40px square.
    const area = getComputedStyle(box, '::before');
    await expect(box.getBoundingClientRect().width).toBe(20);
    await expect(area.width).toBe('40px');
    await expect(area.height).toBe('40px');
    const edges = box.getBoundingClientRect();
    const middle = { x: edges.left + edges.width / 2, y: edges.top + edges.height / 2 };
    const near = [
      { x: edges.left - 9, y: middle.y },
      { x: edges.right + 9, y: middle.y },
      { x: middle.x, y: edges.top - 9 },
      { x: middle.x, y: edges.bottom + 9 },
    ];
    for (const point of near) {
      const hit = document.elementFromPoint(point.x, point.y);
      await expect(hit?.closest('label')).toBe(row);
    }
    // The area stops at 40px, so it leaves the room between neighbouring rows alone.
    const beyond = document.elementFromPoint(edges.left - 11, middle.y);
    await expect(beyond?.closest('label')).not.toBe(row);
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
    await expect(getComputedStyle(box).outlineColor).toBe(tokenColor('--focus-ring-color'));
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
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-ink'));
  },
};

/**
 * A link in the label is a tab stop of its own. Focused by keyboard it draws its
 * own ring, and the box draws none: the box rings only for its own input.
 */
export const LinkInLabel: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Checkbox {...args}>
      I agree to the <Link href="#terms">terms of service</Link>
    </Checkbox>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('checkbox', { name: 'I agree to the terms of service' })).toHaveFocus();
    await userEvent.tab();
    const link = canvas.getByRole('link', { name: 'terms of service' });
    await expect(link).toHaveFocus();
    const box = canvas.getByRole('checkbox').closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).outlineStyle).toBe('none');
    await expect(getComputedStyle(link).outlineStyle).toBe('solid');
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

/** Hidden the way React Aria hides the input, so the row is what a person sees and presses. */
const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  border: 0,
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
} as const;

/**
 * The stylesheet also serves markup without React Aria: a label that holds a
 * checkbox which says it is invalid with aria-invalid takes the error edge.
 */
export const PlainHtml: Story = {
  tags: ['no-visual'],
  render: () => (
    <label className="checkbox">
      <input type="checkbox" aria-invalid="true" style={VISUALLY_HIDDEN} />
      <span className="checkbox-box" aria-hidden="true" />
      <span className="checkbox-text">I agree to the terms of service</span>
    </label>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox').closest('label')?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-error'));
  },
};
