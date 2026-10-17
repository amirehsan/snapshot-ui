/** Where a file is: in flight (`waiting`, `uploading`, `reading`) or settled (`saved`, `review`, `failed`). */
export type UploadStatus = 'waiting' | 'uploading' | 'reading' | 'saved' | 'review' | 'failed';

/** One file the app is uploading, in the app's words. The library never reads or sends it. */
export interface UploadItem {
  /** Stable across updates. */
  id: string | number;
  /** The file's name, as the reader chose it. */
  name: string;
  status: UploadStatus;
  /** From 0 to 1 while uploading. Without it an uploading row draws an indeterminate bar. */
  progress?: number;
  /** The progress in the app's words: "1.2 of 4 MB". @default the percentage, "45%" */
  progressLabel?: string;
  /** Why it failed or what needs review, in the app's words: "Over 10 MB", "The total could not be read". Required for 'failed'. */
  reason?: string;
  /** The document the file became. The name links there, through the router. */
  href?: string;
}

/** How many files are in each status, and in all. */
export interface UploadCounts {
  total: number;
  waiting: number;
  uploading: number;
  reading: number;
  saved: number;
  review: number;
  failed: number;
}

/** Whether a file is still on its way: waiting, uploading or being read. */
export function isInFlight(status: UploadStatus): boolean {
  return status === 'waiting' || status === 'uploading' || status === 'reading';
}

/** Counts the files in each status. */
export function countUploads(items: readonly UploadItem[]): UploadCounts {
  const counts: UploadCounts = {
    total: items.length,
    waiting: 0,
    uploading: 0,
    reading: 0,
    saved: 0,
    review: 0,
    failed: 0,
  };
  for (const { status } of items) counts[status] += 1;
  return counts;
}

/** How many of the counted files are in flight. */
export function inFlightOf(counts: UploadCounts): number {
  return counts.waiting + counts.uploading + counts.reading;
}
