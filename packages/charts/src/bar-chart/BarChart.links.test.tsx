import { act, fireEvent, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { BarChart, type BarChartProps, type BarSeries, type BarValue } from './BarChart';

/*
 * Bars that link: an href per datum, so every bar of every series opens what it stands for, as a real anchor
 * that works before hydration, from a server page and with a modifier key; a press anywhere in the band follows
 * the link of the bar under the pointer; the table's category cells link too; and `onBarPress` and `navigate`
 * for an app that acts on a press or routes it. The faces' own tests are in the other BarChart test files.
 */

/** An amount as the app formats it, and the transactions it stands for. */
const money = (value: number, href?: string): BarValue => ({
  value,
  valueLabel: `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`,
  ...(href === undefined ? {} : { href }),
});

const MERCHANTS = ['Whole Foods Market', 'Shell', 'Netflix', 'Apple Store'];

const KEYS = ['whole-foods', 'shell', 'netflix', 'apple'];

/** October by merchant, each bar a link to its transactions; Netflix has no value, Apple Store a refund. */
const OCTOBER: BarSeries = {
  label: 'October',
  values: [420, 260, null, -60].map((value, at) =>
    value === null ? null : money(value, `#transactions?merchant=${KEYS[at] ?? ''}`),
  ),
};

/** September, the previous period, each bar a link to that month's transactions; Shell has none. */
const SEPTEMBER: BarSeries = {
  label: 'September',
  look: 'hatched',
  values: [380, null, 15.49, 80].map((value, at) =>
    value === null ? null : money(value, `#transactions?merchant=${KEYS[at] ?? ''}&period=2026-09`),
  ),
};

const NAME = 'Spending by merchant, October';

type ChartProps = Partial<Omit<BarChartProps, 'series' | 'layout'>> & {
  series?: readonly [BarSeries] | readonly [BarSeries, BarSeries];
};

/** The ranked list lying down, every bar a link. */
const Chart = ({ series = [OCTOBER], ...props }: ChartProps): ReactElement => (
  <BarChart aria-label={NAME} orientation="horizontal" categories={MERCHANTS} series={series} {...props} />
);

const part = (container: HTMLElement, selector: string): HTMLElement => {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
};

const all = (container: HTMLElement, selector: string): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>(selector),
];

const barAt = (container: HTMLElement, index: number): HTMLElement => {
  const bar = all(container, '.bar-chart-bar')[index];
  if (!bar) throw new Error(`No bar ${String(index)}`);
  return bar;
};

const hitAt = (container: HTMLElement, index: number): HTMLElement => {
  const hit = all(container, '.bar-chart-hit')[index];
  if (!hit) throw new Error(`No hit ${String(index)}`);
  return hit;
};

const readoutX = (container: HTMLElement): string | null =>
  container.querySelector('.bar-chart-readout .bar-chart-readout-x')?.textContent ?? null;

