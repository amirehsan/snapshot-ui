import { BarChart } from '@snapshot-ui/charts';
import { Card } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import {
  COMPARE_CATEGORIES,
  COMPARE_TICKS,
  OCTOBER_BY_CATEGORY,
  SEPTEMBER_BY_CATEGORY,
} from './insights-data';

export default function BarChartCompare(): ReactElement {
  return (
    <div className="chart-sample">
      <Card>
        <BarChart
          aria-label="Spending by category, October against September"
          categories={COMPARE_CATEGORIES}
          series={[OCTOBER_BY_CATEGORY, SEPTEMBER_BY_CATEGORY]}
          valueTicks={COMPARE_TICKS}
        />
      </Card>
    </div>
  );
}
