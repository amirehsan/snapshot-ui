import { Sparkline } from '@snapshot-ui/charts';
import { StatTile } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { NET_WORTH } from './sparkline-data';

export default function StatTileTrend(): ReactElement {
  return (
    <div className="tile-row">
      <StatTile
        label="Net worth"
        value="$48,210.00"
        change={{ direction: 'up', label: 'Up 3% this quarter' }}
        caption="All accounts, less what you owe"
        trend={<Sparkline data={NET_WORTH} />}
      />
    </div>
  );
}
