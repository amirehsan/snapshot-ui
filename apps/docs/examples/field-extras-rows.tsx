'use client';

import { FieldExtras, NumberField, PickerOption, Repeater, Select } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

interface Tier {
  id: string;
  amount: number | null;
  wait: string;
}

const WAITS = [
  ['three', '3 days'],
  ['week', 'A week'],
  ['two-weeks', 'Two weeks'],
  ['month', 'A month'],
] as const;

/** The product's default set, without ids: a reset gives each row a new one. */
const DEFAULT_TIERS = [
  { amount: 10000, wait: 'three' },
  { amount: 50000, wait: 'week' },
  { amount: 150000, wait: 'month' },
];

let made = 0;
const newId = (): string => {
  made += 1;
  return `tier-${String(made)}`;
};

export default function FieldExtrasRows(): ReactElement {
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 'small', amount: 20000, wait: 'three' },
    { id: 'large', amount: 80000, wait: 'two-weeks' },
  ]);
  const isDefault =
    JSON.stringify(tiers.map(({ amount, wait }) => ({ amount, wait }))) === JSON.stringify(DEFAULT_TIERS);
  return (
    <FieldExtras
      // One offer for the whole set: a reset replaces the rows and focuses the first row's first field.
      scope="group"
      fieldLabel="Wait tiers"
      defaultOffer={{
        value: '$100 waits 3 days, $500 a week, $1,500 a month',
        isCurrent: isDefault,
        onTake: () => {
          setTiers(DEFAULT_TIERS.map((tier) => ({ ...tier, id: newId() })));
        },
      }}
      style={{ width: '100%', maxWidth: '40rem' }}
    >
      <Repeater<Tier>
        label="Wait tiers"
        value={tiers}
        onChange={setTiers}
        createRow={() => ({ id: newId(), amount: null, wait: 'three' })}
        rowLabel={(index) => `Tier ${String(index + 1)}`}
        maxRows={3}
        labels={{ add: 'Add a tier' }}
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
    </FieldExtras>
  );
}
