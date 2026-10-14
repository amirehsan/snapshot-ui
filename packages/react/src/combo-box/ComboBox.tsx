'use client';

import { ChevronDown } from 'lucide-react';
import { useContext, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  Button,
  ComboBox as RACComboBox,
  ComboBoxStateContext,
  GroupContext,
  ListBox,
  composeRenderProps,
  useSlottedContext,
  type ComboBoxProps as RACComboBoxProps,
  type ComboBoxRenderProps,
  type ValidationResult,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { Popover, type Placement } from '../popover/Popover';
import { Spinner } from '../spinner/Spinner';
import { Input } from '../text-field/Input';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface PickerLabels {
  /**
   * The button's name.
   * @default 'Show options'
   */
  open: string;
  /**
   * The line an open list shows when nothing matches.
   * @default 'No matches'
   */
  empty: string;
  /**
   * The Spinner's name, and the line an empty list shows while options load.
   * @default 'Loading'
   */
  loading: string;
}

export interface ComboBoxBaseProps<T extends object = object> extends Omit<
  RACComboBoxProps<T>,
  'children' | 'className' | 'selectionMode' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
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
   * Example text while the input is empty, the input's placeholder: taupe under a visible label, slate when only
   * an `aria-label` or an `aria-labelledby` names the field, since it is then the only words shown.
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
  /** `PickerOption`s and `PickerSection`s, or a function that renders one option of `items` or `defaultItems`. */
  children: ReactNode | ((item: T) => ReactElement);
  /**
   * Whether the list stays open when nothing matches, saying so with the no-matches line, or the loading line
   * while options load, rather than vanishing as if the field broke.
   * @default true
   */
  allowsEmptyCollection?: boolean;
  /** Shows the Spinner in the field while the app loads options. The list keeps what it has. */
  isLoading?: boolean;
  /** The library's own words: the button's name, the no-matches line and the loading line. */
  labels?: Partial<PickerLabels>;
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
 * The props of a combo box. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type ComboBoxProps<T extends object = object> = ComboBoxBaseProps<T> & AccessibleName<'label'>;

const DEFAULT_LABELS: PickerLabels = { open: 'Show options', empty: 'No matches', loading: 'Loading' };

interface ControlProps {
  placeholder: string | undefined;
  inputRef: Ref<HTMLInputElement> | undefined;
  isLoading: boolean;
  labels: PickerLabels;
}

/**
 * The input, the Spinner while options load, and the field button, in one positioned box. React Aria opens the
 * list against the element its group ref holds, and takes that element's width as the list's least width
 * (ComboBox.mjs:152-156, 280-287), so the box takes the ref and the list aligns to and matches the drawn control.
 * It is a plain div and not React Aria's Group, which would bring a group role and a focus-within ring with it
 * (spec correction 7).
 */
function ComboBoxControl({ placeholder, inputRef, isLoading, labels }: ControlProps): ReactElement {
  const group = useSlottedContext(GroupContext);
  return (
    <div ref={group?.ref} className="combo-box-control">
      <Input ref={inputRef} className="combo-box-input" placeholder={placeholder} />
      {isLoading ? (
        <span className="combo-box-spinner">
          <Spinner size="md" aria-label={labels.loading} />
        </span>
      ) : null}
      {/* React Aria keeps it out of the tab order and takes no focus on a press, so focus stays in the input;
          it holds the button pressed while the list is open. Its own name would be React Aria's localized
          text; this one is the library's, replaceable for a Persian page. */}
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
  labels: PickerLabels;
  children: ReactNode | ((item: T) => ReactElement);
}

/**
 * The popover and its list, or the options alone. React Aria renders a combo box's children a second time,
 * hidden, to build its collection, and its Popover renders its content in that pass too, on the server as well.
 * There the combo box's state is not provided yet, so this renders a bare ListBox, which is all the collection
 * needs: the library popover's focus handling stays out of the hidden pass, as Select's does.
 */
function ComboBoxPopover<T extends object>({
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
        className="menu combo-box-list"
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
 * A text field that filters a list as you type and chooses one option: the text input's pill with a field
 * button at its end that shows every option, opening Select's list of `PickerOption` rows under it. An option
 * stays while its text contains what was typed, case and accents aside. With nothing matching the list stays
 * open with a line that says so. For options from a server, pass `items` and `inputValue`, fetch in
 * `onInputChange`, and set `isLoading` while you wait: React Aria does not filter controlled items. Keep the
 * chosen item among `items`, since React Aria puts its text back from them. It takes `value`, `defaultValue` and
 * `onChange`. Built on React Aria's ComboBox.
 */
export function ComboBox<T extends object = object>({
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
}: ComboBoxProps<T>): ReactElement {
  const isLabelled = present(label);
  const words = { ...DEFAULT_LABELS, ...labels };
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled field has one to read.
    isChanged: isChanged && isLabelled,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACComboBox<T>
      {...props}
      allowsEmptyCollection={allowsEmptyCollection}
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      data-loading={isLoading ? '' : undefined}
      // Without a visible label the placeholder is the only words shown, so combo-box.css draws it slate.
      data-unlabelled={isLabelled ? undefined : ''}
      className={composeRenderProps(className, (userClassName) => cx('field', 'combo-box', userClassName))}
    >
      {isLabelled ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <ComboBoxControl placeholder={placeholder} inputRef={inputRef} isLoading={isLoading} labels={words} />
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      <ComboBoxPopover<T>
        className={cx('menu-popover', popoverClassName)}
        placement={placement}
        isLoading={isLoading}
        labels={words}
      >
        {children}
      </ComboBoxPopover>
    </RACComboBox>
  );
}
