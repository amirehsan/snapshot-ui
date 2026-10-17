// No directive: a pure module, imported only by the client parts.

/** Why a file was refused. */
export type FileRejectionReason = 'type' | 'size' | 'count' | 'empty';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

/** What every way in accepts. The same props, checked by the same function, on a drop, a paste and a press. */
export interface FileAcceptance {
  /**
   * MIME types, wildcards and extensions, as an `<input accept>` takes them: 'application/pdf', 'image/*', '.heic'.
   * Absent or empty takes any file.
   */
  acceptedFileTypes?: readonly string[];
  /** The largest file, in bytes. */
  maxFileSize?: number;
  /** Several files at once. @default false */
  allowsMultiple?: boolean;
  /**
   * The most files one drop, paste or choice may add; the rest are refused as 'count'.
   * @default 1, or no limit with `allowsMultiple`
   */
  maxFiles?: number;
  /**
   * Called once per drop, paste or choice, with the files that passed and those that did not, each in the order
   * given. Never called with both empty.
   */
  onFiles: (accepted: File[], rejected: FileRejection[]) => void;
}

export interface AcceptResult {
  accepted: File[];
  rejected: FileRejection[];
}

/** Whether a file's MIME type or extension matches an `accept` entry, case-insensitively. */
export function matchesType(file: File, types: readonly string[]): boolean {
  const entries = types.map((type) => type.trim().toLowerCase()).filter((type) => type !== '');
  if (entries.length === 0) return true;
  const mime = (file.type.split(';')[0] ?? '').trim().toLowerCase();
  const name = file.name.toLowerCase();
  return entries.some((entry) => {
    if (entry.startsWith('.')) return name.endsWith(entry);
    // An empty type, as a browser gives a file it does not know (a HEIC photo on some systems), matches no
    // MIME entry: the extension entries decide it.
    if (mime === '') return false;
    if (entry.endsWith('/*')) return mime.startsWith(entry.slice(0, -1));
    return mime === entry;
  });
}

/**
 * The one check every way in runs (rulings 1 and 2): each file in order, refused for the first reason that
 * holds, type, then empty, then size, then count, which counts only the files accepted so far. A file in
 * `folders` stands for a dropped folder and is refused as 'type' before any other check (spec correction 16).
 */
export function acceptFiles(
  files: Iterable<File>,
  { acceptedFileTypes = [], maxFileSize, allowsMultiple = false, maxFiles }: Omit<FileAcceptance, 'onFiles'>,
  folders: ReadonlySet<File> = new Set(),
): AcceptResult {
  const limit = maxFiles ?? (allowsMultiple ? Number.POSITIVE_INFINITY : 1);
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    const reason: FileRejectionReason | null =
      folders.has(file) || !matchesType(file, acceptedFileTypes)
        ? 'type'
        : file.size === 0
          ? 'empty'
          : maxFileSize !== undefined && file.size > maxFileSize
            ? 'size'
            : accepted.length >= limit
              ? 'count'
              : null;
    if (reason === null) accepted.push(file);
    else rejected.push({ file, reason });
  }
  return { accepted, rejected };
}

/** What a drop or a paste holds: its files in order, a folder standing as an empty `File` of its name. */
export interface TransferFiles {
  files: File[];
  folders: Set<File>;
}

/** The parts of a `DataTransfer` the reader uses, so a test can hand it a plain object. */
export type FileTransfer = Pick<DataTransfer, 'items' | 'files'>;

/**
 * The files of a drop or a paste, read from the native transfer during its event, in order. A folder, which
 * `webkitGetAsEntry()` names as a directory, becomes `new File([], name)` in `folders` and its entries are never
 * read. React Aria's own reading keeps only the items that have an entry, and a file a script puts in a
 * transfer has none in Chromium and WebKit, so the library reads the transfer itself and a play's drop takes
 * the path a real one does (spec corrections 5 and 24).
 */
export function filesOf(transfer: FileTransfer | null | undefined): TransferFiles {
  const files: File[] = [];
  const folders = new Set<File>();
  if (transfer == null) return { files, folders };
  const items = [...transfer.items].filter((item) => item.kind === 'file');
  if (items.length === 0) {
    files.push(...transfer.files);
    return { files, folders };
  }
  for (const item of items) {
    const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
    if (entry?.isDirectory === true) {
      const folder = new File([], entry.name);
      folders.add(folder);
      files.push(folder);
      continue;
    }
    const file = item.getAsFile();
    if (file !== null) files.push(file);
  }
  return { files, folders };
}

/** Whether a drag holds files: its types include 'Files' in every engine, Safari's included (ruling 4). */
export function holdsFiles(transfer: Pick<DataTransfer, 'types'> | null | undefined): boolean {
  return transfer != null && Array.from(transfer.types).includes('Files');
}
