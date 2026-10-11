'use client';

import { IconButton } from '@snapshot-ui/react';
import { Bell, Search, Settings } from 'lucide-react';
import type { ReactElement } from 'react';

export default function IconButtonVariants(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
        <IconButton aria-label="Search">
          <Search />
        </IconButton>
        <IconButton aria-label="Notifications">
          <Bell />
        </IconButton>
        <IconButton aria-label="Settings">
          <Settings />
        </IconButton>
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
        <IconButton variant="outline" aria-label="Search">
          <Search />
        </IconButton>
        <IconButton variant="outline" aria-label="Notifications">
          <Bell />
        </IconButton>
        <IconButton variant="outline" aria-label="Settings">
          <Settings />
        </IconButton>
      </div>
    </div>
  );
}
