'use client';

import {
  isSameDay,
  toCalendar,
  type AnyCalendarDate,
  type CalendarDate,
  type CalendarIdentifier,
  type Calendar as ICalendar,
} from '@internationalized/date';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContext, useMemo, type ReactElement, type Ref } from 'react';
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  RangeCalendarStateContext,
  ToggleButton,
  type Key,
} from 'react-aria-components';
import { IconButton } from '../icon-button';
import { useWarnOnce } from '../utils/useWarnOnce';
import { parseIso, parseIsoRange, toIso, type DateRange } from './iso';

export type { DateRange };

export interface DateRangePreset {
  id: Key;
  /** The preset's words, the app's: "This month". */
  label: string;
  /** Its range, computed by the app from its own today. */
  range: DateRange;
}

export interface CalendarLabels {
  /** @default 'Previous month' */
  previous: string;
  /** @default 'Next month' */
  next: string;
  /** The name of the row of presets. @default 'Presets' */
  presets: string;
}

/** The props a calendar and a range calendar share. */
export interface CalendarShared {
  /** The earliest and latest day that can be chosen, as ISO dates. */
  minValue?: string;
  /** The latest day that can be chosen, as an ISO date. */
  maxValue?: string;
  /** Days that cannot be chosen, such as a closed day. Receives an ISO date. */
  isDateUnavailable?: (date: string) => boolean;
  /** Today in the app's time zone, as an ISO date (ruling 3). Without it, the device's today after hydration. */
  today?: string;
  /** The first day of the week. @default from the locale */
  firstDayOfWeek?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  /** React Aria's, to ship only the calendar systems the app uses. */
  createCalendar?: (identifier: CalendarIdentifier) => ICalendar;
  /** Whether no day can be chosen and nothing takes focus. */
  isDisabled?: boolean;
  /** Whether the days can be focused but not chosen. */
  isReadOnly?: boolean;
  /** The names the calendar writes, in English unless replaced. */
  labels?: Partial<CalendarLabels>;
  /** A class name, merged after the library's own classes. */
  className?: string;
  /** A ref to the calendar's root element. */
  ref?: Ref<HTMLDivElement>;
}

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
  previous: 'Previous month',
  next: 'Next month',
  presets: 'Presets',
};

/** The dates every calendar reads from its props, parsed, and the first prop that did not parse. */
export interface CalendarDates {
  minValue: CalendarDate | undefined;
  maxValue: CalendarDate | undefined;
  today: CalendarDate | null;
  isDateUnavailable: ((date: AnyCalendarDate) => boolean) | undefined;
  /** The name and text of the first bound or today that is not an ISO date, else null. */
  invalid: string | null;
}

/**
 * Reads the bounds and today as Gregorian dates. One that does not parse reads as none, so a hand-edited URL
 * never throws, and is named in `invalid` for the part's one warning. `isDateUnavailable` receives ISO dates.
 */
export function useCalendarDates({
  minValue,
  maxValue,
  today,
  isDateUnavailable,
}: Pick<CalendarShared, 'minValue' | 'maxValue' | 'today' | 'isDateUnavailable'>): CalendarDates {
  return useMemo(() => {
    const read = { minValue: parseIso(minValue), maxValue: parseIso(maxValue), today: parseIso(today) };
    const given = { minValue, maxValue, today };
    const invalid = (Object.keys(read) as (keyof typeof read)[]).find((key) => read[key] === 'invalid');
    const valid = (date: CalendarDate | null | 'invalid'): CalendarDate | null =>
      date === 'invalid' ? null : date;
    return {
      minValue: valid(read.minValue) ?? undefined,
      maxValue: valid(read.maxValue) ?? undefined,
      today: valid(read.today),
      isDateUnavailable: isDateUnavailable && ((date: AnyCalendarDate) => isDateUnavailable(toIso(date))),
      invalid: invalid === undefined ? null : `${invalid} "${String(given[invalid])}"`,
    };
  }, [minValue, maxValue, today, isDateUnavailable]);
}

/** The one warning for a value, a bound or today that is not an ISO date. */
export const invalidDate = (part: string, invalid: string): string =>
  `${part} reads ${invalid} as no date: it is not an ISO date (YYYY-MM-DD), or not a range whose end is on or after its start.`;

