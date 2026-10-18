'use client';

import { CircleAlert } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Button } from '../button/Button';
import { useConfirm } from '../dialog/useConfirm';
import { FieldChanged } from '../field/FieldChanged';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { QUIET_MS } from '../utils/quiet';
import { isThenable, report } from '../utils/report';
import { useBeforeUnload } from '../utils/useBeforeUnload';
import { useChrome } from '../utils/focus-clear';
import { useBottomBarOffset } from '../utils/useBottomBarOffset';

export interface SaveBarLabels {
  /** The clay chip while there are unsaved changes. @default 'Unsaved changes' */
  unsaved: string;
  /** @default 'Cancel' */
  cancel: string;
  /**
   * Said in the status once the action has been pending for QUIET_MS, when the action did not hold focus as the
   * pending began; while it does, React Aria's Button says its pending itself. @default 'Saving'
   */
  pending: string;
  /**
   * The discard question. @default 'Discard changes?', 'The changes you made here will be lost.',
   * 'Discard changes', 'Keep editing'
   */
  discardTitle: string;
  discardDescription: string;
  discardConfirm: string;
  discardKeep: string;
}

export interface SaveBarProps {
  /** What will be saved, in the app's words: "2 changes to Corner Mart, 14 Oct". Not live: it changes as the reader types. */
  message: ReactNode;
  /** Unsaved changes exist: the clay chip shows, Cancel asks first, and the page warns before unloading. @default false */
  isDirty?: boolean;
  /** The primary action's text, the app's: "Save", "Confirm and review next (2 left)". */
  actionLabel: string;
  /** A returned promise keeps the bar pending until it settles. On reject the bar stays and reports the error through `reportError`. */
  onAction: () => void | Promise<void>;
  /** Pending for work the app tracks itself: the action shows its spinner and Cancel is disabled. */
  isPending?: boolean;
  /** The spinner's name, read with the action's. @default 'Saving' */
  pendingLabel?: string;
  /** Shows Cancel. Called at once when clean, and after the discard question when dirty. */
  onCancel?: () => void;
  /** Buttons between Cancel and the action, such as "Skip" in a review. */
  secondaryActions?: ReactNode;
  /** A state line, spoken politely as it changes: "3 fields need attention", "Couldn't save. Try again." */
  status?: ReactNode;
  /** `error` draws the status in the error color with an icon. @default 'neutral' */
  statusTone?: 'neutral' | 'error';
  /** Warns before the page unloads while dirty. @default true */
  warnsOnUnload?: boolean;
  labels?: Partial<SaveBarLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const DEFAULT_LABELS: SaveBarLabels = {
  unsaved: 'Unsaved changes',
  cancel: 'Cancel',
  pending: 'Saving',
  discardTitle: 'Discard changes?',
  discardDescription: 'The changes you made here will be lost.',
  discardConfirm: 'Discard changes',
  discardKeep: 'Keep editing',
};

/** Whether focus has fallen to the body, as it does when the element holding it leaves the page. */
function isFocusLost(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body;
}

/** Whether a control the bar holds can no longer hold focus: it left the page, or it was disabled. */
function isGone(element: Element): boolean {
  return !element.isConnected || element.matches(':disabled');
}

/**
 * A sticky footer for a form or a review: a sentence about what will be saved, the clay
 * Unsaved chip while dirty, a status line said politely, Cancel guarded by a discard question while dirty, the
 * app's secondary actions, and a primary action whose label the app writes and whose promise keeps the bar
 * pending. Put it as the last child of the form's holder: it sticks at the viewport's bottom while the holder is in
 * view and rests at its end. It is always drawn; the action is never disabled, so answer a press that cannot save
 * with a `status`. It warns before the page unloads while dirty, keeps a focused control on the page clear of
 * itself, and lifts the upload tray and the toasts by its height (`--save-bar-offset`). It takes no Mod+S.
 */
export function SaveBar({
  message,
  isDirty = false,
  actionLabel,
  onAction,
  isPending: isPendingOutside = false,
  pendingLabel = 'Saving',
  onCancel,
  secondaryActions,
  status,
  statusTone = 'neutral',
  warnsOnUnload = true,
  labels: labelsProp,
  className,
  ref,
}: SaveBarProps): ReactElement {
  const labels: SaveBarLabels = { ...DEFAULT_LABELS, ...labelsProp };
  const messageId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const merged = useMemo(() => mergeRefs(barRef, ref), [ref]);
  const { confirm, dialog } = useConfirm();

  // The press whose promise from `onAction` is running, or null. Each press makes a new one, so the end of a run
  // can tell whether it is still the bar's; a bar that has gone tells no one but the page's error handlers.
  const [run, setRun] = useState<object | null>(null);
  const currentRun = useRef(run);
  useLayoutEffect(() => {
    currentRun.current = run;
    return () => {
      currentRun.current = null;
    };
  }, [run]);
  const isPending = isPendingOutside || run !== null;

  // Each press of the action, so a press answered with the same status as the last is said again: the status's
  // text is drawn anew for each, as the upload tray and the drop zone key theirs (spec correction 28).
  const [round, setRound] = useState(0);

  // While the action holds focus as the pending begins, React Aria's Button says the pending's start and end
  // itself, assertively, by the action's name and its spinner's. Otherwise (a pointer press in Safari, which
  // focuses no button, or the app's own `isPending` with focus elsewhere) the status says `labels.pending` once the
  // pending has held for the pause, so a fast save says nothing there. Read before focus is mended below, which may
  // move focus from a disabled Cancel to the action after React Aria has looked.
  const startedOnAction = useRef(false);
  useLayoutEffect(() => {
    const action = actionRef.current;
    startedOnAction.current = isPending && action !== null && document.activeElement === action;
  }, [isPending]);
  const [hasHeld, setHeld] = useState(false);
  if (!isPending && hasHeld) setHeld(false);
  useEffect(() => {
    if (!isPending || startedOnAction.current) return;
    const timer = setTimeout(() => {
      setHeld(true);
    }, QUIET_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [isPending]);
  const saysPending = isPending && hasHeld;
  const said = saysPending ? labels.pending : present(status) ? status : null;
  const tone = saysPending ? 'neutral' : statusTone;

  useBeforeUnload(warnsOnUnload && isDirty);
  useBottomBarOffset(barRef);

  // A control that focus lands on under the bar is scrolled clear of it by a gap, two frames after the focus
  // (`utils/focus-clear.ts`).
  useChrome(barRef, 'bottom');

  // The bar's control that holds focus. Cancel is disabled while pending and may leave with `onCancel`, and an app's
  // secondary action may leave too: focus on one that can no longer hold it goes to the action, never the body.
  // Focus the reader moves to the page's empty space, with the control still there, is theirs and stays.
  const held = useRef<Element | null>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const onFocusIn = (event: FocusEvent): void => {
      held.current = event.target instanceof Element ? event.target : null;
    };
    const onFocusOut = (event: FocusEvent): void => {
      const left = event.target;
      const next = event.relatedTarget;
      if (next !== null) {
        if (!(next instanceof Node && bar.contains(next))) held.current = null;
        return;
      }
      // Focus went to nothing: the reader's press on empty space, unless the control left or was disabled.
      queueMicrotask(() => {
        if (held.current === left && left instanceof Element && !isGone(left)) held.current = null;
      });
    };
    bar.addEventListener('focusin', onFocusIn);
    bar.addEventListener('focusout', onFocusOut);
    return () => {
      bar.removeEventListener('focusin', onFocusIn);
      bar.removeEventListener('focusout', onFocusOut);
    };
  }, []);
  useLayoutEffect(() => {
    const was = held.current;
    if (was === null || !isGone(was)) return;
    held.current = null;
    if (isFocusLost() || document.activeElement === was) actionRef.current?.focus({ preventScroll: true });
  });

  const act = (): void => {
    setRound((count) => count + 1);
    const result = onAction();
    if (!isThenable(result)) return;
    const token = {};
    setRun(token);
    result.then(
      () => {
        if (currentRun.current === token) setRun(null);
      },
      (error: unknown) => {
        if (currentRun.current === token) setRun(null);
        report(error);
      },
    );
  };

  const cancel = async (): Promise<void> => {
    if (!isDirty) {
      onCancel?.();
      return;
    }
    const yes = await confirm({
      title: labels.discardTitle,
      description: labels.discardDescription,
      confirmLabel: labels.discardConfirm,
      cancelLabel: labels.discardKeep,
      tone: 'danger',
    });
    if (yes) onCancel?.();
    // The question gives focus back to Cancel, which may be gone by then: an app that drops Cancel once nothing is
    // dirty takes it away after a yes, and a save the app starts while the question is open disables it, either
    // answer. Once the question has played its exit, focus that fell to the body goes to the action.
    let frames = 0;
    const check = (): void => {
      const back = cancelRef.current;
      if (back !== null && !isGone(back)) return;
      if (isFocusLost()) {
        actionRef.current?.focus({ preventScroll: true });
        return;
      }
      frames += 1;
      if (frames < 60) requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  };

  return (
    <>
      <div ref={merged} role="group" aria-labelledby={messageId} className={cx('save-bar', className)}>
        <div className="save-bar-text">
          {isDirty ? <FieldChanged className="save-bar-chip">{labels.unsaved}</FieldChanged> : null}
          <span id={messageId} className="save-bar-message">
            {message}
          </span>
        </div>
        {/* Polite and in the page from the first render, server included, so a screen reader is listening before
          the words arrive. */}
        <div className="save-bar-status" role="status" aria-live="polite" aria-atomic="true" data-tone={tone}>
          {said === null ? null : (
            <>
              {tone === 'error' ? <CircleAlert aria-hidden="true" /> : null}
              <span className="save-bar-status-text" key={round}>
                {said}
              </span>
            </>
          )}
        </div>
        <div className="save-bar-actions">
          {onCancel ? (
            <Button
              ref={cancelRef}
              variant="tertiary"
              isDisabled={isPending}
              onPress={() => {
                void cancel();
              }}
            >
              {labels.cancel}
            </Button>
          ) : null}
          {present(secondaryActions) ? secondaryActions : null}
          <Button ref={actionRef} isPending={isPending} pendingLabel={pendingLabel} onPress={act}>
            {actionLabel}
          </Button>
        </div>
      </div>
      {/* Outside the bar, so the question's focus is never taken for the bar's own. */}
      {dialog}
    </>
  );
}
