import { Pagination } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function PaginationNarrow(): ReactElement {
  // A 20rem column: the row lays itself out by its own width, whatever the page's.
  return (
    <div style={{ width: '100%', maxWidth: '20rem' }}>
      <Pagination
        page={12}
        pageCount={26}
        rangeLabel="551 to 600 of 1,284"
        labels={{ navigation: 'Statement pages' }}
        getPageHref={(n) => `#page-${String(n)}`}
      />
    </div>
  );
}
