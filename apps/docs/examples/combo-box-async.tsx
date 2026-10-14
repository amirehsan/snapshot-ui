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
  const [chosen, setChosen] = useState<Merchant | null>(null);
  const [isLoading, setLoading] = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** The latest request's number, so an answer to an older one is dropped. */
  const latest = useRef(0);
  useEffect(
    () => () => {
      clearTimeout(pending.current);
    },
    [],
  );

  // React Aria puts the chosen text back from the items, on Escape and on leaving the field, so the chosen
  // merchant stays among them whatever the last search found.
  const items = chosen ? [chosen, ...results.filter((merchant) => merchant.id !== chosen.id)] : results;

  const change = (value: string): void => {
    setText(value);
    clearTimeout(pending.current);
    const request = ++latest.current;
    // A choice writes its own text back through here; that is not a search.
    if (chosen !== null && value === chosen.name) {
      setLoading(false);
      return;
    }
    // The list keeps what it has while the next results load.
    setLoading(true);
    // A stand-in for a request to the server, 300ms away. With a real fetch, pass an AbortController's signal
    // and abort the last one here, or check the number below, so a slow answer never replaces a newer one.
    pending.current = setTimeout(() => {
      if (request !== latest.current) return;
      setResults(search(value));
      setLoading(false);
    }, 300);
  };

  return (
    <ComboBox<Merchant>
      label="Merchant"
      description="Searched on the server as you type."
      placeholder="Type a merchant"
      items={items}
      inputValue={text}
      onInputChange={change}
      onChange={(key) => {
        setChosen(items.find((merchant) => merchant.id === key) ?? null);
      }}
      isLoading={isLoading}
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      {(merchant) => <PickerOption>{merchant.name}</PickerOption>}
    </ComboBox>
  );
}
