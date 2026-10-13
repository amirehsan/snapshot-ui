'use client';

import {
  Children,
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
 * The phone's destinations, docked flush with the bottom edge with the safe area padded inside it: a named nav
 * of plain links in tab order, with no tab roles. CSS hides it from 1024px up, so it can sit in the page at
 * every width; inside an AppShell, pass it as `bottomBar` and the page keeps room for it.
 */
export function BottomTabBar({ children, className, ref, ...props }: BottomTabBarProps): ReactElement {
  const count = Children.count(children);
  // Once per mount: Strict Mode runs the effect twice on the same instance, and the ref survives that.
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || (count >= 3 && count <= 5)) return;
    warned.current = true;
    console.warn(`BottomTabBar holds ${String(count)} items; give it three to five.`);
  }, [count]);
  return (
    <nav {...props} ref={ref} className={cx('tab-bar', className)}>
      <ul className="tab-bar-list">{children}</ul>
    </nav>
  );
}
