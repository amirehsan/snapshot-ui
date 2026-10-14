'use client';

import { ChevronDown } from 'lucide-react';
import { useContext, useMemo, useState, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  Autocomplete,
  Button,
  ListBox,
  Select as RACSelect,
  SelectStateContext,
  SelectValue,
  composeRenderProps,
  useFilter,
  type AutocompleteProps,
  type SelectProps as RACSelectProps,
  type SelectRenderProps,
  type ValidationResult,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { PickerValueContext } from '../picker/PickerOption';
import { Popover, type Placement } from '../popover/Popover';
import { SearchField } from '../search-field/SearchField';
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

/** From this many options the list shows its filter: more than 8 (spec ruling 7). */
const FILTER_FROM = 9;

/** The words of a query, split at whitespace: CommandPalette's rule. */
const wordsOf = (query: string): string[] => query.split(/\s+/).filter(Boolean);

interface ListProps<T extends object> {
  items: Iterable<T> | undefined;
  children: ReactNode | ((item: T) => ReactElement);
  isFilterable: boolean | undefined;
  focusFilter: boolean;
  labels: SelectLabels;
}

/**
 * The list in the popover. It mounts each time the list opens, since React Aria's popover renders nothing while
 * closed, so the filter's text starts empty on every open and its collator is made only in a browser that opened
 * the list. It counts the options from React Aria's collection, which counts items and never headings, inside
 * sections too.
 */
function SelectList<T extends object>({
  items,
  children,
  isFilterable,
  focusFilter,
  labels,
}: ListProps<T>): ReactElement {
  const state = useContext(SelectStateContext);
  const { contains } = useFilter({ sensitivity: 'base' });
  const [text, setText] = useState('');
  // An option stays when every word of the text is in its text value, case and accents aside. With no text
  // there is no filter, so every option shows; React Aria hides a section none of whose options stay.
  const filter = useMemo<AutocompleteProps<T>['filter']>(
    () =>
      text.trim() === ''
        ? undefined
        : (textValue, input) => wordsOf(input).every((word) => contains(textValue, word)),
    [text, contains],
  );
  const isFiltered = isFilterable ?? (state?.collection.size ?? 0) >= FILTER_FROM;
  const list = (
    <ListBox<T>
      className="menu select-list"
      items={items}
      renderEmptyState={() => <div className="picker-empty">{labels.empty}</div>}
    >
      {children}
    </ListBox>
  );
  if (!isFiltered) return list;
  return (
    <Autocomplete<T>
      inputValue={text}
      onInputChange={setText}
      filter={filter}
      // A filter that does not take focus leaves the list to take it, as an unfiltered list does: its options
      // take real focus, so the arrows move through them, and the filter is one tap away (spec correction 3).
      disableVirtualFocus={!focusFilter}
    >
      <div className="select-filter">
        <SearchField
          aria-label={labels.filter}
          placeholder={labels.filter}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- the filter is the list's search, and a list that opens to be searched starts in it (spec ruling 7)
          autoFocus={focusFilter}
        />
      </div>
      {list}
    </Autocomplete>
  );
}

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
  // cover the list. It is read when the user opens the list, an event, and never while rendering; a list opened
  // by `defaultOpen` or by the app's `isOpen` keeps the default and focuses its filter.
  const [focusFilter, setFocusFilter] = useState(true);
  const openChange = (isOpen: boolean): void => {
    if (isOpen) setFocusFilter(!window.matchMedia('(pointer: coarse)').matches);
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
      <Popover
        className={cx('menu-popover', 'select-popover', popoverClassName)}
        matchTriggerWidth
        maxHeight={320}
        placement={placement}
      >
        <SelectList<T>
          items={items}
          isFilterable={isFilterable}
          focusFilter={focusFilter}
          labels={{ ...DEFAULT_LABELS, ...labels }}
        >
          {children}
        </SelectList>
      </Popover>
    </RACSelect>
  );
}
