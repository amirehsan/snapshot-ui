'use client';

import { FieldExtras, PickerOption, Select } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const WAITS = [
  ['day', '1 day'],
  ['three', '3 days'],
  ['week', 'A week'],
  ['month', 'A month'],
] as const;

export default function FieldExtrasDefault(): ReactElement {
  // Saved at a week; the product's default is 3 days.
  const [wait, setWait] = useState('week');
  return (
    <FieldExtras
      fieldLabel="Wait"
      defaultOffer={{
        value: '3 days',
        // Drawn only while the field does not hold the default.
        isCurrent: wait === 'three',
        // The same setter the field's onChange calls: an ordinary edit.
        onTake: () => {
          setWait('three');
        },
      }}
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      <Select
        label="Wait"
        description="How long a payment waits before it counts."
        value={wait}
        onChange={(key) => {
          setWait(String(key));
        }}
      >
        {WAITS.map(([id, name]) => (
          <PickerOption key={id} id={id}>
            {name}
          </PickerOption>
        ))}
      </Select>
    </FieldExtras>
  );
}
