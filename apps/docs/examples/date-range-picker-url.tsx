'use client';

import { DateRangePicker, type DateRange, type DateRangePreset } from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ReactElement } from 'react';

/** The app's presets, computed from its own today, 2026-09-18, with its own words. */
const PRESETS: DateRangePreset[] = [
  { id: 'this-month', label: 'This month', range: { start: '2026-09-01', end: '2026-09-30' } },
  { id: 'last-month', label: 'Last month', range: { start: '2026-08-01', end: '2026-08-31' } },
];

/** The app's own month names: the library writes no date, and the app writes this one with no Intl. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "1 to 30 Sep 2026", "28 Aug to 3 Sep 2026" or "28 Dec 2026 to 3 Jan 2027"; empty when either is no ISO date. */
function rangeLabel(range: DateRange | null): string {
  const parts = (iso: string): [string, string, string] | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
    return match?.[1] && match[3] && month ? [String(Number(match[3])), month, match[1]] : null;
  };
  const start = range && parts(range.start);
  const end = range && parts(range.end);
  if (!start || !end) return '';
  const [startDay, startMonth, startYear] = start;
  const [endDay, endMonth, endYear] = end;
  let from = startDay;
  if (startYear !== endYear) from = `${startDay} ${startMonth} ${startYear}`;
  else if (startMonth !== endMonth) from = `${startDay} ${startMonth}`;
  return `${from} to ${endDay} ${endMonth} ${endYear}`;
}

/** The two parameters as a range, or null unless both are there. The picker reads a broken one as none. */
const rangeOf = (from: string | null, to: string | null): DateRange | null =>
  from && to ? { start: from, end: to } : null;

function PeriodField({
  range,
  onChange,
}: {
  range: DateRange | null;
  onChange?: (next: DateRange | null) => void;
}): ReactElement {
  return (
    <DateRangePicker
      label="Statement period"
      value={range}
      valueLabel={rangeLabel(range)}
      today="2026-09-18"
      presets={PRESETS}
      onChange={onChange}
    />
  );
}

function PeriodFromUrl(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const key = `${from ?? ''}/${to ?? ''}`;
  const [range, setRange] = useState(() => rangeOf(from, to));
  // The parameters the field last took from the URL, or last wrote to it.
  const [seen, setSeen] = useState(key);

  // The URL changed under the field, by Back, Forward or a link: show its range.
  if (key !== seen) {
    setSeen(key);
    setRange(rangeOf(from, to));
  }

  return (
    <PeriodField
      range={range}
      onChange={(next) => {
        setRange(next);
        setSeen(next ? `${next.start}/${next.end}` : '/');
        // Start from the parameters already there, so the other filters stay; null deletes both.
        const params = new URLSearchParams(searchParams);
        if (next === null) {
          params.delete('from');
          params.delete('to');
        } else {
          params.set('from', next.start);
          params.set('to', next.end);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }}
    />
  );
}

export default function DateRangePickerUrl(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      {/* The page is static, so the server renders the fallback: the same field, empty. */}
      <Suspense fallback={<PeriodField range={null} />}>
        <PeriodFromUrl />
      </Suspense>
    </div>
  );
}
