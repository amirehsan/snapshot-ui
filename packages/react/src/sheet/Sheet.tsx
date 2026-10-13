'use client';

import { X } from 'lucide-react';
import { useId, useRef, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  Heading,
  Sheet as RACSheet,
  SheetBackdrop,
  SheetContent,
  SheetOverlay,
  Text,
  VisuallyHidden,
  composeRenderProps,
  useLocale,
  type SheetRenderProps,
} from 'react-aria-components';
import { IconButton } from '../icon-button/IconButton';
import { keyboardScroll } from '../overlay/keyboard-scroll';
import { FrameEffects, isOutsideToastRegion } from '../overlay/ModalFrame';
import { useOverlayScope } from '../overlay/useOverlayScope';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export { SheetTrigger, type SheetTriggerProps } from 'react-aria-components';

export interface SheetProps {
  /** The title, an h2 in the header. It names the sheet. Required. */
  title: ReactNode;
  /** Keeps the title for assistive technology only, for a sheet whose content names itself, such as a "More" list. @default false */
  isTitleHidden?: boolean;
  /** A line under the title, in slate. It becomes the sheet's accessible description. */
  description?: ReactNode;
  /** The body. It scrolls once the sheet is fully open. */
  children?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Pinned under the body, padded for the safe area. */
  footer?: ReactNode;
  /** Heights the sheet rests at, in px or as percentages of the sheet. It opens at the first. Passed through to React Aria. */
  snapPoints?: (number | string)[];
  /** A swipe, Escape or a scrim press closes it. `false` keeps it open until a button closes it (React Aria's `preventDismissal`). @default true */
  isDismissable?: boolean;
  /** The decorative handle above the title. @default true */
  hasGrabber?: boolean;
  /** An X in the header, the keyboard's way out. @default true */
  hasCloseButton?: boolean;
  /** The close button's accessible name. @default 'Close' */
  closeLabel?: string;
  /** Open state, for a sheet without a `SheetTrigger`. Controlled and uncontrolled. */
  isOpen?: boolean;
  defaultOpen?: boolean;
  /** Called when the sheet asks to open or close. In a `SheetTrigger` the trigger owns the state, so put it there. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Goes on the sheet panel, merged after the library's classes. */
  className?: string | ((values: SheetRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the backdrop, the sheet's scrim. */
  overlayClassName?: string;
  /** A ref to the content element, the dialog React Aria focuses. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * A bottom sheet for phones: a panel that rises from the bottom edge over the scrim, as tall as its content
 * up to 92% of the viewport, with a grabber, a header with the title, which names it, a description and a
 * close button, a body that scrolls, and a footer that stays. A swipe down, Escape and a press on the scrim
 * close it, focus moves in once it has risen and goes back to what opened it, and the page behind is held
 * still and hidden from assistive technology. Built on React Aria's Sheet family, which drives the swipe with
 * the browser's own scroll. Open it from a `SheetTrigger`, or control it with `isOpen`.
 */
export function Sheet({
  title,
  isTitleHidden = false,
  description,
  children,
  footer,
  snapPoints,
  isDismissable = true,
  hasGrabber = true,
  hasCloseButton = true,
  closeLabel = 'Close',
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  overlayClassName,
  ref,
}: SheetProps): ReactElement {
  const id = useId();
  const descriptionId = useId();
  const { direction } = useLocale();
  // The backdrop is the scrim the overlay stack marks when this sheet is not the bottom-most modal.
  const scrimRef = useRef<HTMLDivElement>(null);
  // What held focus when the sheet opened, recorded by FrameEffects before the content can move focus.
  const originRef = useRef<Element | null>(null);
  const scopeRef = useOverlayScope(originRef);
  const isDescribed = present(description);
  const heading = (
    <Heading slot="title" className="sheet-title">
      {title}
    </Heading>
  );
  const shownTitle = isTitleHidden ? <VisuallyHidden>{heading}</VisuallyHidden> : heading;
  return (
    <SheetOverlay
      className="sheet-overlay"
      dir={direction}
      position="bottom"
      snapPoints={snapPoints}
      preventDismissal={!isDismissable}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      shouldCloseOnInteractOutside={isOutsideToastRegion}
    >
      <SheetBackdrop
        ref={scrimRef}
        className={cx('overlay-scrim', 'sheet-scrim', overlayClassName)}
        swipeAnimation="sheet-scrim-fade"
      />
      <RACSheet
        ref={scopeRef}
        className={composeRenderProps(className, (userClassName) => cx('overlay', 'sheet', userClassName))}
      >
        <SheetContent
          ref={ref}
          // React Aria wires the description slot only for an alert dialog, so the dialog points at it here.
          aria-describedby={isDescribed ? descriptionId : undefined}
          className="sheet-content"
        >
          {({ close }) => (
            <>
              <FrameEffects id={id} scrimRef={scrimRef} originRef={originRef} onUnmount={undefined} />
              {hasGrabber ? (
                <div className="sheet-grabber-band">
                  <div className="sheet-grabber" aria-hidden="true" />
                </div>
              ) : null}
              {isTitleHidden && !hasCloseButton && !isDescribed ? (
                // Nothing in a header would show, so there is none: the hidden title, out of the flow, still
                // names the sheet.
                shownTitle
              ) : (
                <div className="sheet-header">
                  <div className="sheet-header-text">
                    {shownTitle}
                    {isDescribed ? (
                      <Text
                        slot="description"
                        elementType="p"
                        id={descriptionId}
                        className="sheet-description"
                      >
                        {description}
                      </Text>
                    ) : null}
                  </div>
                  {hasCloseButton ? (
                    <IconButton slot="close" aria-label={closeLabel} className="sheet-close">
                      <X />
                    </IconButton>
                  ) : null}
                </div>
              )}
              <div className="sheet-body" ref={keyboardScroll}>
                {typeof children === 'function' ? children({ close }) : children}
              </div>
              {present(footer) ? <div className="sheet-footer">{footer}</div> : null}
            </>
          )}
        </SheetContent>
      </RACSheet>
    </SheetOverlay>
  );
}
