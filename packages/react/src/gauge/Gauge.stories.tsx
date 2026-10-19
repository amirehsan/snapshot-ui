import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { I18nProvider, type Key } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { DataTable, type DataTableColumn } from '../data-table';
import { StatTile } from '../stat-tile';
import { CLEAR_OF_FOOT } from '../stories/corner';
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
  // Plain numbers in user units: Firefox reads inline dashes back with units and commas, "0px, 276.46px".
  const dasharray = element.style.strokeDasharray
    .split(/[ ,]+/)
    .map((part) => String(parseFloat(part)))
    .join(' ');
  const dashoffset = String(parseFloat(element.style.strokeDashoffset));
  // The caps the stylesheet gives the path: round, or butt for an empty arc.
  const linecap = getComputedStyle(element).strokeLinecap;
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}" ` +
    `width="${String(width)}" height="${String(height)}"><path d="${element.getAttribute('d') ?? ''}" ` +
    `fill="none" stroke="black" stroke-linecap="${linecap}" stroke-width="${element.getAttribute('stroke-width') ?? ''}" ` +
    `stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}"/></svg>`;
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

/**
 * Whether every line of a ring's figure and caption, clipped to its own box, has its four corners inside the
 * ring's inner circle, the box less two strokes across: the text never touches the stroke.
 */
async function expectInsideRing(gauge: HTMLElement): Promise<void> {
  const size = gauge.getAttribute('data-size') === 'lg' ? 'lg' : 'md';
  const { box, stroke } = GAUGE_SIZES[size];
  const svg = part(gauge, 'gauge-svg').getBoundingClientRect();
  const [cx, cy] = [svg.left + svg.width / 2, svg.top + svg.height / 2];
  const radius = (svg.width * (box - 2 * stroke)) / box / 2;
  for (const name of ['gauge-figure-value', 'gauge-figure-caption']) {
    const element = gauge.querySelector(`.${name}`);
    if (!element) continue;
    const frame = element.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
    const range = document.createRange();
    range.selectNodeContents(element);
    let lines = 0;
    for (const line of range.getClientRects()) {
      // The line box: a text run's box is its font's content area, centred in the line, which a tall font makes
      // taller than the line; the line box is the line height about the same centre. A clamped caption lays out
      // lines it clips, so only what its box shows is drawn.
      const middle = (line.top + line.bottom) / 2;
      const [left, right] = [Math.max(line.left, frame.left), Math.min(line.right, frame.right)];
      const [top, bottom] = [
        Math.max(middle - lineHeight / 2, frame.top),
        Math.min(middle + lineHeight / 2, frame.bottom),
      ];
      if (right - left < 0.5 || bottom - top < 0.5) continue;
      lines += 1;
      for (const [x, y] of [
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom],
      ] as const)
        await expect(Math.hypot(x - cx, y - cy), `${size} ${name} corner`).toBeLessThanOrEqual(radius + 0.5);
    }
    await expect(lines, `${size} ${name} drawn`).toBeGreaterThan(0);
  }
}

/** The first color painted behind an element, going up the tree: what shows through a gap in it. */
const fillBehind = (element: Element): string => {
  for (let at: Element | null = element.parentElement; at; at = at.parentElement) {
    const color = getComputedStyle(at).backgroundColor;
    if (!/^(?:transparent|rgba\(0, 0, 0, 0\))$/.test(color)) return color;
  }
  return getComputedStyle(document.body).backgroundColor;
};

/**
 * A dial's svg drawn alone by the engine's own renderer, 8 times its size, over `fill`, with the track blue, the
 * arc green and the marks red, and three pixels read beside a mark: in its gap, on the track past the gap, and on
 * the mark. The mask is the page's, so the gap shows `fill` exactly when the mask cuts it.
 */
