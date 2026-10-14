'use client';

import { Button, FilterChip, NumberField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/** Whole dollars from minor units, written by the app with no Intl: 12500 is "125". */
const dollars = (cents: number): string => String(Math.trunc(cents / 100));

/** The app's own words for the range. */
function amountLabel(over: number | null, under: number | null): string | undefined {
  if (over !== null && under !== null) return `$${dollars(over)} to $${dollars(under)}`;
  if (over !== null) return `Over $${dollars(over)}`;
  if (under !== null) return `Under $${dollars(under)}`;
  return undefined;
}

export default function FilterChipCustom(): ReactElement {
  const [over, setOver] = useState<number | null>(null);
  const [under, setUnder] = useState<number | null>(null);
  return (
    <FilterChip
      label="Amount"
      valueLabel={amountLabel(over, under)}
      onClear={() => {
        setOver(null);
        setUnder(null);
      }}
    >
      {({ close }) => (
        <div className="stack">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <NumberField label="Over" money={{ symbol: '$' }} value={over} onChange={setOver} />
            <NumberField label="Under" money={{ symbol: '$' }} value={under} onChange={setUnder} />
          </div>
          <Button variant="secondary" onPress={close}>
            Done
          </Button>
        </div>
      )}
    </FilterChip>
  );
}
