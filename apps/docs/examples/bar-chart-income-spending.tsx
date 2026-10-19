import { BarChart } from '@snapshot-ui/charts';
import { Card, CardHeader, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { HALF_YEAR, INCOME, INCOME_TICKS, SPENDING } from './insights-data';

export default function BarChartIncomeSpending(): ReactElement {
  return (
    <div className="chart-sample">
      <Card as="section" aria-labelledby="bar-chart-income-spending-title">
        <CardHeader>
          <CardTitle id="bar-chart-income-spending-title" level={3}>
            Income and spending by month
          </CardTitle>
        </CardHeader>
        <BarChart
          aria-labelledby="bar-chart-income-spending-title"
          bands="time"
          categories={HALF_YEAR}
          categoryTicks={[0, 1, 2, 3, 4, 5]}
          series={[INCOME, SPENDING]}
          valueTicks={INCOME_TICKS}
        />
      </Card>
    </div>
  );
}
