'use client';

import { Checkbox, CheckboxGroup } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const CHANNELS = ['email', 'sms', 'push'];

export default function CheckboxSelectAll(): ReactElement {
  const [selected, setSelected] = useState(['email']);
  return (
    <div style={{ width: '100%', maxWidth: '24rem' }}>
      <Checkbox
        isSelected={selected.length === CHANNELS.length}
        isIndeterminate={selected.length > 0 && selected.length < CHANNELS.length}
        onChange={(isSelected) => {
          setSelected(isSelected ? CHANNELS : []);
        }}
      >
        Select all channels
      </Checkbox>
      <CheckboxGroup
        aria-label="Channels"
        value={selected}
        onChange={setSelected}
        style={{ marginInlineStart: '2rem' }}
      >
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
        <Checkbox value="push">Push notification</Checkbox>
      </CheckboxGroup>
    </div>
  );
}
