'use client';

import { useMemo, type ReactElement } from 'react';
import { Calendar as RACCalendar } from 'react-aria-components';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { useHydrated } from '../utils/useHydrated';
import { useWarnOnce } from '../utils/useWarnOnce';
import {
  CalendarDays,
  CalendarHeader,
  DEFAULT_CALENDAR_LABELS,
  invalidDate,
  useCalendarDates,
  type CalendarLabels,
  type CalendarShared,
} from './CalendarParts';
import { parseIso, toIso } from './iso';

export type { CalendarLabels };

/** The props of a calendar. A calendar shows no label of its own, so an `aria-label` or `aria-labelledby` is required. */
export type CalendarProps = CalendarShared &
  AriaName & {
    /** The chosen day as an ISO date, 'YYYY-MM-DD', or null for none. Gregorian whatever the calendar shown. */
    value?: string | null;
    /** The day chosen at first when `value` is not given. */
    defaultValue?: string | null;
    /** Called with the chosen day as a Gregorian ISO date. */
    onChange?: (value: string) => void;
  };

/**
 * One month of days that chooses a day. ISO strings in and out whatever calendar the locale shows, the app's
 * `today` for the mark and the opening month, and the device's today after hydration without it. On the server
 * and through hydration it draws an empty frame of its final size, and React Aria's calendar mounts on the next
 * render: its month, weekdays, days and today all come from `Intl` and the device's zone. Built on React Aria's
 * Calendar.
 */
export function Calendar({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  today,
  labels,
  className,
  ref,
  ...props
}: CalendarProps): ReactElement {
  const hydrated = useHydrated();
  const names = { ...DEFAULT_CALENDAR_LABELS, ...labels };
  const dates = useCalendarDates({ minValue, maxValue, today, isDateUnavailable });
  const parsedValue = useMemo(() => parseIso(value), [value]);
  const parsedDefault = useMemo(() => parseIso(defaultValue), [defaultValue]);
  let invalid = dates.invalid;
  if (parsedValue === 'invalid') invalid = `value "${String(value)}"`;
  else if (parsedDefault === 'invalid') invalid = `defaultValue "${String(defaultValue)}"`;
  useWarnOnce(invalid === null ? null : invalidDate('Calendar', invalid));

  if (!hydrated) return <div ref={ref} className={cx('calendar', className)} data-face="" />;

  const chosen = parsedValue === 'invalid' ? null : parsedValue;
  const initial = parsedDefault === 'invalid' ? null : parsedDefault;
  const hasValue = (value === undefined ? initial : chosen) !== null;
  return (
    <RACCalendar
      {...props}
      ref={ref}
      className={cx('calendar', className)}
      // Controlled only when the app passes a value; an invalid one reads as none.
      value={value === undefined ? undefined : chosen}
      defaultValue={value === undefined ? initial : undefined}
      onChange={(date) => {
        onChange?.(toIso(date));
      }}
      minValue={dates.minValue}
      maxValue={dates.maxValue}
      isDateUnavailable={dates.isDateUnavailable}
      // React Aria prefers this to the value for the opening month, so it is today's only without a value
      // (plan, spec correction 13).
      defaultFocusedValue={hasValue ? undefined : (dates.today ?? undefined)}
    >
      <CalendarHeader labels={names} />
      <CalendarDays today={dates.today} />
    </RACCalendar>
  );
}
