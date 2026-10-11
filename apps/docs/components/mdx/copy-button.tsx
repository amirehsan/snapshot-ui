'use client';

import type { ReactElement } from 'react';
import { useCopy } from '@/lib/use-copy';

/** Copies the code. The outcome is announced by a status region that is always mounted, so a screen reader hears it. */
export function CopyButton({ text }: { text: string }): ReactElement {
  const { outcome, copy } = useCopy(text);

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
