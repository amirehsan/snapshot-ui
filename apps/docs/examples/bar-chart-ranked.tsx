import { BarChart } from '@snapshot-ui/charts';
import { Card, CardHeader, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { BY_MERCHANT, MERCHANT_TICKS, MERCHANTS } from './insights-data';

export default function BarChartRanked(): ReactElement {
  return (
    <div className="chart-sample">
      <Card as="section" aria-labelledby="bar-chart-ranked-title">
        <CardHeader>
          <CardTitle id="bar-chart-ranked-title" level={3}>
            Spending by merchant, October
          </CardTitle>
        </CardHeader>
        <BarChart
          aria-labelledby="bar-chart-ranked-title"
          orientation="horizontal"
          categories={MERCHANTS}
          series={[BY_MERCHANT]}
          valueTicks={MERCHANT_TICKS}
        />
      </Card>
    </div>
  );
}
