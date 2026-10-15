'use client';

import { X } from 'lucide-react';
import type { ReactElement, ReactNode, Ref } from 'react';
import {
  Dialog as RACDialog,
  Heading,
  VisuallyHidden,
  useLocale,
  type ModalRenderProps,
} from 'react-aria-components';
import { IconButton } from '../icon-button/IconButton';
import { keyboardScroll } from '../overlay/keyboard-scroll';
import { ModalFrame } from '../overlay/ModalFrame';
import { present } from '../utils/present';

export type DrawerPlacement = 'start' | 'end';

/**
 * The drawer's props, all of them. Unlike Dialog and Sheet, it passes no other React Aria dialog props
 * through, such as `aria-describedby`, `id` or `aria-label`. Its title names it.
 */
export interface DrawerProps {
  /** Which edge the panel comes from. `start` and `end` follow the writing direction. @default 'start' */
  placement?: DrawerPlacement;
  /** The title, an h2 in the header. It names the drawer. Required. */
  title: ReactNode;
  /** Keeps the title for assistive technology only, for a drawer whose content names itself, such as a navigation list. @default false */
  isTitleHidden?: boolean;
  /** The body. It scrolls. */
  children?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Pinned under the body, for an account row or an action. */
  footer?: ReactNode;
  /** A press on the scrim closes the drawer. @default true */
  isDismissable?: boolean;
  /** Escape no longer closes it. @default false */
  isKeyboardDismissDisabled?: boolean;
  /** An X in the header. @default true */
  hasCloseButton?: boolean;
  /** The close button's accessible name. @default 'Close' */
  closeLabel?: string;
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
 * A floating side panel on the scrim, from the start or the end edge: a header with the title, which names
 * it, and a close button, a body that scrolls, and a footer that stays. It floats 16px inside the viewport
 * on every side and slides in from its edge. Escape and a press on the scrim close it, focus moves in and
 * goes back to what opened it, and the page behind is held still and hidden from assistive technology.
 * Built on React Aria's Modal and Dialog. Open it from a `DialogTrigger`, or control it with `isOpen`.
 */
export function Drawer({
  placement = 'start',
  title,
  isTitleHidden = false,
  children,
  footer,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  hasCloseButton = true,
  closeLabel = 'Close',
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  overlayClassName,
  ref,
}: DrawerProps): ReactElement {
  const { direction } = useLocale();
  // The slide is on a physical axis, so the side is resolved here: the start is the left in left to right
  // and the right in right to left, and the end is the other one.
  const side = (placement === 'start') === (direction === 'ltr') ? 'left' : 'right';
  const heading = (
    <Heading slot="title" className="drawer-title">
      {title}
    </Heading>
  );
  const shownTitle = isTitleHidden ? <VisuallyHidden>{heading}</VisuallyHidden> : heading;
  return (
    <ModalFrame
      overlayClass="drawer-overlay"
      panelClass="drawer"
      panelAttributes={{ 'data-side': side }}
      className={className}
      overlayClassName={overlayClassName}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <RACDialog ref={ref} className="drawer-content">
        {({ close }) => (
          <>
            {isTitleHidden && !hasCloseButton ? (
              // Nothing in a header would show, so there is none: the hidden title, out of the flow, still
              // names the drawer, and the body's own padding is the top of the panel.
              shownTitle
            ) : (
              <div className="drawer-header">
                {shownTitle}
                {hasCloseButton ? (
                  <IconButton slot="close" aria-label={closeLabel} className="drawer-close">
                    <X />
                  </IconButton>
                ) : null}
              </div>
            )}
            <div className="drawer-body" ref={keyboardScroll}>
              {typeof children === 'function' ? children({ close }) : children}
            </div>
            {present(footer) ? <div className="drawer-footer">{footer}</div> : null}
          </>
        )}
      </RACDialog>
    </ModalFrame>
  );
}
