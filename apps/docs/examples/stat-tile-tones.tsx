import { StatTile } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function StatTileTones(): ReactElement {
  return (
    <div className="tile-row">
      {/* Neutral: more spending is not good or bad on its own, so the sentence says it and the color does not. */}
      <StatTile
        label="Spending"
        value="$1,284.50"
        change={{ direction: 'up', label: 'Up 12% from last month' }}
        caption="Across all accounts"
      />
      {/* Gain: money that arrived. */}
      <StatTile
        label="Income"
        value="$5,420.00"
        change={{ direction: 'up', label: 'Up $420 from last month', tone: 'gain' }}
        caption="Paid into checking"
      />
      {/* Warning: a state that needs a look. */}
      <StatTile
        label="Savings"
        value="$12,000.00"
        change={{ direction: 'flat', label: 'No change in 3 weeks', tone: 'warning' }}
        caption="Emergency fund"
      />
    </div>
  );
}
