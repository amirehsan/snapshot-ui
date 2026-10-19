import { describe, expect, it } from 'vitest';
import type { MonthGridState, MonthGridYear } from './MonthGrid';
import { monthGridSummary } from './summary';

/** The consumer's states: held statements filled, partial ones hatched, missing ones outlined. */
const HELD: MonthGridState = { id: 'held', label: 'Held', look: 'filled' };
const PARTIAL: MonthGridState = { id: 'partial', label: 'Partial', look: 'partial' };
const MISSING: MonthGridState = { id: 'missing', label: 'Missing', look: 'empty' };
const CLOSED: MonthGridState = { id: 'closed', label: 'Closed', look: 'filled' };
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

/** A year of held months with the given months, by index, in other states. Its id is its number. */
const year = (label: string, others: Record<number, string | null> = {}): MonthGridYear => ({
  id: Number(label),
  label,
  months: MONTHS.map((_, index) => (index in others ? (others[index] ?? null) : 'held')),
});

describe('monthGridSummary', () => {
  it("names one state's months in one year, with the year once at the end", () => {
    expect(monthGridSummary(STATES, [year('2025', { 2: 'missing', 3: 'missing' })], MONTHS)).toBe(
      'Missing: March and April 2025.',
    );
    expect(monthGridSummary(STATES, [year('2025', { 5: 'missing' })], MONTHS)).toBe('Missing: June 2025.');
  });

  it('writes three or more consecutive months as a range, and a whole year as every month of it', () => {
    expect(
      monthGridSummary(
        STATES,
        [year('2025', { 2: 'missing', 3: 'missing', 4: 'missing', 8: 'missing' })],
        MONTHS,
      ),
    ).toBe('Missing: March to May and September 2025.');
    const all: MonthGridYear = { id: 2025, label: '2025', months: MONTHS.map(() => 'missing') };
    expect(monthGridSummary(STATES, [all, year('2026', { 0: 'missing' })], MONTHS)).toBe(
      'Missing: every month of 2025 and January 2026.',
    );
  });

  it('lists months that are not consecutive with commas, and "and" before the last', () => {
    expect(
      monthGridSummary(STATES, [year('2025', { 0: 'missing', 4: 'missing', 11: 'missing' })], MONTHS),
    ).toBe('Missing: January, May and December 2025.');
  });

  it('runs oldest first across years, whatever the order the rows are drawn in', () => {
    const newestFirst = [year('2025', { 2: 'missing', 3: 'missing' }), year('2024', { 10: 'missing' })];
    expect(monthGridSummary(STATES, newestFirst, MONTHS)).toBe(
      'Missing: November 2024, March and April 2025.',
    );
    expect(monthGridSummary(STATES, [...newestFirst].reverse(), MONTHS)).toBe(
      'Missing: November 2024, March and April 2025.',
    );
    // Years whose ids are not numbers are read in the order drawn.
    const named = newestFirst.map((each) => ({ ...each, id: `year-${each.label}` }));
    expect(monthGridSummary(STATES, named, MONTHS)).toBe('Missing: March, April 2025 and November 2024.');
  });

  it('says the empty looks first and then the partial ones, each in the order of states', () => {
    const years = [year('2025', { 2: 'missing', 5: 'partial', 7: 'requested' })];
    const requested: MonthGridState = { id: 'requested', label: 'Requested', look: 'empty' };
    expect(monthGridSummary([HELD, PARTIAL, MISSING, requested], years, MONTHS)).toBe(
      'Missing: March 2025. Requested: August 2025. Partial: June 2025.',
    );
    expect(monthGridSummary([requested, PARTIAL, HELD, MISSING], years, MONTHS)).toBe(
      'Requested: August 2025. Missing: March 2025. Partial: June 2025.',
    );
  });

  it('skips filled states and outside months while anything is missing or partial', () => {
    const years = [year('2026', { 9: null, 10: null, 11: null, 1: 'missing' })];
    expect(monthGridSummary(STATES, years, MONTHS)).toBe('Missing: February 2026.');
    expect(monthGridSummary([...STATES, CLOSED], [year('2025', { 0: 'closed', 1: 'missing' })], MONTHS)).toBe(
      'Missing: February 2025.',
    );
  });

  it('says every month only when one filled state is held, in the words of the first held', () => {
    expect(monthGridSummary(STATES, [year('2025'), year('2024', { 0: null })], MONTHS)).toBe(
      'Held: every month.',
    );
    // Closed comes first in states but no month holds it, so Held is named.
    expect(monthGridSummary([CLOSED, ...STATES], [year('2025')], MONTHS)).toBe('Held: every month.');
  });

  it('names the months of every other filled state, and the first held one as all other months', () => {
    const years = [year('2025', { 0: 'closed', 1: 'closed', 2: 'closed' })];
    expect(monthGridSummary([...STATES, CLOSED], years, MONTHS)).toBe(
      'Closed: January to March 2025. Held: all other months.',
    );
    expect(monthGridSummary([CLOSED, ...STATES], years, MONTHS)).toBe(
      'Held: April to December 2025. Closed: all other months.',
    );
  });

  it('reads a state once when two share an id, the first as drawn', () => {
    const twice = [HELD, MISSING, { id: 'missing', label: 'Lost', look: 'partial' } satisfies MonthGridState];
    expect(monthGridSummary(twice, [year('2025', { 4: 'missing' })], MONTHS)).toBe('Missing: May 2025.');
    expect(monthGridSummary([HELD, HELD], [year('2025')], MONTHS)).toBe('Held: every month.');
  });

  it('says nothing when no month holds a state', () => {
    const outside: MonthGridYear = { id: 2027, label: '2027', months: MONTHS.map(() => null) };
    expect(monthGridSummary(STATES, [outside], MONTHS)).toBe('');
    expect(monthGridSummary(STATES, [], MONTHS)).toBe('');
    // An id no state has is drawn blank and said nowhere.
    expect(monthGridSummary(STATES, [{ id: 2025, label: '2025', months: ['unknown'] }], MONTHS)).toBe('');
    // With no filled state, nothing missing has no sentence to say.
    expect(monthGridSummary([PARTIAL, MISSING], [year('2025')], MONTHS)).toBe('');
  });

  it('ignores a month index past monthNames', () => {
    const long: MonthGridYear = { id: 2025, label: '2025', months: [...MONTHS.map(() => 'held'), 'missing'] };
    expect(monthGridSummary(STATES, [long], MONTHS)).toBe('Held: every month.');
    const both: MonthGridYear = {
      id: 2025,
      label: '2025',
      months: ['missing', ...MONTHS.map(() => 'missing')],
    };
    expect(monthGridSummary(STATES, [both], MONTHS)).toBe('Missing: every month of 2025.');
  });
});
