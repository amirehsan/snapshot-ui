'use client';

import { ChevronDown, X } from 'lucide-react';
import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type Context,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  Button as RACButton,
  Dialog,
  DialogTrigger,
  Select as RACSelect,
  SelectStateContext,
  type Key,
} from 'react-aria-components';
import { Button } from '../button/Button';
import { SelectPopover, isCoarsePointer, type ListLabels } from '../picker/SelectList';
import { Popover, type Placement } from '../popover/Popover';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface FilterChipLabels {
  /**
   * The clear button's name, given the chip's label. In More and the Filters sheet, the button's visible word
   * is FilterBar's `labels.clear`, so a localized name must start with that word. @default (label) => `Clear ${label}`
   */
  clear: (label: string) => string;
  /**
   * A list chip's value, given the chosen options' text values in list order.
   * @default "Food", "Food, Rent", "Food, Rent and 2 more"
   */
  summary: (texts: readonly string[]) => string;
  /** Select's: the filter's name. @default 'Filter' */
  filter: string;
  /** Select's: the line shown when the filter keeps nothing. @default 'No matches' */
  empty: string;
  /** A list chip's placeholder where it draws as a section, in More or the Filters sheet. @default 'Any' */
  any: string;
}

interface FilterChipBaseProps {
  /** The filter's name, always shown: "Category". It names the chip, its panel and its section. */
  label: string;
  /** The value as the chip shows it. A custom chip needs it to show a value; a list chip computes one. */
  valueLabel?: string;
  /** Clears the value. A list chip clears through `onChange` without it; a custom chip needs it. */
  onClear?: () => void;
  /** Starts behind "More" in a FilterBar, and joins the row once it has a value. */
  isSecondary?: boolean;
  isDisabled?: boolean;
  /** The library's own words, in English unless replaced. */
  labels?: Partial<FilterChipLabels>;
  /**
   * Where the list or the panel opens.
   * @default 'bottom start'
   */
  placement?: Placement;
  /** Goes on the popover around the list or the panel. */
  popoverClassName?: string;
  /** Goes on the pill, or on the section where a FilterBar draws one, after the library's class. */
  className?: string;
  /** A ref to the pill. */
  ref?: Ref<HTMLDivElement>;
}

type ListChoice =
  | {
      /** One choice: the list closes on it, and the clear button is the way back to none. */
      selectionMode: 'single';
      /** The chosen option's id, or null for none. */
      value: Key | null;
      onChange: (value: Key | null) => void;
    }
  | {
      /** Several choices: the list stays open as each one toggles. */
      selectionMode: 'multiple';
      /** The chosen options' ids; an empty array for none. */
      value: readonly Key[];
      onChange: (value: Key[]) => void;
    };

/** A chip that opens Select's list. Always controlled: its value is in the URL. */
export type FilterChipListProps<T extends object = object> = FilterChipBaseProps &
  ListChoice & {
    /** The options as data, rendered by a function child. Omit it for static `PickerOption` children. */
    items?: Iterable<T>;
    /** `PickerOption`s and `PickerSection`s, or a function that renders one option of `items`. */
    children: ReactNode | ((item: T) => ReactElement);
    /**
     * A filter field at the top of the list.
     * @default true at 9 options or more, Select's rule
     */
    isFilterable?: boolean;
  };

/** A chip that opens a padded panel of the app's own content. */
export type FilterChipCustomProps = FilterChipBaseProps & {
  selectionMode?: undefined;
  /** A list chip's: a custom chip holds its own content. */
  items?: never;
  /** A list chip's. */
  isFilterable?: never;
  /** Free content: a RangeCalendar, two NumberFields, a SegmentedControl. A function receives `close`. */
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
};

/** The props of a filter chip: a list in single or multiple mode, or the app's own content. */
export type FilterChipProps<T extends object = object> = FilterChipListProps<T> | FilterChipCustomProps;

/** Where FilterBar draws a chip. Internal: FilterBar provides it; a chip on its own reads null and is a pill. */
export interface ChipPlace {
  place: 'row' | 'panel' | 'sheet';
  /**
   * The labels of the inactive secondary chips FilterBar read from its children, which More holds; only these
   * leave the row. A secondary chip wrapped in the app's own component is not among them, so it stays in the row
   * rather than vanish (spec correction 29).
   */
  behindMore: ReadonlySet<string>;
  /** The labels the More panel opened with; null outside the panel. */
  panelLabels: ReadonlySet<string> | null;
  /** FilterBar's labels.clear, the visible word of a section's clear button. */
  clearWord: string;
  /** Closes the surface a custom chip's section sits in: the More panel; nothing in the sheet. */
  close: () => void;
  /** Called when a secondary chip in the row is cleared, so FilterBar can give focus to More. */
  onSecondaryCleared: () => void;
  /**
   * Called as a secondary chip in the row opens or closes its list or panel. FilterBar keeps an open chip in the
   * row though a change made in it leaves the chip without a value, so the list in use never unmounts; as it
   * closes the chip leaves for More, and More takes focus.
   */
  onRowOpenChange: (label: string, isOpen: boolean) => void;
}

