import { MultiSelect, PickerOption } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const CATEGORIES = [
  'Food',
  'Rent',
  'Utilities',
  'Transport',
  'Health',
  'Insurance',
  'Fun',
  'Travel',
  'Gifts',
  'Education',
  'Savings',
  'Subscriptions',
];

export default function MultiSelectBasic(): ReactElement {
  return (
    <MultiSelect
      label="Categories"
      description="Type to filter, and choose as many as you need."
      placeholder="Add a category"
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      {CATEGORIES.map((name) => (
        <PickerOption key={name} id={name.toLowerCase()}>
          {name}
        </PickerOption>
      ))}
    </MultiSelect>
  );
}
