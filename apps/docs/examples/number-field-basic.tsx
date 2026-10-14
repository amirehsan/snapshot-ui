import { NumberField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function NumberFieldBasic(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      <NumberField
        label="Guests"
        description="Up to twelve."
        hasStepper
        defaultValue={2}
        minValue={1}
        maxValue={12}
      />
    </div>
  );
}
