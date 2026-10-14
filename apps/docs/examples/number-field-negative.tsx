import { NumberField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function NumberFieldNegative(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      <NumberField
        label="Adjustment"
        description="A refund is under zero."
        money={{ symbol: '$' }}
        allowsNegative
        defaultValue={-4250}
      />
    </div>
  );
}
