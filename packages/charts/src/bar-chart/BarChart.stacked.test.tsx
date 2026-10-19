import { act, fireEvent, render, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { BarChart, type BarChartProps, type BarSeries, type BarValue } from './BarChart';

/*
 * Stacked bars: the category mix by month, the top four categories and "Other" end to end in each band,
 * positives up from zero and negatives down, each sign in series order. The faces' own tests are in
 * BarChart.test.tsx and BarChart.vertical.test.tsx.
 */

const money = (value: number): BarValue => ({
  value,
  valueLabel: `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`,
});

const MONTHS = ['May', 'Jun', 'Jul'];

/** The month's top four categories and "Other", which the app sums. July has no groceries; June's transport is 0. */
const GROCERIES: BarSeries = { label: 'Groceries', values: [money(400), money(300), null] };
const DINING: BarSeries = { label: 'Dining', values: [200, 100, 150].map(money) };
const TRANSPORT: BarSeries = { label: 'Transport', values: [100, 0, 50].map(money) };
const BILLS: BarSeries = { label: 'Bills', values: [100, 200, 300].map(money) };
const OTHER: BarSeries = { label: 'Other', values: [50, 100, 100].map(money) };
const MIX: readonly BarSeries[] = [GROCERIES, DINING, TRANSPORT, BILLS, OTHER];

/** Each month's total, which the app sums and formats; the chart never adds a figure it must say. */
const TOTALS = ['$850.00', '$700.00', '$600.00'];

/** A stack across zero: refunds net a category below the line in some months. */
const NET: readonly BarSeries[] = [
  { label: 'Groceries', values: [100, -50].map(money) },
  { label: 'Shopping', values: [-40, 60].map(money) },
  { label: 'Travel', values: [30, -20].map(money) },
];

const NAME = 'Spending by category and month';

type ChartProps = Partial<Omit<BarChartProps, 'series' | 'layout'>> & { series?: readonly BarSeries[] };

/** The category mix by month, standing up. Its sums run to 850, so the domain is [0, 1000]. */
const Chart = ({ series = MIX, ...props }: ChartProps): ReactElement => (
  <BarChart aria-label={NAME} categories={MONTHS} layout="stacked" series={series} {...props} />
);

/** A stack across zero on [-100, 300], zero a quarter of the way from the low end. */
const Across = (props: ChartProps): ReactElement => (
  <Chart series={NET} categories={['May', 'Jun']} valueDomain={[-100, 300]} {...props} />
);

const part = (container: HTMLElement, selector: string): HTMLElement => {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
};

const barsOf = (container: HTMLElement): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('.bar-chart-bar'),
];

const barAt = (container: HTMLElement, index: number): HTMLElement => {
  const bar = barsOf(container)[index];
  if (!bar) throw new Error(`No bar ${String(index)}`);
  return bar;
};

/** Each bar's attribute `name`, in drawn order: band by band, and in a band series by series. */
const each = (container: HTMLElement, name: string): (string | null)[] =>
  barsOf(container).map((bar) => bar.getAttribute(name));

const focused = (): HTMLElement => {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) throw new Error('Nothing focused');
  return element;
};

const focus = (element: HTMLElement | undefined): void => {
  if (!element) throw new Error('No element');
  act(() => {
    element.focus();
  });
};

