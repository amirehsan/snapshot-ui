'use client';

import { NumberField, PickerOption, Repeater, Select } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/** A wait tier: payments up to an amount, in cents, wait this long before they count. */
interface Tier {
  id: string;
  amount: number | null;
  wait: string;
}

const WAITS = [
  ['day', 'A day'],
  ['three', '3 days'],
  ['week', 'A week'],
  ['month', 'A month'],
] as const;

let made = 0;

export default function RepeaterBasic(): ReactElement {
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 'small', amount: 10000, wait: 'three' },
    { id: 'large', amount: 50000, wait: 'week' },
  ]);
  return (
    <Repeater<Tier>
      label="Wait tiers"
      description="A payment waits by its amount, the larger the longer."
      value={tiers}
      onChange={setTiers}
      // A new row with an id of its own, stable across adds, removes and saves.
      createRow={() => {
        made += 1;
        return { id: `tier-${String(made)}`, amount: null, wait: 'three' };
      }}
      rowLabel={(index) => `Tier ${String(index + 1)}`}
      maxRows={4}
      labels={{ add: 'Add a tier' }}
      style={{ width: '100%', maxWidth: '40rem' }}
    >
      {(tier, { update }) => (
        <>
          <NumberField
            label="Up to"
            money={{ symbol: '$' }}
            value={tier.amount}
            onChange={(amount) => {
              update({ ...tier, amount });
            }}
          />
          <Select
            label="Wait"
            value={tier.wait}
            onChange={(key) => {
              update({ ...tier, wait: String(key) });
            }}
          >
            {WAITS.map(([id, name]) => (
              <PickerOption key={id} id={id}>
                {name}
              </PickerOption>
            ))}
          </Select>
        </>
      )}
    </Repeater>
  );
}
