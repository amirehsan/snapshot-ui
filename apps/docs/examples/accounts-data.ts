import type { LineSeries } from '@snapshot-ui/charts';
import type { GaugeMark, MonthGridState, MonthGridYear } from '@snapshot-ui/react';

/*
 * The Accounts recipe's data: what an app's server holds and formats. Every figure, date, month name and word is
 * the app's string, written here by hand as an app writes it with its own formatting; the library formats nothing.
 */

/** The groups the list is drawn in, in this order, each with its heading. */
export const ACCOUNT_TYPES = [
  { id: 'credit', label: 'Credit cards' },
  { id: 'checking', label: 'Checking' },
  { id: 'savings', label: 'Savings' },
  { id: 'investment', label: 'Investments' },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]['id'];

/** One account, as the app's server holds it, with its figures already formatted. */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** The type in words, for the details. */
  typeLabel: string;
  institution: string;
  /** The bank's initials, for its square avatar: a logo's stand-in, since the docs load no image. */
  initials: string;
  lastFour: string;
  balance: string;
  /** The day the balance is from, as the app writes it. */
  balanceDate: string;
  /** Which statements the app holds, in a line. */
  coverage: string;
  feed: 'connected' | 'failed';
  /** The app thinks this account is another one imported twice. */
  isPossibleDuplicate?: boolean;
  nickname: string;
  creditLimit?: string;
  apr?: string;
  /** The share of the limit used, a percentage, for a card. */
  utilization?: number;
}

export const ACCOUNTS: readonly Account[] = [
  {
    id: 'everyday-visa',
    name: 'Everyday Visa',
    type: 'credit',
    typeLabel: 'Credit card',
    institution: 'Northwind Bank',
    initials: 'NB',
    lastFour: '4821',
    balance: '$1,150.00',
    balanceDate: 'Oct 18',
    coverage: 'Statements from March 2024, 3 missing',
    feed: 'connected',
    nickname: '',
    creditLimit: '$5,000.00',
    apr: '24.9%',
    utilization: 23,
  },
  {
    id: 'travel-mastercard',
    name: 'Travel Mastercard',
    type: 'credit',
    typeLabel: 'Credit card',
    institution: 'Contoso Bank',
    initials: 'CB',
    lastFour: '0937',
    balance: '$2,350.00',
    balanceDate: 'Oct 15',
    coverage: 'Statements from January 2025, none missing',
    feed: 'failed',
    nickname: 'Trips',
    creditLimit: '$5,000.00',
    apr: '21.4%',
    utilization: 47,
  },
  {
    id: 'everyday-checking',
    name: 'Everyday checking',
    type: 'checking',
    typeLabel: 'Checking',
    institution: 'Northwind Bank',
    initials: 'NB',
    lastFour: '3310',
    balance: '$4,212.56',
    balanceDate: 'Oct 18',
    coverage: 'Statements from June 2023, none missing',
    feed: 'connected',
    nickname: 'Bills',
  },
  {
    id: 'checking-import',
    name: 'Checking',
    type: 'checking',
    typeLabel: 'Checking',
    institution: 'Northwind Bank',
    initials: 'NB',
    lastFour: '3310',
    balance: '$4,212.56',
    balanceDate: 'Oct 2',
    coverage: 'Imported from a file, 1 statement',
    feed: 'connected',
    isPossibleDuplicate: true,
    nickname: '',
  },
  {
    id: 'rainy-day',
    name: 'Rainy day savings',
    type: 'savings',
    typeLabel: 'Savings',
    institution: 'Fabrikam Bank',
    initials: 'FB',
    lastFour: '7745',
    balance: '$12,400.00',
    balanceDate: 'Oct 18',
    coverage: 'Statements from June 2023, none missing',
    feed: 'connected',
    nickname: '',
  },
  {
    id: 'index-fund',
    name: 'Index fund',
    type: 'investment',
    typeLabel: 'Investment',
    institution: 'Woodgrove Investments',
    initials: 'WI',
    lastFour: '2290',
    balance: '$18,925.30',
    balanceDate: 'Oct 17',
    coverage: 'Statements from 2022, none missing',
    feed: 'connected',
    nickname: '',
  },
];

/** The summary over the list, as the app's server totals it: the duplicate is counted once. */
export const SUMMARY = [
  { label: 'Cash', value: '$16,612.56', caption: 'Checking and savings' },
  { label: 'Investments', value: '$18,925.30', caption: 'One fund' },
  { label: 'Owed', value: '$3,500.00', caption: 'Across your cards' },
  {
    label: 'Net worth',
    value: '$32,037.86',
    change: { direction: 'up', label: 'Up $1,204.50 since September' },
    caption: 'Cash and investments, less what you owe',
  },
] as const;

