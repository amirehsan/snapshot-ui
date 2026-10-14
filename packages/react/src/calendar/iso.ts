import { parseDate, toCalendarDate, type AnyCalendarDate, type CalendarDate } from '@internationalized/date';

/** A range of days as ISO dates, 'YYYY-MM-DD', in the Gregorian calendar whatever the calendar shown. */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * An ISO date, 'YYYY-MM-DD', as a Gregorian date; null for no date, and 'invalid' for a string that does not
 * parse, names a day that does not exist, or is not written the one way the library writes it. `parseDate`
 * throws on the first two (its pattern and range checks), so a hand-edited URL is caught here and never reaches
 * React Aria; it also takes '+002026-09-14' and year zero, which write back differently, so a date is kept only
 * when it writes back as the very string given.
 */
export function parseIso(value: string | null | undefined): CalendarDate | null | 'invalid' {
  if (value === null || value === undefined) return null;
  let parsed: CalendarDate;
  try {
    parsed = parseDate(value);
  } catch {
    return 'invalid';
  }
  return toIso(parsed) === value ? parsed : 'invalid';
}

/** A range of ISO dates; 'invalid' when either end does not parse or the end is before the start. */
export function parseIsoRange(
  range: DateRange | null | undefined,
): { start: CalendarDate; end: CalendarDate } | null | 'invalid' {
  if (range === null || range === undefined) return null;
  const start = parseIso(range.start);
  const end = parseIso(range.end);
  if (start === null || start === 'invalid' || end === null || end === 'invalid') return 'invalid';
  if (end.compare(start) < 0) return 'invalid';
  return { start, end };
}

/**
 * A date as its Gregorian ISO date, whatever calendar it is in: a CalendarDate writes itself in the Gregorian
 * calendar, so a Persian date React Aria emits under fa-IR writes '2026-09-14'.
 */
export const toIso = (date: AnyCalendarDate): string => toCalendarDate(date).toString();
