import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { LineChart, type LinePoint, type LineSeries } from './LineChart';

/** October: thirty-one days, labelled as the app formats them. */
const DAYS = Array.from({ length: 31 }, (_, index) => `Oct ${String(index + 1)}`);

const point = (value: number): LinePoint => ({ value, valueLabel: `$${value.toFixed(2)}` });

/** Oct 10 and Oct 11 have no value in either series: the keys and the pointer skip them. */
const GAPS = new Set([9, 10]);

const THIS_MONTH: LineSeries = {
  label: 'This month',
  points: DAYS.map((_, index) => (GAPS.has(index) ? null : point(20 + ((index * 37) % 65)))),
};

const LAST_MONTH: LineSeries = {
  label: 'Last month',
  points: DAYS.map((_, index) => (GAPS.has(index) ? null : point(30 + ((index * 23) % 55)))),
};

const TICKS = [
  { value: 0, label: '$0' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
];

const NAME = 'Spending in October';

/** The two-series chart most tests read. */
const Chart = (props: Partial<Parameters<typeof LineChart>[0]>): ReactElement => (
  <LineChart aria-label={NAME} series={[THIS_MONTH, LAST_MONTH]} xLabels={DAYS} {...props} />
);

const plotOf = (container: HTMLElement): HTMLElement => {
  const plot = container.querySelector<HTMLElement>('.line-chart-plot');
  if (!plot) throw new Error('No plot');
  return plot;
};

const readout = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>('.line-chart-readout');

/** The x label the readout shows, or null when there is no readout. */
const readoutX = (container: HTMLElement): string | null =>
  readout(container)?.querySelector('.line-chart-readout-x')?.textContent ?? null;

/** The live region's parts, each its own element, in order. */
const liveParts = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.line-chart-live .line-chart-live-part')].map((part) => part.textContent);

/** The plot's box as a pointer handler reads it: 300 wide, so each of the 31 positions is 10px apart. */
const stubBox = (plot: HTMLElement): void => {
  vi.spyOn(plot, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 300,
    height: 240,
    right: 300,
    bottom: 240,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
};

const focus = (element: HTMLElement): void => {
  act(() => {
    element.focus();
  });
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('LineChart', () => {
  it('is a figure named by aria-label, with the plot one focusable group named the same', () => {
    const { container } = render(<Chart />);
    const figure = screen.getByRole('figure', { name: NAME });
    expect(figure).toBe(container.firstElementChild);
    expect(figure.tagName).toBe('FIGURE');
    expect(figure).toHaveClass('line-chart');
    expect(figure).toHaveAttribute('data-view', 'chart');

    const plot = screen.getByRole('group', { name: NAME });
    expect(plot).toBe(plotOf(container));
    expect(plot).toHaveAttribute('tabindex', '0');
    expect(plot).toHaveAttribute('aria-roledescription', 'chart');
    expect(plot.style.blockSize).toBe('240px');

    // The drawing is one stretched svg, hidden, with the overlay hidden beside it.
    const svg = plot.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(plot.querySelector('.line-chart-overlay')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.line-chart-x')).toHaveAttribute('aria-hidden', 'true');
    const live = plot.querySelector('.line-chart-live');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveAttribute('aria-atomic', 'true');
    expect(live).toBeEmptyDOMElement();

    // Tab reaches the plot once, then the toggle.
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('never leaves the plot unnamed: a blank name falls back to the other, and with neither its series name it', () => {
    const { container, rerender } = render(<Chart aria-label="Spending" aria-labelledby=" " />);
    expect(screen.getByRole('group', { name: 'Spending' })).toBe(plotOf(container));
    expect(plotOf(container)).not.toHaveAttribute('aria-labelledby');
    expect(container.querySelector('caption')).toHaveTextContent('Spending');

    rerender(<Chart aria-label=" " />);
    // The series' column headers name the plot, so the group is never a chart with no name.
    expect(screen.getByRole('group', { name: 'This month Last month' })).toBe(plotOf(container));
    expect(screen.getByRole('figure')).not.toHaveAttribute('aria-label');
    expect(container.querySelector('caption')).toBeNull();
  });

  it('draws one path per series, the second before the first, and a legend for two series only', () => {
    const { container, rerender } = render(<Chart />);
    const paths = [...container.querySelectorAll('svg path.line-chart-line')];
    expect(paths.map((path) => path.getAttribute('data-series'))).toEqual(['2', '1']);
    // The domain is [0, 100], so a value of 20 at Oct 1 is drawn at y 80, x 0.
    expect(paths[1]?.getAttribute('d')).toMatch(/^M0 80L3\.333 /);

    const legend = container.querySelector('ul.line-chart-legend');
    const items = [...(legend?.querySelectorAll('li.line-chart-legend-item') ?? [])];
    expect(items.map((item) => item.getAttribute('data-series'))).toEqual(['1', '2']);
    expect(items.map((item) => item.querySelector('.line-chart-legend-label')?.textContent)).toEqual([
      'This month',
      'Last month',
    ]);
    for (const item of items)
      expect(item.querySelector('.line-chart-key')).toHaveAttribute('aria-hidden', 'true');

    rerender(<LineChart aria-label={NAME} series={[THIS_MONTH]} xLabels={DAYS} />);
    expect(container.querySelectorAll('svg path.line-chart-line')).toHaveLength(1);
    expect(container.querySelector('.line-chart-legend')).toBeNull();
  });

  it('breaks the line at a null point', () => {
    const { container } = render(<Chart />);
    const d = container.querySelector('path.line-chart-line[data-series="1"]')?.getAttribute('d') ?? '';
    expect(d.match(/M/g)).toHaveLength(2);
    // Points past the x labels are not drawn.
    const long: LineSeries = { label: 'Long', points: [point(1), point(2), point(3)] };
    const { container: short } = render(
      <LineChart aria-label={NAME} series={[long]} xLabels={['Oct 1', 'Oct 2']} />,
    );
    expect(short.querySelector('path.line-chart-line')?.getAttribute('d')).toBe('M0 50L100 0');
  });

  it('draws a gridline and a y label per tick inside the domain, and no y labels without yTicks', () => {
    const { container, rerender } = render(<Chart yTicks={[...TICKS, { value: 150, label: '$150' }]} />);
    const plot = plotOf(container);
    expect(plot).toHaveAttribute('data-has-y-labels');
    const grid = [...container.querySelectorAll('line.line-chart-grid')];
    expect(grid.map((line) => line.getAttribute('y1'))).toEqual(['100', '50', '0']);
    const labels = [...container.querySelectorAll<HTMLElement>('.line-chart-y-label')];
    expect(labels.map((label) => label.textContent)).toEqual(['$0', '$50', '$100']);
    expect(labels.map((label) => label.style.top)).toEqual(['100%', '50%', '0%']);
    // The baseline is the domain's minimum, drawn whether or not there are ticks.
    expect(container.querySelector('line.line-chart-baseline')?.getAttribute('y1')).toBe('100');

    rerender(<Chart />);
    expect(plotOf(container)).not.toHaveAttribute('data-has-y-labels');
    expect(container.querySelector('.line-chart-y-label')).toBeNull();
    expect(container.querySelector('.line-chart-grid')).toBeNull();
    expect(container.querySelector('line.line-chart-baseline')).not.toBeNull();
  });

  it('labels the first, middle and last x positions by default, and the xTicks when given, with the ends marked', () => {
    const { container, rerender } = render(<Chart />);
    const labels = (): HTMLElement[] => [
      ...container.querySelectorAll<HTMLElement>('.line-chart-x .line-chart-x-label'),
    ];
    expect(labels().map((label) => label.textContent)).toEqual(['Oct 1', 'Oct 16', 'Oct 31']);
    expect(labels().map((label) => label.style.insetInlineStart)).toEqual(['0%', '50%', '100%']);
    expect(labels().map((label) => label.getAttribute('data-edge'))).toEqual(['start', null, 'end']);

    // An index past the labels, or not a whole number, is left out.
    rerender(<Chart xTicks={[0, 7, 14, 40, 2.5]} />);
    expect(labels().map((label) => label.textContent)).toEqual(['Oct 1', 'Oct 8', 'Oct 15']);
    expect(labels().map((label) => label.getAttribute('data-edge'))).toEqual(['start', null, null]);
  });

  it('activates the last position with data on focus, with the readout, the crosshair and a dot per series', () => {
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    expect(plot).not.toHaveAttribute('data-active');
    expect(readout(container)).toBeNull();

    focus(plot);
    expect(plot).toHaveAttribute('data-active');
    expect(readoutX(container)).toBe('Oct 31');
    const crosshair = container.querySelector<HTMLElement>('.line-chart-overlay .line-chart-crosshair');
    expect(crosshair?.style.insetInlineStart).toBe('100%');
    const dots = [...container.querySelectorAll<HTMLElement>('.line-chart-overlay .line-chart-dot')];
    expect(dots.map((dot) => dot.getAttribute('data-series'))).toEqual(['1', '2']);
    // Oct 31 is 25 this month and 60 last month, in a domain of [0, 100].
    expect(dots.map((dot) => dot.style.top)).toEqual(['75%', '40%']);
    const items = [...(readout(container)?.querySelectorAll('.line-chart-readout-list li') ?? [])];
    expect(
      items.map((item) => [
        item.querySelector('strong.line-chart-readout-value')?.textContent,
        item.querySelector('span.line-chart-readout-series')?.textContent,
      ]),
    ).toEqual([
      ['$25.00', 'This month'],
      ['$60.00', 'Last month'],
    ]);

    // Blur ends the active position.
    act(() => {
      plot.blur();
    });
    expect(plot).not.toHaveAttribute('data-active');
    expect(readout(container)).toBeNull();
    expect(container.querySelector('.line-chart-crosshair')).toBeNull();
  });

  it('moves one position with data on ArrowRight and ArrowLeft, skipping gaps', () => {
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    focus(plot);
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    expect(readoutX(container)).toBe('Oct 30');
    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    expect(readoutX(container)).toBe('Oct 31');
    // At the newest position ArrowRight stays.
    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    expect(readoutX(container)).toBe('Oct 31');

    fireEvent.keyDown(plot, { key: 'Home' });
    for (let i = 0; i < 9; i++) fireEvent.keyDown(plot, { key: 'ArrowRight' });
    expect(readoutX(container)).toBe('Oct 12');
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    expect(readoutX(container)).toBe('Oct 9');

    // The keys are the chart's: the page does not scroll.
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    act(() => {
      plot.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it('goes to the first and last position with data on Home and End', () => {
    const first: LineSeries = { label: 'This month', points: [null, null, ...THIS_MONTH.points.slice(2)] };
    const { container } = render(<Chart series={[first]} />);
    const plot = plotOf(container);
    focus(plot);
    fireEvent.keyDown(plot, { key: 'Home' });
    expect(readoutX(container)).toBe('Oct 3');
    fireEvent.keyDown(plot, { key: 'End' });
    expect(readoutX(container)).toBe('Oct 31');
  });

  it('moves seven positions on PageUp and PageDown, landing on data', () => {
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    focus(plot);
    fireEvent.keyDown(plot, { key: 'PageUp' });
    expect(readoutX(container)).toBe('Oct 24');
    fireEvent.keyDown(plot, { key: 'PageUp' });
    expect(readoutX(container)).toBe('Oct 17');
    // Oct 10 is a gap, so the week back lands on the nearest day with data before it.
    fireEvent.keyDown(plot, { key: 'PageUp' });
    expect(readoutX(container)).toBe('Oct 9');
    fireEvent.keyDown(plot, { key: 'PageUp' });
    expect(readoutX(container)).toBe('Oct 2');
    fireEvent.keyDown(plot, { key: 'PageUp' });
    expect(readoutX(container)).toBe('Oct 1');
    // Oct 4 forward is Oct 11, a gap: it lands on Oct 12.
    fireEvent.keyDown(plot, { key: 'Home' });
    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    fireEvent.keyDown(plot, { key: 'PageDown' });
    expect(readoutX(container)).toBe('Oct 12');
    fireEvent.keyDown(plot, { key: 'End' });
    fireEvent.keyDown(plot, { key: 'PageDown' });
    expect(readoutX(container)).toBe('Oct 31');
  });

  it('follows the drawn direction under a dir="rtl" ancestor, and a nearer dir="ltr" wins', () => {
    const { container, rerender } = render(
      <div dir="rtl">
        <Chart />
      </div>,
    );
    const plot = plotOf(container);
    focus(plot);
    // In right to left the newest day is at the left: Right moves to an older day, Left to a newer one.
    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    expect(readoutX(container)).toBe('Oct 30');
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    expect(readoutX(container)).toBe('Oct 31');

    // dir="auto" sets no flip in the CSS, so the keys look past it to the attribute that does.
    rerender(
      <div dir="RTL">
        <div dir="auto">
          <Chart />
        </div>
      </div>,
    );
    // A new tree is a new chart, which takes focus again.
    focus(plotOf(container));
    fireEvent.keyDown(plotOf(container), { key: 'ArrowRight' });
    expect(readoutX(container)).toBe('Oct 30');

    rerender(
      <div dir="rtl">
        <div dir="ltr">
          <Chart />
        </div>
      </div>,
    );
    focus(plotOf(container));
    fireEvent.keyDown(plotOf(container), { key: 'ArrowRight' });
    expect(readoutX(container)).toBe('Oct 31');
    fireEvent.keyDown(plotOf(container), { key: 'ArrowLeft' });
    expect(readoutX(container)).toBe('Oct 30');
  });

  it('hides the readout on Escape until the next move, and keeps the crosshair', () => {
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    focus(plot);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    act(() => {
      plot.dispatchEvent(escape);
    });
    expect(escape.defaultPrevented).toBe(true);
    expect(readout(container)).toBeNull();
    expect(container.querySelector('.line-chart-crosshair')).not.toBeNull();
    expect(container.querySelectorAll('.line-chart-dot')).toHaveLength(2);

    // A second Escape is not the chart's: it goes on to whatever holds the chart, a dialog say.
    const again = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    act(() => {
      plot.dispatchEvent(again);
    });
    expect(again.defaultPrevented).toBe(false);

    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    expect(readoutX(container)).toBe('Oct 30');
  });

  it('keeps the Escape that hides the readout from whatever holds the chart, and passes on the next', () => {
    // A React Aria dialog closes on an Escape that reaches it, whether or not it was prevented.
    const onKeyDown = vi.fn();
    const { container } = render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a stand-in for a dialog's own key handler
      <div onKeyDown={onKeyDown}>
        <Chart />
      </div>,
    );
    const plot = plotOf(container);
    focus(plot);
    fireEvent.keyDown(plot, { key: 'Escape' });
    expect(readout(container)).toBeNull();
    expect(onKeyDown).not.toHaveBeenCalled();

    // The readout is already hidden, so this Escape is the dialog's.
    fireEvent.keyDown(plot, { key: 'Escape' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('leaves a key with Alt, Control or Meta to the browser and the page', () => {
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    focus(plot);
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
      for (const key of ['ArrowLeft', 'Home', 'Escape']) {
        const event = new KeyboardEvent('keydown', {
          key,
          [modifier]: true,
          bubbles: true,
          cancelable: true,
        });
        act(() => {
          plot.dispatchEvent(event);
        });
        expect(event.defaultPrevented, `${modifier} ${key}`).toBe(false);
        expect(readoutX(container), `${modifier} ${key}`).toBe('Oct 31');
      }
    }
  });

  it('keeps the readout hidden after Escape when a key does not move', () => {
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    focus(plot);
    fireEvent.keyDown(plot, { key: 'Escape' });
    expect(readout(container)).toBeNull();
    // At the newest position Right and End go nowhere, so nothing new is shown.
    fireEvent.keyDown(plot, { key: 'ArrowRight' });
    fireEvent.keyDown(plot, { key: 'End' });
    fireEvent.keyDown(plot, { key: 'PageDown' });
    expect(readout(container)).toBeNull();
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    expect(readoutX(container)).toBe('Oct 30');
  });

  it('activates the newest position on a key when the plot was focused before it had data', () => {
    const empty: LineSeries = { label: 'This month', points: [] };
    const { container, rerender } = render(<LineChart aria-label={NAME} series={[empty]} xLabels={[]} />);
    const plot = plotOf(container);
    focus(plot);
    expect(plot).not.toHaveAttribute('data-active');

    rerender(<LineChart aria-label={NAME} series={[THIS_MONTH, LAST_MONTH]} xLabels={DAYS} />);
    expect(plotOf(container)).toBe(plot);
    expect(plot).toHaveFocus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    act(() => {
      plot.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(readoutX(container)).toBe('Oct 31');
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    expect(readoutX(container)).toBe('Oct 30');
  });

  it('announces a position after 150ms of rest, and only where a quick run of keys stops', () => {
    vi.useFakeTimers();
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    focus(plot);
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(liveParts(container)).toEqual([]);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(liveParts(container)).toEqual(['Oct 31', 'This month $25.00', 'Last month $60.00']);

    // Three keys inside the rest: only the last is announced.
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(liveParts(container)[0]).toBe('Oct 31');
    fireEvent.keyDown(plot, { key: 'Home' });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(liveParts(container)[0]).toBe('Oct 1');
  });

  it('announces with no punctuation of its own, so another language hears only its own words', () => {
    vi.useFakeTimers();
    const persian: LineSeries = {
      label: 'این ماه',
      points: [{ value: 84.2, valueLabel: '۸۴٫۲۰ دلار' }, null],
    };
    const before: LineSeries = {
      label: 'ماه پیش',
      points: [
        { value: 61, valueLabel: '۶۱ دلار' },
        { value: 90, valueLabel: '۹۰ دلار' },
      ],
    };
    const { container } = render(
      <div dir="rtl">
        <LineChart aria-label="هزینه‌ها" series={[persian, before]} xLabels={['۱ مهر', '۲ مهر']} />
      </div>,
    );
    const plot = plotOf(container);
    focus(plot);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    // A gap leaves the series out of the announcement altogether.
    expect(liveParts(container)).toEqual(['۲ مهر', 'ماه پیش ۹۰ دلار']);
    // Each part is its own element, joined by nothing but a space inside a series' part.
    const live = container.querySelector('.line-chart-live');
    expect(live?.textContent).not.toMatch(/[:,;.]/);
  });

  it('announces a key that lands where the last announcement was, once a pointer has moved in between', () => {
    vi.useFakeTimers();
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    stubBox(plot);
    focus(plot);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(liveParts(container)[0]).toBe('Oct 31');

    // The pointer takes the position, unannounced, and the region lets go of the old day.
    fireEvent.pointerMove(plot, { clientX: 150, pointerType: 'mouse' });
    expect(readoutX(container)).toBe('Oct 16');
    expect(liveParts(container)).toEqual([]);

    // So End, back on Oct 31, is a change the screen reader hears.
    fireEvent.keyDown(plot, { key: 'End' });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(liveParts(container)).toEqual(['Oct 31', 'This month $25.00', 'Last month $60.00']);
  });

  it('snaps to the nearest position with data under a mouse, and clears on leave unless focused', () => {
    vi.useFakeTimers();
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    stubBox(plot);
    // Half the width is position 15, Oct 16.
    fireEvent.pointerMove(plot, { clientX: 150, pointerType: 'mouse' });
    expect(readoutX(container)).toBe('Oct 16');
    // 95px is position 9.5, between the two gap days: Oct 9 and Oct 12 are as near, so the older wins.
    fireEvent.pointerMove(plot, { clientX: 95, pointerType: 'pen' });
    expect(readoutX(container)).toBe('Oct 9');
    // A pointer is not announced.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(liveParts(container)).toEqual([]);

    fireEvent.pointerLeave(plot, { pointerType: 'mouse' });
    expect(readout(container)).toBeNull();

    // Focused, the plot keeps its position when the pointer leaves.
    focus(plot);
    fireEvent.pointerMove(plot, { clientX: 0, pointerType: 'mouse' });
    expect(readoutX(container)).toBe('Oct 1');
    fireEvent.pointerLeave(plot, { pointerType: 'mouse' });
    expect(readoutX(container)).toBe('Oct 1');
  });

  it('reads the pointer from the oldest side, which is the right under dir="rtl"', () => {
    const { container } = render(
      <div dir="rtl">
        <Chart />
      </div>,
    );
    const plot = plotOf(container);
    stubBox(plot);
    fireEvent.pointerMove(plot, { clientX: 290, pointerType: 'mouse' });
    expect(readoutX(container)).toBe('Oct 2');
    fireEvent.pointerMove(plot, { clientX: 0, pointerType: 'mouse' });
    expect(readoutX(container)).toBe('Oct 31');
  });

  it('holds a touch position until a press outside the plot', () => {
    const { container } = render(
      <div>
        <Chart />
        <p>Outside</p>
      </div>,
    );
    const plot = plotOf(container);
    stubBox(plot);
    fireEvent.pointerDown(plot, { clientX: 150, pointerType: 'touch' });
    expect(readoutX(container)).toBe('Oct 16');
    // A touch move or leave does not clear it.
    fireEvent.pointerMove(plot, { clientX: 0, pointerType: 'touch' });
    fireEvent.pointerLeave(plot, { pointerType: 'touch' });
    expect(readoutX(container)).toBe('Oct 16');
    // A second press inside moves it.
    fireEvent.pointerDown(plot, { clientX: 300, pointerType: 'touch' });
    expect(readoutX(container)).toBe('Oct 31');

    fireEvent.pointerDown(screen.getByText('Outside'), { pointerType: 'touch' });
    expect(readout(container)).toBeNull();
    expect(plot).not.toHaveAttribute('data-active');
  });

  it('aligns the readout to the start in the oldest quarter, the end in the newest and the centre between', () => {
    const { container } = render(<Chart />);
    const plot = plotOf(container);
    stubBox(plot);
    const alignAt = (index: number): string | null => {
      fireEvent.pointerMove(plot, { clientX: index * 10, pointerType: 'mouse' });
      expect(readoutX(container)).toBe(DAYS[index]);
      return readout(container)?.getAttribute('data-align') ?? null;
    };
    // Position 7 is at 23.3%, 8 at 26.7%, 22 at 73.3% and 23 at 76.7%.
    expect(alignAt(0)).toBe('start');
    expect(alignAt(7)).toBe('start');
    expect(alignAt(8)).toBe('center');
    expect(alignAt(15)).toBe('center');
    expect(alignAt(22)).toBe('center');
    expect(alignAt(23)).toBe('end');
    expect(alignAt(30)).toBe('end');
    expect(readout(container)?.style.insetInlineStart).toBe('100%');
  });

  it('places the readout above the highest dot, or below the lowest when there is no room above, from known values', () => {
    // Values 95, 50 and 10 on 0 to 100: their dots are at 5%, 50% and 90% of the plot.
    const one: LineSeries = { label: 'This month', points: [point(95), point(50), point(10)] };
    const other: LineSeries = { label: 'Last month', points: [point(60), point(20), point(15)] };
    const { container, rerender } = render(
      <LineChart aria-label={NAME} series={[one, other]} xLabels={['A', 'B', 'C']} yDomain={[0, 100]} />,
    );
    const plot = plotOf(container);
    const place = (): [string | null, string, string] => {
      const panel = readout(container);
      return [
        panel?.getAttribute('data-place') ?? null,
        panel?.style.insetBlockEnd ?? '',
        panel?.style.insetBlockStart ?? '',
      ];
    };
    focus(plot);
    // C: the dots at 85% and 90%, 204px down a 240px plot, room for three lines above: its bottom on the higher.
    expect(readoutX(container)).toBe('C');
    expect(place()).toEqual(['above', '15%', '']);

    // A: the higher dot at 5%, 12px down, no room above: its top under the lower dot, at 40%, so it covers neither.
    fireEvent.keyDown(plot, { key: 'Home' });
    expect(readoutX(container)).toBe('A');
    expect(place()).toEqual(['below', '', '40%']);

    // The room is read from the height: at 20% a 240px plot has 48px above the dot, a 600px one 120px.
    const high: LineSeries = { label: 'This month', points: [point(80)] };
    rerender(<LineChart aria-label={NAME} series={[high]} xLabels={['A']} yDomain={[0, 100]} />);
    fireEvent.keyDown(plot, { key: 'End' });
    expect(place()).toEqual(['below', '', '20%']);
    rerender(<LineChart aria-label={NAME} series={[high]} xLabels={['A']} yDomain={[0, 100]} height={600} />);
    expect(place()).toEqual(['above', '80%', '']);

    // A dot drawn past the plot anchors the readout at the plot's edge, never outside it.
    const past: LineSeries = { label: 'This month', points: [point(250)] };
    rerender(<LineChart aria-label={NAME} series={[past]} xLabels={['A']} yDomain={[0, 100]} />);
    expect(place()).toEqual(['below', '', '0%']);
  });

  it('renders the table hidden, with a caption from aria-label, the x labels as row headers and an empty cell for a gap', () => {
    const { container } = render(<Chart />);
    const table = container.querySelector('table.line-chart-table');
    expect(table).not.toBeNull();
    expect(table).toHaveAttribute('hidden');
    expect(container.querySelector('.line-chart-chart')).not.toHaveAttribute('hidden');
    if (!(table instanceof HTMLTableElement)) throw new Error('No table');
    expect(table.caption?.textContent).toBe(NAME);

    const head = [...(table.tHead?.rows[0]?.cells ?? [])];
    expect(head.map((cell) => [cell.tagName, cell.textContent, cell.getAttribute('scope')])).toEqual([
      ['TD', '', null],
      ['TH', 'This month', 'col'],
      ['TH', 'Last month', 'col'],
    ]);
    const rows = [...(table.tBodies[0]?.rows ?? [])];
    expect(rows).toHaveLength(31);
    const cells = (index: number): (string | null)[][] =>
      [...(rows[index]?.cells ?? [])].map((cell) => [
        cell.tagName,
        cell.textContent,
        cell.getAttribute('scope'),
      ]);
    expect(cells(0)).toEqual([
      ['TH', 'Oct 1', 'row'],
      ['TD', '$20.00', null],
      ['TD', '$30.00', null],
    ]);
    expect(cells(9)).toEqual([
      ['TH', 'Oct 10', 'row'],
      ['TD', '', null],
      ['TD', '', null],
    ]);
  });

  it("names the table by the figure's aria-labelledby, with no caption, when the chart is named that way", () => {
    const { container } = render(
      <>
        <h2 id="spending-heading">Spending this month</h2>
        <Chart aria-label={undefined} aria-labelledby="spending-heading" />
      </>,
    );
    expect(screen.getByRole('figure', { name: 'Spending this month' })).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('group', { name: 'Spending this month' })).toHaveAttribute(
      'aria-labelledby',
      'spending-heading',
    );
    const table = container.querySelector('table');
    expect(table).toHaveAttribute('aria-labelledby', 'spending-heading');
    expect(table?.querySelector('caption')).toBeNull();
  });

  it('swaps the plot for the table and its label for Show as chart, and back, keeping focus on the toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<Chart />);
    const figure = screen.getByRole('figure', { name: NAME });
    const toggle = screen.getByRole('button', { name: 'Show as table' });
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveClass('button', 'button-tertiary', 'line-chart-toggle');
    expect(toggle.parentElement).toHaveClass('line-chart-toolbar');

    await user.click(toggle);
    expect(figure).toHaveAttribute('data-view', 'table');
    expect(container.querySelector('.line-chart-chart')).toHaveAttribute('hidden');
    expect(screen.getByRole('table', { name: NAME })).not.toHaveAttribute('hidden');
    expect(toggle).toHaveTextContent('Show as chart');
    expect(toggle).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(figure).toHaveAttribute('data-view', 'chart');
    expect(container.querySelector('.line-chart-chart')).not.toHaveAttribute('hidden');
    expect(container.querySelector('table')).toHaveAttribute('hidden');
    expect(toggle).toHaveTextContent('Show as table');
    expect(toggle).toHaveFocus();
  });

  it('takes its four strings from labels, the role description among them', async () => {
    const user = userEvent.setup();
    const labels = {
      showTable: 'نمایش جدول',
      showChart: 'نمایش نمودار',
      noScript: 'اسکریپت خاموش است.',
      roleDescription: 'نمودار',
    };
    render(<Chart labels={labels} />);
    expect(screen.getByRole('group', { name: NAME })).toHaveAttribute('aria-roledescription', 'نمودار');
    const toggle = screen.getByRole('button', { name: 'نمایش جدول' });
    await user.click(toggle);
    expect(toggle).toHaveTextContent('نمایش نمودار');
    // The note is only in the server's HTML: a client render leaves noscript empty.
    const html = renderToStaticMarkup(<Chart labels={labels} />);
    expect(html).toContain('<p class="line-chart-noscript">اسکریپت خاموش است.</p>');
    expect(html).not.toContain('Scripts are off');
  });

  it("renders one table on the client: the noscript copy is the server's", () => {
    const { container } = render(<Chart />);
    expect(container.querySelectorAll('table')).toHaveLength(1);
    const noscript = container.querySelector('figure > noscript');
    expect(noscript).not.toBeNull();
    expect(noscript?.previousElementSibling).toHaveClass('line-chart-toolbar');
    expect(noscript?.childNodes).toHaveLength(0);
  });

  it('uses yDomain when given, and fills under the first series with hasArea', () => {
    const one: LineSeries = { label: 'This month', points: [point(100), null, point(50), point(150)] };
    const { container, rerender } = render(
      <LineChart aria-label={NAME} series={[one]} xLabels={['A', 'B', 'C', 'D']} yDomain={[0, 200]} />,
    );
    expect(container.querySelector('path.line-chart-line')?.getAttribute('d')).toBe(
      'M0 50L0 50M66.667 75L100 25',
    );
    expect(container.querySelector('.line-chart-area')).toBeNull();

    rerender(
      <LineChart
        aria-label={NAME}
        series={[one, LAST_MONTH]}
        xLabels={['A', 'B', 'C', 'D']}
        yDomain={[0, 200]}
        hasArea
      />,
    );
    // The area is the first series' only, drawn first, so both lines lie over it.
    const paths = [...container.querySelectorAll('svg path')];
    expect(paths.map((path) => path.getAttribute('class'))).toEqual([
      'line-chart-area',
      'line-chart-line',
      'line-chart-line',
    ]);
    expect(paths[0]?.getAttribute('d')).toBe('M66.667 100L66.667 75L100 25L100 100Z');
  });

  it('keeps every coordinate finite for values near the largest number', () => {
    const huge: LineSeries = {
      label: 'This month',
      points: [point(-1.7e308), point(1.7e308), { value: Number.NaN, valueLabel: 'n/a' }],
    };
    const { container } = render(<LineChart aria-label={NAME} series={[huge]} xLabels={['A', 'B', 'C']} />);
    const d = container.querySelector('path.line-chart-line')?.getAttribute('d') ?? '';
    expect(d).toBe('M0 100L50 0');
    focus(plotOf(container));
    // The value that is not a number is a gap, so the last position with data is B.
    expect(readoutX(container)).toBe('B');
    for (const mark of container.querySelectorAll<HTMLElement>('.line-chart-overlay [style]'))
      expect(mark.getAttribute('style')).not.toMatch(/NaN|Infinity/);

    // A value outside a given domain is drawn past the plot, never at an infinity.
    const { container: outside } = render(
      <LineChart aria-label={NAME} series={[huge]} xLabels={['A', 'B', 'C']} yDomain={[0, 1e-300]} />,
    );
    expect(outside.querySelector('path.line-chart-line')?.getAttribute('d')).not.toMatch(/NaN|Infinity/);
  });

  it('draws nothing to move to with no data, and the keys do nothing', () => {
    const empty: LineSeries = { label: 'This month', points: [] };
    const { container } = render(<LineChart aria-label={NAME} series={[empty]} xLabels={[]} />);
    const plot = plotOf(container);
    expect(container.querySelector('path.line-chart-line')).toBeNull();
    focus(plot);
    fireEvent.keyDown(plot, { key: 'End' });
    expect(plot).not.toHaveAttribute('data-active');
    expect(readout(container)).toBeNull();
  });

  it('passes className, ref and attributes to the figure', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Chart ref={ref} className="extra" id="spending" data-testid="chart" height={320} />,
    );
    const figure = container.firstElementChild;
    expect(ref.current).toBe(figure);
    expect(figure).toHaveAttribute('class', 'line-chart extra');
    expect(figure).toHaveAttribute('id', 'spending');
    expect(figure).toHaveAttribute('data-testid', 'chart');
    expect(plotOf(container).style.blockSize).toBe('320px');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('LineChart');
  });

  // One test per state, so each axe pass has its own time budget on a busy runner.
  it.each(['shown', 'active', 'as a table'] as const)(
    'has no axe violations with the chart %s',
    async (state) => {
      const { container } = render(
        <div>
          <Chart yTicks={TICKS} hasArea />
        </div>,
      );
      if (state === 'active') focus(plotOf(container));
      if (state === 'as a table') {
        fireEvent.click(within(container).getByRole('button', { name: 'Show as table' }));
      }
      await expectNoA11yViolations(container);
    },
  );

  it('requires a name, one or two series and all four labels in its types', () => {
    // @ts-expect-error a chart needs a name: aria-label or aria-labelledby
    const unnamed = <LineChart series={[THIS_MONTH]} xLabels={DAYS} />;
    const three = (
      // @ts-expect-error one or two series, never three
      <LineChart aria-label={NAME} series={[THIS_MONTH, LAST_MONTH, THIS_MONTH]} xLabels={DAYS} />
    );
    const partial = (
      <LineChart
        aria-label={NAME}
        series={[THIS_MONTH]}
        xLabels={DAYS}
        // @ts-expect-error all four strings, so no default in English is left on the page
        labels={{ showTable: 'Tabelle', showChart: 'Diagramm' }}
      />
    );
    const noRole = (
      <LineChart
        aria-label={NAME}
        series={[THIS_MONTH]}
        xLabels={DAYS}
        // @ts-expect-error the role description is a string the chart writes, so it is required too
        labels={{ showTable: 'Tabelle', showChart: 'Diagramm', noScript: 'Skripte sind aus.' }}
      />
    );
    // The arrays may be read-only: the chart never changes what it is given.
    const frozen = (
      <LineChart
        aria-label={NAME}
        series={Object.freeze([THIS_MONTH] as const)}
        xLabels={Object.freeze([...DAYS])}
        xTicks={Object.freeze([0, 30])}
        yTicks={Object.freeze([...TICKS])}
        yDomain={Object.freeze([0, 100] as const)}
      />
    );
    expect([unnamed, three, partial, noRole, frozen].every(Boolean)).toBe(true);
  });
});
