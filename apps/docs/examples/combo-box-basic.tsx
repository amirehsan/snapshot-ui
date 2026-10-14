import { ComboBox, PickerOption } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const MERCHANTS = [
  'Café Luna',
  'City Bikes',
  'Coastline Rail',
  'Cobalt Coffee',
  'Corner Mart',
  'Green Grocer',
  'Harbor Books',
  'Northwind Fuel',
  'Oak Pharmacy',
  'Pine Bakery',
  'River Cinema',
  'Sunrise Gym',
];

export default function ComboBoxBasic(): ReactElement {
  return (
    <ComboBox
      label="Merchant"
      description="Type part of the name, or open the list."
      placeholder="Type a merchant"
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      {MERCHANTS.map((name) => (
        <PickerOption key={name} id={name.toLowerCase().replace(/[^a-z]+/g, '-')}>
          {name}
        </PickerOption>
      ))}
    </ComboBox>
  );
}
