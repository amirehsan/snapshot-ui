import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { DataTable, type DataTableColumn } from '../data-table';
import { StatTile } from '../stat-tile';
import { tokenColor } from '../stories/paint';
import { Gauge, type GaugeMark, type GaugeProps } from './Gauge';
import { GAUGE_SIZES } from './geometry';

/** The two utilization marks the consumer draws: best under 10%, and keep it under 30%. */
const UTILIZATION_MARKS: GaugeMark[] = [
  { value: 10, label: 'Best under 10%' },
  { value: 30, label: 'Keep it under 30%' },
];

/** The consumer's credit score bands on 300 to 850: their four edges. */
const SCORE_MARKS: GaugeMark[] = [
  { value: 580, label: 'Fair from 580' },
  { value: 670, label: 'Good from 670' },
  { value: 740, label: 'Very good from 740' },
  { value: 800, label: 'Excellent from 800' },
];

/** Gauges side by side, wrapping on a phone, each at its own height. */
const ROW: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 32 };

/** The surface a gauge sits on most: a card, its marks ringed in the card's own color. */
function Tile({ children, title }: { children: ReactNode; title?: string }): ReactElement {
  return (
    <Card style={{ width: '100%', maxWidth: '48rem' }}>
      {title === undefined ? null : (
        <CardHeader>
          <CardTitle level={3}>{title}</CardTitle>
        </CardHeader>
      )}
      <CardBody>
        <div style={ROW}>{children}</div>
      </CardBody>
    </Card>
  );
}

const meta = {
  title: 'Components/Gauge',
  component: Gauge,
  // Padded, so a card takes the canvas's width and a row of gauges wraps on a phone.
  parameters: { layout: 'padded' },
  args: {
    label: 'Utilization',
    value: 23,
    valueLabel: '23% of your limit',
    figure: '23%',
    marks: UTILIZATION_MARKS,
  },
  render: (args) => (
    <Tile>
      <Gauge {...args} />
    </Tile>
  ),
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first element with this class inside `scope`, or every one of them. */
const part = (scope: ParentNode, name: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};
const parts = (scope: ParentNode, name: string): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>(`.${name}`),
];

/** An svg path, which the stories measure. */
const path = (scope: ParentNode, name: string): SVGPathElement => {
  const element = scope.querySelector<SVGPathElement>(`path.${name}`);
  if (!element) throw new Error(`No path.${name}`);
  return element;
};

/** The first number of a dash array, the dash itself. */
const dashOf = (element: SVGPathElement): number =>
  parseFloat(element.style.strokeDasharray.split(/[ ,]+/)[0] ?? '');

/**
 * Whether the browser's own svg renderer paints anything at a point of a value path, read by drawing the path
 * alone, with its dash and round caps as attributes, to a canvas the size of its box. It answers what a reader
 * sees in each engine, which a geometry query cannot: a zero-length dash is a dot only if the engine draws its caps.
 */
async function paintsAt(element: SVGPathElement, points: readonly [number, number][]): Promise<boolean[]> {
  const svg = element.ownerSVGElement;
  if (!svg) throw new Error('No svg');
  const [, , width = 0, height = 0] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}" ` +
    `width="${String(width)}" height="${String(height)}"><path d="${element.getAttribute('d') ?? ''}" ` +
    `fill="none" stroke="black" stroke-linecap="round" stroke-width="${element.getAttribute('stroke-width') ?? ''}" ` +
    `stroke-dasharray="${element.style.strokeDasharray}" stroke-dashoffset="${element.style.strokeDashoffset}"/></svg>`;
  const image = new Image(width, height);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas');
  context.drawImage(image, 0, 0);
  return points.map(([x, y]) => (context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3] ?? 0) > 0);
}

/** An md utilization ring with its figure and the consumer's two marks, at 10% and 30%. */
export const Default: Story = {};

