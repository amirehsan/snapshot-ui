'use client';

import { Upload } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { isAnotherModalOpen } from '../overlay/useOverlayStack';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';
import { acceptFiles, holdsFiles, type FileAcceptance, type TransferFiles } from './accept';
import { holdMissedDrops } from './missed-drop';
import { useFileDrop } from './useFileDrop';

export type PageDropZoneProps = FileAcceptance & {
  /** The overlay's line. Required: it says what a drop does. "Drop files to upload" */
  title: string;
  /** Where the files go, in slate: "To Documents, 2026". */
  description?: string;
  isDisabled?: boolean;
};

/** The mounted page zones, first mounted first: the first is the page's zone, every other stays idle. */
const zones: string[] = [];
const listeners = new Set<() => void>();

function tell(): void {
  for (const listener of listeners) listener();
}

const SECOND_ZONE =
  'PageDropZone: a page has one page drop zone; this one stays idle while another is mounted.';

/** The overlay, drawn only while a drag holding files is over the page. */
function Overlay({
  title,
  description,
  onDropFiles,
}: Pick<PageDropZoneProps, 'title' | 'description'> & {
  onDropFiles: (dropped: TransferFiles) => void;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const { dropProps, isDropTarget } = useFileDrop({ ref, onDropFiles });
  return (
    <div
      {...dropProps}
      ref={ref}
      className="page-drop-zone"
      aria-hidden="true"
      data-drop-target={isDropTarget ? '' : undefined}
    >
      <div className="page-drop-zone-card">
        <span className="page-drop-zone-icon">
          <Upload />
        </span>
        <p className="page-drop-zone-title">{title}</p>
        {present(description) ? <p className="page-drop-zone-description">{description}</p> : null}
      </div>
    </div>
  );
}

/**
 * A drop anywhere on the page: nothing on the server and nothing while idle; while a drag holding files is
 * over the window, an overlay over the workspace, clear of the rail, that takes the drop and runs the same check
 * as FileDropZone and FileButton. The overlay is for the pointer and hidden from assistive technology: put a
 * FileButton beside the page's title as its keyboard twin. A page has one page zone; a second stays idle and
 * warns. It stands down while a modal is open, and for a drag that holds no files, such as a row or a tag.
 */
export function PageDropZone({
  title,
  description,
  isDisabled = false,
  acceptedFileTypes,
  maxFileSize,
  allowsMultiple,
  maxFiles,
  onFiles,
}: PageDropZoneProps): ReactElement | null {
  const id = useId();
  const [role, setRole] = useState<'pending' | 'page' | 'idle'>('pending');
  const [shown, setShown] = useState(false);
  /** The drag's depth: one up for each enter holding files and one down for each leave, on the document. */
  const depth = useRef(0);

  useWarnOnce(role === 'idle' ? SECOND_ZONE : null);

  useEffect(() => {
    zones.push(id);
    const update = (): void => {
      setRole(zones[0] === id ? 'page' : 'idle');
    };
    listeners.add(update);
    tell();
    return () => {
      listeners.delete(update);
      const index = zones.indexOf(id);
      if (index >= 0) zones.splice(index, 1);
      tell();
    };
  }, [id]);

  const active = role === 'page' && !isDisabled;

  useEffect(() => {
    if (!active) return;
    const release = holdMissedDrops();
    // In the capture phase: a drop target on the page, the overlay among them, stops its drag events where
    // they land, and the count must see every one.
    const enter = (event: DragEvent): void => {
      // A row or a tag dragged inside the page never holds 'Files'; a modal open over the page stands it down.
      if (!holdsFiles(event.dataTransfer) || isAnotherModalOpen()) return;
      depth.current += 1;
      if (depth.current === 1) setShown(true);
    };
    const leave = (): void => {
      if (depth.current === 0) return;
      depth.current -= 1;
      if (depth.current === 0) setShown(false);
    };
    const end = (): void => {
      depth.current = 0;
      setShown(false);
    };
    document.addEventListener('dragenter', enter, true);
    document.addEventListener('dragleave', leave, true);
    document.addEventListener('drop', end, true);
    document.addEventListener('dragend', end, true);
    return () => {
      document.removeEventListener('dragenter', enter, true);
      document.removeEventListener('dragleave', leave, true);
      document.removeEventListener('drop', end, true);
      document.removeEventListener('dragend', end, true);
      release();
      depth.current = 0;
      setShown(false);
    };
  }, [active]);

  if (!active || !shown) return null;
  return (
    <Overlay
      title={title}
      description={description}
      onDropFiles={({ files, folders }) => {
        const { accepted, rejected } = acceptFiles(
          files,
          { acceptedFileTypes, maxFileSize, allowsMultiple, maxFiles },
          folders,
        );
        if (accepted.length > 0 || rejected.length > 0) onFiles(accepted, rejected);
      }}
    />
  );
}
