'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { QUIET_MS } from '../utils/quiet';

export interface DataTableStatusProps {
  /** What to say once it has held for `QUIET_MS`, or '' for nothing. */
  message: string;
}

/**
 * DataTable's visually hidden polite region. It is always mounted, outside the busy face, and empty at first
 * render, so the server's HTML says nothing and a screen reader hears the text arrive. It takes `message`
 * `QUIET_MS` after the message last changed, so a load shorter than that says nothing, and it empties at once
 * when the message goes. Private to DataTable.
 */
export function DataTableStatus({ message }: DataTableStatusProps): ReactElement {
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
    <span className="data-table-status" role="status">
      {message === '' ? '' : said}
    </span>
  );
}
