'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { cx } from '../utils/cx';
import { QUIET_MS } from '../utils/quiet';

export interface DataTableStatusProps {
  /** What to say once it has held for `QUIET_MS`, or '' for nothing. */
  message: string;
  /** Merged after `data-table-status`: the count's status is also `data-table-count`. */
  className?: string;
}

/**
 * One of DataTable's visually hidden polite regions: the loading words, or the bar's count. It is always
 * mounted, outside the busy face, and empty at first render, so the server's HTML says nothing and a screen
 * reader hears the text arrive. It takes `message`
 * `QUIET_MS` after the message last changed, so a load shorter than that says nothing, and it empties at once
 * when the message goes. Private to DataTable.
 */
export function DataTableStatus({ message, className }: DataTableStatusProps): ReactElement {
  const [said, setSaid] = useState('');
  useEffect(() => {
    if (message === '') return;
    const timer = setTimeout(() => {
      setSaid(message);
    }, QUIET_MS);
    return () => {
      clearTimeout(timer);
      // The next message waits its own QUIET_MS, even when it is the same words.
      setSaid('');
    };
  }, [message]);
  return (
    <span className={cx('data-table-status', className)} role="status">
      {message === '' ? '' : said}
    </span>
  );
}
