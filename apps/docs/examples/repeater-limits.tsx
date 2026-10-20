'use client';

import { Repeater, TextField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

interface Address {
  id: string;
  email: string;
}

let made = 0;

export default function RepeaterLimits(): ReactElement {
  // From no rows: the empty line, then up to two, where Add stays drawn, disabled, with its reason beside it.
  const [addresses, setAddresses] = useState<Address[]>([]);
  return (
    <Repeater<Address>
      label="Also send the weekly email to"
      value={addresses}
      onChange={setAddresses}
      createRow={() => {
        made += 1;
        return { id: `address-${String(made)}`, email: '' };
      }}
      rowLabel={(index) => `Address ${String(index + 1)}`}
      maxRows={2}
      labels={{
        add: 'Add an address',
        empty: 'Only you get the weekly email.',
        full: (max) => `${String(max)} of ${String(max)}. Remove an address to add another.`,
      }}
      style={{ width: '100%', maxWidth: '40rem' }}
    >
      {(address, { update }) => (
        <TextField
          label="Email"
          type="email"
          value={address.email}
          onChange={(email) => {
            update({ ...address, email });
          }}
        />
      )}
    </Repeater>
  );
}