const focus = (element: HTMLElement): void => {
  act(() => {
    element.focus();
  });
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('BarChart links', () => {
  it('draws a bar with an href as an anchor named by its cells, and one without as an image', () => {
    const { container } = render(
      <Chart series={[{ ...OCTOBER, values: [money(420, '#wfm'), money(260), null, money(-60)] }]} />,
    );
    const [linked, plain] = [barAt(container, 0), barAt(container, 1)];
    expect(linked.tagName).toBe('A');
    expect(linked).toHaveAttribute('href', '#wfm');
    // A link says it is a link: no role of its own and no role description over it.
    expect(linked).not.toHaveAttribute('role');
    expect(linked).not.toHaveAttribute('aria-roledescription');
    expect(within(container).getByRole('link', { name: 'Whole Foods Market $420.00' })).toBe(linked);
    expect(plain.tagName).toBe('SPAN');
    expect(plain).toHaveAttribute('role', 'img');
    expect(plain).toHaveAttribute('aria-roledescription', 'bar');
    // The link takes the bar's class, its states and its place, as a bar with no href is drawn.
    const { container: unlinked } = render(
      <Chart series={[{ ...OCTOBER, values: [money(420), money(260), null, money(-60)] }]} />,
    );
    expect(linked.className).toBe('bar-chart-bar');
    expect(linked.getAttribute('style')).toBe(barAt(unlinked, 0).getAttribute('style'));
    for (const name of ['data-color', 'data-look', 'data-sign', 'data-nonzero'])
      expect(linked.getAttribute(name)).toBe(barAt(unlinked, 0).getAttribute(name));
  });

  it('makes a bar a button when the chart takes a press and the bar has no href', () => {
    const { container } = render(
      <Chart series={[{ ...OCTOBER, values: [money(420), money(260)] }]} onBarPress={vi.fn()} />,
    );
    expect(barAt(container, 0)).toHaveAttribute('role', 'button');
    expect(barAt(container, 0)).not.toHaveAttribute('aria-roledescription');
    expect(within(container).getByRole('button', { name: 'Whole Foods Market $420.00' })).toBe(
      barAt(container, 0),
    );
    expect(part(container, '.bar-chart-rows')).toHaveAttribute('data-press', '');
  });

  it('writes the links and their targets on the server, every link a stop until scripts run', () => {
    const html = renderToString(<Chart />);
    expect(html).toContain('<a class="bar-chart-bar" href="#transactions?merchant=whole-foods"');
    // The bars write no tabindex on the server, so with scripts off or before hydration each link is a stop.
    expect(html).not.toMatch(/<a class="bar-chart-bar"[^>]*tabindex/);
    // Each link's target in its band is hidden from assistive technology and never a stop.
    const hits = [...html.matchAll(/<a class="bar-chart-hit"[^>]*>/g)].map((match) => match[0]);
    expect(hits).toHaveLength(3);
    for (const hit of hits) {
      expect(hit).toContain('aria-hidden="true"');
      expect(hit).toContain('tabindex="-1"');
    }
    expect(hits[0]).toContain('href="#transactions?merchant=whole-foods"');
  });

  it('keeps one tab stop among the links once mounted, moved by the keys', async () => {
    const user = userEvent.setup();
    const { container } = render(<Chart />);
    expect(all(container, '.bar-chart-bar').map((bar) => bar.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
    ]);
    await user.tab();
    expect(document.activeElement).toBe(barAt(container, 0));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(barAt(container, 1));
    expect(readoutX(container)).toBe('Shell');
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(barAt(container, 2));
  });

  describe('a press', () => {
    it('on a bar calls onBarPress with its band and series and lets the link go on', () => {
      const onBarPress = vi.fn();
      const { container } = render(<Chart series={[OCTOBER, SEPTEMBER]} onBarPress={onBarPress} />);
      // Shell has no September, so the fifth bar is Netflix's September.
      const click = fireEvent.click(barAt(container, 3));
      expect(onBarPress).toHaveBeenCalledExactlyOnceWith(2, 1);
      // Not prevented: the browser follows the link.
      expect(click).toBe(true);
    });

    it('routes a plain press through navigate in place of the browser', () => {
      const navigate = vi.fn();
      const { container } = render(<Chart navigate={navigate} />);
      expect(fireEvent.click(barAt(container, 1))).toBe(false);
      expect(navigate).toHaveBeenCalledExactlyOnceWith('#transactions?merchant=shell');
    });

    it.each([
      ['Control', { ctrlKey: true }],
      ['Meta', { metaKey: true }],
      ['Shift', { shiftKey: true }],
      ['Alt', { altKey: true }],
      ['the middle button', { button: 1 }],
    ])('leaves a click with %s to the browser: a new tab or window, no press', (_name, init) => {
      const navigate = vi.fn();
      const onBarPress = vi.fn();
      const { container } = render(<Chart navigate={navigate} onBarPress={onBarPress} />);
      for (const target of [barAt(container, 0), hitAt(container, 0)])
        expect(fireEvent.click(target, init)).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
      expect(onBarPress).not.toHaveBeenCalled();
    });

    it("anywhere in the band follows its bar's link through the band's target", () => {
      const navigate = vi.fn();
      const onBarPress = vi.fn();
      const { container } = render(<Chart navigate={navigate} onBarPress={onBarPress} />);
      const hit = hitAt(container, 1);
      fireEvent.pointerMove(hit, { pointerType: 'mouse' });
      // The pointer's band is the target's: the readout says what a press opens.
      expect(readoutX(container)).toBe('Shell');
      expect(fireEvent.click(hit)).toBe(false);
      expect(navigate).toHaveBeenCalledExactlyOnceWith('#transactions?merchant=shell');
      expect(onBarPress).toHaveBeenCalledExactlyOnceWith(1, 0);
      // A pointer moves no focus.
      expect(document.activeElement).toBe(document.body);
    });

    it('anywhere in the band presses its bar when the bars are buttons', () => {
      const onBarPress = vi.fn();
      const { container } = render(
        <Chart series={[{ ...OCTOBER, values: [money(420), money(260)] }]} onBarPress={onBarPress} />,
      );
      const rows = part(container, '.bar-chart-rows');
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        const row = [...rows.querySelectorAll('.bar-chart-row')].findIndex((each) => each.contains(this));
        const top = row * 40;
        return {
          top,
          bottom: top + 40,
          left: 0,
          right: 100,
          width: 100,
          height: 40,
          x: 0,
          y: top,
        } as DOMRect;
      });
      fireEvent.pointerMove(rows, { clientY: 50, pointerType: 'mouse' });
      fireEvent.click(rows);
      expect(onBarPress).toHaveBeenCalledExactlyOnceWith(1, 0);
    });

    it('outside every target in a chart of links follows nothing', () => {
      const navigate = vi.fn();
      const onBarPress = vi.fn();
      const { container } = render(<Chart navigate={navigate} onBarPress={onBarPress} />);
      fireEvent.pointerMove(hitAt(container, 0), { pointerType: 'mouse' });
      fireEvent.click(part(container, '.bar-chart-rows'));
      expect(navigate).not.toHaveBeenCalled();
      expect(onBarPress).not.toHaveBeenCalled();
    });

    it('by a tap follows the link, and by a hold shows the readout and follows nothing', () => {
      vi.useFakeTimers();
      const navigate = vi.fn();
      const { container } = render(<Chart navigate={navigate} />);
      const hit = hitAt(container, 1);
      // A hold: the readout under the finger, the platform's link menu kept away, and no link followed.
      fireEvent.pointerDown(hit, { pointerType: 'touch' });
      expect(readoutX(container)).toBe('Shell');
      expect(fireEvent.contextMenu(hit)).toBe(false);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      fireEvent.pointerUp(hit, { pointerType: 'touch' });
      expect(fireEvent.click(hit)).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
      expect(readoutX(container)).toBe('Shell');
      // A tap follows it.
      fireEvent.pointerDown(hit, { pointerType: 'touch' });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.pointerUp(hit, { pointerType: 'touch' });
      fireEvent.click(hit);
      expect(navigate).toHaveBeenCalledExactlyOnceWith('#transactions?merchant=shell');
    });

    it("keeps a mouse's context menu, which opens the link in a new tab", () => {
      const { container } = render(<Chart />);
      fireEvent.pointerDown(hitAt(container, 0), { pointerType: 'mouse', button: 2 });
      expect(fireEvent.contextMenu(hitAt(container, 0))).toBe(true);
    });
  });

  describe('the keys', () => {
    it('take Enter to the link, which presses and routes, and keep Space from scrolling the page', () => {
      const navigate = vi.fn();
      const onBarPress = vi.fn();
      const { container } = render(<Chart navigate={navigate} onBarPress={onBarPress} />);
      const bar = barAt(container, 1);
      focus(bar);
      // Enter is the link's own: the browser clicks it, with no pointer.
      expect(fireEvent.keyDown(bar, { key: 'Enter' })).toBe(true);
      fireEvent.click(bar, { detail: 0 });
      expect(onBarPress).toHaveBeenCalledExactlyOnceWith(1, 0);
      expect(navigate).toHaveBeenCalledExactlyOnceWith('#transactions?merchant=shell');
      // Space on a link is no press, and does not scroll the page from under the chart.
      expect(fireEvent.keyDown(bar, { key: ' ' })).toBe(false);
      expect(onBarPress).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(bar);
    });

    it('press a button bar on Enter and on Space', () => {
      const onBarPress = vi.fn();
      const { container } = render(
        <Chart series={[{ ...OCTOBER, values: [money(420), money(260)] }]} onBarPress={onBarPress} />,
      );
      focus(barAt(container, 1));
      expect(fireEvent.keyDown(barAt(container, 1), { key: 'Enter' })).toBe(false);
      expect(fireEvent.keyDown(barAt(container, 1), { key: ' ' })).toBe(false);
      expect(onBarPress.mock.calls).toEqual([
        [1, 0],
        [1, 0],
      ]);
    });

    it('leave Space and Enter alone on a bar that neither links nor presses', () => {
      const { container } = render(<Chart series={[{ ...OCTOBER, values: [money(420), money(260)] }]} />);
      focus(barAt(container, 0));
      expect(fireEvent.keyDown(barAt(container, 0), { key: ' ' })).toBe(true);
      expect(fireEvent.keyDown(barAt(container, 0), { key: 'Enter' })).toBe(true);
    });
  });

  describe("each link's target in its band", () => {
    it('lying down: the whole row for its first bar, and the half under it for the second', () => {
      const { container } = render(<Chart series={[OCTOBER, SEPTEMBER]} />);
      const hits = all(container, '.bar-chart-hit');
      // Whole Foods both, Shell October, Netflix September, Apple Store both.
      expect(hits.map((hit) => hit.getAttribute('href'))).toEqual([
        '#transactions?merchant=whole-foods',
        '#transactions?merchant=whole-foods&period=2026-09',
        '#transactions?merchant=shell',
        '#transactions?merchant=netflix&period=2026-09',
        '#transactions?merchant=apple',
        '#transactions?merchant=apple&period=2026-09',
      ]);
      expect(hits.map((hit) => hit.hasAttribute('data-whole'))).toEqual([
        true,
        false,
        true,
        true,
        true,
        false,
      ]);
      // Placed in its row's grid area, and on a narrow chart in its name's line and its bars' line.
      const rows = (hit: HTMLElement | undefined): string[] =>
        ['--bar-chart-row', '--bar-chart-row-narrow'].map((name) => hit?.style.getPropertyValue(name) ?? '');
      expect(rows(hits[0])).toEqual(['1', '1']);
      expect(rows(hits[1])).toEqual(['1', '2']);
      expect(rows(hits[5])).toEqual(['4', '8']);
    });

    it("standing up: the band's column for its first bar, and the half nearer the second", () => {
      const { container } = render(<Chart orientation="vertical" series={[OCTOBER, SEPTEMBER]} />);
      const hits = all(container, '.bar-chart-hit');
      expect(hits[0]?.style.insetInlineStart).toBe('0%');
      expect(hits[0]?.style.inlineSize).toBe('25%');
      expect(hits[1]?.style.insetInlineStart).toBe('12.5%');
      expect(hits[1]?.style.inlineSize).toBe('12.5%');
      // Netflix has only September, so its one bar takes the whole band.
      expect(hits[3]?.style.insetInlineStart).toBe('50%');
      expect(hits[3]?.style.inlineSize).toBe('25%');
      // Each target sits in the band with its bars, after them.
      expect(hits[1]?.parentElement).toBe(barAt(container, 1).parentElement);
    });

    it('in a stack: the band for its first segment, and each other its own run, the outermost to the edge', () => {
      const linked = (label: string, values: number[]): BarSeries => ({
        label,
        values: values.map((value, at) => money(value, `#t?c=${label}&m=${String(at)}`)),
      });
      const { container } = render(
        <BarChart
          aria-label="Spending by category and month"
          categories={['May', 'Jun']}
          layout="stacked"
          valueDomain={[-100, 300]}
          series={[
            linked('Groceries', [100, -50]),
            linked('Shopping', [-40, 60]),
            linked('Travel', [30, -20]),
          ]}
        />,
      );
      const hits = all(container, '.bar-chart-hit');
      // May: Groceries 0 to 100 (the band), Shopping -40 to 0 (outermost below), Travel 100 to 130 (outermost above).
      expect(hits.map((hit) => hit.hasAttribute('data-whole'))).toEqual([
        true,
        false,
        false,
        true,
        false,
        false,
      ]);
      expect(hits[1]?.style.insetBlockStart).toBe('75%');
      expect(hits[1]?.style.insetBlockEnd).toBe('');
      expect(hits[2]?.style.insetBlockStart).toBe('');
      expect(hits[2]?.style.insetBlockEnd).toBe('50%');
      expect(hits[2]?.style.insetInlineStart).toBe('0%');
      expect(hits[2]?.style.inlineSize).toBe('50%');
    });

    it('takes the pointer to the bar it stands for, so the readout says what a press opens', () => {
      const { container } = render(<Chart orientation="vertical" series={[OCTOBER, SEPTEMBER]} />);
      fireEvent.pointerMove(hitAt(container, 3), { pointerType: 'mouse' });
      expect(barAt(container, 3)).toHaveAttribute('data-active', '');
      expect(readoutX(container)).toBe('Netflix');
      fireEvent.pointerMove(hitAt(container, 1), { pointerType: 'mouse' });
      expect(barAt(container, 1)).toHaveAttribute('data-active', '');
    });
  });

  describe('the table', () => {
    it("links each category cell of one series to its bar's href, once a row", () => {
      const { container } = render(<Chart />);
      const table = part(container, 'table');
      const links = within(table).getAllByRole('link', { hidden: true });
      expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
        ['Whole Foods Market', '#transactions?merchant=whole-foods'],
        ['Shell', '#transactions?merchant=shell'],
        ['Apple Store', '#transactions?merchant=apple'],
      ]);
      expect(links[0]).toHaveClass('link');
      expect(links[0]?.closest('th')).toHaveAttribute('scope', 'row');
      // The bar is still named by the row header's text and its cell.
      expect(within(container).getByRole('link', { name: 'Whole Foods Market $420.00' })).toBe(
        barAt(container, 0),
      );
    });

    it('links each value cell of two series, named as its bar is', () => {
      const { container } = render(<Chart series={[OCTOBER, SEPTEMBER]} />);
      const table = part(container, 'table');
      const links = within(table).getAllByRole('link', { hidden: true });
      expect(links).toHaveLength(6);
      expect(links.every((link) => link.closest('td'))).toBe(true);
      expect(links[1]).toHaveAttribute('href', '#transactions?merchant=whole-foods&period=2026-09');
      fireEvent.click(within(container).getByRole('button', { name: 'Show as table' }));
      expect(within(table).getByRole('link', { name: 'Whole Foods Market September $380.00' })).toBe(
        links[1],
      );
    });

    it('routes a plain press on a table link through navigate', () => {
      const navigate = vi.fn();
      const { container } = render(<Chart navigate={navigate} />);
      fireEvent.click(within(container).getByRole('button', { name: 'Show as table' }));
      const link = within(part(container, 'table')).getByRole('link', { name: 'Shell' });
      expect(fireEvent.click(link)).toBe(false);
      expect(navigate).toHaveBeenCalledExactlyOnceWith('#transactions?merchant=shell');
      expect(fireEvent.click(link, { metaKey: true })).toBe(true);
      expect(navigate).toHaveBeenCalledOnce();
    });

    /** The table's view, with focus on the table link named `name`. */
    const focusTableLink = (container: HTMLElement, name: string): void => {
      fireEvent.click(within(container).getByRole('button', { name: 'Show as table' }));
      focus(within(part(container, 'table')).getByRole('link', { name }));
    };

    // Loading takes the table away; empty and error hide it, which an engine blurs.
    it.each(['loading', 'error', 'empty'] as const)(
      'keeps focus off the body when %s takes the table from under a focused link',
      (status) => {
        const { container, rerender } = render(<Chart />);
        focusTableLink(container, 'Shell');
        rerender(<Chart status={status} />);
        // The group holds focus while there are no bars, as it does for a bar that leaves.
        expect(document.activeElement).toBe(part(container, '.bar-chart-rows'));
        // Ready again in the table's view, focus goes on to the toggle beside the table, which is shown.
        rerender(<Chart />);
        expect(document.activeElement).toBe(within(container).getByRole('button', { name: 'Show as chart' }));
      },
    );

    it('keeps focus off the body when a status takes the toggle away', () => {
      const { container, rerender } = render(<Chart />);
      const toggle = within(container).getByRole('button', { name: 'Show as table' });
      focus(toggle);
      rerender(<Chart status="loading" />);
      expect(document.activeElement).toBe(part(container, '.bar-chart-rows'));
    });

    it('hands focus to the toggle when new data takes a focused link from the table', () => {
      const { container, rerender } = render(<Chart />);
      focusTableLink(container, 'Shell');
      // Shell's figure keeps its row and loses its href, so its cell is text.
      const values = OCTOBER.values.map((value, at) => (at === 1 && value ? money(value.value) : value));
      rerender(<Chart series={[{ ...OCTOBER, values }]} />);
      expect(document.activeElement).toBe(within(container).getByRole('button', { name: 'Show as chart' }));
      // Fewer rows take the focused link's row away: the same.
      focus(within(part(container, 'table')).getByRole('link', { name: 'Apple Store' }));
      rerender(<Chart categories={MERCHANTS.slice(0, 2)} />);
      expect(document.activeElement).toBe(within(container).getByRole('button', { name: 'Show as chart' }));
    });

    it('leaves focus a reader moved out of the chart where it is when the table goes', () => {
      const outside = document.createElement('button');
      document.body.append(outside);
      onTestFinished(() => {
        outside.remove();
      });
      const { container, rerender } = render(<Chart />);
      focusTableLink(container, 'Shell');
      focus(outside);
      rerender(<Chart status="loading" />);
      expect(document.activeElement).toBe(outside);
    });

    it("leaves focus a reader let go to the page's empty space there when the table goes", async () => {
      const { container, rerender } = render(<Chart />);
      focusTableLink(container, 'Shell');
      // A press on the page's empty space: focus goes to nothing while the link stays shown.
      act(() => {
        within(part(container, 'table')).getByRole('link', { name: 'Shell' }).blur();
      });
      await Promise.resolve();
      rerender(<Chart status="loading" />);
      expect(document.activeElement).toBe(document.body);
    });

    it('links the noscript copy too, which writes no ids of its own', () => {
      const html = renderToString(<Chart series={[OCTOBER, SEPTEMBER]} />);
      const copy = html.slice(html.indexOf('<noscript>'));
      expect(copy).toMatch(
        /<a class="link" href="#transactions\?merchant=shell" aria-labelledby="[^"]+">\$260\.00<\/a>/,
      );
      expect(copy).not.toContain(' id="');
    });
  });

  it('adopts a link focused before hydration as its tab stop, so Tab does not jump', () => {
    const html = renderToString(<Chart />);
    const holder = document.createElement('div');
    holder.innerHTML = html;
    document.body.append(holder);
    const before = holder.querySelectorAll<HTMLElement>('.bar-chart-bar')[2];
    if (!before) throw new Error('No bar');
    before.focus();
    const { container } = render(<Chart />, { container: holder, hydrate: true });
    expect(document.activeElement).toBe(barAt(container, 2));
    expect(all(container, '.bar-chart-bar').map((bar) => bar.getAttribute('tabindex'))).toEqual([
      '-1',
      '-1',
      '0',
    ]);
    expect(readoutX(container)).toBe('Apple Store');
    holder.remove();
  });

  const AXE_CASES: [string, ReactElement, ((container: HTMLElement) => void)?][] = [
    ['lying down', <Chart key="one" />],
    ['lying down, two series', <Chart key="two" series={[OCTOBER, SEPTEMBER]} />],
    ['standing up, two series', <Chart key="up" orientation="vertical" series={[OCTOBER, SEPTEMBER]} />],
    [
      'with buttons',
      <Chart key="buttons" series={[{ ...OCTOBER, values: [money(1)] }]} onBarPress={vi.fn()} />,
    ],
    [
      'as a table',
      <Chart key="table" series={[OCTOBER, SEPTEMBER]} />,
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
