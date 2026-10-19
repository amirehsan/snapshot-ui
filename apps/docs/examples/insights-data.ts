import type { BarSeries, BarValue } from '@snapshot-ui/charts';

/*
 * The Insights page's fixtures: a month's spending, already summed, sorted and formatted as the app does it.
 * The docs make no request, so every figure here is a string the app would have written. Shared by the bar
 * chart examples and the Insights recipe.
 */

/** An amount as the app writes it, with no Intl: "$1,450.00", "-$310.00". */
export const dollars = (value: number): string => {
  const [whole = '0', cents = '00'] = Math.abs(value).toFixed(2).split('.');
  return `${value < 0 ? '-' : ''}$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
};

/** An amount as the app formats it: the number to draw and the string to say it. */
export const money = (value: number): BarValue => ({ value, valueLabel: dollars(value) });

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

/**
 * Five months of spending beside the same months a year before, the previous period, for the comparison.
 * Standing up, a phone gives each band about 2rem, so its labels are months, whole in their bands; names as long
 * as a category's want the bars lying down.
 */
export const COMPARE_MONTHS: string[] = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

export const THIS_YEAR_BY_MONTH: BarSeries = {
  label: '2026',
  values: [1820.4, 1765.1, 1910.25, 1688.9, 1745.3].map(money),
};

/** The previous period: no color of its own, so it takes this year's, striped. */
export const LAST_YEAR_BY_MONTH: BarSeries = {
  label: '2025',
  look: 'hatched',
  values: [1702.15, 1810.6, 1655, 1740.8, 1598.3].map(money),
};

export const COMPARE_TICKS: { value: number; label: string }[] = [
  { value: 0, label: '$0' },
  { value: 1000, label: '$1,000' },
  { value: 2000, label: '$2,000' },
];

/**
 * The category mix by month: the top four categories, the same four all half year, and the rest summed as
 * "Other", last, for the stacked month view. Pinned to their slots, so a category keeps its color when a filter
 * takes another away, and "Other" to slate, so it keeps the fifth look in a month with fewer categories.
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

// ---- The Insights recipe --------------------------------------------------------------------------------------

/** Cents, so a sum or a difference of amounts never draws a float's tail. */
const cents = (value: number): number => Math.round(value * 100) / 100;

/** A gridline at each value, labelled in whole dollars as the app writes them. */
const ticksAt = (...values: number[]): { value: number; label: string }[] =>
  values.map((value) => ({ value, label: dollars(value).replace(/\.00$/, '') }));

/** One row of a ranked view: its name, the key its transactions link takes, and both periods' amounts. */
export interface RankedRow {
  name: string;
  key: string;
  october: number;
  september: number;
}

const row = (name: string, key: string, october: number, september: number): RankedRow => ({
  name,
  key,
  october,
  september,
});

/** October's and September's spending, which every view sums to. */
const SPENT = { october: 4220, september: 3805 };

/** A view's rows and "Other", the rest of the month's spending, as the app's query sums it. */
function withOther(rows: RankedRow[]): RankedRow[] {
  const rest = (period: 'october' | 'september'): number =>
    cents(SPENT[period] - rows.reduce((sum, each) => sum + each[period], 0));
  return [...rows, row('Other', 'other', rest('october'), rest('september'))];
}

/**
 * October against September by category, merchant and account, each summing to the month's spending, sorted by
 * October's amount with "Other" last. A cancelled flight's refund nets Travel, Delta Air Lines and the travel card
 * below zero in October.
 */
export const RANKED: Record<'category' | 'merchant' | 'account', RankedRow[]> = {
  category: withOther([
    row('Rent', 'rent', 1450, 1450),
    row('Groceries', 'groceries', 742.6, 698.15),
    row('Dining', 'dining', 412.45, 455),
    row('Shopping', 'shopping', 368.3, 212.4),
    row('Transport', 'transport', 288.1, 301.75),
    row('Utilities', 'utilities', 241.75, 236.2),
    row('Health', 'health', 186.4, 92.3),
    row('Gifts', 'gifts', 165, 40),
    row('Subscriptions', 'subscriptions', 64.97, 64.97),
    row('Travel', 'travel', -310, 120),
  ]),
  merchant: withOther([
    row('Northside Rent', 'northside-rent', 1450, 1450),
    row('Whole Foods Market', 'whole-foods-market', 812.4, 760.2),
    row('Amazon', 'amazon', 441.87, 395.1),
    row('Shell', 'shell', 384.15, 342.8),
    row("Trader Joe's", 'trader-joes', 198.2, 221.45),
    row('Comcast', 'comcast', 129.99, 129.99),
    row('Blue Bottle Coffee', 'blue-bottle-coffee', 86.5, 102),
    row('Uber', 'uber', 74.3, 96.4),
    row('Walgreens', 'walgreens', 52.18, 38.5),
    row('Delta Air Lines', 'delta-air-lines', -310, 120),
  ]),
  // Five accounts, so every one is shown and there is no "Other".
  account: [
    row('Joint checking', 'joint-checking', 1950, 1950),
    row('Everyday card', 'everyday-card', 1468.32, 1175.4),
    row('Rewards card', 'rewards-card', 802.18, 412.6),
    row('Personal checking', 'personal-checking', 309.5, 147),
    row('Travel card', 'travel-card', -310, 120),
  ],
};

/** Each month's key for its transactions link, beside `MONTHS`, the newest last. */
export const MONTH_KEYS: string[] = [
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
];

const minus = (a: readonly number[], b: readonly number[]): number[] =>
  a.map((value, index) => cents(value - (b[index] ?? 0)));

/** The last twelve months' income and spending: December's gifts and June's car repair spent past the income. */
const INCOME_YEAR = [5200, 5200, 5200, 5200, 5200, 5450, 5200, 5200, 5200, 5200, 5200, 5200];
const SPENDING_YEAR = [4560, 6020, 3990, 3720, 4295, 4320, 4440, 5510, 4745, 4180, 3805, 4220];

/** The twelve months before them, the month view's previous period. */
const INCOME_BEFORE = [4900, 4900, 4900, 4900, 4900, 5150, 4900, 4900, 4900, 4900, 4900, 4900];
const SPENDING_BEFORE = [4410, 5640, 3870, 3800, 4105, 4260, 4310, 4720, 4580, 4020, 3950, 3990];

/** A month view's figures: these twelve months, and the twelve before for the comparison. */
export interface MonthFigures {
  year: number[];
  before: number[];
}

/** Income, spending and net, which is their difference, so it goes below zero where spending passed income. */
export const MONTH_FIGURES: Record<'income' | 'spending' | 'net', MonthFigures> = {
  income: { year: INCOME_YEAR, before: INCOME_BEFORE },
  spending: { year: SPENDING_YEAR, before: SPENDING_BEFORE },
  net: { year: minus(INCOME_YEAR, SPENDING_YEAR), before: minus(INCOME_BEFORE, SPENDING_BEFORE) },
};

export const MONTH_TICKS: { value: number; label: string }[] = ticksAt(0, 2000, 4000, 6000);

export const MONTH_NET_TICKS: { value: number; label: string }[] = ticksAt(-1000, 0, 1000);

/** Rent and the next three categories by month, each pinned to its palette slot. */
const MIX_TOP: { label: string; color: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4'; values: number[] }[] = [
  { label: 'Rent', color: 'chart-1', values: INCOME_YEAR.map(() => 1450) },
  {
    label: 'Groceries',
    color: 'chart-2',
    values: [690, 760, 640, 655, 700, 720, 705, 690, 735, 710, 698.15, 742.6],
  },
  {
    label: 'Dining',
    color: 'chart-3',
    values: [380, 620, 300, 290, 350, 360, 390, 420, 410, 390, 455, 412.45],
  },
  {
    label: 'Transport',
    color: 'chart-4',
    values: [260, 240, 250, 240, 280, 300, 290, 310, 330, 300, 301.75, 288.1],
  },
];

/**
 * The category mix by month, the consumer's later stacked view: the top four categories and the rest as "Other"
 * in slate, so each month's stack is its spending, the total the app writes over it.
 */
export const MONTH_MIX: BarSeries[] = [
  ...MIX_TOP.map(({ label, color, values }) => ({ label, color, values: values.map(money) })),
  {
    label: 'Other',
    color: 'slate',
    values: SPENDING_YEAR.map((total, index) =>
      money(cents(total - MIX_TOP.reduce((sum, { values }) => sum + (values[index] ?? 0), 0))),
    ),
  },
];

export const MONTH_MIX_TOTALS: string[] = SPENDING_YEAR.map(dollars);
