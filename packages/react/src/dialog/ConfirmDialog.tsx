'use client';

import { TriangleAlert } from 'lucide-react';
import { useContext, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { OverlayTriggerStateContext } from 'react-aria-components';
import { Button } from '../button/Button';
import { present } from '../utils/present';
import { BaseDialog, type DialogInternalProps, type DialogProps } from './Dialog';

export interface ConfirmDialogProps extends Omit<
  DialogProps,
  'actions' | 'children' | 'hasCloseButton' | 'closeLabel' | 'description'
> {
  /** What the question does, under the title. Required: an alert dialog is described by it. */
  description: ReactNode;
  /** The confirm button's label. It names the outcome, "Delete 3 transactions", never "OK". Required. */
  confirmLabel: string;
  /** The cancel button's label. @default 'Cancel' */
  cancelLabel?: string;
  /**
   * `danger` draws the error icon well and the danger Button, for a question that loses something.
   * `default` draws no well unless `icon` is given, and a primary Button.
   * Required, with no default: a destructive question drawn as a harmless one is the costly mistake,
   * and a harmless one drawn as destructive teaches people to ignore the warning, so the caller chooses.
   */
  tone: 'default' | 'danger';
  /** The well's icon. In the danger tone it is Lucide's TriangleAlert unless given. */
  icon?: ReactNode;
  /**
   * Called when the confirm button is pressed. If it returns a promise, the dialog is pending until it
   * settles: it closes when the promise resolves, and stays open, no longer pending, when it rejects.
   * The rejection is reported through `reportError`, as if uncaught, never swallowed.
   */
  onConfirm?: () => void | Promise<void>;
  /** Called on every other way out: Cancel, Escape, a scrim press. */
  onCancel?: () => void;
  /**
   * Pending from outside: the confirm button shows Button's pending state, Cancel is disabled, and
   * Escape and the scrim are ignored, so a half-finished action cannot be abandoned.
   */
  isPending?: boolean;
}

/** Whether a value is a promise, or anything else with a `then`, such as a promise from another frame. */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

/**
 * Hands an error to the page as if nothing had caught it, so it reaches the console and the page's `error`
 * listeners. `reportError` does that in every browser the library supports; where it is missing, the error is
 * thrown again from a microtask, where no handler can catch it.
 */
function report(error: unknown): void {
  if (typeof reportError === 'function') reportError(error);
  else
    queueMicrotask(() => {
      throw error;
    });
}

/** What a settled confirm calls once the dialog has left the page: nothing. */
const ignore = (): void => undefined;

/**
 * An alert dialog that asks one question. Cancel comes first, then the confirm button, which names the
 * outcome. Only the confirm button is a yes: Escape, a press on the scrim and Cancel each call `onCancel`. A
 * promise from `onConfirm` holds the dialog pending until it settles. Built on Dialog, so it opens from a
 * `DialogTrigger`, or from `isOpen` or `defaultOpen`.
 */
export function ConfirmDialog(props: ConfirmDialogProps): ReactElement {
  const {
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    tone,
    icon,
    onConfirm,
    onCancel,
    isPending: isPendingOutside = false,
    isDismissable = true,
    isKeyboardDismissDisabled = false,
    isOpen,
    defaultOpen,
    onOpenChange,
    ...dialogProps
  } = props;

  // The open state is resolved here and handed to Dialog controlled, so every way out, React Aria's and the
  // two buttons', reaches `setShown`. React Aria's rule decides whose it is: a modal given neither `isOpen`
  // nor `defaultOpen` follows the DialogTrigger around it.
  const trigger = useContext(OverlayTriggerStateContext);
  const owner = isOpen === undefined && defaultOpen === undefined ? trigger : null;
  const [isOpenHere, setOpenHere] = useState(defaultOpen ?? false);
  const isShown = owner ? owner.isOpen : (isOpen ?? isOpenHere);

  // True while a promise from `onConfirm` is running.
  const [isWaiting, setWaiting] = useState(false);
  const isPending = isPendingOutside || isWaiting;

  // Set just before the confirm closes the dialog, and read and reset by the close, so a confirm is never
  // taken for a cancel.
  const confirmed = useRef(false);

  const setShown = (next: boolean): void => {
    const isConfirm = confirmed.current;
    confirmed.current = false;
    if (next === isShown) return;
    if (!next && !isConfirm) onCancel?.();
    if (owner) {
      if (next) owner.open();
      else owner.close();
      return;
    }
    if (isOpen === undefined) setOpenHere(next);
    onOpenChange?.(next);
  };

  // The latest `setShown`, for a confirm that settles after a render, and nothing once the dialog has left
  // the page, so a late promise tells no one.
  const latest = useRef(setShown);
  useLayoutEffect(() => {
    latest.current = setShown;
    return () => {
      latest.current = ignore;
    };
  });

  const closeConfirmed = (): void => {
    confirmed.current = true;
    latest.current(false);
  };

  const confirm = (): void => {
    const result = onConfirm?.();
    if (!isThenable(result)) {
      closeConfirmed();
      return;
    }
    setWaiting(true);
    result.then(
      () => {
        setWaiting(false);
        closeConfirmed();
      },
      (error: unknown) => {
        setWaiting(false);
        report(error);
      },
    );
  };

  const isDanger = tone === 'danger';
  const dialog: DialogInternalProps = {
    ...dialogProps,
    role: 'alertdialog',
    tone,
    description,
    icon: present(icon) ? icon : isDanger ? <TriangleAlert /> : undefined,
    isOpen: isShown,
    onOpenChange: setShown,
    isDismissable: isDismissable && !isPending,
    isKeyboardDismissDisabled: isKeyboardDismissDisabled || isPending,
    actions: (
      <>
        <Button
          variant="tertiary"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- initial focus inside a modal is the dialog pattern: a question that loses something starts on the safe answer
          autoFocus={isDanger}
          isDisabled={isPending}
          onPress={() => {
            setShown(false);
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={isDanger ? 'danger' : 'primary'}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- initial focus inside a modal is the dialog pattern: a question that loses nothing starts on its answer
          autoFocus={!isDanger}
          isPending={isPending}
          onPress={confirm}
        >
          {confirmLabel}
        </Button>
      </>
    ),
  };
  return <BaseDialog {...dialog} />;
}