/** The day labels of a balance chart: the last thirty days, as the app formats them. */
export const BALANCE_DAYS: string[] = [
  ...Array.from({ length: 11 }, (_, index) => `Sep ${String(index + 20)}`),
  ...Array.from({ length: 18 }, (_, index) => `Oct ${String(index + 1)}`),
];

/** Dollars and cents with thousands commas, written by hand: the app's own formatting, the same on any server. */
export function dollars(value: number): string {
  const cents = Math.round(value * 100);
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${whole}.${String(cents % 100).padStart(2, '0')}`;
}

/** A balance over the last thirty days, rising toward `end` with a payment's dip, written as the app writes it. */
export function balanceSeries(end: number): LineSeries {
  const values = BALANCE_DAYS.map((_, index) => {
    const step = index / (BALANCE_DAYS.length - 1);
    const dip = index >= 12 && index < 15 ? 0.35 : 0;
    return Math.round(end * (0.55 + 0.45 * step - dip) * 100) / 100;
  });
  return {
    label: 'Balance',
    points: values.map((value) => ({ value, valueLabel: dollars(value) })),
  };
}

/** An amount the app wrote, as a number again: the app holds both, the docs keep one. */
export const amountOf = (text: string): number => Number(text.replace(/[$,]/g, ''));

/** A balance as a number, for the chart: the app has both. */
export const balanceValue = (account: Account): number => amountOf(account.balance);

/** The band edges of a 300 to 850 score: each mark's words are read as the gauge's description. */
export const SCORE_MARKS: GaugeMark[] = [
  { value: 580, label: 'Fair from 580' },
  { value: 670, label: 'Good from 670' },
  { value: 740, label: 'Very good from 740' },
  { value: 800, label: 'Excellent from 800' },
];

/** The bands in words, for the legend under the score, with their ranges. */
export const SCORE_BANDS = [
  { word: 'Poor', range: '300 to 579' },
  { word: 'Fair', range: '580 to 669' },
  { word: 'Good', range: '670 to 739' },
  { word: 'Very good', range: '740 to 799' },
  { word: 'Excellent', range: '800 to 850' },
] as const;

/** The app picks the word and the tone: ink from 670, warning under it, never error, which means a failure. */
export function scoreBand(score: number): { caption: string; tone: 'neutral' | 'warning' } {
  if (score >= 800) return { caption: 'Excellent', tone: 'neutral' };
  if (score >= 740) return { caption: 'Very good', tone: 'neutral' };
  if (score >= 670) return { caption: 'Good', tone: 'neutral' };
  if (score >= 580) return { caption: 'Fair', tone: 'warning' };
  return { caption: 'Poor', tone: 'warning' };
}

export const SCORE = 742;

/** Utilization's two thresholds, with words for the one gauge that says them. */
export const UTILIZATION_MARKS: GaugeMark[] = [
  { value: 10, label: 'Best under 10%' },
  { value: 30, label: 'Keep it under 30%' },
];

/** The same thresholds on every row of a table, with no words: the note above the table says them once. */
export const ROW_MARKS: GaugeMark[] = [
  { value: 10, label: '' },
  { value: 30, label: '' },
];

/** The cards' total use of their limits, a percentage, as the app's server works it out. */
export function utilizationOf(cards: readonly Account[]): number {
  const used = cards.reduce((sum, card) => sum + amountOf(card.balance), 0);
  const limit = cards.reduce((sum, card) => sum + amountOf(card.creditLimit ?? '0'), 0);
  return limit > 0 ? Math.round((used / limit) * 100) : 0;
}

/** The app's states for a statement, each mapped to one of three looks. */
export const COVERAGE_STATES: MonthGridState[] = [
  { id: 'held', label: 'Held', look: 'filled' },
  { id: 'partial', label: 'Partial', look: 'partial' },
  { id: 'missing', label: 'Missing', look: 'empty' },
];

export const MONTH_LABELS: string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTH_NAMES: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const H = 'held';
const P = 'partial';
const M = 'missing';

/** A card's statements, newest first: opened in March 2024, October 2026 not yet come. */
export const COVERAGE: Record<string, MonthGridYear[]> = {
  'everyday-visa': [
    { id: 2026, label: '2026', months: [H, H, H, H, H, H, H, H, H, null, null, null] },
    { id: 2025, label: '2025', months: [H, H, M, M, H, P, H, H, H, H, H, H] },
    { id: 2024, label: '2024', months: [null, null, H, H, H, H, H, H, H, H, M, H] },
  ],
  'travel-mastercard': [
    { id: 2026, label: '2026', months: [H, H, H, H, H, H, H, H, H, null, null, null] },
    { id: 2025, label: '2025', months: [H, H, H, H, H, H, H, H, H, H, H, H] },
  ],
};
