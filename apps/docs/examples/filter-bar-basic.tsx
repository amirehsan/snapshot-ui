'use client';

import {
  FilterBar,
  FilterChip,
  PickerOption,
  RangeCalendar,
  SearchField,
  type DateRange,
  type Key,
} from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/** The app's own month names: the library writes no date, and the app writes this one with no Intl. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "1 Sep to 30 Sep" from two ISO dates, in the app's words. */
function rangeLabel(range: DateRange | null): string | undefined {
  if (range === null) return undefined;
  const day = (iso: string): string =>
    `${String(Number(iso.slice(8, 10)))} ${MONTHS[Number(iso.slice(5, 7)) - 1] ?? ''}`;
  return `${day(range.start)} to ${day(range.end)}`;
}

export default function FilterBarBasic(): ReactElement {
  const [category, setCategory] = useState<Key | null>('groceries');
  const [accounts, setAccounts] = useState<readonly Key[]>([]);
  const [date, setDate] = useState<DateRange | null>(null);
  const [tags, setTags] = useState<readonly Key[]>(['shared']);
  return (
    <div style={{ width: '100%' }}>
      <FilterBar
        search={<SearchField aria-label="Search transactions" placeholder="Search transactions" />}
        onClearAll={() => {
          setCategory(null);
          setAccounts([]);
          setDate(null);
          setTags([]);
        }}
      >
        <FilterChip label="Category" selectionMode="single" value={category} onChange={setCategory}>
          <PickerOption id="groceries">Groceries</PickerOption>
          <PickerOption id="rent">Rent</PickerOption>
          <PickerOption id="transport">Transport</PickerOption>
        </FilterChip>
        <FilterChip label="Account" selectionMode="multiple" value={accounts} onChange={setAccounts}>
          <PickerOption id="checking">Checking</PickerOption>
          <PickerOption id="savings">Savings</PickerOption>
          <PickerOption id="card">Credit card</PickerOption>
        </FilterChip>
        <FilterChip
          label="Date"
          isSecondary
          valueLabel={rangeLabel(date)}
          onClear={() => {
            setDate(null);
          }}
        >
          <RangeCalendar aria-label="Date" value={date} onChange={setDate} today="2026-09-18" />
        </FilterChip>
        <FilterChip label="Tags" selectionMode="multiple" isSecondary value={tags} onChange={setTags}>
          <PickerOption id="shared">Shared</PickerOption>
          <PickerOption id="refund">Refund</PickerOption>
          <PickerOption id="business">Business</PickerOption>
        </FilterChip>
      </FilterBar>
    </div>
  );
}
