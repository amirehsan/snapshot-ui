'use client';

import { IconButton } from '@snapshot-ui/react';
import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

export default function IconButtonStates(): ReactElement {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <IconButton
        aria-label="Copy"
        onPress={() => {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            setCopied(false);
          }, 2000);
        }}
      >
        {copied ? <Check /> : <Copy />}
      </IconButton>
      <span className="visually-hidden" role="status">
        {copied ? 'Copied' : ''}
      </span>
      <IconButton aria-label="Copy" isDisabled>
        <Copy />
      </IconButton>
      <IconButton variant="outline" aria-label="Copy" isDisabled>
        <Copy />
      </IconButton>
    </div>
  );
}