/** The three sizes as rings: 32px with its text beside it, 96px and 160px with their text under them. */
export const Sizes: Story = {
  render: (args) => (
    <Tile>
      <Gauge {...args} size="sm" figure={undefined} valueLabel="23%" />
      <Gauge {...args} size="md" />
      <Gauge {...args} size="lg" />
    </Tile>
  ),
  play: async ({ canvasElement }) => {
    const dials = parts(canvasElement, 'gauge-dial');
    await expect(dials.map((dial) => Math.round(dial.getBoundingClientRect().width))).toEqual([32, 96, 160]);
    // The sm gauge's text sits beside its dial, the others' under theirs.
    const [small, medium] = parts(canvasElement, 'gauge');
    if (!small || !medium) throw new Error('Two gauges');
    const beside = part(small, 'gauge-text').getBoundingClientRect();
    await expect(beside.left).toBeGreaterThanOrEqual(part(small, 'gauge-dial').getBoundingClientRect().right);
    const under = part(medium, 'gauge-text').getBoundingClientRect();
    await expect(under.top).toBeGreaterThanOrEqual(part(medium, 'gauge-dial').getBoundingClientRect().bottom);
  },
};

/** The three sizes as semicircles, from the inline start over the top to the end. */
export const Semicircle: Story = {
  args: { form: 'semicircle', value: 64, valueLabel: '64% of your budget', figure: '64%', marks: undefined },
  render: (args) => (
    <Tile>
      <Gauge {...args} size="sm" figure={undefined} valueLabel="64%" />
      <Gauge {...args} size="md" />
      <Gauge {...args} size="lg" figureCaption="On track" />
    </Tile>
  ),
};

/** A state that needs a look: the arc in warning, and the words say why. */
export const Warning: Story = {
  args: { tone: 'warning', value: 47, valueLabel: '47% of your limit, above 30%', figure: '47%' },
  play: async ({ canvasElement }) => {
    const root = part(canvasElement, 'gauge');
    await expect(getComputedStyle(path(canvasElement, 'gauge-value')).stroke).toBe(
      tokenColor('--color-warning', root),
    );
  },
};

/**
 * A limit that stopped something: error, only where a payment was declined. Named ErrorTone, as Badge's is,
 * since a story called Error would hide the Error constructor in this file.
 */
export const ErrorTone: Story = {
  name: 'Error',
  args: { tone: 'error', value: 100, valueLabel: 'Limit reached, a payment was declined', figure: '100%' },
  play: async ({ canvasElement }) => {
    const root = part(canvasElement, 'gauge');
    await expect(getComputedStyle(path(canvasElement, 'gauge-value')).stroke).toBe(
      tokenColor('--color-error', root),
    );
  },
};

/** Over the limit a neutral gauge draws warning, the arc stops at the end, and the words say "over". */
export const OverLimit: Story = {
  args: { value: 107, valueLabel: '107% of your limit, over', figure: '107%' },
  play: async ({ canvasElement }) => {
    const root = part(canvasElement, 'gauge');
    await expect(root).toHaveAttribute('data-over');
    await expect(root).toHaveAttribute('data-tone', 'warning');
    await expect(getComputedStyle(path(canvasElement, 'gauge-value')).stroke).toBe(
      tokenColor('--color-warning', root),
    );
  },
};

/** Five marks, the most a gauge draws, each 2px of ink in a ring of the card's own color. */
export const WithMarks: Story = {
  args: {
    size: 'lg',
    value: 62,
    valueLabel: '62% of your savings goal',
    figure: '62%',
    figureCaption: 'Saved',
    marks: [
      { value: 20, label: 'A fifth' },
      { value: 40, label: 'Two fifths' },
      { value: 50, label: 'Halfway' },
      { value: 60, label: 'Three fifths' },
      { value: 80, label: 'Four fifths' },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(parts(canvasElement, 'gauge-mark')).toHaveLength(5);
    const ring = parts(canvasElement, 'gauge-mark-ring')[0];
    if (!ring) throw new Error('No ring');
    await expect(getComputedStyle(ring).stroke).toBe(tokenColor('--color-lifted', ring));
  },
};

/** Each gauge at a share of the range, in both forms: nothing, a dot, 1%, a half, 99% and the whole. */
export const AcrossTheRange: Story = {
  render: () => (
    <Tile>
      {(['ring', 'semicircle'] as const).flatMap((form) =>
        [0, 0.5, 1, 50, 99, 100].map((value) => (
          <Gauge
            key={`${form}-${String(value)}`}
            label={form === 'ring' ? 'Ring' : 'Semicircle'}
            form={form}
            value={value}
            valueLabel={`${String(value)}%`}
            figure={`${String(value)}%`}
          />
        )),
      )}
    </Tile>
  ),
};

/** 32px rings named by aria-label, with only their value text beside them, as a table row holds them. */
export const WithoutLabel: Story = {
  render: () => (
    <Tile>
      <Gauge
        aria-label="Utilization, Everyday Visa"
        size="sm"
        value={23}
        valueLabel="23%"
        marks={UTILIZATION_MARKS}
      />
      <Gauge
        aria-label="Utilization, Travel Mastercard"
        size="sm"
        tone="warning"
        value={47}
        valueLabel="47%, above 30%"
        marks={UTILIZATION_MARKS}
      />
      <Gauge
        aria-label="Utilization, Store card"
        size="sm"
        value={4}
        valueLabel="4%"
        marks={UTILIZATION_MARKS}
      />
    </Tile>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('meter', { name: 'Utilization, Everyday Visa' })).toBeInTheDocument();
    await expect(canvasElement.querySelector('.gauge-label')).toBeNull();
    await expect(canvasElement.querySelector('.gauge-figure')).toBeNull();
  },
};

