'use client';

import { TextField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = 'Northwind Studio';

export default function FieldParts(): ReactElement {
  const [value, setValue] = useState(SAVED);
  return (
    <TextField
      label="Workspace name"
      description="Shown in the header and in every invite. Edit it to see the chip."
      value={value}
      onChange={setValue}
      isChanged={value !== SAVED}
      style={{ width: '100%', maxWidth: '24rem' }}
    />
  );
}