/** Internal: FilterBar's place for the chips under it. */
export const FilterChipPlaceContext: Context<ChipPlace | null> = createContext<ChipPlace | null>(null);

/** "Food", "Food, Rent", "Food, Rent and 2 more", with concatenation and String() only (ruling 7). */
const defaultSummary = (texts: readonly string[]): string =>
  texts.length <= 2
    ? texts.join(', ')
    : `${texts[0] ?? ''}, ${texts[1] ?? ''} and ${String(texts.length - 2)} more`;

const DEFAULT_LABELS: FilterChipLabels = {
  clear: (label) => `Clear ${label}`,
  summary: defaultSummary,
  filter: 'Filter',
  empty: 'No matches',
  any: 'Any',
};

/** The part of React Aria's Select state the summary reads. */
interface ChipSelectState {
  collection: { getKeys: () => Iterable<Key> };
  selectedItems: readonly { key: Key; textValue: string }[];
}

/** The chosen options' text values in the list's order: React Aria keeps selectedItems in the value's order. */
function chosenTexts(state: ChipSelectState): string[] {
  const order = [...state.collection.getKeys()];
  return [...state.selectedItems]
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    .map((item) => item.textValue);
}

/** The keys a list chip's value holds, in the value's order. */
const keysOf = (value: Key | null | readonly Key[]): Key[] =>
  Array.isArray(value) ? [...(value as readonly Key[])] : value == null ? [] : [value as Key];

/**
 * The value a list chip shows: the app's `valueLabel`, else the summary of what React Aria's state holds chosen.
 * A value none of whose keys is an option, a stale one from the URL, shows its keys as written, with a warning,
 * so an active chip never says so by its fill alone. React Aria's state is null in its hidden collection pass,
 * where nothing is shown.
 */
function useListText(
  label: string,
  value: Key | null | readonly Key[],
  valueLabel: string | undefined,
  summary: FilterChipLabels['summary'],
): string | undefined {
  const state = useContext(SelectStateContext);
  const keys = keysOf(value);
  // Read once the collection is built: on the first render it is empty and nothing is chosen yet.
  const options = state === null ? [] : [...state.collection.getKeys()];
  const isStale =
    !present(valueLabel) &&
    state !== null &&
    state.selectedItems.length === 0 &&
    options.length > 0 &&
    keys.length > 0 &&
    !keys.some((key) => options.includes(key));
  useWarnOnce(
    isStale
      ? `FilterChip "${label}" has the value ${keys.map(String).join(', ')}, which is none of its options, so it shows the key as written. Drop the stale value, or pass valueLabel.`
      : null,
  );
  if (present(valueLabel)) return valueLabel;
  if (state === null) return undefined;
  if (isStale) return summary(keys.map(String));
  return state.selectedItems.length > 0 ? summary(chosenTexts(state)) : undefined;
}

interface ChipButtonProps {
  label: string;
  text: string | undefined;
  /** The ids of the label and value spans, which the custom chip's dialog is named by too. */
  ids: { label: string; value: string };
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** A custom chip's; a list chip's Select disables its trigger itself. */
  isDisabled?: boolean;
}

/** The name the label and value spans give: the label alone, or the label and then the value. */
const namedBy = (ids: ChipButtonProps['ids'], text: string | undefined): string =>
  text === undefined ? ids.label : `${ids.label} ${ids.value}`;

/**
 * The pill's trigger: the label, the value while there is one and the chevron, named by the label and then the
 * value, the order it shows them in, so axe's label-in-name check passes (spec correction 23). In a list chip
 * React Aria's Select hands it the trigger's props; in a custom chip, the DialogTrigger.
 */
function ChipButton({ label, text, ids, triggerRef, isDisabled }: ChipButtonProps): ReactElement {
  return (
    <RACButton
      ref={triggerRef}
      className="filter-chip-trigger"
      aria-labelledby={namedBy(ids, text)}
      isDisabled={isDisabled}
    >
      <span id={ids.label} className="filter-chip-label">
        {label}
      </span>
      {text === undefined ? null : (
        <>
          {/* A space the flex row does not draw, so the text the chip shows reads "Category Food", as its name
              does, and axe's label-in-name check, which joins the text of the spans as written, finds it. */}{' '}
          <span id={ids.value} className="filter-chip-value">
            {text}
          </span>
        </>
      )}
      <span className="filter-chip-chevron" aria-hidden="true">
        <ChevronDown />
      </span>
    </RACButton>
  );
}

