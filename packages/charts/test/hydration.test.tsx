import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarChart, type BarSeries } from '../src/bar-chart';
import { LineChart, type LineSeries } from '../src/line-chart';
import { Sparkline } from '../src/sparkline';

/**
 * Each chart's server HTML, hydrated in the browser under three locales in two time zones (plan, standing lesson
 * 5). No chart reads a locale, a zone or the clock, so each writes the same HTML in all six, and hydration finds
 * what the server wrote: React's onRecoverableError fails the test on a text mismatch, and console.error on an
 * attribute that differs. After hydration each client chart has taken its tab stop.
 */

const LOCALES = ['en-US', 'de-DE', 'fa-IR'] as const;
const ZONES = ['UTC', 'Asia/Tehran'] as const;

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

const MERCHANTS: BarSeries = {
  label: 'October',
  values: [
    { value: 420, valueLabel: '$420.00' },
    { value: 260, valueLabel: '$260.00' },
    null,
    { value: -60, valueLabel: '-$60.00' },
  ],
};

const CHARTS: [name: string, element: ReactElement, after: (container: HTMLElement) => void][] = [
  [
    'LineChart',
    <LineChart
      aria-label="Spending in October"
      series={[THIS_MONTH]}
      xLabels={DAYS}
      yTicks={[
        { value: 0, label: '$0' },
        { value: 100, label: '$100' },
      ]}
    />,
    (container) => {
      expect(container.querySelector('.line-chart-plot')).toHaveAttribute('tabindex', '0');
    },
  ],
  [
    'Sparkline',
    <Sparkline data={[10, 20, 15]} hasArea aria-label="Spending, last 3 days" />,
    (container) => {
      expect(container.querySelector('.sparkline-end')).not.toBeNull();
    },
  ],
  [
    'BarChart',
    <BarChart
      aria-label="Spending by merchant"
      orientation="horizontal"
      categories={['Whole Foods Market', 'Shell', 'Netflix', 'Apple Store']}
      series={[MERCHANTS]}
      valueTicks={[
        { value: 0, label: '$0' },
        { value: 400, label: '$400' },
      ]}
    />,
    (container) => {
      const bars = [...container.querySelectorAll('.bar-chart-bar')];
      expect(bars).toHaveLength(3);
      expect(bars.map((bar) => bar.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    },
  ],
  [
    'BarChart loading',
    <BarChart
      aria-label="Spending by merchant"
      orientation="horizontal"
      categories={['Whole Foods Market', 'Shell']}
      series={[MERCHANTS]}
      status="loading"
    />,
    (container) => {
      // The status host the server left empty says the word once the chart is mounted.
      expect(container.querySelector('.bar-chart-status')).toHaveTextContent('Loading');
    },
  ],
  [
    'BarChart, vertical and grouped, with negatives',
    <BarChart
      aria-label="Income and net by month"
      categories={['Aug', 'Sep', 'Oct', 'Nov']}
      bands="time"
      series={[
        { label: 'Income', color: 'gain', values: [{ value: 420, valueLabel: '$420.00' }, null, null, null] },
        { ...MERCHANTS, label: 'Net' },
      ]}
      valueLabels="all"
      valueTicks={[
        { value: 0, label: '$0' },
        { value: 400, label: '$400' },
      ]}
    />,
    (container) => {
      const bars = [...container.querySelectorAll('.bar-chart-bar')];
      expect(bars).toHaveLength(4);
      // Time bands start at the newest band with a value.
      expect(bars.map((bar) => bar.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0']);
    },
  ],
  [
    'BarChart, horizontal, against the previous period',
    <BarChart
      aria-label="Spending by merchant, October against September"
      orientation="horizontal"
      categories={['Whole Foods Market', 'Shell', 'Netflix', 'Apple Store']}
      series={[MERCHANTS, { ...MERCHANTS, label: 'September', look: 'hatched' }]}
    />,
    (container) => {
      expect(container.querySelectorAll('.bar-chart-bar[data-look="hatched"]')).toHaveLength(3);
    },
  ],
  [
    'BarChart, stacked, lying down, with textures',
    <BarChart
      aria-label="Spending by category and month"
      orientation="horizontal"
      categories={['Sep', 'Oct']}
      layout="stacked"
      series={[
        MERCHANTS,
        { ...MERCHANTS, label: 'Shopping' },
        { ...MERCHANTS, label: 'Travel' },
        { ...MERCHANTS, label: 'Bills' },
        { ...MERCHANTS, label: 'Other' },
      ]}
      totals={['$2,100.00', '$1,300.00']}
      hasTexture
    />,
    (container) => {
      const bars = [...container.querySelectorAll('.bar-chart-bar')];
      expect(bars).toHaveLength(10);
      expect(bars.map((bar) => bar.getAttribute('tabindex'))).toEqual([
        '0',
        ...Array.from({ length: 9 }, () => '-1'),
      ]);
      expect(container.querySelectorAll('.bar-chart-bar[data-outer]')).toHaveLength(2);
    },
  ],
  [
    'BarChart, linked',
    <BarChart
      aria-label="Spending by merchant"
      orientation="horizontal"
      categories={['Whole Foods Market', 'Shell', 'Netflix', 'Apple Store']}
      series={[
        {
          ...MERCHANTS,
          values: MERCHANTS.values.map((value, at) =>
            value ? { ...value, href: `#transactions?merchant=${String(at)}` } : null,
          ),
        },
      ]}
    />,
    (container) => {
      // The links the server wrote, each a stop until now, are one stop; their targets never were one.
      const bars = [...container.querySelectorAll('.bar-chart-bar')];
      expect(bars.map((bar) => [bar.tagName, bar.getAttribute('tabindex')])).toEqual([
        ['A', '0'],
        ['A', '-1'],
        ['A', '-1'],
      ]);
      expect(
        [...container.querySelectorAll('.bar-chart-hit')].map((hit) => hit.getAttribute('tabindex')),
      ).toEqual(['-1', '-1', '-1']);
    },
  ],
  [
    'LineChart loading',
    <LineChart aria-label="Spending in October" series={[THIS_MONTH]} xLabels={DAYS} status="loading" />,
    (container) => {
      // The plot's region the server left empty says the word once the chart is mounted.
      expect(container.querySelector('.line-chart-live')).toHaveTextContent('Loading');
      expect(container.querySelector('.line-chart-plot')).toHaveAttribute('tabindex', '-1');
    },
  ],
];

/** Sets the reader's language and the process's time zone, as a browser in that place would have them. */
const place = (locale: string, zone: string): void => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(locale);
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue([locale]);
  document.documentElement.lang = locale;
  vi.stubEnv('TZ', zone);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  document.documentElement.removeAttribute('lang');
});

describe('the charts hydrate', () => {
  it('in the zone they are given, so the rows below prove something', () => {
    place('fa-IR', 'Asia/Tehran');
    // Tehran is three and a half hours ahead of UTC all year.
    expect(new Date(Date.UTC(2026, 9, 18, 12)).getHours()).toBe(15);
    expect(navigator.language).toBe('fa-IR');
  });

  const ROWS = CHARTS.flatMap(([name, element, after]) =>
    LOCALES.flatMap((locale) => ZONES.map((zone) => [name, locale, zone, element, after] as const)),
  );

  it.each(ROWS)('%s under %s in %s with no mismatch', (_name, locale, zone, element, after) => {
    // The server's HTML, written in UTC with no locale of its own.
    const html = renderToString(element);
    place(locale, zone);
    // A chart writes no locale and no zone, so the HTML is the same wherever it is written.
    expect(renderToString(element)).toBe(html);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const consoleError = vi.spyOn(console, 'error');
    const recoverable = vi.fn();
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, element, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    after(container);
    act(() => {
      root?.unmount();
    });
    container.remove();
  });
});
