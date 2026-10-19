// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BarChart, type BarSeries } from '../src/bar-chart';
import { LineChart, type LineSeries } from '../src/line-chart';

/**
 * The client charts, rendered on the server. A Next.js server page imports them as client references and the
 * server renders them once to HTML before the browser takes over, so each must render with no window, no
 * document and no layout. This file runs in Node, which has none of the three: a chart that reads one while it
 * renders throws here. (Effects and handlers do not run during a server render, so they may.)
 */

const DAYS = ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4'];

const THIS_MONTH: LineSeries = {
  label: 'This month',
  points: [
    { value: 12, valueLabel: '$12.00' },
    { value: 40, valueLabel: '$40.00' },
    { value: 84.2, valueLabel: '$84.20' },
    null,
  ],
};

const LAST_MONTH: LineSeries = {
  label: 'Last month',
  points: [
    { value: 20, valueLabel: '$20.00' },
    { value: 35, valueLabel: '$35.00' },
    { value: 61, valueLabel: '$61.00' },
    { value: 90, valueLabel: '$90.00' },
  ],
};

/** A month's spending by merchant, with a refund that nets below zero and a row with no value. */
const MERCHANTS: BarSeries = {
  label: 'October',
  values: [
    { value: 420, valueLabel: '$420.00' },
    { value: 260, valueLabel: '$260.00' },
    null,
    { value: -60, valueLabel: '-$60.00' },
  ],
};

