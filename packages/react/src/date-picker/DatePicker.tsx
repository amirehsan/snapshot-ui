'use client';

import type { CalendarDate } from '@internationalized/date';
import { CalendarDays as CalendarIcon } from 'lucide-react';
import { useMemo, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  Button,
  Calendar as RACCalendar,
  DateInput,
  DatePicker as RACDatePicker,
  Dialog,
  composeRenderProps,
  type DatePickerProps as RACDatePickerProps,
  type DatePickerRenderProps,
  type ValidationResult,
} from 'react-aria-components';
import {
  CalendarDatePresets,
  CalendarDays,
  CalendarHeader,
  DEFAULT_CALENDAR_LABELS,
  invalidDate,
  useCalendarDates,
  type CalendarLabels,
  type DatePreset,
} from '../calendar/CalendarParts';
import { DateFrame, drawSegment, noSegment } from '../calendar/DateFrame';
import { parseIso, toIso } from '../calendar/iso';
import { Description } from '../field/Description';
import { FieldChangedMark } from '../field/FieldChangedMark';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { Popover, type Placement } from '../popover/Popover';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useHydrated } from '../utils/useHydrated';
import { useWarnOnce } from '../utils/useWarnOnce';

export type { DatePreset };

export interface DatePickerLabels extends CalendarLabels {
  /** The calendar button's name; the field's label follows it. @default 'Choose date' */
  open: string;
}

export interface DatePickerBaseProps extends Omit<
  RACDatePickerProps<CalendarDate>,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'validate'
  | 'minValue'
  | 'maxValue'
  | 'placeholderValue'
  | 'isDateUnavailable'
  | 'granularity'
  | 'hourCycle'
  | 'hideTimeZone'
  | 'shouldForceLeadingZeros'
