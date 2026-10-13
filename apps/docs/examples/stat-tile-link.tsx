import { StatTile } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function StatTileLink(): ReactElement {
  return (
    <div className="tile-row">
      {/* The whole tile is one link, named by everything it shows. */}
      <StatTile
        href="#spending"
        label="Spending"
        value="$1,284.50"
        change={{ direction: 'up', label: 'Up 12% from last month' }}
        caption="Across all accounts"
      />
    </div>
  );
}
