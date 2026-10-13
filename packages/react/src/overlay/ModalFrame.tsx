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
import { useOverlayScope } from './useOverlayScope';
import { useOverlayStack } from './useOverlayStack';

export interface ModalFrameProps {
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
  /** Called when the panel has left the page, after React Aria's exit animation. CommandPalette acts on it. */
  onUnmount?: () => void;
  children: ReactNode;
}

/** A press outside the panel closes it unless it lands in the toast region. Every library modal passes this. */
export function isOutsideToastRegion(element: Element): boolean {
  return element.closest('.toast-region') === null;
}

/**
 * What a modal does while it is on the page, from inside the panel, where React Aria's overlay state is: it
 * joins the overlay stack while the state is open, so only the bottom-most modal paints its scrim, and it
 * calls `onUnmount` when the panel leaves the page. It renders nothing.
 */
function FrameEffects({
  id,
  scrimRef,
  onUnmount,
}: {
  id: string;
  scrimRef: RefObject<HTMLDivElement | null>;
  onUnmount: (() => void) | undefined;
}): null {
  const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? false;
  useOverlayStack(id, isOpen, scrimRef);
  // The latest callback, so the one called at unmount is the one the caller passed last.
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
 * the scope copied onto the panel as it attaches, and the overlay stack. A press in the toast region never
 * closes it, and a press on the scrim does unless `isDismissable` is false.
 *
 * Internal: not exported from the package.
 */
export function ModalFrame({
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
  const id = useId();
  const { direction } = useLocale();
  const scrimRef = useRef<HTMLDivElement>(null);
  const scopeRef = useOverlayScope();
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
        <FrameEffects id={id} scrimRef={scrimRef} onUnmount={onUnmount} />
        {children}
      </Modal>
    </ModalOverlay>
  );
}
