'use client';

import { NumberField } from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ReactElement } from 'react';

/** The parameter as minor units, or null when it is absent or not a whole number. */
const minorOf = (raw: string | null): number | null => {
  if (raw === null || raw === '') return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
};

function MinimumField({
  min,
  onChange,
}: {
  min: number | null;
  onChange?: (next: number | null) => void;
}): ReactElement {
  return (
    <NumberField
      label="Minimum amount"
      money={{ symbol: '$' }}
      placeholder="0.00"
      value={min}
      onChange={onChange}
    />
  );
}

function MinimumFromUrl(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const min = minorOf(searchParams.get('min'));
  const [value, setValue] = useState(min);
  // The amount the field last took from the URL, or last wrote to it.
  const [seen, setSeen] = useState(min);

  // The URL changed under the field, by Back, Forward or a link: show its amount.
  if (min !== seen) {
    setSeen(min);
    setValue(min);
  }

  return (
    <MinimumField
      min={value}
      onChange={(next) => {
        setValue(next);
        setSeen(next);
        // Start from the parameters already there, so the other filters stay.
        const params = new URLSearchParams(searchParams);
        if (next === null) params.delete('min');
        else params.set('min', String(next));
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }}
    />
  );
}

export default function NumberFieldUrl(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      {/* The page is static, so the server renders the fallback: the same field, empty. */}
      <Suspense fallback={<MinimumField min={null} />}>
        <MinimumFromUrl />
      </Suspense>
    </div>
  );
}
