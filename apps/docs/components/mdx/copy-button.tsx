'use client';

import { useState, type ReactElement } from 'react';

export function CopyButton({ text }: { text: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="icon-button icon-button-ghost code-copy"
      type="button"
      aria-label={copied ? 'Copied' : 'Copy code'}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        });
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
        {copied ? (
          <path d="m5 12.5 5 5 9-10" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
    </button>
  );
}
