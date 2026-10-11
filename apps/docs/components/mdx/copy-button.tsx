'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';

type Outcome = 'Copied' | 'Copy failed' | '';

/** Copies the code. The outcome is announced by a status region that is always mounted, so a screen reader hears it. */
export function CopyButton({ text }: { text: string }): ReactElement {
  const [outcome, setOutcome] = useState<Outcome>('');
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
    let result: Outcome = 'Copy failed';
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

  return (
    <>
      <button
        className="icon-button icon-button-ghost code-copy"
        type="button"
        aria-label="Copy code"
        onClick={() => {
          void copy();
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {outcome === 'Copied' ? (
            <path d="m5 12.5 5 5 9-10" />
          ) : (
            <>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </>
          )}
        </svg>
      </button>
      <span className="visually-hidden" role="status">
        {outcome}
      </span>
    </>
  );
}
