import { Card, Gauge } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function GaugeBasic(): ReactElement {
  return (
    <Card>
      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--spacing-separate)' }}>
        {/* A 32px ring with its text beside it, then 96px and 160px with their text under them. */}
        <Gauge size="sm" label="Saved" value={62} valueLabel="62% of your goal" />
        <Gauge label="Saved" value={62} valueLabel="$6,200 of $10,000" figure="62%" />
        <Gauge
          size="lg"
          form="semicircle"
          label="Spent this month"
          value={41}
          valueLabel="$1,230 of $3,000"
          figure="41%"
          figureCaption="On track"
        />
      </div>
    </Card>
  );
}
