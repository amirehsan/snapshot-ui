import { MultiSelect, PickerOption } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const OPTIONS = (
  <>
    <PickerOption id="food">Food</PickerOption>
    <PickerOption id="rent">Rent</PickerOption>
    <PickerOption id="travel">Travel</PickerOption>
    <PickerOption id="gifts">Gifts</PickerOption>
  </>
);

export default function MultiSelectStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <MultiSelect label="Categories" defaultValue={['food', 'travel']} isChanged>
        {OPTIONS}
      </MultiSelect>
      <MultiSelect
        label="Budget lines"
        placeholder="Add a category"
        isInvalid
        errorMessage="Choose at least one category."
      >
        {OPTIONS}
      </MultiSelect>
      <MultiSelect label="Archived categories" defaultValue={['gifts', 'rent']} isDisabled>
        {OPTIONS}
      </MultiSelect>
    </div>
  );
}
