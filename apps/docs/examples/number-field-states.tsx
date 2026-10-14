import { NumberField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function NumberFieldStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      <NumberField label="Budget" money={{ symbol: '$' }} defaultValue={250000} isChanged />
      <NumberField
        label="Limit"
        money={{ symbol: '$' }}
        defaultValue={1500000}
        isInvalid
        errorMessage="Enter an amount under $10,000."
      />
      <NumberField label="Deposit" money={{ symbol: '$' }} defaultValue={5000} isDisabled />
    </div>
  );
}
