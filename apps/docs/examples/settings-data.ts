/*
 * The Settings recipe's data: what an app's server holds. Every figure and word is the app's string, written here
 * by hand as an app writes it with its own formatting; the library formats nothing.
 */

/** A wait tier: a payment up to `amount`, in cents, waits `wait` before it counts. Both empty in a new row. */
export interface Tier {
  id: string;
  amount: number | null;
  wait: string | null;
}

/** What the app has saved, section by section. The example keeps it in state so Save and Cancel show their effect. */
export interface Saved {
  tiers: readonly Tier[];
  /** The cushion in cents; empty keeps a month of the reader's fixed bills. */
  cushion: number | null;
  pushAmounts: boolean;
  weeklyEmail: boolean;
  assistantKey: string;
  model: string;
  logos: boolean;
  logoProvider: string;
  logoKey: string;
}

/** One section: its key in the address, its name, its list face line and its end state, from what is saved. */
export interface SettingsSection {
  key: string;
  name: string;
  description: string;
  end?: (saved: Saved) => string;
}

/**
 * The page's sections, in the consumer's order. Nothing counts them and nothing depends on their order: the
 * first is the index's default, and the nav, the page and the tests walk this array.
 */
export const SECTIONS: readonly SettingsSection[] = [
  { key: 'coach', name: 'Coach', description: 'How long a payment waits before it counts.' },
  { key: 'notifications', name: 'Notifications', description: 'What we tell you, and where.' },
  {
    key: 'bank-sync',
    name: 'Bank sync',
    description: 'Connected accounts and how often they sync.',
    end: () => '2 connected',
  },
  { key: 'assistant', name: 'AI assistant', description: 'The key and the model the assistant uses.' },
  {
    key: 'logos',
    name: 'Logos',
    description: 'Bank logos beside your transactions.',
    end: (saved) => (saved.logos ? 'On' : 'Off'),
  },
  { key: 'appearance', name: 'Appearance', description: 'The theme, applied at once.' },
  { key: 'data', name: 'Data', description: 'Export your transactions.' },
  { key: 'danger', name: 'Danger zone', description: 'Delete everything we hold for you.' },
];

/** The waits a tier offers, by key. */
export const WAITS = [
  ['day', 'A day'],
  ['three', '3 days'],
  ['week', 'A week'],
  ['two-weeks', 'Two weeks'],
  ['month', 'A month'],
] as const;

/** The product's default tiers, without ids: a reset gives each row a new one. */
export const DEFAULT_TIERS: readonly Omit<Tier, 'id'>[] = [
  { amount: 10000, wait: 'three' },
  { amount: 50000, wait: 'week' },
  { amount: 150000, wait: 'month' },
];

/** The default tiers in the app's words, for the offer under the set. */
export const DEFAULT_TIERS_LABEL = '$100 waits 3 days, $500 a week, $1,500 a month';

/** The most tiers the consumer's form takes. */
export const MAX_TIERS = 3;

/** A month of the reader's fixed bills, in cents, which the app worked out: the cushion's suggestion. */
export const MONTH_OF_BILLS = 234000;

/** The models the assistant offers, the default first. */
export const MODELS = [
  ['standard', 'Standard'],
  ['fast', 'Fast'],
] as const;

export const DEFAULT_MODEL = 'standard';

/** The logo providers. */
export const PROVIDERS = [
  ['northwind', 'Northwind Logos'],
  ['fabrikam', 'Fabrikam Marks'],
] as const;

/** Where the logo provider sends its updates, to paste into its dashboard. */
export const SETUP_ADDRESS = 'https://hooks.example.com/logos/7Fq2';

/** The two connections Bank sync lists, with their states in words. */
export const CONNECTIONS = [
  { name: 'Northwind Bank', state: 'Connected, synced today at 9:41' },
  { name: 'Fabrikam Credit Union', state: 'Connected, synced today at 9:40' },
] as const;

/** What the server holds when the page opens. */
export const FIRST_SAVED: Saved = {
  tiers: [
    { id: 'small', amount: 20000, wait: 'three' },
    { id: 'large', amount: 80000, wait: 'two-weeks' },
  ],
  cushion: null,
  pushAmounts: false,
  weeklyEmail: true,
  assistantKey: '',
  model: 'fast',
  logos: false,
  logoProvider: 'northwind',
  logoKey: '',
};

/** Dollars from cents, for a sentence, without Intl: "$1,500.00". The fields show their own figures. */
export const dollars = (cents: number): string => {
  const [whole = '0', part = '00'] = (cents / 100).toFixed(2).split('.');
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${part}`;
};
