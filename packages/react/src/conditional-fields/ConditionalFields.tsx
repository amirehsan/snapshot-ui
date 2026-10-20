'use client';

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../utils/cx';
import {
  afterCommit,
  focusableBefore,
  focusIsLost,
  focusNamedPlace,
  useFocusWatch,
} from '../utils/focus-after-commit';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface ConditionalFieldsProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
  /** Whether the fields show: the gate's state, the app's. */
  isShown: boolean;
  /** The fields that depend on the gate. */
  children: ReactNode;
  /**
   * Whether hidden fields still submit with the form and are still checked by it. Hidden fields always keep their
   * values in the page. @default false
   */
  submitsWhenHidden?: boolean;
  /** The group's id, for the gate's `aria-controls`. Default from `useId`, readable through `ref`. */
  id?: string;
  ref?: Ref<HTMLFieldSetElement>;
}

/** The first element outside `group` whose `aria-controls` names `id`: the gate that shows the group. */
function gateOf(group: HTMLElement, id: string): HTMLElement | null {
  const named = group.ownerDocument.querySelectorAll<HTMLElement>('[aria-controls]');
  for (const element of named) {
    if (group.contains(element)) continue;
    if ((element.getAttribute('aria-controls') ?? '').split(/\s+/).includes(id)) return element;
  }
  return null;
}

/**
 * Fields a gate shows and hides, such as a logo provider and its key under a "Show bank logos" Switch. Place it right
 * after the gate and point the gate's `aria-controls` at its `id`. While hidden the group is a `hidden`, `inert` and
 * `disabled` fieldset: its fields keep what the reader typed, since nothing unmounts or clears them, but they are out
 * of the tab order, the accessibility tree, the form's submission and the browser's checks, so a hidden required
 * field never blocks a save and a hidden secret is never sent. `submitsWhenHidden` keeps them in the submission and
 * the checks. A group that hides while focus is in it gives focus to the gate, in the frame after the commit.
 */
export function ConditionalFields({
  isShown,
  children,
  submitsWhenHidden = false,
  id: givenId,
  className,
  ref,
  ...props
}: ConditionalFieldsProps): ReactElement {
  const ownId = useId();
  const id = givenId ?? ownId;
  const groupRef = useRef<HTMLFieldSetElement>(null);
  // The app's ref is given the fieldset itself, where it reads the id the gate names.
  useImperativeHandle<HTMLFieldSetElement | null, HTMLFieldSetElement | null>(
    ref,
    () => groupRef.current,
    [],
  );
  const watch = useFocusWatch(groupRef);
  const isNamed = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;

  // Focus out of a group that hides while holding it: to the gate, else what comes before, else main. Only a change
  // after the first commit moves anything, so the server's render and hydration never do; showing never does.
  const wasShown = useRef(isShown);
  useEffect(() => {
    const didHide = wasShown.current && !isShown;
    wasShown.current = isShown;
    if (!didHide || !watch.held()) return;
    return afterCommit(() => {
      const group = groupRef.current;
      watch.release();
      if (group === null || !focusIsLost()) return;
      focusNamedPlace(gateOf(group, id) ?? focusableBefore(group));
    });
  }, [isShown, id, watch]);

  // A group no gate points at cannot give focus back to it, and a screen reader cannot tell what shows it.
  const [hasNoGate, setHasNoGate] = useState(false);
  useEffect(() => {
    const group = groupRef.current;
    if (group !== null && gateOf(group, id) === null) setHasNoGate(true);
  }, [id]);
  useWarnOnce(
    hasNoGate
      ? `ConditionalFields "${id}" has no gate: give the control that shows it aria-controls="${id}", so focus can go back to it when the group hides.`
      : null,
  );

  const isHidden = !isShown;
  return (
    <fieldset
      role={isNamed ? undefined : 'none'}
      {...props}
      id={id}
      ref={groupRef}
      className={cx('conditional-fields', className)}
      hidden={isHidden}
      inert={isHidden}
      disabled={isHidden && !submitsWhenHidden}
      data-hidden={isHidden ? '' : undefined}
    >
      {children}
    </fieldset>
  );
}
