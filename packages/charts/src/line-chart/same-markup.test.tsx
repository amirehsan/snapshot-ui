import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LineChart, type LinePoint, type LineSeries } from './LineChart';

/*
 * LineChart's markup, byte for byte, as it was before its table, legend, keys, naming, rounding and readout
 * placement moved to src/foundations. Written against the chart before the move and kept after it: a change
 * to any of these strings is a change an app can see, so the move made none. The fixtures are the eight visual
 * stories' (LineChart.stories.tsx, copied here so a story edit cannot change what this proves), then the edges
 * the stories do not draw. Each long render is held as its length and an FNV-1a hash of its UTF-8 bytes; one
 * short render is held whole, so the shape the hashes stand for can be read. The last test holds the mounted
 * chart's markup after each step of a reader's journey through focus, the keys, Escape, the rest that
 * announces, a mouse, a touch and the toggle, so the active state that moved to useChartActive moved too.
 */

/** October, as the app formats its days. */
const DAYS = Array.from({ length: 31 }, (_, index) => `Oct ${String(index + 1)}`);

const point = (value: number): LinePoint => ({ value, valueLabel: `$${value.toFixed(2)}` });

const THIS = [
  42.1, 38.5, 55, 61.2, 47.8, 33.4, 29.9, 52.6, 64.3, 58, 49.5, 71.2, 66.8, 54.1, 45.7, 39.2, 62.4, 77.9,
  70.3, 58.8, 51.6, 48.2, 66, 73.5, 80.1, 69.4, 57.3, 62.9, 75.6, 81.8, 84.2,
];

const LAST = [
  35, 41.2, 47.5, 44.8, 39.1, 36.6, 42.3, 50.4, 53.7, 49.9, 46.2, 52.8, 58.1, 55.6, 51.3, 47, 53.9, 60.2,
  57.4, 54, 50.7, 56.3, 61.8, 59.5, 63.2, 60, 56.8, 62.5, 66.1, 64.4, 61,
];

const THIS_MONTH: LineSeries = { label: 'This month', points: THIS.map(point) };
const LAST_MONTH: LineSeries = { label: 'Last month', points: LAST.map(point) };
const SO_FAR: LineSeries = {
  label: 'This month',
  points: THIS.map((value, index) => (index < 18 ? point(value) : null)),
};

