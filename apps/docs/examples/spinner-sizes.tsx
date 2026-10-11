'use client';

import { Spinner } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SpinnerSizes(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 32 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        Saving <Spinner aria-label="Saving" />
      </span>
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  );
}
