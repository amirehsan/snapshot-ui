'use client';

import { Plus } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type Key,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Button } from '../button/Button';
import { FieldChanged } from '../field/FieldChanged';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import {
  afterCommit,
  firstFocusable,
  focusIsLost,
  focusNamedPlace,
  takesFocus,
} from '../utils/focus-after-commit';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { useControllableState } from '../utils/useControllableState';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface RepeaterRow {
  /** Stable across adds, removes and saves: the app's id, or one `createRow` made. */
  id: Key;
}

export interface RepeaterRowRender<T extends RepeaterRow> {
  /** The row's place, from 0, as drawn now. Indexed form names use it: `tiers.${index}.amount`. */
  index: number;
  /** The row's legend as drawn: `rowLabel(index)`. */
  label: string;
  /** The row's error, from `rowErrors`, so its fields can mark themselves invalid. */
  error: ReactNode | undefined;
  /** Writes this row back into the rows, by its id: `update({ ...row, amount })`. Calls `onChange`. */
  update: (row: T) => void;
}

export interface RepeaterLabels {
  /** Add's text. @default 'Add a row' */
  add: string;
  /** Remove's visible text; its name adds the row's legend: "Remove, Tier 2". @default 'Remove' */
  remove: string;
  /** Add's description under the maximum: "2 of 3". @default (count, max) => `${count} of ${max}` */
  count: (count: number, max: number) => string;
  /** Beside the disabled Add at the maximum, and its description. @default (max) => `${max} of ${max}. Remove one to add another.` */
  full: (max: number) => string;
  /** In the rows' place when there are none. @default 'None yet.' */
  empty: string;
  /** Said politely after an add. @default (label) => `${label} added` */
  added: (label: string) => string;
  /** Said politely after a remove. @default (label) => `${label} removed` */
  removed: (label: string) => string;
}

export type RepeaterBaseProps<T extends RepeaterRow> = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  'children' | 'onChange' | 'defaultValue' | 'aria-label' | 'aria-labelledby'
> & {
  /** The set's legend: "Wait tiers". */
  label?: ReactNode;
  /** A hint under the legend. */
  description?: ReactNode;
  /** Controlled: the rows, in order. */
  value?: readonly T[];
  /** Uncontrolled: the first rows. @default [] */
  defaultValue?: readonly T[];
  /** Every add, remove and `update`, with the new rows. */
  onChange?: (rows: T[]) => void;
  /** Makes the row Add appends, with a new id. */
  createRow: () => T;
  /** Draws one row's fields. */
  children: (row: T, render: RepeaterRowRender<T>) => ReactNode;
  /** Each row's legend, from its place: (index) => `Tier ${index + 1}`. */
  rowLabel: (index: number) => string;
  /** Rows Remove stops at. @default 0 */
  minRows?: number;
  /** Rows Add stops at. Required: a repeater is a short list. */
  maxRows: number;
  /** An error about the whole set. */
  errorMessage?: ReactNode;
  /** Errors by row id, drawn under the row's fields. */
  rowErrors?: Readonly<Record<string, ReactNode>>;
  /** Whether the set differs from the saved one: the Changed chip beside the legend. */
  isChanged?: boolean;
  /** The Changed chip's text. @default 'Changed' */
  changedLabel?: string;
  /** Adds and removes are refused; the fields are the app's to disable. */
  isDisabled?: boolean;
  /** The library's words, in English unless replaced. */
  labels?: Partial<RepeaterLabels>;
  ref?: Ref<HTMLFieldSetElement>;
};

export type RepeaterProps<T extends RepeaterRow> = RepeaterBaseProps<T> & AccessibleName<'label'>;

const LABELS: RepeaterLabels = {
  add: 'Add a row',
  remove: 'Remove',
  count: (count, max) => `${String(count)} of ${String(max)}`,
  full: (max) => `${String(max)} of ${String(max)}. Remove one to add another.`,
  empty: 'None yet.',
  added: (label) => `${label} added`,
  removed: (label) => `${label} removed`,
};

/** The rows the changes of the current event left, by the drawn rows they started from. Written by handlers only. */
const pending = new WeakMap<object, readonly RepeaterRow[]>();

/** How long an add's or a remove's words stay in the status: read, then gone before a reader browses to them. */
const HOLD_MS = 5000;

const BUSY_WARNING =
  'A Repeater is inside aria-busy="true", so a screen reader may not say what an add or a remove did: set aria-busy on the fields\' container, not around the Repeater.';

/**
 * What the last add or remove said, and which it was, so each writes its words as a new node; and how many rows it
 * left, since the words are drawn only once the rows show it: controlled, the app's onChange may refuse.
 */
interface Said {
  words: string;
  event: number;
  count: number;
}

/** The drawn row whose id is `id`, read in the frame after the commit. */
function rowOf(root: HTMLElement, id: Key): HTMLElement | null {
  for (const item of root.querySelectorAll<HTMLElement>('.repeater-row')) {
    if (item.dataset.rowId === String(id)) return item;
  }
  return null;
}

