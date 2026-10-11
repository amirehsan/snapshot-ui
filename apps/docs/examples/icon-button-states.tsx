'use client';

import { IconButton } from '@snapshot-ui/react';
import { Check, Copy } from 'lucide-react';
import { useState, type ReactElement } from 'react';

export default function IconButtonStates(): ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <IconButton
        aria-label={copied ? 'Copied' : 'Copy'}
        onPress={() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        }}
      >
        {copied ? <Check /> : <Copy />}
      </IconButton>
      <IconButton aria-label="Copy" isDisabled>
        <Copy />
      </IconButton>
      <IconButton variant="outline" aria-label="Copy" isDisabled>
        <Copy />
      </IconButton>
    </div>
  );
}
