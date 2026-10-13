'use client';

import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  OverlayArrow,
  Tooltip as RACTooltip,
  TooltipContext,
  TooltipTrigger as RACTooltipTrigger,
  TooltipTriggerStateContext,
  composeRenderProps,
  useLocale,
  useSlottedContext,
  type Placement,
  type TooltipProps as RACTooltipProps,
  type TooltipRenderProps,
  type TooltipTriggerComponentProps as RACTooltipTriggerComponentProps,
} from 'react-aria-components';
import { Shortcut } from '../overlay/Shortcut';
import { useOverlayScope } from '../overlay/useOverlayScope';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';

export interface TooltipTriggerProps extends RACTooltipTriggerComponentProps {
  /** Milliseconds of hover before it opens. @default 400 */
  delay?: number;
  /** Milliseconds after the pointer leaves before it closes, so the pointer can cross onto the tip. @default 120 */
  closeDelay?: number;
}

/**
 * Wraps a trigger element and a Tooltip. Built on React Aria's TooltipTrigger with the library's delays. The
 * trigger must be focusable and take React Aria's hover and focus, as `Button`, `IconButton` and `Link` do; a
 * static element needs React Aria's `Focusable` around it. `isDisabled` turns the tip off, for a label that is
 * already visible.
 */
export function TooltipTrigger({
  delay = 400,
  closeDelay = 120,
  ...props
}: TooltipTriggerProps): ReactElement {
  return <RACTooltipTrigger {...props} delay={delay} closeDelay={closeDelay} />;
}

export interface TooltipProps extends Omit<RACTooltipProps, 'className' | 'children' | 'style'> {
  /** The text. It is the trigger's accessible description while open. */
  children: ReactNode;
  /** A key hint after the text, such as "K" or "Mod K", drawn as a key on the tip. */
  shortcut?: string;
  /** @default 'top' */
  placement?: Placement;
  /** The gap to the trigger, the arrow included. @default 12 */
  offset?: number;
  /** Goes on the tip, merged after the library's classes. */
  className?: string | ((values: TooltipRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

/**
 * Closes the open tip of the trigger around it when the window resizes. React Aria closes a tip when an
 * ancestor of its trigger scrolls, and only moves it on a resize; the library closes it then too. A tip given
 * its own `isOpen` or `defaultOpen` keeps a state of its own, which this leaves alone.
 */
function useCloseOnResize(hasOwnState: boolean): void {
  const state = useContext(TooltipTriggerStateContext);
  const isOpen = !hasOwnState && (state?.isOpen ?? false);
  // The latest state, so the listener closes the tip as it is now.
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });
  useEffect(() => {
    if (!isOpen) return;
    const close = (): void => {
      stateRef.current?.close(true);
    };
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);
}

/**
 * The ink tip with canvas text, an 8px arrow and an optional key chip, 12px from its trigger, flipped when the
 * screen has no room. Inside a `TooltipTrigger` it opens after 400ms of hover with a mouse and at once on
 * keyboard focus, never for touch, and stays while the pointer crosses onto it; Escape, a press of the
 * trigger, a scroll of a box around it and a resize of the window close it. It is the trigger's accessible
 * description while open, so it adds to a name and never replaces one. Built on React Aria's Tooltip.
 */
export function Tooltip({
  children,
  shortcut,
  placement = 'top',
  offset = 12,
  className,
  ref,
  ...props
}: TooltipProps): ReactElement {
  // The trigger React Aria positions the tip against: the caller's `triggerRef`, or the one its TooltipTrigger
  // hands over. The scope is copied from it, so a tip opened by hover takes the trigger's theme, shape and
  // density whatever holds focus.
  const context = useSlottedContext(TooltipContext);
  const scopeRef = useOverlayScope(props.triggerRef ?? context?.triggerRef);
  // Memoized, so React does not detach and attach the tip's refs on every render.
  const tipRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, scopeRef), [ref, scopeRef]);
  // React Aria writes no direction on a tip, so it is the locale's.
  const { direction } = useLocale();
  useCloseOnResize(props.isOpen != null || props.defaultOpen != null);
  return (
    <RACTooltip
      {...props}
      ref={tipRef}
      dir={direction}
      placement={placement}
      offset={offset}
      className={composeRenderProps(className, (userClassName) => cx('overlay', 'tooltip', userClassName))}
    >
      <OverlayArrow className="tooltip-arrow">
        <svg width={8} height={8} viewBox="0 0 8 8" aria-hidden="true">
          <path d="M0 0 4 4 8 0" />
        </svg>
      </OverlayArrow>
      {children}
      {shortcut !== undefined && present(shortcut) ? (
        <Shortcut keys={shortcut} className="tooltip-shortcut" />
      ) : null}
    </RACTooltip>
  );
}
