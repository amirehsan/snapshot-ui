'use client';

import { IconButton } from '@snapshot-ui/react';
import { ExternalLink } from 'lucide-react';
import type { ReactElement } from 'react';

export default function IconButtonLink(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <IconButton href="https://github.com/amirehsan/snapshot-ui" aria-label="Snapshot UI on GitHub">
        <ExternalLink />
      </IconButton>
      <IconButton
        variant="outline"
        href="https://github.com/amirehsan/snapshot-ui"
        aria-label="Snapshot UI on GitHub"
      >
        <ExternalLink />
      </IconButton>
    </div>
  );
}
