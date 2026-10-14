'use client';

import { FilterChip, PickerOption, type Key } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const CATEGORIES = (
  <>
    <PickerOption id="groceries">Groceries</PickerOption>
    <PickerOption id="rent">Rent</PickerOption>
    <PickerOption id="transport">Transport</PickerOption>
  </>
);

export default function FilterChipStates(): ReactElement {
  const [category, setCategory] = useState<Key | null>(null);
  const [account, setAccount] = useState<Key | null>('rent');
  return (
    // The row is the page's width, and never held wider by a chip, so a long value ellipsizes inside it.
    <div className="row" style={{ width: '100%', minWidth: 0 }}>
      <FilterChip label="Category" selectionMode="single" value={category} onChange={setCategory}>
        {CATEGORIES}
      </FilterChip>
      <FilterChip label="Budget" selectionMode="single" value={account} onChange={setAccount}>
        {CATEGORIES}
      </FilterChip>
      <FilterChip label="Merchant" selectionMode="single" value={null} onChange={() => undefined} isDisabled>
        {CATEGORIES}
      </FilterChip>
      <FilterChip
        label="Account"
        selectionMode="single"
        value="groceries"
        onChange={() => undefined}
        isDisabled
      >
        {CATEGORIES}
      </FilterChip>
    </div>
  );
}
