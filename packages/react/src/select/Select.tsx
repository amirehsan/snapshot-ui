'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  Button,
  Select as RACSelect,
  SelectValue,
  composeRenderProps,
  type SelectProps as RACSelectProps,
  type SelectRenderProps,
  type ValidationResult,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { PickerValueContext } from '../picker/PickerOption';
import { SelectPopover, isCoarsePointer } from '../picker/SelectList';
import type { Placement } from '../popover/Popover';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface SelectLabels {
  /**
   * The filter field's name and placeholder.
   * @default 'Filter'
   */
  filter: string;
  /**
   * The line shown when the filter matches nothing.
   * @default 'No matches'
   */
  empty: string;
}

export interface SelectBaseProps<T extends object = object> extends Omit<
  RACSelectProps<T>,
  'children' | 'className' | 'selectionMode' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
> {
  /** The field's name, shown above it. Required unless the field has an `aria-label` or an `aria-labelledby`. */
  label?: ReactNode;
  /** A hint under the field. It becomes the trigger's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the field is invalid. A function receives the validation result. Without
   * it the field shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Shown in slate while nothing is chosen, since it is the trigger's visible text; taupe while disabled.
   * @default 'Choose an option'
   */
  placeholder?: string;
  /**
   * Whether the value differs from the saved one. Shows the clay Changed chip in the label row and the light
   * signal orange edge, and has a screen reader read the chip with the trigger. An invalid field shows its
   * error instead.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /** The options as data, rendered by a function child. Omit it for static `PickerOption` children. */
  items?: Iterable<T>;
  /** `PickerOption`s and `PickerSection`s, or a function that renders one option of `items`. */
  children: ReactNode | ((item: T) => ReactElement);
  /**
   * A filter field at the top of the list.
   * @default true at 9 options or more, false under
   */
  isFilterable?: boolean;
  /** The library's own words: the filter's name and the line shown when it keeps nothing. */
  labels?: Partial<SelectLabels>;
  /**
   * Where the list opens.
   * @default 'bottom start'
   */
  placement?: Placement;
  /** Goes on the popover around the list. */
  popoverClassName?: string;
  /** A class name, or a function of the field's state, merged after the library's own classes. */
  className?: string | ((values: SelectRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of a select. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type SelectProps<T extends object = object> = SelectBaseProps<T> & AccessibleName<'label'>;

const DEFAULT_LABELS: SelectLabels = { filter: 'Filter', empty: 'No matches' };

/**
 * A field that chooses one value from a list: the text input's pill as a button showing the chosen option's
 * icon and label, opening the Menu's rows (`PickerOption`, `PickerSection`) in a popover under it. From nine
 * options the list has a filter field at its top, where every word typed must appear in an option, case and
 * accents aside; `isFilterable` turns it on or off. On a touch screen the filter waits for a tap, so the
 * keyboard does not cover a short list. It takes `value`, `defaultValue` and `onChange`, and submits the chosen
 * key under `name` through a hidden native select. Built on React Aria's Select.
 */
export function Select<T extends object = object>({
  label,
  description,
  errorMessage,
  placeholder = 'Choose an option',
  isChanged = false,
  changedLabel,
  items,
  children,
  isFilterable,
  labels,
  placement = 'bottom start',
  popoverClassName,
  className,
  onOpenChange,
  ...props
}: SelectProps<T>): ReactElement {
  const isLabelled = present(label);
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled field has one to read.
    isChanged: isChanged && isLabelled,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  // Whether the filter takes focus as the list opens: not on a coarse pointer, where a phone's keyboard would
  // cover the list. It is read when the user opens the list, an event, and never while rendering, and goes back
  // to the default as the list closes, so a list opened by `defaultOpen` or by the app's `isOpen` focuses its
  // filter. A test environment may have no matchMedia, which reads as a fine pointer.
  const [focusFilter, setFocusFilter] = useState(true);
  const openChange = (isOpen: boolean): void => {
    setFocusFilter(!(isOpen && isCoarsePointer()));
    onOpenChange?.(isOpen);
  };
  return (
    <RACSelect<T>
      {...props}
      placeholder={placeholder}
      aria-describedby={describedBy}
      onOpenChange={openChange}
      data-changed={isChanged ? '' : undefined}
      className={composeRenderProps(className, (userClassName) => cx('field', 'select', userClassName))}
    >
      {isLabelled ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <Button className="input select-trigger">
        <PickerValueContext value>
          <SelectValue className="select-value" />
        </PickerValueContext>
        <span className="select-chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </Button>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      <SelectPopover<T>
        className={cx('menu-popover', 'select-popover', popoverClassName)}
        placement={placement}
        items={items}
        isFilterable={isFilterable}
        focusFilter={focusFilter}
        labels={{ ...DEFAULT_LABELS, ...labels }}
      >
        {children}
      </SelectPopover>
    </RACSelect>
  );
}
