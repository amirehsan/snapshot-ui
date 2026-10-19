import { BarChart } from '@snapshot-ui/charts';
import { Card, CardHeader, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { MONTHS, NET_BY_MONTH, NET_TICKS } from './insights-data';

export default function BarChartMonths(): ReactElement {
  return (
    <div className="chart-sample">
      <Card as="section" aria-labelledby="bar-chart-months-title">
        <CardHeader>
          <CardTitle id="bar-chart-months-title" level={3}>
            Net cash flow, the last twelve months
          </CardTitle>
        </CardHeader>
        <BarChart
          aria-labelledby="bar-chart-months-title"
          bands="time"
          categories={MONTHS}
          series={[NET_BY_MONTH]}
          valueTicks={NET_TICKS}
          valueLabels={[1, 7, 11]}
        />
      </Card>
    </div>
  );
}
