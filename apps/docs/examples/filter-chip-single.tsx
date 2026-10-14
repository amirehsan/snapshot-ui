'use client';

import { FilterChip, PickerOption, type Key } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function FilterChipSingle(): ReactElement {
  const [category, setCategory] = useState<Key | null>(null);
  return (
    <FilterChip label="Category" selectionMode="single" value={category} onChange={setCategory}>
      <PickerOption id="groceries">Groceries</PickerOption>
      <PickerOption id="rent">Rent</PickerOption>
      <PickerOption id="transport">Transport</PickerOption>
      <PickerOption id="utilities">Utilities</PickerOption>
      <PickerOption id="dining">Dining out</PickerOption>
    </FilterChip>
  );
}
