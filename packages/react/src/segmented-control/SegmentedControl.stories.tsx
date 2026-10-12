import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { SegmentedControl, type SegmentedControlBaseProps } from './SegmentedControl';
import { SegmentedControlItem } from './SegmentedControlItem';

/** The color a token paints in the current theme, read by painting it. */
function tokenColor(name: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

/** One option for each entry: the key is the value and the text is what the option shows. */
function options(entries: Record<string, string>): ReactNode {
  return Object.entries(entries).map(([value, text]) => (
    <SegmentedControlItem key={value} value={value}>
      {text}
    </SegmentedControlItem>
  ));
}

const TWO = options({ light: 'Light', dark: 'Dark' });
const THREE = options({ light: 'Light', dark: 'Dark', system: 'System' });
const FIVE = options({
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
});

const meta = {
  title: 'Components/SegmentedControl',
  // The component's props are a union, since it needs a label or an aria-label, and Storybook
  // cannot narrow a union. The stories are written against the props every member shares.
  component: SegmentedControl as ComponentType<SegmentedControlBaseProps>,
  args: { label: 'Color mode', defaultValue: 'light', children: TWO },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(44rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<SegmentedControlBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two options. The track is a 48px pill with the boundary edge, and the selected option is an ink fill. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Color mode' });
    const track = group.querySelector('.segmented-track');
    const selected = canvas.getByRole('radio', { name: 'Light' }).closest('label');
    if (!track || !selected) throw new Error('No track or option');
    await expect(getComputedStyle(track).borderTopColor).toBe(tokenColor('--color-boundary'));
    await expect(track.getBoundingClientRect().height).toBe(48);
    await expect(selected.getBoundingClientRect().height).toBe(40);
    await expect(getComputedStyle(selected).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(selected).color).toBe(tokenColor('--color-canvas'));
    await expect(group).not.toHaveAttribute('data-stacked');
  },
};

/** Three options share the room left over equally, each at least as wide as its label. */
export const ThreeOptions: Story = {
  args: {
    defaultValue: 'system',
    children: THREE,
    description: 'System follows the setting of the device.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radiogroup')).toHaveAccessibleDescription(
      'System follows the setting of the device.',
    );
    await expect(canvas.getByRole('radio', { name: 'System' })).toBeChecked();
  },
};

/** Five short options still fit one row where there is room. On a phone they stack. */
export const FiveOptions: Story = {
  args: { label: 'Report cadence', defaultValue: 'weekly', children: FIVE },
};

/** The compact size draws 32px options in a 40px track, and still hits each at 40px. */
export const Compact: Story = {
  args: {
    label: undefined,
    'aria-label': 'Corners',
    size: 'sm',
    defaultValue: 'soft',
    children: options({ rounded: 'Rounded', soft: 'Soft', square: 'Square' }),
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Corners' });
    const track = group.querySelector('.segmented-track');
    const option = canvas.getByRole('radio', { name: 'Soft' }).closest('label');
    if (!track || !option) throw new Error('No track or option');
    await expect(track.getBoundingClientRect().height).toBe(40);
    await expect(option.getBoundingClientRect().height).toBe(32);
    await expect(getComputedStyle(option, '::before').height).toBe('40px');
  },
};

/**
 * The row does not fit 320px, so the options stack one per row. It is the whole
 * row or none of it: no option sits alone on a second line.
 */
export const Stacked: Story = {
  args: { label: 'Report cadence', defaultValue: 'weekly', children: FIVE },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Report cadence' });
    await waitFor(() => expect(group).toHaveAttribute('data-stacked'));
    const track = group.querySelector('.segmented-track');
    if (!track) throw new Error('No track');
    const rows = [...group.querySelectorAll('.segmented-option')].map((option) =>
      option.getBoundingClientRect(),
    );
    await expect(rows).toHaveLength(5);
    for (const [index, row] of rows.entries()) {
      await expect(row.height).toBe(40);
      await expect(row.left).toBe(rows[0]?.left);
      await expect(row.width).toBe(rows[0]?.width);
      if (index > 0) await expect(row.top).toBeGreaterThan(rows[index - 1]?.top ?? Infinity);
    }
    // The column fits the room, and nothing scrolls the page sideways.
    await expect(track.getBoundingClientRect().right).toBeLessThanOrEqual(
      group.getBoundingClientRect().right + 0.5,
    );
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** Recessed, with every label in taupe. The selected option keeps its place as a quiet taupe pill. */
export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'dark', children: THREE },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Color mode' });
    const track = group.querySelector('.segmented-track');
    const selected = canvas.getByRole('radio', { name: 'Dark' }).closest('label');
    const other = canvas.getByRole('radio', { name: 'Light' }).closest('label');
    if (!track || !selected || !other) throw new Error('No track or option');
    await expect(getComputedStyle(track).backgroundColor).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(selected).backgroundColor).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(other).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(other).cursor).toBe('not-allowed');
    await expect(canvas.getByRole('radio', { name: 'Light' })).toBeDisabled();
  },
};

