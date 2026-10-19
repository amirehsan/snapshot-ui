'use client';

import { FieldExtras, NumberField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SUGGESTED = 234000;
const DEFAULT = 100000;

export default function FieldExtrasBoth(): ReactElement {
  const [cents, setCents] = useState<number | null>(50000);
  return (
    <FieldExtras
      fieldLabel="Cushion"
      // The suggestion is drawn first: it is about this reader, the default about everyone.
      suggestion={{
        value: '$2,340',
        reason: 'a month of your fixed bills',
        isCurrent: cents === SUGGESTED,
        onTake: () => {
          setCents(SUGGESTED);
        },
      }}
      defaultOffer={{
        value: '$1,000',
        isCurrent: cents === DEFAULT,
        onTake: () => {
          setCents(DEFAULT);
        },
      }}
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      <NumberField label="Cushion" money={{ symbol: '$' }} value={cents} onChange={setCents} />
    </FieldExtras>
  );
}
