'use client';

import { useMemo, type ReactElement, type ReactNode, type Ref } from 'react';
import { DateSegment, GroupContext, useSlottedContext, type DateInputProps } from 'react-aria-components';

/** A picker's group props as React Aria provides them through the group context. */
type PickerGroup = Record<string, unknown> & {
  ref?: Ref<HTMLDivElement>;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
};

export interface DateFrameProps {
  /** The part's own class, after `input`: `date-range-control` or `date-picker-control`. */
  className: string;
  isDisabled: boolean;
  children: ReactNode;
}

/**
 * The drawn frame of a date picker or a date range picker: the picker's whole group (its role, its labelling,
 * Alt+Arrow Down and its focus within, useDatePicker.mjs and useDateRangePicker.mjs) on a plain div, which React
 * Aria positions the popover against. Not React Aria's Group, whose focus-within data-focus-visible (Group.mjs:54-56)
 * would ring the frame while the button has focus.
 */
export function DateFrame({ className, isDisabled, children }: DateFrameProps): ReactElement {
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
    <div {...group} ref={ref} className={`input ${className}`} data-disabled={isDisabled ? '' : undefined}>
      {children}
    </div>
  );
}

/** React Aria's segment, drawn with the library's class. */
export const drawSegment: DateInputProps['children'] = (segment) => (
  <DateSegment segment={segment} className="date-segment" />
);

/** Nothing for a segment before hydration: its text, its order and its name come from `Intl`. */
export const noSegment: DateInputProps['children'] = () => <></>;