/** The month heading between the two month buttons, React Aria's previous and next slots. */
export function CalendarHeader({ labels }: { labels: CalendarLabels }): ReactElement {
  return (
    // A div, not a header: a header outside a section is a banner landmark, which axe refuses inside the calendar.
    <div className="calendar-header">
      <IconButton slot="previous" aria-label={labels.previous}>
        <ChevronLeft />
      </IconButton>
      {/* React Aria's month title through its heading context, hidden: the root's and the grid's names say it. */}
      <Heading className="calendar-heading" />
      <IconButton slot="next" aria-label={labels.next}>
        <ChevronRight />
      </IconButton>
    </div>
  );
}

/**
 * The grid. `today` is the app's, parsed; without it React Aria's own isToday marks the day. React Aria writes
 * its own data-today on the cell from the device's zone (Calendar.mjs:294,340), which the CSS never keys on, so
 * the mark is the library's, on the day's number (plan, spec correction 14).
 */
export function CalendarDays({ today }: { today: CalendarDate | null }): ReactElement {
  return (
    <CalendarGrid className="calendar-grid">
      <CalendarGridHeader>
        {(day) => <CalendarHeaderCell className="calendar-weekday">{day}</CalendarHeaderCell>}
      </CalendarGridHeader>
      <CalendarGridBody>
        {(date) => (
          <CalendarCell date={date} className="calendar-day">
            {({ formattedDate, isToday }) => (
              <span
                className="calendar-day-number"
                data-today={(today === null ? isToday : isSameDay(date, today)) ? '' : undefined}
              >
                {formattedDate}
              </span>
            )}
          </CalendarCell>
        )}
      </CalendarGridBody>
    </CalendarGrid>
  );
}

interface PresetsProps {
  presets: readonly DateRangePreset[];
  /** The group's name. */
  label: string;
}

/**
 * The presets of whichever range calendar holds them: the app's RangeCalendar, or the picker's. Each is a
 * ToggleButton, since a plain Button inside a calendar must name one of its slots (spec correction 7), and a
 * press sets the range through React Aria's state, which inside a picker reaches the picker's range and closes
 * its popover (spec correction 17).
 */
export function CalendarPresets({ presets, label }: PresetsProps): ReactElement | null {
  const state = useContext(RangeCalendarStateContext);
  const parsed = useMemo(
    () =>
      presets.map((preset) => {
        const range = parseIsoRange(preset.range);
        return { preset, range: range === 'invalid' ? null : range };
      }),
    [presets],
  );
  const broken = parsed.find((each) => each.range === null);
  useWarnOnce(
    broken === undefined
      ? null
      : `RangeCalendar leaves out the preset "${broken.preset.label}": its range, ${broken.preset.range.start} to ${broken.preset.range.end}, is not two ISO dates (YYYY-MM-DD) in order.`,
  );
  const usable = parsed.filter((each) => each.range !== null);
  if (state === null || usable.length === 0) return null;
  const chosen = state.value === null ? null : `${toIso(state.value.start)}/${toIso(state.value.end)}`;
  const isLocked = state.isDisabled || state.isReadOnly;
  return (
    <div className="calendar-presets" role="group" aria-label={label}>
      {usable.map(({ preset, range }) => (
        <ToggleButton
          key={preset.id}
          className="calendar-preset"
          isSelected={chosen === `${preset.range.start}/${preset.range.end}`}
          isDisabled={isLocked}
          onChange={() => {
            if (range === null) return;
            // A preset pressed over a half-chosen range replaces it.
            state.setAnchorDate(null);
            state.setValue(range);
            // The view moves to the start, in the calendar the locale shows.
            state.setFocusedDate(toCalendar(range.start, state.focusedDate.calendar));
          }}
        >
          {preset.label}
        </ToggleButton>
      ))}
    </div>
  );
}

interface FrameProps {
  presets: readonly DateRangePreset[];
  labels: CalendarLabels;
  today: CalendarDate | null;
}

/**
 * The inside of a range calendar: the header, the presets and the grid. It takes its state from whichever
 * React Aria RangeCalendar holds it, so DateRangePicker can put it in one that passes no value of its own and
 * the picker's context supplies it (plan, spec correction 17).
 */
export function RangeCalendarFrame({ presets, labels, today }: FrameProps): ReactElement {
  return (
    <>
      <CalendarHeader labels={labels} />
      <CalendarPresets presets={presets} label={labels.presets} />
      <CalendarDays today={today} />
    </>
  );
}