/** One score card on 300 to 850 with the consumer's four band edges. */
const score = (value: number, caption: string, tone: GaugeProps['tone'] = 'neutral'): ReactElement => (
  <Gauge
    key={value}
    label="Credit score"
    form="semicircle"
    size="lg"
    minValue={300}
    maxValue={850}
    value={value}
    valueLabel={`${String(value)} of 850, ${caption}`}
    figure={String(value)}
    figureCaption={caption}
    tone={tone}
    marks={SCORE_MARKS}
  />
);

/**
 * The consumer's credit score: Very good in ink, and Fair and Poor both warning, told apart by the word under
 * the figure and by where the arc stops between the marks, never by color (owner ruling 2).
 */
export const CreditScore: Story = {
  render: () => (
    <Tile title="Credit score">
      {score(742, 'Very good')}
      {score(640, 'Fair', 'warning')}
      {score(540, 'Poor', 'warning')}
    </Tile>
  ),
  play: async ({ canvas, canvasElement }) => {
    const [good, fair, poor] = canvas.getAllByRole('meter');
    if (!good || !fair || !poor) throw new Error('Three scores');
    await expect(good).toHaveAttribute('aria-valuemin', '300');
    await expect(good).toHaveAttribute('aria-valuenow', '742');
    await expect(good).toHaveAccessibleDescription(
      'Fair from 580. Good from 670. Very good from 740. Excellent from 800.',
    );
    const tones = parts(canvasElement, 'gauge').map((gauge) => gauge.getAttribute('data-tone'));
    await expect(tones).toEqual(['neutral', 'warning', 'warning']);
    // Never error: a low score is not a failure.
    await expect(canvasElement.querySelector("[data-tone='error']")).toBeNull();
  },
};

/** A 32px ring as a StatTile's trend, in its 96 by 32 slot. */
export const InStatTile: Story = {
  tags: ['density'],
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: 24 }}>
      <StatTile
        label="Credit used"
        value="$1,150.00"
        caption="Of $5,000 across your cards"
        trend={
          <Gauge
            aria-label="Credit used, share of your limit"
            size="sm"
            value={23}
            valueLabel="23%"
            marks={UTILIZATION_MARKS}
          />
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const slot = part(canvasElement, 'stat-tile-trend').getBoundingClientRect();
    const gauge = part(canvasElement, 'gauge').getBoundingClientRect();
    await expect(gauge.width).toBeLessThanOrEqual(slot.width + 0.5);
    await expect(gauge.height).toBeLessThanOrEqual(32.5);
  },
};

interface CardRow {
  id: string;
  name: string;
  balance: string;
  used: number;
}

/** Four of the consumer's cards, one over 30%. */
const CARDS: CardRow[] = [
  { id: 'visa', name: 'Everyday Visa ending 4821', balance: '$1,150.00', used: 23 },
  { id: 'master', name: 'Travel Mastercard ending 0937', balance: '$2,350.00', used: 47 },
  { id: 'store', name: 'Store card ending 5512', balance: '$40.00', used: 4 },
  { id: 'amex', name: 'Rewards Amex ending 1009', balance: '$860.00', used: 12 },
];

