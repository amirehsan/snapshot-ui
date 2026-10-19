import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Card, CardBody } from '../card';
import { nestedCardPixels } from '../stories/corner';
import { paint, tokenColor } from '../stories/paint';
import { StatTile } from './StatTile';

/** Each tile fills its column up to 24rem: 318px of content at 1280, over the 18rem the trend moves at. */
const TILE = { width: '100%', maxWidth: '24rem' } as const;

/** A small drawing for the trend slot, 96 by 32, hidden: the Sparkline arrives with the charts package. */
const Trend = (): ReactElement => (
  <svg
    aria-hidden="true"
    width="96"
    height="32"
    viewBox="0 0 96 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', color: 'var(--color-slate)' }}
  >
    <polyline points="2,26 14,22 26,24 38,16 50,18 62,10 74,13 86,6 94,4" />
  </svg>
);

const meta = {
  title: 'Components/StatTile',
  component: StatTile,
  // Padded, not centered: a tile is a size container and takes no width from its content, so it needs a block
  // to fill. Centered, the canvas shrinks to its content and every tile to its padding, its intrinsic width 0.
  parameters: { layout: 'padded' },
  args: {
    label: 'Spending',
    value: '$1,284.50',
    change: { direction: 'up', label: 'Up 12% from last month' },
    caption: 'Across all accounts',
    style: TILE,
  },
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The element with this class inside the canvas. */
const part = (canvasElement: HTMLElement, name: string): HTMLElement => {
  const element = canvasElement.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** Slate capitals over a 32px figure, a slate arrow and sentence, and a slate caption. */
export const Default: Story = { tags: ['density'] };

/** Neutral by default; gain only for money that arrived; warning only for a state that needs a look. */
export const Tones: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
        gap: 24,
        width: '100%',
        maxWidth: '76rem',
      }}
    >
      <StatTile
        style={TILE}
        label="Spending"
        value="$1,284.50"
        change={{ direction: 'up', label: 'Up 12% from last month' }}
        caption="Across all accounts"
      />
      <StatTile
        style={TILE}
        label="Income"
        value="$5,420.00"
        change={{ direction: 'up', label: 'Up $420 from last month', tone: 'gain' }}
        caption="Paid into checking"
      />
      <StatTile
        style={TILE}
        label="Savings"
        value="$12,000.00"
        change={{ direction: 'flat', label: 'No change in 3 weeks', tone: 'warning' }}
        caption="Emergency fund"
      />
    </div>
  ),
};

/** The trend sits at the inline end of the value's row. */
export const WithTrend: Story = { tags: ['density'], args: { trend: <Trend /> } };

/** At 18rem the tile has 222px of content, under the threshold, so the trend moves under the caption. */
export const NarrowTrend: Story = {
  args: { trend: <Trend />, style: { width: '18rem' } },
  play: async ({ canvasElement }) => {
    const trend = part(canvasElement, 'stat-tile-trend').getBoundingClientRect();
    const caption = part(canvasElement, 'stat-tile-caption').getBoundingClientRect();
    await expect(trend.top).toBeGreaterThanOrEqual(caption.bottom);
  },
};

/** The whole tile is one link. */
export const Linked: Story = { args: { href: '#spending' } };

/** The token ring sits outside the tile. */
export const LinkedKeyboardFocus: Story = {
  args: { href: '#spending' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const link = canvas.getByRole('link');
    await expect(link).toHaveFocus();
    const style = getComputedStyle(link);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor('--color-ink'));
    await expect(parseFloat(style.outlineOffset)).toBeGreaterThan(0);
  },
};

/** In a card, the tile's corner is concentric with the card's and it takes the frame edge, as a card in a card does. */
export const InCard: Story = {
  render: (args) => (
    <Card style={{ width: '100%', maxWidth: '30rem' }}>
      <CardBody>
        <StatTile {...args} style={{ width: '100%' }} />
      </CardBody>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const tile = part(canvasElement, 'stat-tile');
    await expect(parseFloat(getComputedStyle(tile).borderTopLeftRadius)).toBe(nestedCardPixels());
  },
};

/**
 * Right to left, the trend sits at the left end of the value's row, and the figure still reads left to right.
 * At 375 the tile has 277px of content, under the threshold, so the trend is under the caption at the row's
 * start, the right.
 */
