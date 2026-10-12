import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Switch } from './Switch';

/** The color a token paints in the theme around `scope`, read by painting it. */
function tokenColor(name: string, scope: Element = document.body): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  scope.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

/** The row, the track and the thumb of the first switch drawn inside `scope`. */
function parts(scope: Element): { row: Element; track: Element; thumb: Element } {
  const row = scope.querySelector('.switch');
  const track = scope.querySelector('.switch-track');
  const thumb = scope.querySelector('.switch-thumb');
  if (!row || !track || !thumb) throw new Error('No switch drawn');
  return { row, track, thumb };
}

/** The gaps, in px, between the thumb and the start, the end, the top and the bottom of the track. */
function thumbGaps(scope: Element): { start: number; end: number; top: number; bottom: number } {
  const { track, thumb } = parts(scope);
  const outer = track.getBoundingClientRect();
  const inner = thumb.getBoundingClientRect();
  return {
    start: inner.left - outer.left,
    end: outer.right - inner.right,
    top: inner.top - outer.top,
    bottom: outer.bottom - inner.bottom,
  };
}

const fill = (element: Element): string => getComputedStyle(element).backgroundColor;

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { children: 'Weekly digest' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Off: the boundary-colored track, a raised thumb one gap from the start, the same gap above and below. */
export const Off: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('switch', { name: 'Weekly digest' })).not.toBeChecked();
    const { track, thumb } = parts(canvasElement);
    await expect(fill(track)).toBe(tokenColor('--color-boundary'));
    await expect(fill(thumb)).toBe(tokenColor('--color-raised'));
    const gaps = thumbGaps(canvasElement);
    await expect(gaps.start).toBeCloseTo(3, 1);
    await expect(gaps.top).toBeCloseTo(3, 1);
    await expect(gaps.bottom).toBeCloseTo(3, 1);
  },
};

/** On: an ink track and a canvas thumb, one gap from the end, the same gap as it had at the start. */
export const On: Story = {
  args: { defaultSelected: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('switch', { name: 'Weekly digest' })).toBeChecked();
    const { track, thumb } = parts(canvasElement);
    await expect(fill(track)).toBe(tokenColor('--color-ink'));
    await expect(fill(thumb)).toBe(tokenColor('--color-canvas'));
    const gaps = thumbGaps(canvasElement);
    await expect(gaps.end).toBeCloseTo(3, 1);
    await expect(gaps.top).toBeCloseTo(3, 1);
    await expect(gaps.bottom).toBeCloseTo(3, 1);
  },
};

/** The hint is the switch's accessible description, and lines up under the label text. */
export const WithDescription: Story = {
  args: { description: 'Every Tuesday morning.', defaultSelected: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('switch', { name: 'Weekly digest' })).toHaveAccessibleDescription(
      'Every Tuesday morning.',
    );
  },
};

/** Disabled and off: a recessed track, a faint edge and a taupe thumb. */
export const DisabledOff: Story = {
  args: { isDisabled: true },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(control).toBeDisabled();
    const { row, track, thumb } = parts(canvasElement);
    await expect(fill(track)).toBe(tokenColor('--color-disabled'));
    await expect(fill(thumb)).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(track).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(row).cursor).toBe('not-allowed');
  },
};

/** Disabled and on: a filled taupe track and a recessed thumb, so on and off differ without the thumb position. */
export const DisabledOn: Story = {
  args: { isDisabled: true, defaultSelected: true },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(control).toBeDisabled();
    await expect(control).toBeChecked();
    const { track, thumb } = parts(canvasElement);
    await expect(fill(track)).toBe(tokenColor('--color-taupe'));
    await expect(fill(thumb)).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(track).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  },
};

/** Read-only looks like an enabled switch and cannot be changed. */
export const ReadOnly: Story = {
  args: { isReadOnly: true, defaultSelected: true, description: 'Managed by your admin.' },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(control).toHaveAttribute('aria-readonly', 'true');
    await expect(fill(parts(canvasElement).track)).toBe(tokenColor('--color-ink'));
  },
};

/** `isChanged` shows the clay chip beside the label and the light signal orange ring, and the chip is read with the switch. */
export const Changed: Story = {
  args: { isChanged: true, defaultSelected: true, description: 'Every Tuesday morning.' },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(canvas.getByText('Changed')).toBeVisible();
    const ring = getComputedStyle(parts(canvasElement).track, '::before');
    await expect(ring.borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(ring.borderTopWidth).toBe('2px');
    await expect(control).toHaveAccessibleDescription('Every Tuesday morning. Changed');
  },
};

