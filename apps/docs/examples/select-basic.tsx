import { PickerOption, Select } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SelectBasic(): ReactElement {
  return (
    <Select
      label="Category"
      description="Where this transaction goes in the budget."
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      <PickerOption id="groceries">Groceries</PickerOption>
      <PickerOption id="rent">Rent</PickerOption>
      <PickerOption id="transport">Transport</PickerOption>
      <PickerOption id="utilities">Utilities</PickerOption>
      <PickerOption id="dining">Dining out</PickerOption>
    </Select>
  );
}
