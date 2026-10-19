import { act, fireEvent, render, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { BarChart, type BarChartProps, type BarSeries, type BarValue } from './BarChart';

/*
 * The vertical face, two series side by side in either orientation, and the previous period drawn hatched.
 * The horizontal face's own tests are in BarChart.test.tsx.
 */

const money = (value: number): BarValue => ({
  value,
  valueLabel: `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`,
});

/** Six months of net cash flow: a bad June below zero, a July that broke even, and no September yet. */
const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

const NET: BarSeries = {
  label: 'Net',
  values: [money(420), money(-150), money(0), money(310), null, money(95)],
};

/** Zero sits 75% down [-200, 600], so every place below is a round number. */
const DOMAIN = [-200, 600] as const;

/** Income beside spending over three months: money that arrived in gain, spending in ink. */
const QUARTER = ['Aug', 'Sep', 'Oct'];

const INCOME: BarSeries = { label: 'Income', color: 'gain', values: [5200, 5200, 5450].map(money) };
const SPENDING: BarSeries = { label: 'Spending', color: 'ink', values: [4380, 5610, 3990].map(money) };

/** This period beside the last, by category, the last drawn hatched in the same color. */
const CATEGORIES = ['Groceries', 'Dining', 'Transport'];

const THIS_PERIOD: BarSeries = { label: 'October', values: [640, 312.45, 188.1].map(money) };
const LAST_PERIOD: BarSeries = {
  label: 'September',
  look: 'hatched',
  values: [money(590), null, money(201)],
};

const NAME = 'Net cash flow by month';

type ChartProps = Partial<Omit<BarChartProps, 'series' | 'layout'>> & {
  series?: readonly [BarSeries] | readonly [BarSeries, BarSeries];
};

/** Net cash flow, standing up, on a domain that holds zero 75% down the plot. */
const Chart = ({ series = [NET], ...props }: ChartProps): ReactElement => (
  <BarChart aria-label={NAME} categories={MONTHS} series={series} valueDomain={DOMAIN} {...props} />
);

/** Income beside spending, standing up. */
const Grouped = (props: ChartProps): ReactElement => (
  <BarChart
    aria-label="Income and spending by month"
    categories={QUARTER}
    series={[INCOME, SPENDING]}
    {...props}
  />
);

/** October beside September by category, lying down, September hatched. */
const Compare = (props: ChartProps): ReactElement => (
  <BarChart
    aria-label="Spending by category, October against September"
    orientation="horizontal"
    categories={CATEGORIES}
    series={[THIS_PERIOD, LAST_PERIOD]}
    {...props}
  />
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

/** The focused element, which a key is sent to. */
const focused = (): HTMLElement => {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) throw new Error('Nothing focused');
  return element;
};

/** The index of the band the focused bar stands in, read from the band it is drawn in. */
const focusedBand = (container: HTMLElement): number => {
  const band = document.activeElement?.closest('.bar-chart-band');
  return band ? [...container.querySelectorAll('.bar-chart-band')].indexOf(band) : -1;
};

const readoutX = (container: HTMLElement): string | null =>
  container.querySelector('.bar-chart-readout .bar-chart-readout-x')?.textContent ?? null;

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

describe('BarChart, vertical', () => {
  it('places vertical bars from zero with the band and group custom properties', () => {
    const { container } = render(<Chart />);
    expect(part(container, 'figure')).toHaveAttribute('data-orientation', 'vertical');
    const plot = part(container, '.bar-chart-plot');
    expect(plot).toHaveAttribute('role', 'group');
    expect(plot).toHaveAttribute('aria-roledescription', 'chart');
    expect(plot).toHaveAttribute('aria-label', NAME);
    // The bars' box is the plot's height; the plot holds it, the gridlines and the category labels.
    expect(part(container, '.bar-chart-plot > .bar-chart-bars').style.blockSize).toBe('240px');
    expect(part(container, '.bar-chart-plot > .bar-chart-categories')).not.toBeNull();
    expect(plot.style.getPropertyValue('--bar-chart-bands')).toBe('6');
    expect(plot.style.getPropertyValue('--bar-chart-group')).toBe('1');
    // A band per category, in order, each holding its bars; September has none.
    const bands = [...container.querySelectorAll('.bar-chart-bars > .bar-chart-band')];
    expect(bands).toHaveLength(6);
    expect(bands.map((band) => band.querySelectorAll('.bar-chart-bar').length)).toEqual([1, 1, 1, 1, 0, 1]);
    const [may, jun, jul, aug, oct] = barsOf(container);
    // A positive bar stands on zero from below, so its least 1px grows up from the line, as it does.
    expect(may?.style.insetBlockEnd).toBe('25%');
    expect(may?.style.insetBlockStart).toBe('');
    expect(may?.style.blockSize).toBe('52.5%');
    expect(may).toHaveAttribute('data-sign', 'positive');
    // A negative bar hangs from zero.
    expect(jun?.style.insetBlockStart).toBe('75%');
    expect(jun?.style.blockSize).toBe('18.75%');
    expect(jun).toHaveAttribute('data-sign', 'negative');
    // A zero is a bar of no length on the line, still a stop.
    expect(jul).toHaveAttribute('data-sign', 'zero');
    expect(jul).not.toHaveAttribute('data-nonzero');
    expect(jul?.style.blockSize).toBe('0%');
    expect(aug?.style.blockSize).toBe('38.75%');
    // Each bar's band centre and its place in the group, which the CSS turns into its inline start.
    expect(may?.style.getPropertyValue('--bar-chart-centre')).toBe('8.333%');
    expect(oct?.style.getPropertyValue('--bar-chart-centre')).toBe('91.667%');
    for (const bar of barsOf(container)) expect(bar.style.getPropertyValue('--bar-chart-index')).toBe('0');
    // No inline size or inline start is written: the CSS computes both.
    expect(may?.style.inlineSize).toBe('');
    expect(may?.style.insetInlineStart).toBe('');
    // The zero line runs across the plot where the domain crosses zero.
    const zero = part(container, '.bar-chart-gridlines line.bar-chart-baseline');
    expect(zero).toHaveAttribute('y1', '75');
    expect(zero).toHaveAttribute('y2', '75');
    expect(zero).toHaveAttribute('x1', '0');
    expect(zero).toHaveAttribute('x2', '100');
    expect(zero).toHaveAttribute('data-crosses', '');
    // No amount column and, by default, no value labels.
    expect(container.querySelector('.bar-chart-amounts')).toBeNull();
    expect(container.querySelector('.bar-chart-value')).toBeNull();
  });

  it('takes the plot height it is given', () => {
    const { container } = render(<Chart height={180} />);
    expect(part(container, '.bar-chart-bars').style.blockSize).toBe('180px');
  });

  it('draws gridlines across the plot and their labels at its start, inside the domain', () => {
    const { container } = render(
      <Chart
        valueTicks={[
          { value: -200, label: '-$200' },
          { value: 0, label: '$0' },
          { value: 400, label: '$400' },
          { value: 800, label: 'out' },
        ]}
      />,
    );
    const lines = [...container.querySelectorAll('.bar-chart-gridlines line.bar-chart-grid')];
    expect(lines.map((line) => line.getAttribute('y1'))).toEqual(['100', '75', '25']);
    // The labels stand in a column of their own at the plot's start, beside the bars' box, never over a bar.
    const labels = [
      ...container.querySelectorAll<HTMLElement>('.bar-chart-plot > .bar-chart-y-labels > span'),
    ];
    expect(labels.map((label) => label.textContent)).toEqual(['-$200', '$0', '$400']);
    expect(labels.map((label) => label.style.insetBlockStart)).toEqual(['100%', '75%', '25%']);
    for (const label of labels) expect(label).toHaveClass('bar-chart-y-label');
    expect(part(container, '.bar-chart-gridlines')).toHaveAttribute('aria-hidden', 'true');
    expect(part(container, '.bar-chart-y-labels')).toHaveAttribute('aria-hidden', 'true');
    expect(part(container, '.bar-chart-y-labels').nextElementSibling).toBe(
      part(container, '.bar-chart-bars'),
    );
    // The top label sits above its line, so the plot keeps room above the bars.
    expect(part(container, '.bar-chart-plot')).toHaveAttribute('data-room-start', '');
    // No horizontal chart's row of value labels under a vertical plot.
    expect(container.querySelector('.bar-chart-ticks')).toBeNull();
  });

  it('draws value labels above positives and below negatives, only where asked', () => {
    const { container } = render(<Chart valueLabels="all" />);
    const labels = [...container.querySelectorAll<HTMLElement>('.bar-chart-value')];
    expect(labels.map((label) => label.textContent)).toEqual([
      '$420.00',
      '-$150.00',
      '$0.00',
      '$310.00',
      '$95.00',
    ]);
    const [may, jun, jul] = labels;
    // 4px off the data end, which the CSS adds: above a positive bar's top, below a negative bar's bottom.
    expect(may?.style.insetBlockEnd).toBe('77.5%');
    expect(may).toHaveAttribute('data-sign', 'positive');
    expect(jun?.style.insetBlockStart).toBe('93.75%');
    expect(jun).toHaveAttribute('data-sign', 'negative');
    expect(jul?.style.insetBlockEnd).toBe('25%');
    // Centred on its bar, by the same band centre and place.
    expect(may?.style.getPropertyValue('--bar-chart-centre')).toBe('8.333%');
    expect(may?.style.getPropertyValue('--bar-chart-index')).toBe('0');
    expect(part(container, '.bar-chart-values')).toHaveAttribute('aria-hidden', 'true');
    // Every label of 'all' shows wide; a narrow chart keeps the first and the last band's.
    expect(labels.map((label) => label.hasAttribute('data-keep'))).toEqual([true, false, false, false, true]);
    // Room for the labels above and below, reserved by line height, not measured.
    const plot = part(container, '.bar-chart-plot');
    expect(plot).toHaveAttribute('data-room-start', '');
    expect(plot).toHaveAttribute('data-room-end', '');

    const { container: listed } = render(<Chart valueLabels={[0, 3]} />);
    const shown = [...listed.querySelectorAll<HTMLElement>('.bar-chart-value')];
    expect(shown.map((label) => label.textContent)).toEqual(['$420.00', '$310.00']);
    // Bands the app names are the story: they stay at every width.
    for (const label of shown) expect(label).toHaveAttribute('data-keep', '');
    expect(part(listed, '.bar-chart-plot')).toHaveAttribute('data-room-start', '');
    expect(part(listed, '.bar-chart-plot')).not.toHaveAttribute('data-room-end');

    const { container: none } = render(<Chart />);
    expect(part(none, '.bar-chart-plot')).not.toHaveAttribute('data-room-start');
    expect(part(none, '.bar-chart-plot')).not.toHaveAttribute('data-room-end');
  });

  it('clamps category labels and shows time ticks', () => {
    const { container } = render(<Chart />);
    const row = part(container, '.bar-chart-categories');
    expect(row).toHaveAttribute('aria-hidden', 'true');
    expect(row).toHaveAttribute('data-bands', 'category');
    // Eight bands or fewer keep every label at any width; past eight a narrow chart shows every third.
    expect(row).not.toHaveAttribute('data-dense');
    const TWELVE = [...MONTHS, ...MONTHS];
    const { container: many } = render(
      <BarChart
        aria-label="Twelve"
        categories={TWELVE}
        series={[{ label: 'Net', values: TWELVE.map(() => money(10)) }]}
      />,
    );
    expect(part(many, '.bar-chart-categories')).toHaveAttribute('data-dense', '');
    const labels = [...row.querySelectorAll<HTMLElement>('.bar-chart-band-label')];
    expect(labels.map((label) => label.textContent)).toEqual(MONTHS);
    // Under 24rem only every third shows, so the render marks them.
    expect(labels.map((label) => label.hasAttribute('data-third'))).toEqual([
      true,
      false,
      false,
      true,
      false,
      false,
    ]);
    // A category band whose label is not asked for keeps its cell, empty.
    const { container: some } = render(<Chart categoryTicks={[0, 5]} />);
    expect([...some.querySelectorAll('.bar-chart-band-label')].map((label) => label.textContent)).toEqual([
      'May',
      '',
      '',
      '',
      '',
      'Oct',
    ]);

    const DAYS = Array.from({ length: 31 }, (_, at) => `Oct ${String(at + 1)}`);
    const { container: days } = render(
      <BarChart
        aria-label="Spending by day"
        bands="time"
        categories={DAYS}
        series={[{ label: 'October', values: DAYS.map((_, at) => money(10 + at)) }]}
      />,
    );
    const ticks = [...days.querySelectorAll<HTMLElement>('.bar-chart-band-label')];
    expect(ticks.map((tick) => tick.textContent)).toEqual(['Oct 1', 'Oct 16', 'Oct 31']);
    expect(ticks.map((tick) => tick.getAttribute('data-edge'))).toEqual(['start', null, 'end']);
    expect(ticks.map((tick) => tick.style.insetInlineStart)).toEqual(['1.613%', '50%', '98.387%']);
    expect(part(days, '.bar-chart-categories')).toHaveAttribute('data-bands', 'time');
  });

  it('starts time bands at the newest band with a value', () => {
    const { container } = render(<Chart bands="time" />);
    const stop = barsOf(container).find((bar) => bar.tabIndex === 0);
    expect(stop).toBe(barsOf(container).at(-1));
  });

  it('colors two grouped series ink and slate, or by color', () => {
    const { container } = render(
      <Grouped
        series={[
          { ...INCOME, color: undefined },
          { ...SPENDING, color: undefined },
        ]}
      />,
    );
    const plot = part(container, '.bar-chart-plot');
    expect(plot.style.getPropertyValue('--bar-chart-group')).toBe('2');
    expect(plot.style.getPropertyValue('--bar-chart-bands')).toBe('3');
    expect(barsOf(container).map((bar) => bar.getAttribute('data-color'))).toEqual([
      'ink',
      'slate',
      'ink',
      'slate',
      'ink',
      'slate',
    ]);
    expect(barsOf(container).map((bar) => bar.style.getPropertyValue('--bar-chart-index'))).toEqual([
      '0',
      '1',
      '0',
      '1',
      '0',
      '1',
    ]);
    // A pair shares its band's centre.
    expect(barAt(container, 0).style.getPropertyValue('--bar-chart-centre')).toBe('16.667%');
    expect(barAt(container, 1).style.getPropertyValue('--bar-chart-centre')).toBe('16.667%');
    // Pinned: income in gain beside spending in ink, the consumer's month view.
    const { container: pinned } = render(<Grouped />);
    expect(barsOf(pinned).map((bar) => bar.getAttribute('data-color'))).toEqual([
      'gain',
      'ink',
      'gain',
      'ink',
      'gain',
      'ink',
    ]);
    const items = [...pinned.querySelectorAll('.bar-chart-legend-item')];
    expect(items.map((item) => [item.textContent, item.getAttribute('data-color')])).toEqual([
      ['Income', 'gain'],
      ['Spending', 'ink'],
    ]);
    expect(barAt(pinned, 0)).toHaveAccessibleName('Aug Income $5200.00');
    expect(barAt(pinned, 1)).toHaveAccessibleName('Aug Spending $4380.00');
  });

  it("draws a hatched series in the first filled series' color, its amount slate, its key hatched", () => {
    const { container } = render(<Compare />);
    const bars = barsOf(container);
    expect(bars.map((bar) => [bar.getAttribute('data-color'), bar.getAttribute('data-look')])).toEqual([
      ['ink', 'fill'],
      ['ink', 'hatched'],
      ['ink', 'fill'],
      ['ink', 'fill'],
      ['ink', 'hatched'],
    ]);
    // The previous period's amount is slate, by its look; the current period's stays ink.
    const amounts = [...container.querySelectorAll('.bar-chart-amount')];
    expect(amounts.map((amount) => amount.getAttribute('data-look'))).toEqual([
      'fill',
      'hatched',
      'fill',
      'fill',
      'hatched',
    ]);
    const items = [...container.querySelectorAll('.bar-chart-legend-item')];
    expect(items.map((item) => [item.getAttribute('data-color'), item.getAttribute('data-look')])).toEqual([
      ['ink', 'swatch'],
      ['ink', 'hatched'],
    ]);
    // Each bar's name says its period, so the stripes are never the only cue.
    expect(bars[1]).toHaveAccessibleName('Groceries September $590.00');
    // The readout's swatch is striped too.
    focus(bars[1]);
    const lines = [...container.querySelectorAll('.bar-chart-readout-item')];
    expect(lines.map((line) => line.getAttribute('data-look'))).toEqual(['fill', 'hatched']);
    // Income against the last period: green beside striped green.
    const { container: income } = render(
      <Grouped
        series={[
          { ...INCOME, label: 'Income, October' },
          { ...INCOME, label: 'Income, September', color: undefined, look: 'hatched' },
        ]}
        valueLabels="all"
      />,
    );
    expect(barsOf(income).map((bar) => bar.getAttribute('data-color'))).toEqual(
      Array.from({ length: 6 }, () => 'gain'),
    );
    expect(
      [...income.querySelectorAll('.bar-chart-value')].map((label) => label.getAttribute('data-look')),
    ).toEqual(['fill', 'hatched', 'fill', 'hatched', 'fill', 'hatched']);
  });

  it('refuses a third grouped series and a look it does not draw, in the types', () => {
    const three = (
      // @ts-expect-error -- grouped bars hold two series at most, so no layout takes three but a stack
      <BarChart aria-label={NAME} categories={MONTHS} series={[NET, NET, NET]} />
    );
    const striped: BarSeries = {
      label: 'September',
      values: [],
      // @ts-expect-error -- the previous period is hatched; there is no other look
      look: 'striped',
    };
    // A stack takes more, in its own layout.
    const stacked: BarChartProps = {
      'aria-label': NAME,
      categories: MONTHS,
      layout: 'stacked',
      series: [NET, NET, NET],
    };
    expect([three, striped, stacked]).toHaveLength(3);
  });

  /** [name, keys from the third bar (July, a zero), the band focused after, whether the last key was prevented] */
  const KEY_CASES_VERTICAL: [
    string,
    { key: string; ctrlKey?: boolean }[],
    number,
    boolean,
    ('rtl' | 'ltr')?,
  ][] = [
    ['Right', [{ key: 'ArrowRight' }], 3, true],
    ['Left', [{ key: 'ArrowLeft' }], 1, true],
    ['Right past a band with no value', [{ key: 'ArrowRight' }, { key: 'ArrowRight' }], 5, true],
    ['Right at the last, prevented and staying', [{ key: 'End' }, { key: 'ArrowRight' }], 5, true],
    ['Home', [{ key: 'Home' }], 0, true],
    ['End', [{ key: 'End' }], 5, true],
    ['Page Down to the last', [{ key: 'PageDown' }], 5, true],
    ['Page Up to the first', [{ key: 'PageUp' }], 0, true],
    ['Up, not prevented', [{ key: 'ArrowUp' }], 2, false],
    ['Down, not prevented', [{ key: 'ArrowDown' }], 2, false],
    ['Right with Control, ignored', [{ key: 'ArrowRight', ctrlKey: true }], 2, false],
    ['Right, right to left, to the band before', [{ key: 'ArrowRight' }], 1, true, 'rtl'],
    ['Left, right to left, to the band after', [{ key: 'ArrowLeft' }], 3, true, 'rtl'],
    ['Left, left to right inside a right to left page', [{ key: 'ArrowLeft' }], 1, true, 'ltr'],
  ];

  it.each(KEY_CASES_VERTICAL)('moves %s', (_name, keys, band, isPrevented, dir) => {
    const chart = <Chart />;
    const { container } = render(
      dir === undefined ? (
        chart
      ) : dir === 'rtl' ? (
        <div dir="rtl">{chart}</div>
      ) : (
        <div dir="rtl">
          <div dir="ltr">{chart}</div>
        </div>
      ),
    );
    focus(barAt(container, 2));
    let prevented = false;
    for (const key of keys) prevented = !fireEvent.keyDown(focused(), key);
    expect(focusedBand(container)).toBe(band);
    expect(prevented).toBe(isPrevented);
    expect(barsOf(container).filter((bar) => bar.tabIndex === 0)).toEqual([document.activeElement]);
    expect(readoutX(container)).toBe(MONTHS[band]);
  });

  /** [name, the chart, keys from the first bar, the bar focused after by drawn index, whether prevented] */
  const KEY_CASES_GROUPED: [string, 'vertical' | 'horizontal', string[], number, boolean, boolean?][] = [
    ['Right to the second bar of the group', 'vertical', ['ArrowRight'], 1, true],
    ['Right on to the next band', 'vertical', ['ArrowRight', 'ArrowRight'], 2, true],
    ['Left back through the group', 'vertical', ['ArrowRight', 'ArrowRight', 'ArrowLeft'], 1, true],
    ['End, keeping the series', 'vertical', ['ArrowRight', 'End'], 5, true],
    ['Down, not prevented', 'vertical', ['ArrowDown'], 0, false],
    ['Left, right to left, to the second bar', 'vertical', ['ArrowLeft'], 1, true, true],
    ['Down to the second bar of the row', 'horizontal', ['ArrowDown'], 1, true],
    ['Down on to the next row', 'horizontal', ['ArrowDown', 'ArrowDown'], 2, true],
    // September has no Dining, so the row's one bar is next.
    ['Down past a bar with no value', 'horizontal', ['ArrowDown', 'ArrowDown', 'ArrowDown'], 3, true],
    ['Up back through the row', 'horizontal', ['ArrowDown', 'ArrowDown', 'ArrowUp'], 1, true],
    ['Right, not prevented', 'horizontal', ['ArrowRight'], 0, false],
  ];

  it.each(KEY_CASES_GROUPED)(
    'moves %s in a %s grouped chart',
    (_name, orientation, keys, at, isPrevented, rtl) => {
      const chart =
        orientation === 'vertical' ? <Grouped /> : <Compare series={[THIS_PERIOD, LAST_PERIOD]} />;
      const { container } = render(rtl ? <div dir="rtl">{chart}</div> : chart);
      focus(barAt(container, 0));
      let prevented = false;
      for (const key of keys) prevented = !fireEvent.keyDown(focused(), { key });
      expect(document.activeElement).toBe(barAt(container, at));
      expect(prevented).toBe(isPrevented);
      expect(barsOf(container).filter((bar) => bar.tabIndex === 0)).toEqual([barAt(container, at)]);
      expect(barAt(container, at)).toHaveAttribute('data-active', '');
    },
  );

  describe('the pointer', () => {
    /**
     * The bars' box 600px across; each band an equal share of it, and in each band its bars 20px wide from 40%
     * of the band, 2px apart, read from the inline start (the right under dir="rtl").
     */
    const stubBands = (container: HTMLElement, count: number, rtl = false): void => {
      const box = part(container, '.bar-chart-bars');
      const bands = [...container.querySelectorAll('.bar-chart-band')];
      const rect = (left: number, width: number): DOMRect => ({
        left,
        right: left + width,
        width,
        top: 0,
        bottom: 240,
        height: 240,
        x: left,
        y: 0,
        toJSON: () => ({}),
      });
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        if (this === box) return rect(0, 600);
        const band = this.closest('.bar-chart-band');
        if (!band || !this.classList.contains('bar-chart-bar')) return rect(0, 0);
        const at = bands.indexOf(band);
        const place = [...band.querySelectorAll('.bar-chart-bar')].indexOf(this);
        const width = 600 / count;
        const start = at * width + width * 0.4 + place * 22;
        return rect(rtl ? 600 - start - 20 : start, 20);
      });
    };

    it('activates the band under it, dims the others, and clears on leaving', () => {
      const { container } = render(<Chart />);
      stubBands(container, 6);
      const plot = part(container, '.bar-chart-plot');
      fireEvent.pointerMove(plot, { clientX: 250, pointerType: 'mouse' });
      expect(readoutX(container)).toBe('Jul');
      expect(plot).toHaveAttribute('data-pointer', '');
      const active = [...container.querySelectorAll('.bar-chart-band[data-active]')];
      expect(active).toEqual([container.querySelectorAll('.bar-chart-band')[2]]);
      expect(document.activeElement).toBe(document.body);
      // Over September, which has no bar: the nearest band with one.
      fireEvent.pointerMove(plot, { clientX: 450, pointerType: 'mouse' });
      expect(readoutX(container)).toMatch(/^(Aug|Oct)$/);
      fireEvent.pointerLeave(plot, { pointerType: 'mouse' });
      expect(readoutX(container)).toBeNull();
      expect(plot).not.toHaveAttribute('data-pointer');
    });

    it('reads the bands from the right in right to left', () => {
      const { container } = render(
        <div dir="rtl">
          <Chart />
        </div>,
      );
      stubBands(container, 6, true);
      fireEvent.pointerMove(part(container, '.bar-chart-plot'), { clientX: 50, pointerType: 'mouse' });
      expect(readoutX(container)).toBe('Oct');
    });

    it('takes the bar under it in a group, and the first between them', () => {
      const { container } = render(<Grouped />);
      stubBands(container, 3);
      const plot = part(container, '.bar-chart-plot');
      // The third band's second bar: 400 + 80 + 22, and 5px in.
      fireEvent.pointerMove(plot, { clientX: 507, pointerType: 'mouse' });
      expect(barAt(container, 5)).toHaveAttribute('data-active', '');
      fireEvent.pointerMove(plot, { clientX: 410, pointerType: 'mouse' });
      expect(barAt(container, 4)).toHaveAttribute('data-active', '');
      expect(readoutX(container)).toBe('Oct');
    });
  });

  it("puts the readout above the band's highest bar end when its lines fit, else below, never over a bar", () => {
    const { container } = render(<Chart />);
    const readout = (): HTMLElement => part(container, '.bar-chart-readout');
    // August, 310, its top 36.25% down a 240px plot: 87px above it, room for two lines.
    focus(barAt(container, 3));
    expect(readout()).toHaveAttribute('data-place', 'above');
    expect(readout().style.insetBlockEnd).toBe('63.75%');
    expect(readout().style.insetInlineStart).toBe('58.333%');
    expect(readout()).toHaveAttribute('data-align', 'center');
    // June hangs below zero, so above it is the zero line and all the plot over it.
    fireEvent.keyDown(focused(), { key: 'Home' });
    fireEvent.keyDown(focused(), { key: 'ArrowRight' });
    expect(readout()).toHaveAttribute('data-place', 'above');
    expect(readout().style.insetBlockEnd).toBe('25%');
    // May, 420, its top 22.5% down: 54px above, 60px below zero; neither fits, so the side with more.
    fireEvent.keyDown(focused(), { key: 'Home' });
    expect(readout()).toHaveAttribute('data-place', 'below');
    expect(readout().style.insetBlockStart).toBe('75%');
    expect(readout()).toHaveAttribute('data-align', 'start');
    expect(readout()).toHaveAttribute('aria-hidden', 'true');
    // Inside the bars' box, so its percentages are the bars'.
    expect(readout().parentElement).toBe(part(container, '.bar-chart-bars'));
  });

  it('draws the loading state as still bands of the plot height, and the empty and error states in its place', () => {
    const { container } = render(<Chart status="loading" />);
    expect(part(container, '.bar-chart-chart')).toHaveAttribute('aria-busy', 'true');
    expect(part(container, '.bar-chart-status').closest('[aria-busy]')).toBeNull();
    expect(part(container, '.bar-chart-bars').style.blockSize).toBe('240px');
    const skeletons = [...container.querySelectorAll<HTMLElement>('.bar-chart-bars > .skeleton')];
    expect(skeletons.map((skeleton) => skeleton.style.blockSize)).toEqual([
      '60%',
      '85%',
      '45%',
      '70%',
      '60%',
      '85%',
    ]);
    expect(skeletons[1]?.style.getPropertyValue('--bar-chart-centre')).toBe('25%');
    expect(skeletons[0]).toHaveClass('bar-chart-skeleton');
    expect(barsOf(container)).toHaveLength(0);
    expect(container.querySelector('.bar-chart-legend')).toBeNull();
    expect(container.querySelector('table')).toBeNull();

    const { container: empty } = render(<Chart status="empty" />);
    expect(part(empty, '.bar-chart-bars > .bar-chart-state > p.bar-chart-message')).toHaveTextContent(
      'Nothing to show for this period',
    );
    expect(empty.querySelector('.bar-chart-gridlines .bar-chart-baseline')).not.toBeNull();
    expect(empty.querySelector('.bar-chart-toggle')).toBeNull();
    // The category labels stay under the plot, so the figure does not move when the data arrives.
    expect(empty.querySelectorAll('.bar-chart-band-label')).toHaveLength(6);

    const { container: error } = render(<Chart status="error" />);
    expect(part(error, '.bar-chart-message')).toHaveAttribute('data-tone', 'error');
    expect(part(error, '.bar-chart-status')).toHaveTextContent('The chart could not be loaded');
    expect(fireEvent.keyDown(part(error, '.bar-chart-plot'), { key: 'ArrowRight' })).toBe(true);
  });

  it('parks focus on the plot through a status with no bars, and gives it back to the bar when ready', () => {
    const toNothing = watchBody();
    const { container, rerender } = render(<Chart />);
    focus(barAt(container, 3));
    rerender(<Chart status="loading" />);
    expect(document.activeElement).toBe(part(container, '.bar-chart-plot'));
    expect(part(container, '.bar-chart-plot')).toHaveAttribute('tabindex', '-1');
    rerender(<Chart />);
    expect(document.activeElement).toBe(barAt(container, 3));
    // Never a tab stop, and focusable by script in every status.
    expect(part(container, '.bar-chart-plot')).toHaveAttribute('tabindex', '-1');
    rerender(<Chart status="error" />);
    expect(document.activeElement).toBe(part(container, '.bar-chart-plot'));
    rerender(<Chart />);
    expect(document.activeElement).toBe(barAt(container, 3));
    expect(toNothing).not.toHaveBeenCalled();
  });

  it('keeps a press in the plot from focusing it, and leaves a state content its press', () => {
    const { container, rerender } = render(<Chart />);
    expect(fireEvent.mouseDown(part(container, '.bar-chart-bars'))).toBe(false);
    expect(fireEvent.mouseDown(barAt(container, 0))).toBe(false);
    rerender(
      <Chart
        status="error"
        statusContent={
          <button type="button" className="button">
            Try again
          </button>
        }
      />,
    );
    expect(fireEvent.mouseDown(part(container, '.bar-chart-state button'))).toBe(true);
    expect(fireEvent.mouseDown(part(container, '.bar-chart-gridlines'))).toBe(false);
  });

  it('keeps focus off the body when the grouping turns the chart on its side and back', () => {
    const toNothing = watchBody();
    // The same BarChart, as an app's one chart is, with its grouping's props.
    const month = <BarChart aria-label={NAME} categories={MONTHS} series={[NET]} valueDomain={DOMAIN} />;
    const category = (
      <BarChart aria-label={NAME} orientation="horizontal" categories={CATEGORIES} series={[THIS_PERIOD]} />
    );
    const { container, rerender } = render(month);
    focus(barAt(container, 3));
    rerender(category);
    expect(part(container, 'figure')).toHaveAttribute('data-orientation', 'horizontal');
    expect(document.activeElement).toBe(barAt(container, 0));
    focus(barAt(container, 2));
    rerender(month);
    expect(document.activeElement).toBe(barAt(container, 0));
    // The same categories turned on their side keep the bar last active.
    focus(barAt(container, 3));
    rerender(
      <BarChart
        aria-label={NAME}
        orientation="horizontal"
        categories={MONTHS}
        series={[NET]}
        valueDomain={DOMAIN}
      />,
    );
    expect(document.activeElement).toBe(barAt(container, 3));
    expect(toNothing).not.toHaveBeenCalled();
  });

  it('writes no tabindex on the server and its bars in percentages', () => {
    const html = renderToString(<Grouped />);
    expect(html).not.toContain('tabindex');
    expect(html).toContain('class="bar-chart-plot" role="group" aria-roledescription="chart"');
  });

  const AXE_CASES: [string, ReactElement, ((container: HTMLElement) => void)?][] = [
    ['vertical', <Chart key="vertical" />],
    ['with negatives and value labels', <Chart key="labels" valueLabels="all" />],
    [
      'grouped, with a bar focused',
      <Grouped key="grouped" />,
      (container) => {
        focus(barAt(container, 1));
      },
    ],
    [
      'compared with the previous period, with a bar focused',
      <Compare key="compare" />,
      (container) => {
        focus(barAt(container, 1));
      },
    ],
    [
      'vertical, in the table view',
      <Chart key="table" />,
      (container) => {
        fireEvent.click(within(container).getByRole('button', { name: 'Show as table' }));
      },
    ],
    ['vertical, loading', <Chart key="loading" status="loading" />],
    ['vertical, empty', <Chart key="empty" status="empty" />],
    ['vertical, error', <Chart key="error" status="error" />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element, act) => {
    const { container } = render(element);
    act?.(container);
    await expectNoA11yViolations(container);
  });
});
