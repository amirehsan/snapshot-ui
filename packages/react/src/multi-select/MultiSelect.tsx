'use client';

import { ChevronDown, X } from 'lucide-react';
import {
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ContextType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button,
  ComboBox as RACComboBox,
  ComboBoxStateContext,
  ComboBoxValue,
  GroupContext,
  Input as RACInput,
  LabelContext,
  ListBox,
  Tag,
  TagGroup,
  TagList,
  composeRenderProps,
  useSlottedContext,
  type ComboBoxProps as RACComboBoxProps,
  type ComboBoxRenderProps,
  type Key,
  type ValidationResult,
} from 'react-aria-components';
import type { PickerLabels } from '../combo-box/ComboBox';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { Popover, type Placement } from '../popover/Popover';
import { Spinner } from '../spinner/Spinner';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';

export interface MultiSelectLabels extends PickerLabels {
  /**
   * The name of the group of chosen values, read with the field's label: "Selected Categories".
   * @default 'Selected'
   */
  selected: string;
  /**
   * Each tag's remove button; React Aria reads it with the tag's text: "Remove Food".
   * @default 'Remove'
   */
  remove: string;
}

export interface MultiSelectBaseProps<T extends object = object> extends Omit<
  RACComboBoxProps<T, 'multiple'>,
  | 'children'
  | 'className'
  | 'selectionMode'
  | 'allowsCustomValue'
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'onSelectionChange'
> {
  /** The field's name, shown above it. Required unless the field has an `aria-label` or an `aria-labelledby`. */
  label?: ReactNode;
  /** A hint under the field. It becomes the input's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the field is invalid. A function receives the validation result. Without
   * it the field shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Example text, the input's placeholder, shown only while nothing is chosen: taupe under a visible label, slate
   * when only an `aria-label` names the field.
   */
  placeholder?: string;
  /**
   * Whether the value differs from the saved one. Shows the clay Changed chip in the label row and the light
   * signal orange edge, and has a screen reader read the chip with the input. An invalid field shows its error
   * instead.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * `PickerOption`s and `PickerSection`s, or a function that renders one option of `items` or `defaultItems`. A
   * tag shows its option's text value, so an option whose label is not a string needs a `textValue`.
   */
  children: ReactNode | ((item: T) => ReactElement);
  /** Shows the Spinner in the field while the app loads options. The list keeps what it has. */
  isLoading?: boolean;
  /** The library's own words: the button's name, the list's lines, the tags' name and the remove buttons. */
  labels?: Partial<MultiSelectLabels>;
  /**
   * Where the list opens.
   * @default 'bottom start'
   */
  placement?: Placement;
  /** Goes on the popover around the list. */
  popoverClassName?: string;
  /** A class name, or a function of the field's state, merged after the library's own classes. */
  className?: string | ((values: ComboBoxRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a multi-select. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type MultiSelectProps<T extends object = object> = MultiSelectBaseProps<T> & AccessibleName<'label'>;

const DEFAULT_LABELS: MultiSelectLabels = {
  open: 'Show options',
  empty: 'No matches',
  loading: 'Loading',
  selected: 'Selected',
  remove: 'Remove',
};

/** React Aria does not re-export the combo box state's type, so it is read from its context. */
type State = NonNullable<ContextType<typeof ComboBoxStateContext>>;

/** How the tags are named: "Selected" and the field's own name. */
interface TagsName {
  /** The field's label, or its `aria-labelledby` when no visible label names it. */
  labelledBy: string | undefined;
  /** The field's `aria-label`, read after "Selected" when nothing labels it by id. */
  label: string | undefined;
}

interface ControlProps {
  placeholder: string | undefined;
  inputRef: Ref<HTMLInputElement> | undefined;
  isLoading: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isLabelled: boolean;
  name: TagsName;
  labels: MultiSelectLabels;
}

interface DisabledTagsProps {
  items: { id: Key; text: string }[];
  label: string;
  labelledBy: string | undefined;
}

/**
 * The tags' `aria-label` and `aria-labelledby`: "Selected" with the visible label or the field's own
 * `aria-labelledby`, which React Aria reads after the group's own label; with an `aria-label` alone, the two
 * joined, since nothing then labels the field by id.
 */
function tagsName(
  selected: string,
  name: TagsName,
): { 'aria-label': string; 'aria-labelledby': string | undefined } {
  if (name.labelledBy !== undefined) return { 'aria-label': selected, 'aria-labelledby': name.labelledBy };
  return {
    'aria-label': name.label === undefined ? selected : `${selected} ${name.label}`,
    'aria-labelledby': undefined,
  };
}

/**
 * A disabled field's tags: the same pills in a disabled group, read and never focused. React Aria's tag grid
 * keeps itself in the tab order even when every tag is disabled, so a disabled field draws no grid. A group, not a
 * list, since a list takes no `aria-disabled`, and that is what says the taupe text is disabled text.
 */
function DisabledTags({ items, label, labelledBy }: DisabledTagsProps): ReactElement {
  const id = useId();
  return (
    <div className="multi-select-tags">
      <div
        id={id}
        role="group"
        className="multi-select-tag-list"
        aria-label={label}
        aria-labelledby={labelledBy === undefined ? undefined : `${id} ${labelledBy}`}
        aria-disabled="true"
      >
        {items.map(({ id: key, text }) => (
          <div key={key} className="multi-select-tag">
            <span className="multi-select-tag-text">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The drawn frame: the chosen values as tags, the input, the Spinner while options load and the field button.
 * It wears `.input`, so every edge the field's root sets reaches it. It takes React Aria's group ref, so the
 * list opens against the whole frame at its width, and is a plain div and not React Aria's Group, whose
 * focus-within ring would draw on the frame while a tag holds focus (spec correction 7).
 */
function MultiSelectControl({
  placeholder,
  inputRef,
  isLoading,
  isDisabled,
  isReadOnly,
  isLabelled,
  name,
  labels,
}: ControlProps): ReactElement {
  const group = useSlottedContext(GroupContext);
  // The field label's id, so the tags' grid is named "Selected" and the label. React Aria gives the label
  // context an id even when no label is drawn, so it is taken only with a visible label.
  const labelId = useSlottedContext(LabelContext)?.id;
  const named = tagsName(labels.selected, {
    labelledBy: isLabelled ? labelId : name.labelledBy,
    label: name.label,
  });
  const frameRef = useRef<HTMLDivElement>(null);
  const ownInputRef = useRef<HTMLInputElement>(null);
  const focusInputNext = useRef(false);
  // Null in React Aria's hidden collection pass, which draws no frame.
  const comboBox = useContext(ComboBoxStateContext);
  const count = comboBox?.selectedItems.length ?? 0;
  const isOpen = comboBox?.isOpen ?? false;
  const groupRef = group?.ref;
  const frame = useMemo(() => mergeRefs(groupRef, frameRef), [groupRef]);
  const input = useMemo(() => mergeRefs(inputRef, ownInputRef), [inputRef]);

  /** Removes keys from the value; when none is left, focus goes on to the input once the tags are gone. */
  const remove = (state: State, keys: Set<Key>): void => {
    const rest = (state.value as readonly Key[]).filter((key) => !keys.has(key));
    if (rest.length === 0) focusInputNext.current = true;
    state.setValue(rest);
  };

  // React Aria's TagGroup focuses its own grid when the last tag goes, but the grid leaves with it. This effect,
  // keyed on the number of tags, runs once they have gone and hands focus to the input. The flag is spent on
  // the next change whatever it is, so a removal the app refused never pulls focus on a later one.
  useEffect(() => {
    const wanted = focusInputNext.current;
    focusInputNext.current = false;
    if (wanted && count === 0) ownInputRef.current?.focus();
  }, [count]);

  /** The last tag, while there is one. */
  const lastTag = (): HTMLElement | undefined => {
    const tags = frameRef.current?.querySelectorAll<HTMLElement>('.multi-select-tag');
    return tags?.[tags.length - 1];
  };

  // React Aria hides the tags from assistive technology while the list is open, so a Backspace then closes the
  // list first, and the last tag takes focus once they are read again.
  const focusLastTagNext = useRef(false);
  useEffect(() => {
    if (isOpen || !focusLastTagNext.current) return;
    focusLastTagNext.current = false;
    lastTag()?.focus();
  }, [isOpen]);

  /** The first Backspace in an empty input focuses the last tag; the tag's own Backspace removes it. */
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (isReadOnly || event.key !== 'Backspace' || event.currentTarget.value !== '') return;
    const last = lastTag();
    if (!last) return;
    event.preventDefault();
    if (comboBox?.isOpen) {
      focusLastTagNext.current = true;
      comboBox.close();
      return;
    }
    last.focus();
  };

  /**
   * Tab and Shift+Tab leave the field and never change its value. In multiple mode React Aria's Tab commits
   * the active option, which toggles it, so a Tab after Enter would undo the choice. Clearing the active
   * option first, before React Aria's own handler on the input, sends its commit down the path that closes the
   * list and empties the input and toggles nothing.
   */
  const onFrameKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Tab' || event.target !== ownInputRef.current || !comboBox?.isOpen) return;
    comboBox.selectionManager.setFocusedKey(null);
  };

  /** A press on the frame's empty room, outside a tag, the input and the button, is a press on the input. */
  const onFrameMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
    if (isDisabled || !(event.target instanceof Element)) return;
    if (event.target.closest('.multi-select-tag, .multi-select-input, .input-button')) return;
    event.preventDefault();
    ownInputRef.current?.focus();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a press on the frame's empty room is a press on its input, which stays the one tab stop (spec 7.5)
    <div
      ref={frame}
      className="input multi-select-control"
      data-disabled={isDisabled ? '' : undefined}
      onMouseDown={onFrameMouseDown}
      onKeyDownCapture={onFrameKeyDownCapture}
    >
      {/* While the list is open React Aria hides all but the input and the list from assistive technology, the
          tags too, and leaves them focusable by design: a press on a remove button still removes its tag, and
          Shift+Tab still reaches them, closing the list. */}
      <ComboBoxValue className="multi-select-value">
        {({ state }) =>
          state.selectedItems.length === 0 ? null : isDisabled ? (
            <DisabledTags
              items={state.selectedItems.map((node) => ({ id: node.key, text: node.textValue }))}
              label={named['aria-label']}
              labelledBy={named['aria-labelledby']}
            />
          ) : (
            <TagGroup
              className="multi-select-tags"
              {...named}
              // Read only, the tags are read and focused and never removed: no onRemove, no remove buttons.
              onRemove={
                isReadOnly
                  ? undefined
                  : (keys) => {
                      remove(state, keys);
                    }
              }
            >
              <TagList
                className="multi-select-tag-list"
                // React Aria's own values are null for static options, so the tags come from its nodes: the
                // key and the text value, in the order chosen (spec correction 13).
                items={state.selectedItems.map((node) => ({ id: node.key, text: node.textValue }))}
              >
                {(item) => (
                  <Tag id={item.id} textValue={item.text} className="multi-select-tag">
                    <span className="multi-select-tag-text">{item.text}</span>
                    {isReadOnly ? null : (
                      // Out of the tab order: the tags are one stop, and Backspace or Delete on a tag removes it.
                      <Button
                        slot="remove"
                        className="multi-select-tag-remove"
                        aria-label={labels.remove}
                        excludeFromTabOrder
                      >
                        <X aria-hidden="true" />
                      </Button>
                    )}
                  </Tag>
                )}
              </TagList>
            </TagGroup>
          )
        }
      </ComboBoxValue>
      <RACInput
        ref={input}
        className="multi-select-input"
        placeholder={count === 0 ? placeholder : undefined}
        onKeyDown={onInputKeyDown}
      />
      {isLoading ? (
        <span className="combo-box-spinner">
          <Spinner size="md" aria-label={labels.loading} />
        </span>
      ) : null}
      {/* Out of the tab order and never focused by a press, as ComboBox's: focus stays in the input. */}
      <Button className="input-button combo-box-button" aria-label={labels.open}>
        <ChevronDown aria-hidden="true" />
      </Button>
    </div>
  );
}

interface ListProps<T extends object> {
  className: string;
  placement: Placement | undefined;
  isLoading: boolean;
  labels: MultiSelectLabels;
  children: ReactNode | ((item: T) => ReactElement);
}

/**
 * The popover and its list, ComboBox's, or the options alone. React Aria renders a combo box's children a second
 * time, hidden, to build its collection, and its Popover renders its content in that pass too. There the state is
 * not provided yet, so this renders a bare ListBox, which is all the collection needs, and the library popover's
 * focus handling stays out of the hidden pass.
 */
function MultiSelectPopover<T extends object>({
  className,
  placement,
  isLoading,
  labels,
  children,
}: ListProps<T>): ReactElement {
  if (useContext(ComboBoxStateContext) === null) {
    return <ListBox<T>>{children}</ListBox>;
  }
  return (
    <Popover className={className} maxHeight={320} placement={placement}>
      <ListBox<T>
        className="menu multi-select-list"
        // With nothing to show the list stays open and says so, rather than vanishing as if the field broke.
        renderEmptyState={() => (
          <div className="picker-empty">{isLoading ? labels.loading : labels.empty}</div>
        )}
      >
        {children}
      </ListBox>
    </Popover>
  );
}

/**
 * A field that chooses several values from a list: ComboBox in React Aria's multiple mode, its chosen values
 * drawn as removable bone tags in a frame that wears the text input's edge and grows a row at a time. Typing
 * filters the list; a press or Enter toggles an option, the list stays open for the next and the input empties.
 * A tag goes by its button, by Backspace or Delete, or by Backspace twice from an empty input, which first
 * focuses the last tag. `value` is `readonly Key[]` and `onChange` receives `Key[]`; with a `name`, a form gets
 * one value per chosen key. Built on React Aria's ComboBox, ComboBoxValue and TagGroup.
 */
export function MultiSelect<T extends object = object>({
  label,
  description,
  errorMessage,
  placeholder,
  isChanged = false,
  changedLabel,
  children,
  isLoading = false,
  labels,
  placement,
  popoverClassName,
  className,
  inputRef,
  allowsEmptyCollection = true,
  ...props
}: MultiSelectProps<T>): ReactElement {
  const isLabelled = present(label);
  const words = { ...DEFAULT_LABELS, ...labels };
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled field has one to read.
    isChanged: isChanged && isLabelled,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACComboBox<T, 'multiple'>
      {...props}
      selectionMode="multiple"
      allowsEmptyCollection={allowsEmptyCollection}
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      data-loading={isLoading ? '' : undefined}
      // No visible label names the field, so its placeholder is drawn in slate, as SearchField's is.
      data-unlabelled={isLabelled ? undefined : ''}
      className={composeRenderProps(className, (userClassName) => cx('field', 'multi-select', userClassName))}
    >
      {isLabelled ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <MultiSelectControl
        placeholder={placeholder}
        inputRef={inputRef}
        isLoading={isLoading}
        isDisabled={props.isDisabled ?? false}
        isReadOnly={props.isReadOnly ?? false}
        isLabelled={isLabelled}
        name={{ labelledBy: props['aria-labelledby'], label: props['aria-label'] }}
        labels={words}
      />
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      <MultiSelectPopover<T>
        className={cx('menu-popover', popoverClassName)}
        placement={placement}
        isLoading={isLoading}
        labels={words}
      >
        {children}
      </MultiSelectPopover>
    </RACComboBox>
  );
}
