import { Card, Meter } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function MeterBasic(): ReactElement {
  return (
    <div className="sample-column">
      <Card>
        <Meter
          label="Groceries"
          max={1200}
          segments={[
            { value: 820, look: 'fill', label: 'Spent', valueLabel: '$820.00' },
            { value: 200, look: 'hatched', label: 'Held', valueLabel: '$200.00' },
          ]}
          valueLabel="$1,020 of $1,200"
        />
      </Card>
    </div>
  );
}
