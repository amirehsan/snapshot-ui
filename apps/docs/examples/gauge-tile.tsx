import { Gauge, StatTile } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function GaugeTile(): ReactElement {
  return (
    <div className="tile-row">
      <StatTile
        label="Credit used"
        value="$1,150.00"
        caption="Of $5,000 across your cards"
        // A 32px ring fits the trend's 96 by 32 slot, named since the tile's words do not say the share.
        trend={
          <Gauge
            aria-label="Credit used, share of your limits"
            size="sm"
            value={23}
            valueLabel="23%"
            marks={[
              { value: 10, label: 'Best under 10%' },
              { value: 30, label: 'Keep it under 30%' },
            ]}
          />
        }
      />
    </div>
  );
}
