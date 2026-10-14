'use client';

import { Pagination } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const PAGE_SIZE = 25;

/** What a cursor-paged API answers: this page's rows and whether another page follows, never a total. */
const cursorPage = (page: number): { rows: number; hasMore: boolean } => ({
  rows: page < 4 ? PAGE_SIZE : 12,
  hasMore: page < 4,
});

export default function PaginationCursor(): ReactElement {
  const [page, setPage] = useState(1);
  const { rows, hasMore } = cursorPage(page);
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = first + rows - 1;
  return (
    <div style={{ width: '100%' }}>
      <Pagination
        page={page}
        // The count is unknown, so it is one past this page while there is more, which enables Next.
        pageCount={hasMore ? page + 1 : page}
        hasPageNumbers={false}
        rangeLabel={`${String(first)} to ${String(last)}`}
        onPageChange={setPage}
        labels={{ navigation: 'Activity pages' }}
      />
    </div>
  );
}
