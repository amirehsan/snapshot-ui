import { BarChart } from '@snapshot-ui/charts';
import { Card } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { COMPARE_MONTHS, COMPARE_TICKS, LAST_YEAR_BY_MONTH, THIS_YEAR_BY_MONTH } from './insights-data';

export default function BarChartCompare(): ReactElement {
  return (
    <div className="chart-sample">
      <Card>
        <BarChart
          aria-label="Spending by month, this year against last year"
          categories={COMPARE_MONTHS}
          series={[THIS_YEAR_BY_MONTH, LAST_YEAR_BY_MONTH]}
          valueTicks={COMPARE_TICKS}
        />
      </Card>
    </div>
  );
}