/** A list chip's trigger, inside React Aria's Select, whose state it reads for the summary. */
function ListChipButton({
  value,
  valueLabel,
  summary,
  ...button
}: Omit<ChipButtonProps, 'text' | 'isDisabled'> & {
  value: Key | null | readonly Key[];
  valueLabel: string | undefined;
  summary: FilterChipLabels['summary'];
}): ReactElement {
  return <ChipButton {...button} text={useListText(button.label, value, valueLabel, summary)} />;
}

/**
 * Whether a list chip's value holds a choice, read from its props so the server knows: null and undefined are
 * none. Internal: FilterBar's census reads it too, so the two never disagree.
 */
export const hasChoice = (value: Key | null | readonly Key[]): boolean =>
  Array.isArray(value) ? value.length > 0 : value != null;

/**
 * Whether the filter takes focus as a list opens: not on a coarse pointer, where a phone's keyboard would cover
 * the list. Read as the user opens the list, an event, and never while rendering, as Select reads it.
 */
function useFocusFilter(): [focusFilter: boolean, onOpen: (isOpen: boolean) => void] {
  const [focusFilter, setFocusFilter] = useState(true);
  return [
    focusFilter,
    (isOpen) => {
      setFocusFilter(!(isOpen && isCoarsePointer()));
    },
  ];
}

/** What every face takes, resolved once. */
interface Resolved<T extends object> {
  props: FilterChipProps<T>;
  names: FilterChipLabels;
  isActive: boolean;
  isClearable: boolean;
  isDisabled: boolean;
  /** Clears the value through `onClear`, else the list chip's `onChange`. */
  clear: () => void;
}

/** The list props SelectPopover takes from a list chip. */
function listOf<T extends object>(
  props: FilterChipListProps<T>,
  names: FilterChipLabels,
  focusFilter: boolean,
): {
  items: Iterable<T> | undefined;
  isFilterable: boolean | undefined;
  labels: ListLabels;
  focusFilter: boolean;
} {
  return {
    items: props.items,
    isFilterable: props.isFilterable,
    labels: { filter: names.filter, empty: names.empty },
    focusFilter,
  };
}

interface ChoiceSelectProps {
  choice: ListChoice;
  className: string;
  isDisabled: boolean;
  onOpenChange: (isOpen: boolean) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
}

/**
 * React Aria's Select in the chip's mode, with its value and onChange as React Aria types them for that mode. Its
 * items go to the list, not to the Select, so the Select's item type is left open.
 */
function ChoiceSelect({ choice, children, ...common }: ChoiceSelectProps): ReactElement {
  return choice.selectionMode === 'multiple' ? (
    <RACSelect<object, 'multiple'>
      {...common}
      selectionMode="multiple"
      value={[...choice.value]}
      onChange={choice.onChange}
    >
      {children}
    </RACSelect>
  ) : (
    <RACSelect {...common} selectionMode="single" value={choice.value} onChange={choice.onChange}>
      {children}
    </RACSelect>
  );
}

