import { describe, expect, it } from 'vitest';
import type { MonthGridState, MonthGridYear } from './MonthGrid';
import { monthGridSummary } from './summary';

/** The consumer's states: held statements filled, partial ones hatched, missing ones outlined. */
const HELD: MonthGridState = { id: 'held', label: 'Held', look: 'filled' };
const PARTIAL: MonthGridState = { id: 'partial', label: 'Partial', look: 'partial' };
const MISSING: MonthGridState = { id: 'missing', label: 'Missing', look: 'empty' };
const STATES = [HELD, PARTIAL, MISSING];

const MONTHS = [
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

/** A year of held months with the given months, by index, in other states. */
const year = (label: string, others: Record<number, string | null> = {}): MonthGridYear => ({
  id: label,
  label,
  months: MONTHS.map((_, index) => (index in others ? (others[index] ?? null) : 'held')),
});

describe('monthGridSummary', () => {
  it("names one state's months in one year, the year once at the end", () => {
    expect(monthGridSummary(STATES, [year('2025', { 2: 'missing', 3: 'missing' })], MONTHS)).toBe(
      'Missing: March, April 2025.',
    );
  });

  it('joins years by semicolons in the order drawn, and states as sentences in the order given', () => {
    const years = [
      year('2025', { 2: 'missing', 3: 'missing', 5: 'partial' }),
      year('2024', { 10: 'missing' }),
    ];
    expect(monthGridSummary(STATES, years, MONTHS)).toBe(
      'Partial: June 2025. Missing: March, April 2025; November 2024.',
    );
    // The order of the states, not of the months, sets the order of the sentences.
    expect(monthGridSummary([HELD, MISSING, PARTIAL], years, MONTHS)).toBe(
      'Missing: March, April 2025; November 2024. Partial: June 2025.',
    );
  });

  it('lists months that are not consecutive with commas too', () => {
    expect(
      monthGridSummary(STATES, [year('2025', { 0: 'missing', 4: 'missing', 11: 'missing' })], MONTHS),
    ).toBe('Missing: January, May, December 2025.');
  });

  it('skips filled states and outside months', () => {
    const years = [year('2026', { 9: null, 10: null, 11: null, 1: 'missing' })];
    expect(monthGridSummary(STATES, years, MONTHS)).toBe('Missing: February 2026.');
    // A second filled state, such as a closed account's months, is not named either.
    const closed: MonthGridState[] = [...STATES, { id: 'closed', label: 'Closed', look: 'filled' }];
    expect(monthGridSummary(closed, [year('2025', { 0: 'closed', 1: 'missing' })], MONTHS)).toBe(
      'Missing: February 2025.',
    );
  });

  it("says the first filled state's label and every month when nothing is missing or partial", () => {
    expect(monthGridSummary(STATES, [year('2025'), year('2024', { 0: null })], MONTHS)).toBe(
      'Held: every month.',
    );
    const closed: MonthGridState[] = [{ id: 'closed', label: 'Closed', look: 'filled' }, ...STATES];
    expect(monthGridSummary(closed, [year('2025')], MONTHS)).toBe('Closed: every month.');
  });

  it('says nothing when no month holds a state', () => {
    const outside: MonthGridYear = { id: 'empty', label: '2027', months: MONTHS.map(() => null) };
    expect(monthGridSummary(STATES, [outside], MONTHS)).toBe('');
    expect(monthGridSummary(STATES, [], MONTHS)).toBe('');
    // An id no state has is drawn blank and said nowhere.
    expect(monthGridSummary(STATES, [{ id: 'x', label: '2025', months: ['unknown'] }], MONTHS)).toBe('');
    // With no filled state, nothing missing has no sentence to say.
    expect(monthGridSummary([PARTIAL, MISSING], [year('2025')], MONTHS)).toBe('');
  });

  it('ignores a month index past monthNames', () => {
    const long: MonthGridYear = {
      id: 'long',
      label: '2025',
      months: [...MONTHS.map(() => 'held'), 'missing'],
    };
    expect(monthGridSummary(STATES, [long], MONTHS)).toBe('Held: every month.');
    const both: MonthGridYear = {
      id: 'both',
      label: '2025',
      months: ['missing', ...MONTHS.map(() => 'missing')],
    };
    expect(monthGridSummary(STATES, [both], MONTHS)).toBe(`Missing: ${MONTHS.join(', ')} 2025.`);
  });
});
