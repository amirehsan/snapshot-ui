'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

/** The question `confirm` asks: ConfirmDialog's props less the ones the hook owns. */
export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onConfirm' | 'onCancel' | 'isPending'
>;

export interface ConfirmHandle {
  /** Opens the dialog and resolves `true` only when the confirm button is pressed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** The dialog element. Render it once in the component that calls `confirm`. `null` until the first call. */
  dialog: ReactElement | null;
}

interface Question {
  options: ConfirmOptions;
  resolve: (answer: boolean) => void;
}

/**
 * Asks a question from code. `confirm(options)` opens a ConfirmDialog and returns a promise that is `true`
 * only when the confirm button is pressed: Escape, the scrim, Cancel, a second question asked over it and the
 * caller unmounting all answer `false`. Render `dialog` once in the component that asks. No provider.
 */
export function useConfirm(): ConfirmHandle {
  const [question, setQuestion] = useState<Question | null>(null);
  // The open question, readable from callbacks without a render: a second `confirm` must answer the
  // first `false` before it is replaced, and unmounting must answer whatever is still open.
  const pending = useRef<Question | null>(null);

  const settle = useCallback((answer: boolean): void => {
    const open = pending.current;
    if (!open) return;
    pending.current = null;
    setQuestion(null);
    open.resolve(answer);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        pending.current?.resolve(false);
        const next = { options, resolve };
        pending.current = next;
        setQuestion(next);
      }),
    [],
  );

  useEffect(
    () => () => {
      pending.current?.resolve(false);
      pending.current = null;
    },
    [],
  );

  const dialog =
    question === null ? null : (
      <ConfirmDialog
        {...question.options}
        isOpen
        onOpenChange={(isOpen) => {
          if (!isOpen) settle(false);
        }}
        onConfirm={() => {
          settle(true);
        }}
        onCancel={() => {
          settle(false);
        }}
      />
    );

  return { confirm, dialog };
}
