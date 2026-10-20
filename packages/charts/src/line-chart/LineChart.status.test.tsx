import { act, fireEvent, render, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { LineChart, type LinePoint, type LineSeries } from './LineChart';

/*
 * LineChart's states: loading, empty and error in the plot's own space, from the frame BarChart drew first.
 * Its ready face is held byte for byte by same-markup.test.tsx and its other tests by LineChart.test.tsx, both
 * unchanged; this file holds only what the states add.
 */

const DAYS = Array.from({ length: 31 }, (_, index) => `Oct ${String(index + 1)}`);

const point = (value: number): LinePoint => ({ value, valueLabel: `$${value.toFixed(2)}` });

const THIS_MONTH: LineSeries = {
  label: 'This month',
  points: DAYS.map((_, index) => point(20 + ((index * 37) % 65))),
};

const LAST_MONTH: LineSeries = {
  label: 'Last month',
  points: DAYS.map((_, index) => point(30 + ((index * 23) % 55))),
};

const TICKS = [
  { value: 0, label: '$0' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
];

const NAME = 'Spending in October';

const Chart = (props: Partial<Parameters<typeof LineChart>[0]>): ReactElement => (
  <LineChart aria-label={NAME} series={[THIS_MONTH, LAST_MONTH]} xLabels={DAYS} yTicks={TICKS} {...props} />
);

const part = (container: HTMLElement, selector: string): HTMLElement => {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
};

const focus = (element: HTMLElement): void => {
  act(() => {
    element.focus();
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LineChart states', () => {
  const STATES = [
    ['loading', 'Loading'],
    ['empty', ''],
    ['error', 'The chart could not be loaded'],
  ] as const;

  it.each(STATES)('draws the %s state and says it once', (status, said) => {
    const { container } = render(<Chart status={status} />);
    const figure = part(container, 'figure');
    expect(figure).toHaveAttribute('data-status', status);
    // The plot keeps its place and its height, so the page does not move when the data arrives.
    const plot = part(container, '.line-chart-plot');
    expect(plot.style.blockSize).toBe('240px');
    expect(plot).toHaveAttribute('role', 'group');
    // No line, no area, no legend and no toggle; the gridlines, their labels and the baseline stay.
    expect(container.querySelector('.line-chart-line')).toBeNull();
    expect(container.querySelector('.line-chart-legend')).toBeNull();
    expect(container.querySelector('.line-chart-toggle')).toBeNull();
    expect(container.querySelector('noscript')).toBeNull();
    expect(container.querySelectorAll('.line-chart-plot svg .line-chart-grid')).toHaveLength(3);
    expect(container.querySelector('.line-chart-plot svg .line-chart-baseline')).not.toBeNull();
    expect(container.querySelectorAll('.line-chart-y-label')).toHaveLength(3);
    // The x labels stay under the plot.
    expect(container.querySelectorAll('.line-chart-x-label')).toHaveLength(3);
    // The plot's own polite region, there from the first render, says the state once.
    expect(part(container, '.line-chart-live').textContent).toBe(said);
    // Nothing is marked busy, since the region that says the state is inside the plot.
    expect(container.querySelector('[aria-busy]')).toBeNull();
    if (status === 'loading') {
      const skeleton = part(container, '.line-chart-plot > .skeleton');
      expect(skeleton).toHaveClass('line-chart-skeleton');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('table')).toBeNull();
    } else {
      const message = part(container, '.line-chart-plot > .line-chart-state > p.line-chart-message');
      expect(message).toHaveTextContent(
        status === 'error' ? 'The chart could not be loaded' : 'Nothing to show for this period',
      );
      if (status === 'error') expect(message).toHaveAttribute('data-tone', 'error');
      else expect(message).not.toHaveAttribute('data-tone');
      expect(part(container, 'table')).toHaveAttribute('hidden');
    }
    // Never a tab stop while it shows no data, and keys do nothing.
    expect(plot).toHaveAttribute('tabindex', '-1');
    expect(fireEvent.keyDown(plot, { key: 'ArrowLeft' })).toBe(true);
    focus(plot);
    expect(container.querySelector('.line-chart-readout')).toBeNull();
    expect(container.querySelector('.line-chart-crosshair')).toBeNull();
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
    expect(part(container, '.line-chart-state > .empty-state')).toHaveTextContent('No spending yet');
    expect(container.querySelector('.line-chart-message')).toBeNull();
  });

  it('takes its own status strings, and its four labels stay as they were', () => {
    const { container } = render(
      <Chart
        status="error"
        labels={{
          showTable: 'Tabelle',
          showChart: 'Diagramm',
          noScript: 'Skripte sind aus.',
          roleDescription: 'Diagramm',
        }}
        statusLabels={{ loading: 'در حال بارگذاری', empty: 'چیزی نیست', error: 'بار نشد' }}
      />,
    );
    expect(part(container, '.line-chart-message')).toHaveTextContent('بار نشد');
    expect(part(container, '.line-chart-live')).toHaveTextContent('بار نشد');
    expect(part(container, '.line-chart-plot')).toHaveAttribute('aria-roledescription', 'Diagramm');
  });

  it('writes nothing to its region on the server, and says the word once mounted', () => {
    const html = renderToString(<Chart status="loading" />);
    expect(html).toContain('aria-live="polite" aria-atomic="true"></span>');
    expect(html).toContain('data-status="loading"');
    expect(html).not.toContain('tabindex');
  });

  it('keeps its ready markup unchanged, whatever status strings it is given', () => {
    const plain = renderToStaticMarkup(<Chart />);
    expect(
      renderToStaticMarkup(
        <Chart
          status="ready"
          statusContent={<p>Never drawn</p>}
          statusLabels={{ loading: 'Laden', empty: 'Leer', error: 'Fehler' }}
        />,
      ),
    ).toBe(plain);
    expect(plain).not.toContain('data-status');
  });

  it('keeps focus on the plot through a status and back, never on the body', () => {
    const toNothing = vi.fn();
    const listener = (event: FocusEvent): void => {
      if (event.relatedTarget === null) toNothing(event.target);
    };
    document.addEventListener('focusout', listener);
    onTestFinished(() => {
      document.removeEventListener('focusout', listener);
    });
    const { container, rerender } = render(<Chart />);
    const plot = part(container, '.line-chart-plot');
    focus(plot);
    expect(plot).toHaveAttribute('tabindex', '0');
    rerender(<Chart status="loading" />);
    expect(document.activeElement).toBe(plot);
    rerender(<Chart status="error" />);
    expect(document.activeElement).toBe(plot);
    rerender(<Chart />);
    expect(document.activeElement).toBe(plot);
    expect(plot).toHaveAttribute('tabindex', '0');
    expect(toNothing).not.toHaveBeenCalled();
  });

  it('shows the table toggle again once ready, and keeps the table hidden while not', () => {
    const { container, rerender } = render(<Chart status="empty" />);
    expect(within(container).queryByRole('button')).toBeNull();
    rerender(<Chart />);
    expect(within(container).getByRole('button', { name: 'Show as table' })).toBeInTheDocument();
  });

  const AXE_CASES: [string, ReactElement][] = [
    ['loading', <Chart key="loading" status="loading" />],
    ['empty', <Chart key="empty" status="empty" />],
    ['error', <Chart key="error" status="error" />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});