const CARD_COLUMNS: readonly DataTableColumn<CardRow>[] = [
  { id: 'name', header: 'Card', cell: (card) => card.name, isRowHeader: true },
  {
    id: 'utilization',
    header: 'Utilization',
    // Named with its row, since the column header names the cell; the value text beside it says the share.
    cell: (card) => (
      <Gauge
        aria-label={`Utilization, ${card.name}`}
        size="sm"
        value={card.used}
        valueLabel={card.used > 30 ? `${String(card.used)}%, above 30%` : `${String(card.used)}%`}
        tone={card.used > 30 ? 'warning' : 'neutral'}
        marks={UTILIZATION_MARKS}
      />
    ),
    textValue: (card) => `${String(card.used)}%`,
    listSlot: 'meta',
  },
  { id: 'balance', header: 'Balance', cell: (card) => card.balance, align: 'end', listSlot: 'end' },
];

/** A 32px ring per row of a DataTable, with marks at 10% and 30%, in every density. */
export const InDataTable: Story = {
  tags: ['density'],
  render: () => (
    <div style={{ width: '100%' }}>
      <DataTable aria-label="Cards" items={CARDS} columns={CARD_COLUMNS} getKey={(card) => card.id} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('meter')).toHaveLength(4);
    await expect(
      canvas.getByRole('meter', { name: 'Utilization, Travel Mastercard ending 0937' }),
    ).toHaveAttribute('aria-valuetext', '47%, above 30%');
    // The ring fits its row in every density: no row grows for it.
    for (const dial of parts(canvasElement, 'gauge-dial')) {
      const row = dial.closest('[role="row"], .data-table-item');
      if (!row) throw new Error('No row');
      await expect(dial.getBoundingClientRect().height).toBeLessThanOrEqual(
        row.getBoundingClientRect().height,
      );
    }
  },
};

/** The widest figure each size holds: four characters at md, six at lg. */
export const LongestFigure: Story = {
  render: () => (
    <Tile>
      <Gauge
        label="Utilization"
        value={100}
        valueLabel="100% of your limit"
        figure="100%"
        figureCaption="At the limit"
      />
      <Gauge
        label="Saved"
        size="lg"
        form="semicircle"
        value={41}
        valueLabel="$12,300 of $30,000 saved"
        figure="$12.3K"
        figureCaption="Of $30K"
      />
    </Tile>
  ),
  play: async ({ canvasElement }) => {
    // Each figure stays inside its dial's inner width, the box less two strokes.
    for (const gauge of parts(canvasElement, 'gauge')) {
      const size = gauge.getAttribute('data-size') === 'lg' ? 'lg' : 'md';
      const { box, stroke } = GAUGE_SIZES[size];
      const dial = part(gauge, 'gauge-dial').getBoundingClientRect();
      const figure = part(gauge, 'gauge-figure-value').getBoundingClientRect();
      const inner = (dial.width * (box - 2 * stroke)) / box;
      await expect(figure.width).toBeLessThanOrEqual(inner + 0.5);
    }
  },
};

/** On a Persian page: the ring runs counter-clockwise and the semicircle fills from the right; the text does not mirror. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: '100%' }}>
        <Tile>
          <Gauge
            label="میزان استفاده"
            value={60}
            valueLabel="۶۰٪ از سقف اعتبار"
            figure="۶۰٪"
            marks={UTILIZATION_MARKS}
          />
          <Gauge
            label="بودجه"
            form="semicircle"
            size="lg"
            value={60}
            valueLabel="۶۰٪ از بودجه ماه"
            figure="۶۰٪"
            figureCaption="طبق برنامه"
          />
        </Tile>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    for (const svg of parts(canvasElement, 'gauge-svg'))
      await expect(getComputedStyle(svg).scale).toBe('-1 1');
  },
};

/**
 * The arc's length, caps included, is exactly the share (risk R3): for each form at 25%, 50% and the whole, the
 * value path is the track's path, and its dash plus one stroke is the share of the length the browser measures.
 * A share under the stroke draws a dot in this engine, and a share of 0 draws no path. In three engines.
 */
