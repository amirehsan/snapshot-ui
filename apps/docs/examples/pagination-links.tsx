'use client';

import { Pagination, RouterProvider } from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type ReactElement } from 'react';

const ROWS = 1284;
const PAGE_SIZE = 50;
const PAGE_COUNT = Math.ceil(ROWS / PAGE_SIZE);

/** A count with a comma between thousands, written by hand: no Intl, so the server and the browser agree. */
const withCommas = (count: number): string => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function Pages({ page }: { page: number }): ReactElement {
  const pathname = usePathname();
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, ROWS);
  return (
    <Pagination
      page={page}
      pageCount={PAGE_COUNT}
      rangeLabel={`${withCommas(first)} to ${withCommas(last)} of ${withCommas(ROWS)}`}
      getPageHref={(n) => `${pathname}?page=${String(n)}`}
      labels={{ navigation: 'Transactions pages' }}
    />
  );
}

function PageFromUrl(): ReactElement {
  const page = Number(useSearchParams().get('page') ?? '1');
  return <Pages page={Number.isInteger(page) && page >= 1 && page <= PAGE_COUNT ? page : 1} />;
}

export default function PaginationLinks(): ReactElement {
  const router = useRouter();
  // An app wraps its whole tree once; the example wraps only itself.
  return (
    <div style={{ width: '100%' }}>
      <RouterProvider
        navigate={(href) => {
          router.push(href, { scroll: false });
        }}
      >
        {/* The page is static, so the server renders the fallback: the same row at the first page. */}
        <Suspense fallback={<Pages page={1} />}>
          <PageFromUrl />
        </Suspense>
      </RouterProvider>
    </div>
  );
}
