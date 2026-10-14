import { PickerOption, Select } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const OPTIONS = (
  <>
    <PickerOption id="groceries">Groceries</PickerOption>
    <PickerOption id="rent">Rent</PickerOption>
    <PickerOption id="transport">Transport</PickerOption>
  </>
);

export default function SelectStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <Select label="Category" defaultValue="rent" isChanged>
        {OPTIONS}
      </Select>
      <Select label="Budget category" isInvalid errorMessage="Choose a category.">
        {OPTIONS}
      </Select>
      <Select label="Archived category" defaultValue="transport" isDisabled>
        {OPTIONS}
      </Select>
    </div>
  );
}
