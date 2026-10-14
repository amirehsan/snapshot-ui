import { SearchField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SearchFieldBasic(): ReactElement {
  return (
    <SearchField
      label="Search transactions"
      description="Escape clears the text."
      placeholder="Merchant or note"
      style={{ width: '100%', maxWidth: '24rem' }}
    />
  );
}
