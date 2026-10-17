import { useEffect, useRef, useState } from 'react';
import { QUIET_MS } from '../utils/quiet';
import { countUploads, inFlightOf, isInFlight, type UploadCounts, type UploadItem } from './counts';

/** How counts are written, such as in Persian digits. */
type FormatCount = (count: number) => string;

/** The three things the tray says, in the app's words. */
export interface UploadAnnouncementLabels {
  /** Said once as a batch starts, with the counts of the files in it. @default "Uploading 5 files" */
  started: (counts: UploadCounts, format: FormatCount) => string;
  /** Said for rows that turned failed or needs review, gathered over QUIET_MS. @default "1 upload failed" */
  attention: (counts: { failed: number; review: number }, format: FormatCount) => string;
  /** Said once every row of the batch has settled. @default "5 uploads finished: 3 saved, 1 needs review, 1 failed" */
  settled: (counts: UploadCounts, format: FormatCount) => string;
}

/** A word and its plural, by the count. English only: every other language passes its own labels. */
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/** The English defaults. */
export const DEFAULT_ANNOUNCEMENTS: UploadAnnouncementLabels = {
  started: ({ total }, format) => `Uploading ${format(total)} ${plural(total, 'file', 'files')}`,
  attention: ({ failed, review }, format) =>
    [
      failed > 0 ? `${format(failed)} ${plural(failed, 'upload', 'uploads')} failed` : null,
      review > 0 ? `${format(review)} ${plural(review, 'needs', 'need')} review` : null,
    ]
      .filter((part) => part !== null)
      .join(', '),
  settled: ({ total, saved, review, failed }, format) => {
    const parts = [
      saved > 0 ? `${format(saved)} saved` : null,
      review > 0 ? `${format(review)} ${plural(review, 'needs', 'need')} review` : null,
      failed > 0 ? `${format(failed)} failed` : null,
    ].filter((part) => part !== null);
    return `${format(total)} ${plural(total, 'upload', 'uploads')} finished: ${parts.join(', ')}`;
  },
};

/** What the status host shows: the words, keyed so the same words twice are a new node and are said twice. */
export interface UploadAnnouncement {
  key: number;
  text: string;
}

type Timer = ReturnType<typeof setTimeout>;

/** What the hook remembers between updates. A fresh one on every mount, so Strict Mode's rehearsal starts over. */
interface Memory {
  /** Each row's status at the last update, or null before the first: the first is the baseline. */
  previous: Map<UploadItem['id'], UploadItem['status']> | null;
  /** The items now, for the timers to read when they fall due. */
  items: readonly UploadItem[];
  /** The ids in the running batch, or null between batches. */
  batch: Set<UploadItem['id']> | null;
  started: Timer | undefined;
  settled: Timer | undefined;
  attention: Timer | undefined;
  /** The rows that turned failed or needs review since the tray last spoke of them. */
  pending: Set<UploadItem['id']>;
}

const fresh = (): Memory => ({
  previous: null,
  items: [],
  batch: null,
  started: undefined,
  settled: undefined,
  attention: undefined,
  pending: new Set(),
});

/**
 * What the tray says, and when (ruling 10). Each message is keyed, so the status host says the same words twice
 * when they come twice, as the toast host does.
 * - started: once, QUIET_MS after a batch starts (something goes in flight with no batch running), with the
 *   counts of the batch's files at that moment, so files added during the pause are in it; later additions are
 *   silent. Nothing is said if none is in flight by then: the summary says it.
 * - attention: rows that turned failed or review since the last time it spoke, gathered by a timer that waits
 *   QUIET_MS after the last such change, so a burst is one sentence; a row that arrives already failed counts.
 * - settled: once nothing is in flight, QUIET_MS after the last row settles; anything going in flight before it
 *   speaks cancels it and the batch runs on, with no new started. A pending attention is dropped when settled
 *   speaks, since the summary says it. Settled ends the batch.
 * Statuses seen on the first render are the baseline: a tray mounted over settled items says nothing, and one
 * mounted mid-batch starts one. Never a percentage, never uploading, reading or saved on its own.
 */
