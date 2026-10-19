'use client';

import { CopyButton } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** A webhook address the page already shows, which the reader pastes into another service. */
const ADDRESS = 'https://hooks.example.com/ledger/7Fq2';

export default function CopyButtonBasic(): ReactElement {
  return (
    <div className="row">
      {/* A break opportunity after each part, so a phone wraps the address between its words. */}
      <code style={{ fontSize: 'var(--text-small)', minWidth: 0 }}>
        https://
        <wbr />
        hooks.example.com/
        <wbr />
        ledger/
        <wbr />
        7Fq2
      </code>
      {/* Named for what it copies: the tip shows the name, and "Copied" for two seconds after a copy. */}
      <CopyButton value={ADDRESS} labels={{ copy: 'Copy webhook address' }} />
    </div>
  );
}
