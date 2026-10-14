'use client';

import { FilterChip, PickerOption, type Key } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function FilterChipMultiple(): ReactElement {
  const [tags, setTags] = useState<readonly Key[]>(['rent']);
  return (
    <FilterChip label="Tags" selectionMode="multiple" value={tags} onChange={setTags}>
      <PickerOption id="groceries">Groceries</PickerOption>
      <PickerOption id="rent">Rent</PickerOption>
      <PickerOption id="transport">Transport</PickerOption>
      <PickerOption id="utilities">Utilities</PickerOption>
      <PickerOption id="dining">Dining out</PickerOption>
      <PickerOption id="health">Health</PickerOption>
    </FilterChip>
  );
}
