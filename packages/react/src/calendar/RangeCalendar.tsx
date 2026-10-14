'use client';

import { useMemo, type ReactElement } from 'react';
import { RangeCalendar as RACRangeCalendar } from 'react-aria-components';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { useHydrated } from '../utils/useHydrated';
import { useWarnOnce } from '../utils/useWarnOnce';
import {
  DEFAULT_CALENDAR_LABELS,
  RangeCalendarFrame,
  invalidDate,
  useCalendarDates,
  type CalendarShared,
  type DateRange,
  type DateRangePreset,
} from './CalendarParts';
import { parseIsoRange, toIso } from './iso';

export type { DateRange, DateRangePreset };

/** The props of a range calendar. It shows no label of its own, so an `aria-label` or `aria-labelledby` is required. */
export type RangeCalendarProps = CalendarShared &
  AriaName & {
    /** The chosen range as two ISO dates, or null for none. Gregorian whatever the calendar shown. */
    value?: DateRange | null;
    /** The range chosen at first when `value` is not given. */
    defaultValue?: DateRange | null;
    /** Called once a range is complete, with its two Gregorian ISO dates. */
    onChange?: (value: DateRange) => void;
    /** A row of preset ranges above the grid. */
    presets?: readonly DateRangePreset[];
  };

const NO_PRESETS: readonly DateRangePreset[] = [];

/**
 * One month of days that chooses a range in two presses, with a row of the app's presets. A half-chosen range is
 * dropped when focus or a press leaves the calendar, so no range the person did not finish is written. ISO
 * strings in and out, the app's `today`, and an empty frame of its final size until the page hydrates, as
 * Calendar. Built on React Aria's RangeCalendar.
 */
export function RangeCalendar({
  value,
  defaultValue,
  onChange,
  presets = NO_PRESETS,
  minValue,
  maxValue,
  isDateUnavailable,
  today,
  labels,
  className,
  ref,
  ...props
}: RangeCalendarProps): ReactElement {
  const hydrated = useHydrated();
  const names = { ...DEFAULT_CALENDAR_LABELS, ...labels };
  const dates = useCalendarDates({ minValue, maxValue, today, isDateUnavailable });
  const parsedValue = useMemo(() => parseIsoRange(value), [value]);
  const parsedDefault = useMemo(() => parseIsoRange(defaultValue), [defaultValue]);
  const written = (range: DateRange | null | undefined): string =>
    range ? `{ start: "${range.start}", end: "${range.end}" }` : '';
  let invalid = dates.invalid;
  if (parsedValue === 'invalid') invalid = `value ${written(value)}`;
  else if (parsedDefault === 'invalid') invalid = `defaultValue ${written(defaultValue)}`;
  useWarnOnce(invalid === null ? null : invalidDate('RangeCalendar', invalid));

  const classes = cx('calendar', 'range-calendar', className);
  if (!hydrated) return <div ref={ref} className={classes} data-face="" />;

  const chosen = parsedValue === 'invalid' ? null : parsedValue;
  const initial = parsedDefault === 'invalid' ? null : parsedDefault;
  const hasValue = (value === undefined ? initial : chosen) !== null;
  return (
    <RACRangeCalendar
      {...props}
      ref={ref}
      className={classes}
      // Controlled only when the app passes a value; an invalid one reads as none.
      value={value === undefined ? undefined : chosen}
      defaultValue={value === undefined ? initial : undefined}
      onChange={(range) => {
        onChange?.({ start: toIso(range.start), end: toIso(range.end) });
      }}
      minValue={dates.minValue}
      maxValue={dates.maxValue}
      isDateUnavailable={dates.isDateUnavailable}
      // React Aria prefers this to the value for the opening month, so it is today's only without a value
      // (plan, spec correction 13).
      defaultFocusedValue={hasValue ? undefined : (dates.today ?? undefined)}
      // A blur out of the calendar, or a press released outside it or on anything in it that is not a button,
      // drops a half-chosen range (useRangeCalendar.mjs:41-58, plan, spec correction 16).
      commitBehavior="reset"
    >
      <RangeCalendarFrame presets={presets} labels={names} today={dates.today} />
    </RACRangeCalendar>
  );
}
