import { LineChart, type LineSeries } from '@snapshot-ui/charts';
import { Card } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { DAYS, THIS_MONTH, TICKS } from './line-chart-data';

/** This month on Oct 18: the days still to come have no value, so they are null. */
const SO_FAR: LineSeries = {
  label: 'This month',
  points: THIS_MONTH.points.map((point, index) => (index < 18 ? point : null)),
};

export default function LineChartGaps(): ReactElement {
  return (
    <div className="chart-sample">
      <Card>
        <LineChart
          aria-label="Spending so far in October"
          series={[SO_FAR]}
          xLabels={DAYS}
          yTicks={TICKS}
          hasArea
        />
      </Card>
    </div>
  );
}