export const RightToLeft: Story = {
  args: { value: '+$1,980.00', trend: <Trend /> },
  render: (args) => (
    <div dir="rtl" style={{ width: '100%' }}>
      <StatTile {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const value = part(canvasElement, 'stat-tile-value');
    await expect(value).toHaveTextContent('+$1,980.00');
    await expect(getComputedStyle(value).direction).toBe('ltr');
    const trend = part(canvasElement, 'stat-tile-trend').getBoundingClientRect();
    const box = value.getBoundingClientRect();
    const caption = part(canvasElement, 'stat-tile-caption').getBoundingClientRect();
    // The tile's content width decides the layout, so it is measured, not read back from where the trend went.
    const body = part(canvasElement, 'stat-tile-body').getBoundingClientRect();
    if (body.width >= 18 * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
      await expect(trend.right).toBeLessThan(box.left);
      await expect(trend.top).toBeLessThan(caption.top);
    } else {
      await expect(trend.top).toBeGreaterThanOrEqual(caption.bottom);
      await expect(trend.right).toBeCloseTo(box.right, 0);
    }
  },
};

/** Under a hover pointer a linked tile takes the 5% ink wash over Lifted. */
export const LinkedHover: Story = {
  tags: ['no-visual'],
  args: { href: '#spending' },
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole('link');
    await userEvent.hover(link);
    await expect(getComputedStyle(link).backgroundColor).toBe(
      paint('color-mix(in srgb, var(--color-ink) 5%, var(--color-lifted))', link),
    );
  },
};

/** The page scrolls sideways by this many px: 0 when everything fits the screen. */
const sideways = (): number => document.documentElement.scrollWidth - document.documentElement.clientWidth;

/**
 * Three tiles placed straight in a wrapping flex row, as 0.6.1 fixed it: each is the 16rem its flex basis names,
 * with its narrow layout and its figure whole, never its padding wide, though its intrinsic width is 0 (spec
 * correction 69). In a row too narrow for one, a tile shrinks from that basis rather than push the page.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-inset)' }}>
      <StatTile {...args} style={undefined} />
      <StatTile {...args} label="Income" style={undefined} />
      <StatTile {...args} label="Saved" style={undefined} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const tiles = [...canvasElement.querySelectorAll('.stat-tile')];
    await expect(tiles).toHaveLength(3);
    for (const tile of tiles) await expect(tile.getBoundingClientRect().width).toBe(16 * 16);
    // The figure is never broken: one line.
    const value = part(canvasElement, 'stat-tile-value');
    await expect(value.getBoundingClientRect().height).toBeLessThan(
      parseFloat(getComputedStyle(value).lineHeight) * 1.5,
    );
  },
};

/** A screen 320px wide, the narrowest the consumer supports, for the play that looks for sideways scroll. */
const NARROW = {
  globals: { viewport: { value: 'narrow' } },
  parameters: {
    viewport: { options: { narrow: { name: 'Narrow phone', styles: { width: '320px', height: '640px' } } } },
  },
} as const;

/**
 * On a 320px phone a tile takes its width from its holder, never from a stand-in (spec corrections 34 and 63): in
 * a `flex: 1` wrapper, in a `1fr` grid and two up in a `1fr 1fr` grid, each in a wrapper as an app's section is,
 * the page never scrolls sideways, and each tile fills its holder, in every shape and density. A stand-in of 16rem
 * made two tiles 512px wide in a 288px column. A figure is never broken, so one wider than its tile still runs
 * past it: two up, each figure is short.
 */
export const OnANarrowPhone: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: NARROW.globals,
  parameters: { ...NARROW.parameters, layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-wrapper="flex" style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <StatTile {...args} style={undefined} />
        </div>
      </div>
      <div data-wrapper="grid" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div>
          <StatTile {...args} style={undefined} />
        </div>
      </div>
      <div
        data-wrapper="two-up"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-part)' }}
      >
        {/* Two up at 320px a tile holds about 74px of content: a figure of three characters, as an app sizes it. */}
        <div>
          <StatTile {...args} label="Income" value="$84" change={undefined} style={undefined} />
        </div>
        <div>
          <StatTile {...args} label="Saved" value="$62" change={undefined} style={undefined} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    const root = document.documentElement;
    const { shape, density } = root.dataset;
    try {
      for (const [nextShape, nextDensity] of [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
        ['soft', 'comfortable'],
        ['square', 'comfortable'],
      ] as const) {
        root.dataset.shape = nextShape;
        root.dataset.density = nextDensity;
        await waitFor(() => expect(sideways()).toBeLessThanOrEqual(0), { timeout: 5000 });
        const tiles = [...canvasElement.querySelectorAll<HTMLElement>('.stat-tile')];
        await expect(tiles).toHaveLength(4);
        for (const tile of tiles) {
          const holder = tile.parentElement?.getBoundingClientRect();
          if (!holder) throw new Error('No holder');
          const box = tile.getBoundingClientRect();
          // Inside the page, and filling its holder: never collapsed to its padding.
          await expect(box.right).toBeLessThanOrEqual(root.clientWidth);
          await expect(box.width).toBeGreaterThanOrEqual(holder.width - 1);
        }
      }
    } finally {
      root.dataset.shape = shape ?? 'rounded';
      root.dataset.density = density ?? 'comfortable';
    }
  },
};
