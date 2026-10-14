'use client';

import { useRef, type ReactElement, type ReactNode } from 'react';
import { Button as RACButton } from 'react-aria-components';
import { useHandOff } from './useHandOff';

export interface PaginationButtonProps {
  className: string;
  'aria-label'?: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  step?: 'previous' | 'next';
  /** The page a press goes to. */
  page: number;
  onPageChange: (page: number) => void;
  children: ReactNode;
}

/**
 * A page button in button mode: React Aria's Button, which calls `onPageChange` with its page. The current page
 * is `aria-current="true"` and a press on it calls nothing. Private to Pagination, which a client component
 * renders in this mode, since a function cannot cross to the client.
 */
export function PaginationButton({
  className,
  isCurrent = false,
  isDisabled = false,
  step,
  page,
  onPageChange,
  children,
  ...props
}: PaginationButtonProps): ReactElement {
  const ref = useRef<HTMLButtonElement>(null);
  const handOff = useHandOff(ref, isDisabled);
  return (
    <RACButton
      {...props}
      ref={ref}
      className={className}
      isDisabled={isDisabled}
      aria-current={isCurrent ? 'true' : undefined}
      data-step={step}
      onPress={() => {
        if (!isCurrent) onPageChange(page);
      }}
      onFocus={step === undefined ? undefined : handOff.onFocus}
      onBlur={step === undefined ? undefined : handOff.onBlur}
    >
      {children}
    </RACButton>
  );
}
