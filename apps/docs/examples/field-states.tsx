'use client';

import { TextField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function FieldStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <TextField
        label="Display name"
        description="Shown in the header and in every invite."
        defaultValue="Northwind Studio"
        isChanged
      />
      <TextField
        label="Short description"
        defaultValue="!"
        isChanged
        isInvalid
        errorMessage="Enter a short description."
      />
    </div>
  );
}
