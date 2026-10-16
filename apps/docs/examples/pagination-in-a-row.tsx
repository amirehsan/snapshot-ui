'use client';

import { Link, Pagination } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const ROWS = 1284;
const PAGE_SIZE = 50;

export default function PaginationInARow(): ReactElement {
  const [page, setPage] = useState(1);
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, ROWS);
  return (
    // Your row: Pagination takes the room the link leaves, and the link keeps the end.
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-inset)', width: '100%' }}>
      <Pagination
        page={page}
        pageCount={Math.ceil(ROWS / PAGE_SIZE)}
        rangeLabel={`${String(first)} to ${String(last)} of 1,284`}
        onPageChange={setPage}
        labels={{ navigation: 'Pages beside a link' }}
      />
      <Link href="#show-100">Show 100 a page</Link>
    </div>
  );
}
