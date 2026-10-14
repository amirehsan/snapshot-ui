'use client';

import { useContext, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import {
  Autocomplete,
  ListBox,
  SelectStateContext,
  useFilter,
  type AutocompleteProps,
} from 'react-aria-components';
import { Popover, type Placement } from '../popover/Popover';
import { SearchField } from '../search-field/SearchField';

/*
 * The list a React Aria Select opens, shared by Select and FilterChip: the Menu's rows in the library's popover,
 * with Select's filter from nine options. Internal: nothing here is exported from the package.
 */

/** The list's own words: the filter's name and the line shown when it keeps nothing. */
export interface ListLabels {
  filter: string;
  empty: string;
}

/** From this many options the list shows its filter: more than 8 (spec ruling 7). */
const FILTER_FROM = 9;

/** The words of a query, split at whitespace: CommandPalette's rule. */
const wordsOf = (query: string): string[] => query.split(/\s+/).filter(Boolean);

/**
 * Whether the pointer is coarse, a touch screen, where the filter waits for a tap so a phone's keyboard does not
 * cover the list. Read only in an event handler, never while rendering. A test environment may have no
 * matchMedia, which reads as a fine pointer.
 */
export const isCoarsePointer = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

export interface ListProps<T extends object> {
  items: Iterable<T> | undefined;
  children: ReactNode | ((item: T) => ReactElement);
  isFilterable: boolean | undefined;
  focusFilter: boolean;
  labels: ListLabels;
}

/**
 * The list in the popover. It mounts each time the list opens, since React Aria's popover renders nothing while
 * closed and `SelectPopover` keeps it out of the hidden pass that builds the collection, so the filter's text
 * starts empty on every open and its collator is made only in a browser that opened the list. It counts the options from React Aria's collection, which counts items and never headings, inside
 * sections too.
 */
export function SelectList<T extends object>({
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

export interface SelectPopoverProps<T extends object> extends ListProps<T> {
  className: string;
  placement: Placement;
}

/**
 * The popover and its list, or the options alone. React Aria renders a Select's children a second time, hidden,
 * to build its collection, and its Popover renders its content in that pass too, on the server as well. There
 * the Select's state is not provided yet, so this renders a bare ListBox, which is all the collection needs:
 * the filter, its collator and the library popover's focus handling stay out of the hidden pass.
 */
export function SelectPopover<T extends object>({
  className,
  placement,
  ...list
}: SelectPopoverProps<T>): ReactElement {
  if (useContext(SelectStateContext) === null) {
    return <ListBox<T> items={list.items}>{list.children}</ListBox>;
  }
  return (
    <Popover className={className} matchTriggerWidth maxHeight={320} placement={placement}>
      <SelectList<T> {...list} />
    </Popover>
  );
}
