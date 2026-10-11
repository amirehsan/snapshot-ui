'use client';

import { TextArea } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TextAreaBasic(): ReactElement {
  return (
    <TextArea
      label="Short description"
      description="One or two sentences, shown in search results and invites."
      placeholder="A shared space for the Northwind design team"
      style={{ width: '100%', maxWidth: '24rem' }}
    />
  );
}
