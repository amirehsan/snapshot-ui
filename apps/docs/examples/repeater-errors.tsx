'use client';

import { NumberField, Repeater } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

interface Tier {
  id: string;
  amount: number | null;
}

/** Dollars from cents, for an error sentence, without Intl: the field shows the figure itself. */
const dollars = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

let made = 0;

export default function RepeaterErrors(): ReactElement {
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 'small', amount: 10000 },
    { id: 'repeat', amount: 10000 },
    { id: 'lower', amount: 5000 },
  ]);
  // A row's error: an amount another tier already starts from. Yours to check, by row id.
  const rowErrors: Record<string, string> = {};
  tiers.forEach((tier, index) => {
    const earlier = tiers.slice(0, index).findIndex((other) => other.amount === tier.amount);
    if (tier.amount !== null && earlier !== -1) {
      rowErrors[tier.id] = `Tier ${String(earlier + 1)} already waits from ${dollars(tier.amount)}`;
    }
  });
  // The set's error: the tiers out of order. You sort them when you save, so this is a hint before it.
  const sorted = tiers.every(
    (tier, index) => index === 0 || (tier.amount ?? 0) >= (tiers[index - 1]?.amount ?? 0),
  );
  return (
    <Repeater<Tier>
      label="Wait tiers"
      value={tiers}
      onChange={setTiers}
      createRow={() => {
        made += 1;
        return { id: `tier-${String(made)}`, amount: null };
      }}
      rowLabel={(index) => `Tier ${String(index + 1)}`}
      maxRows={4}
      labels={{ add: 'Add a tier' }}
      rowErrors={rowErrors}
      errorMessage={sorted ? undefined : 'Tiers must go up by amount'}
      style={{ width: '100%', maxWidth: '40rem' }}
    >
      {(tier, { update, error }) => (
        <NumberField
          label="Up to"
          money={{ symbol: '$' }}
          value={tier.amount}
          isRequired
          // The row's error marks its field invalid; the field's own error, a required amount, is the field's.
          isInvalid={error !== undefined}
          onChange={(amount) => {
            update({ ...tier, amount });
          }}
        />
      )}
    </Repeater>
  );
}
