import { Sparkline } from '@snapshot-ui/charts';
import { StatTile } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { SPENDING } from './sparkline-data';

export default function SparklineTile(): ReactElement {
  return (
    <div className="tile-row">
      <StatTile
        label="Spending"
        value="$2,148.90"
        change={{ direction: 'up', label: 'Up 18% from last month' }}
        caption="Last 30 days"
        trend={<Sparkline data={SPENDING} />}
      />
    </div>
  );
}
