import { BarChart } from '@snapshot-ui/charts';
import { Card, CardHeader, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { CATEGORY_MIX, HALF_YEAR, MIX_TICKS, MIX_TOTALS } from './insights-data';

export default function BarChartStacked(): ReactElement {
  return (
    <div className="chart-sample">
      <Card as="section" aria-labelledby="bar-chart-stacked-title">
        <CardHeader>
          <CardTitle id="bar-chart-stacked-title" level={3}>
            Spending by category, the last six months
          </CardTitle>
        </CardHeader>
        <BarChart
          aria-labelledby="bar-chart-stacked-title"
          layout="stacked"
          bands="time"
          categories={HALF_YEAR}
          categoryTicks={[0, 1, 2, 3, 4, 5]}
          series={CATEGORY_MIX}
          totals={MIX_TOTALS}
          valueLabels="all"
          valueTicks={MIX_TICKS}
        />
      </Card>
    </div>
  );
}
