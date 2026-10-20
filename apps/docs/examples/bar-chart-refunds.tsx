import { BarChart } from '@snapshot-ui/charts';
import { Card } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { BY_CATEGORY, CATEGORIES, CATEGORY_TICKS } from './insights-data';

export default function BarChartRefunds(): ReactElement {
  return (
    <div className="chart-sample">
      <Card>
        <BarChart
          aria-label="Spending by category, October, with refunds"
          orientation="horizontal"
          categories={CATEGORIES}
          series={[BY_CATEGORY]}
          valueTicks={CATEGORY_TICKS}
        />
      </Card>
    </div>
  );
}
