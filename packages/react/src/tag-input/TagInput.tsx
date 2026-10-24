'use client';

import { X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type CompositionEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button,
  Input as RACInput,
  LabelContext,
  Tag,
  TagGroup,
  TagList,
  TextField as RACTextField,
  composeRenderProps,
  useSlottedContext,
  type Key,
  type TextFieldProps as RACTextFieldProps,
  type TextFieldRenderProps,
  type ValidationResult,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldChangedMark } from '../field/FieldChangedMark';
import { FieldCounter } from '../field/FieldCounter';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { afterCommit, focusIsLost, focusNamedPlace } from '../utils/focus-after-commit';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { QUIET_MS } from '../utils/quiet';
import { useControllableState } from '../utils/useControllableState';
import { commitText, hasDelimiter, type CommitResult } from './commit';
import type { TagInputPreset } from './presets';

export interface TagInputLabels {
  /** The tags' group name, read with the field's label: "Added, Invite people". @default 'Added' */
  added: string;
  /** Each tag's remove button, read with the tag's text: "Remove ana@example.com". @default 'Remove' */
  remove: string;
  /** Said after values are added, gathered over QUIET_MS. @default "Added ana@example.com", then "Added 12" */
  addedMessage: (values: readonly string[], format: (count: number) => string) => string;
  /** Said when a value is already there. @default (value) => `${value} is already added` */
  duplicate: (value: string) => string;
  /** The error line past the limit. @default (max) => `You can add up to ${max}` */
  tooMany: (max: string) => string;
  /** Said when Backspace or Enter takes a tag back into the text. @default (value) => `Editing ${value}` */
  editing: (value: string) => string;
  /** Said when Backspace, Delete or the remove button takes a tag away. @default (value) => `Removed ${value}` */
  removed: (value: string) => string;
}

export interface TagInputBaseProps extends Omit<
  RACTextFieldProps,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'validate'
  | 'type'
  | 'pattern'
  | 'minLength'
  | 'maxLength'
