import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentType, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { CLEAR_OF_FOOT } from '../stories/corner';
import { focusOn } from '../stories/focus';
import { pressRealKeys } from '../stories/keys';
import { tokenColor, tokenPixels } from '../stories/paint';
import { PAD_POSITIONS, padMove, type PadKey } from './moves';
import { PositionPad, type PadPosition, type PositionPadBaseProps } from './PositionPad';

const meta = {
  title: 'Components/PositionPad',
  // The props are a union, since the pad needs a name, and Storybook cannot narrow a union.
  component: PositionPad as ComponentType<PositionPadBaseProps>,
  args: { label: 'Text position', defaultValue: 'center' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(36rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<PositionPadBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five seconds, where a busy runner is slow. */
const SLOW = { timeout: 5000 };

const KEYS: PadKey[] = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** The native radio of a position in `pad`. */
const radioOf = (pad: ParentNode, position: PadPosition): HTMLInputElement =>
  find(pad, `input[value="${position}"]`) as HTMLInputElement;

/** The value of the checked radio in `pad`, or null. */
const checkedIn = (pad: ParentNode): string | null =>
  pad.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.value ?? null;

/**
 * Listens on the document for a focusout that leaves focus on nothing while focus was inside `scope`, which is
 * focus falling to the body (lesson 10); `stop` takes the listener off and returns how many there were.
 */
function watchLostFocus(scope: Element): () => number {
  let lost = 0;
  const onFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget === null && event.target instanceof Node && scope.contains(event.target))
      lost += 1;
  };
  document.addEventListener('focusout', onFocusOut, true);
  return () => {
    document.removeEventListener('focusout', onFocusOut, true);
    return lost;
  };
}

/** Each shape and density a play measures in, put back after. */
async function inEachLook(check: (look: string) => Promise<void>): Promise<void> {
  const root = document.documentElement;
  const { shape, density } = root.dataset;
  try {
    for (const [nextShape, nextDensity] of [
      ['rounded', 'comfortable'],
      ['rounded', 'compact'],
      ['soft', 'comfortable'],
      ['soft', 'compact'],
      ['square', 'comfortable'],
      ['square', 'compact'],
    ] as const) {
      root.dataset.shape = nextShape;
      root.dataset.density = nextDensity;
      await check(`${nextShape} ${nextDensity}`);
    }
  } finally {
    root.dataset.shape = shape ?? 'rounded';
    root.dataset.density = density ?? 'comfortable';
  }
}

/**
 * "Text position" with the center chosen: nine 6px slate dots in a Raised track with the boundary edge, the
 * chosen cell an ink circle with an 8px canvas dot.
 */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Text position' });
    const track = find(group, '.position-pad-track');
    await expect(getComputedStyle(track).borderTopColor).toBe(tokenColor('--color-boundary'));
    await expect(getComputedStyle(track).backgroundColor).toBe(tokenColor('--color-raised'));
    const chosen = find(group, '[data-position="center"]');
    await expect(getComputedStyle(chosen).backgroundColor).toBe(tokenColor('--color-ink'));
    const dot = find(chosen, '.position-pad-dot');
    await expect(dot.getBoundingClientRect().width).toBe(8);
    await expect(getComputedStyle(dot).backgroundColor).toBe(tokenColor('--color-canvas'));
    const other = find(group, '[data-position="top-start"] .position-pad-dot');
    await expect(other.getBoundingClientRect().width).toBe(6);
    await expect(getComputedStyle(other).backgroundColor).toBe(tokenColor('--color-slate'));
  },
};

/** Nine pads, each chosen at one position and labelled by its value. */
export const AllPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-separate)' }}>
      {PAD_POSITIONS.map((position) => (
        <PositionPad key={position} label={position} defaultValue={position} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pads = [...canvasElement.querySelectorAll('.position-pad')];
    await expect(pads).toHaveLength(9);
    for (const [at, pad] of pads.entries()) await expect(checkedIn(pad)).toBe(PAD_POSITIONS[at]);
  },
};

/** The middle row disabled: its dots taupe, the arrows passing over it. */
export const DisabledPositions: Story = {
  args: { defaultValue: 'top-center', disabledPositions: ['center-start', 'center', 'center-end'] },
  play: async ({ canvasElement }) => {
    const dot = find(canvasElement, '[data-position="center"] .position-pad-dot');
    await expect(getComputedStyle(dot).backgroundColor).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(find(canvasElement, '[data-position="center"]')).cursor).toBe(
      'not-allowed',
    );
  },
};