/** Keyboard focus draws the ring around the track, outside it. */
export const Focused: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('switch')).toHaveFocus();
    const { track } = parts(canvasElement);
    const style = getComputedStyle(track);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('2px');
    await expect(style.outlineOffset).toBe('2px');
    await expect(style.outlineColor).toBe(tokenColor('--focus-ring-color'));
  },
};

/** A changed switch that has focus: the focus ring steps out past the changed ring, so both show. */
export const ChangedAndFocused: Story = {
  args: { isChanged: true },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('switch')).toHaveFocus();
    const { track } = parts(canvasElement);
    // The ring is outside the track, so an off track keeps its boundary fill.
    await expect(fill(track)).toBe(tokenColor('--color-boundary'));
    await expect(getComputedStyle(track).outlineStyle).toBe('solid');
    await expect(getComputedStyle(track).outlineOffset).toBe('4px');
    await expect(getComputedStyle(track, '::before').borderTopColor).toBe(tokenColor('--color-signal-light'));
  },
};

/** A long label wraps beside the track and the chip drops under it, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    children: 'Email me a short summary of every comment on my posts, once a week, on Tuesday mornings',
    description: 'You can turn this off at any time from the link at the bottom of each email.',
    isChanged: true,
    defaultSelected: true,
  },
};

/** A dark scope on the page takes its own tokens: the on track is white, the thumbs are dark. */
export const InDarkScope: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      data-testid="dark-scope"
      style={{
        display: 'grid',
        gap: 16,
        padding: 24,
        borderRadius: 24,
        background: 'var(--color-lifted)',
        color: 'var(--color-ink)',
      }}
    >
      <Switch {...args}>Off</Switch>
      <Switch {...args} defaultSelected>
        On
      </Switch>
      <Switch {...args} isDisabled>
        Disabled and off
      </Switch>
      <Switch {...args} isDisabled defaultSelected>
        Disabled and on
      </Switch>
      <Switch {...args} isChanged defaultSelected>
        Changed
      </Switch>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const scope = canvasElement.querySelector('[data-testid="dark-scope"]');
    if (!scope) throw new Error('No dark scope');
    const on = canvas.getByRole('switch', { name: 'On' }).closest('.field');
    const off = canvas.getByRole('switch', { name: 'Off' }).closest('.field');
    if (!on || !off) throw new Error('No switch drawn');
    await expect(fill(parts(on).track)).toBe(tokenColor('--color-ink', scope));
    await expect(fill(parts(on).track)).toBe('rgb(255, 255, 255)');
    await expect(fill(parts(off).track)).toBe(tokenColor('--color-boundary', scope));
  },
};

/** The thumb travels the same gap each way, and a press or a key flips the switch. */
export const Toggling: Story = {
  tags: ['no-visual'],
  play: async ({ canvas, canvasElement, userEvent }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(thumbGaps(canvasElement).start).toBeCloseTo(3, 1);
    await userEvent.click(canvas.getByText('Weekly digest'));
    await expect(control).toBeChecked();
    // The thumb takes 160ms to settle.
    await waitFor(() => expect(thumbGaps(canvasElement).end).toBeCloseTo(3, 1));
    await userEvent.keyboard(' ');
    await expect(control).not.toBeChecked();
    await waitFor(() => expect(thumbGaps(canvasElement).start).toBeCloseTo(3, 1));
  },
};

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
} as const;

/** The stylesheet also serves markup without React Aria: a label that holds a checkbox with the switch role. */
export const PlainHtml: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div data-testid="plain-switch">
        <label className="switch">
          <input type="checkbox" role="switch" style={VISUALLY_HIDDEN} />
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          Weekly digest
        </label>
      </div>
      <div data-testid="plain-disabled">
        <label className="switch">
          <input type="checkbox" role="switch" style={VISUALLY_HIDDEN} disabled defaultChecked />
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          Security alerts
        </label>
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const plain = canvasElement.querySelector('[data-testid="plain-switch"]');
    const disabled = canvasElement.querySelector('[data-testid="plain-disabled"]');
    if (!plain || !disabled) throw new Error('No switch drawn');
    await expect(fill(parts(plain).track)).toBe(tokenColor('--color-boundary'));
    await userEvent.tab();
    await expect(canvas.getByRole('switch', { name: 'Weekly digest' })).toHaveFocus();
    await expect(getComputedStyle(parts(plain).track).outlineStyle).toBe('solid');
    await userEvent.keyboard(' ');
    // The track takes 160ms to settle on its new fill. The color is read outside waitFor, which
    // runs again on every change to the page, and reading a token paints a probe into it.
    const ink = tokenColor('--color-ink');
    await waitFor(() => expect(fill(parts(plain).track)).toBe(ink));
    await expect(fill(parts(disabled).track)).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(parts(disabled).row).cursor).toBe('not-allowed');
  },
};
