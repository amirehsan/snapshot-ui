import { Card, Gauge, type GaugeMark } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const MARKS: GaugeMark[] = [
  { value: 10, label: 'Best under 10%' },
  { value: 30, label: 'Keep it under 30%' },
];

export default function GaugeUtilization(): ReactElement {
  return (
    <Card>
      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--spacing-separate)' }}>
        <Gauge
          label="Overall utilization"
          value={23}
          valueLabel="23% of your limits"
          figure="23%"
          marks={MARKS}
        />
        {/* A state that needs a look: warning, and the words say why. */}
        <Gauge
          label="Travel Mastercard"
          tone="warning"
          value={47}
          valueLabel="47% of its limit, above 30%"
          figure="47%"
          marks={MARKS}
        />
        {/* Over the limit a neutral gauge draws warning by itself; the words must say "over". */}
        <Gauge
          label="Store card"
          value={104}
          valueLabel="104% of its limit, over"
          figure="104%"
          marks={MARKS}
        />
        {/* Error only where the limit stopped something. */}
        <Gauge
          label="Everyday Visa"
          tone="error"
          value={100}
          valueLabel="At its limit, a payment was declined"
          figure="100%"
          marks={MARKS}
        />
      </div>
    </Card>
  );
}
