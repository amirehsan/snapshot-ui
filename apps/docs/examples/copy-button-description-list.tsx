'use client';

import { CopyButton, DescriptionList, DescriptionListItem } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const ADDRESS = 'https://hooks.example.com/ledger/7Fq2';

export default function CopyButtonDescriptionList(): ReactElement {
  return (
    <DescriptionList style={{ width: '100%' }}>
      <DescriptionListItem term="Provider">Northwind Hooks</DescriptionListItem>
      {/* In the row's actions, named "Copy" and the term, as every action in a list is named. */}
      <DescriptionListItem
        term="Setup address"
        actions={<CopyButton value={ADDRESS} labels={{ copy: 'Copy Setup address' }} />}
      >
        {/* A break opportunity after each part, so a narrow column wraps the address between its words. */}
        <code style={{ fontSize: 'var(--text-small)' }}>
          https://
          <wbr />
          hooks.example.com/
          <wbr />
          ledger/
          <wbr />
          7Fq2
        </code>
      </DescriptionListItem>
    </DescriptionList>
  );
}
