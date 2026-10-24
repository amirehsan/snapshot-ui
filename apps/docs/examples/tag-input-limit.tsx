'use client';

import { TagInput, emailPreset } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TagInputLimit(): ReactElement {
  return (
    <div style={{ width: '100%', maxWidth: '36rem' }}>
      <TagInput
        label="Invite people"
        description="Up to five people on the free plan."
        preset={emailPreset}
        maxValues={5}
        defaultValue={['ana@example.com', 'bo@example.com', 'cy@example.com']}
      />
    </div>
  );
}
