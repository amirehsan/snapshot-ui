import { act, fireEvent, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { BarChart, type BarChartProps, type BarSeries, type BarValue } from './BarChart';

/** A month's spending by merchant, sorted by the app, with "Other" last and a refund that nets below zero. */
const MERCHANTS = ['Whole Foods Market', 'Shell', 'Netflix', 'Corner Mart', 'Other', 'Apple Store'];

const money = (value: number): BarValue => ({
  value,
  valueLabel: `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`,
});

const OCTOBER: BarSeries = {
  label: 'October',
  values: [money(420), money(260), money(15.49), money(0), money(130), money(-60)],
};

const SEPTEMBER: BarSeries = {
  label: 'September',
  values: [money(380), null, money(15.49), money(22), money(140), money(80)],
};

const NAME = 'Spending by merchant, October';

type ChartProps = Partial<Omit<BarChartProps, 'series' | 'layout'>> & {
  series?: readonly [BarSeries] | readonly [BarSeries, BarSeries];
};

/** The one-series chart most tests read, horizontal. */
const Chart = ({ series = [OCTOBER], ...props }: ChartProps): ReactElement => (
  <BarChart aria-label={NAME} orientation="horizontal" categories={MERCHANTS} series={series} {...props} />
);

const rowsOf = (container: HTMLElement): HTMLElement => {
  const rows = container.querySelector<HTMLElement>('.bar-chart-rows');
  if (!rows) throw new Error('No rows');
  return rows;
};

const barsOf = (container: HTMLElement): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('.bar-chart-bar'),
];

/** The bar at `index`, in drawn order. */
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

/** The category of the row the focused bar is in. */
const focusedCategory = (): string | null =>
  document.activeElement?.closest('.bar-chart-row')?.querySelector('.bar-chart-category')?.textContent ??
  null;

const readoutX = (container: HTMLElement): string | null =>
  container.querySelector('.bar-chart-readout .bar-chart-readout-x')?.textContent ?? null;

