'use client';

import { Pagination, RouterProvider } from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type ReactElement } from 'react';

const ROWS = 240;
const SIZES = [10, 25, 50, 100];
const DEFAULT_SIZE = 25;

/** The page and the size from the URL, each checked: anything else is the first page at the default size. */
function stateOf(params: URLSearchParams): { page: number; size: number } {
  const asked = Number(params.get('size') ?? DEFAULT_SIZE);
  const size = SIZES.includes(asked) ? asked : DEFAULT_SIZE;
  const pageCount = Math.ceil(ROWS / size);
  const page = Number(params.get('page') ?? '1');
  return { page: Number.isInteger(page) && page >= 1 && page <= pageCount ? page : 1, size };
}

function Pages({ params }: { params: URLSearchParams }): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { page, size } = stateOf(params);
  /** The URL with some parameters changed; the defaults write none, and a bare `?` is never written. */
  const hrefWith = (changes: Record<string, number | null>): string => {
    const next = new URLSearchParams(params);
    for (const [name, value] of Object.entries(changes)) {
      if (value === null) next.delete(name);
      else next.set(name, String(value));
    }
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const first = (page - 1) * size + 1;
  const last = Math.min(page * size, ROWS);
  return (
    <Pagination
      page={page}
      pageCount={Math.ceil(ROWS / size)}
      rangeLabel={`${String(first)} to ${String(last)} of ${String(ROWS)}`}
      getPageHref={(n) => hrefWith({ page: n === 1 ? null : n })}
      pageSize={size}
      pageSizeOptions={SIZES}
      // The page Pagination works out keeps the first row of this page in view at the new size.
      onPageSizeChange={(nextSize, nextPage) => {
        router.replace(
          hrefWith({
            size: nextSize === DEFAULT_SIZE ? null : nextSize,
            page: nextPage === 1 ? null : nextPage,
          }),
          { scroll: false },
        );
      }}
      labels={{ navigation: 'Payment pages' }}
    />
  );
}

function PagesFromUrl(): ReactElement {
  return <Pages params={new URLSearchParams(useSearchParams())} />;
}

export default function PaginationPageSize(): ReactElement {
  const router = useRouter();
  // An app wraps its whole tree once; the example wraps only itself.
  return (
    <div style={{ width: '100%' }}>
      <RouterProvider
        navigate={(href) => {
          router.push(href, { scroll: false });
        }}
      >
        {/* The page is static, so the server renders the fallback: the first page at the default size. */}
        <Suspense fallback={<Pages params={new URLSearchParams()} />}>
          <PagesFromUrl />
        </Suspense>
      </RouterProvider>
    </div>
  );
}
