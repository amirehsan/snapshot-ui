'use client';

import { ComboBox, PickerOption } from '@snapshot-ui/react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

interface Merchant {
  id: string;
  name: string;
}

/** The app's merchants, which a real app would search on its server. */
const NAMES = [
  'Aster Florist',
  'Bay Pharmacy',
  'Birch Hardware',
  'Café Luna',
  'Canal Laundry',
  'City Bikes',
  'Coastline Rail',
  'Cobalt Coffee',
  'Corner Mart',
  'Cove Seafood',
  'Delta Optics',
  'Elm Street Deli',
  'Fern Garden Supply',
  'Fresh Market',
  'Granite Gym',
  'Green Grocer',
  'Harbor Books',
  'Hilltop Bakery',
  'Iris Nail Studio',
  'Juniper Tea House',
  'Kite Toys',
  'Lantern Cinema',
  'Maple Diner',
  'Meadow Vet Clinic',
  'Northwind Fuel',
  'Oak Pharmacy',
  'Orchard Juice Bar',
  'Pine Bakery',
  'Quarry Climbing',
  'Railway Records',
  'River Cinema',
  'Saffron Kitchen',
  'Sunrise Gym',
  'Tidewater Market',
  'Union Barber',
  'Velvet Tailors',
  'Willow Books',
  'Wren Stationery',
  'Yarrow Yoga',
  'Zephyr Cycles',
];

const MERCHANTS: Merchant[] = NAMES.map((name) => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, '-'),
  name,
}));

/** The most results the app shows at once. */
const CAP = 8;

/** Text with case and accents aside, for the app's own matching. */
const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** The app's own search: names that contain the text, those that start with it first, capped. */
function search(text: string): Merchant[] {
  const query = fold(text.trim());
  return MERCHANTS.filter(({ name }) => fold(name).includes(query))
    .sort((a, b) => Number(fold(b.name).startsWith(query)) - Number(fold(a.name).startsWith(query)))
    .slice(0, CAP);
}

export default function ComboBoxAsync(): ReactElement {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Merchant[]>(() => search(''));
  const [isLoading, setLoading] = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(pending.current);
    },
    [],
  );

  const change = (value: string): void => {
    setText(value);
    clearTimeout(pending.current);
    // The list keeps what it has while the next results load.
    setLoading(true);
    // A stand-in for a request to the server, 300ms away.
    pending.current = setTimeout(() => {
      setResults(search(value));
      setLoading(false);
    }, 300);
  };

  return (
    <ComboBox<Merchant>
      label="Merchant"
      description="Searched on the server as you type."
      placeholder="Type a merchant"
      items={results}
      inputValue={text}
      onInputChange={change}
      isLoading={isLoading}
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      {(merchant) => <PickerOption>{merchant.name}</PickerOption>}
    </ComboBox>
  );
}