/** The pill, in a row or on its own. */
function ChipPill<T extends object>({
  resolved,
  onCleared,
  onOpenChange,
}: {
  resolved: Resolved<T>;
  /** Called once cleared, after focus is on the trigger: FilterBar's, for a chip that may leave the row. */
  onCleared: (() => void) | undefined;
  /** Called as the list or the panel opens and closes: FilterBar's, for a chip that may leave the row. */
  onOpenChange: ((isOpen: boolean) => void) | undefined;
}): ReactElement {
  const { props, names, isActive, isClearable, isDisabled, clear } = resolved;
  const { label, valueLabel, placement = 'bottom start', popoverClassName, className, ref } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const ids = { label: useId(), value: useId() };
  const [isOpen, setOpen] = useState(false);
  const [focusFilter, onOpenFilter] = useFocusFilter();

  // A closed chip keeps letters and Left and Right from React Aria's Select, which would choose an option unseen
  // (useSelect.mjs:54-61, useTypeSelect.mjs:49-60): a silent query and a URL write. Stopped here, in the capture
  // phase, before the trigger's handlers; Enter, Space and the vertical arrows still open it (R3).
  const guardClosedKeys = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (isOpen || event.target !== triggerRef.current) return;
    const isLetter =
      event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (isLetter || event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.stopPropagation();
  };

  return (
    // The capture guard keeps a closed chip's letters and Left and Right from choosing silently; the trigger
    // inside stays the tab stop (spec 8.2, R3). jsx-a11y reads no capture handler, so the div needs no exemption.
    <div
      ref={ref}
      className={cx('filter-chip', className)}
      data-active={isActive ? '' : undefined}
      data-open={isOpen ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      onKeyDownCapture={guardClosedKeys}
    >
      {props.selectionMode !== undefined ? (
        <ChoiceSelect
          choice={props}
          className="filter-chip-select"
          aria-label={label}
          isDisabled={isDisabled}
          onOpenChange={(open) => {
            onOpenFilter(open);
            setOpen(open);
            onOpenChange?.(open);
          }}
        >
          <ListChipButton
            label={label}
            value={props.value}
            valueLabel={valueLabel}
            summary={names.summary}
            ids={ids}
            triggerRef={triggerRef}
          />
          <SelectPopover<T>
            className={cx('menu-popover', 'select-popover', popoverClassName)}
            placement={placement}
            {...listOf(props, names, focusFilter)}
          >
            {props.children}
          </SelectPopover>
        </ChoiceSelect>
      ) : (
        <DialogTrigger
          onOpenChange={(open) => {
            setOpen(open);
            onOpenChange?.(open);
          }}
        >
          <ChipButton
            label={label}
            text={present(valueLabel) ? valueLabel : undefined}
            ids={ids}
            triggerRef={triggerRef}
            isDisabled={isDisabled}
          />
          <Popover className={cx('filter-chip-panel', popoverClassName)} isPadded placement={placement}>
            {/* Named by the label and the value, as the trigger is: React Aria would name it by the trigger, whose
                own aria-labelledby a name computed through it skips. */}
            <Dialog
              className="filter-chip-dialog"
              aria-labelledby={namedBy(ids, present(valueLabel) ? valueLabel : undefined)}
            >
              {({ close }) =>
                typeof props.children === 'function' ? props.children({ close }) : props.children
              }
            </Dialog>
          </Popover>
        </DialogTrigger>
      )}
      {isActive && isClearable && !isDisabled ? (
        // A sibling of the Select, never inside it: Select hands its trigger's props to every Button in it, so a
        // clear button there would open the list (spec correction 25).
        <RACButton
          className="filter-chip-clear"
          aria-label={names.clear(label)}
          onPress={() => {
            clear();
            // The button leaves with the value, so focus goes to the trigger; a secondary chip may then leave the
            // row, so FilterBar hears of it and moves focus to More once the chip has gone.
            triggerRef.current?.focus();
            onCleared?.();
          }}
        >
          <span className="filter-chip-clear-icon" aria-hidden="true">
            <X />
          </span>
        </RACButton>
      ) : null}
    </div>
  );
}

/** A list chip's trigger in a section: Select's look, showing the summary or `labels.any`. */
function SectionTrigger({
  label,
  value,
  titleId,
  valueLabel,
  names,
  triggerRef,
}: {
  label: string;
  value: Key | null | readonly Key[];
  titleId: string;
  valueLabel: string | undefined;
  names: FilterChipLabels;
  triggerRef: RefObject<HTMLButtonElement | null>;
}): ReactElement {
  const valueId = useId();
  const text = useListText(label, value, valueLabel, names.summary);
  return (
    <RACButton ref={triggerRef} className="input select-trigger" aria-labelledby={`${valueId} ${titleId}`}>
      <span id={valueId} className="select-value" data-placeholder={text === undefined ? '' : undefined}>
        <span className="select-value-label">{text ?? names.any}</span>
      </span>
      <span className="select-chevron" aria-hidden="true">
        <ChevronDown />
      </span>
    </RACButton>
  );
}

/** The controls a custom section's content may hold, each only while enabled and in the tab order. */
const TAB_STOP = ['input:not([type="hidden"])', 'button', 'select', 'textarea', '[tabindex="0"]']
  .map((each) => `${each}:not(:disabled):not([tabindex="-1"])`)
  .join(', ');

/**
 * The first control of a custom section that Tab would reach. A group of radios is one tab stop: its checked
 * radio, or with none checked its first enabled one.
 */
function firstTabStop(scope: HTMLElement | null): HTMLElement | undefined {
  if (scope === null) return undefined;
  return [...scope.querySelectorAll<HTMLElement>(TAB_STOP)].find((each) => {
    if (!(each instanceof HTMLInputElement) || each.type !== 'radio' || each.name === '') return true;
    const group = [...scope.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')].filter(
      (radio) => radio.name === each.name,
    );
    const checked = group.find((radio) => radio.checked);
    return each === (checked ?? group[0]);
  });
}

/** The section a chip draws as in the More panel and the Filters sheet. */
function ChipSection<T extends object>({
  resolved,
  place,
}: {
  resolved: Resolved<T>;
  place: ChipPlace;
}): ReactElement {
  const { props, names, isActive, isClearable, isDisabled, clear } = resolved;
  const { label, valueLabel, placement = 'bottom start', popoverClassName, className } = props;
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [focusFilter, onOpenFilter] = useFocusFilter();
  return (
    <section className={cx('filter-section', className)} aria-labelledby={titleId}>
      <div className="filter-section-head">
        <h3 id={titleId} className="filter-section-title">
          {label}
        </h3>
        {isActive && isClearable && !isDisabled ? (
          <Button
            variant="tertiary"
            className="filter-section-clear"
            aria-label={names.clear(label)}
            onPress={() => {
              clear();
              // The button leaves with the value: focus goes to the section's trigger, or a custom chip's first
              // control.
              const target = triggerRef.current ?? firstTabStop(bodyRef.current);
              target?.focus();
            }}
          >
            {place.clearWord}
          </Button>
        ) : null}
      </div>
      {props.selectionMode !== undefined ? (
        <ChoiceSelect
          choice={props}
          className="field select filter-section-select"
          aria-labelledby={titleId}
          isDisabled={isDisabled}
          onOpenChange={onOpenFilter}
        >
          <SectionTrigger
            label={label}
            value={props.value}
            titleId={titleId}
            valueLabel={valueLabel}
            names={names}
            triggerRef={triggerRef}
          />
          <SelectPopover<T>
            className={cx('menu-popover', 'select-popover', popoverClassName)}
            placement={placement}
            {...listOf(props, names, focusFilter)}
          >
            {props.children}
          </SelectPopover>
        </ChoiceSelect>
      ) : (
        <div ref={bodyRef} className="filter-section-body">
          {typeof props.children === 'function' ? props.children({ close: place.close }) : props.children}
        </div>
      )}
    </section>
  );
}

/**
 * A pill that names a filter and opens Select's list, in single or multiple mode with Select's filter from nine
 * options, or a padded panel of the app's own content. Once it has a value it is the ink fill showing its label
 * and the value: a list chip writes a summary of the chosen options' text values in list order, `labels.summary`
 * for another language and `valueLabel` to write it yourself. A clear button follows it while active. A closed
 * chip ignores letters and Left and Right, so no filter is chosen unseen. Always controlled. Inside a FilterBar
 * it also draws as a labelled section of More and the Filters sheet. Built on React Aria's Select and
 * DialogTrigger.
 */
export function FilterChip<T extends object = object>(props: FilterChipProps<T>): ReactElement | null {
  const place = useContext(FilterChipPlaceContext);
  const names: FilterChipLabels = { ...DEFAULT_LABELS, ...props.labels };
  const isList = props.selectionMode !== undefined;
  const isActive = props.selectionMode !== undefined ? hasChoice(props.value) : present(props.valueLabel);
  const resolved: Resolved<T> = {
    props,
    names,
    isActive,
    isClearable: isList || props.onClear !== undefined,
    isDisabled: props.isDisabled === true,
    clear: () => {
      if (props.onClear) props.onClear();
      else if (props.selectionMode === 'multiple') props.onChange([]);
      else if (props.selectionMode === 'single') props.onChange(null);
    },
  };

  if (place === null) return <ChipPill resolved={resolved} onCleared={undefined} onOpenChange={undefined} />;
  if (place.place === 'row') {
    // Behind More while inactive, when FilterBar read it and so More holds it; an active chip, one More cannot
    // hold, or one whose list or panel is open, which FilterBar leaves out of behindMore until it closes, is in
    // the row.
    const isSecondary = props.isSecondary === true;
    if (isSecondary && !isActive && place.behindMore.has(props.label)) return null;
    return (
      <ChipPill
        resolved={resolved}
        // A secondary chip may leave the row with its value, even when More is not drawn as it clears: with every
        // secondary chip active there is no More, and clearing one brings it back. FilterBar always hears of it,
        // and gives focus to More once the chip has gone.
        onCleared={isSecondary ? place.onSecondaryCleared : undefined}
        onOpenChange={
          isSecondary
            ? (open) => {
                place.onRowOpenChange(props.label, open);
              }
            : undefined
        }
      />
    );
  }
  if (place.place === 'panel' && !place.panelLabels?.has(props.label)) return null;
  return <ChipSection resolved={resolved} place={place} />;
}