async function aroundMark(
  svg: SVGSVGElement,
  fill: string,
  index: number,
): Promise<{ behind: number[]; gap: number[]; track: number[]; mark: number[] }> {
  const scale = 8;
  const [, , width = 0, height = 0] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width * scale));
  clone.setAttribute('height', String(height * scale));
  clone.removeAttribute('class');
  for (const [name, color] of [
    ['gauge-track', 'rgb(0, 0, 255)'],
    ['gauge-value', 'rgb(0, 160, 0)'],
    ['gauge-mark', 'rgb(255, 0, 0)'],
  ] as const) {
    for (const element of clone.querySelectorAll(`.${name}`)) {
      element.setAttribute('stroke', color);
      element.setAttribute('fill', 'none');
      element.setAttribute('stroke-linecap', name === 'gauge-mark' ? 'butt' : 'round');
      if (name === 'gauge-mark') element.setAttribute('stroke-width', '2');
    }
  }
  const image = new Image(width * scale, height * scale);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas');
  context.fillStyle = fill;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  const line = svg.querySelectorAll('.gauge-mark')[index];
  if (!line) throw new Error('No mark');
  const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((name) => Number(line.getAttribute(name)));
  const [mx, my] = [((x1 ?? 0) + (x2 ?? 0)) / 2, ((y1 ?? 0) + (y2 ?? 0)) / 2];
  const length = Math.hypot((x2 ?? 0) - (x1 ?? 0), (y2 ?? 0) - (y1 ?? 0));
  // Across the mark: 2 units from its middle is in the 6-unit gap, past its 2-unit line; 4.5 is on the track.
  const [px, py] = [-((y2 ?? 0) - (y1 ?? 0)) / length, ((x2 ?? 0) - (x1 ?? 0)) / length];
  const at = (x: number, y: number): number[] => [
    ...context.getImageData(Math.floor(x * scale), Math.floor(y * scale), 1, 1).data,
  ];
  return {
    behind: at(0.5, 0.5),
    gap: at(mx + 2 * px, my + 2 * py),
    track: at(mx + 4.5 * px, my + 4.5 * py),
    mark: at(mx, my),
  };
}

/** Two colors within a channel's rounding of each other. */
const sameColor = (a: readonly number[], b: readonly number[]): boolean =>
  a.slice(0, 3).every((channel, index) => Math.abs(channel - (b[index] ?? 0)) <= 3);

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

