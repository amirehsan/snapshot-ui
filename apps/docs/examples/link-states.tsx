'use client';

import { Link } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function LinkStates(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 24 }}>
      <Link href="https://react-aria.adobe.com">Read the guide</Link>
      <Link href="https://react-aria.adobe.com" isDisabled>
        Read the guide
      </Link>
    </div>
  );
}
