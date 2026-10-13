'use client';

import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';

export type BottomTabBarProps = Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> &
  AriaName & {
    /** Three to five BottomTabBarItem elements. The bar warns once, in the console, outside that range. */
    children: ReactNode;
    ref?: Ref<HTMLElement>;
  };

/**
 * How many items the bar draws: a fragment's children count one by one, and a slot that renders nothing, such
 * as `{isAdmin && <Item />}` while false, counts as none. `Children.count` does neither.
 */
function itemCount(children: ReactNode): number {
  return Children.toArray(children).reduce<number>(
    (total, child) =>
      total +
      (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
        ? itemCount(child.props.children)
        : 1),
    0,
  );
}

/**
 * The phone's destinations, docked flush with the bottom edge with the safe area padded inside it: a named nav
 * of plain links in tab order, with no tab roles. CSS hides it from 1024px up, so it can sit in the page at
 * every width; inside an AppShell, pass it as `bottomBar` and the page keeps room for it.
 */
export function BottomTabBar({ children, className, ref, ...props }: BottomTabBarProps): ReactElement {
  const count = itemCount(children);
  // Once per mount: Strict Mode runs the effect twice on the same instance, and the ref survives that.
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || (count >= 3 && count <= 5)) return;
    warned.current = true;
    console.warn(
      `BottomTabBar holds ${String(count)} ${count === 1 ? 'item' : 'items'}; give it three to five.`,
    );
  }, [count]);
  return (
    <nav {...props} ref={ref} className={cx('tab-bar', className)}>
      <ul className="tab-bar-list">{children}</ul>
    </nav>
  );
}