export const ArcLength: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Tile>
      {(['ring', 'semicircle'] as const).flatMap((form) =>
        [0, 0.5, 25, 50, 100].map((value) => (
          <Gauge
            key={`${form}-${String(value)}`}
            label={`${form} at ${String(value)}%`}
            form={form}
            value={value}
            valueLabel={`${String(value)}%`}
            data-testid={`${form}-${String(value)}`}
          />
        )),
      )}
    </Tile>
  ),
  play: async ({ canvasElement }) => {
    const gauge = (id: string): HTMLElement => {
      const element = canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (!element) throw new Error(`No ${id}`);
      return element;
    };
    for (const form of ['ring', 'semicircle'] as const) {
      // Nothing at 0: no path, so no dot.
      await expect(gauge(`${form}-0`).querySelector('.gauge-value')).toBeNull();
      for (const value of [25, 50, 100]) {
        const share = value / 100;
        const scope = gauge(`${form}-${String(value)}`);
        const track = path(scope, 'gauge-track');
        const arc = path(scope, 'gauge-value');
        const length = track.getTotalLength();
        const moment = `${form} at ${String(value)}%`;
        await expect(Math.abs(arc.getTotalLength() - length), moment).toBeLessThan(1);
        const stroke = Number(arc.getAttribute('stroke-width'));
        // A whole ring is one dash of its length, solid; every other arc is a dash a stroke shorter than its share.
        const drawn = form === 'ring' && share === 1 ? dashOf(arc) : dashOf(arc) + stroke;
        await expect(Math.abs(drawn - share * length), moment).toBeLessThan(1);
        await expect(arc.style.strokeDashoffset, moment).toBe(String(-stroke / 2));
      }
      // The full value closes a ring at its top, with no notch between two caps, and covers a semicircle's track
      // to both its ends.
      // At the ring's top, near its outer and inner edges, where two meeting caps would leave their notches.
      const [start, end] =
        form === 'ring'
          ? [
              [48, 1],
              [48, 7],
            ]
          : [
              [2, 47],
              [94, 47],
            ];
      await expect(
        await paintsAt(path(gauge(`${form}-100`), 'gauge-value'), [start, end] as [number, number][]),
        `${form} whole`,
      ).toEqual([true, true]);
      // Half a percent is under the 8px stroke: a dot of the stroke's width at the start, and nothing further on.
      const dot = path(gauge(`${form}-0.5`), 'gauge-value');
      await expect(dashOf(dot)).toBe(0);
      const [atDot, beyond] =
        form === 'ring'
          ? [
              [52, 4],
              [92, 48],
            ]
          : [
              [4, 44],
              [48, 4],
            ];
      await expect(await paintsAt(dot, [atDot, beyond] as [number, number][]), `${form} dot`).toEqual([
        true,
        false,
      ]);
    }
  },
};

/** The role on the dial, its four values on a range that does not start at 0, and clamping at both ends. */
export const Values: Story = {
  tags: ['no-visual'],
  render: () => (
    <Tile>
      {score(742, 'Very good')}
      <Gauge label="Below" minValue={300} maxValue={850} value={250} valueLabel="No score" />
      <Gauge label="Over" value={107} valueLabel="107% of your limit, over" />
    </Tile>
  ),
  play: async ({ canvas }) => {
    const [scored, below, over] = canvas.getAllByRole('meter');
    if (!scored || !below || !over) throw new Error('Three gauges');
    await expect(scored).toHaveClass('gauge-dial');
    await expect(scored).toHaveAccessibleName('Credit score');
    for (const [name, value] of [
      ['aria-valuemin', '300'],
      ['aria-valuemax', '850'],
      ['aria-valuenow', '742'],
      ['aria-valuetext', '742 of 850, Very good'],
    ] as const)
      await expect(scored).toHaveAttribute(name, value);
    await expect(below).toHaveAttribute('aria-valuenow', '300');
    await expect(below.querySelector('.gauge-value')).toBeNull();
    await expect(over).toHaveAttribute('aria-valuenow', '100');
  },
};

/**
 * A semicircle's figure sits on its chord: the figure's baseline within 1px of the arc's ends, at half the box,
 * and the caption under it, between the arc's ends. Its baseline comes from a strut whose foot is its baseline,
 * which each engine synthesizes, so it runs in three.
 */
