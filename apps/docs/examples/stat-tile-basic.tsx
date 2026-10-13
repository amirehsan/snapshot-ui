import { StatTile } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function StatTileBasic(): ReactElement {
  return (
    <div className="tile-row">
      <StatTile
        label="Spending"
        value="$1,284.50"
        change={{ direction: 'up', label: 'Up 12% from last month' }}
        caption="Across all accounts"
      />
    </div>
  );
}
