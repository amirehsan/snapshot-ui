'use client';

import { TagInput, domainPreset, emailPreset, pathPreset } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TagInputPresets(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '36rem' }}>
      <TagInput
        label="Invite people"
        description="Separate addresses with commas or spaces."
        preset={emailPreset}
        defaultValue={['ana@example.com']}
      />
      <TagInput
        label="Allowed domains"
        description="Only people at these domains can join. Use *.example.com for every subdomain."
        preset={domainPreset}
        defaultValue={['example.com', '*.example.org']}
      />
      <TagInput
        label="Excluded paths"
        description="Pages under these paths are left out of search."
        preset={pathPreset}
        defaultValue={['/admin', '/blog/drafts/*']}
      />
    </div>
  );
}
