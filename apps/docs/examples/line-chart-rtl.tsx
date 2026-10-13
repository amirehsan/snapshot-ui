import { LineChart } from '@snapshot-ui/charts';
import { Card } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { DAYS, LAST_MONTH, THIS_MONTH, TICKS } from './line-chart-data';

export default function LineChartRtl(): ReactElement {
  return (
    <div className="chart-sample" dir="rtl">
      <Card>
        <LineChart
          aria-label="Spending in October, right to left"
          series={[THIS_MONTH, LAST_MONTH]}
          xLabels={DAYS}
          yTicks={TICKS}
        />
      </Card>
    </div>
  );
}
