'use client';

import {
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Link as RACLink, type LinkProps as RACLinkProps } from 'react-aria-components';
import { mergeRefs } from '../utils/merge-refs';

/** What a link must not hold: anything that takes focus of its own. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A linked StatTile: React Aria's Link around the tile's content, so a press routes through RouterProvider
 * and a modified press falls through to the browser. Private to the tile, and the only part of it that is a
 * client module.
 */
export function StatTileLink({
  href,
  children,
  ref,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  href: string;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}): ReactElement {
  const own = useRef<HTMLElement>(null);
  // A callback ref, so the HTMLElement ref the tile declares fits the anchor.
  const merged = useMemo(() => mergeRefs<HTMLElement>(own, ref), [ref]);
  // Once per mount: Strict Mode runs the effect twice on the same instance, and the ref survives that.
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || !own.current?.querySelector(FOCUSABLE)) return;
    warned.current = true;
    console.warn(
      'StatTile with href holds a focusable element; a link cannot hold a link or a button. Move it out of the tile.',
    );
  }, []);
  // The tile's attributes are an HTML element's, whose focus handlers take an HTMLElement event where React
  // Aria's take an Element one; React Aria hands them the anchor's own events, so the cast only widens a type.
  return (
    <RACLink {...(props as RACLinkProps)} href={href} ref={merged}>
      {children}
    </RACLink>
  );
}
