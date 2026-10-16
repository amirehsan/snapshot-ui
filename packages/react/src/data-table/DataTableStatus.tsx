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
 * reader hears the text arrive. It takes `message` `QUIET_MS` after the message last changed, so a load shorter
 * than that says nothing, and it empties at once when the message goes, so the next message is heard again. A
 * run of changes that ends on the words it already says, as a count of 2, 3, 2, changes nothing and is not said
 * twice. Private to DataTable.
 */
export function DataTableStatus({ message, className }: DataTableStatusProps): ReactElement {
  const [said, setSaid] = useState('');
  // A message that goes forgets what was said, so the next one waits its own QUIET_MS, even in the same words.
  const [last, setLast] = useState(message);
  if (message !== last) {
    setLast(message);
    if (message === '') setSaid('');
  }
  useEffect(() => {
    if (message === '') return;
    const timer = setTimeout(() => {
      setSaid(message);
    }, QUIET_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [message]);
  return (
    <span className={cx('data-table-status', className)} role="status">
      {message === '' ? '' : said}
    </span>
  );
}
