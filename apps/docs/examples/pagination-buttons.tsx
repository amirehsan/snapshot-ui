'use client';

import { Pagination } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const ROWS = 230;
const PAGE_SIZE = 50;

export default function PaginationButtons(): ReactElement {
  const [page, setPage] = useState(1);
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, ROWS);
  return (
    <div style={{ width: '100%' }}>
      <Pagination
        page={page}
        pageCount={Math.ceil(ROWS / PAGE_SIZE)}
        rangeLabel={`${String(first)} to ${String(last)} of ${String(ROWS)}`}
        onPageChange={setPage}
        labels={{ navigation: 'Rules pages' }}
      />
    </div>
  );
}
