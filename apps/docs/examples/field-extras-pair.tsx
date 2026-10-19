'use client';

import { FieldExtras, TextField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const DEFAULT = { from: '10 PM', to: '7 AM' };

export default function FieldExtrasPair(): ReactElement {
  const [hours, setHours] = useState({ from: '11 PM', to: '6 AM' });
  return (
    <FieldExtras
      // One offer for the pair: its line sits under both, and a reset focuses From.
      scope="group"
      fieldLabel="Quiet hours"
      defaultOffer={{
        value: '10 PM to 7 AM',
        isCurrent: hours.from === DEFAULT.from && hours.to === DEFAULT.to,
        onTake: () => {
          setHours(DEFAULT);
        },
      }}
      style={{ width: '100%', maxWidth: '28rem' }}
    >
      <div className="row" style={{ alignItems: 'start' }}>
        <TextField
          label="From"
          value={hours.from}
          onChange={(from) => {
            setHours({ ...hours, from });
          }}
          style={{ flex: '1 1 8rem' }}
        />
        <TextField
          label="To"
          value={hours.to}
          onChange={(to) => {
            setHours({ ...hours, to });
          }}
          style={{ flex: '1 1 8rem' }}
        />
      </div>
    </FieldExtras>
  );
}
