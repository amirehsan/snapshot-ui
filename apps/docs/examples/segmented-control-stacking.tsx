'use client';

import { SegmentedControl, SegmentedControlItem } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

function Cadence({ label }: { label: string }): ReactElement {
  return (
    <SegmentedControl label={label} defaultValue="weekly">
      <SegmentedControlItem value="daily">Daily</SegmentedControlItem>
      <SegmentedControlItem value="weekly">Weekly</SegmentedControlItem>
      <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
      <SegmentedControlItem value="quarterly">Quarterly</SegmentedControlItem>
      <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
    </SegmentedControl>
  );
}

export default function SegmentedControlStacking(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', gap: 32 }}>
      <div style={{ width: '100%', maxWidth: '40rem' }}>
        <Cadence label="Report cadence in a wide room" />
      </div>
      <div style={{ width: '100%', maxWidth: '18rem' }}>
        <Cadence label="Report cadence in a narrow room" />
      </div>
    </div>
  );
}
