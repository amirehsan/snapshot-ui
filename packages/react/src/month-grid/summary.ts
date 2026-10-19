import type { MonthGridState, MonthGridYear } from './MonthGrid';

/** The looks whose states the summary names first, in this order: what is missing, then what is partial. */
const NAMED_LOOKS = ['empty', 'partial'] as const;

/** "A", "A and B", "A, B and C". */
const list = (items: readonly string[]): string =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1] ?? ''}`;

/** A year's id read as a number: a number, or a string of digits; otherwise none. */
const yearNumber = (year: MonthGridYear): number | null => {
  if (typeof year.id === 'number' && Number.isFinite(year.id)) return year.id;
  if (typeof year.id === 'string' && /^\d+$/.test(year.id)) return Number(year.id);
  return null;
};

/**
 * The years oldest first. Rows may be drawn newest first, so years whose ids are all numbers (2025, or 1404 on a
 * Persian page) are put in the order of those numbers; any other ids leave the years in the order drawn. Nothing
 * here reads a calendar: the ids are the app's.
 */
const oldestFirst = (years: readonly MonthGridYear[]): readonly MonthGridYear[] => {
  const numbers = years.map(yearNumber);
  if (numbers.some((value) => value === null)) return years;
  return years
    .map((year, index) => ({ year, value: numbers[index] ?? 0, index }))
    .sort((a, b) => a.value - b.value || a.index - b.index)
    .map(({ year }) => year);
};

/**
 * A state's months as list items, oldest first: per year, each run of three or more consecutive months as a range
 * ("March to May"), shorter runs month by month, and a year whose every named month is in the state as "every
 * month of 2025". The year is written once, after the last item of its year, so items read "November 2024,
 * March, April and June 2025".
 */
const monthsOf = (id: string, years: readonly MonthGridYear[], monthNames: readonly string[]): string[] => {
  const items: string[] = [];
  for (const year of years) {
    const indexes = year.months.flatMap((month, index) =>
      month === id && index < monthNames.length ? [index] : [],
    );
    if (indexes.length === 0) continue;
    if (indexes.length === monthNames.length) {
      items.push(`every month of ${year.label}`);
      continue;
    }
    const words: string[] = [];
    for (let start = 0; start < indexes.length;) {
      let end = start;
      while (end + 1 < indexes.length && (indexes[end + 1] ?? 0) === (indexes[end] ?? 0) + 1) end++;
      const first = monthNames[indexes[start] ?? 0] ?? '';
      const last = monthNames[indexes[end] ?? 0] ?? '';
      if (end - start >= 2) words.push(`${first} to ${last}`);
      else for (let index = start; index <= end; index++) words.push(monthNames[indexes[index] ?? 0] ?? '');
      start = end + 1;
    }
    words[words.length - 1] = `${words[words.length - 1] ?? ''} ${year.label}`;
    items.push(...words);
  }
  return items;
};

/**
 * The English default (spec 8.3, as corrected by the review): a sentence per state that some month holds and whose
 * look is not `filled`, the empty looks first and then the partial ones, each in the order of `states`: the
 * state's label, a colon, and its months oldest first, ranges and whole years joined by commas with "and" before
 * the last ("Missing: November 2024, March and April 2025."). With nothing missing or partial, the filled states:
 * the first one some month holds says "every month" when it is the only one held, and otherwise each other filled
 * state names its months and the first says "all other months". With no month in any state, nothing. String
 * joining of the app's own words, so the server and the browser write the same sentence.
 */
export function monthGridSummary(
  states: readonly MonthGridState[],
  years: readonly MonthGridYear[],
  monthNames: readonly string[],
): string {
  // The first state of each id; a later one with the same id is never drawn either.
  const unique = states.filter(
    (state, index) => states.findIndex((other) => other.id === state.id) === index,
  );
  const ordered = oldestFirst(years);
  const held = (state: MonthGridState): string[] => monthsOf(state.id, ordered, monthNames);

  const sentences: string[] = [];
  for (const look of NAMED_LOOKS) {
    for (const state of unique) {
      if (state.look !== look) continue;
      const items = held(state);
      if (items.length > 0) sentences.push(`${state.label}: ${list(items)}.`);
    }
  }
  if (sentences.length > 0) return sentences.join(' ');

  const filled = unique.filter((state) => state.look === 'filled' && held(state).length > 0);
  const [first, ...others] = filled;
  if (first === undefined) return '';
  if (others.length === 0) return `${first.label}: every month.`;
  return [
    ...others.map((state) => `${state.label}: ${list(held(state))}.`),
    `${first.label}: all other months.`,
  ].join(' ');
}
