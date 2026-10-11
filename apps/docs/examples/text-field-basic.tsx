'use client';

import { TextField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TextFieldBasic(): ReactElement {
  return (
    <TextField
      label="Workspace name"
      description="Shown in the header and in every invite."
      placeholder="Northwind Studio"
      style={{ width: '100%', maxWidth: '24rem' }}
    />
  );
}
