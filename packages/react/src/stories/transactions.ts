/*
 * One household's transactions, shared by DataTable's and SidePanel's stories and tests. Story code: it never
 * ships (the build starts from src/index.ts, which never imports this folder). Every string is the app's, written
 * by hand with no Intl, as an app passes them.
 */
import type { DataTableColumn } from '../data-table';

export interface Transaction {
  id: string;
  /** ISO date. */
  date: string;
  /** The date as the app writes it in a cell: "12 Oct". */
  dateLabel: string;
  /** The day group's heading: "Monday 12 October". */
  dayLabel: string;
  payee: string;
  category: string;
  account: string;
  /** Minor units, negative for money out. */
  minor: number;
}

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

/** A count with a comma between thousands, written by hand. */
const withCommas = (count: number): string => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "-$125.00" from -12500: the app's own formatter. */
export function money(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const absolute = Math.abs(minor);
  const cents = String(absolute % 100).padStart(2, '0');
  return `${sign}$${withCommas(Math.floor(absolute / 100))}.${cents}`;
}

/** Day and month from an ISO date, read by hand, so the zone never moves it. */
function partsOf(iso: string): { year: number; month: number; day: number } {
  const [year = '2026', month = '1', day = '1'] = iso.split('-');
  return { year: Number(year), month: Number(month), day: Number(day) };
}

/** The weekday of an ISO date, by Zeller's congruence: no Date, no zone. */
function weekdayOf(iso: string): number {
  const { year, month, day } = partsOf(iso);
  const m = month < 3 ? month + 12 : month;
  const y = month < 3 ? year - 1 : year;
  const k = y % 100;
  const j = Math.floor(y / 100);
  const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
  // Zeller counts 0 as Saturday.
  return (h + 6) % 7;
}

const dateLabelOf = (iso: string): string => {
  const { month, day } = partsOf(iso);
  return `${String(day)} ${MONTHS[month - 1] ?? ''}`;
};

const dayLabelOf = (iso: string): string => {
  const { month, day } = partsOf(iso);
  return `${WEEKDAYS[weekdayOf(iso)] ?? ''} ${String(day)} ${MONTH_NAMES[month - 1] ?? ''}`;
};

const RAW: [id: string, date: string, payee: string, category: string, account: string, minor: number][] = [
  ['t1', '2026-10-14', 'Corner Mart', 'Groceries', 'Checking', -4218],
  ['t2', '2026-10-14', 'City Transit', 'Transport', 'Checking', -275],
  ['t3', '2026-10-13', 'Northside Rent', 'Rent', 'Checking', -145000],
  ['t4', '2026-10-13', 'Acme Payroll', 'Salary', 'Checking', 312500],
  ['t5', '2026-10-12', 'Green Grocer', 'Groceries', 'Credit card', -2890],
  ['t6', '2026-10-12', 'Bright Power', 'Utilities', 'Checking', -8640],
  ['t7', '2026-10-11', 'Cafe Luna', 'Dining', 'Credit card', -1450],
  ['t8', '2026-10-10', 'Fiber Net', 'Internet', 'Checking', -5999],
  ['t9', '2026-10-09', 'Book Nook', 'Education', 'Credit card', -2399],
  ['t10', '2026-10-08', 'Corner Mart', 'Groceries', 'Credit card', -3125],
  ['t11', '2026-10-07', 'Rail Pass', 'Transport', 'Checking', -9000],
  ['t12', '2026-10-06', 'Refund: Shoe Hut', 'Refunds', 'Credit card', 4500],
];

const toTransaction = ([id, date, payee, category, account, minor]: (typeof RAW)[number]): Transaction => ({
  id,
  date,
  dateLabel: dateLabelOf(date),
  dayLabel: dayLabelOf(date),
  payee,
  category,
  account,
  minor,
});

/** Twelve transactions, newest first. */
export const TRANSACTIONS: readonly Transaction[] = RAW.map(toTransaction);

/** `count` transactions for a long page, the twelve repeated a day further back each time round, newest first. */
export function manyTransactions(count: number): Transaction[] {
  return Array.from({ length: count }, (_, index) => {
    const base = RAW[index % RAW.length];
    if (base === undefined) throw new Error('No transaction');
    const round = Math.floor(index / RAW.length);
    const { day } = partsOf(base[1]);
    const date = `2026-09-${String(Math.max(1, day - 6 - round)).padStart(2, '0')}`;
    return toTransaction([
      `m${String(index + 1)}`,
      round === 0 ? base[1] : date,
      base[2],
      base[3],
      base[4],
      base[5],
    ]);
  });
}

/** The sum of the amounts, as the app writes it. */
export const totalOf = (rows: readonly Transaction[]): string =>
  money(rows.reduce((sum, row) => sum + row.minor, 0));

export const keyOf = (row: Transaction): string => row.id;
export const hrefOf = (row: Transaction): string => `/transactions/${row.id}`;

/** The list face's day groups. */
export const groupOf = (row: Transaction): { id: string; label: string } => ({
  id: row.date,
  label: row.dayLabel,
});

/**
 * Date, Payee as the row header, Category leaving under 48rem, Account under 40rem, and Amount at the end. In the
 * list face the payee is an item's title, the category its second line and the amount its end; the date is the
 * day's heading.
 */
export const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => row.dateLabel, allowsSorting: true, width: '7rem' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category, hideBelow: 'md', listSlot: 'meta' },
  { id: 'account', header: 'Account', cell: (row) => row.account },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => money(row.minor),
    align: 'end',
    allowsSorting: true,
    width: '8rem',
    listSlot: 'end',
  },
];

/** The same columns with the amount's total for `rows`. */
export const columnsWithTotal = (rows: readonly Transaction[]): readonly DataTableColumn<Transaction>[] =>
  COLUMNS.map((column) => (column.id === 'amount' ? { ...column, total: totalOf(rows) } : column));