/** A row's first field: one marked `data-autofocus` when it takes focus, else the first that does. */
function firstField(item: HTMLElement): HTMLElement | null {
  const main = item.querySelector<HTMLElement>('.repeater-row-main');
  if (!main) return null;
  const marked = main.querySelector<HTMLElement>('[data-autofocus]');
  if (marked) {
    if (takesFocus(marked)) return marked;
    const inside = firstFocusable(marked);
    if (inside) return inside;
  }
  return firstFocusable(main);
}

/**
 * A short ordered list of fieldsets the reader adds and removes, each row the app's own fields with a legend by
 * its place ("Tier 2"), Remove at its end and Add after the last. Controlled (`value`, `onChange`, typed rows) or
 * uncontrolled (`defaultValue`; the fields hold what is typed and the app names them for `FormData`). From zero
 * rows, which draws the empty line, to `maxRows`, where Add stays drawn and disabled with its reason beside it.
 * After an add focus goes to the new row's first field; after a remove to the same control in the row now in its
 * place, else the row before, else Add; never the body. A polite status says what happened.
 */
export function Repeater<T extends RepeaterRow>({
  label,
  description,
  value,
  defaultValue,
  onChange,
  createRow,
  children,
  rowLabel,
  minRows = 0,
  maxRows,
  errorMessage,
  rowErrors,
  isChanged = false,
  changedLabel,
  isDisabled = false,
  labels: given,
  className,
  ref,
  ...props
}: RepeaterProps<T>): ReactElement {
  const labels: RepeaterLabels = { ...LABELS, ...given };
  const [rows, change] = useControllableState<readonly T[]>(
    value,
    defaultValue ?? [],
    onChange as ((rows: readonly T[]) => void) | undefined,
  );
  // The rows as the changes of this event left them, so a second change in one event, two updates or an update and
  // a remove, builds on the first instead of on the rows drawn before it; a microtask later the drawn rows rule.
  const current = (): readonly T[] => (pending.get(rows) as readonly T[] | undefined) ?? rows;
  const setRows = (next: readonly T[]): void => {
    if (!pending.has(rows)) {
      queueMicrotask(() => {
        pending.delete(rows);
      });
    }
    pending.set(rows, next);
    change(next);
  };
  const rootRef = useRef<HTMLFieldSetElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  // Memoized, so React does not detach and attach the root's refs on every render.
  const refs = useMemo(() => mergeRefs<HTMLFieldSetElement>(ref, rootRef), [ref]);
  const id = useId();
  const [said, setSaid] = useState<Said | null>(null);
  const [busy, setBusy] = useState(false);
  const events = useRef(0);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelMove = useRef<(() => void) | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(hold.current);
      cancelMove.current?.();
    },
    [],
  );

  // A form reset puts back the rows the set started with, as it puts back every control and as React Aria's fields
  // do: a removed row returns with its first values and an added one leaves.
  const [first] = useState(rows);
  useEffect(() => {
    const form = rootRef.current?.form;
    if (!form) return;
    const onReset = (): void => {
      change(first);
    };
    form.addEventListener('reset', onReset);
    return () => {
      form.removeEventListener('reset', onReset);
    };
  }, [first, change]);

  // Two rows of one id: both are drawn, the second under a key of its own, and the app is told once.
  const seen = new Set<string>();
  const keys: string[] = [];
  let twin: string | null = null;
  for (const [at, each] of rows.entries()) {
    const key = String(each.id);
    if (seen.has(key)) {
      twin ??= key;
      keys.push(`${key}\u0000${String(at)}`);
    } else {
      seen.add(key);
      keys.push(key);
    }
  }
  useWarnOnce(
    twin === null
      ? null
      : `A Repeater has two rows with the id "${twin}": give every row its own id, as createRow does.`,
  );
  useWarnOnce(busy ? BUSY_WARNING : null);

  const full = rows.length >= maxRows;
  const canRemove = rows.length > minRows;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const footId = `${id}-foot`;
  const hasError = present(errorMessage);
  // Drawn once the rows show the add or the remove it tells of.
  const heard = said?.count === rows.length;

  /**
   * Writes `words` to the status as a new node, and moves focus to `place` in the frame after the commit, once
   * `count` rows are drawn: an add or a remove the app refuses says nothing and moves nothing.
   */
  const announce = (
    words: string,
    pressed: Element,
    count: number,
    place: (root: HTMLElement) => HTMLElement | null,
  ): void => {
    events.current += 1;
    const root = rootRef.current;
    if (root?.closest('[aria-busy="true"]')) setBusy(true);
    setSaid({ words, event: events.current, count });
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      setSaid(null);
    }, HOLD_MS);
    cancelMove.current?.();
    cancelMove.current = afterCommit(() => {
      if (!root?.isConnected || root.querySelectorAll(':scope > ol > li').length !== count) return;
      // The pressed button, the body (Safari leaves a pressed button unfocused, Chromium blurs a Remove that
      // leaves), or nothing: the move is ours. Focus the app moved elsewhere stays there.
      const active = document.activeElement;
      if (!focusIsLost() && active !== pressed && !root.contains(active)) return;
      focusNamedPlace(place(root) ?? (takesFocus(addRef.current) ? addRef.current : null));
    });
  };

  const addRow = (pressed: Element): void => {
    if (isDisabled || full) return;
    const row = createRow();
    const before = current();
    const next = [...before, row];
    setRows(next);
    const words = labels.added(rowLabel(before.length));
    announce(
      next.length >= maxRows ? `${words}. ${labels.full(maxRows)}` : words,
      pressed,
      next.length,
      (root) => {
        const item = rowOf(root, row.id);
        // A row of words has no field: its Remove, since Add may be disabled now.
        return item ? (firstField(item) ?? firstFocusable(item)) : null;
      },
    );
  };

  const removeRow = (index: number, pressed: Element): void => {
    if (isDisabled || !canRemove) return;
    const gone = rows[index];
    if (!gone) return;
    const stays = rows[index + 1] ?? rows[index - 1];
    const before = current();
    // By its place while nothing changed in this event, so one of two rows of one id leaves alone; else by its id.
    const next = before.filter((each, at) => (before === rows ? at !== index : each.id !== gone.id));
    setRows(next);
    announce(labels.removed(rowLabel(index)), pressed, next.length, (root) => {
      const item = stays ? rowOf(root, stays.id) : null;
      if (!item) return null;
      // The same control in the row that took its place, so a reader removing rows keeps their place; at the
      // minimum that row has no Remove, and its first field takes focus.
      const remove = item.querySelector<HTMLElement>('.repeater-remove');
      return takesFocus(remove) ? remove : firstField(item);
    });
  };

  const update = (row: T): void => {
    setRows(current().map((each) => (each.id === row.id ? row : each)));
  };

  const describedBy =
    [props['aria-describedby'], present(description) ? descriptionId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <fieldset
      {...props}
      ref={refs}
      className={cx('repeater', className)}
      aria-describedby={describedBy}
      data-full={full ? '' : undefined}
      data-empty={rows.length === 0 ? '' : undefined}
    >
      {present(label) ? (
        <legend className="repeater-legend">
          <span className="repeater-label">{label}</span>
          {isChanged && !hasError ? <FieldChanged>{changedLabel}</FieldChanged> : null}
        </legend>
      ) : null}
      {present(description) ? (
        <p id={descriptionId} className="repeater-description">
          {description}
        </p>
      ) : null}
      {hasError ? (
        <p id={errorId} className="repeater-error">
          {errorMessage}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <ol className="repeater-rows">
          {rows.map((each, index) => {
            const rowName = rowLabel(index);
            const error = rowErrors?.[String(each.id)];
            const rowErrorId = `${id}-row-${String(index)}-error`;
            const invalid = present(error);
            return (
              <li key={keys[index]} className="repeater-row" data-row-id={String(each.id)}>
                <fieldset
                  className="repeater-row-set"
                  aria-describedby={invalid ? rowErrorId : undefined}
                  data-invalid={invalid ? '' : undefined}
                >
                  <legend className="repeater-row-legend">{rowName}</legend>
                  <div className="repeater-row-fields">
                    <div className="repeater-row-grid">
                      <div className="repeater-row-main">
                        {children(each, {
                          index,
                          label: rowName,
                          error: invalid ? error : undefined,
                          update,
                        })}
                      </div>
                      <div className="repeater-row-end">
                        {canRemove ? (
                          <Button
                            variant="tertiary"
                            className="repeater-remove"
                            // Its word, then the row's legend: the name starts with what is seen, for voice control.
                            aria-label={`${labels.remove}, ${rowName}`}
                            isDisabled={isDisabled}
                            onPress={(event) => {
                              removeRow(index, event.target);
                            }}
                          >
                            {labels.remove}
                          </Button>
                        ) : (
                          // Remove's width, kept at the minimum so the fields do not widen: out of sight and reach.
                          <span className="button button-tertiary repeater-remove-space" aria-hidden="true">
                            {labels.remove}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {invalid ? (
                    <p id={rowErrorId} className="repeater-row-error">
                      {error}
                    </p>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="repeater-empty">{labels.empty}</p>
      )}
      <div className="repeater-foot">
        <Button
          ref={addRef}
          variant="secondary"
          className="repeater-add"
          aria-describedby={footId}
          isDisabled={isDisabled || full}
          onPress={(event) => {
            addRow(event.target);
          }}
        >
          <Plus aria-hidden="true" />
          {labels.add}
        </Button>
        {full ? (
          <span id={footId} className="repeater-full">
            {labels.full(maxRows)}
          </span>
        ) : (
          <span id={footId} className="repeater-count">
            {labels.count(rows.length, maxRows)}
          </span>
        )}
      </div>
      <div className="repeater-status" role="status" aria-live="polite" aria-atomic="true">
        {said && heard ? <span key={said.event}>{said.words}</span> : null}
      </div>
    </fieldset>
  );
}
