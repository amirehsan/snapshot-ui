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
  'Subscriptions and memberships we keep meaning to cancel',
];

const idOf = (name: string): string => name.toLowerCase().split(' ')[0] ?? name;

export default function MultiSelectMany(): ReactElement {
  return (
    <MultiSelect
      label="Budget lines"
      description="Every chosen line shows; the field grows a row at a time."
      defaultValue={['food', 'rent', 'utilities', 'transport', 'health', 'fun', 'travel', 'subscriptions']}
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      {CATEGORIES.map((name) => (
        <PickerOption key={name} id={idOf(name)}>
          {name}
        </PickerOption>
      ))}
    </MultiSelect>
  );
}
