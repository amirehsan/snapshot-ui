import { Card, Meter } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function MeterOver(): ReactElement {
  return (
    <div className="sample-column">
      <Card>
        {/* Over the limit the bar turns the warning color, and the words say so: color is never the only signal. */}
        <Meter
          label="Dining out"
          max={300}
          segments={[
            { value: 280, look: 'fill', label: 'Spent', valueLabel: '$280.00' },
            { value: 60, look: 'hatched', label: 'Held', valueLabel: '$60.00' },
          ]}
          valueLabel="$340 of $300, $40 over"
          hasLegend
        />
      </Card>
    </div>
  );
}
