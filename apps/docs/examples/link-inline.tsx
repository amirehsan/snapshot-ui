'use client';

import { Link } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function LinkInline(): ReactElement {
  return (
    <p style={{ margin: 0, textAlign: 'center' }}>
      Every component is built on <Link href="https://react-aria.adobe.com">React Aria</Link>, and every color
      pairing is checked in both modes. The{' '}
      <Link
        href="https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md"
        target="_blank"
        rel="noreferrer"
      >
        design system document
      </Link>{' '}
      has the measurements.
    </p>
  );
}