/** `isChanged` shows the clay chip and firms the track edge to light signal orange. The track keeps its 48px, whatever width the browser gives the edge. */
export const Changed: Story = {
  args: { isChanged: true, defaultValue: 'dark', description: 'Applies to this device only.' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Color mode' });
    const track = group.querySelector('.segmented-track');
    if (!track) throw new Error('No track');
    await expect(canvas.getByText('Changed')).toBeVisible();
    await expect(getComputedStyle(track).borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(track.getBoundingClientRect().height).toBe(48);
    await expect(group).toHaveAccessibleDescription('Applies to this device only. Changed');
  },
};

/** The error line appears with the invalid state, and the track edge turns to the error color. */
export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: undefined, errorMessage: 'Choose a color mode.' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Color mode' });
    const track = group.querySelector('.segmented-track');
    if (!track) throw new Error('No track');
    await expect(canvas.getByText('Choose a color mode.')).toBeVisible();
    await expect(getComputedStyle(track).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(group).toHaveAccessibleDescription('Choose a color mode.');
  },
};

/** Invalid outranks changed: the error edge and the error line show, and the chip leaves. */
export const InvalidAndChanged: Story = {
  args: {
    isChanged: true,
    isInvalid: true,
    defaultValue: 'dark',
    errorMessage: 'Dark is not available here.',
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Color mode' });
    const track = group.querySelector('.segmented-track');
    if (!track) throw new Error('No track');
    await expect(canvas.queryByText('Changed')).not.toBeInTheDocument();
    await expect(getComputedStyle(track).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(group).toHaveAccessibleDescription('Dark is not available here.');
  },
};

/** Focus on the selected option is an inset ring in the canvas color, which reads on the ink fill. */
export const FocusedSelected: Story = {
  args: { defaultValue: 'dark' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const radio = canvas.getByRole('radio', { name: 'Dark' });
    await expect(radio).toHaveFocus();
    const option = radio.closest('label');
    if (!option) throw new Error('No option');
    await expect(getComputedStyle(option).outlineStyle).toBe('solid');
    await expect(getComputedStyle(option).outlineWidth).toBe('2px');
    await expect(getComputedStyle(option).outlineColor).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(option).outlineOffset).toBe('-4px');
  },
};

/** Focus on any other option is the standard ring, outside the pill. */
export const FocusedUnselected: Story = {
  args: { defaultValue: undefined },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const radio = canvas.getByRole('radio', { name: 'Light' });
    await expect(radio).toHaveFocus();
    await expect(radio).not.toBeChecked();
    const option = radio.closest('label');
    if (!option) throw new Error('No option');
    await expect(getComputedStyle(option).outlineColor).toBe(tokenColor('--focus-ring-color'));
    await expect(getComputedStyle(option).outlineOffset).toBe('2px');
  },
};

/** A dark region inside the page takes its own tokens: the fill is white and the label is near-black. */
export const Dark: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      style={{ display: 'grid', gap: 24, padding: 24, background: 'var(--color-canvas)' }}
    >
      <SegmentedControl {...args} label="Color mode" />
      <SegmentedControl {...args} label="Report cadence" isChanged defaultValue="weekly">
        {FIVE}
      </SegmentedControl>
      <SegmentedControl {...args} label="Plan" isDisabled defaultValue="dark">
        {THREE}
      </SegmentedControl>
    </div>
  ),
};

/** A press and the arrow keys choose an option. A press is transient, so no screenshot can hold it. */
export const Choosing: Story = {
  tags: ['no-visual'],
  args: { defaultValue: undefined, children: THREE },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Dark'));
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'System' })).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Light' })).toBeChecked();
  },
};

/** A room that resizes: narrow stacks the options, wide puts them back in one row. */
function Resizing(): ReactElement {
  const [width, setWidth] = useState(640);
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            setWidth(300);
          }}
        >
          Narrow
        </button>
        <button
          type="button"
          onClick={() => {
            setWidth(640);
          }}
        >
          Wide
        </button>
      </div>
      <div style={{ width }}>
        <SegmentedControl label="Report cadence" defaultValue="weekly">
          {FIVE}
        </SegmentedControl>
      </div>
    </div>
  );
}

export const Resized: Story = {
  tags: ['no-visual'],
  render: () => <Resizing />,
  play: async ({ canvas, userEvent }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Report cadence' });
    await waitFor(() => expect(group).not.toHaveAttribute('data-stacked'));
    await userEvent.click(canvas.getByRole('button', { name: 'Narrow' }));
    await waitFor(() => expect(group).toHaveAttribute('data-stacked'));
    await userEvent.click(canvas.getByRole('button', { name: 'Wide' }));
    await waitFor(() => expect(group).not.toHaveAttribute('data-stacked'));
    // Choosing an option while stacked leaves the arrangement alone.
    await userEvent.click(canvas.getByRole('button', { name: 'Narrow' }));
    await waitFor(() => expect(group).toHaveAttribute('data-stacked'));
    await userEvent.click(canvas.getByText('Monthly'));
    await expect(canvas.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    await expect(group).toHaveAttribute('data-stacked');
  },
};
