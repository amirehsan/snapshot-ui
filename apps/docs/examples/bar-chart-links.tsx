import { BarChart, type BarSeries } from '@snapshot-ui/charts';
import { Card, CardHeader, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { BY_CATEGORY, CATEGORIES } from './insights-data';

/**
 * Each category's bar opens its transactions for the month shown. The hrefs are data, so a server page passes
 * them as it passes the figures, and every bar is a link in the HTML it sends.
 */
const LINKED: BarSeries = {
  ...BY_CATEGORY,
  values: BY_CATEGORY.values.map((value, at) =>
    value
      ? { ...value, href: `#transactions?category=${(CATEGORIES[at] ?? '').toLowerCase()}&month=2026-10` }
      : null,
  ),
};

export default function BarChartLinks(): ReactElement {
  return (
    <div className="chart-sample">
      <Card as="section" aria-labelledby="bar-chart-links-title">
        <CardHeader>
          <CardTitle id="bar-chart-links-title" level={3}>
            October&apos;s spending by category
          </CardTitle>
        </CardHeader>
        <BarChart
          aria-labelledby="bar-chart-links-title"
          orientation="horizontal"
          categories={CATEGORIES}
          series={[LINKED]}
        />
      </Card>
    </div>
  );
}