export function useUploadAnnouncements(
  items: readonly UploadItem[],
  labels: UploadAnnouncementLabels,
  formatCount: FormatCount,
): UploadAnnouncement | null {
  const [message, setMessage] = useState<UploadAnnouncement | null>(null);
  const memory = useRef<Memory | null>(null);
  // The timers speak in the words of the latest render.
  const words = useRef({ labels, formatCount });
  useEffect(() => {
    words.current = { labels, formatCount };
  });

  useEffect(() => {
    const own = fresh();
    memory.current = own;
    return () => {
      clearTimeout(own.started);
      clearTimeout(own.settled);
      clearTimeout(own.attention);
      memory.current = null;
    };
  }, []);

  useEffect(() => {
    const own = memory.current;
    if (own === null) return;
    const say = (text: string): void => {
      if (text === '') return;
      setMessage((last) => ({ key: (last?.key ?? 0) + 1, text }));
    };
    /** The counts of the batch's files still in the list. */
    const batchCounts = (): UploadCounts => {
      const batch = own.batch;
      return countUploads(batch === null ? [] : own.items.filter((item) => batch.has(item.id)));
    };
    const speakStarted = (): void => {
      own.started = undefined;
      const counts = batchCounts();
      if (inFlightOf(counts) > 0) say(words.current.labels.started(counts, words.current.formatCount));
    };
    const speakSettled = (): void => {
      own.settled = undefined;
      const counts = batchCounts();
      own.batch = null;
      // The summary says what the attention would have.
      clearTimeout(own.attention);
      own.attention = undefined;
      own.pending.clear();
      if (counts.total > 0) say(words.current.labels.settled(counts, words.current.formatCount));
    };
    const speakAttention = (): void => {
      own.attention = undefined;
      // A summary is on its way, and it says this.
      if (own.settled !== undefined) return;
      // Only the rows still failed or needing review: one retried meanwhile is on its way again.
      const counts = countUploads(own.items.filter((item) => own.pending.has(item.id)));
      own.pending.clear();
      if (counts.failed + counts.review > 0) {
        say(words.current.labels.attention(counts, words.current.formatCount));
      }
    };

    own.items = items;
    const previous = own.previous;
    own.previous = new Map(items.map((item) => [item.id, item.status]));
    const flying = items.filter((item) => isInFlight(item.status));

    if (previous === null) {
      // The baseline: settled rows say nothing, and rows in flight start a batch.
      if (flying.length > 0) {
        own.batch = new Set(flying.map((item) => item.id));
        own.started = setTimeout(speakStarted, QUIET_MS);
      }
      return;
    }

    let turned = false;
    let settledNow = false;
    for (const item of items) {
      const before = previous.get(item.id);
      if (before === item.status) continue;
      if (item.status === 'failed' || item.status === 'review') {
        own.pending.add(item.id);
        turned = true;
      }
      if (before !== undefined && isInFlight(before) && !isInFlight(item.status)) settledNow = true;
      // A row that arrives or changes during a batch is part of it.
      own.batch?.add(item.id);
    }

    if (flying.length > 0) {
      if (own.batch === null) {
        own.batch = new Set(flying.map((item) => item.id));
        own.started = setTimeout(speakStarted, QUIET_MS);
      } else {
        // A retry, or a file added, before the summary: the batch runs on, with no new started.
        for (const item of flying) own.batch.add(item.id);
        clearTimeout(own.settled);
        own.settled = undefined;
      }
    } else if (own.batch !== null && (settledNow || own.settled === undefined)) {
      clearTimeout(own.settled);
      own.settled = setTimeout(speakSettled, QUIET_MS);
    }

    if (turned) {
      clearTimeout(own.attention);
      own.attention = setTimeout(speakAttention, QUIET_MS);
    }
  }, [items]);

  return message;
}
