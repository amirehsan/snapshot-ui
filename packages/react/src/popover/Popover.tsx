'use client';

import { useMemo, useRef, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  Popover as RACPopover,
  PopoverContext,
  composeRenderProps,
  useSlottedContext,
  type Placement,
  type PopoverProps as RACPopoverProps,
  type PopoverRenderProps,
} from 'react-aria-components';
import { useGiveFocusBack } from '../overlay/useGiveFocusBack';
import { useOverlayScope } from '../overlay/useOverlayScope';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';

/**
 * React Aria's placement, a side and an optional alignment such as `'bottom start'`, as Popover, Menu and
 * Tooltip take it, so an app can type one without importing React Aria.
 */
export type { Placement } from 'react-aria-components';

export interface PopoverProps extends Omit<RACPopoverProps, 'className' | 'children' | 'style'> {
  /** The content: free content, padded with `isPadded`, or a list that pads itself. */
  children:
    ReactNode | ((values: PopoverRenderProps & { defaultChildren: ReactNode | undefined }) => ReactNode);
  /** Pads free content 24px. Lists and menus pad themselves, so it is off by default. @default false */
  isPadded?: boolean;
  /** Makes the trigger's width the popover's minimum. @default false */
  matchTriggerWidth?: boolean;
  /** @default 'bottom start' */
  placement?: Placement;
  /** The gap to the trigger. @default 8 */
  offset?: number;
  /** Goes on the popover element, merged after the library's classes. */
  className?: string | ((values: PopoverRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLElement>;
}

/**
 * Rendered first in the popover's content, so it reads what held focus before the content takes it, and gives
 * focus back to that as the popover leaves the page after closing, before a dialog under it can take it.
 */
function GiveFocusBack({ isOpen }: { isOpen: boolean }): null {
  const originRef = useRef<Element | null>(null);
  useGiveFocusBack(originRef, isOpen);
  return null;
}

/**
 * The float surface a menu, a listbox or a small panel opens in: the float fill, the frame, the surface
 * corner and the float shadow, 8px from its trigger at its start edge, flipped to the other side and shifted
 * along it when the screen has no room, with no arrow. Outside presses, Escape and blur close it, and focus
 * goes back to the trigger. Built on React Aria's Popover. Open free content from a `DialogTrigger`, which
 * makes the popover a dialog named by the trigger and focuses it, holds Tab inside it, and makes the page
 * behind inert and still, as a modal does, though nothing dims it; Menu brings its own trigger.
 */
export function Popover({
  isPadded = false,
  matchTriggerWidth = false,
  placement,
  className,
  children,
  ref,
  ...props
}: PopoverProps): ReactElement {
  // The trigger React Aria positions the popover against: the caller's `triggerRef`, or the one the component
  // that opened it hands over, a DialogTrigger's or a MenuTrigger's. The scope is copied from it and not from
  // what holds focus, since a popover opened by its default or by the app's own state was opened by no press,
  // and focus can be anywhere.
  const context = useSlottedContext(PopoverContext, props.slot);
  const triggerRef = props.triggerRef ?? context?.triggerRef;
  // React Aria reads the trigger as soon as the popover opens, and with none it fails on an undefined `current`
  // that names nothing. This says what is missing instead, on the server and in the browser alike.
  if ((props.isOpen === true || props.defaultOpen === true) && triggerRef == null) {
    throw new Error(
      'Popover: a popover opened with `isOpen` or `defaultOpen` outside a DialogTrigger or MenuTrigger needs ' +
        '`triggerRef`, a ref to the element it opens against.',
    );
  }
  const scopeRef = useOverlayScope(triggerRef);
  // Memoized, so React does not detach and attach the popover's refs on every render.
  const popoverRef = useMemo(() => mergeRefs<HTMLElement>(ref, scopeRef), [ref, scopeRef]);
  return (
    <RACPopover
      {...props}
      ref={popoverRef}
      // The caller's side, else the one the trigger component asks for, else under the trigger at its start.
      placement={placement ?? context?.placement ?? 'bottom start'}
      className={composeRenderProps(className, (userClassName) =>
        cx(
          'overlay',
          'popover',
          isPadded && 'popover-padded',
          matchTriggerWidth && 'popover-match-trigger',
          userClassName,
        ),
      )}
    >
      {composeRenderProps(children, (content, { isExiting }) => (
        <>
          <GiveFocusBack isOpen={!isExiting} />
          {content}
        </>
      ))}
    </RACPopover>
  );
}
