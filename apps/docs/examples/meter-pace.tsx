import { Card, Meter } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function MeterPace(): ReactElement {
  return (
    <div className="sample-column">
      <Card>
        <Meter
          label="Transport"
          max={400}
          segments={[
            { value: 210, look: 'fill', label: 'Spent', valueLabel: '$210.00' },
            { value: 40, look: 'hatched', label: 'Held', valueLabel: '$40.00' },
          ]}
          valueLabel="$250 of $400"
          pace={{ value: 260, label: "Where you'd be today: $260" }}
          hasLegend
        />
      </Card>
    </div>
  );
}
