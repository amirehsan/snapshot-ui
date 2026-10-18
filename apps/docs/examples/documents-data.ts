/** One line of a document, as the reader reviews it: a date, an amount and a memo. */
export interface DocumentLine {
  id: string;
  /** An ISO date, or null once the reader has erased it. */
  date: string | null;
  /** In cents; 0 when the total could not be read. */
  amount: number;
  memo: string;
}

/** A document the app holds once a file has been read: its lines, and whether the reader has reviewed them. */
export interface DocumentRecord {
  id: string;
  name: string;
  lines: DocumentLine[];
  isReviewed: boolean;
}

/** What the server holds before anything is uploaded. The docs make no request, so nothing here is ever sent. */
export const DOCUMENTS: readonly DocumentRecord[] = [
  {
    id: 'statement-september',
    name: 'Statement, September',
    isReviewed: false,
    lines: [
      { id: 'l1', date: '2026-09-03', amount: 4218, memo: 'Corner Mart' },
      { id: 'l2', date: '2026-09-12', amount: 275, memo: 'City Transit' },
      { id: 'l3', date: '2026-09-28', amount: 1890, memo: 'Green Grocer' },
    ],
  },
  {
    id: 'receipt-corner-mart',
    name: 'Receipt, Corner Mart',
    isReviewed: false,
    lines: [{ id: 'l1', date: '2026-10-14', amount: 4218, memo: 'Milk and bread' }],
  },
  {
    id: 'lease-agreement',
    name: 'Lease agreement',
    isReviewed: true,
    lines: [{ id: 'l1', date: '2026-08-01', amount: 120000, memo: 'Deposit' }],
  },
];

/** The largest file the simulated server takes, as an app's server would refuse a larger one. */
export const MAX_BYTES = 10 * 1024 * 1024;

/** What the simulated server makes of a file once it has read it: saved, needing review, or refused. */
export type Outcome =
  { status: 'saved' } | { status: 'review'; reason: string } | { status: 'failed'; reason: string };

/**
 * The server's answer, by the file: over 10 MB it is refused, and a file whose name holds "blurry" is read
 * without its total, so it needs review. Everything else is saved.
 */
export function outcomeOf(file: { name: string; size: number }): Outcome {
  if (file.size > MAX_BYTES) return { status: 'failed', reason: 'Over 10 MB' };
  if (/blurry/i.test(file.name)) return { status: 'review', reason: 'The total could not be read' };
  return { status: 'saved' };
}

/** The document a file becomes: one line dated today, its amount 0 when the total could not be read. */
export function documentOf(id: string, fileName: string, outcome: Outcome): DocumentRecord {
  const stem = fileName.replace(/\.[^.]+$/, '');
  return {
    id,
    name: stem,
    isReviewed: false,
    lines: [{ id: 'l1', date: '2026-10-16', amount: outcome.status === 'review' ? 0 : 1250, memo: stem }],
  };
}

/** The app's words for a size, "1.8 of 4 MB", in ASCII digits, written by the app and never by the library. */
export function sizeLabel(sent: number, size: number): string {
  const mb = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '');
  return `${mb(sent)} of ${mb(size)} MB`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The app's own words for a day, "14 Oct 2026", for the server's HTML: twelve month names, no Intl. */
export function dayLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${String(day)} ${MONTHS[(month ?? 1) - 1] ?? ''} ${String(year)}`;
}