const TICKS = [
  { value: 0, label: '$0' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
];

const NAME = 'Spending in October';
const BOTH = [THIS_MONTH, LAST_MONTH] as const;

/** Each fixture, by the story or the edge it draws. */
const FIXTURES: [name: string, element: ReactElement][] = [
  ['Default', <LineChart aria-label={NAME} series={[THIS_MONTH]} xLabels={DAYS} yTicks={TICKS} />],
  ['TwoSeries', <LineChart aria-label={NAME} series={BOTH} xLabels={DAYS} yTicks={TICKS} />],
  ['WithArea', <LineChart aria-label={NAME} series={[THIS_MONTH]} xLabels={DAYS} yTicks={TICKS} hasArea />],
  ['Gaps', <LineChart aria-label={NAME} series={[SO_FAR]} xLabels={DAYS} yTicks={TICKS} />],
  // ActivePoint, ReadoutNearStart and TableView render TwoSeries' args and then act in their plays.
  ['ActivePoint', <LineChart aria-label={NAME} series={BOTH} xLabels={DAYS} yTicks={TICKS} />],
  ['ReadoutNearStart', <LineChart aria-label={NAME} series={BOTH} xLabels={DAYS} yTicks={TICKS} />],
  ['TableView', <LineChart aria-label={NAME} series={BOTH} xLabels={DAYS} yTicks={TICKS} />],
  [
    'RightToLeft',
    <div dir="rtl">
      <LineChart aria-label={NAME} series={BOTH} xLabels={DAYS} yTicks={TICKS} />
    </div>,
  ],
  [
    'named by aria-labelledby, with every label, xTicks, a yDomain and a height',
    <LineChart
      aria-labelledby="heading"
      series={BOTH}
      xLabels={DAYS}
      xTicks={[0, 7, 14, 21, 28, 30, 30, -1, 40, 2.5]}
      yTicks={[...TICKS, { value: 150, label: '$150' }, { value: 400, label: 'out' }]}
      yDomain={[0, 200]}
      height={180}
      labels={{ showTable: 'Table', showChart: 'Chart', noScript: 'No scripts.', roleDescription: 'graph' }}
      className="extra"
      data-testid="chart"
    />,
  ],
  [
    'blank names, falling to the column headers',
    <LineChart aria-label=" " aria-labelledby="  " series={BOTH} xLabels={DAYS} />,
  ],
  [
    'values far outside the domain, a value that is not finite and points past the labels',
    <LineChart
      aria-label={NAME}
      series={[
        { label: 'A', points: [point(1e300), point(-5), { value: Number.NaN, valueLabel: 'NaN' }, point(3)] },
        { label: 'B', points: [null, point(2), point(4), point(8), point(9)] },
      ]}
      xLabels={['Mon', 'Tue', 'Wed', 'Thu']}
      yDomain={[0, 10]}
      hasArea
    />,
  ],
  [
    'one position',
    <LineChart aria-label={NAME} series={[{ label: 'A', points: [point(3)] }]} xLabels={['Mon']} />,
  ],
  ['no data', <LineChart aria-label={NAME} series={[{ label: 'A', points: [] }]} xLabels={[]} />],
];

/** FNV-1a, 64 bits, over the UTF-8 bytes. */
const fnv1a = (text: string): string => {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(text)) {
    hash ^= BigInt(byte);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
};

/** The mounted markup with React's client ids written as one placeholder, so a step's hash is its own. */
const markupOf = (container: HTMLElement): string => {
  const html = container.innerHTML.replace(/_r_[0-9a-z]+_/g, '_id_');
  return `${String(html.length)} ${fnv1a(html)}`;
};

afterEach(() => {
  vi.useRealTimers();
});

describe("LineChart's markup", () => {
  it('is the same, byte for byte, as before the foundations moved', () => {
    const digests = Object.fromEntries(
      FIXTURES.map(([name, element]) => {
        const html = renderToStaticMarkup(element);
        return [name, `${String(html.length)} ${fnv1a(html)}`];
      }),
    );
    expect(digests).toMatchInlineSnapshot(`
      {
        "ActivePoint": "7152 136762014b87b7cb",
        "Default": "5399 2d65958ad481f882",
        "Gaps": "5005 2849a5fe4ff835fe",
        "ReadoutNearStart": "7152 136762014b87b7cb",
        "RightToLeft": "7173 6a8136a1098b696c",
        "TableView": "7152 136762014b87b7cb",
        "TwoSeries": "7152 136762014b87b7cb",
        "WithArea": "5776 10a71045e1e0f8e7",
        "blank names, falling to the column headers": "6653 4ba1e1ef7f770dca",
        "named by aria-labelledby, with every label, xTicks, a yDomain and a height": "7487 a3a348a86241790b",
        "no data": "1190 b1666212b291ca7b",
        "one position": "1426 52443c407792a93e",
        "values far outside the domain, a value that is not finite and points past the labels": "2598 3e1f2bf1d8dd7af7",
      }
    `);
  });

  it('is the same in full for a short chart of two series, with gridlines, an area and a gap', () => {
    const html = renderToStaticMarkup(
      <LineChart
        aria-label={NAME}
        series={[
          { label: 'This month', points: [point(12), point(40), point(84.2), null] },
          { label: 'Last month', points: [point(20), point(35), point(61), point(90)] },
        ]}
        xLabels={['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4']}
        yTicks={TICKS}
        hasArea
      />,
    );
    expect(html).toMatchInlineSnapshot(
      `"<figure aria-label="Spending in October" class="line-chart" data-view="chart"><div class="line-chart-chart"><ul class="line-chart-legend"><li class="line-chart-legend-item" data-series="1"><span class="line-chart-key" aria-hidden="true"></span><span class="line-chart-legend-label">This month</span></li><li class="line-chart-legend-item" data-series="2"><span class="line-chart-key" aria-hidden="true"></span><span class="line-chart-legend-label">Last month</span></li></ul><div class="line-chart-plot" role="group" aria-roledescription="chart" aria-label="Spending in October" data-has-y-labels="" style="block-size:240px"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><line class="line-chart-grid" x1="0" x2="100" y1="100" y2="100"></line><line class="line-chart-grid" x1="0" x2="100" y1="50" y2="50"></line><line class="line-chart-grid" x1="0" x2="100" y1="0" y2="0"></line><line class="line-chart-baseline" x1="0" x2="100" y1="100" y2="100"></line><path class="line-chart-area" d="M0 100L0 88L33.333 60L66.667 15.8L66.667 100Z"></path><path class="line-chart-line" data-series="2" d="M0 80L33.333 65L66.667 39L100 10"></path><path class="line-chart-line" data-series="1" d="M0 88L33.333 60L66.667 15.8"></path></svg><div class="line-chart-overlay" aria-hidden="true"><span class="line-chart-y-label" style="top:100%">$0</span><span class="line-chart-y-label" style="top:50%">$50</span><span class="line-chart-y-label" style="top:0%">$100</span></div><span class="line-chart-live" aria-live="polite" aria-atomic="true"></span></div><div class="line-chart-x" aria-hidden="true"><span class="line-chart-x-label" data-edge="start" style="inset-inline-start:0%">Oct 1</span><span class="line-chart-x-label" style="inset-inline-start:33.333%">Oct 2</span><span class="line-chart-x-label" data-edge="end" style="inset-inline-start:100%">Oct 4</span></div></div><table class="line-chart-table" hidden=""><caption>Spending in October</caption><thead><tr><td></td><th scope="col" id="_R_0_-series-1">This month</th><th scope="col" id="_R_0_-series-2">Last month</th></tr></thead><tbody><tr><th scope="row">Oct 1</th><td>$12.00</td><td>$20.00</td></tr><tr><th scope="row">Oct 2</th><td>$40.00</td><td>$35.00</td></tr><tr><th scope="row">Oct 3</th><td>$84.20</td><td>$61.00</td></tr><tr><th scope="row">Oct 4</th><td></td><td>$90.00</td></tr></tbody></table><div class="line-chart-toolbar"><button type="button" class="button button-tertiary line-chart-toggle">Show as table</button></div><noscript><p class="line-chart-noscript">Scripts are off, so the chart&#x27;s data is in the table below.</p><table class="line-chart-table"><caption>Spending in October</caption><thead><tr><td></td><th scope="col">This month</th><th scope="col">Last month</th></tr></thead><tbody><tr><th scope="row">Oct 1</th><td>$12.00</td><td>$20.00</td></tr><tr><th scope="row">Oct 2</th><td>$40.00</td><td>$35.00</td></tr><tr><th scope="row">Oct 3</th><td>$84.20</td><td>$61.00</td></tr><tr><th scope="row">Oct 4</th><td></td><td>$90.00</td></tr></tbody></table></noscript></figure>"`,
    );
  });

  it('is the same after mount, at every step of focus, the keys, a mouse, a touch and the toggle', () => {
    vi.useFakeTimers();
    const { container } = render(
      <div>
        <div dir="rtl">
          <LineChart aria-label={NAME} series={[SO_FAR, LAST_MONTH]} xLabels={DAYS} yTicks={TICKS} />
        </div>
        <p>Outside</p>
      </div>,
    );
    const plot = container.querySelector<HTMLElement>('.line-chart-plot');
    const toggle = container.querySelector<HTMLElement>('.line-chart-toggle');
    if (!plot || !toggle) throw new Error('No plot');
    // 310px across, so each of the 31 days is 10px apart, read from the right under dir="rtl".
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
    const steps: string[] = [markupOf(container)];
    const step = (run: () => void): void => {
      act(run);
      steps.push(markupOf(container));
    };
    const key = (name: string, init: Partial<KeyboardEventInit> = {}): void => {
      step(() => {
        fireEvent.keyDown(plot, { key: name, ...init });
      });
    };
    step(() => {
      plot.focus();
    });
    for (const name of ['ArrowRight', 'ArrowLeft', 'Home', 'PageDown', 'PageUp', 'End', 'ArrowLeft'])
      key(name);
    step(() => {
      vi.advanceTimersByTime(150);
    });
    key('Escape');
    key('Escape');
    key('End');
    key('ArrowRight');
    key('ArrowRight', { altKey: true });
    key('Tab');
    step(() => {
      plot.blur();
    });
    step(() => {
      fireEvent.pointerMove(plot, { clientX: 150, pointerType: 'mouse' });
    });
    step(() => {
      fireEvent.pointerMove(plot, { clientX: 295, pointerType: 'pen' });
    });
    step(() => {
      vi.advanceTimersByTime(500);
    });
    step(() => {
      fireEvent.pointerLeave(plot, { pointerType: 'mouse' });
    });
    step(() => {
      fireEvent.pointerDown(plot, { clientX: 20, pointerType: 'touch' });
    });
    step(() => {
      fireEvent.pointerLeave(plot, { pointerType: 'touch' });
    });
    step(() => {
      fireEvent.pointerDown(screen.getByText('Outside'), { pointerType: 'touch' });
    });
    step(() => {
      plot.focus();
    });
    step(() => {
      toggle.click();
    });
    step(() => {
      toggle.click();
    });
    expect(steps).toMatchInlineSnapshot(`
      [
        "4613 51d23d754a258795",
        "5143 bc5ef0477569d709",
        "5150 78e046386a664aea",
        "5143 bc5ef0477569d709",
        "5357 e40a7361abbdc9f6",
        "5371 ebfe29182e4f9183",
        "5357 e40a7361abbdc9f6",
        "5143 bc5ef0477569d709",
        "5143 bc5ef0477569d709",
        "5250 28211eaf3b4bf7ea",
        "4910 788d2d0eec9e890c",
        "4910 788d2d0eec9e890c",
        "4910 788d2d0eec9e890c",
        "5257 217444c5221a2d3b",
        "5257 217444c5221a2d3b",
        "5257 217444c5221a2d3b",
        "4613 51d23d754a258795",
        "5358 677e827e91b3ae26",
        "5370 33ab392c045f4a1b",
        "5370 33ab392c045f4a1b",
        "4613 51d23d754a258795",
        "5154 42d8fa9e86491a56",
        "5154 42d8fa9e86491a56",
        "4613 51d23d754a258795",
        "5143 bc5ef0477569d709",
        "4613 e5df510cb2c491c7",
        "4613 51d23d754a258795",
      ]
    `);
  });
});