export const SemicircleFigure: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Tile>
      {score(742, 'Very good')}
      <Gauge
        label="Spent"
        form="semicircle"
        value={64}
        valueLabel="64% of your budget"
        figure="64%"
        figureCaption="On track"
      />
    </Tile>
  ),
  play: async ({ canvasElement }) => {
    for (const gauge of parts(canvasElement, 'gauge')) {
      const svg = part(gauge, 'gauge-svg').getBoundingClientRect();
      // The chord is half the box down: one user unit is one pixel scaled by the drawn width.
      const chord = svg.top + svg.width / 2;
      const value = part(gauge, 'gauge-figure-value');
      // An empty inline-block's foot is the line's baseline.
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;';
      value.append(probe);
      const baseline = probe.getBoundingClientRect().bottom;
      probe.remove();
      await expect(Math.abs(baseline - chord)).toBeLessThanOrEqual(1);
      const caption = part(gauge, 'gauge-figure-caption').getBoundingClientRect();
      await expect(caption.top).toBeGreaterThanOrEqual(chord - 0.5);
      const band =
        (svg.width * GAUGE_SIZES[gauge.getAttribute('data-size') === 'lg' ? 'lg' : 'md'].stroke) /
        GAUGE_SIZES[gauge.getAttribute('data-size') === 'lg' ? 'lg' : 'md'].box;
      await expect(caption.left).toBeGreaterThanOrEqual(svg.left + band - 0.5);
      await expect(caption.right).toBeLessThanOrEqual(svg.right - band + 0.5);
      // The dial holds the caption: nothing of it hangs into the text under the dial.
      await expect(caption.bottom).toBeLessThanOrEqual(
        part(gauge, 'gauge-dial').getBoundingClientRect().bottom + 0.5,
      );
    }
  },
};

/** A gauge whose value the app changes, to read its motion. */
function Paying(): ReactElement {
  const [used, setUsed] = useState(47);
  return (
    <Tile>
      <Gauge
        label="Utilization"
        value={used}
        valueLabel={`${String(used)}% of your limit`}
        figure={`${String(used)}%`}
        tone={used > 30 ? 'warning' : 'neutral'}
      />
      <Button
        variant="secondary"
        onPress={() => {
          setUsed(23);
        }}
      >
        Pay down
      </Button>
    </Tile>
  );
}

/**
 * No sweep on first appearance, 200ms when the value changes, none under reduced motion (owner ruling 6). A
 * transition never runs on the first style, so a gauge drawn on the server or mounted with its value is still;
 * a change moves the dash and the color together.
 */
export const Motion: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Paying />,
  play: async ({ canvas, canvasElement }) => {
    const arc = path(canvasElement, 'gauge-value');
    await expect(arc.getAnimations()).toEqual([]);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    await userEvent.click(canvas.getByRole('button', { name: 'Pay down' }));
    await waitFor(() => expect(canvas.getByRole('meter')).toHaveAttribute('aria-valuenow', '23'));
    const moving = arc
      .getAnimations()
      .filter((animation): animation is CSSTransition => animation instanceof CSSTransition);
    if (reduced) {
      await expect(moving).toEqual([]);
    } else {
      await expect(moving.map((transition) => transition.transitionProperty)).toContain('stroke-dasharray');
      for (const transition of moving)
        await expect(transition.effect?.getComputedTiming().duration).toBe(200);
    }
    // The reduced-motion rule ships: the stylesheet stops the arc there.
    const rules = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules];
      } catch {
        return [];
      }
    });
    const flatten = (list: CSSRule[]): CSSRule[] =>
      list.flatMap((rule) =>
        rule instanceof CSSGroupingRule ? [rule, ...flatten([...rule.cssRules])] : [rule],
      );
    const stops = flatten(rules).some(
      (rule) =>
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('prefers-reduced-motion: reduce') &&
        [...rule.cssRules].some(
          (inner) =>
            inner instanceof CSSStyleRule &&
            inner.selectorText === '.gauge-value' &&
            inner.style.getPropertyValue('transition').startsWith('none'),
        ),
    );
    await expect(stops).toBe(true);
  },
};
