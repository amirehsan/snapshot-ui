'use client';

import { Card, UploadList, type UploadItem } from '@snapshot-ui/react';
import { useState, type CSSProperties, type ReactElement } from 'react';
import { UPLOADS } from './uploads-data';

/**
 * The card is the list's rounded holder, and names its corner so the buttons in its corners, the first and last
 * rows' trailing buttons, are concentric with it: its radius, its 1px edge, and its padding beside the rows,
 * none, since the rows run to its sides.
 */
const HOLDER = {
  width: '100%',
  maxWidth: '28rem',
  paddingInline: 0,
  paddingBlock: 'var(--spacing-part)',
  '--holder-radius': 'var(--radius-stadium)',
  '--holder-border': '1px',
  '--holder-pad': '0px',
} as CSSProperties;

export default function UploadListStatuses(): ReactElement {
  const [items, setItems] = useState<UploadItem[]>(UPLOADS);
  const drop = (id: UploadItem['id']): void => {
    setItems((each) => each.filter((item) => item.id !== id));
  };
  return (
    <Card style={HOLDER}>
      <UploadList
        aria-label="Uploads"
        items={items}
        onRemove={drop}
        onCancel={drop}
        onRetry={(id) => {
          // Retried at once, as a fresh upload: the app would send the file again.
          setItems((each) =>
            each.map((item) =>
              item.id === id
                ? { id, name: item.name, status: 'uploading', progress: 0, progressLabel: '0 of 12 MB' }
                : item,
            ),
          );
        }}
      />
    </Card>
  );
}
