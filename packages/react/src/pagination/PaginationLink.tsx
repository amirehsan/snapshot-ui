'use client';

import { useRef, type ReactElement, type ReactNode } from 'react';
import { Link as RACLink } from 'react-aria-components';
import { useHandOff } from './useHandOff';

export interface PaginationLinkProps {
  className: string;
  'aria-label'?: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  step?: 'previous' | 'next';
  /** Built by the shell from the app's `getPageHref`; left out for a disabled step. */
  href?: string;
  children: ReactNode;
}

/**
 * A page link in link mode: React Aria's Link, so a press routes through RouterProvider and a modified press
 * falls through to the browser. Disabled, it has no `href`, and React Aria draws a span with `role="link"` and
 * `aria-disabled` and no tab stop. Private to Pagination; it receives only strings, booleans and the shell's
 * server-rendered children, so a server page can render the shell.
 */
export function PaginationLink({
  className,
  isCurrent = false,
  isDisabled = false,
  step,
  href,
  children,
  ...props
}: PaginationLinkProps): ReactElement {
  const ref = useRef<HTMLAnchorElement>(null);
  const handOff = useHandOff(ref, isDisabled);
  return (
    <RACLink
      {...props}
      ref={ref}
      className={className}
      href={isDisabled ? undefined : href}
      isDisabled={isDisabled}
      aria-current={isCurrent ? 'page' : undefined}
      data-step={step}
      onFocus={step === undefined ? undefined : handOff.onFocus}
      onBlur={step === undefined ? undefined : handOff.onBlur}
    >
      {children}
    </RACLink>
  );
}
