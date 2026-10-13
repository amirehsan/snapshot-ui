'use client';

import { Button, CommandPalette, Text, type CommandPaletteItem } from '@snapshot-ui/react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

/** The app's index, which a real app would search on its server. */
const INDEX: CommandPaletteItem[] = [
  { id: 't1', label: 'Fresh Market', description: 'Groceries, Oct 9', end: '$84.20', section: 'October' },
  { id: 't2', label: 'City Transit', description: 'Travel, Oct 8', end: '$2.75', section: 'October' },
  { id: 't3', label: 'Café Lumière', description: 'Eating out, Oct 6', end: '$4.50', section: 'October' },
  { id: 't4', label: 'Northwind Rent', description: 'Housing, Oct 1', end: '$1,850.00', section: 'October' },
  { id: 't5', label: 'Fresh Market', description: 'Groceries, Sep 29', end: '$61.05', section: 'September' },
  {
    id: 't6',
    label: 'Power and Light',
    description: 'Utilities, Sep 24',
    end: '$96.40',
    section: 'September',
  },
  { id: 't7', label: 'City Transit', description: 'Travel, Sep 22', end: '$2.75', section: 'September' },
  {
    id: 't8',
    label: 'Bookshop on Main',
    description: 'Shopping, Sep 18',
    end: '$23.99',
    section: 'September',
  },
];

/** The most results the app shows at once. */
const CAP = 6;

/** The app's own search: every word in the label or the description, labels that start with the query first. */
function search(query: string): CommandPaletteItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = (item: CommandPaletteItem): string => `${item.label} ${item.description ?? ''}`.toLowerCase();
  return INDEX.filter((item) => words.every((word) => text(item).includes(word)))
    .sort(
      (a, b) =>
        Number(b.label.toLowerCase().startsWith(words[0] ?? '')) -
        Number(a.label.toLowerCase().startsWith(words[0] ?? '')),
    )
    .slice(0, CAP);
}

export default function CommandPaletteAsync(): ReactElement {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandPaletteItem[]>(INDEX.slice(0, 4));
  const [isLoading, setLoading] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(pending.current);
    },
    [],
  );

  const change = (value: string): void => {
    setQuery(value);
    clearTimeout(pending.current);
    // The list keeps what it has while the next results load.
    setLoading(true);
    // A stand-in for a request to the server, 400ms away.
    pending.current = setTimeout(() => {
      setResults(value.trim() === '' ? INDEX.slice(0, 4) : search(value));
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
      <Button
        variant="secondary"
        onPress={() => {
          setOpen(true);
        }}
      >
        Search transactions
      </Button>
      <CommandPalette
        label="Search transactions"
        items={results}
        filter={null}
        inputValue={query}
        onInputChange={change}
        isLoading={isLoading}
        // One shortcut per page: this one opens from its button only.
        shortcut={false}
        isOpen={isOpen}
        onOpenChange={setOpen}
        onAction={(item) => {
          setOpened(`${item.label}, ${item.description ?? ''}`);
        }}
      />
      <Text tone="muted">{opened === null ? 'Nothing opened yet.' : `Opened ${opened}.`}</Text>
    </div>
  );
}
