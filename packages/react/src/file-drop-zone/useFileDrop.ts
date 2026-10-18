'use client';

import { useRef, type DragEvent, type HTMLAttributes, type RefObject } from 'react';
import { useDrop, type DropOperation } from 'react-aria-components';
import { filesOf, holdsFiles, type TransferFiles } from './accept';

export interface FileDropOptions {
  ref: RefObject<HTMLElement | null>;
  isDisabled?: boolean;
  /** The files of a drop holding any, read from the native transfer during the drop. */
  onDropFiles: (dropped: TransferFiles) => void;
}

export interface FileDrop {
  /** The drop target's props, React Aria's with the library's reading of the drop. */
  dropProps: HTMLAttributes<HTMLElement>;
  /** Whether a drag holding files is over the target. */
  isDropTarget: boolean;
}

/**
 * React Aria's `useDrop` with no drop button (spec correction 5), for both zones. Every drag holding files is
 * taken as a copy and every other drag is cancelled, whatever the files' types, since Safari shows no types
 * during a drag (ruling 4); whether a drag holds files is read from the native event in the capture phase,
 * before React Aria asks, since React Aria's types do not say. The drop's files are read from the native
 * transfer by `filesOf`, not from React Aria's items, which keep only the files that have an entry.
 *
 * Internal: not exported from the package.
 */
export function useFileDrop({ ref, isDisabled = false, onDropFiles }: FileDropOptions): FileDrop {
  const holding = useRef(false);
  const { dropProps, isDropTarget } = useDrop({
    ref,
    hasDropButton: false,
    isDisabled,
    getDropOperation: (): DropOperation => (holding.current ? 'copy' : 'cancel'),
  });
  if (isDisabled) return { dropProps: {}, isDropTarget: false };
  const note = (event: DragEvent<HTMLElement>): void => {
    holding.current = holdsFiles(event.dataTransfer);
  };
  return {
    dropProps: {
      ...dropProps,
      onDragEnterCapture: note,
      onDragOverCapture: note,
      onDrop: (event: DragEvent<HTMLElement>) => {
        // Read during the event: a transfer is emptied once its handlers have run.
        const dropped = holdsFiles(event.dataTransfer) ? filesOf(event.dataTransfer) : null;
        dropProps.onDrop?.(event);
        if (dropped !== null && dropped.files.length > 0) onDropFiles(dropped);
      },
    },
    isDropTarget,
  };
}
