/*
 * One household's October, shared by the data table examples. Amounts are minor units and every label is the
 * app's own, written by hand from fixed tables with no Intl, so the server and the browser write the same.
 */

export interface Transaction {
  id: string;
  /** ISO date. */
  date: string;
  payee: string;
  category: string;
  account: string;
  /** Minor units, negative for money out. */
  minor: number;
}

export const TRANSACTIONS: readonly Transaction[] = [
  {
    id: 't1',
    date: '2026-10-14',
    payee: 'Corner Mart',
    category: 'Groceries',
    account: 'Checking',
    minor: -4218,
  },
  {
    id: 't2',
    date: '2026-10-14',
    payee: 'City Transit',
    category: 'Transport',
    account: 'Checking',
    minor: -275,
  },
  {
    id: 't3',
    date: '2026-10-13',
    payee: 'Northside Rent',
    category: 'Rent',
    account: 'Checking',
    minor: -145000,
  },
  {
    id: 't4',
    date: '2026-10-13',
    payee: 'Acme Payroll',
    category: 'Salary',
    account: 'Checking',
    minor: 312500,
  },
  {
    id: 't5',
    date: '2026-10-12',
    payee: 'Green Grocer',
    category: 'Groceries',
    account: 'Credit card',
    minor: -2890,
  },
  {
    id: 't6',
    date: '2026-10-12',
    payee: 'Bright Power',
    category: 'Utilities',
    account: 'Checking',
    minor: -8640,
  },
  {
    id: 't7',
    date: '2026-10-11',
    payee: 'Cafe Luna',
    category: 'Dining',
    account: 'Credit card',
    minor: -1450,
  },
  {
    id: 't8',
    date: '2026-10-10',
    payee: 'Fiber Net',
    category: 'Internet',
    account: 'Checking',
    minor: -5999,
  },
  {
    id: 't9',
    date: '2026-10-09',
    payee: 'Book Nook',
    category: 'Education',
    account: 'Credit card',
    minor: -2399,
  },
  {
    id: 't10',
    date: '2026-10-08',
    payee: 'Corner Mart',
    category: 'Groceries',
    account: 'Credit card',
    minor: -3125,
  },
  {
    id: 't11',
    date: '2026-10-07',
    payee: 'Rail Pass',
    category: 'Transport',
    account: 'Checking',
    minor: -9000,
  },
  {
    id: 't12',
    date: '2026-10-06',
    payee: 'Refund: Shoe Hut',
    category: 'Refunds',
    account: 'Credit card',
    minor: 4500,
  },
];

/** A count with a comma between thousands, written by hand. */
const withCommas = (count: number): string => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "−$125.00" from -12500: a real minus sign (U+2212), as wide as a digit, before the currency. */
export function amountLabel(minor: number): string {
  const sign = minor < 0 ? '\u2212' : '';
  const absolute = Math.abs(minor);
  return `${sign}$${withCommas(Math.floor(absolute / 100))}.${String(absolute % 100).padStart(2, '0')}`;
}

/** The sum of the rows' amounts, as the app writes it. */
export const totalLabel = (rows: readonly Transaction[]): string =>
  amountLabel(rows.reduce((sum, row) => sum + row.minor, 0));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
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
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function partsOf(iso: string): { year: number; month: number; day: number } {
  const [year = '2026', month = '1', day = '1'] = iso.split('-');
  return { year: Number(year), month: Number(month), day: Number(day) };
}

/** The weekday of an ISO date by Zeller's congruence, Sunday first: no Date, so no zone moves it. */
function weekdayOf(iso: string): number {
  const { year, month, day } = partsOf(iso);
  const m = month < 3 ? month + 12 : month;
  const y = month < 3 ? year - 1 : year;
  const k = y % 100;
  const j = Math.floor(y / 100);
  const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
  return (h + 6) % 7;
}

/** "12 Oct", a date in a cell. */
export function dateLabel(iso: string): string {
  const { month, day } = partsOf(iso);
  return `${String(day)} ${MONTHS[month - 1] ?? ''}`;
}

/** "Monday 12 October", a day's heading. */
export function dayLabel(iso: string): string {
  const { month, day } = partsOf(iso);
  return `${WEEKDAYS[weekdayOf(iso)] ?? ''} ${String(day)} ${MONTH_NAMES[month - 1] ?? ''}`;
}
