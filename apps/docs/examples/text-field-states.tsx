'use client';

import { TextField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TextFieldStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <TextField label="Display name" defaultValue="Northwind Studio East" isChanged />
      <TextField
        label="Short name"
        defaultValue="!"
        isInvalid
        errorMessage="Enter a name with at least two letters."
      />
      <TextField label="Workspace ID" defaultValue="northwind-studio" isDisabled />
      <TextField label="Plan" defaultValue="Team plan" isReadOnly />
    </div>
  );
}
