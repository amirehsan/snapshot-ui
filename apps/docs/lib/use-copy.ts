'use client';

import { useEffect, useRef, useState } from 'react';

export type CopyOutcome = 'Copied' | 'Copy failed' | '';

/**
 * Copies `text` and holds the outcome for two seconds, for a status region that is
 * always mounted to announce. Where there is no clipboard, or it refuses, the outcome
 * is a failure rather than an error.
 */
export function useCopy(text: string): { outcome: CopyOutcome; copy: () => Promise<void> } {
  const [outcome, setOutcome] = useState<CopyOutcome>('');
  const timer = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (): Promise<void> => {
    // The Clipboard API is missing outside secure contexts, whatever its type says.
    const clipboard = navigator.clipboard as Clipboard | undefined;
    let result: CopyOutcome = 'Copy failed';
    try {
      if (clipboard) {
        await clipboard.writeText(text);
        result = 'Copied';
      }
    } catch {
      // Denied or unavailable: the status says so.
    }
    setOutcome(result);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOutcome('');
    }, 2000);
  };

  return { outcome, copy };
}