> {
  /** The field's name, shown above it. Required unless the field has an `aria-label` or an `aria-labelledby`. */
  label?: ReactNode;
  /** A hint under the field, such as which characters end a value. It becomes the box's description. */
  description?: ReactNode;
  /**
   * The error line for the app's own validation, shown while the field is invalid. A function receives the
   * validation result. Text the preset refuses, and the limit, show their own words instead.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Shown only while there are no tags. Taupe under a visible label, slate without one (MultiSelect's rule). */
  placeholder?: string;
  /** Whether the value differs from the saved one: the Changed chip and the changed edge, or the changed dot without a label. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The values, in the order added. Controlled. */
  value?: readonly string[];
  /** @default [] */
  defaultValue?: readonly string[];
  /** Called with the new values after an add, a removal or a take-back. Never with a value the preset refuses. */
  onChange?: (value: string[]) => void;
  /** The text being typed, which is not part of the value. Controlled. */
  inputValue?: string;
  /** The text the box starts with. @default '' */
  defaultInputValue?: string;
  /** Called as the text changes. */
  onInputChange?: (text: string) => void;
  /** How text becomes values. @default split on commas and new lines, trimmed, any non-empty text */
  preset?: TagInputPreset;
  /** The most values. Past it nothing is added, and the error line says so. */
  maxValues?: number;
  /** Adds the typed text when focus leaves the field, if it passes. @default true */
  commitsOnBlur?: boolean;
  /**
   * Checks the whole list, as React Aria's `validate` does for one value: a message, or several, for a list that
   * fails.
   */
  validate?: (value: readonly string[]) => string | string[] | true | null | undefined;
  /** How counts are written, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  /** The library's own words. */
  labels?: Partial<TagInputLabels>;
  /** A class name, or a function of the field's state, merged after the library's own classes. */
  className?: string | ((values: TextFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the text box. */
  inputRef?: Ref<HTMLInputElement>;
}

/** The props of a tag input. A name is required: its `label`, an `aria-label` or an `aria-labelledby`. */
export type TagInputProps = TagInputBaseProps & AccessibleName<'label'>;

const DEFAULT_LABELS: TagInputLabels = {
  added: 'Added',
  remove: 'Remove',
  addedMessage: (values, format) =>
    values.length === 1 ? `Added ${values[0] ?? ''}` : `Added ${format(values.length)}`,
  duplicate: (value) => `${value} is already added`,
  tooMany: (max) => `You can add up to ${max}`,
  editing: (value) => `Editing ${value}`,
  removed: (value) => `Removed ${value}`,
};

/** With no preset: split on commas and new lines, trimmed, any non-empty text, compared exactly. Not exported. */
const PLAIN: TagInputPreset = {
  split: (text) => text.split(/[,\r\n]+/),
  normalize: (value) => value.trim(),
  isValid: (value) => value !== '',
  delimiters: [','],
  join: ', ',
  invalidMessage: () => 'Enter a value',
};

const NONE: readonly string[] = [];

/** Why text was left in the box, with how many the preset refused. */
interface Refusal {
  reason: 'invalid' | 'limit';
  refused: number;
}

/** What the status gathers over QUIET_MS, in the order it happened. */
type Heard = { kind: 'added'; values: readonly string[] } | { kind: 'said'; words: string };

/** The tags' `aria-label` and `aria-labelledby`, MultiSelect's naming: "Added" and the field's own name. */
function tagsName(
  added: string,
  labelledBy: string | undefined,
  label: string | undefined,
): { 'aria-label': string; 'aria-labelledby': string | undefined } {
  if (labelledBy !== undefined) return { 'aria-label': added, 'aria-labelledby': labelledBy };
  return { 'aria-label': label === undefined ? added : `${added} ${label}`, 'aria-labelledby': undefined };
}

/** Each value's tag id: the value, or the value and its place for a second copy an app passed. */
function tagIds(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.map((value, at) => {
    if (!seen.has(value)) {
      seen.add(value);
      return value;
    }
    return `${value}\u0000${String(at)}`;
  });
}

interface ControlProps {
  values: readonly string[];
  ids: string[];
  tagsId: string;
  placeholder: string | undefined;
  isDisabled: boolean;
  isReadOnly: boolean;
  isLabelled: boolean;
  ariaLabel: string | undefined;
  ariaLabelledBy: string | undefined;
  labels: TagInputLabels;
  textDir: string | undefined;
  /** The app's ref to the box. */
  inputRef: Ref<HTMLInputElement> | undefined;
  /** The field's own ref to the box. */
  boxRef: Ref<HTMLInputElement>;
  frameRef: Ref<HTMLDivElement>;
  inputProps: {
    required: boolean;
    'aria-required': true | undefined;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
    onCompositionStart: () => void;
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
  };
  onRemove: (keys: Set<Key>) => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  /** The changed mark of a field with no label, at the frame's end. */
  children: ReactNode;
}

/**
 * The frame: the values as tags, then the box. It wears `.input`, so every edge the field's root sets reaches it,
 * and is a plain div, so no focus-within ring draws on it while a tag holds focus (MultiSelect's frame).
 */
function TagInputControl({
  values,
  ids,
  tagsId,
  placeholder,
  isDisabled,
  isReadOnly,
  isLabelled,
  ariaLabel,
  ariaLabelledBy,
  labels,
  textDir,
  inputRef,
  boxRef,
  frameRef,
  inputProps,
  onRemove,
  onTagKeyDown,
  onBlur,
  children,
}: ControlProps): ReactElement {
  // The field label's id, so the tags' grid is named "Added" and the label. React Aria gives the label context an
  // id even when no label is drawn, so it is taken only with a visible label.
  const labelId = useSlottedContext(LabelContext)?.id;
  const named = tagsName(labels.added, isLabelled ? labelId : ariaLabelledBy, ariaLabel);
  const ownFrameRef = useRef<HTMLDivElement>(null);
  const frame = useMemo(() => mergeRefs(frameRef, ownFrameRef), [frameRef]);
  const box = useMemo(() => mergeRefs(inputRef, boxRef), [inputRef, boxRef]);

  /** A press on the frame's empty room, outside a tag and the box, is a press on the box. */
  const onFrameMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
    if (isDisabled || !(event.target instanceof Element)) return;
    if (event.target.closest('.tag-input-tag, .tag-input-input')) return;
    event.preventDefault();
    ownFrameRef.current?.querySelector<HTMLInputElement>('.tag-input-input')?.focus();
  };

  const items = values.map((value, at) => ({ id: ids[at] ?? value, text: value }));
  let tags: ReactNode = null;
  if (values.length > 0 && isDisabled) {
    // React Aria's tag grid keeps itself in the tab order even when every tag is disabled, so a disabled field
    // draws a group read and never focused, MultiSelect's rule.
    tags = (
      <div id={tagsId} className="tag-input-tags">
        <div
          role="group"
          className="tag-input-tag-list"
          aria-label={named['aria-label']}
          aria-labelledby={
            named['aria-labelledby'] === undefined ? undefined : `${tagsId}-list ${named['aria-labelledby']}`
          }
          id={`${tagsId}-list`}
          aria-disabled="true"
        >
          {items.map((item) => (
            <div key={item.id} className="tag-input-tag">
              <span className="tag-input-tag-text" dir={textDir}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (values.length > 0) {
    tags = (
      <TagGroup
        id={tagsId}
        className="tag-input-tags"
        {...named}
        // Read only, the tags are read and focused and never removed: no onRemove, no remove buttons.
        onRemove={isReadOnly ? undefined : onRemove}
      >
        <TagList className="tag-input-tag-list" items={items}>
          {(item) => (
            <Tag id={item.id} textValue={item.text} className="tag-input-tag">
              <span className="tag-input-tag-text" dir={textDir}>
                {item.text}
              </span>
              {isReadOnly ? null : (
                // Out of the tab order: the tags are one stop, and Backspace or Delete on a tag removes it.
                <Button
                  slot="remove"
                  className="tag-input-tag-remove"
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
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a press on the frame's empty room is a press on its box, and Enter on a tag takes it back; the box and the tags keep their own roles
    <div
      ref={frame}
      className="input tag-input-control"
      data-disabled={isDisabled ? '' : undefined}
      onMouseDown={onFrameMouseDown}
      onKeyDownCapture={onTagKeyDown}
      onBlur={onBlur}
    >
      {tags}
      <RACInput
        ref={box}
        className="tag-input-input"
        placeholder={values.length === 0 ? placeholder : undefined}
        dir={textDir}
        {...inputProps}
      />
      {children}
    </div>
  );
}

/**
 * A field for a list of values typed or pasted: addresses to invite, domains to allow, paths to exclude. Enter or
 * a delimiter ends a value, a pasted list is split at once, and Backspace in the empty box, or Enter on a tag,
 * takes a value back into the text to fix it. The value only ever holds what the preset accepts: refused text
 * stays in the box with the error line, and the form will not submit while it does. With `name`, each value
 * submits as its own entry. Drawn with MultiSelect's frame and tags. Built on React Aria's TextField and TagGroup.
 */
export function TagInput({
  label,
  description,
  errorMessage,
  placeholder,
  isChanged = false,
  changedLabel,
  value,
  defaultValue,
  onChange,
  inputValue,
  defaultInputValue,
  onInputChange,
  preset = PLAIN,
  maxValues,
  commitsOnBlur = true,
  validate,
  formatCount = String,
  labels: given,
  className,
  ref,
  inputRef,
  name,
  form,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  validationBehavior = 'native',
  ...props
}: TagInputProps): ReactElement {
  const labels: TagInputLabels = { ...DEFAULT_LABELS, ...given };
  const isLabelled = present(label);
  const tell = useCallback(
    (next: readonly string[]) => {
      onChange?.([...next]);
    },
    [onChange],
  );
  const [values, setValues] = useControllableState<readonly string[]>(value, defaultValue ?? NONE, tell);
  const [text, setText] = useControllableState(inputValue, defaultInputValue ?? '', onInputChange);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [said, setSaid] = useState<{ key: number; text: string } | null>(null);
  const tagsId = useId();
  const ids = tagIds(values);
  const boxRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const heard = useRef<Heard[]>([]);
  const quiet = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const spoken = useRef(0);
  const cancelMove = useRef<(() => void) | undefined>(undefined);
  // The box's attributes go to React Aria's field, which writes them on the input; the direction goes on the input
  // and each tag's text. React Aria types spellCheck as the attribute's string.
  const { dir: textDir, spellCheck, ...boxProps } = preset.inputProps ?? {};

  useEffect(
    () => () => {
      clearTimeout(quiet.current);
      cancelMove.current?.();
    },
    [],
  );

  /** Gathers what to say, and says it once QUIET_MS after the first, so a burst of adds is one sentence. */
  const say = (item: Heard): void => {
    heard.current.push(item);
    if (quiet.current !== undefined) return;
    quiet.current = setTimeout(() => {
      quiet.current = undefined;
      const items = heard.current;
      heard.current = [];
      const added = items.flatMap((each) => (each.kind === 'added' ? each.values : []));
      const parts: string[] = [];
      let addedSaid = false;
      for (const each of items) {
        if (each.kind === 'said') parts.push(each.words);
        else if (!addedSaid) {
          addedSaid = true;
          parts.push(labels.addedMessage(added, formatCount));
        }
      }
      spoken.current += 1;
      setSaid({ key: spoken.current, text: parts.join('. ') });
    }, QUIET_MS);
  };

  /** Applies a commit: the values, the text, the reason and what to say. */
  const apply = (result: CommitResult, mode: 'typed' | 'enter'): void => {
    if (result.added.length > 0) setValues(result.values);
    setText(result.text);
    setRefusal(
      mode === 'enter' && result.reason !== null ? { reason: result.reason, refused: result.refused } : null,
    );
    if (result.added.length > 0) say({ kind: 'added', values: result.added });
    for (const duplicate of result.duplicates) say({ kind: 'said', words: labels.duplicate(duplicate) });
  };

  const commit = (current: string, mode: 'typed' | 'enter'): void => {
    apply(commitText(current, values, preset, { maxValues, mode }), mode);
  };

  /**
   * Moves focus from a tag that is leaving to a named place, never the body (lessons 10 and 16). While the field
   * holds focus, it goes to `now` at once, in the key's or the press's handler, so the tag never holds focus as it
   * leaves: an engine blurs a removed element to nothing. In the frame after the commit, if focus was lost all the
   * same, it goes to `later`'s place in the new tags, else the box; and the caret goes to the box's end.
   */
  const moveFocus = (
    now: HTMLElement | null,
    later: (frame: HTMLElement) => HTMLElement | null,
    caretToEnd: boolean,
  ): void => {
    const held = frameRef.current?.contains(document.activeElement) === true;
    if (held) now?.focus();
    cancelMove.current?.();
    cancelMove.current = afterCommit(() => {
      const frame = frameRef.current;
      if (!frame?.isConnected) return;
      const active = document.activeElement;
      if (!focusIsLost() && !frame.contains(active)) return;
      const target =
        focusIsLost() || (held && active !== now) ? focusNamedPlace(later(frame) ?? boxRef.current) : active;
      if (caretToEnd && target instanceof HTMLInputElement) {
        const end = target.value.length;
        target.setSelectionRange(end, end);
      }
    });
  };

  /** Takes the value at `index` back into the box, to fix it: out of the value, its text at the box's end. */
  const takeBack = (index: number): void => {
    const taken = values[index];
    if (taken === undefined) return;
    setValues(values.filter((_, at) => at !== index));
    const current = boxRef.current?.value ?? text;
    setText(current === '' ? taken : `${current}${preset.join}${taken}`);
    setRefusal(null);
    moveFocus(boxRef.current, () => boxRef.current, true);
    say({ kind: 'said', words: labels.editing(taken) });
  };

  const onTextChange = (next: string): void => {
    setRefusal(null);
    // An input method's text is the reader's until it ends: a Persian or Chinese word is never cut in half.
    if (composing.current || !hasDelimiter(next, preset)) {
      setText(next);
      return;
    }
    // Delimiters are read from the text, never from keydown, which Android keyboards report as Unidentified.
    commit(next, 'typed');
  };

  /**
   * A pasted list is committed whole at once. A text box strips the line breaks from its value, so the list goes
   * into the text here, its breaks kept, and is split as it was copied. A paste with no delimiter is the
   * browser's, and stays in the box for Enter.
   */
  const onPaste = (event: ClipboardEvent<HTMLInputElement>): void => {
    if (isReadOnly || isDisabled) return;
    const data = event.clipboardData.getData('text/plain');
    if (!hasDelimiter(data, preset)) return;
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    commit(`${input.value.slice(0, start)}${data}${input.value.slice(end)}`, 'enter');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    const current = event.currentTarget.value;
    if (event.key === 'Enter') {
      // Safari ends a composition before its Enter's keydown, which then reports keyCode 229.
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- keyCode 229 is how Safari marks an input method's Enter; nothing replaces it
      if (event.nativeEvent.isComposing || event.keyCode === 229 || current === '') return;
      event.preventDefault();
      commit(current, 'enter');
      return;
    }
    if (event.key === 'Escape') {
      if (current === '') return;
      // Stopped here, so a Dialog around the field stays open until the next Escape.
      event.preventDefault();
      event.stopPropagation();
      setText('');
      setRefusal(null);
      return;
    }
    if (event.key === 'Backspace' && current === '' && !event.repeat && !isReadOnly && !isDisabled) {
      if (values.length === 0) return;
      // One tag per press: a held key's repeats then delete the taken text a letter at a time.
      event.preventDefault();
      takeBack(values.length - 1);
    }
  };

  /**
   * Enter on a tag takes it back into the box; the tag's own Backspace and Delete remove it, once per press. React
   * Aria's tags take a held key's repeats too, and focus moves to the next tag, so a held key would empty the list.
   */
  const onTagKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!(event.target instanceof HTMLElement) || !event.target.classList.contains('tag-input-tag')) return;
    if (event.repeat && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key !== 'Enter' || isReadOnly || isDisabled) return;
    const tags = [...(frameRef.current?.querySelectorAll('.tag-input-tag') ?? [])];
    const index = tags.indexOf(event.target);
    if (index === -1) return;
    event.preventDefault();
    event.stopPropagation();
    takeBack(index);
  };

  const onRemove = (keys: Set<Key>): void => {
    const index = ids.findIndex((id) => keys.has(id));
    if (index === -1) return;
    const removed = values.filter((_, at) => keys.has(ids[at] ?? ''));
    const kept = values.filter((_, at) => !keys.has(ids[at] ?? ''));
    // The next tag, else the one before, else the box: never the body (MultiSelect's rule).
    const tags = [...(frameRef.current?.querySelectorAll<HTMLElement>('.tag-input-tag') ?? [])];
    const after = tags.slice(index + 1).find((tag, at) => !keys.has(ids[index + 1 + at] ?? ''));
    const before = tags
      .slice(0, index)
      .reverse()
      .find((tag, at) => !keys.has(ids[index - 1 - at] ?? ''));
    moveFocus(
      after ?? before ?? boxRef.current,
      (frame) => {
        const drawn = frame.querySelectorAll<HTMLElement>('.tag-input-tag');
        return drawn[index] ?? drawn[index - 1] ?? null;
      },
      false,
    );
    setValues(kept);
    for (const each of removed) say({ kind: 'said', words: labels.removed(each) });
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (!commitsOnBlur || isReadOnly || isDisabled) return;
    const next = event.relatedTarget;
    if (next instanceof Node && frameRef.current?.contains(next)) return;
    const current = boxRef.current?.value ?? '';
    if (current.trim() === '') return;
    commit(current, 'enter');
  };

  // A form's reset puts back the value of the first render and clears the text and the error, as React Aria's
  // fields do. React Aria's own reset of the box puts its first text back.
  // Text typed before hydration is in the box when React adopts it, and React's first update would put the
  // controlled text back over it. Read once in the hydrating commit, before that update, it becomes the text, and
  // a delimiter in it ends a value as if typed now (risk R3).
  useLayoutEffect(() => {
    const typed = boxRef.current?.value ?? '';
    if (typed !== '' && typed !== text) onTextChange(typed);
    // Once, at mount: later text is React's own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [first] = useState(values);
  useEffect(() => {
    const owner = boxRef.current?.form;
    if (!owner) return;
    const onReset = (): void => {
      setValues(first);
      setRefusal(null);
    };
    owner.addEventListener('reset', onReset);
    return () => {
      owner.removeEventListener('reset', onReset);
    };
  }, [first, form, setValues]);

  const ownMessage =
    refusal === null
      ? null
      : refusal.reason === 'invalid'
        ? preset.invalidMessage(formatCount(refusal.refused))
        : labels.tooMany(formatCount(maxValues ?? values.length));

  // React Aria runs this as it runs its own validation: the box's custom validity holds refused text, so the form
  // will not submit while it is there, then the app's check of the whole list.
  const fieldValidate = useCallback(
    () => ownMessage ?? validate?.(values) ?? null,
    [ownMessage, validate, values],
  );

  // A commit is the field's change: React Aria shows native validation on the box's change event, so the error
  // line follows a refusal, a fix and a list change at once rather than at the next blur.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    boxRef.current?.dispatchEvent(new Event('change'));
  }, [ownMessage, values]);

  const { chipId, markId, describedBy } = useChangedDescription({
    isChanged,
    isInvalid: props.isInvalid,
    describedBy: [props['aria-describedby'], values.length > 0 ? tagsId : undefined]
      .filter((id) => id !== undefined)
      .join(' '),
    isLabelled,
  });

  const counter =
    maxValues === undefined ? null : (
      <FieldCounter
        count={values.length}
        budget={maxValues}
        showFrom={0}
        label={({ count, budget }) => `${formatCount(count)}/${formatCount(budget)}`}
      />
    );

  const required = isRequired && validationBehavior === 'native' && values.length === 0;

  return (
    <RACTextField
      {...props}
      {...boxProps}
      spellCheck={spellCheck === undefined ? undefined : String(spellCheck)}
      // React's types leave autoCorrect out of an input's attributes; Safari reads it (risk R3).
      autoCorrect="off"
      ref={ref}
      form={form}
      value={text}
      onChange={onTextChange}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isInvalid={props.isInvalid}
      validationBehavior={validationBehavior}
      validate={fieldValidate}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      data-changed={isChanged ? '' : undefined}
      data-unlabelled={isLabelled ? undefined : ''}
      data-ltr={textDir === 'ltr' ? '' : undefined}
      className={composeRenderProps(className, (userClassName) => cx('field', 'tag-input', userClassName))}
    >
      {isLabelled ? (
        <FieldHead label={label} changedLabel={changedLabel} chipId={chipId}>
          {counter}
        </FieldHead>
      ) : null}
      <TagInputControl
        values={values}
        ids={ids}
        tagsId={tagsId}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isLabelled={isLabelled}
        ariaLabel={props['aria-label']}
        ariaLabelledBy={props['aria-labelledby']}
        labels={labels}
        textDir={textDir}
        inputRef={inputRef}
        boxRef={boxRef}
        frameRef={frameRef}
        inputProps={{
          required,
          'aria-required': isRequired ? true : undefined,
          onKeyDown,
          onPaste,
          onCompositionStart: () => {
            composing.current = true;
          },
          onCompositionEnd: (event) => {
            composing.current = false;
            const current = event.currentTarget.value;
            if (hasDelimiter(current, preset)) commit(current, 'typed');
          },
        }}
        onRemove={onRemove}
        onTagKeyDown={onTagKeyDown}
        onBlur={onBlur}
      >
        {isChanged && !isLabelled ? <FieldChangedMark id={markId} label={changedLabel} /> : null}
      </TagInputControl>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{ownMessage ?? errorMessage}</FieldError>
      {isLabelled ? null : counter}
      {name === undefined
        ? null
        : (values.length === 0 ? [''] : values).map((each, at) => (
            <input key={at} type="hidden" name={name} value={each} form={form} disabled={isDisabled} />
          ))}
      <div className="tag-input-status" role="status" aria-live="polite">
        {said === null ? null : <span key={said.key}>{said.text}</span>}
      </div>
    </RACTextField>
  );
}