/** Five marks, the most a gauge draws, each 2px of ink in a 6px gap cut out of the track and the arc. */
export const WithMarks: Story = {
  args: {
    label: 'Savings goal',
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
    await expect(canvasElement.querySelectorAll('mask .gauge-mark-gap')).toHaveLength(5);
    const mask = canvasElement.querySelector('mask');
    await expect(path(canvasElement, 'gauge-track')).toHaveAttribute('mask', `url(#${mask?.id ?? ''})`);
    await expect(getComputedStyle(parts(canvasElement, 'gauge-mark')[0] ?? canvasElement).stroke).toBe(
      tokenColor('--color-ink', canvasElement),
    );
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

/** The thresholds on every row carry no words, which each row would repeat; the page says them once. */
const ROW_MARKS: GaugeMark[] = [
  { value: 10, label: '' },
  { value: 30, label: '' },
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
        marks={ROW_MARKS}
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

/** The cards with selection on and one row selected, so rows show the hover and selected fills. */
function SelectableCards(): ReactElement {
  const [selected, setSelected] = useState<Key[]>(['master']);
  return (
    <div style={{ width: '100%' }}>
      <DataTable
        aria-label="Cards"
        items={CARDS}
        columns={CARD_COLUMNS}
        getKey={(card) => card.id}
        selectedKeys={selected}
        onSelectionChange={setSelected}
      />
    </div>
  );
}

/**
 * A mark's gap is cut out of the track and the arc, so the row's own fill shows there on a plain row, a hovered
 * row and a selected one, where a gap painted in a fixed surface color drew a pale block. Each dial is drawn by
 * the engine's own svg renderer over the fill behind it, and the pixels beside its 30% mark are read: the gap is
 * the row's fill, the track past it is not. In three engines.
 */
export const MarksOnRows: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <SelectableCards />,
  play: async ({ canvas }) => {
    const rowOf = (name: string): HTMLElement => {
      const row = canvas.getByRole('rowheader', { name }).closest<HTMLElement>('[role="row"]');
      if (!row) throw new Error(`No row for ${name}`);
      return row;
    };
    const hovered = rowOf('Store card ending 5512');
    await userEvent.hover(hovered);
    for (const [state, row] of [
      ['plain', rowOf('Everyday Visa ending 4821')],
      ['hovered', hovered],
      ['selected', rowOf('Travel Mastercard ending 0937')],
    ] as const) {
      const svg = row.querySelector<SVGSVGElement>('svg.gauge-svg');
      if (!svg) throw new Error(`No gauge in the ${state} row`);
      const fill = fillBehind(svg);
      // The 30% mark, the second of the two.
      const { behind, gap, track, mark } = await aroundMark(svg, fill, 1);
      await expect(sameColor(gap, behind), `${state}: the gap is the row's fill, ${fill}`).toBe(true);
      await expect(sameColor(track, behind), `${state}: the track past the gap is drawn`).toBe(false);
      await expect(sameColor(mark, [255, 0, 0]), `${state}: the mark is drawn over the gap`).toBe(true);
    }
    await expect(rowOf('Travel Mastercard ending 0937')).toHaveAttribute('aria-selected', 'true');
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
        figureCaption="Full"
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
    // In the ring, every line of the figure and the caption is inside the inner circle.
    const ring = parts(canvasElement, 'gauge').find((gauge) => gauge.getAttribute('data-form') === 'ring');
    if (!ring) throw new Error('No ring');
    await expectInsideRing(ring);
  },
};

/**
 * The widest figures and long captions in rings: at md the caption is one line, 60px of the 80px inner circle,
 * and at lg two lines of 104px of 136, so every line's corners stay inside the circle and off the stroke. In three
 * engines, since each sets its own glyphs.
 */
export const FigureInsideRing: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Tile>
      <Gauge
        label="Utilization"
        value={100}
        valueLabel="100% of your limit"
        figure="100%"
        figureCaption="Keep it under thirty percent"
      />
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
        value={41}
        valueLabel="$12,300 of $30,000 saved"
        figure="$12.3K"
        figureCaption="Keep it under thirty percent of your limit"
      />
    </Tile>
  ),
  play: async ({ canvasElement }) => {
    for (const gauge of parts(canvasElement, 'gauge')) {
      await expectInsideRing(gauge);
      const caption = part(gauge, 'gauge-figure-caption');
      const lines = Math.round(
        caption.getBoundingClientRect().height / parseFloat(getComputedStyle(caption).lineHeight),
      );
      await expect(lines).toBeLessThanOrEqual(gauge.getAttribute('data-size') === 'lg' ? 2 : 1);
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
      // Nothing at 0: the path stays, a zero-length dash with butt caps, which paints nothing, not even a dot.
      const empty = path(gauge(`${form}-0`), 'gauge-value');
      await expect(empty).toHaveAttribute('data-empty');
      await expect(getComputedStyle(empty).strokeLinecap).toBe('butt');
      await expect(
        await paintsAt(empty, [form === 'ring' ? [52, 4] : [4, 44]] as [number, number][]),
        `${form} empty`,
      ).toEqual([false]);
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
        // Firefox reads the inline offset back with its unit, "-4px".
        await expect(parseFloat(arc.style.strokeDashoffset), moment).toBe(-stroke / 2);
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
    await expect(below.querySelector('.gauge-value')).toHaveAttribute('data-empty');
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

/** A gauge whose value the app changes, to read its motion: down, to 0, and up from 0. */
function Paying(): ReactElement {
  const [used, setUsed] = useState(47);
  const press = (next: number) => () => {
    setUsed(next);
  };
  return (
    <Tile>
      <Gauge
        label="Utilization"
        value={used}
        valueLabel={`${String(used)}% of your limit`}
        figure={`${String(used)}%`}
        tone={used > 30 ? 'warning' : 'neutral'}
      />
      {/* The buttons may end the card, so they stop at its corner inset, clear of its bottom curve. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-part)', ...CLEAR_OF_FOOT }}>
        <Button variant="secondary" onPress={press(23)}>
          Pay down
        </Button>
        <Button variant="secondary" onPress={press(0)}>
          Pay off
        </Button>
        <Button variant="secondary" onPress={press(30)}>
          Spend
        </Button>
      </div>
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
    // Down, then to 0, then up from 0: the same path each time, so each change moves, 0 included.
    for (const [button, now] of [
      ['Pay down', '23'],
      ['Pay off', '0'],
      ['Spend', '30'],
    ] as const) {
      await userEvent.click(canvas.getByRole('button', { name: button }));
      await waitFor(() => expect(canvas.getByRole('meter')).toHaveAttribute('aria-valuenow', now));
      await expect(path(canvasElement, 'gauge-value'), button).toBe(arc);
      await expect(arc.hasAttribute('data-empty'), button).toBe(now === '0');
      const moving = arc
        .getAnimations()
        .filter((animation): animation is CSSTransition => animation instanceof CSSTransition);
      if (reduced) {
        await expect(moving, button).toEqual([]);
      } else {
        await expect(
          moving.map((transition) => transition.transitionProperty),
          button,
        ).toContain('stroke-dasharray');
        for (const transition of moving)
          await expect(transition.effect?.getComputedTiming().duration, button).toBe(200);
      }
      // Let this move end before the next starts.
      for (const transition of moving) transition.finish();
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
