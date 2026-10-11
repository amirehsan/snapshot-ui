'use client';

import { TextField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function LengthCounter(): ReactElement {
  return (
    <TextField
      label="About the workspace"
      description="Keep typing past 40. Nothing stops you."
      defaultValue="A shared space for the design team"
      budget={40}
      style={{ width: '100%', maxWidth: '24rem' }}
    />
  );
}
