'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { QUIET_MS } from '../utils/quiet';

export interface PaginationStatusProps {
  /** The range the app formats, spoken once it has settled. */
  rangeLabel: string;
  /** A sentence to warn once per mount, given by the shell when it clamped the page. */
  warning?: string;
}

/**
 * The visually hidden polite region that speaks the range. Empty at first render, so loading a page says
 * nothing; it takes the range `QUIET_MS` after it last changed, so three quick presses of Next say one range.
 * It also gives the shell's clamp warning, since the shell has no effects of its own. Private to Pagination.
 */
export function PaginationStatus({ rangeLabel, warning }: PaginationStatusProps): ReactElement {
  const [message, setMessage] = useState('');
  const last = useRef(rangeLabel);
  useEffect(() => {
    // The first render, and Strict Mode's second effect, find the label unchanged: nothing to say.
    if (rangeLabel === last.current) return;
    last.current = rangeLabel;
    const timer = setTimeout(() => {
      setMessage(rangeLabel);
    }, QUIET_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [rangeLabel]);
  // Once per mount: Strict Mode runs the effect twice on the same instance, and the ref survives that.
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || warning === undefined) return;
    warned.current = true;
    console.warn(warning);
  }, [warning]);
  return (
    <span className="pagination-status" role="status">
      {message}
    </span>
  );
}
