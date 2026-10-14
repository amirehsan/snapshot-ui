import { Pagination } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function PaginationSiblings(): ReactElement {
  // A 30.5rem column, just above the narrow row: the numbers stay, two each side, and the step words hide.
  return (
    <div style={{ width: '100%', maxWidth: '30.5rem' }}>
      <Pagination
        page={13}
        pageCount={26}
        siblingCount={2}
        rangeLabel="601 to 650 of 1,284"
        labels={{ navigation: 'Ledger pages' }}
        getPageHref={(n) => `#ledger-page-${String(n)}`}
      />
    </div>
  );
}
