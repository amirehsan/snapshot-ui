'use client';

import { Upload } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Description } from '../field/Description';
import { Label } from '../field/Label';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { acceptFiles, filesOf, type FileAcceptance, type FileRejection, type TransferFiles } from './accept';
import { FileButton } from './FileButton';
import { holdMissedDrops } from './missed-drop';
import { useFileDrop } from './useFileDrop';

export interface FileDropZoneLabels {
  /** The line beside the button where a pointer can drag. @default 'Drag files here or' ('Drag a file here or' without allowsMultiple) */
  dragHint: string;
  /** The button. @default 'Choose files' ('Choose a file') */
  choose: string;
  /** The line while files are over the zone. @default 'Drop to upload' */
  drop: string;
  /** The error line after a drop with refusals, given the count as `formatCount` writes it. @default (count) => `${count} files were not added` */
  rejected: (count: string) => string;
}

export type FileDropZoneBaseProps = FileAcceptance & {
  /** The field's name, above the zone. */
  label?: ReactNode;
  /** The zone's name where no label is shown, such as in a grid row. */
  'aria-label'?: string;
  /** The id of an element that names the zone, where no label is shown. */
  'aria-labelledby'?: string;
  /** The rules, in the app's words, under the zone: "PDF, JPG or PNG, up to 10 MB". */
  description?: ReactNode;
  /** The error line. Replaces the library's line about refused files. */
  errorMessage?: ReactNode;
  /** Invalid by the app's word, showing `errorMessage`. */
  isInvalid?: boolean;
  isDisabled?: boolean;
  /**
   * On a phone, opens the camera instead of the file picker: `environment` the back camera, `user` the front.
   * A desktop browser ignores it. Handed to the zone's button.
   */
  capture?: 'user' | 'environment';
  /** How counts are written, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<FileDropZoneLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/** The props of FileDropZone. The types require a name: a visible `label`, an `aria-label` or an `aria-labelledby`. */
export type FileDropZoneProps = FileDropZoneBaseProps & AccessibleName<'label'>;

const defaultLabels = (allowsMultiple: boolean): FileDropZoneLabels => ({
  dragHint: allowsMultiple ? 'Drag files here or' : 'Drag a file here or',
  choose: allowsMultiple ? 'Choose files' : 'Choose a file',
  drop: 'Drop to upload',
  rejected: (count) => `${count} files were not added`,
});

/**
 * A field that takes files: a dashed box to drop them on, a button that opens the picker and takes a paste, the
 * rules under it and a polite line for the files it refused. One tab stop, the button. Every way in runs one check against `acceptedFileTypes`, `maxFileSize`, `allowsMultiple` and `maxFiles`, and reaches
 * `onFiles` with the accepted files and the refusals with their reasons; the library never reads or sends a
 * file. While mounted, a files drop beside the zone does nothing rather than open the file in the tab.
 */
export function FileDropZone({
  label,
  description,
  errorMessage,
  isInvalid = false,
  isDisabled = false,
  capture,
  formatCount = String,
  labels: labelsProp,
  className,
  ref,
  acceptedFileTypes,
  maxFileSize,
  allowsMultiple = false,
  maxFiles,
  onFiles,
  ...props
}: FileDropZoneProps): ReactElement {
  const labels = { ...defaultLabels(allowsMultiple), ...labelsProp };
  const labelId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  /** How many files the last drop, paste or choice refused, and which one it was, so a repeat is said again. */
  const [refused, setRefused] = useState({ count: 0, round: 0 });
  const acceptance = { acceptedFileTypes, maxFileSize, allowsMultiple, maxFiles };

  useEffect(() => holdMissedDrops(), []);

  const settle = (accepted: File[], rejected: FileRejection[]): void => {
    setRefused((last) => ({ count: rejected.length, round: last.round + 1 }));
    onFiles(accepted, rejected);
  };
  const take = ({ files, folders }: TransferFiles): void => {
    const { accepted, rejected } = acceptFiles(files, acceptance, folders);
    if (accepted.length > 0 || rejected.length > 0) settle(accepted, rejected);
  };

  const { dropProps, isDropTarget } = useFileDrop({ ref: boxRef, isDisabled, onDropFiles: take });

  const onPaste = (event: ClipboardEvent<HTMLDivElement>): void => {
    if (isDisabled) return;
    const pasted = filesOf(event.clipboardData);
    if (pasted.files.length === 0) return;
    event.preventDefault();
    take(pasted);
  };

  const labelled = present(label);
  const invalid = isInvalid || refused.count > 0;
  const line: ReactNode = present(errorMessage)
    ? errorMessage
    : refused.count > 0
      ? labels.rejected(formatCount(refused.count))
      : null;
  const describedBy = [present(description) ? descriptionId : null, invalid ? statusId : null]
    .filter((id) => id !== null)
    .join(' ');

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={labelled ? labelId : props['aria-labelledby']}
      aria-label={labelled ? undefined : props['aria-label']}
      className={cx('file-drop-zone', 'field', className)}
      data-invalid={invalid ? '' : undefined}
      aria-disabled={isDisabled ? true : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-drop-target={isDropTarget ? '' : undefined}
    >
      {labelled ? (
        <div className="field-head">
          <Label elementType="span" id={labelId}>
            {label}
          </Label>
        </div>
      ) : null}
      {/* A paste on the zone's button bubbles here (ruling 3); the button is the zone's one tab stop. */}
      <div
        {...dropProps}
        ref={boxRef}
        className="file-drop-zone-box"
        data-drop-target={isDropTarget ? '' : undefined}
        onPaste={onPaste}
      >
        <span className="file-drop-zone-icon" aria-hidden="true">
          <Upload />
        </span>
        <div className="file-drop-zone-line">
          <span className="file-drop-zone-hint">{labels.dragHint}</span>
          <span className="file-drop-zone-drop" aria-hidden="true">
            {labels.drop}
          </span>
          <FileButton
            variant="secondary"
            isDisabled={isDisabled}
            capture={capture}
            aria-describedby={describedBy === '' ? undefined : describedBy}
            onFiles={settle}
            {...acceptance}
          >
            {labels.choose}
          </FileButton>
        </div>
      </div>
      {present(description) ? <Description id={descriptionId}>{description}</Description> : null}
      <div id={statusId} className="file-drop-zone-status field-error" role="status">
        {invalid && present(line) ? <span key={refused.round}>{line}</span> : null}
      </div>
    </div>
  );
}
