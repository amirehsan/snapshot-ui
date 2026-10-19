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

/** The last twelve months, the newest last, as the app labels them. */
export const MONTHS: string[] = [
  'Nov',
  'Dec',
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
];

/** Net cash flow by month: December's gifts and June's car repair took it below zero. */
export const NET_BY_MONTH: BarSeries = {
  label: 'Net',
  values: [640, -820, 1210, 1480, 905, 1130, 760, -310, 455, 1020, 1395, 980].map(money),
};

export const NET_TICKS: { value: number; label: string }[] = [
  { value: -1000, label: '-$1,000' },
  { value: 0, label: '$0' },
  { value: 1000, label: '$1,000' },
];

/** The last six months, for the month view's two series. */
export const HALF_YEAR: string[] = MONTHS.slice(6);

/** Money that arrived, in gain, pinned so it keeps its color when the month view shows it alone. */
export const INCOME: BarSeries = {
  label: 'Income',
  color: 'gain',
  values: [5200, 5200, 5450, 5200, 5200, 6100].map(money),
};

/** Money that went out, in ink, pinned the same way. Never a color of its own. */
export const SPENDING: BarSeries = {
  label: 'Spending',
  color: 'ink',
  values: [3710, 4020, 4390, 3960, 3610, 3885].map(money),
};

export const INCOME_TICKS: { value: number; label: string }[] = [
  { value: 0, label: '$0' },
  { value: 2500, label: '$2,500' },
  { value: 5000, label: '$5,000' },
];

/** October by category beside September, the previous period, for the comparison. */
export const COMPARE_CATEGORIES: string[] = ['Groceries', 'Dining', 'Transport', 'Bills', 'Shopping'];

export const OCTOBER_BY_CATEGORY: BarSeries = {
  label: 'October',
  values: [640, 312.45, 188.1, 150, 96.2].map(money),
};

/** The previous period: no color of its own, so it takes October's, striped. */
export const SEPTEMBER_BY_CATEGORY: BarSeries = {
  label: 'September',
  look: 'hatched',
  values: [598.3, 355, 201.75, 150, 142.8].map(money),
};

export const COMPARE_TICKS: { value: number; label: string }[] = [
  { value: 0, label: '$0' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
];

/**
 * The category mix by month: the top four categories, the same four all half year, and the rest summed as
 * "Other", last, for the stacked month view. Pinned to their slots, so a category keeps its color when a filter
 * takes another away.
 */
export const CATEGORY_MIX: BarSeries[] = [
  { label: 'Groceries', color: 'chart-1', values: [612.4, 640, 598.3, 655.1, 621.75, 640].map(money) },
  { label: 'Dining', color: 'chart-2', values: [312.45, 280.1, 355, 298.6, 330.2, 312.45].map(money) },
  { label: 'Transport', color: 'chart-3', values: [188.1, 201.75, 176.4, 215.3, 190, 188.1].map(money) },
  { label: 'Bills', color: 'chart-4', values: [150, 150, 150, 165.2, 150, 150].map(money) },
  { label: 'Other', color: 'slate', values: [243.6, 210.4, 265.15, 198.9, 230.35, 226.8].map(money) },
];

/** Each month's total, summed and formatted by the app: the chart never adds a figure it must say. */
export const MIX_TOTALS: string[] = [
  '$1,506.55',
  '$1,482.25',
  '$1,544.85',
  '$1,533.10',
  '$1,522.30',
  '$1,517.35',
];

export const MIX_TICKS: { value: number; label: string }[] = [
  { value: 0, label: '$0' },
  { value: 500, label: '$500' },
  { value: 1000, label: '$1,000' },
  { value: 1500, label: '$1,500' },
];
