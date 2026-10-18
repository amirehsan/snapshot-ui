import { act, render } from '@testing-library/react';
import { StrictMode, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUIET_MS } from '../utils/quiet';
import type { UploadItem, UploadStatus } from './counts';
import { DEFAULT_ANNOUNCEMENTS, useUploadAnnouncements } from './useUploadAnnouncements';

const file = (id: number, status: UploadStatus, progress?: number): UploadItem => ({
  id,
  name: `receipt-${String(id)}.pdf`,
  status,
  progress,
  reason:
    status === 'failed' ? 'Over 10 MB' : status === 'review' ? 'The total could not be read' : undefined,
});

/** Shows what the hook says, keyed as the status host keys it, so a test sees a new node for each message. */
function Host({ items }: { items: readonly UploadItem[] }): ReactElement {
  const message = useUploadAnnouncements(items, DEFAULT_ANNOUNCEMENTS, String);
  return <output>{message ? <span key={message.key}>{message.text}</span> : null}</output>;
}

/** Renders the host in Strict Mode, as an app in development does, and returns its updater and reader. */
function mount(items: readonly UploadItem[]): {
  update: (next: readonly UploadItem[]) => void;
  said: () => string;
  node: () => Element | null;
} {
  const { rerender, container } = render(
    <StrictMode>
      <Host items={items} />
    </StrictMode>,
  );
  return {
    update: (next) => {
      rerender(
        <StrictMode>
          <Host items={next} />
        </StrictMode>,
      );
    },
    said: () => container.querySelector('output')?.textContent ?? '',
    node: () => container.querySelector('output span'),
  };
}

const pass = (ms: number): void => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useUploadAnnouncements', () => {
  it('says started once, QUIET_MS after a batch starts, with the counts then', () => {
    const tray = mount([]);
    tray.update([file(1, 'waiting'), file(2, 'waiting')]);
    pass(QUIET_MS / 2);
    // Files added during the pause are in it.
    tray.update([file(1, 'uploading', 0.1), file(2, 'waiting'), file(3, 'waiting')]);
    expect(tray.said()).toBe('');
    pass(QUIET_MS / 2);
    expect(tray.said()).toBe('Uploading 3 files');
    pass(QUIET_MS * 4);
    expect(tray.said()).toBe('Uploading 3 files');
  });

  it('adds files during a batch silently', () => {
    const tray = mount([file(1, 'uploading', 0.2)]);
    pass(QUIET_MS);
    expect(tray.said()).toBe('Uploading 1 file');
    const first = tray.node();
    tray.update([file(1, 'uploading', 0.4), file(2, 'waiting'), file(3, 'waiting')]);
    pass(QUIET_MS * 3);
    expect(tray.node()).toBe(first);
  });

  it('gathers failures and reviews over QUIET_MS into one sentence', () => {
    const tray = mount([file(1, 'uploading'), file(2, 'uploading'), file(3, 'reading'), file(4, 'waiting')]);
    pass(QUIET_MS);
    tray.update([file(1, 'failed'), file(2, 'uploading'), file(3, 'reading'), file(4, 'waiting')]);
    pass(QUIET_MS / 2);
    tray.update([file(1, 'failed'), file(2, 'failed'), file(3, 'review'), file(4, 'waiting')]);
    pass(QUIET_MS - 1);
    expect(tray.said()).toBe('Uploading 4 files');
    pass(1);
    expect(tray.said()).toBe('2 uploads failed, 1 needs review');
  });

  it('counts a row that arrives already failed', () => {
    const tray = mount([file(1, 'saved')]);
    tray.update([file(1, 'saved'), file(2, 'failed')]);
    pass(QUIET_MS);
    expect(tray.said()).toBe('1 upload failed');
  });

  it('says settled once, QUIET_MS after the last row settles, and drops a pending attention', () => {
    const tray = mount([file(1, 'uploading'), file(2, 'uploading'), file(3, 'reading')]);
    pass(QUIET_MS);
    tray.update([file(1, 'saved'), file(2, 'uploading'), file(3, 'reading')]);
    pass(QUIET_MS / 2);
    tray.update([file(1, 'saved'), file(2, 'failed'), file(3, 'review')]);
    pass(QUIET_MS);
    // One summary, which says the failure and the review: no attention before it.
    expect(tray.said()).toBe('3 uploads finished: 1 saved, 1 needs review, 1 failed');
    const summary = tray.node();
    pass(QUIET_MS * 4);
    expect(tray.node()).toBe(summary);
  });

  it('cancels settled when a retry starts before it speaks, with no new started', () => {
    const tray = mount([file(1, 'uploading'), file(2, 'uploading')]);
    pass(QUIET_MS);
    const started = tray.node();
    tray.update([file(1, 'saved'), file(2, 'failed')]);
    pass(QUIET_MS / 2);
    // Retry, at once.
    tray.update([file(1, 'saved'), file(2, 'waiting')]);
    pass(QUIET_MS * 2);
    expect(tray.node()).toBe(started);
    expect(tray.said()).toBe('Uploading 2 files');
    tray.update([file(1, 'saved'), file(2, 'saved')]);
    pass(QUIET_MS);
    expect(tray.said()).toBe('2 uploads finished: 2 saved');
  });

  it('says nothing for items settled on the first render', () => {
    const tray = mount([file(1, 'saved'), file(2, 'failed'), file(3, 'review')]);
    pass(QUIET_MS * 4);
    expect(tray.node()).toBeNull();
  });

  it('starts a batch for items in flight on the first render', () => {
    const tray = mount([file(1, 'saved'), file(2, 'uploading')]);
    pass(QUIET_MS);
    // Only the batch's file: the settled one was there before it.
    expect(tray.said()).toBe('Uploading 1 file');
  });

  it('never says a percentage, or a row turning uploading, reading or saved', () => {
    const tray = mount([file(1, 'waiting'), file(2, 'waiting')]);
    pass(QUIET_MS);
    const started = tray.node();
    const steps: UploadItem[][] = [
      [file(1, 'uploading', 0.1), file(2, 'waiting')],
      [file(1, 'uploading', 0.5), file(2, 'waiting')],
      [file(1, 'reading'), file(2, 'uploading', 0.2)],
      [file(1, 'saved'), file(2, 'uploading', 0.9)],
      [file(1, 'saved'), file(2, 'reading')],
    ];
    for (const step of steps) {
      tray.update(step);
      pass(QUIET_MS * 2);
      expect(tray.node()).toBe(started);
      expect(tray.said()).not.toMatch(/%/);
    }
  });

  it('says the same words twice when they come twice', () => {
    const tray = mount([file(1, 'uploading')]);
    pass(QUIET_MS);
    tray.update([file(1, 'failed')]);
    pass(QUIET_MS);
    expect(tray.said()).toBe('1 upload finished: 1 failed');
    const first = tray.node();
    tray.update([file(1, 'uploading')]);
    pass(QUIET_MS);
    tray.update([file(1, 'failed')]);
    pass(QUIET_MS);
    expect(tray.said()).toBe('1 upload finished: 1 failed');
    expect(tray.node()).not.toBe(first);
  });

  it('stops every timer when it unmounts', () => {
    const { unmount } = render(<Host items={[file(1, 'uploading')]} />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
