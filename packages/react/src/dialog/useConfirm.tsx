'use client';

import { useCallback, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { BaseConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

/** The question `confirm` asks: ConfirmDialog's props less the ones the hook owns. */
export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onConfirm' | 'onCancel' | 'isPending' | 'pendingLabel'
>;

export interface ConfirmHandle {
  /** Opens the dialog and resolves `true` only when the confirm button is pressed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** The dialog element. Render it once in the component that calls `confirm`. `null` until the first call. */
  dialog: ReactElement | null;
}

interface Question {
  /** Keys the question's content, so each question mounts its own and its initial focus runs again. */
  id: number;
  options: ConfirmOptions;
  /** False once it is answered: it stays rendered, closed, so React Aria plays its exit before it goes. */
  isOpen: boolean;
}

/** Whether focus has fallen to the body, as it does when the element holding it leaves the page. */
function isFocusLost(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body;
}

/**
 * Asks a question from code. `confirm(options)` opens a ConfirmDialog and returns a promise that is `true`
 * only when the confirm button is pressed: Escape, the scrim, Cancel, a second question asked over it and the
 * caller unmounting all answer `false`. Render `dialog` once in the component that asks. No provider.
 *
 * Questions asked one after another, over an open one or chained after an answer, are one run: they open in
 * the scope of what held focus when the first opened, and focus goes back to it when the last is answered.
 */
export function useConfirm(): ConfirmHandle {
  const [question, setQuestion] = useState<Question | null>(null);
  // How the open question is answered, readable from callbacks without a render: a second `confirm` must
  // answer the first `false` before it replaces it, and unmounting must answer whatever is still open.
  const pending = useRef<((answer: boolean) => void) | null>(null);
  const asked = useRef(0);
  const isMounted = useRef(false);
  // Whether a question's panel is on the page, open or still leaving, and what held focus when the first
  // question of the run opened: the scope every question of the run opens in, and where focus goes back.
  const isOnPage = useRef(false);
  const origin = useRef<HTMLElement | null>(null);

  const settle = useCallback((answer: boolean): void => {
    const resolve = pending.current;
    if (!resolve) return;
    pending.current = null;
    setQuestion((open) => open && { ...open, isOpen: false });
    resolve(answer);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        // A question asked once the caller has gone has nothing to show it, and silence is never yes.
        if (!isMounted.current) {
          resolve(false);
          return;
        }
        pending.current?.(false);
        pending.current = resolve;
        if (!isOnPage.current) {
          // The first question of a run opens from what holds focus now.
          const active = document.activeElement;
          origin.current = active instanceof HTMLElement && active !== document.body ? active : null;
        } else if (isFocusLost() && origin.current?.isConnected) {
          // The last panel has just left and focus has not come back yet: give it back first, so this
          // question opens from the run's origin, in its scope, and React Aria returns focus to it. With no
          // scroll, as React Aria's own restore does it.
          origin.current.focus({ preventScroll: true });
        }
        isOnPage.current = true;
        asked.current += 1;
        setQuestion({ id: asked.current, options, isOpen: true });
      }),
    [],
  );

  // The panel has left the page, after its exit: the run is over unless a question was asked meanwhile.
  const leave = useCallback((): void => {
    // A question is open: this is Strict Mode rehearsing an unmount as the panel mounts, and nothing left.
    if (pending.current) return;
    isOnPage.current = false;
    const target = origin.current;
    origin.current = null;
    // Focus fell to the body with the panel and nothing gave it back: the frame gives it back at once only when
    // it left with the panel, and React Aria waits a frame. Giving it back now means a question chained after
    // this answer opens from the run's origin too.
    if (isFocusLost() && target?.isConnected) target.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      pending.current?.(false);
      pending.current = null;
    };
  }, []);

  const dialog =
    question === null ? null : (
      <BaseConfirmDialog
        {...question.options}
        contentKey={question.id}
        isOpen={question.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) settle(false);
        }}
        onConfirm={() => {
          settle(true);
        }}
        onCancel={() => {
          settle(false);
        }}
        onUnmount={leave}
      />
    );

  return { confirm, dialog };
}
