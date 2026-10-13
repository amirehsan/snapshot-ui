'use client';

import { TriangleAlert } from 'lucide-react';
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Key,
  type ReactElement,
  type ReactNode,
} from 'react';
import { OverlayTriggerStateContext } from 'react-aria-components';
import { Button } from '../button/Button';
import { present } from '../utils/present';
import { BaseDialog, type DialogInternalProps, type DialogProps } from './Dialog';

export interface ConfirmDialogProps extends Omit<
  DialogProps,
  'actions' | 'children' | 'hasCloseButton' | 'closeLabel' | 'description' | 'onOpenChange'
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
  /**
   * The accessible name of the spinner in the pending confirm button, read with its label. Name the work in
   * progress with the outcome's verb, such as "Deleting".
   * @default 'Loading'
   */
  pendingLabel?: string;
  /**
   * Called when the dialog opens or closes, for one controlled by `isOpen` or started by `defaultOpen`.
   * Inside a `DialogTrigger` the trigger owns the open state and this is not called: put `onOpenChange` on
   * the trigger.
   */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * ConfirmDialog's props with the two `useConfirm` sets: a key for each question's content, and a call when
 * the panel leaves the page.
 *
 * Internal: not exported from the package.
 */
export interface ConfirmDialogInternalProps extends ConfirmDialogProps {
  /** A new key mounts the question's content again, inside the panel that stays. */
  contentKey?: Key;
  /** Called when the panel has left the page, after its exit. */
  onUnmount?: () => void;
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

/** Each misuse is reported once per page, so a list of confirm dialogs does not flood the console. */
let warnedTone = false;
let warnedOpenChange = false;

/**
 * An alert dialog that asks one question. Cancel comes first, then the confirm button, which names the
 * outcome. Only the confirm button is a yes: Escape, a press on the scrim and Cancel each call `onCancel`. A
 * promise from `onConfirm` holds the dialog pending until it settles. Built on Dialog, so it opens from a
 * `DialogTrigger`, or from `isOpen` or `defaultOpen`.
 */
export function ConfirmDialog(props: ConfirmDialogProps): ReactElement {
  return <BaseConfirmDialog {...props} />;
}

/**
 * ConfirmDialog, with the props `useConfirm` sets as well. ConfirmDialog is this without them.
 *
 * Internal: not exported from the package.
 */
export function BaseConfirmDialog({
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone,
  icon,
  onConfirm,
  onCancel,
  isPending: isPendingOutside = false,
  pendingLabel,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  isOpen,
  defaultOpen,
  onOpenChange,
  contentKey,
  onUnmount,
  ...dialogProps
}: ConfirmDialogInternalProps): ReactElement {
  // The open state is resolved here and handed to Dialog controlled, so every way out, React Aria's and the
  // two buttons', reaches `setShown`. React Aria's rule decides whose it is: a modal given neither `isOpen`
  // nor `defaultOpen` follows the DialogTrigger around it.
  const trigger = useContext(OverlayTriggerStateContext);
  const owner = isOpen === undefined && defaultOpen === undefined ? trigger : null;
  const [isOpenHere, setOpenHere] = useState(defaultOpen ?? false);
  const isShown = owner ? owner.isOpen : (isOpen ?? isOpenHere);

  // The press whose promise from `onConfirm` is running, or null. Each press makes a new one, so the end of
  // a run can tell whether it is still the dialog's.
  const [run, setRun] = useState<object | null>(null);
  // A dialog that closes drops the run still going: reopened, it is not pending, and that run's end can
  // neither close it nor tell anyone.
  const [wasShown, setWasShown] = useState(isShown);
  if (wasShown !== isShown) {
    setWasShown(isShown);
    if (!isShown) setRun(null);
  }
  const isPending = isPendingOutside || run !== null;

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

  // The latest `setShown` and run, for a confirm that settles after a render. Once the dialog has left the
  // page, `setShown` is nothing, so a late promise tells no one.
  const latest = useRef(setShown);
  const currentRun = useRef(run);
  useLayoutEffect(() => {
    latest.current = setShown;
    currentRun.current = run;
    return () => {
      latest.current = ignore;
    };
  });

  useEffect(() => {
    // The type requires the tone; this catches a caller the type cannot see, such as plain JavaScript.
    const given: unknown = tone;
    if (given !== 'default' && given !== 'danger' && !warnedTone) {
      warnedTone = true;
      console.warn(
        `ConfirmDialog: tone must be 'default' or 'danger', and it was ${String(given)}. A question that loses something is drawn as a harmless one until it is set.`,
      );
    }
    if (owner && onOpenChange && !warnedOpenChange) {
      warnedOpenChange = true;
      console.warn(
        'ConfirmDialog: inside a DialogTrigger the trigger owns the open state, so onOpenChange on the dialog is not called. Put it on the DialogTrigger.',
      );
    }
  }, [tone, owner, onOpenChange]);

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
    const token = {};
    setRun(token);
    result.then(
      () => {
        if (currentRun.current !== token) return;
        setRun(null);
        closeConfirmed();
      },
      (error: unknown) => {
        if (currentRun.current === token) setRun(null);
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
    contentKey,
    onUnmount,
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
          // The label, as a name React Aria can extend: it joins the spinner's name to a pending button's
          // only when the button is named by an attribute, so pending reads "Delete 3 transactions Deleting".
          aria-label={confirmLabel}
          isPending={isPending}
          pendingLabel={pendingLabel}
          onPress={confirm}
        >
          {confirmLabel}
        </Button>
      </>
    ),
  };
  return <BaseDialog {...dialog} />;
}
