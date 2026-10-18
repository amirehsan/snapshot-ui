'use client';

import { Card, UploadList, type UploadItem } from '@snapshot-ui/react';
import { useState, type CSSProperties, type ReactElement } from 'react';
import { UPLOADS } from './uploads-data';

/**
 * The rows run to the card's sides, so the card names its padding beside them, none, for what reads it. The
 * buttons in its corners, the first and last rows' trailing buttons, keep their own round: circles in Rounded,
 * and clear of the card's smaller curve in Soft.
 */
const HOLDER = {
  width: '100%',
  maxWidth: '28rem',
  paddingInline: 0,
  paddingBlock: 'var(--spacing-part)',
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
