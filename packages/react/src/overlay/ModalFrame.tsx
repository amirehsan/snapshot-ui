'use client';

import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  Modal,
  ModalOverlay,
  OverlayTriggerStateContext,
  composeRenderProps,
  useLocale,
  type ModalRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { useGiveFocusBack } from './useGiveFocusBack';
import { useOverlayScope } from './useOverlayScope';
import { useOverlayStack } from './useOverlayStack';

export interface ModalFrameProps {
  /**
   * The modal's id in the overlay stack. CommandPalette passes its own, so its shortcut can ask whether a
   * modal other than itself is open. @default a `useId()`
   */
  id?: string;
  /** The scrim's own class, beside `overlay-scrim`: `dialog-overlay`, `drawer-overlay`, `command-palette-overlay`. */
  overlayClass: string;
  /** The panel's own class, beside `overlay`: `dialog`, `drawer`, `command-palette`. */
  panelClass: string;
  /** Data attributes for the panel, such as `data-size`, `data-tone`, `data-side`. */
  panelAttributes?: Record<`data-${string}`, string | undefined>;
  /** Goes on the panel, merged after the library's classes. */
  className?: string | ((values: ModalRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the scrim, after its classes. */
  overlayClassName?: string;
  /** A ref to the panel element. */
  panelRef?: Ref<HTMLDivElement>;
  /** @default true */
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /**
   * Called when the panel has left the page, after React Aria's exit animation. CommandPalette acts on it. In
   * development, React's Strict Mode also calls it once as the panel mounts, when it runs every effect twice;
   * that is harmless as long as it acts only on work that is pending.
   */
  onUnmount?: () => void;
  children: ReactNode;
}

/** A press outside the panel closes it unless it lands in the toast region. Every library modal passes this. */
export function isOutsideToastRegion(element: Element): boolean {
  return element.closest('.toast-region') === null;
}

/**
 * What a modal does while it is on the page, from inside the panel, where React Aria's overlay state is: it
 * records what held focus when the modal opened, as the origin of the scope copy; it joins the overlay stack
 * while the state is open, so only the bottom-most modal paints its scrim; and when the panel leaves the page
 * after closing, it gives focus back to the origin if focus fell to the body with it, and calls `onUnmount`.
 * It renders nothing.
 *
 * Exported for Sheet, a modal on React Aria's Sheet family and not on this frame, which renders it first in
 * its content so it joins the same stack and copies its scope the same way. Internal: not exported from the
 * package.
 */
export function FrameEffects({
  id,
  scrimRef,
  originRef,
  onUnmount,
}: {
  id: string;
  scrimRef: RefObject<HTMLDivElement | null>;
  originRef: RefObject<Element | null>;
  onUnmount: (() => void) | undefined;
}): null {
  // The order is the point. This is the panel's first child, so its mount layout effect runs before anything
  // in the content: a native `autoFocus` there takes focus later in this same layout phase, and the panel's
  // ref attaches, and copies the scope, after both. Read here, focus is still on what opened the modal.
  const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? false;
  useGiveFocusBack(originRef, isOpen);
  useOverlayStack(id, isOpen, scrimRef);
  // The latest callback, so the one called at unmount is the one the caller passed last. It runs after focus
  // has been given back.
  const onUnmountRef = useRef(onUnmount);
  useLayoutEffect(() => {
    onUnmountRef.current = onUnmount;
  });
  useEffect(
    () => () => {
      onUnmountRef.current?.();
    },
    [],
  );
  return null;
}

/**
 * The modal composition Dialog, Drawer and CommandPalette share: React Aria's `ModalOverlay` as the scrim
 * and its `Modal` as the panel, with the shared overlay classes, the direction of the locale on the scrim,
 * the scope of what held focus when it opened copied onto the panel as it attaches, and the overlay stack.
 * Content that focuses a field as it mounts, as a palette's input does, needs no origin of its own. A press in the toast region never
 * closes it, and a press on the scrim does unless `isDismissable` is false.
 *
 * Internal: not exported from the package.
 */
export function ModalFrame({
  id: givenId,
  overlayClass,
  panelClass,
  panelAttributes,
  className,
  overlayClassName,
  panelRef,
  isDismissable = true,
  isKeyboardDismissDisabled,
  isOpen,
  defaultOpen,
  onOpenChange,
  onUnmount,
  children,
}: ModalFrameProps): ReactElement {
  const ownId = useId();
  const id = givenId ?? ownId;
  const { direction } = useLocale();
  const scrimRef = useRef<HTMLDivElement>(null);
  // What held focus when the modal opened, recorded by FrameEffects before the content can move focus.
  const originRef = useRef<Element | null>(null);
  const scopeRef = useOverlayScope(originRef);
  // Memoized, so React does not detach and attach the panel's refs on every render.
  const ref = useMemo(() => mergeRefs<HTMLDivElement>(panelRef, scopeRef), [panelRef, scopeRef]);
  return (
    <ModalOverlay
      ref={scrimRef}
      className={cx('overlay-scrim', overlayClass, overlayClassName)}
      dir={direction}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      shouldCloseOnInteractOutside={isOutsideToastRegion}
    >
      <Modal
        {...panelAttributes}
        ref={ref}
        className={composeRenderProps(className, (userClassName) => cx('overlay', panelClass, userClassName))}
      >
        <FrameEffects id={id} scrimRef={scrimRef} originRef={originRef} onUnmount={onUnmount} />
        {children}
      </Modal>
    </ModalOverlay>
  );
}