/** Required and empty: the 1.5px error edge on the track and the error line under it. */
export const Invalid: Story = {
  args: { defaultValue: null, isInvalid: true, errorMessage: 'Choose where the text sits.' },
  play: async ({ canvasElement }) => {
    const track = find(canvasElement, '.position-pad-track');
    await expect(getComputedStyle(track).borderTopColor).toBe(tokenColor('--color-error'));
    // An engine may snap the 1.5px edge to a whole device pixel; the size it draws in is set, so nothing moves.
    const size = 3 * Math.max(tokenPixels('--size-target'), tokenPixels('--size-control')) + 12;
    await expect(track.getBoundingClientRect().width).toBe(size);
  },
};

/** Moved from the saved position: the Changed chip and the 1.5px light signal orange edge, the track's size unmoved. */
export const Changed: Story = {
  args: { defaultValue: 'bottom-end', isChanged: true },
  play: async ({ canvasElement }) => {
    const track = find(canvasElement, '.position-pad-track');
    await expect(getComputedStyle(track).borderTopColor).toBe(tokenColor('--color-signal-light'));
    const size = 3 * Math.max(tokenPixels('--size-target'), tokenPixels('--size-control')) + 12;
    await expect(track.getBoundingClientRect().width).toBe(size);
    await expect(track.getBoundingClientRect().height).toBe(size);
  },
};

/** A disabled pad: the disabled fill, an ink 15% edge, taupe dots, the chosen cell a taupe circle with a canvas dot. */
export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    const track = find(canvasElement, '.position-pad-track');
    await expect(getComputedStyle(track).backgroundColor).toBe(tokenColor('--color-disabled'));
    const chosen = find(canvasElement, '[data-position="center"]');
    await expect(getComputedStyle(chosen).backgroundColor).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(find(chosen, '.position-pad-dot')).backgroundColor).toBe(
      tokenColor('--color-canvas'),
    );
    const dot = find(canvasElement, '[data-position="top-start"] .position-pad-dot');
    await expect(getComputedStyle(dot).backgroundColor).toBe(tokenColor('--color-taupe'));
  },
};

/** A pad at a card's foot, moved out of its corner curve by the corner inset (Nested radii, derived). */
export const InCard: Story = {
  tags: ['density'],
  render: (args) => (
    <Card as="section" aria-label="Banner" style={{ width: '100%', maxWidth: '32rem' }}>
      <CardHeader>
        <CardTitle level={2}>Banner</CardTitle>
      </CardHeader>
      <CardBody>
        <div style={CLEAR_OF_FOOT}>
          <PositionPad {...args} label="Text position" />
        </div>
      </CardBody>
    </Card>
  ),
};

/** Three pads for the key plays: left to right, right to left, and dir="ltr" inside a right-to-left page. */
function ThreePads({ disabled = [] }: { disabled?: PadPosition[] }): ReactElement {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-separate)' }}>
      <PositionPad aria-label="Left to right" defaultValue="center" disabledPositions={disabled} />
      <div dir="rtl">
        <PositionPad aria-label="Right to left" defaultValue="center" disabledPositions={disabled} />
        <div dir="ltr">
          <PositionPad aria-label="Kept left to right" defaultValue="center" disabledPositions={disabled} />
        </div>
      </div>
    </div>
  );
}

/** From each cell, each arrow, in each of the three pads: where the engine's own key lands, and what it chooses. */
async function everyMove(canvasElement: HTMLElement, disabled: PadPosition[]): Promise<void> {
  const canvas = within(canvasElement);
  const off = new Set(disabled.map((position) => PAD_POSITIONS.indexOf(position)));
  for (const [name, isRtl] of [
    ['Left to right', false],
    ['Right to left', true],
    ['Kept left to right', false],
  ] as const) {
    const pad = canvas.getByRole('radiogroup', { name });
    for (const [from, position] of PAD_POSITIONS.entries()) {
      if (off.has(from)) continue;
      for (const key of KEYS) {
        const start = radioOf(pad, position);
        // A click checks the radio as a press does; focus follows it to the cell the keys start from.
        start.click();
        await focusOn(start);
        await waitFor(() => expect(checkedIn(pad)).toBe(position));
        if (!(await pressRealKeys(`{${key}}`))) return;
        const next = padMove(from, key, isRtl, off);
        const lands = PAD_POSITIONS[next ?? from] ?? position;
        await waitFor(() => expect(checkedIn(pad), `${name}: ${position} ${key}`).toBe(lands), SLOW);
        await expect(document.activeElement, `${name}: ${position} ${key} focus`).toBe(radioOf(pad, lands));
      }
    }
  }
}

