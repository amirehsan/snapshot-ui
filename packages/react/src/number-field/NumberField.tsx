'use client';

import { Minus, Plus } from 'lucide-react';
import {
  useContext,
  useId,
  useMemo,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { flushSync } from 'react-dom';
import {
  Button,
  Group,
  InputContext,
  NumberField as RACNumberField,
  NumberFieldStateContext,
  ToggleButton,
  composeRenderProps,
  type InputProps as RACInputProps,
  type NumberFieldProps as RACNumberFieldProps,
  type NumberFieldRenderProps,
  type ValidationResult,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { Input } from '../text-field/Input';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { useHydrated } from '../utils/useHydrated';
import { useWarnOnce } from '../utils/useWarnOnce';
import { faceOfMinor, toMinor, toUnits } from './money';

export interface NumberFieldLabels {
  /** The sign button's name. A toggle, pressed while the value is under zero. @default 'Negative' */
  negative: string;
  /** The plus stepper's name; the field's label follows it. @default 'Increase' */
  increment: string;
  /** @default 'Decrease' */
  decrement: string;
}

export interface MoneyFormat {
  /** The currency's symbol or word, drawn beside the figure and never typed: '$', 'تومان'. */
  symbol: string;
  /** The side of the figure it sits on, in the field's direction (ruling 6). @default 'start' */
  symbolPosition?: 'start' | 'end';
  /** Digits after the decimal separator; the value counts in these minor units. @default 2 */
  fractionDigits?: 0 | 1 | 2 | 3;
}

interface NumberFieldShared extends Omit<
  RACNumberFieldProps,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'validate'
  | 'formatOptions'
  | 'step'
  | 'isWheelDisabled'
  | 'incrementAriaLabel'
  | 'decrementAriaLabel'
> {
  /**
   * The field's name, shown above the control. Required unless the field has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the control. It becomes the control's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the field is invalid. A function receives the validation result. Without
   * it the field shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Example text while empty. Taupe under a visible label, slate without one, taupe while disabled. */
  placeholder?: string;
  /**
   * Whether the value differs from the saved one. Shows the clay Changed chip in the label row and the light
   * signal orange border, and has a screen reader read the chip with the field.
   */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The number, or null while empty. In money mode an integer count of minor units. */
  value?: number | null;
  /** The number the field starts with when `value` is not given. In money mode an integer count of minor units. */
  defaultValue?: number | null;
  /**
   * Called when the value commits (blur, Enter, a step or the sign button), with null for an empty field. In
   * money mode an integer count of minor units.
   */
  onChange?: (value: number | null) => void;
  /**
   * Checks the value, in the terms `onChange` uses: an integer count of minor units in money mode, the number
   * otherwise, and null for an empty field. Returns an error message, or true or null when the value is valid.
   */
  validate?: (value: number | null) => ReturnType<NonNullable<RACNumberFieldProps['validate']>>;
  /** Values under zero, and the sign button (ruling 5). @default false */
  allowsNegative?: boolean;
  /** The names the field writes, in English unless replaced. */
  labels?: Partial<NumberFieldLabels>;
  /** A class name, or a function of the field's state, merged after the library's own classes. */
  className?:
    string | ((values: NumberFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

interface NumberMode {
  money?: undefined;
  /**
   * `Intl` options for a plain number, applied after hydration. Not `style: 'currency'`, and not compact notation,
   * whose rounding only `Intl` knows, so the face before hydration and the keyboard could not follow it.
   */
  formatOptions?: Omit<Intl.NumberFormatOptions, 'style' | 'currency' | 'notation' | 'compactDisplay'> & {
    style?: 'decimal' | 'percent' | 'unit';
  };
  /** The arrows' step, which a committed value also snaps to. @default 1 */
  step?: number;
  /** Minus and plus buttons at the inline end. @default false */
  hasStepper?: boolean;
}
interface MoneyMode {
  /**
   * Money: the value is an integer count of minor units, the symbol is drawn beside the figure, and there are no
   * steppers, no wheel and no step.
   */
  money: MoneyFormat;
  formatOptions?: never;
  step?: never;
  hasStepper?: never;
}

/** The props every number field shares, without the name rule. */
export type NumberFieldBaseProps = NumberFieldShared & (NumberMode | MoneyMode);

/** The props of a number field. A name is required: its `label`, an `aria-label` or an `aria-labelledby`. */
export type NumberFieldProps = NumberFieldBaseProps & AccessibleName<'label'>;

const DEFAULT_LABELS: NumberFieldLabels = {
  negative: 'Negative',
  increment: 'Increase',
  decrement: 'Decrease',
};

/** One options object per digit count, so React Aria never sees new format options on a render. */
const MONEY_FORMATS: Record<0 | 1 | 2 | 3, Intl.NumberFormatOptions> = {
  0: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 },
  1: { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 },
  2: { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 },
  3: { style: 'decimal', minimumFractionDigits: 3, maximumFractionDigits: 3 },
};

/**
 * The most fraction digits a plain number's options allow, read from the props and never from Intl: ECMA-402's
 * default is 3 for a decimal or a unit and 0 for a percent, or the minimum when it is larger.
 */
function fractionDigitsOf(options: NumberMode['formatOptions']): number {
  if (options?.maximumFractionDigits !== undefined) return options.maximumFractionDigits;
  return Math.max(options?.minimumFractionDigits ?? 0, options?.style === 'percent' ? 0 : 3);
}

type AppKeyDown = RACNumberFieldProps['onKeyDown'];
type AppPaste = RACNumberFieldProps['onPaste'];

/**
 * React Aria's spin button takes Home and End for the bounds (useSpinButton.mjs:85-98) and prevents the caret's
 * move. Stopped here, on the group in the capture phase, before it, the browser's default still moves the caret
 * (risk R3). The stop keeps them from the app's `onKeyDown` on the input too, so the guard calls it first, with
 * the event in the shape React Aria's keyboard handlers receive; its propagation is stopped either way.
 */
function guardKeys(onKeyDown: AppKeyDown): (event: KeyboardEvent<HTMLElement>) => void {
  return (event) => {
    if ((event.key !== 'Home' && event.key !== 'End') || !(event.target instanceof HTMLInputElement)) return;
    onKeyDown?.({
      ...event,
      preventDefault: () => {
        event.preventDefault();
      },
      isDefaultPrevented: () => event.isDefaultPrevented(),
      stopPropagation: () => undefined,
      continuePropagation: () => undefined,
      isPropagationStopped: () => true,
    });
    event.stopPropagation();
  };
}

interface InputPartProps {
  inputMode: 'decimal' | 'numeric';
  /** The input's text before hydration, or undefined from the render after. */
  face: string | undefined;
  placeholder: string | undefined;
  /** The symbol's id, read after React Aria's descriptions. */
  describedBy: string | undefined;
  inputRef: Ref<HTMLInputElement>;
}

// Rendered inside RACNumberField's Group, so the input context is the field's own.
function NumberFieldInput({
  inputMode,
  face,
  placeholder,
  describedBy,
  inputRef,
}: InputPartProps): ReactElement {
  const context = useContext(InputContext) as (RACInputProps & { ref?: Ref<HTMLInputElement> }) | null;
  // React Aria's input props (useNumberField.mjs:216-227) less its localized role description, which differs by
  // locale and would break the face; the keyboard and, before hydration, the value are set here in both passes.
  const own = useMemo(() => {
    const rest = { ...context };
    delete rest['aria-roledescription'];
    return {
      ...rest,
      inputMode,
      'aria-describedby': cx(rest['aria-describedby'], describedBy) || undefined,
      ...(face === undefined ? {} : { value: face }),
    };
  }, [context, inputMode, face, describedBy]);
  return (
    <InputContext value={own}>
      <Input ref={inputRef} className="number-field-input" placeholder={placeholder} />
    </InputContext>
  );
}

interface ControlProps {
  money: MoneyFormat | undefined;
  digits: number;
  allowsNegative: boolean;
  hasStepper: boolean;
  names: NumberFieldLabels;
  /** The field's aria-label when no visible label names it, which a stepper's name ends with. */
  fieldName: string | undefined;
  inputMode: 'decimal' | 'numeric';
  placeholder: string | undefined;
  inputRef: Ref<HTMLInputElement> | undefined;
  isLocked: boolean;
  /** The app's handlers, called from the guards that stop an event before the input. */
  onKeyDown: AppKeyDown;
  onPaste: AppPaste;
}

/** The pill: the sign button, the symbol, the input and the steppers, on React Aria's state. */
function NumberFieldControl({
  money,
  digits,
  allowsNegative,
  hasStepper,
  names,
  fieldName,
  inputMode,
  placeholder,
  inputRef,
  isLocked,
  onKeyDown,
  onPaste,
}: ControlProps): ReactElement {
  const state = useContext(NumberFieldStateContext);
  const hydrated = useHydrated();
  const symbolId = useId();
  // The input element, held in state through a callback ref so the sign button can focus it.
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, setInputElement), [inputRef]);
  const numberValue = state?.numberValue ?? Number.NaN;
  const isEmpty = Number.isNaN(numberValue);
  // The face is written from the value by integer arithmetic, in ASCII digits with no grouping (ruling 1).
  let face: string | undefined;
  if (!hydrated) {
    if (money) face = faceOfMinor(toMinor(numberValue, digits), digits);
    else face = isEmpty ? '' : String(numberValue);
  }

  // A copied figure carries the field's own symbol, which React Aria would refuse whole: its paste handler
  // commits the clipboard text as it is when the paste replaces the whole text (useNumberField.mjs:149-162).
  // The stop keeps the paste from the app's onPaste on the input too, so the guard calls it first.
  const onPasteCapture = (event: ClipboardEvent<HTMLDivElement>): void => {
    const target = event.target;
    if (!money || !state || !(target instanceof HTMLInputElement)) return;
    const text = event.clipboardData.getData('text/plain');
    if (!text.includes(money.symbol)) return;
    if ((target.selectionEnd ?? -1) - (target.selectionStart ?? 0) !== target.value.length) return;
    onPaste?.(event as unknown as ClipboardEvent<HTMLInputElement>);
    event.preventDefault();
    event.stopPropagation();
    state.commit(text.replaceAll(money.symbol, '').trim());
  };

  const toggleSign = (): void => {
    if (!state) return;
    if (!isEmpty && numberValue !== 0) {
      // Held within the bounds as React Aria's commit clamps, then validated as its steppers are.
      const negated = Math.min(
        Math.max(-numberValue, state.minValue ?? -Infinity),
        state.maxValue ?? Infinity,
      );
      state.setNumberValue(negated);
      state.commitValidation();
      return;
    }
    // An empty field, or zero, which has no sign to turn, takes a minus to type after, since neither phone's
    // decimal keyboard has one.
    flushSync(() => {
      state.setInputValue('-');
    });
    inputElement?.focus();
    inputElement?.setSelectionRange(1, 1);
  };

  const stepName = (word: string): string => (fieldName ? `${word} ${fieldName}` : word);
  const symbol = money ? (
    <span className="number-field-symbol" id={symbolId}>
      {money.symbol}
    </span>
  ) : null;
  const symbolAtEnd = money?.symbolPosition === 'end';

  return (
    <Group
      className="number-field-control"
      onKeyDownCapture={guardKeys(onKeyDown)}
      onPasteCapture={onPasteCapture}
    >
      {allowsNegative ? (
        // A toggle, since a Button inside a NumberField must name one of its slots (spec correction 7).
        <ToggleButton
          className="input-button number-field-sign"
          aria-label={names.negative}
          isSelected={numberValue < 0}
          isDisabled={isLocked}
          onChange={toggleSign}
        >
          <Minus aria-hidden="true" />
        </ToggleButton>
      ) : null}
      {symbolAtEnd ? null : symbol}
      <NumberFieldInput
        inputMode={inputMode}
        face={face}
        placeholder={placeholder}
        describedBy={money ? symbolId : undefined}
        inputRef={ref}
      />
      {symbolAtEnd ? symbol : null}
      {hasStepper && !money ? (
        <>
          {/* Named from labels, which keeps React Aria's aria-labelledby of the button and the field's label
              after it; React Aria's incrementAriaLabel would drop it (spec correction 10). */}
          <Button
            slot="decrement"
            className="input-button number-field-step"
            aria-label={stepName(names.decrement)}
          >
            <Minus aria-hidden="true" />
          </Button>
          <Button
            slot="increment"
            className="input-button number-field-step"
            aria-label={stepName(names.increment)}
          >
            <Plus aria-hidden="true" />
          </Button>
        </>
      ) : null}
    </Group>
  );
}

interface HiddenProps {
  name: string;
  form: string | undefined;
  isDisabled: boolean;
  digits: number;
}

/** Money mode's own hidden input, holding the minor units React Aria's would hold as whole units (spec correction 4). */
function MoneyHiddenInput({ name, form, isDisabled, digits }: HiddenProps): ReactElement {
  const state = useContext(NumberFieldStateContext);
  const minor = toMinor(state?.numberValue ?? Number.NaN, digits);
  return (
    <input
      type="hidden"
      name={name}
      form={form}
      disabled={isDisabled || undefined}
      value={minor === null ? '' : String(minor)}
    />
  );
}

/**
 * A number, or with `money` an amount of money: the figure in the field, the app's symbol beside it, a sign
 * toggle for negatives, and an integer count of minor units for its value, so a URL and a database hold it
 * exactly. Every phone gets the decimal keyboard; Home and End move the caret; `onChange` fires when the value
 * commits. Before hydration the field shows the plain figure ("1234.50") and React Aria's formatted text from
 * the next render, so the server's HTML is the same in every locale and zone. Built on React Aria's NumberField.
 */
export function NumberField({
  label,
  description,
  errorMessage,
  placeholder,
  isChanged = false,
  changedLabel,
  value,
  defaultValue,
  onChange,
  validate,
  allowsNegative = false,
  labels,
  className,
  style,
  inputRef,
  money,
  formatOptions,
  step,
  hasStepper = false,
  minValue,
  maxValue,
  name,
  form,
  ...props
}: NumberFieldProps): ReactElement {
  const isLabelled = present(label);
  const names = { ...DEFAULT_LABELS, ...labels };
  const digits = money ? (money.fractionDigits ?? 2) : 0;

  // Money is an integer count of minor units; one that is not is rounded, with a warning. React Aria holds it
  // as minor / 10 ** digits, and a count past 2 ** 52 / 10 ** digits is not held to the minor unit: a warning.
  const given = money ? [value, defaultValue].filter((each) => typeof each === 'number') : [];
  const fractional = given.find((each) => !Number.isInteger(each));
  useWarnOnce(
    fractional === undefined
      ? null
      : `NumberField takes an integer count of minor units in money mode; ${String(fractional)} is rounded to ${String(Math.round(fractional))}.`,
  );
  const exactLimit = 2 ** 52 / 10 ** digits;
  const inexact = given.find((each) => Math.abs(each) > exactLimit);
  useWarnOnce(
    inexact === undefined
      ? null
      : `NumberField holds money exactly only up to 2 ** 52 / 10 ** fractionDigits minor units (${String(exactLimit)}); ${String(inexact)} is past it and can come back a minor unit off.`,
  );
  useWarnOnce(
    !allowsNegative && minValue !== undefined && minValue < 0
      ? 'NumberField has a minValue under zero without allowsNegative, so its lower bound is 0. Pass allowsNegative to allow values under zero.'
      : null,
  );

  /** A value in the app's terms as React Aria's number: whole units in money mode, NaN for empty. */
  const toAria = (each: number | null | undefined): number | undefined => {
    if (each === undefined) return undefined;
    if (each === null) return Number.NaN;
    return money ? toUnits(Math.round(each), digits) : each;
  };
  /** React Aria's number in the app's terms: minor units in money mode, null for empty, never -0. */
  const fromAria = (each: number): number | null =>
    // Adding 0 turns a typed "-0" into 0.
    money ? toMinor(each, digits) : Number.isNaN(each) ? null : each + 0;
  // Negatives are off unless asked for: the lower bound is then 0, or the app's bound when it is above 0.
  const lower = allowsNegative ? minValue : Math.max(minValue ?? 0, 0);
  const boundToAria = (bound: number | undefined): number | undefined =>
    bound === undefined ? undefined : money ? toUnits(bound, digits) : bound;

  const inputMode = money || fractionDigitsOf(formatOptions) > 0 ? 'decimal' : 'numeric';
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled field has one to read.
    isChanged: isChanged && isLabelled,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  // The symbol's room is its length in ch, a property of the string and not a measurement.
  const room = money ? `calc(${String(money.symbol.length)}ch + 0.5rem)` : undefined;

  return (
    <RACNumberField
      {...props}
      value={toAria(value)}
      defaultValue={toAria(defaultValue)}
      onChange={(next) => {
        onChange?.(fromAria(next));
      }}
      // React Aria checks its own number, whole units in money mode and NaN for empty; the app's check gets its own.
      validate={validate === undefined ? undefined : (next) => validate(fromAria(next))}
      minValue={boundToAria(lower)}
      maxValue={boundToAria(maxValue)}
      formatOptions={money ? MONEY_FORMATS[money.fractionDigits ?? 2] : formatOptions}
      // Unset in money mode, so a typed 12.50 is never snapped (useNumberFieldState.mjs:23-33).
      step={money ? undefined : step}
      isWheelDisabled={money ? true : undefined}
      // Money mode writes its own hidden input, in minor units.
      name={money ? undefined : name}
      form={money ? undefined : form}
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      data-unlabelled={isLabelled ? undefined : ''}
      data-money={money ? '' : undefined}
      data-signed={allowsNegative ? '' : undefined}
      data-stepper={hasStepper && !money ? '' : undefined}
      data-symbol={money ? (money.symbolPosition ?? 'start') : undefined}
      className={composeRenderProps(className, (userClassName) => cx('field', 'number-field', userClassName))}
      style={
        room === undefined
          ? style
          : composeRenderProps(
              style,
              (userStyle) => ({ '--number-field-symbol': room, ...userStyle }) as CSSProperties,
            )
      }
    >
      {isLabelled ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <NumberFieldControl
        money={money}
        digits={digits}
        allowsNegative={allowsNegative}
        hasStepper={hasStepper}
        names={names}
        fieldName={isLabelled ? undefined : props['aria-label']}
        inputMode={inputMode}
        placeholder={placeholder}
        inputRef={inputRef}
        isLocked={props.isDisabled === true || props.isReadOnly === true}
        onKeyDown={props.onKeyDown}
        onPaste={props.onPaste}
      />
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      {money && name !== undefined ? (
        <MoneyHiddenInput name={name} form={form} isDisabled={props.isDisabled === true} digits={digits} />
      ) : null}
    </RACNumberField>
  );
}
