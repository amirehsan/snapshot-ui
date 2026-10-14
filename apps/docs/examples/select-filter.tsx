import { PickerOption, PickerSection, Select } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SelectFilter(): ReactElement {
  return (
    <Select label="Category" defaultValue="rent" style={{ width: '100%', maxWidth: '24rem' }}>
      <PickerSection title="Spending">
        <PickerOption id="groceries">Groceries</PickerOption>
        <PickerOption id="rent">Home rent</PickerOption>
        <PickerOption id="transport">Transport</PickerOption>
        <PickerOption id="utilities">Utilities</PickerOption>
        <PickerOption id="dining">Dining out</PickerOption>
        <PickerOption id="cafe">Café</PickerOption>
        <PickerOption id="health">Health</PickerOption>
        <PickerOption id="travel">Travel</PickerOption>
      </PickerSection>
      <PickerSection title="Income">
        <PickerOption id="salary">Salary</PickerOption>
        <PickerOption id="refunds">Refunds</PickerOption>
        <PickerOption id="interest">Interest</PickerOption>
        <PickerOption id="gifts">Gifts</PickerOption>
      </PickerSection>
    </Select>
  );
}