/**
 * Left and Right through all nine in reading order with wrap, mirrored in right to left and kept under dir="ltr"
 * on a right-to-left page; Up and Down by column, stopping at the edges; the engine's own keys, in three engines.
 */
export const TwoDimensionalKeys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ThreePads />,
  play: async ({ canvasElement }) => {
    await everyMove(canvasElement, []);
  },
};

/** The same with the middle row disabled: the arrows pass over it, and stop where nothing is left that way. */
export const TwoDimensionalKeysDisabled: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ThreePads disabled={['center-start', 'center', 'center-end']} />,
  play: async ({ canvasElement }) => {
    await everyMove(canvasElement, ['center-start', 'center', 'center-end']);
  },
};

const changes = fn();

/**
 * One Arrow Down from top-start checks center-start, not top-center, which the browser's own radio arrows and
 * React Aria's would; onChange is called once.
 */
export const NativeArrowsPrevented: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { defaultValue: 'top-start', onChange: changes },
  play: async ({ canvasElement }) => {
    changes.mockClear();
    const pad = within(canvasElement).getByRole('radiogroup');
    await focusOn(radioOf(pad, 'top-start'));
    if (!(await pressRealKeys('{ArrowDown}'))) return;
    await waitFor(() => expect(checkedIn(pad)).toBe('center-start'), SLOW);
    // The browser's own arrow and React Aria's run after the key's handlers; give them their turn.
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(checkedIn(pad)).toBe('center-start');
    await expect(radioOf(pad, 'center-start')).toHaveFocus();
    await expect(changes).toHaveBeenCalledTimes(1);
    await expect(changes).toHaveBeenCalledWith('center-start');
  },
};

/** Read only: the arrows move focus and choose nothing, and focus never falls to the body. */
export const ReadOnlyMovesFocus: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { isReadOnly: true, onChange: changes },
  play: async ({ canvasElement }) => {
    changes.mockClear();
    const pad = within(canvasElement).getByRole('radiogroup');
    const stop = watchLostFocus(pad);
    try {
      await focusOn(radioOf(pad, 'center'));
      if (!(await pressRealKeys('{ArrowRight}'))) return;
      await waitFor(() => expect(radioOf(pad, 'center-end')).toHaveFocus(), SLOW);
      await pressRealKeys('{ArrowDown}');
      await waitFor(() => expect(radioOf(pad, 'bottom-end')).toHaveFocus(), SLOW);
      await pressRealKeys('{ArrowRight}');
      await waitFor(() => expect(radioOf(pad, 'top-start')).toHaveFocus(), SLOW);
      await expect(checkedIn(pad)).toBe('center');
      await expect(changes).not.toHaveBeenCalled();
      await expect(getComputedStyle(find(pad, '[data-position="top-start"]')).cursor).toBe('default');
    } finally {
      await expect(stop()).toBe(0);
    }
  },
};

/**
 * The server's HTML, not hydrated: a press on a cell checks its radio and draws it ink from the native input
 * alone, and the browser's own arrows move linearly through the nine.
 */
export const BeforeHydration: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <div data-testid="host" />,
  play: async ({ canvasElement }) => {
    const host = within(canvasElement).getByTestId('host');
    host.innerHTML = renderToString(<PositionPad label="Text position" name="place" defaultValue="center" />);
    const center = find(host, '[data-position="center"]');
    await expect(getComputedStyle(center).backgroundColor).toBe(tokenColor('--color-ink'));
    const corner = find(host, '[data-position="top-start"]');
    await userEvent.click(corner);
    await waitFor(() => expect(radioOf(host, 'top-start')).toBeChecked());
    await expect(getComputedStyle(corner).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(center).backgroundColor).not.toBe(tokenColor('--color-ink'));
    await focusOn(radioOf(host, 'top-start'));
    if (!(await pressRealKeys('{ArrowDown}'))) return;
    // The browser's radio arrows run in tree order, so Down goes to the next cell in the row, not the one below.
    await waitFor(() => expect(checkedIn(host)).toBe('top-center'), SLOW);
  },
};

