'use client';

import { FieldExtras, NumberField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/** A month of the reader's fixed bills, in cents, which the app worked out. */
const MONTH_OF_BILLS = 234000;

export default function FieldExtrasSuggestion(): ReactElement {
  // Empty until the reader types or takes the suggestion: never prefilled.
  const [cents, setCents] = useState<number | null>(null);
  return (
    <FieldExtras
      fieldLabel="Cushion"
      suggestion={{
        value: '$2,340',
        reason: 'a month of your fixed bills',
        isCurrent: cents === MONTH_OF_BILLS,
        onTake: () => {
          setCents(MONTH_OF_BILLS);
        },
      }}
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      <NumberField
        label="Cushion"
        description="Kept aside before anything counts as spare."
        money={{ symbol: '$' }}
        value={cents}
        onChange={setCents}
      />
    </FieldExtras>
  );
}
