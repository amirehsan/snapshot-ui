import { StatTile } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** A small drawing, 96 by 32, hidden from assistive technology: the tile's text already says the change. */
function Trend(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      width="96"
      height="32"
      viewBox="0 0 96 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', color: 'var(--color-slate)' }}
    >
      <polyline points="2,26 14,22 26,24 38,16 50,18 62,10 74,13 86,6 94,4" />
    </svg>
  );
}

export default function StatTileTrend(): ReactElement {
  return (
    <div className="tile-row">
      <StatTile
        label="Net worth"
        value="$48,210.00"
        change={{ direction: 'up', label: 'Up 3% this quarter' }}
        caption="All accounts, less what you owe"
        trend={<Trend />}
      />
    </div>
  );
}
