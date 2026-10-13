'use client';

import { X } from 'lucide-react';
import {
  useId,
  useMemo,
  type HTMLAttributes,
  type Key,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Dialog as RACDialog,
  Heading,
  Text,
  type DialogProps as RACDialogProps,
  type ModalRenderProps,
} from 'react-aria-components';
import { IconButton } from '../icon-button/IconButton';
import { ModalFrame } from '../overlay/ModalFrame';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';

export { DialogTrigger, type DialogTriggerProps } from 'react-aria-components';

/** A part given as content, or as a function of the dialog's `close`. */
type DialogSlot = ReactNode | ((opts: { close: () => void }) => ReactNode);

export interface DialogProps extends Omit<RACDialogProps, 'className' | 'children' | 'role' | 'style'> {
  /** The title, an h2 drawn in the card title step. It names the dialog. Required. */
  title: ReactNode;
  /** A line under the title, in slate. It becomes the dialog's accessible description. */
  description?: ReactNode;
  /** A 20px icon in a 48px well above the title. */
  icon?: ReactNode;
  /**
   * `danger` tints the icon well with error, for a question that loses something. The actions are
   * the caller's: a danger dialog usually ends in a danger Button.
   * @default 'default'
   */
  tone?: 'default' | 'danger';
  /** The panel width: `md` is 28rem, `lg` is 40rem, both capped at the viewport less 2rem. @default 'md' */
  size?: 'md' | 'lg';
  /** The body, under the description. It scrolls when it is taller than the viewport allows. */
  children?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /**
   * The action row, pinned under the body, aligned to the inline end: the one place for buttons that stay
   * in view. For a form, put the `<form id={formId}>` in `children` and its submit button here, joined to it
   * by its `form` attribute: `<Button type="submit" form={formId}>`. Enter in a field still submits it.
   */
  actions?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** A press on the scrim closes the dialog. @default true */
  isDismissable?: boolean;
  /** Escape no longer closes it. @default false */
  isKeyboardDismissDisabled?: boolean;
  /** An X in the top end corner. Escape and the scrim already close a dialog, so this is for long ones. @default false */
  hasCloseButton?: boolean;
  /** The close button's accessible name. @default 'Close' */
  closeLabel?: string;
  /** Open state, for a dialog without a DialogTrigger. Controlled and uncontrolled. */
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Goes on the panel, merged after the library's classes. */
  className?: string | ((values: ModalRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the scrim. */
  overlayClassName?: string;
  /** A ref to the dialog element, the one React Aria focuses. */
  ref?: Ref<HTMLElement>;
}

/**
 * Dialog's props with the three that only ConfirmDialog sets: the role, to `alertdialog`, and for `useConfirm`
 * a key for the content and a call when the panel leaves. A Dialog is a `dialog`, so the public props leave
 * them out.
 *
 * Internal: not exported from the package.
 */
export interface DialogInternalProps extends DialogProps {
  /** @default 'dialog' */
  role?: 'dialog' | 'alertdialog';
  /**
   * Keys the dialog element and everything in it, inside a panel and scrim that stay: a new key mounts new
   * content, whose initial focus runs again, while the overlay, its scope and its focus restore stay as the
   * first question set them.
   */
  contentKey?: Key;
  /** Called when the panel has left the page, after its exit. */
  onUnmount?: () => void;
}

/** A part's content, calling it with `close` when it is a function. */
const resolve = (slot: DialogSlot, close: () => void): ReactNode =>
  typeof slot === 'function' ? slot({ close }) : slot;

/**
 * A modal panel on the scrim: an optional icon well, the title, which names it, a description, which
 * describes it, a body that scrolls, and an action row that stays. Escape and a press on the scrim close
 * it, focus moves in and goes back to what opened it, and the page behind is held still and hidden from
 * assistive technology. Built on React Aria's Modal and Dialog. Open it from a `DialogTrigger`, or control
 * it with `isOpen`.
 */
export function Dialog(props: DialogProps): ReactElement {
  return <BaseDialog {...props} />;
}

/**
 * Dialog, with the role as a typed prop, so ConfirmDialog can make it an alert dialog. Dialog is this with
 * the role left at `dialog`.
 *
 * Internal: not exported from the package.
 */
export function BaseDialog({
  title,
  description,
  icon,
  tone = 'default',
  size = 'md',
  children,
  actions,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  hasCloseButton = false,
  closeLabel = 'Close',
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  overlayClassName,
  role = 'dialog',
  contentKey,
  onUnmount,
  ...dialogProps
}: DialogInternalProps): ReactElement {
  const descriptionId = useId();
  const isDescribed = present(description);
  return (
    <ModalFrame
      overlayClass="dialog-overlay"
      panelClass="dialog"
      panelAttributes={{ 'data-size': size, 'data-tone': tone }}
      className={className}
      overlayClassName={overlayClassName}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      onUnmount={onUnmount}
    >
      <RACDialog
        key={contentKey}
        {...dialogProps}
        role={role}
        // React Aria wires the description slot only for an alert dialog, so the dialog points at it here.
        aria-describedby={dialogProps['aria-describedby'] ?? (isDescribed ? descriptionId : undefined)}
        className="dialog-content"
      >
        {({ close }) => {
          const body = resolve(children, close);
          const row = resolve(actions, close);
          return (
            <>
              {hasCloseButton ? (
                <IconButton slot="close" aria-label={closeLabel} className="dialog-close">
                  <X />
                </IconButton>
              ) : null}
              <div className={cx('dialog-head', hasCloseButton && 'dialog-head-with-close')}>
                {present(icon) ? (
                  <span className="dialog-well" aria-hidden="true">
                    {icon}
                  </span>
                ) : null}
                <Heading slot="title" className="dialog-title">
                  {title}
                </Heading>
                {isDescribed ? (
                  <Text slot="description" elementType="p" id={descriptionId} className="dialog-description">
                    {description}
                  </Text>
                ) : null}
              </div>
              {present(body) ? <DialogBody>{body}</DialogBody> : null}
              {present(row) ? <DialogActions>{row}</DialogActions> : null}
            </>
          );
        }}
      </RACDialog>
    </ModalFrame>
  );
}

/** Internal: not exported from the package. */
export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Everything Tab can reach on its own. */
const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(', ');

/**
 * Makes the body a tab stop while it scrolls and holds nothing Tab reaches, and only then. A body with a
 * control in it is reached through the control, so a long form gains no extra stop before its first field.
 */
function markScrolling(body: HTMLElement): void {
  if (body.scrollHeight > body.clientHeight && body.querySelector(TABBABLE) === null) body.tabIndex = 0;
  else body.removeAttribute('tabindex');
}

/**
 * A ref for the body that keeps it a tab stop while it scrolls and holds nothing to focus, so a keyboard can
 * reach it and scroll its text. Chrome and Firefox do this for such a scroller and Safari does not. The body,
 * what it holds and changes to it are watched, so a body that comes to scroll, or stops, follows.
 */
function keyboardScroll(body: HTMLDivElement | null): (() => void) | undefined {
  if (!body) return undefined;
  markScrolling(body);
  if (typeof ResizeObserver === 'undefined') return undefined;
  const sizes = new ResizeObserver(() => {
    markScrolling(body);
  });
  const watch = (): void => {
    sizes.disconnect();
    sizes.observe(body);
    for (const child of body.children) sizes.observe(child);
    markScrolling(body);
  };
  const content = new MutationObserver(watch);
  watch();
  content.observe(body, { childList: true, subtree: true, characterData: true });
  return () => {
    sizes.disconnect();
    content.disconnect();
  };
}

/**
 * The dialog's scrolling body. While it scrolls and holds nothing to focus it is a tab stop, so a keyboard
 * can scroll it.
 *
 * Internal: not exported from the package. Content given to a Dialog lands inside its body, so these parts
 * placed there would nest, and the actions would scroll away with it. The `actions` prop is the pinned row.
 */
export function DialogBody({ className, ref, ...props }: DialogBodyProps): ReactElement {
  const bodyRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, keyboardScroll), [ref]);
  return <div {...props} ref={bodyRef} className={cx('dialog-body', className)} />;
}

/** Internal: not exported from the package. */
export interface DialogActionsProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * The dialog's action row, pinned under the body.
 *
 * Internal: not exported from the package.
 */
export function DialogActions({ className, ...props }: DialogActionsProps): ReactElement {
  return <div {...props} className={cx('dialog-actions', className)} />;
}
