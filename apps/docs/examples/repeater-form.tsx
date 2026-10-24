'use client';

import { Button, NumberField, PickerOption, Repeater, Select } from '@snapshot-ui/react';
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

/** Rows from indexed names, as a server action reads them: tiers.0.amount, tiers.0.wait, and so on. */
function readTiers(data: FormData): Tier[] {
  const tiers: Tier[] = [];
  for (const [name, value] of data) {
    const match = /^tiers\.(\d+)\.(id|amount|wait)$/.exec(name);
    if (!match || typeof value !== 'string') continue;
    const tier = (tiers[Number(match[1])] ??= { id: '', amount: null, wait: '' });
    if (match[2] === 'id') tier.id = value;
    if (match[2] === 'amount') tier.amount = value === '' ? null : Number(value);
    if (match[2] === 'wait') tier.wait = value;
  }
  return tiers;
}

let made = 0;

export default function RepeaterForm(): ReactElement {
  const [sent, setSent] = useState<Tier[] | null>(null);
  return (
    <form
      className="stack"
      style={{ width: '100%', maxWidth: '40rem' }}
      onSubmit={(event) => {
        event.preventDefault();
        // What a server action would receive, read back into typed rows.
        setSent(readTiers(new FormData(event.currentTarget)));
      }}
    >
      {/* Uncontrolled: the Repeater holds the rows, the fields hold what is typed. */}
      <Repeater<Tier>
        label="Wait tiers"
        defaultValue={[
          { id: 'small', amount: 10000, wait: 'three' },
          { id: 'large', amount: 50000, wait: 'week' },
        ]}
        createRow={() => {
          made += 1;
          return { id: `tier-${String(made)}`, amount: null, wait: 'three' };
        }}
        rowLabel={(index) => `Tier ${String(index + 1)}`}
        maxRows={4}
        labels={{ add: 'Add a tier' }}
      >
        {(tier, { index }) => (
          <>
            {/* Indexed names follow the drawn order, so a remove leaves no gap and FormData round-trips. */}
            <input type="hidden" name={`tiers.${String(index)}.id`} value={tier.id} />
            <NumberField
              label="Up to"
              money={{ symbol: '$' }}
              name={`tiers.${String(index)}.amount`}
              defaultValue={tier.amount}
            />
            <Select label="Wait" name={`tiers.${String(index)}.wait`} defaultValue={tier.wait}>
              {WAITS.map(([id, name]) => (
                <PickerOption key={id} id={id}>
                  {name}
                </PickerOption>
              ))}
            </Select>
          </>
        )}
      </Repeater>
      <div className="row">
        <Button type="submit" variant="secondary">
          Save
        </Button>
      </div>
      <output>
        {sent === null
          ? null
          : `Sent: ${sent.map((tier) => `${tier.id} up to ${String(tier.amount)} waits ${tier.wait}`).join('; ')}`}
      </output>
    </form>
  );
}
