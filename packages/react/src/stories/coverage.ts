/*
 * One account's statement coverage, shared by MonthGrid's stories and the server tests. Story code: it never ships
 * (the build starts from src/index.ts, which never imports this folder). Every string is the app's, written by
 * hand, as an app passes them: the Gregorian months in English, and the Persian ones already placed in Persian
 * years and months, as an app places them with @internationalized/date.
 */
import type { MonthGridLabels, MonthGridState, MonthGridYear } from '../month-grid';

/** The consumer's states: a held statement is filled, a partial one hatched, a missing one an outline. */
export const COVERAGE_STATES: MonthGridState[] = [
  { id: 'held', label: 'Held', look: 'filled' },
  { id: 'partial', label: 'Partial', look: 'partial' },
  { id: 'missing', label: 'Missing', look: 'empty' },
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

export const SHORT_MONTHS: string[] = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const H = 'held';
const P = 'partial';
const M = 'missing';

/** Two years, newest first: 2026 to October, the rest not yet come; 2025 with March and April missing, June partial. */
export const COVERAGE_YEARS: MonthGridYear[] = [
  { id: 2026, label: '2026', months: [H, H, H, H, H, H, H, H, H, H, null, null] },
  { id: 2025, label: '2025', months: [H, H, M, M, H, P, H, H, H, H, H, H] },
];

/** The account's first year: opened in March 2024, so January and February are outside the range. */
export const FIRST_YEAR: MonthGridYear = {
  id: 2024,
  label: '2024',
  months: [null, null, H, H, H, H, H, H, H, H, M, H],
};

/** The Persian guide's states, in Persian. */
export const PERSIAN_STATES: MonthGridState[] = [
  { id: 'held', label: 'موجود', look: 'filled' },
  { id: 'partial', label: 'ناقص', look: 'partial' },
  { id: 'missing', label: 'ناموجود', look: 'empty' },
];

/** Farvardin to Esfand. */
export const PERSIAN_MONTH_NAMES: string[] = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_SHORT_MONTHS: string[] = [
  'فر',
  'ار',
  'خر',
  'تی',
  'مر',
  'شه',
  'مه',
  'آب',
  'آذ',
  'دی',
  'به',
  'اس',
];

/**
 * An account on the Persian guide, newest first: 1404 with Khordad and Tir missing and Shahrivar partial, and
 * 1403 from Tir, when the account opened, so its first three months are outside the range.
 */
export const PERSIAN_YEARS: MonthGridYear[] = [
  { id: 1404, label: '۱۴۰۴', months: [H, H, M, M, H, P, H, H, H, H, H, H] },
  { id: 1403, label: '۱۴۰۳', months: [null, null, null, H, H, H, H, H, H, H, H, H] },
];

/** The Persian summary the app writes, since the library's default is English. */
export const PERSIAN_SUMMARY = 'ناموجود: خرداد و تیر ۱۴۰۴. ناقص: شهریور ۱۴۰۴.';

export const PERSIAN_LABELS: MonthGridLabels = { year: 'سال', outside: 'خارج از بازه' };
