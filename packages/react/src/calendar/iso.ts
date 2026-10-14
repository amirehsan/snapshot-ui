import { parseDate, toCalendarDate, type AnyCalendarDate, type CalendarDate } from '@internationalized/date';

/** A range of days as ISO dates, 'YYYY-MM-DD', in the Gregorian calendar whatever the calendar shown. */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * An ISO date, 'YYYY-MM-DD', as a Gregorian date; null for no date, and 'invalid' for a string that does not
 * parse or names a day that does not exist. `parseDate` throws on both (its pattern and range checks), so a
 * hand-edited URL is caught here and never reaches React Aria.
 */
export function parseIso(value: string | null | undefined): CalendarDate | null | 'invalid' {
  if (value === null || value === undefined) return null;
  try {
    return parseDate(value);
  } catch {
    return 'invalid';
  }
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
