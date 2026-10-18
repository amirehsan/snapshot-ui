'use client';

import { Upload } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { copyScope } from '../overlay/useOverlayScope';
import { isAnotherModalOpen } from '../overlay/useOverlayStack';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';
import { acceptFiles, filesOf, holdsFiles, type FileAcceptance, type TransferFiles } from './accept';
import { holdMissedDrops, isTextEntry } from './missed-drop';
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

/** The overlay, drawn only while a drag holding files is over the page, in the host its zone found. */
function Overlay({
  title,
  description,
  origin,
  onDropFiles,
}: Pick<PageDropZoneProps, 'title' | 'description'> & {
  /** Where the zone is mounted: the overlay takes its theme, shape, density and direction. */
  origin: Element;
  onDropFiles: (dropped: TransferFiles) => void;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const { dropProps, isDropTarget } = useFileDrop({ ref, onDropFiles });
  useLayoutEffect(() => {
    const root = ref.current;
    if (root === null) return;
    copyScope(root, origin);
    root.setAttribute('dir', getComputedStyle(origin).direction === 'rtl' ? 'rtl' : 'ltr');
  }, [origin]);
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

/** Where the overlay is drawn: the closest AppShell, which declares the rail's width, else the body. */
interface Host {
  container: Element;
  origin: Element;
}

/**
 * A drop anywhere on the page: nothing on the server and nothing while idle; while a drag holding files is
 * over the window, an overlay over the workspace, clear of the rail, that takes the drop and runs the same check
 * as FileDropZone and FileButton. A paste of files with focus outside a text field runs the check too. The
 * overlay is for the pointer and hidden from assistive technology: put a FileButton beside the page's title as
 * its keyboard twin. The overlay is drawn in the closest AppShell, or the body, so no ancestor's `transform`,
 * `filter` or `backdrop-filter` (a page header's blur) confines it; mount the zone at the page's root. A page has
 * one page zone; a second stays idle and warns. It stands down while a modal is open, and for a drag that holds
 * no files, such as a row or a tag.
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
  const [host, setHost] = useState<Host | null>(null);
  /** A hidden mark in place while the overlay shows, from which the host is found. */
  const marker = useRef<HTMLSpanElement>(null);
  /** The check with the latest props and `onFiles`, for the overlay's drop and the document's paste. */
  const take = useRef<(dropped: TransferFiles) => void>(() => undefined);
  useLayoutEffect(() => {
    take.current = ({ files, folders }) => {
      const { accepted, rejected } = acceptFiles(
        files,
        { acceptedFileTypes, maxFileSize, allowsMultiple, maxFiles },
        folders,
      );
      if (accepted.length > 0 || rejected.length > 0) onFiles(accepted, rejected);
    };
  });

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
    /**
     * The elements the drag has entered and not yet left. A set, as React Aria's useDrop keeps one, rather than
     * a count: an element removed under the pointer (a toast that leaves) never gets its leave, so each enter
     * and leave first forgets the elements no longer in the document.
     */
    const entered = new Set<EventTarget>();
    let showing = false;
    let hiding: ReturnType<typeof setTimeout> | undefined;
    /** Shows or hides the overlay, and cancels a hide a drop scheduled. */
    const show = (value: boolean): void => {
      clearTimeout(hiding);
      if (showing === value) return;
      showing = value;
      setShown(value);
    };
    const forget = (): void => {
      for (const target of entered) {
        if (target instanceof Node && !target.isConnected) entered.delete(target);
      }
    };
    // In the capture phase: a drop target on the page, the overlay among them, stops its drag events where
    // they land, and the set must see every one (spec correction 25).
    const enter = (event: DragEvent): void => {
      // A row or a tag dragged inside the page never holds 'Files'; a modal open over the page stands it down.
      if (!holdsFiles(event.dataTransfer) || isAnotherModalOpen()) return;
      forget();
      if (event.target !== null) entered.add(event.target);
      show(true);
    };
    const leave = (event: DragEvent): void => {
      if (entered.size === 0) return;
      if (event.target !== null) entered.delete(event.target);
      forget();
      if (entered.size === 0) show(false);
    };
    // A drop hides the overlay only once the drop has been dispatched: a browser runs the microtasks between
    // one listener and the next, where React commits a state set outside its own handlers, so hiding it here
    // would take the overlay away before its own drop handler ran (spec correction 30).
    const drop = (): void => {
      entered.clear();
      clearTimeout(hiding);
      hiding = setTimeout(() => {
        show(false);
      }, 0);
    };
    const end = (): void => {
      entered.clear();
      show(false);
    };
    // No pointer event reaches the page during a drag, so one means the drag is over, however its leave went
    // missing (an Escape the engine never reported). A touch is left alone: a second finger may hold the drag.
    const pointer = (event: PointerEvent): void => {
      if (showing && event.pointerType !== 'touch') end();
    };
    // A paste of files anywhere on the page, with focus outside a text field, runs the same check, as a drop
    // does. A part that took the paste, such as a zone's button, has prevented its default.
    const paste = (event: ClipboardEvent): void => {
      if (event.defaultPrevented || isTextEntry(event.target) || isAnotherModalOpen()) return;
      const pasted = filesOf(event.clipboardData);
      if (pasted.files.length === 0) return;
      event.preventDefault();
      take.current(pasted);
    };
    document.addEventListener('dragenter', enter, true);
    document.addEventListener('dragleave', leave, true);
    document.addEventListener('drop', drop, true);
    document.addEventListener('dragend', end, true);
    document.addEventListener('pointermove', pointer, true);
    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('paste', paste);
    return () => {
      document.removeEventListener('dragenter', enter, true);
      document.removeEventListener('dragleave', leave, true);
      document.removeEventListener('drop', drop, true);
      document.removeEventListener('dragend', end, true);
      document.removeEventListener('pointermove', pointer, true);
      document.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('paste', paste);
      clearTimeout(hiding);
      release();
      setShown(false);
    };
  }, [active]);

  const drawn = active && shown;

  // The host is found from the mark once it is in the document, before the first paint of the overlay.
  useLayoutEffect(() => {
    const mark = marker.current;
    if (!drawn || mark === null) {
      setHost(null);
      return;
    }
    setHost({ container: mark.closest('.app-shell') ?? document.body, origin: mark });
  }, [drawn]);

  if (!drawn) return null;
  return (
    <>
      <span ref={marker} hidden />
      {host === null
        ? null
        : createPortal(
            <Overlay
              title={title}
              description={description}
              origin={host.origin}
              onDropFiles={(dropped) => {
                take.current(dropped);
              }}
            />,
            host.container,
          )}
    </>
  );
}
