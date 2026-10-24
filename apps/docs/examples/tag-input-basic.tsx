'use client';

import { TagInput, emailPreset } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TagInputBasic(): ReactElement {
  return (
    <div style={{ width: '100%', maxWidth: '36rem' }}>
      <TagInput
        label="Invite people"
        description="Separate addresses with commas or spaces, or paste a list."
        preset={emailPreset}
        defaultValue={['ana@example.com', 'bo@example.com']}
      />
    </div>
  );
}
