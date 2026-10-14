import { Button, SearchField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SearchFieldToolbar(): ReactElement {
  return (
    <div className="row" style={{ width: '100%', maxWidth: '32rem', flexWrap: 'nowrap' }}>
      <SearchField
        aria-label="Search payees"
        placeholder="Search payees"
        style={{ flex: '1 1 auto', minWidth: 0 }}
      />
      <Button variant="secondary">Export</Button>
    </div>
  );
}