/** Records every element that lost focus to nothing, which is focus passing through the body. */
const watchBody = (): ReturnType<typeof vi.fn> => {
  const toNothing = vi.fn();
  const listener = (event: FocusEvent): void => {
    if (event.relatedTarget === null) toNothing(event.target);
  };
  document.addEventListener('focusout', listener);
  onTestFinished(() => {
    document.removeEventListener('focusout', listener);
  });
  return toNothing;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BarChart, stacked', () => {
  it('stacks each band end to end, one bar thick, from zero up in series order', () => {
    const { container } = render(<Chart />);
    expect(part(container, 'figure')).toHaveAttribute('data-layout', 'stacked');
    const plot = part(container, '.bar-chart-plot');
    // A stack is one bar across, so the band's thickness is a lone bar's and every segment its place.
    expect(plot.style.getPropertyValue('--bar-chart-group')).toBe('1');
    expect(plot.style.getPropertyValue('--bar-chart-bands')).toBe('3');
    for (const bar of barsOf(container)) expect(bar.style.getPropertyValue('--bar-chart-index')).toBe('0');
    const bands = [...container.querySelectorAll('.bar-chart-band')];
    expect(bands.map((band) => band.querySelectorAll('.bar-chart-bar').length)).toEqual([5, 5, 4]);
    // May on [0, 1000]: Groceries 0 to 400, Dining 400 to 600, Transport to 700, Bills to 800, Other to 850.
    const may = barsOf(container).slice(0, 5);
    expect(may.map((bar) => bar.style.insetBlockEnd)).toEqual(['0%', '40%', '60%', '70%', '80%']);
    expect(may.map((bar) => bar.style.blockSize)).toEqual(['40%', '20%', '10%', '10%', '5%']);
    for (const bar of may) expect(bar.style.insetBlockStart).toBe('');
    // June's transport is 0: a segment of no length where the stack has reached, still a stop.
    const transport = barAt(container, 7);
    expect(transport).toHaveAttribute('data-sign', 'zero');
    expect(transport.style.insetBlockEnd).toBe('40%');
    expect(transport.style.blockSize).toBe('0%');
  });

  it("takes its domain from each band's sums, not from its values", () => {
    // The sums run to 850, so [0, 1000]: from the values alone, 400, the stacks would run off the plot.
    const { container } = render(<Chart />);
    const other = barAt(container, 4);
    expect(other.style.insetBlockEnd).toBe('80%');
    expect(other.style.blockSize).toBe('5%');
  });

  it('rounds only the outermost segment of each sign and gaps every segment that stands on another', () => {
    const { container } = render(<Chart />);
    // Other is the outermost segment of every band.
    expect(each(container, 'data-outer')).toEqual([
      ...[null, null, null, null, ''],
      ...[null, null, null, null, ''],
      ...[null, null, null, ''],
    ]);
    // Every segment but the first from zero stands on another, so it takes the gap; June's zero takes none,
    // and July's Dining, the first July has, stands on the line.
    expect(each(container, 'data-joined')).toEqual([
      ...[null, '', '', '', ''],
      ...[null, '', null, '', ''],
      ...[null, '', '', ''],
    ]);
  });

  it('stacks negatives down from zero, in series order, rounding the outermost of each sign', () => {
    const { container } = render(<Across />);
    // May: Groceries 0 to 100 and Travel 100 to 130 above zero, Shopping 0 to -40 below it.
    const [groceries, shopping, travel, june0, june1, june2] = barsOf(container);
    expect(groceries?.style.insetBlockEnd).toBe('25%');
    expect(groceries?.style.blockSize).toBe('25%');
    expect(travel?.style.insetBlockEnd).toBe('50%');
    expect(travel?.style.blockSize).toBe('7.5%');
    expect(shopping?.style.insetBlockStart).toBe('75%');
    expect(shopping?.style.blockSize).toBe('10%');
    // June: Groceries 0 to -50 and Travel -50 to -70 below, Shopping 0 to 60 above.
    expect(june0?.style.insetBlockStart).toBe('75%');
    expect(june0?.style.blockSize).toBe('12.5%');
    expect(june1?.style.insetBlockEnd).toBe('25%');
    expect(june2?.style.insetBlockStart).toBe('87.5%');
    expect(june2?.style.blockSize).toBe('5%');
    expect(each(container, 'data-sign')).toEqual([
      'positive',
      'negative',
      'positive',
      'negative',
      'positive',
      'negative',
    ]);
    expect(each(container, 'data-outer')).toEqual([null, '', '', null, '', '']);
    expect(each(container, 'data-joined')).toEqual([null, null, '', null, null, '']);
    expect(part(container, '.bar-chart-baseline')).toHaveAttribute('data-crosses', '');
  });

  it('stacks along the row lying down, negatives toward the start', () => {
    const { container } = render(<Across orientation="horizontal" />);
    // Zero a quarter along [-100, 300].
    const [groceries, shopping, travel, , , june2] = barsOf(container);
    expect(groceries?.style.insetInlineStart).toBe('25%');
    expect(groceries?.style.inlineSize).toBe('25%');
    expect(travel?.style.insetInlineStart).toBe('50%');
    expect(travel?.style.inlineSize).toBe('7.5%');
    expect(shopping?.style.insetInlineEnd).toBe('75%');
    expect(shopping?.style.inlineSize).toBe('10%');
    expect(june2?.style.insetInlineEnd).toBe('87.5%');
    // One bar thick in its row, so no segment is moved off the row's middle.
    expect(part(container, '.bar-chart-rows').style.getPropertyValue('--bar-chart-group')).toBe('1');
    for (const bar of barsOf(container)) expect(bar.style.getPropertyValue('--bar-chart-index')).toBe('');
  });

  it('colors a stack by the palette in order and slate for the fifth, with a slot for each texture', () => {
    const { container } = render(<Chart />);
    expect(each(container, 'data-color').slice(0, 5)).toEqual([
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'slate',
    ]);
    expect(each(container, 'data-series').slice(0, 5)).toEqual(['1', '2', '3', '4', '5']);
    // July has no groceries, and its Dining keeps Dining's slot.
    expect(each(container, 'data-color').slice(10)).toEqual(['chart-2', 'chart-3', 'chart-4', 'slate']);
    const items = [...container.querySelectorAll('.bar-chart-legend-item')];
    expect(
      items.map((item) => [
        item.textContent,
        item.getAttribute('data-color'),
        item.getAttribute('data-series'),
        item.getAttribute('data-look'),
      ]),
    ).toEqual([
      ['Groceries', 'chart-1', '1', 'swatch'],
      ['Dining', 'chart-2', '2', 'swatch'],
      ['Transport', 'chart-3', '3', 'swatch'],
      ['Bills', 'chart-4', '4', 'swatch'],
      ['Other', 'slate', '5', 'swatch'],
    ]);
    // A pinned slot is kept, so a series keeps its color when a filter removes another.
    const { container: pinned } = render(
      <Chart
        series={[
          { ...DINING, color: 'chart-2' },
          { ...OTHER, color: 'slate' },
        ]}
      />,
    );
    expect(each(pinned, 'data-color').slice(0, 2)).toEqual(['chart-2', 'slate']);
  });

  it('draws one series as one series, whatever the layout: ink, every bar its own data end', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(<Chart series={[DINING]} valueLabels="all" />);
    expect(part(container, 'figure')).toHaveAttribute('data-layout', 'grouped');
    expect(each(container, 'data-color')).toEqual(['ink', 'ink', 'ink']);
    expect(each(container, 'data-series')).toEqual([null, null, null]);
    expect(container.querySelector('.bar-chart-legend')).toBeNull();
    // Its figures are its values, as any one series' are.
    expect([...container.querySelectorAll('.bar-chart-value')].map((label) => label.textContent)).toEqual([
      '$200.00',
      '$100.00',
      '$150.00',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once past five series and draws the sixth and later in slate', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const extra = { label: 'Gifts', color: 'chart-1', values: [10, 10, 10].map(money) } as const;
    const { container, rerender } = render(<Chart series={[...MIX, extra]} />);
    expect(each(container, 'data-color').slice(0, 6)).toEqual([
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'slate',
      'slate',
    ]);
    // The sixth shares the fifth's texture: slate is the remainder, never a sixth look.
    expect(each(container, 'data-series')[5]).toBe('5');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('BarChart: a stack holds five series; any more draw in slate.');
    rerender(<Chart series={[...MIX, extra, extra]} />);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('warns once for a hatched series in a stack and draws it as a fill in its slot', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(<Chart series={[GROCERIES, { ...DINING, look: 'hatched' }]} />);
    expect(each(container, 'data-look')).toEqual(['fill', 'fill', 'fill', 'fill', 'fill']);
    expect(each(container, 'data-color').slice(0, 2)).toEqual(['chart-1', 'chart-2']);
    expect(container.querySelector('.bar-chart-legend-item[data-look="hatched"]')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("BarChart: a stack draws look 'hatched' as a fill.");
  });

  it('writes no warning for a stack of five with its totals', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Chart totals={TOTALS} valueLabels="all" />);
    render(<Chart orientation="horizontal" totals={TOTALS} />);
    render(<Chart orientation="horizontal" valueLabels="none" />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("labels each stack with its total at the outer end of the band's sign, standing up", () => {
    const { container } = render(<Chart totals={TOTALS} valueLabels="all" />);
    const labels = [...container.querySelectorAll<HTMLElement>('.bar-chart-value')];
    expect(labels.map((label) => label.textContent)).toEqual(TOTALS);
    // Above each stack's top: 850, 700 and 600 of [0, 1000].
    expect(labels.map((label) => label.style.insetBlockEnd)).toEqual(['85%', '70%', '60%']);
    expect(labels.map((label) => label.getAttribute('data-sign'))).toEqual([
      'positive',
      'positive',
      'positive',
    ]);
    for (const label of labels) expect(label.style.getPropertyValue('--bar-chart-index')).toBe('0');
    expect(part(container, '.bar-chart-plot')).toHaveAttribute('data-room-start', '');
    // Across zero, a total stands at the end of the side its band nets to: May above, June below.
    const { container: across } = render(<Across totals={['$90.00', '-$10.00']} valueLabels="all" />);
    const [may, june] = [...across.querySelectorAll<HTMLElement>('.bar-chart-value')];
    expect(may?.style.insetBlockEnd).toBe('57.5%');
    expect(may).toHaveAttribute('data-sign', 'positive');
    expect(june?.style.insetBlockStart).toBe('92.5%');
    expect(june).toHaveAttribute('data-sign', 'negative');
    expect(part(across, '.bar-chart-plot')).toHaveAttribute('data-room-end', '');
    // An index list labels only those bands.
    const { container: listed } = render(<Chart totals={TOTALS} valueLabels={[2]} />);
    expect([...listed.querySelectorAll('.bar-chart-value')].map((label) => label.textContent)).toEqual([
      '$600.00',
    ]);
  });

  it('puts each total in the amount column lying down, one to a row', () => {
    const { container } = render(<Chart orientation="horizontal" totals={TOTALS} />);
    const rows = [...container.querySelectorAll('.bar-chart-amounts')];
    expect(rows.map((row) => row.textContent)).toEqual(TOTALS);
    expect(container.querySelectorAll('.bar-chart-amount')).toHaveLength(3);
  });

  it('warns once and labels nothing when asked for labels without totals', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(<Chart valueLabels="all" />);
    expect(container.querySelector('.bar-chart-value')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "BarChart: a stack is labelled by its totals; pass totals, or valueLabels 'none'.",
    );
    // Lying down the amounts are on by default, so a stack with no totals warns there too, and draws none.
    const { container: lying } = render(<Chart orientation="horizontal" />);
    expect(lying.querySelector('.bar-chart-amount')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('lists every segment of the band in the readout, in legend order, then the total', () => {
    const { container } = render(<Chart totals={TOTALS} />);
    focus(barAt(container, 8));
    const lines = [...container.querySelectorAll('.bar-chart-readout li')].map((line) => line.textContent);
    expect(lines).toEqual([
      '$300.00Groceries',
      '$100.00Dining',
      '$0.00Transport',
      '$200.00Bills',
      '$100.00Other',
      '$700.00Total',
    ]);
    expect(part(container, '.bar-chart-readout-x')).toHaveTextContent('Jun');
    // Each swatch takes its series' slot, so a texture follows into the readout.
    const items = [...container.querySelectorAll('.bar-chart-readout-item')];
    expect(items.map((item) => item.getAttribute('data-series'))).toEqual(['1', '2', '3', '4', '5', null]);
  });

  it("puts the readout above the stack's top when its lines fit, else below it, never over a segment", () => {
    // A 600px plot, so seven lines fit above June's 700 of [0, 1000].
    const { container, rerender } = render(<Chart totals={TOTALS} height={600} />);
    focus(barAt(container, 6));
    const readout = part(container, '.bar-chart-readout');
    expect(readout).toHaveAttribute('data-place', 'above');
    expect(readout.style.insetBlockEnd).toBe('70%');
    // At 240px they do not, and nothing is below the stack's foot but the line: the side with more room.
    rerender(<Chart totals={TOTALS} />);
    expect(part(container, '.bar-chart-readout')).toHaveAttribute('data-place', 'above');
    // Lying down, at the stack's far end along the row: May's 850 of [0, 1000].
    const { container: lying } = render(<Chart orientation="horizontal" totals={TOTALS} />);
    focus(barAt(lying, 0));
    expect(part(lying, '.bar-chart-readout').style.insetInlineStart).toBe('85%');
  });

  it('names each segment by its month, its category and its value, and tabulates the totals', () => {
    const { container } = render(<Chart totals={TOTALS} />);
    expect(barAt(container, 0)).toHaveAccessibleName('May Groceries $400.00');
    expect(barAt(container, 13)).toHaveAccessibleName('Jul Other $100.00');
    const table = part(container, 'table.bar-chart-table');
    expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Groceries',
      'Dining',
      'Transport',
      'Bills',
      'Other',
      'Total',
    ]);
    const july = [...table.querySelectorAll('tbody tr')][2];
    expect([...(july?.querySelectorAll('td') ?? [])].map((td) => td.textContent)).toEqual([
      '',
      '$150.00',
      '$50.00',
      '$300.00',
      '$100.00',
      '$600.00',
    ]);
  });

  it('writes the texture on the figure, and a slot on each segment and key in either case', () => {
    const { container } = render(<Chart hasTexture />);
    expect(part(container, 'figure')).toHaveAttribute('data-texture', '');
    expect(each(container, 'data-series').slice(0, 5)).toEqual(['1', '2', '3', '4', '5']);
    const { container: plain } = render(<Chart />);
    expect(part(plain, 'figure')).not.toHaveAttribute('data-texture');
    // A grouped chart has no slots: its second series is the context or the previous period, never a texture.
    const { container: grouped } = render(
      <BarChart aria-label={NAME} categories={MONTHS} series={[GROCERIES, DINING]} hasTexture />,
    );
    expect(grouped.querySelector('[data-series]')).toBeNull();
  });

  /**
   * [name, the chart, keys from June's Dining (bar 6), the bar focused after by drawn index, prevented, rtl].
   * Drawn order: May's five (0 to 4), June's five (5 to 9, its Transport a zero), July's four (10 to 13).
   */
  const KEY_CASES: [string, 'vertical' | 'horizontal', string[], number, boolean, boolean?][] = [
    ['Up to the segment above', 'vertical', ['ArrowUp'], 7, true],
    ['Up past the zero to Bills', 'vertical', ['ArrowUp', 'ArrowUp'], 8, true],
    ['Down to the segment below', 'vertical', ['ArrowDown'], 5, true],
    ['Down at the foot, prevented and staying', 'vertical', ['ArrowDown', 'ArrowDown'], 5, true],
    [
      'Up at the top, prevented and staying',
      'vertical',
      ['End', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp'],
      13,
      true,
    ],
    ['Right to the same category in the next band', 'vertical', ['ArrowRight'], 10, true],
    ['Left to the same category in the band before', 'vertical', ['ArrowLeft'], 1, true],
    ['Right from Groceries, to the nearest July has', 'vertical', ['ArrowDown', 'ArrowRight'], 10, true],
    ['Home, keeping the category', 'vertical', ['Home'], 1, true],
    ['End, keeping the category', 'vertical', ['End'], 10, true],
    ['Right, right to left, to the band before', 'vertical', ['ArrowRight'], 1, true, true],
    ['Left, right to left, to the band after', 'vertical', ['ArrowLeft'], 10, true, true],
    ['Up, right to left, unchanged', 'vertical', ['ArrowUp'], 7, true, true],
    ['Down to the same category in the next row', 'horizontal', ['ArrowDown'], 10, true],
    ['Up to the same category in the row before', 'horizontal', ['ArrowUp'], 1, true],
    ['Right along the bar to the next segment', 'horizontal', ['ArrowRight'], 7, true],
    ['Left along the bar to the segment before', 'horizontal', ['ArrowLeft'], 5, true],
    ['Right, right to left, toward zero', 'horizontal', ['ArrowRight'], 5, true, true],
    ['Left, right to left, away from zero', 'horizontal', ['ArrowLeft'], 7, true, true],
  ];

  it.each(KEY_CASES)('moves %s in a %s stack', (_name, orientation, keys, at, isPrevented, rtl) => {
    const chart = <Chart orientation={orientation} />;
    const { container } = render(rtl ? <div dir="rtl">{chart}</div> : chart);
    focus(barAt(container, 6));
    let prevented = false;
    for (const key of keys) prevented = !fireEvent.keyDown(focused(), { key });
    expect(document.activeElement).toBe(barAt(container, at));
    expect(prevented).toBe(isPrevented);
    expect(barsOf(container).filter((bar) => bar.tabIndex === 0)).toEqual([barAt(container, at)]);
    expect(barAt(container, at)).toHaveAttribute('data-active', '');
  });

  it('moves along a stack across zero by what is drawn above and below', () => {
    const { container } = render(<Across />);
    // May from the bottom: Shopping below zero, Groceries over it, Travel on top.
    focus(barAt(container, 0));
    fireEvent.keyDown(focused(), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(barAt(container, 2));
    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(barAt(container, 1));
    // A modifier is the page's.
    expect(fireEvent.keyDown(focused(), { key: 'ArrowUp', ctrlKey: true })).toBe(true);
    expect(document.activeElement).toBe(barAt(container, 1));
  });

  it("takes the segment under the pointer along the band's stack", () => {
    const { container } = render(<Chart />);
    const box = part(container, '.bar-chart-bars');
    const bands = [...container.querySelectorAll('.bar-chart-band')];
    // The bars' box 300px across and 100px tall; each band's segments one 20px column, 20px of height each.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const band = this.closest('.bar-chart-band');
      const at = band ? bands.indexOf(band) : 0;
      const place = band ? [...band.querySelectorAll('.bar-chart-bar')].indexOf(this) : 0;
      const [left, top, width, height] =
        this === box ? [0, 0, 300, 100] : [at * 100 + 40, 80 - place * 20, 20, 20];
      return {
        left,
        right: left + width,
        top,
        bottom: top + height,
        width,
        height,
        x: left,
        y: top,
        toJSON: () => ({}),
      };
    });
    fireEvent.pointerMove(part(container, '.bar-chart-plot'), {
      clientX: 150,
      clientY: 30,
      pointerType: 'mouse',
    });
    // June's fourth segment from the foot, 20 to 40px down: Bills.
    expect(barAt(container, 8)).toHaveAttribute('data-active', '');
    expect(document.activeElement).toBe(document.body);
  });

  it('keeps focus off the body when a focused segment loses its value, and gives it to the tab stop', () => {
    const toNothing = watchBody();
    const { container, rerender } = render(<Chart />);
    focus(barAt(container, 6));
    const fewer = { ...DINING, values: [money(200), null, money(150)] };
    rerender(<Chart series={[GROCERIES, fewer, TRANSPORT, BILLS, OTHER]} />);
    expect(document.activeElement).toBe(barAt(container, 0));
    expect(barAt(container, 0).tabIndex).toBe(0);
    expect(toNothing).not.toHaveBeenCalled();
  });

  it('keeps focus off the body through a status, and gives it back to the segment when ready', () => {
    const toNothing = watchBody();
    const { container, rerender } = render(<Chart />);
    focus(barAt(container, 8));
    rerender(<Chart status="loading" />);
    expect(document.activeElement).toBe(part(container, '.bar-chart-plot'));
    rerender(<Chart />);
    expect(document.activeElement).toBe(barAt(container, 8));
    expect(toNothing).not.toHaveBeenCalled();
  });

  it('writes no tabindex on the server, and every segment its place', () => {
    const html = renderToString(<Chart totals={TOTALS} valueLabels="all" />);
    expect(html).not.toContain('tabindex');
    expect(html).toContain('data-layout="stacked"');
    expect(html).toContain('data-outer=""');
  });

  const AXE_CASES: [string, ReactElement, ((container: HTMLElement) => void)?][] = [
    [
      'stacked, with totals and a segment focused',
      <Chart key="stacked" totals={TOTALS} valueLabels="all" />,
      (container) => {
        focus(barAt(container, 7));
      },
    ],
    ['stacked across zero', <Across key="across" />],
    ['stacked with textures', <Chart key="textures" hasTexture totals={TOTALS} />],
    ['stacked, lying down', <Chart key="lying" orientation="horizontal" totals={TOTALS} />],
    [
      'stacked, in the table view',
      <Chart key="table" totals={TOTALS} />,
      (container) => {
        fireEvent.click(within(container).getByRole('button', { name: 'Show as table' }));
      },
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element, act) => {
    const { container } = render(element);
    act?.(container);
    await expectNoA11yViolations(container);
  });
});
