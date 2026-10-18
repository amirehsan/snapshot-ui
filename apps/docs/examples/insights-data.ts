import type { BarSeries, BarValue } from '@snapshot-ui/charts';

/*
 * The Insights page's fixtures: a month's spending, already summed, sorted and formatted as the app does it.
 * The docs make no request, so every figure here is a string the app would have written. Shared by the bar
 * chart examples and, later, the Insights recipe.
 */

/** An amount as the app formats it: the number to draw and the string to say it. */
const money = (value: number): BarValue => ({
  value,
  valueLabel: `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`,
});

/** October's top ten merchants by spending, sorted by the app, and the rest summed as "Other", last. */
export const MERCHANTS: string[] = [
  'Whole Foods Market',
  'Shell',
  'Amazon',
  "Trader Joe's",
  'Comcast',
  'Blue Bottle Coffee',
  'Uber',
  'Walgreens',
  'Netflix',
  'Spotify',
  'Other',
];

export const BY_MERCHANT: BarSeries = {
  label: 'October',
  values: [612.4, 284.15, 241.87, 198.2, 129.99, 86.5, 74.3, 52.18, 22.99, 11.99, 143.6].map(money),
};

/** The gridlines for the merchants, each with the app's label. */
export const MERCHANT_TICKS: { value: number; label: string }[] = [
  { value: 0, label: '$0' },
  { value: 200, label: '$200' },
  { value: 400, label: '$400' },
  { value: 600, label: '$600' },
];

/**
 * October by category. Two refunds net their categories below zero: a returned coat in Shopping and a
 * cancelled flight in Travel. The app sorts them to the bottom.
 */
export const CATEGORIES: string[] = ['Groceries', 'Dining', 'Transport', 'Bills', 'Shopping', 'Travel'];

export const BY_CATEGORY: BarSeries = {
  label: 'October',
  values: [640, 312.45, 188.1, 150, -45.2, -310].map(money),
};

export const CATEGORY_TICKS: { value: number; label: string }[] = [
  { value: -250, label: '-$250' },
  { value: 0, label: '$0' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
];