const TICKS = [
  { value: 0, label: '$0' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
];

/** Each client chart, what its HTML holds, and what must stay out of it until a reader acts. */
const CLIENT: [name: string, element: ReactElement, contains: string[], excludes: string[]][] = [
  [
    // Nothing is active on the server, so there is no readout, no crosshair and no dot.
    'LineChart',
    <LineChart
      aria-label="Spending in October"
      series={[THIS_MONTH, LAST_MONTH]}
      xLabels={DAYS}
      yTicks={TICKS}
      hasArea
    />,
    [
      '<figure',
      'class="line-chart"',
      'aria-label="Spending in October"',
      'role="group"',
      'aria-roledescription="chart"',
      'data-series="2"',
      'class="line-chart-area"',
      'class="line-chart-y-label"',
      '<caption>Spending in October</caption>',
      'hidden=""',
      '>Show as table<',
      '<noscript>',
      'class="line-chart-noscript"',
      'aria-live="polite"',
    ],
    // The plot takes its tab stop once scripts run: with them off, its keys would do nothing.
    ['line-chart-readout', 'line-chart-crosshair', 'line-chart-dot', 'data-active', 'tabindex'],
  ],
  [
    // Every bar's place and size, the labels, the amounts and the zero line are the server's: the final
    // picture. Nothing is active, and the bars take their roving tab stop once scripts run.
    'BarChart',
    <BarChart
      aria-label="Spending by merchant"
      orientation="horizontal"
      categories={['Whole Foods Market', 'Shell', 'Netflix', 'Apple Store']}
      series={[MERCHANTS]}
      valueDomain={[-100, 500]}
      valueTicks={[
        { value: 0, label: '$0' },
        { value: 500, label: '$500' },
      ]}
    />,
    [
      '<figure',
      'class="bar-chart"',
      'data-orientation="horizontal"',
      'aria-label="Spending by merchant"',
      'class="bar-chart-rows" role="group" aria-roledescription="chart"',
      '--bar-chart-rows:4',
      'class="bar-chart-gridlines" aria-hidden="true"',
      'preserveAspectRatio="none"',
      'class="bar-chart-baseline" data-crosses="" x1="16.667" x2="16.667"',
      'class="bar-chart-category" aria-hidden="true">Whole Foods Market<',
      'role="img" aria-roledescription="bar"',
      'data-sign="positive" data-nonzero=""',
      'inset-inline-start:16.667%;inline-size:70%',
      'data-sign="negative"',
      'inset-inline-end:83.333%;inline-size:10%',
      'class="bar-chart-amount" data-look="fill">-$60.00<',
      'class="bar-chart-tick" data-edge="end"',
      '<caption>Spending by merchant</caption>',
      'hidden=""',
      '>Show as table<',
      '<noscript>',
      'class="bar-chart-noscript"',
      'class="bar-chart-status" role="status"></span>',
    ],
    ['bar-chart-readout', 'data-active', 'data-pointer', 'tabindex', 'aria-busy'],
  ],
  [
    // Months standing up, income beside spending, a bad month below zero: every bar's band, place in its pair,
    // end and corner are the server's, and the thickness is the CSS's, from the band and group counts.
    'BarChart, vertical and grouped, with negatives',
    <BarChart
      aria-label="Income and spending by month"
      categories={['Aug', 'Sep', 'Oct', 'Nov']}
      series={[
        { label: 'Income', color: 'gain', values: [{ value: 420, valueLabel: '$420.00' }, null, null, null] },
        { ...MERCHANTS, label: 'Net', color: 'ink' },
      ]}
      valueDomain={[-100, 500]}
      valueLabels="all"
    />,
    [
      'data-orientation="vertical"',
      'class="bar-chart-plot" role="group" aria-roledescription="chart"',
      'data-room-start="" data-room-end=""',
      'style="--bar-chart-bands:4;--bar-chart-group:2"',
      'class="bar-chart-bars" style="block-size:240px"',
      'class="bar-chart-gridlines" aria-hidden="true"',
      'class="bar-chart-baseline" data-crosses="" x1="0" x2="100" y1="83.333" y2="83.333"',
      'data-color="gain" data-look="fill" data-sign="positive" data-nonzero=""',
      'inset-block-end:16.667%;block-size:70%;--bar-chart-centre:12.5%;--bar-chart-index:0',
      'inset-block-start:83.333%;block-size:10%;--bar-chart-centre:87.5%;--bar-chart-index:1',
      'class="bar-chart-values" aria-hidden="true"',
      'class="bar-chart-categories" aria-hidden="true" data-bands="category"',
      'class="bar-chart-band-label" data-third="">Aug<',
      '<caption>Income and spending by month</caption>',
    ],
    ['bar-chart-readout', 'data-active', 'data-pointer', 'tabindex', 'bar-chart-rows', 'bar-chart-amount'],
  ],
  [
    // This period beside the last, lying down: the previous period is hatched in the first series' color, its
    // amount slate by its look, and its legend key Meter's hatched swatch.
    'BarChart, horizontal, against the previous period',
    <BarChart
      aria-label="Spending by merchant, October against September"
      orientation="horizontal"
      categories={['Whole Foods Market', 'Shell', 'Netflix', 'Apple Store']}
      series={[MERCHANTS, { ...MERCHANTS, label: 'September', look: 'hatched' }]}
    />,
    [
      'class="bar-chart-legend-item" data-color="ink" data-look="hatched"',
      'data-color="ink" data-look="hatched" data-sign="positive"',
      'class="bar-chart-amount" data-look="hatched">$420.00<',
      '--bar-chart-group:2',
    ],
    ['data-color="slate"', 'tabindex'],
  ],
  [
    // Loading in the plot's own space: a still placeholder at the plot's height, the region empty until mount.
    'LineChart, loading',
    <LineChart aria-label="Spending in October" series={[THIS_MONTH]} xLabels={DAYS} status="loading" />,
    [
      'data-status="loading"',
      'aria-busy="true"',
      'class="skeleton line-chart-skeleton" aria-hidden="true"',
      'aria-live="polite" aria-atomic="true"></span>',
      'style="block-size:240px"',
    ],
    ['line-chart-line', 'line-chart-toggle', '<table', 'tabindex'],
  ],
];

describe('the client charts on the server', () => {
  it('has neither a window nor a document, so the renders below prove something', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it.each(CLIENT)('%s renders to HTML with no browser', (_name, element, contains, excludes) => {
    const html = renderToString(element);
    for (const part of contains) expect(html).toContain(part);
    for (const part of excludes) expect(html).not.toContain(part);
  });

  it("names each bar on the server by the shown table's ids, which the noscript copy does not repeat", () => {
    const html = renderToString(
      <BarChart
        aria-label="Spending by merchant"
        orientation="horizontal"
        categories={['Whole Foods Market', 'Shell']}
        series={[MERCHANTS]}
      />,
    );
    const names = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1] ?? '');
    expect(names).toHaveLength(2);
    for (const id of names.flatMap((name) => name.split(' '))) {
      expect(html.match(new RegExp(` id="${id}"`, 'g'))).toHaveLength(1);
      expect(html.slice(html.indexOf('<noscript>'))).not.toContain(id);
    }
  });

  it('puts a second, shown table in noscript', () => {
    const html = renderToString(
      <LineChart aria-label="Spending in October" series={[THIS_MONTH, LAST_MONTH]} xLabels={DAYS} />,
    );
    const tables = [...html.matchAll(/<table[^>]*>/g)];
    expect(tables).toHaveLength(2);
    const noscript = html.indexOf('<noscript>');
    const [first, second] = tables;
    expect(first?.[0]).toContain('hidden=""');
    expect(first?.index).toBeLessThan(noscript);
    // The copy comes after the note, and nothing hides it.
    expect(second?.index).toBeGreaterThan(html.indexOf('class="line-chart-noscript"'));
    expect(second?.index).toBeGreaterThan(noscript);
    expect(second?.[0]).not.toContain('hidden');
    expect(html.indexOf('</noscript>')).toBeGreaterThan(second?.index ?? Infinity);
    // The copy carries no id, so the page's one table keeps any id the name points to.
    expect(html.slice(noscript)).not.toContain(' id="');
  });
});
