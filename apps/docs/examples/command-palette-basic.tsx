'use client';

import { Button, CommandPalette, Kbd, Text, type CommandPaletteItem } from '@snapshot-ui/react';
import {
  ArrowLeftRight,
  ChartColumn,
  Coffee,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  Wallet,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

const ITEMS: CommandPaletteItem[] = [
  { id: 'new', label: 'New transaction', icon: <Plus />, keywords: 'add', shortcut: 'Mod N' },
  { id: 'settings', label: 'Settings', description: 'Profile, billing and security', icon: <Settings /> },
  {
    id: 'checking',
    label: 'Checking',
    description: 'Everyday',
    icon: <Landmark />,
    end: '$2,340.12',
    shortcut: 'Mod 1',
    section: 'Accounts',
  },
  {
    id: 'savings',
    label: 'Savings',
    description: 'Emergency buffer',
    icon: <Wallet />,
    end: '$10,050.00',
    shortcut: 'Mod 2',
    section: 'Accounts',
  },
  { id: 'credit', label: 'Credit card', icon: <CreditCard />, end: '$412.30', section: 'Accounts' },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Every account',
    icon: <ArrowLeftRight />,
    section: 'Pages',
  },
  { id: 'budgets', label: 'Budgets', icon: <PiggyBank />, keywords: 'spending limits', section: 'Pages' },
  { id: 'reports', label: 'Reports', icon: <ChartColumn />, section: 'Pages' },
  {
    id: 'rent',
    label: 'Rent',
    description: 'Paid on the 1st',
    icon: <Receipt />,
    end: '$1,850.00',
    section: 'Payees',
  },
  {
    id: 'cafe',
    label: 'Café Lumière',
    description: 'Coffee and pastries',
    icon: <Coffee />,
    end: '$4.50',
    section: 'Payees',
  },
];

export default function CommandPaletteBasic(): ReactElement {
  const [isOpen, setOpen] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center' }}>
      <Button
        variant="secondary"
        onPress={() => {
          setOpen(true);
        }}
      >
        Search the app
      </Button>
      <Text tone="muted">
        Or press <Kbd>Ctrl</Kbd> <Kbd>J</Kbd>, or <Kbd>&#8984;</Kbd> <Kbd>J</Kbd> on a Mac.
      </Text>
      <CommandPalette
        label="Search the app"
        labels={{ placeholder: 'Search accounts, pages and payees' }}
        items={ITEMS}
        isOpen={isOpen}
        onOpenChange={setOpen}
        // This site's own search owns Cmd or Ctrl+K.
        shortcut="Mod+J"
        storageKey="docs-palette"
        onAction={(item) => {
          // The app navigates here, once the palette has closed and focus is back.
          setOpened(item.label);
        }}
      />
      <Text tone="muted">{opened === null ? 'Nothing opened yet.' : `Opened ${opened}.`}</Text>
    </div>
  );
}
