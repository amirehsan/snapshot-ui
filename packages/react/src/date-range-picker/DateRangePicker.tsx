'use client';

import type { CalendarDate } from '@internationalized/date';
import { ArrowRight, CalendarDays } from 'lucide-react';
import {
  useContext,
  useMemo,
  useState,
  type ContextType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button,
  DateFieldContext,
  DateInput,
  DateRangePicker as RACDateRangePicker,
  DateSegment,
  Dialog,
  GroupContext,
  RangeCalendar as RACRangeCalendar,
  composeRenderProps,
  useSlottedContext,
  type DateInputProps,
  type DateRangePickerProps as RACDateRangePickerProps,
  type DateRangePickerRenderProps,
  type ValidationResult,
} from 'react-aria-components';
import {
  DEFAULT_CALENDAR_LABELS,
  RangeCalendarFrame,
  invalidDate,
  useCalendarDates,
  type CalendarLabels,
  type DateRange,
  type DateRangePreset,
} from '../calendar/CalendarParts';
import { parseIsoRange, toIso } from '../calendar/iso';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { Popover, type Placement } from '../popover/Popover';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useHydrated } from '../utils/useHydrated';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface DateRangePickerLabels extends CalendarLabels {
  /** The calendar button's name; the field's label follows it. @default 'Choose dates' */
  open: string;
  /** The two date fields' names, read with each segment and the field's label. @default 'Start date' */
  start: string;
  /** @default 'End date' */
  end: string;
}