/**
 * Cells max(--size-target, --size-control) square, 2px apart, in a track with 3px and a 1px edge inside its
 * size; each cell's corner the track's less 4px: 20px in Rounded, a circle on a 40px cell, 8px in Soft, 0 in
 * Square; in each shape and density.
 */
export const CellsInTrack: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvasElement }) => {
    const track = find(canvasElement, '.position-pad-track');
    const cells = [...track.querySelectorAll<HTMLElement>('.position-pad-cell')];
    await inEachLook(async (look) => {
      const size = Math.max(tokenPixels('--size-target'), tokenPixels('--size-control'));
      const box = track.getBoundingClientRect();
      await expect(box.width, look).toBeCloseTo(3 * size + 12, 0);
      await expect(box.height, look).toBeCloseTo(3 * size + 12, 0);
      const [first, second, , fourth] = cells.map((cell) => cell.getBoundingClientRect());
      if (!first || !second || !fourth) throw new Error('Nine cells expected');
      await expect(first.width, look).toBeCloseTo(size, 0);
      await expect(first.height, look).toBeCloseTo(size, 0);
      await expect(second.left - first.right, look).toBeCloseTo(2, 0);
      await expect(fourth.top - first.bottom, look).toBeCloseTo(2, 0);
      // 1px of edge and 3px of padding from the track's edge.
      await expect(first.left - box.left, look).toBeCloseTo(4, 0);
      await expect(first.top - box.top, look).toBeCloseTo(4, 0);
      const outer = parseFloat(getComputedStyle(track).borderTopLeftRadius);
      const expected = Math.max(0, outer - 4);
      for (const cell of cells) {
        const corner = parseFloat(getComputedStyle(cell).borderTopLeftRadius);
        await expect(Math.abs(corner - expected), look).toBeLessThanOrEqual(1);
      }
      if (look === 'rounded comfortable') await expect(expected).toBe(20);
      if (look === 'square comfortable') await expect(expected).toBe(0);
    });
  },
};

/**
 * The ring of a cell that is not chosen sits 2px inside its edge, clear of the neighbor 2px away; the chosen
 * cell's ring is canvas, 4px inside.
 */
export const FocusRingInside: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)', justifyItems: 'start' }}>
      <button type="button">Before</button>
      <PositionPad {...args} label="Text position" defaultValue={null} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pad = canvas.getByRole('radiogroup');
    const ringWidth = tokenPixels('--focus-ring-width');
    const first = radioOf(pad, 'top-start');
    const cell = find(pad, '[data-position="top-start"]');
    await focusOn(canvas.getByRole('button', { name: 'Before' }));
    // Tab with nothing chosen lands on the first cell without choosing it.
    if (!(await pressRealKeys('{Tab}'))) return;
    await waitFor(() => expect(first).toHaveFocus(), SLOW);
    await waitFor(() => expect(cell).toHaveAttribute('data-focus-visible'), SLOW);
    await expect(checkedIn(pad)).toBeNull();
    const style = getComputedStyle(cell);
    await expect(style.outlineStyle).toBe('solid');
    await expect(parseFloat(style.outlineWidth)).toBe(ringWidth);
    // The ring's outer edge is the offset plus its width from the cell's edge: 2px inside it.
    await expect(parseFloat(style.outlineOffset) + ringWidth).toBe(-2);
    await expect(style.outlineColor).toBe(tokenColor('--focus-ring-color'));
    await pressRealKeys(' ');
    await waitFor(() => expect(checkedIn(pad)).toBe('top-start'), SLOW);
    const chosen = getComputedStyle(cell);
    await expect(chosen.outlineColor).toBe(tokenColor('--color-canvas'));
    await expect(parseFloat(chosen.outlineOffset) + ringWidth).toBe(-4);
    // The shot of any story shows the pad at rest.
    first.blur();
  },
};
