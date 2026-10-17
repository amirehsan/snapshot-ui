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
import { scrollPortOf } from '../data-table/scroll';
import { isThenable, report } from '../dialog/ConfirmDialog';
import { useConfirm } from '../dialog/useConfirm';
import { FieldChanged } from '../field/FieldChanged';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { QUIET_MS } from '../utils/quiet';
import { useBeforeUnload } from '../utils/useBeforeUnload';
import { useBottomBarOffset } from '../utils/useBottomBarOffset';

export interface SaveBarLabels {
  /** The clay chip while there are unsaved changes. @default 'Unsaved changes' */
  unsaved: string;
  /** @default 'Cancel' */
  cancel: string;
  /** Said while the action is pending, after QUIET_MS. @default 'Saving' */
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
 * Scrolls `element`, a focused control in the bar's holder, by the least that brings it out from under the bar
 * (WCAG 2.4.11, risk R6), and, where the window scrolls, from under a phone's upload bar, which sits above the
 * bar. The root's scroll padding already keeps a control that focus scrolls into view clear of both, but a browser
 * leaves a control that is wholly in the view where it is, under them. Nothing moves when it is clear already, or
 * when focus has moved on by the time the frame comes. Every read is of the layout at that moment.
 */
function uncover(element: HTMLElement, bar: HTMLElement): void {
  if (!element.isConnected || element.ownerDocument.activeElement !== element) return;
  const port = scrollPortOf(element);
  const covers = [bar, ...(port === null ? document.querySelectorAll('.upload-tray-bar') : [])]
    .map((cover) => cover.getBoundingClientRect())
    .filter((box) => box.height > 0);
  const top = Math.min(...covers.map((box) => box.top));
  const delta = element.getBoundingClientRect().bottom - top;
  if (delta <= 0.5) return;
  // In whole pixels: WebKit and Firefox round a scroll position, so a fractional step could stop short.
  (port ?? window).scrollBy({ top: Math.ceil(delta), behavior: 'instant' });
}

/**
 * A sticky footer for a form or a review: a sentence about what will be saved, the clay
 * Unsaved chip while dirty, a status line said politely, Cancel guarded by a discard question while dirty, the
 * app's secondary actions, and a primary action whose label the app writes and whose promise keeps the bar
 * pending. Put it as the last child of the form's holder: it sticks at the viewport's bottom while the holder is in
 * view and rests at its end. It is always drawn; the action is never disabled, so answer a press that cannot save
 * with a `status`. It warns before the page unloads while dirty, keeps a focused control in its holder clear of
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

  // "Saving" is said only once the pending state has held for the pause, so a fast save says nothing.
  const [hasHeld, setHeld] = useState(false);
  if (!isPending && hasHeld) setHeld(false);
  useEffect(() => {
    if (!isPending) return;
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

  // A control in the holder that focus lands on under the bar is scrolled clear of it, two frames after the focus,
  // after the browser's own scroll, as DataTable clears its rows of its bulk-action bar.
  useEffect(() => {
    const bar = barRef.current;
    const holder = bar?.parentElement;
    if (!bar || !holder) return;
    let frame = 0;
    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || bar.contains(target)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          uncover(target, bar);
        });
      });
    };
    holder.addEventListener('focusin', onFocusIn);
    return () => {
      holder.removeEventListener('focusin', onFocusIn);
      cancelAnimationFrame(frame);
    };
  }, []);

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
    if (!yes) return;
    onCancel?.();
    // An app that drops Cancel once nothing is dirty takes away what the question gives focus back to: once the
    // question has played its exit, focus goes to the action rather than the body.
    let frames = 0;
    const check = (): void => {
      if (cancelRef.current?.isConnected) return;
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
              <span className="save-bar-status-text">{said}</span>
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
