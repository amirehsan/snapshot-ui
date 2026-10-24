'use client';

import { Heading } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { AdaMenu } from './account-menu-rail';

/** An app with no rail: the avatar alone at the header's end, opening downward at its end. */
export default function AccountMenuHeader(): ReactElement {
  return (
    <div
      style={{
        width: 'min(40rem, 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-peer)',
      }}
    >
      <Heading level={3} size={4}>
        Spending
      </Heading>
      <AdaMenu isCompact />
    </div>
  );
}
