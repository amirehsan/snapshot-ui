'use client';

import { Checkbox, FilterBar, FilterChip, PickerOption, type Key } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/** A chip in the app's own component: the bar cannot read its props, so it stays in the row. */
function AccountFilter({
  value,
  onChange,
}: {
  value: readonly Key[];
  onChange: (value: Key[]) => void;
}): ReactElement {
  return (
    <FilterChip label="Account" selectionMode="multiple" isSecondary value={value} onChange={onChange}>
      <PickerOption id="checking">Checking</PickerOption>
      <PickerOption id="savings">Savings</PickerOption>
    </FilterChip>
  );
}

export default function FilterBarWrapped(): ReactElement {
  const [category, setCategory] = useState<Key | null>('rent');
  const [accounts, setAccounts] = useState<readonly Key[]>(['checking']);
  const [client, setClient] = useState<Key | null>(null);
  const [isBusiness, setBusiness] = useState(false);
  // The bar counts the chips it can read and not the one in the app's own component, so the app counts them all.
  const activeCount =
    (category === null ? 0 : 1) + (isBusiness && client !== null ? 1 : 0) + (accounts.length > 0 ? 1 : 0);
  return (
    <div className="stack" style={{ width: '100%' }}>
      <FilterBar
        activeCount={activeCount}
        onClearAll={() => {
          setCategory(null);
          setClient(null);
          setAccounts([]);
        }}
      >
        {/* Chips in fragments are read, and so is a chip behind a condition. */}
        <>
          <FilterChip label="Category" selectionMode="single" value={category} onChange={setCategory}>
            <PickerOption id="groceries">Groceries</PickerOption>
            <PickerOption id="rent">Rent</PickerOption>
          </FilterChip>
          {isBusiness && (
            <FilterChip label="Client" selectionMode="single" value={client} onChange={setClient}>
              <PickerOption id="studio">Studio</PickerOption>
              <PickerOption id="bakery">Bakery</PickerOption>
            </FilterChip>
          )}
        </>
        <AccountFilter value={accounts} onChange={setAccounts} />
      </FilterBar>
      <Checkbox isSelected={isBusiness} onChange={setBusiness}>
        Business account
      </Checkbox>
    </div>
  );
}
