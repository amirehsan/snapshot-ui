// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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
      'tabindex="0"',
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
    ['line-chart-readout', 'line-chart-crosshair', 'line-chart-dot', 'data-active'],
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
