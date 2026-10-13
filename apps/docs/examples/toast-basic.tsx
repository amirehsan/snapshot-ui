'use client';

import { Button, ToastRegion, toast, type ToastOptions } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const EVENTS: ToastOptions[] = [
  { title: 'Saved', description: 'Your changes are live.', tone: 'success' },
  { title: 'Sync started', description: 'New transactions show up in a minute or two.', tone: 'info' },
  {
    title: 'Low on storage',
    description: 'The workspace has used 9.2 of its 10 GB. Archive old files or add room in Settings.',
    tone: 'warning',
  },
  {
    title: 'Import failed',
    description: 'The file is not a CSV. Choose another one and try again.',
    tone: 'error',
  },
];

export default function ToastBasic(): ReactElement {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
      {EVENTS.map((options) => (
        <Button
          key={options.tone}
          variant="secondary"
          onPress={() => {
            toast(options);
          }}
        >
          {options.title}
        </Button>
      ))}
      {/* Mounted once, at the app root. This page's one region is here. */}
      <ToastRegion />
    </div>
  );
}
