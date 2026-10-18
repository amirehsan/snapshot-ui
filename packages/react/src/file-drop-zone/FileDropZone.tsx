'use client';

import { Upload } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Description } from '../field/Description';
import { Label } from '../field/Label';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import {
  acceptFiles,
  filesOf,
  type FileAcceptance,
  type FileRejection,
  type FileRejectionReason,
  type TransferFiles,
} from './accept';
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
  /**
   * The error line after a drop, paste or choice with refusals, given how many were refused, that count as
   * `formatCount` writes it, and the refusals with their reasons.
   * @default "1 file was not added: it is too large", or "3 files were not added" where the reasons differ
   */
  rejected: (count: number, formatted: string, rejected: readonly FileRejection[]) => string;
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
   * A desktop browser ignores it. Handed to the zone's button, which is then the camera's only, so a phone can
   * no longer choose a PDF: prefer a second FileButton with `capture` beside the zone, and list an image type.
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

/** Why the refused files were not added, for one file and for several, in the default line. */
const WHY: Record<FileRejectionReason, readonly [one: string, several: string]> = {
  type: ['its type is not accepted', 'their type is not accepted'],
  size: ['it is too large', 'they are too large'],
  empty: ['it is empty', 'they are empty'],
  count: ['too many files at once', 'too many files at once'],
};

/** "1 file was not added: it is empty", with the reason where every refusal shares one. */
function rejectedLine(count: number, formatted: string, rejected: readonly FileRejection[]): string {
  const one = count === 1;
  const line = one ? `${formatted} file was not added` : `${formatted} files were not added`;
  const reason = rejected[0]?.reason;
  if (reason === undefined || rejected.some((each) => each.reason !== reason)) return line;
  return `${line}: ${WHY[reason][one ? 0 : 1]}`;
}

const defaultLabels = (allowsMultiple: boolean): FileDropZoneLabels => ({
  dragHint: allowsMultiple ? 'Drag files here or' : 'Drag a file here or',
  choose: allowsMultiple ? 'Choose files' : 'Choose a file',
  drop: 'Drop to upload',
  rejected: rejectedLine,
});

/**
 * A field that takes files: a dashed box to drop them on, a button that opens the picker and takes a paste, the
 * rules under it and a polite line for the files it refused. One tab stop, the button; a click anywhere on the
 * box opens the picker too. Every way in runs one check against `acceptedFileTypes`, `maxFileSize`,
 * `allowsMultiple` and `maxFiles`, and reaches `onFiles` with the accepted files and the refusals with their
 * reasons; the library never reads or sends a file. List an extension beside each MIME type, since systems
 * disagree on types (Windows gives a .csv `application/vnd.ms-excel`). While mounted, a files drop beside the
 * zone does nothing rather than open the file in the tab.
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
  /** The files the last drop, paste or choice refused, and which one it was, so a repeat is said again. */
  const [refused, setRefused] = useState<{ rejected: readonly FileRejection[]; round: number }>({
    rejected: [],
    round: 0,
  });
  const acceptance = { acceptedFileTypes, maxFileSize, allowsMultiple, maxFiles };

  useEffect(() => holdMissedDrops(), []);

  const settle = (accepted: File[], rejected: FileRejection[]): void => {
    setRefused((last) => ({ rejected, round: last.round + 1 }));
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

  // A click on the box beside the button opens the picker, as the button does: the click is forwarded to the
  // button's input, cleared first as React Aria clears it at a press, so the box adds no tab stop.
  const onClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (isDisabled || !(event.target instanceof Element) || event.target.closest('button, input') !== null)
      return;
    const input = boxRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
    if (input == null) return;
    input.value = '';
    input.click();
  };

  const labelled = present(label);
  const count = refused.rejected.length;
  const invalid = isInvalid || count > 0;
  const line: ReactNode = present(errorMessage)
    ? errorMessage
    : count > 0
      ? labels.rejected(count, formatCount(count), refused.rejected)
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
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- a pointer's larger target for the button, which is the keyboard's one stop (ruling 3) */}
      <div
        {...dropProps}
        ref={boxRef}
        className="file-drop-zone-box"
        data-drop-target={isDropTarget ? '' : undefined}
        onPaste={onPaste}
        onClick={onClick}
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
