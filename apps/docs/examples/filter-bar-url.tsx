'use client';

import { FilterBar, FilterChip, PickerOption, SearchField, type Key } from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ReactElement } from 'react';

/** The filters this list reads from its URL: `category` once, `tag` once per tag. */
interface Filters {
  category: Key | null;
  tags: readonly Key[];
}

const NONE: Filters = { category: null, tags: [] };

const filtersOf = (params: URLSearchParams): Filters => ({
  category: params.get('category'),
  tags: params.getAll('tag'),
});

/** A fixed list of transactions, so the example can say how many the filters keep. */
const TRANSACTIONS: { category: string; tags: string[] }[] = [
  { category: 'groceries', tags: ['shared'] },
  { category: 'groceries', tags: [] },
  { category: 'rent', tags: ['shared'] },
  { category: 'transport', tags: ['business'] },
  { category: 'groceries', tags: ['refund'] },
  { category: 'rent', tags: [] },
];

/** How many transactions the filters keep. */
const countOf = ({ category, tags }: Filters): number =>
  TRANSACTIONS.filter(
    (each) =>
      (category === null || each.category === category) &&
      (tags.length === 0 || tags.some((tag) => each.tags.includes(String(tag)))),
  ).length;

/** "Show 1 result" or "Show 4 results": the app's own words, with no Intl. */
const showLabel = (count: number): string => `Show ${String(count)} ${count === 1 ? 'result' : 'results'}`;

function TransactionFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange?: (next: Filters) => void;
}): ReactElement {
  return (
    <FilterBar
      search={<SearchField aria-label="Search transactions" placeholder="Search transactions" />}
      labels={{ done: showLabel(countOf(filters)) }}
      onClearAll={
        onChange &&
        (() => {
          onChange(NONE);
        })
      }
    >
      <FilterChip
        label="Category"
        selectionMode="single"
        value={filters.category}
        onChange={(category) => onChange?.({ ...filters, category })}
      >
        <PickerOption id="groceries">Groceries</PickerOption>
        <PickerOption id="rent">Rent</PickerOption>
        <PickerOption id="transport">Transport</PickerOption>
      </FilterChip>
      <FilterChip
        label="Tags"
        selectionMode="multiple"
        isSecondary
        value={filters.tags}
        onChange={(tags) => onChange?.({ ...filters, tags })}
      >
        <PickerOption id="shared">Shared</PickerOption>
        <PickerOption id="refund">Refund</PickerOption>
        <PickerOption id="business">Business</PickerOption>
      </FilterChip>
    </FilterBar>
  );
}

function FiltersFromUrl(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const [filters, setFilters] = useState(() => filtersOf(new URLSearchParams(key)));
  // The query the bar last took from the URL, or last wrote to it.
  const [seen, setSeen] = useState(key);

  // The URL changed under the bar, by Back, Forward or a link: show its filters.
  if (key !== seen) {
    setSeen(key);
    setFilters(filtersOf(new URLSearchParams(key)));
  }

  return (
    <TransactionFilters
      filters={filters}
      onChange={(next) => {
        setFilters(next);
        // Start from the parameters already there, so the search and any other filter stay. A repeated
        // parameter is deleted, then appended once per key; Clear all is this one write too.
        const params = new URLSearchParams(searchParams);
        params.delete('category');
        if (next.category !== null) params.set('category', String(next.category));
        params.delete('tag');
        for (const tag of next.tags) params.append('tag', String(tag));
        const query = params.toString();
        setSeen(query);
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }}
    />
  );
}

export default function FilterBarUrl(): ReactElement {
  return (
    <div style={{ width: '100%' }}>
      {/* The page is static, so the server renders the fallback: the same bar, with nothing chosen. */}
      <Suspense fallback={<TransactionFilters filters={NONE} />}>
        <FiltersFromUrl />
      </Suspense>
    </div>
  );
}