const focus = (element: HTMLElement | undefined): void => {
  if (!element) throw new Error('No element');
  act(() => {
    element.focus();
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Records every element that lost focus to nothing, which is focus passing through the body: the chart must
 * never let that happen, whatever its bars do.
 */
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

describe('BarChart', () => {
  it('is exported from the package with its types', () => {
    expect(library.BarChart).toBe(BarChart);
  });

  it("draws a row per category with its label, its bar and its amount, in the app's order", () => {
    const { container } = render(<Chart />);
    const figure = container.querySelector('figure.bar-chart');
    expect(figure).toHaveAttribute('data-orientation', 'horizontal');
    expect(figure).toHaveAttribute('data-layout', 'grouped');
    expect(figure).toHaveAttribute('data-view', 'chart');
    expect(figure).toHaveAttribute('data-status', 'ready');
    const rows = [...container.querySelectorAll('.bar-chart-row')];
    expect(rows.map((row) => row.querySelector('.bar-chart-category')?.textContent)).toEqual(MERCHANTS);
    for (const row of rows) {
      expect(row.querySelectorAll('.bar-chart-track > .bar-chart-bar')).toHaveLength(1);
      expect(row.querySelector('.bar-chart-category')).toHaveAttribute('aria-hidden', 'true');
      expect(row.querySelector('.bar-chart-amounts')).toHaveAttribute('aria-hidden', 'true');
    }
    expect([...container.querySelectorAll('.bar-chart-amount')].map((amount) => amount.textContent)).toEqual([
      '$420.00',
      '$260.00',
      '$15.49',
      '$0.00',
      '$130.00',
      '-$60.00',
    ]);
    const group = rowsOf(container);
    expect(group).toHaveAttribute('role', 'group');
    expect(group).toHaveAttribute('aria-roledescription', 'chart');
    expect(group).toHaveAttribute('aria-label', NAME);
    expect(group.style.getPropertyValue('--bar-chart-rows')).toBe('6');
    expect(group.style.getPropertyValue('--bar-chart-group')).toBe('1');
  });

  it('places a positive bar from zero to its value and a negative one from its value to zero, in percent', () => {
    // Zero sits a sixth of the way along [-100, 500].
    const { container } = render(<Chart valueDomain={[-100, 500]} />);
    const [whole, , , corner, , apple] = barsOf(container);
    expect(whole?.style.insetInlineStart).toBe('16.667%');
    expect(whole?.style.inlineSize).toBe('70%');
    expect(whole).toHaveAttribute('data-sign', 'positive');
    // A negative bar stands on zero from its end, so its least 1px runs toward the start, as it does.
    expect(apple?.style.insetInlineEnd).toBe('83.333%');
    expect(apple?.style.insetInlineStart).toBe('');
    expect(apple?.style.inlineSize).toBe('10%');
    expect(apple).toHaveAttribute('data-sign', 'negative');
    expect(corner?.style.insetInlineStart).toBe('16.667%');
    // The zero line, where the domain crosses zero, is marked so: the boundary color draws it.
    const zero = container.querySelector('.bar-chart-gridlines line.bar-chart-baseline');
    expect(zero).toHaveAttribute('x1', '16.667');
    expect(zero).toHaveAttribute('data-crosses', '');
    // Without negatives the zero line is the domain's edge, a cue in the frame color.
    const { container: positive } = render(<Chart series={[{ ...OCTOBER, values: [money(10)] }]} />);
    const edge = positive.querySelector('.bar-chart-gridlines line.bar-chart-baseline');
    expect(edge).toHaveAttribute('x1', '0');
    expect(edge).not.toHaveAttribute('data-crosses');
  });

  it('marks zero bars data-sign zero without data-nonzero, and draws nothing for null', () => {
    const { container } = render(<Chart series={[SEPTEMBER]} />);
    const rows = [...container.querySelectorAll('.bar-chart-row')];
    // Shell has no value in September: no bar and no amount, but its row and label stay.
    expect(rows[1]?.querySelector('.bar-chart-bar')).toBeNull();
    expect(rows[1]?.querySelector('.bar-chart-amount')).toBeNull();
    expect(rows[1]?.querySelector('.bar-chart-category')).toHaveTextContent('Shell');
    const { container: october } = render(<Chart />);
    const corner = barsOf(october)[3];
    expect(corner).toHaveAttribute('data-sign', 'zero');
    expect(corner).not.toHaveAttribute('data-nonzero');
    expect(corner?.style.inlineSize).toBe('0%');
    for (const bar of barsOf(october).filter((_, at) => at !== 3))
      expect(bar).toHaveAttribute('data-nonzero', '');
  });

  it('drops values past the categories and takes a value that is not finite as none', () => {
    const { container } = render(
      <Chart
        categories={['Shell', 'Netflix']}
        series={[{ label: 'October', values: [money(Number.NaN), money(15), money(99)] }]}
      />,
    );
    expect(barsOf(container)).toHaveLength(1);
    expect(container.querySelectorAll('.bar-chart-amount')).toHaveLength(1);
  });

  it('widens a domain without zero, once, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container, rerender } = render(<Chart valueDomain={[100, 500]} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('BarChart: valueDomain must include 0; widened to [0, 500].');
    // Zero is at the start, so the largest bar runs from 0% to 84%.
    expect(barsOf(container)[0]?.style.insetInlineStart).toBe('0%');
    expect(barsOf(container)[0]?.style.inlineSize).toBe('84%');
    rerender(<Chart valueDomain={[100, 500]} />);
    expect(warn).toHaveBeenCalledTimes(1);
    // A domain from the values always holds zero and says nothing.
    render(<Chart />);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['all', 6, [0, 1, 2, 3, 4, 5]],
    ['none', 0, []],
    [[0, 2], 2, [0, 2]],
  ] as const)('draws amounts for valueLabels %j', (valueLabels, count, rows) => {
    const { container } = render(<Chart valueLabels={valueLabels} />);
    expect(container.querySelectorAll('.bar-chart-amount')).toHaveLength(count);
    const withAmount = [...container.querySelectorAll('.bar-chart-row')].flatMap((row, at) =>
      row.querySelector('.bar-chart-amount') ? [at] : [],
    );
    expect(withAmount).toEqual(rows);
    // Every row keeps its amounts cell, so the grid keeps its three columns.
    expect(container.querySelectorAll('.bar-chart-amounts')).toHaveLength(6);
  });

  it("keeps a negative row's amount in the end column", () => {
    const { container } = render(<Chart />);
    const apple = container.querySelectorAll('.bar-chart-row')[5];
    expect(apple?.querySelector('.bar-chart-amounts .bar-chart-amount')).toHaveTextContent('-$60.00');
  });

  it('names each bar by its row header and its cell, and its column header with two series', () => {
    const { container } = render(<Chart />);
    const bars = barsOf(container);
    expect(bars[0]).toHaveAttribute('role', 'img');
    expect(bars[0]).toHaveAttribute('aria-roledescription', 'bar');
    expect(bars[0]).toHaveAccessibleName('Whole Foods Market $420.00');
    expect(bars[5]).toHaveAccessibleName('Apple Store -$60.00');
    // Each id it names is a header or a cell of the one shown table.
    const table = container.querySelector('table.bar-chart-table');
    for (const id of bars[0]?.getAttribute('aria-labelledby')?.split(' ') ?? []) {
      expect(table?.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
    const { container: two } = render(<Chart series={[OCTOBER, SEPTEMBER]} />);
    const pair = barsOf(two);
    expect(pair[0]).toHaveAccessibleName('Whole Foods Market October $420.00');
    expect(pair[1]).toHaveAccessibleName('Whole Foods Market September $380.00');
    // Shell has no September bar, so its row has one.
    expect(pair[2]).toHaveAccessibleName('Shell October $260.00');
    expect(rowsOf(two).style.getPropertyValue('--bar-chart-group')).toBe('2');
    expect(pair[1]?.style.getPropertyValue('--bar-chart-place')).toBe('1');
    // Two series have a legend that names both, each key in its series' color.
    const items = [...two.querySelectorAll('.bar-chart-legend-item')];
    expect(items.map((item) => item.textContent)).toEqual(['October', 'September']);
    expect(items.map((item) => item.getAttribute('data-color'))).toEqual(['ink', 'slate']);
    expect(pair.map((bar) => bar.getAttribute('data-color')).slice(0, 2)).toEqual(['ink', 'slate']);
    expect(container.querySelector('.bar-chart-legend')).toBeNull();
  });

  it('pins a series to its color', () => {
    const { container } = render(<Chart series={[{ ...OCTOBER, color: 'gain' }]} />);
    expect(barsOf(container)[0]).toHaveAttribute('data-color', 'gain');
  });

  it('writes no tabindex on the server and exactly one tab stop after mount', () => {
    expect(renderToString(<Chart />)).not.toContain('tabindex');
    const { container } = render(<Chart />);
    const stops = barsOf(container).filter((bar) => bar.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(barsOf(container)[0]);
    for (const bar of barsOf(container).slice(1)) expect(bar).toHaveAttribute('tabindex', '-1');
  });

  it('starts time bands at the newest band with a value', () => {
    const { container } = render(
      <Chart bands="time" series={[{ ...OCTOBER, values: [...OCTOBER.values.slice(0, 5), null] }]} />,
    );
    const stop = barsOf(container).find((bar) => bar.tabIndex === 0);
    expect(stop?.closest('.bar-chart-row')?.querySelector('.bar-chart-category')).toHaveTextContent('Other');
  });

  it('lands on the first bar on Tab and moves the tab stop with the active bar', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <button type="button">Before</button>
        <Chart />
      </>,
    );
    await user.click(within(container).getByRole('button', { name: 'Before' }));
    await user.tab();
    expect(focusedCategory()).toBe('Whole Foods Market');
    expect(readoutX(container)).toBe('Whole Foods Market');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(focusedCategory()).toBe('Netflix');
    // Tab leaves for the toggle; Shift Tab comes back to the bar last active.
    await user.tab();
    expect(document.activeElement).toHaveTextContent('Show as table');
    expect(readoutX(container)).toBeNull();
    await user.tab({ shift: true });
    expect(focusedCategory()).toBe('Netflix');
  });

  /** [name, keys from the third bar, the category focused after, whether the last key was prevented] */
  const KEY_CASES: [
    string,
    { key: string; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean }[],
    string,
    boolean,
  ][] = [
    ['Down', [{ key: 'ArrowDown' }], 'Corner Mart', true],
    ['Up', [{ key: 'ArrowUp' }], 'Shell', true],
    ['Home', [{ key: 'Home' }], 'Whole Foods Market', true],
    ['End', [{ key: 'End' }], 'Apple Store', true],
    ['Page Down to the last', [{ key: 'PageDown' }], 'Apple Store', true],
    ['Page Up to the first', [{ key: 'PageUp' }], 'Whole Foods Market', true],
    ['Down at the last, prevented and staying', [{ key: 'End' }, { key: 'ArrowDown' }], 'Apple Store', true],
    ['Left, not prevented', [{ key: 'ArrowLeft' }], 'Netflix', false],
    ['Right, not prevented', [{ key: 'ArrowRight' }], 'Netflix', false],
    ['Down with Control, ignored', [{ key: 'ArrowDown', ctrlKey: true }], 'Netflix', false],
    ['Down with Alt, ignored', [{ key: 'ArrowDown', altKey: true }], 'Netflix', false],
    ['Down with Meta, ignored', [{ key: 'ArrowDown', metaKey: true }], 'Netflix', false],
  ];

  it.each(KEY_CASES)('moves %s', (_name, keys, category, isPrevented) => {
    const { container } = render(<Chart />);
    focus(barsOf(container)[2]);
    let prevented = false;
    for (const key of keys) {
      const target = document.activeElement;
      if (!(target instanceof HTMLElement)) throw new Error('Nothing focused');
      prevented = !fireEvent.keyDown(target, key);
    }
    expect(focusedCategory()).toBe(category);
    expect(prevented).toBe(isPrevented);
    // The moved bar is the one tab stop and the active bar.
    const stops = barsOf(container).filter((bar) => bar.tabIndex === 0);
    expect(stops).toEqual([document.activeElement]);
    expect(document.activeElement).toHaveAttribute('data-active', '');
    expect(readoutX(container)).toBe(category);
  });

  it('hides the readout on Escape once, stopped, and lets the next Escape go on', () => {
    // A listener past the chart, as a Dialog's would be.
    const outer = vi.fn();
    const listener = (event: KeyboardEvent): void => {
      outer(event.key);
    };
    document.addEventListener('keydown', listener);
    onTestFinished(() => {
      document.removeEventListener('keydown', listener);
    });
    const { container } = render(<Chart />);
    focus(barsOf(container)[1]);
    expect(readoutX(container)).toBe('Shell');
    expect(fireEvent.keyDown(barAt(container, 1), { key: 'Escape' })).toBe(false);
    expect(readoutX(container)).toBeNull();
    expect(outer).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(barAt(container, 1), { key: 'Escape' })).toBe(true);
    expect(outer).toHaveBeenCalledWith('Escape');
    // The next move shows it again.
    fireEvent.keyDown(barAt(container, 1), { key: 'ArrowDown' });
    expect(readoutX(container)).toBe('Netflix');
  });

  it('skips a row with no value and reaches a zero', () => {
    const { container } = render(<Chart series={[SEPTEMBER]} />);
    focus(barsOf(container)[0]);
    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    expect(focusedCategory()).toBe('Netflix');
    const { container: october } = render(<Chart />);
    focus(barsOf(october)[2]);
    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    expect(focusedCategory()).toBe('Corner Mart');
  });

  it('resets to the first stop and keeps focus off the body when the categories change', () => {
    const CATEGORIES = ['Groceries', 'Transport', 'Bills'];
    const BY_CATEGORY: BarSeries = { label: 'October', values: [money(640), money(210), money(180)] };
    const toNothing = watchBody();
    // A focused bar whose row the new categories take away.
    const { container, rerender } = render(<Chart />);
    focus(barsOf(container)[4]);
    rerender(<Chart categories={CATEGORIES} series={[BY_CATEGORY]} />);
    expect(document.activeElement).not.toBe(document.body);
    expect(focusedCategory()).toBe('Groceries');
    expect(toNothing).not.toHaveBeenCalled();
    // The group held focus only for the moment the bar was gone.
    expect(rowsOf(container)).not.toHaveAttribute('tabindex');
    expect(barsOf(container).filter((bar) => bar.tabIndex === 0)).toEqual([barsOf(container)[0]]);
    // A focused bar whose row stays: the same element, now another category's, hands focus to the first stop.
    focus(barsOf(container)[1]);
    rerender(<Chart />);
    expect(focusedCategory()).toBe('Whole Foods Market');
    expect(toNothing).not.toHaveBeenCalled();
  });

  it('parks focus on the group through a status with no bars, and gives it to the tab stop when ready', () => {
    const toNothing = watchBody();
    const { container, rerender } = render(<Chart />);
    focus(barAt(container, 2));
    rerender(<Chart status="loading" />);
    expect(document.activeElement).toBe(rowsOf(container));
    expect(rowsOf(container)).toHaveAttribute('tabindex', '-1');
    // The same categories: the bar last active, which is the tab stop.
    rerender(<Chart />);
    expect(focusedCategory()).toBe('Netflix');
    expect(rowsOf(container)).not.toHaveAttribute('tabindex');
    // New categories after an error: their first bar.
    rerender(<Chart status="error" />);
    expect(document.activeElement).toBe(rowsOf(container));
    rerender(
      <Chart
        categories={['Groceries', 'Bills']}
        series={[{ label: 'October', values: [money(640), money(150)] }]}
      />,
    );
    expect(focusedCategory()).toBe('Groceries');
    expect(toNothing).not.toHaveBeenCalled();
  });

  it('takes no focus when a status changes while focus is elsewhere', () => {
    const { container, rerender } = render(
      <>
        <button type="button">Elsewhere</button>
        <Chart />
      </>,
    );
    const elsewhere = within(container).getByRole('button', { name: 'Elsewhere' });
    focus(elsewhere);
    rerender(
      <>
        <button type="button">Elsewhere</button>
        <Chart status="loading" />
      </>,
    );
    rerender(
      <>
        <button type="button">Elsewhere</button>
        <Chart />
      </>,
    );
    expect(elsewhere).toHaveFocus();
  });

  it('resets the tab stop without taking focus when no bar holds it', () => {
    const { container, rerender } = render(
      <>
        <button type="button">Elsewhere</button>
        <Chart />
      </>,
    );
    focus(barsOf(container)[3]);
    focus(within(container).getByRole('button', { name: 'Elsewhere' }));
    expect(barsOf(container)[3]?.tabIndex).toBe(0);
    // The same strings in a new array keep the stop.
    rerender(
      <>
        <button type="button">Elsewhere</button>
        <Chart categories={[...MERCHANTS]} />
      </>,
    );
    expect(barsOf(container)[3]?.tabIndex).toBe(0);
    rerender(
      <>
        <button type="button">Elsewhere</button>
        <Chart categories={MERCHANTS.map((merchant) => `${merchant}, September`)} />
      </>,
    );
    expect(barsOf(container)[0]?.tabIndex).toBe(0);
    expect(document.activeElement).toHaveTextContent('Elsewhere');
  });

  describe('the pointer', () => {
    /** Each row 40px tall, one under the other; each bar 24px, centred in its row. */
    const stubRows = (): void => {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        const row = this.closest('.bar-chart-row');
        const rows = row?.parentElement ? [...row.parentElement.querySelectorAll('.bar-chart-row')] : [];
        const at = row ? rows.indexOf(row) : 0;
        const isBar = this.classList.contains('bar-chart-bar');
        const top = at * 40 + (isBar ? 8 : 0);
        const height = isBar ? 24 : 40;
        return {
          left: 0,
          right: 300,
          width: 300,
          top,
          bottom: top + height,
          height,
          x: 0,
          y: top,
          toJSON: () => ({}),
        };
      });
    };

    it('activates the row under it, dims the others, and clears on leaving', () => {
      const { container } = render(<Chart />);
      stubRows();
      const rows = rowsOf(container);
      fireEvent.pointerMove(rows, { clientY: 100, pointerType: 'mouse' });
      expect(readoutX(container)).toBe('Netflix');
      expect(rows).toHaveAttribute('data-pointer', '');
      const active = [...container.querySelectorAll('.bar-chart-row[data-active]')];
      expect(active).toHaveLength(1);
      expect(active[0]?.querySelector('.bar-chart-category')).toHaveTextContent('Netflix');
      // A pointer does not move focus.
      expect(document.activeElement).toBe(document.body);
      // Past the last row, the nearest.
      fireEvent.pointerMove(rows, { clientY: 400, pointerType: 'mouse' });
      expect(readoutX(container)).toBe('Apple Store');
      fireEvent.pointerLeave(rows, { pointerType: 'mouse' });
      expect(readoutX(container)).toBeNull();
      expect(rows).not.toHaveAttribute('data-pointer');
    });

    it('gives the active mark back to a focused bar on leaving, with nothing dimmed', () => {
      const { container } = render(<Chart />);
      stubRows();
      focus(barsOf(container)[0]);
      const rows = rowsOf(container);
      fireEvent.pointerMove(rows, { clientY: 140, pointerType: 'mouse' });
      expect(readoutX(container)).toBe('Corner Mart');
      fireEvent.pointerLeave(rows, { pointerType: 'mouse' });
      expect(readoutX(container)).toBe('Whole Foods Market');
      expect(rows).not.toHaveAttribute('data-pointer');
    });

    it('leaves the tab stop where it was when a mouse passes over', () => {
      const { container } = render(<Chart />);
      stubRows();
      focus(barAt(container, 1));
      act(() => {
        barAt(container, 1).blur();
      });
      fireEvent.pointerMove(rowsOf(container), { clientY: 180, pointerType: 'mouse' });
      expect(readoutX(container)).toBe('Other');
      expect(barsOf(container).filter((bar) => bar.tabIndex === 0)).toEqual([barAt(container, 1)]);
    });

    it('takes no focus from a tap on a bar, so a tap on another row holds that row', async () => {
      const user = userEvent.setup();
      const { container } = render(<Chart />);
      stubRows();
      await user.pointer({ keys: '[TouchA]', target: barAt(container, 0), coords: { clientY: 20 } });
      expect(barAt(container, 0)).not.toHaveFocus();
      expect(readoutX(container)).toBe('Whole Foods Market');
      // The third row's empty track, past its bar's end.
      const track = container.querySelectorAll<HTMLElement>('.bar-chart-track')[2];
      if (!track) throw new Error('No track');
      await user.pointer({ keys: '[TouchA]', target: track, coords: { clientY: 100 } });
      expect(readoutX(container)).toBe('Netflix');
      const active = [...container.querySelectorAll('.bar-chart-row[data-active]')];
      expect(active.map((row) => row.querySelector('.bar-chart-category')?.textContent)).toEqual(['Netflix']);
    });

    it('holds a touch until a press outside', () => {
      const { container } = render(
        <>
          <p>Outside</p>
          <Chart />
        </>,
      );
      stubRows();
      fireEvent.pointerDown(rowsOf(container), { clientY: 20, pointerType: 'touch' });
      expect(readoutX(container)).toBe('Whole Foods Market');
      fireEvent.pointerLeave(rowsOf(container), { pointerType: 'touch' });
      expect(readoutX(container)).toBe('Whole Foods Market');
      fireEvent.pointerDown(within(container).getByText('Outside'), { pointerType: 'touch' });
      expect(readoutX(container)).toBeNull();
    });
  });

  it('puts the readout above the active row when its lines fit and below it otherwise, never over the bar', () => {
    const { container } = render(<Chart />);
    focus(barsOf(container)[0]);
    const readout = (): HTMLElement | null => container.querySelector('.bar-chart-readout');
    // The first row has nothing above it.
    expect(readout()).toHaveAttribute('data-place', 'below');
    expect(readout()?.style.insetBlockStart).toBe('100%');
    expect(readout()?.style.getPropertyValue('--bar-chart-row')).toBe('1');
    expect(readout()?.style.getPropertyValue('--bar-chart-row-narrow')).toBe('2');
    fireEvent.keyDown(focused(), { key: 'End' });
    expect(readout()).toHaveAttribute('data-place', 'above');
    expect(readout()?.style.insetBlockEnd).toBe('100%');
    expect(readout()?.style.getPropertyValue('--bar-chart-row')).toBe('6');
    // At the negative bar's far end, which is its start: a sixth of the way along [-200, 600].
    expect(readout()?.style.insetInlineStart).toBe('17.5%');
    expect(readout()).toHaveAttribute('data-align', 'start');
    expect(readout()).toHaveAttribute('aria-hidden', 'true');
    const lines = [...(readout()?.querySelectorAll('li') ?? [])].map((line) => line.textContent);
    expect(lines).toEqual(['-$60.00October']);
  });

  it('adds a total line to the readout and a Total column to the table', () => {
    const { container } = render(
      <Chart series={[OCTOBER, SEPTEMBER]} totals={['$800.00', '$260.00', null, null, null, null]} />,
    );
    focus(barsOf(container)[0]);
    const lines = [...container.querySelectorAll('.bar-chart-readout li')].map((line) => line.textContent);
    expect(lines).toEqual(['$420.00October', '$380.00September', '$800.00Total']);
    const headers = [...container.querySelectorAll('table.bar-chart-table thead th')].map(
      (th) => th.textContent,
    );
    expect(headers).toEqual(['October', 'September', 'Total']);
  });

  it('shows only the labels categoryTicks names, keeping every row', () => {
    const { container } = render(<Chart categoryTicks={[0, 5]} />);
    const labels = [...container.querySelectorAll('.bar-chart-category')].map((label) => label.textContent);
    expect(labels).toEqual(['Whole Foods Market', '', '', '', '', 'Apple Store']);
  });

  it('draws value ticks under the last row, kept inside the track at its ends', () => {
    const { container } = render(
      <Chart
        valueDomain={[-200, 600]}
        valueTicks={[
          { value: -200, label: '-$200' },
          { value: 0, label: '$0' },
          { value: 600, label: '$600' },
          { value: 800, label: '$800' },
        ]}
      />,
    );
    const ticks = [...container.querySelectorAll<HTMLElement>('.bar-chart-ticks .bar-chart-tick')];
    expect(ticks.map((tick) => tick.textContent)).toEqual(['-$200', '$0', '$600']);
    expect(ticks.map((tick) => tick.getAttribute('data-edge'))).toEqual(['start', null, 'end']);
    expect(ticks[1]?.style.insetInlineStart).toBe('25%');
    expect(container.querySelectorAll('.bar-chart-gridlines line.bar-chart-grid')).toHaveLength(3);
    expect(container.querySelector('.bar-chart-ticks')).toHaveAttribute('aria-hidden', 'true');
  });

  it('warns once when asked for vertical bars, which this version draws lying down', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(<BarChart aria-label={NAME} categories={MERCHANTS} series={[OCTOBER]} />);
    expect(container.querySelector('figure')).toHaveAttribute('data-orientation', 'horizontal');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  const STATES = [
    ['loading', 'Loading'],
    ['empty', ''],
    ['error', 'The chart could not be loaded'],
  ] as const;

  it.each(STATES)(
    "draws the %s state in the rows' place, keeps its size, and says it once",
    (status, said) => {
      const { container } = render(<Chart status={status} />);
      const figure = container.querySelector('figure');
      expect(figure).toHaveAttribute('data-status', status);
      const rows = rowsOf(container);
      // As tall as the rows it expects.
      expect(rows.style.getPropertyValue('--bar-chart-rows')).toBe('6');
      expect(barsOf(container)).toHaveLength(0);
      // The gridlines' layer and its zero line stay.
      expect(container.querySelector('.bar-chart-gridlines .bar-chart-baseline')).not.toBeNull();
      expect(container.querySelector('.bar-chart-toggle')).toBeNull();
      expect(container.querySelector('noscript')).toBeNull();
      const host = container.querySelector('.bar-chart-status');
      expect(host).toHaveAttribute('role', 'status');
      expect(host?.textContent).toBe(said);
      if (status === 'loading') {
        expect(figure).toHaveAttribute('aria-busy', 'true');
        const skeletons = [...container.querySelectorAll<HTMLElement>('.bar-chart-track > .skeleton')];
        expect(skeletons.map((skeleton) => skeleton.style.inlineSize)).toEqual([
          '70%',
          '50%',
          '85%',
          '40%',
          '70%',
          '50%',
        ]);
        expect(container.querySelector('table')).toBeNull();
        for (const row of container.querySelectorAll('.bar-chart-row'))
          expect(row).toHaveAttribute('aria-hidden', 'true');
      } else {
        expect(figure).not.toHaveAttribute('aria-busy');
        const message = container.querySelector('.bar-chart-state > p.bar-chart-message');
        expect(message).toHaveTextContent(
          status === 'error' ? 'The chart could not be loaded' : 'Nothing to show for this period',
        );
        if (status === 'error') expect(message).toHaveAttribute('data-tone', 'error');
        else expect(message).not.toHaveAttribute('data-tone');
        expect(container.querySelector('table')).toHaveAttribute('hidden');
      }
      // Keys do nothing while it is not ready.
      expect(fireEvent.keyDown(rows, { key: 'ArrowDown' })).toBe(true);
    },
  );

  it.each(['loading', 'empty', 'error'] as const)(
    'keeps the value labels and their gridlines while %s, so nothing moves when the data arrives',
    (status) => {
      const TICKS = [
        { value: 0, label: '$0' },
        { value: 250, label: '$250' },
        { value: 500, label: '$500' },
      ];
      const { container } = render(<Chart status={status} valueDomain={[0, 500]} valueTicks={TICKS} />);
      expect([...container.querySelectorAll('.bar-chart-tick')].map((tick) => tick.textContent)).toEqual([
        '$0',
        '$250',
        '$500',
      ]);
      expect(container.querySelectorAll('.bar-chart-gridlines line.bar-chart-grid')).toHaveLength(3);
      // With no domain of its own, the row of labels still keeps its place.
      const { container: bare } = render(<Chart status={status} valueTicks={TICKS} />);
      expect(bare.querySelector('.bar-chart-ticks')).not.toBeNull();
    },
  );

  it('keeps four rows of room when it expects no categories, and writes nothing to its status on the server', () => {
    const { container } = render(<Chart status="loading" categories={[]} />);
    expect(rowsOf(container).style.getPropertyValue('--bar-chart-rows')).toBe('4');
    expect(container.querySelectorAll('.bar-chart-track > .skeleton')).toHaveLength(4);
    const html = renderToString(<Chart status="loading" />);
    expect(html).toMatch(/<span class="bar-chart-status" role="status"><\/span>/);
  });

  it('takes its own status strings', () => {
    const { container } = render(
      <Chart
        status="error"
        statusLabels={{ loading: 'در حال بارگذاری', empty: 'چیزی نیست', error: 'بار نشد' }}
      />,
    );
    expect(container.querySelector('.bar-chart-message')).toHaveTextContent('بار نشد');
    expect(container.querySelector('.bar-chart-status')).toHaveTextContent('بار نشد');
  });

  it.each(['empty', 'error'] as const)('draws statusContent for %s', (status) => {
    const { container } = render(
      <Chart
        status={status}
        statusContent={
          <div className="empty-state">
            <p className="empty-state-title">No spending yet</p>
          </div>
        }
      />,
    );
    expect(container.querySelector('.bar-chart-state > .empty-state')).toHaveTextContent('No spending yet');
    expect(container.querySelector('.bar-chart-message')).toBeNull();
  });

  it('swaps the chart and the table, keeping focus on the toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<Chart />);
    const toggle = within(container).getByRole('button', { name: 'Show as table' });
    const table = container.querySelector('table.bar-chart-table');
    expect(table).toHaveAttribute('hidden');
    await user.click(toggle);
    expect(table).not.toHaveAttribute('hidden');
    expect(container.querySelector('.bar-chart-chart')).toHaveAttribute('hidden');
    expect(container.querySelector('figure')).toHaveAttribute('data-view', 'table');
    expect(toggle).toHaveTextContent('Show as chart');
    expect(toggle).toHaveFocus();
    expect(within(container).getByRole('table', { name: NAME })).toBe(table);
    const rows = [...(table?.querySelectorAll('tbody tr') ?? [])].map((row) =>
      [...row.children].map((cell) => cell.textContent),
    );
    expect(rows[5]).toEqual(['Apple Store', '-$60.00']);
    await user.click(toggle);
    expect(table).toHaveAttribute('hidden');
    expect(toggle).toHaveFocus();
  });

  it('takes its own strings, so a Persian page hears no English', () => {
    const { container } = render(
      <Chart
        labels={{
          showTable: 'نمایش جدول',
          showChart: 'نمایش نمودار',
          noScript: 'اسکریپت‌ها خاموش‌اند.',
          roleDescription: 'نمودار',
          bar: 'میله',
          total: 'جمع',
        }}
      />,
    );
    expect(rowsOf(container)).toHaveAttribute('aria-roledescription', 'نمودار');
    expect(barsOf(container)[0]).toHaveAttribute('aria-roledescription', 'میله');
    expect(within(container).getByRole('button')).toHaveTextContent('نمایش جدول');
  });

  it('names the figure and the table by aria-labelledby, with no caption', () => {
    const { container } = render(
      <>
        <h2 id="merchants">Merchants</h2>
        <BarChart
          aria-labelledby="merchants"
          orientation="horizontal"
          categories={MERCHANTS}
          series={[OCTOBER]}
        />
      </>,
    );
    expect(container.querySelector('figure')).toHaveAccessibleName('Merchants');
    expect(rowsOf(container)).toHaveAccessibleName('Merchants');
    expect(container.querySelector('caption')).toBeNull();
    expect(container.querySelector('table')).toHaveAttribute('aria-labelledby', 'merchants');
  });

  it('passes className, attributes and ref to the figure', () => {
    let figure: HTMLElement | null = null;
    render(
      <Chart
        className="spending"
        data-testid="chart"
        ref={(element) => {
          figure = element;
        }}
      />,
    );
    expect(figure).toHaveClass('bar-chart', 'spending');
    expect(figure).toHaveAttribute('data-testid', 'chart');
  });

  const AXE_CASES: [string, ReactElement, ((container: HTMLElement) => void)?][] = [
    ['ready', <Chart key="ready" />],
    [
      'with a bar focused',
      <Chart key="focused" series={[OCTOBER, SEPTEMBER]} />,
      (container) => {
        focus(barsOf(container)[1]);
      },
    ],
    [
      'in the table view',
      <Chart key="table" />,
      (container) => {
        fireEvent.click(within(container).getByRole('button', { name: 'Show as table' }));
      },
    ],
    ['loading', <Chart key="loading" status="loading" />],
    ['empty', <Chart key="empty" status="empty" />],
    ['error', <Chart key="error" status="error" />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element, act) => {
    const { container } = render(element);
    act?.(container);
    await expectNoA11yViolations(container);
  });
});