> {
  /** The field's name, shown above it. Required unless the field has an `aria-label` or an `aria-labelledby`. */
  label?: ReactNode;
  /** A hint under the field. It becomes the group's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the field is invalid. A function receives the validation result. Without
   * it the field shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the value differs from the saved one: the light signal orange edge, with the clay Changed chip beside
   * a label, or the clay changed dot in the frame without one. A screen reader reads "Changed" with
   * the group either way.
   */
  isChanged?: boolean;
  /** The words of the Changed chip, or of the changed dot, which holds them unseen. @default 'Changed' */
  changedLabel?: string;
  /** The day as an ISO date, 'YYYY-MM-DD', or null for none. Gregorian whatever the calendar shown. */
  value?: string | null;
  /** The day the field starts with when `value` is not given. */
  defaultValue?: string | null;
  /** Called with the Gregorian ISO date once complete and valid, and with null when cleared. */
  onChange?: (value: string | null) => void;
  /**
   * Checks the day as `onChange` sends it, alongside React Aria's own checks, so use `isRequired` for an empty
   * field. Returns an error message, or true or null when valid.
   */
  validate?: (value: string | null) => ReturnType<NonNullable<RACDatePickerProps<CalendarDate>['validate']>>;
  /** The earliest day that can be chosen, as an ISO date. */
  minValue?: string;
  /** The latest day that can be chosen, as an ISO date. */
  maxValue?: string;
  /** Days that cannot be chosen, such as a closed day. Receives an ISO date. */
  isDateUnavailable?: (date: string) => boolean;
  /**
   * Today in the app's time zone, as an ISO date. Marks today and sets the opening month when there is no value.
   * Defaults to the device's today.
   */
  today?: string;
  /** Days the app names, in a row above the calendar; a press sets the day and closes the calendar. */
  presets?: readonly DatePreset[];
  /** The day as the app writes it, shown on the server and until hydration: "14 Oct 2026". */
  valueLabel?: string;
  /** The names the field writes, in English unless replaced. */
  labels?: Partial<DatePickerLabels>;
  /** Where the calendar opens. @default 'bottom start' */
  placement?: Placement;
  /** Goes on the popover around the calendar. */
  popoverClassName?: string;
  /** A class name, or a function of the field's state, merged after the library's own classes. */
  className?: string | ((values: DatePickerRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
}

/** The props of a date picker. A name is required: its `label`, an `aria-label` or an `aria-labelledby`. */
export type DatePickerProps = DatePickerBaseProps & AccessibleName<'label'>;

const DEFAULT_LABELS: DatePickerLabels = { ...DEFAULT_CALENDAR_LABELS, open: 'Choose date' };

const NO_PRESETS: readonly DatePreset[] = [];

/**
 * One date, typed into React Aria's segments in the locale's order or chosen on the calendar in a popover, with
 * the app's single-day presets. ISO strings in and out, a hidden input that submits the ISO date under `name`, day
 * granularity only. Before hydration the field draws its frame, its calendar button and the app's `valueLabel`
 * where the segments go, since the segments' text, order and names come from `Intl`; React Aria's segments arrive
 * in the next render. Drawn on DateRangePicker's frame. Built on React Aria's DatePicker.
 */
export function DatePicker({
  label,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  value,
  defaultValue,
  onChange,
  validate,
  minValue,
  maxValue,
  isDateUnavailable,
  today,
  presets = NO_PRESETS,
  valueLabel,
  labels,
  placement = 'bottom start',
  popoverClassName,
  className,
  ...props
}: DatePickerProps): ReactElement {
  const hydrated = useHydrated();
  const isLabelled = present(label);
  const names = { ...DEFAULT_LABELS, ...labels };
  const dates = useCalendarDates({ minValue, maxValue, today, isDateUnavailable });
  const parsedValue = useMemo(() => parseIso(value), [value]);
  const parsedDefault = useMemo(() => parseIso(defaultValue), [defaultValue]);
  let invalid = dates.invalid;
  if (parsedValue === 'invalid') invalid = `value "${String(value)}"`;
  else if (parsedDefault === 'invalid') invalid = `defaultValue "${String(defaultValue)}"`;
  useWarnOnce(invalid === null ? null : invalidDate('DatePicker', invalid));

  const { chipId, markId, describedBy } = useChangedDescription({
    isChanged,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
    isLabelled,
  });
  const chosen = parsedValue === 'invalid' ? null : parsedValue;
  const initial = parsedDefault === 'invalid' ? null : parsedDefault;

  return (
    <RACDatePicker
      {...props}
      // Controlled only when the app passes a value; an invalid one reads as none.
      value={value === undefined ? undefined : chosen}
      defaultValue={value === undefined ? initial : undefined}
      onChange={(date) => {
        // React Aria commits a date once every segment is typed, and null once every segment is cleared.
        onChange?.(date === null ? null : toIso(date));
      }}
      // React Aria checks its own CalendarDate, or null for an empty field though its type says otherwise; the
      // app's check gets the ISO date.
      validate={
        validate === undefined
          ? undefined
          : (date) => {
              const day = date as CalendarDate | null;
              return validate(day === null ? null : toIso(day));
            }
      }
      minValue={dates.minValue}
      maxValue={dates.maxValue}
      isDateUnavailable={dates.isDateUnavailable}
      // React Aria opens the calendar on this only while there is no value (useDatePicker.mjs, calendarProps), so
      // the calendar opens on the value's month, else the app's today.
      placeholderValue={dates.today ?? undefined}
      granularity="day"
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      data-unlabelled={isLabelled ? undefined : ''}
      className={composeRenderProps(className, (userClassName) => cx('field', 'date-picker', userClassName))}
    >
      {isLabelled ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <DateFrame className="date-picker-control" isDisabled={props.isDisabled === true}>
        {hydrated ? null : <span className="date-picker-face">{valueLabel}</span>}
        <DateInput className="date-picker-input">{hydrated ? drawSegment : noSegment}</DateInput>
        <Button className="input-button date-picker-button" aria-label={names.open}>
          <CalendarIcon aria-hidden="true" />
        </Button>
        {isChanged && !isLabelled ? <FieldChangedMark id={markId} label={changedLabel} /> : null}
      </DateFrame>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      <Popover className={cx('date-picker-popover', popoverClassName)} isPadded placement={placement}>
        <Dialog>
          {/* Bare: the picker's context gives it the value, onChange, the bounds and its focus. */}
          <RACCalendar className="calendar">
            <CalendarHeader labels={names} />
            <CalendarDatePresets presets={presets} label={names.presets} bounds={dates} />
            <CalendarDays today={dates.today} />
          </RACCalendar>
        </Dialog>
      </Popover>
    </RACDatePicker>
  );
}
