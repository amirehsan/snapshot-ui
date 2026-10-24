'use client';

import { CopyButton } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** Two lines a reader pastes into a provider's setup form, in one copy. */
const SETUP = [
  'Webhook address: https://hooks.example.com/ledger/7Fq2',
  'Events: transactions, balances',
].join('\n');

export default function CopyButtonWord(): ReactElement {
  return (
    <div className="row">
      <CopyButton value={SETUP} look="button" labels={{ copy: 'Copy setup details' }} />
    </div>
  );
}
