import { LineChart } from '@snapshot-ui/charts';
import { Card } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { DAYS, THIS_MONTH, TICKS } from './line-chart-data';

export default function LineChartBasic(): ReactElement {
  return (
    <div className="chart-sample">
      <Card>
        <LineChart aria-label="Spending in October" series={[THIS_MONTH]} xLabels={DAYS} yTicks={TICKS} />
      </Card>
    </div>
  );
}