export interface DateRangePickerBaseProps extends Omit<
  RACDateRangePickerProps<CalendarDate>,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'minValue'
  | 'maxValue'
  | 'placeholderValue'
  | 'isDateUnavailable'
  | 'granularity'
  | 'hourCycle'
  | 'hideTimeZone'
  | 'shouldForceLeadingZeros'
  | 'allowsNonContiguousRanges'
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
   * Whether the value differs from the saved one. Shows the clay Changed chip in the label row and the light
   * signal orange edge, and has a screen reader read the chip with the group.
   */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The range as two ISO dates, 'YYYY-MM-DD', or null for none. Gregorian whatever the calendar shown. */
  value?: DateRange | null;
  /** The range the field starts with when `value` is not given. */
  defaultValue?: DateRange | null;
  /** Called with the range's two Gregorian ISO dates once both are complete, and with null while one is not. */
  onChange?: (value: DateRange | null) => void;
  /** The earliest day that can be chosen, as an ISO date. */
  minValue?: string;
  /** The latest day that can be chosen, as an ISO date. */
  maxValue?: string;
  /** Days that cannot be chosen, such as a closed day. Receives an ISO date. */
  isDateUnavailable?: (date: string) => boolean;
  /**
   * Today in the app's time zone, as an ISO date (ruling 3): the calendar's mark, and its opening month when
   * there is no value. Without it, the device's today.
   */
  today?: string;
  /** A row of the app's ranges above the calendar; a press sets the range and closes the calendar. */
  presets?: readonly DateRangePreset[];
  /** The range as the app writes it, shown on the server and until hydration: "1 to 30 Sep 2026". */
  valueLabel?: string;
  /** The names the field writes, in English unless replaced. */
  labels?: Partial<DateRangePickerLabels>;
  /** Where the calendar opens. @default 'bottom start' */
  placement?: Placement;
  /** Goes on the popover around the calendar. */
  popoverClassName?: string;
  /** A class name, or a function of the field's state, merged after the library's own classes. */
  className?:
    string | ((values: DateRangePickerRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
}

/** The props of a date range picker. A name is required: its `label`, an `aria-label` or an `aria-labelledby`. */
export type DateRangePickerProps = DateRangePickerBaseProps & AccessibleName<'label'>;

const DEFAULT_LABELS: DateRangePickerLabels = {
  ...DEFAULT_CALENDAR_LABELS,
  open: 'Choose dates',
  start: 'Start date',
  end: 'End date',
};

const NO_PRESETS: readonly DateRangePreset[] = [];

/** The date field context as the picker provides it: one set of props per slot. */
interface SlottedDateFields {
  slots: { start: Record<string, unknown>; end: Record<string, unknown> };
}

interface NamesProps {
  start: string;
  end: string;
  children: ReactNode;
}

/**
 * React Aria's two date field slots with the library's names: DateInput reads only its slot from this context
 * (DateField.mjs:253-258), and the name reaches each segment with the field's label (useDateSegment.mjs:321-325).
 */
function DateFieldNames({ start, end, children }: NamesProps): ReactElement {
  const context = useContext(DateFieldContext) as SlottedDateFields | null;
  const named = useMemo(
    () =>
      context === null
        ? null
        : {
            slots: {
              start: { ...context.slots.start, 'aria-label': start },
              end: { ...context.slots.end, 'aria-label': end },
            },
          },
    [context, start, end],
  );
  return (
    <DateFieldContext value={named as ContextType<typeof DateFieldContext>}>{children}</DateFieldContext>
  );
}

/** The picker's group props as React Aria provides them through the group context. */
type PickerGroup = Record<string, unknown> & {
  ref?: Ref<HTMLDivElement>;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
};

interface FrameProps {
  isDisabled: boolean;
  children: ReactNode;
}

/**
 * The drawn frame: the picker's whole group (its role, its labelling, Alt+Arrow Down and its focus within,
 * useDateRangePicker.mjs:126-139) on a plain div, which React Aria positions the popover against. Not React Aria's
 * Group, whose focus-within data-focus-visible (Group.mjs:54-56) would ring the frame while the button has focus.
 */
function DateRangeFrame({ isDisabled, children }: FrameProps): ReactElement {
  const context = useSlottedContext(GroupContext) as PickerGroup | null | undefined;
  // The group's DOM props less the ref and the states React Aria's Group would read, which a div does not take.
  const { ref, group } = useMemo(() => {
    const rest: PickerGroup = { ...context };
    delete rest.ref;
    delete rest.isInvalid;
    delete rest.isDisabled;
    delete rest.isReadOnly;
    return { ref: context?.ref, group: rest };
  }, [context]);
  return (
    <div
      {...group}
      ref={ref}
      className="input date-range-control"
      data-disabled={isDisabled ? '' : undefined}
    >
      {children}
    </div>
  );
}

/** React Aria's segment, drawn with the library's class. */
const drawSegment: DateInputProps['children'] = (segment) => (
  <DateSegment segment={segment} className="date-segment" />
);

/** Nothing for a segment before hydration: its text, its order and its name come from `Intl`. */
const noSegment: DateInputProps['children'] = () => <></>;

/**
 * A range of two dates, typed into React Aria's segments in the locale's order or chosen on the range calendar
 * in a popover, with the app's presets. ISO strings in and out, two hidden inputs that submit ISO dates under
 * `startName` and `endName`, day granularity only. Before hydration the field draws its frame, its calendar
 * button and the app's `valueLabel` where the segments go, since the segments' text, order and names come from
 * `Intl`; React Aria's segments arrive in the next render. Built on React Aria's DateRangePicker.
 */
export function DateRangePicker({
  label,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  value,
  defaultValue,
  onChange,
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
}: DateRangePickerProps): ReactElement {
  const hydrated = useHydrated();
  const isLabelled = present(label);
  const names = { ...DEFAULT_LABELS, ...labels };
  const dates = useCalendarDates({ minValue, maxValue, today, isDateUnavailable });
  const parsedValue = useMemo(() => parseIsoRange(value), [value]);
  const parsedDefault = useMemo(() => parseIsoRange(defaultValue), [defaultValue]);
  const written = (range: DateRange | null | undefined): string =>
    range ? `{ start: "${range.start}", end: "${range.end}" }` : '';
  let invalid = dates.invalid;
  if (parsedValue === 'invalid') invalid = `value ${written(value)}`;
  else if (parsedDefault === 'invalid') invalid = `defaultValue ${written(defaultValue)}`;
  useWarnOnce(invalid === null ? null : invalidDate('DateRangePicker', invalid));

  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled field has one to read.
    isChanged: isChanged && isLabelled,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });

  // A range typed with its end before its start, such as a start whose month is typed past the end's, or an
  // end whose year is part typed. React Aria holds and flags it, and the app is told null, since it is no range;
  // a controlled field keeps it in place of that null, which would otherwise clear what is being typed. The hold
  // answers that null alone: it goes once the app sets any other value, and once focus leaves the picker, so an
  // app that clears the field from outside, setting the null it already holds, clears it.
  const [held, setHeld] = useState<{
    range: { start: CalendarDate; end: CalendarDate };
    key: string;
  } | null>(null);
  const chosen = parsedValue === 'invalid' ? null : parsedValue;
  const valueKey = chosen ? `${toIso(chosen.start)}/${toIso(chosen.end)}` : '';
  if (held !== null && held.key !== valueKey) setHeld(null);
  const unordered = held?.key === valueKey ? held.range : null;
  const initial = parsedDefault === 'invalid' ? null : parsedDefault;
  const segment = hydrated ? drawSegment : noSegment;

  return (
    <RACDateRangePicker
      {...props}
      // Controlled only when the app passes a value; an invalid one reads as none.
      value={value === undefined ? undefined : (chosen ?? unordered)}
      defaultValue={value === undefined ? initial : undefined}
      onChange={(range) => {
        // React Aria's range is null, or holds a null end, once every segment of a date is cleared.
        const start = range?.start;
        const end = range?.end;
        const isComplete = start != null && end != null;
        const isOrdered = isComplete && end.compare(start) >= 0;
        setHeld(isComplete && !isOrdered ? { range: { start, end }, key: '' } : null);
        onChange?.(isOrdered ? { start: toIso(start), end: toIso(end) } : null);
      }}
      onFocusChange={(isFocused) => {
        props.onFocusChange?.(isFocused);
        if (!isFocused) setHeld(null);
      }}
      minValue={dates.minValue}
      maxValue={dates.maxValue}
      isDateUnavailable={dates.isDateUnavailable}
      // React Aria opens the calendar on this only while there is no range (useDateRangePicker.mjs:211), so the
      // calendar opens on the value's month, else the app's today (plan, spec correction 13).
      placeholderValue={dates.today ?? undefined}
      granularity="day"
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      data-unlabelled={isLabelled ? undefined : ''}
      className={composeRenderProps(className, (userClassName) =>
        cx('field', 'date-range-picker', userClassName),
      )}
    >
      {isLabelled ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <DateRangeFrame isDisabled={props.isDisabled === true}>
        {/* Clipped across, apart from the button, so its hit area reaches past the frame. */}
        <div className="date-range-dates">
          {hydrated ? null : <span className="date-range-face">{valueLabel}</span>}
          <DateFieldNames start={names.start} end={names.end}>
            <DateInput slot="start" className="date-range-input">
              {segment}
            </DateInput>
            {hydrated ? (
              <span className="date-range-arrow" aria-hidden="true">
                <ArrowRight />
              </span>
            ) : null}
            <DateInput slot="end" className="date-range-input">
              {segment}
            </DateInput>
          </DateFieldNames>
        </div>
        <Button className="input-button date-range-button" aria-label={names.open}>
          <CalendarDays aria-hidden="true" />
        </Button>
      </DateRangeFrame>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      <Popover className={cx('date-range-popover', popoverClassName)} isPadded placement={placement}>
        <Dialog>
          {/* Bare: the picker's context gives it the value, onChange, bounds and focus (spec correction 17). */}
          <RACRangeCalendar className="calendar range-calendar" commitBehavior="reset">
            <RangeCalendarFrame presets={presets} labels={names} today={dates.today} bounds={dates} />
          </RACRangeCalendar>
        </Dialog>
      </Popover>
    </RACDateRangePicker>
  );
}
