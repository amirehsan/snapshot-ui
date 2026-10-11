'use client';

import { TextArea } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TextAreaCounter(): ReactElement {
  return (
    <TextArea
      label="About the workspace"
      description="Keep typing past 120. Nothing stops you."
      defaultValue={
        'A shared space for the Northwind design team.\nBriefs, reviews and the weekly notes live here.'
      }
      budget={120}
      rows={5}
      style={{ width: '100%', maxWidth: '24rem' }}
    />
  );
}
