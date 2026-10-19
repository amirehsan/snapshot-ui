'use client';

import { CopyButton, Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const ANSWER =
  'Spending on food is down 12% this month, mostly from fewer restaurant visits. Groceries held steady at $410.';

export default function CopyButtonAnswer(): ReactElement {
  // While an answer streams in, the app marks its body aria-busy="true" and sets it false once it has finished.
  const isStreaming = false;
  return (
    <article aria-label="Answer" className="stack" style={{ width: '100%', maxWidth: '36rem' }}>
      <div aria-busy={isStreaming}>
        <Text>{ANSWER}</Text>
      </div>
      {/* The footer is never busy, so the copy button's status in it is always heard. */}
      <footer className="row">
        <CopyButton value={ANSWER} labels={{ copy: 'Copy answer' }} />
      </footer>
    </article>
  );
}
