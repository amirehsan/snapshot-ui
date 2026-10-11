'use client';

import { Button } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ButtonVariants(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <Button>Save changes</Button>
      <Button variant="secondary">Preview</Button>
      <Button variant="tertiary">Discard</Button>
      <Button variant="danger">Delete site</Button>
    </div>
  );
}
