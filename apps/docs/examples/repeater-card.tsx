'use client';

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  NumberField,
  PickerOption,
  Repeater,
  Select,
} from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

interface Tier {
  id: string;
  amount: number | null;
  wait: string;
}

const WAITS = [
  ['three', '3 days'],
  ['week', 'A week'],
  ['month', 'A month'],
] as const;

let made = 0;

export default function RepeaterCard(): ReactElement {
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 'small', amount: 10000, wait: 'three' },
    { id: 'large', amount: 50000, wait: 'week' },
  ]);
  return (
    <Card as="section" aria-labelledby="repeater-card-title" style={{ width: '100%', maxWidth: '40rem' }}>
      <CardHeader>
        <CardTitle id="repeater-card-title" level={3}>
          Coach
        </CardTitle>
      </CardHeader>
      {/* The Repeater ends the card, so Add moves clear of its bottom corner by itself. */}
      <CardBody>
        <Repeater<Tier>
          label="Wait tiers"
          value={tiers}
          onChange={setTiers}
          createRow={() => {
            made += 1;
            return { id: `tier-${String(made)}`, amount: null, wait: 'three' };
          }}
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
      </CardBody>
    </Card>
  );
}
