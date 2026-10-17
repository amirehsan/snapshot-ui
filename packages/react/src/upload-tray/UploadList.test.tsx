import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import type { UploadItem, UploadStatus } from './counts';
import { UploadList, type UploadListProps } from './UploadList';

const ITEMS: Record<UploadStatus, UploadItem> = {
  waiting: { id: 'w', name: 'receipt-march.pdf', status: 'waiting' },
  uploading: {
    id: 'u',
    name: 'invoice.pdf',
    status: 'uploading',
    progress: 0.45,
    progressLabel: '1.8 of 4 MB',
  },
  reading: { id: 'r', name: 'statement.pdf', status: 'reading' },
  saved: { id: 's', name: 'lease.pdf', status: 'saved', href: '/documents/lease' },
  review: { id: 'v', name: 'corner-mart.jpg', status: 'review', reason: 'The total could not be read' },
  failed: { id: 'f', name: 'video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
};

/** What each status draws: its icon, its word, whether it has a bar, and its buttons with every handler given. */
const STATUSES: [UploadStatus, string, string, boolean, string[]][] = [
  ['waiting', 'lucide-clock', 'Waiting', false, ['Remove receipt-march.pdf']],
  ['uploading', 'lucide-arrow-up', 'Uploading', true, ['Cancel invoice.pdf']],
  ['reading', 'lucide-scan-text', 'Reading', true, []],
  ['saved', 'lucide-circle-check', 'Saved', false, ['Remove lease.pdf']],
  ['review', 'lucide-circle-alert', 'Needs review', false, ['Remove corner-mart.jpg']],
  ['failed', 'lucide-circle-x', 'Failed', false, ['Retry video.mov', 'Remove video.mov']],
];

const handlers = (): Pick<UploadListProps, 'onRetry' | 'onRemove' | 'onCancel'> => ({
  onRetry: vi.fn(),
  onRemove: vi.fn(),
  onCancel: vi.fn(),
});

const rowOf = (name: string): HTMLElement => {
  const row = screen
    .getByText(
      (_, element) => element?.classList.contains('upload-row-name') === true && element.textContent === name,
    )
    .closest('li');
  if (!(row instanceof HTMLElement)) throw new Error(`No row for ${name}`);
  return row;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UploadList', () => {
  it('is exported from the package', () => {
    expect(library.UploadList).toBe(UploadList);
  });

  it.each(STATUSES)(
    'draws %s with its icon, word, bar and buttons',
    (status, icon, word, hasBar, buttons) => {
      const item = ITEMS[status];
      render(<UploadList aria-label="Uploads" items={[item]} {...handlers()} />);
      const row = rowOf(item.name);
      expect(row).toHaveAttribute('data-status', status);
      const mark = row.querySelector('.upload-row-icon');
      expect(mark).toHaveAttribute('aria-hidden', 'true');
      expect(mark?.querySelector('svg')).toHaveClass(icon);
      expect(row.querySelector('.upload-row-word')).toHaveTextContent(word);
      expect(within(row).queryAllByRole('progressbar')).toHaveLength(hasBar ? 1 : 0);
      expect(
        within(row)
          .queryAllByRole('button')
          .map((button) => button.getAttribute('aria-label')),
      ).toEqual(buttons);
    },
  );

  it('says the reason after the word for failed and review rows, in its own span', () => {
    render(<UploadList items={[ITEMS.failed, ITEMS.review, ITEMS.saved]} />);
    expect(rowOf('video.mov').querySelector('.upload-row-status')).toHaveTextContent(
      'Failed Not a PDF, JPG or PNG',
    );
    expect(rowOf('corner-mart.jpg').querySelector('.upload-row-reason')).toHaveTextContent(
      'The total could not be read',
    );
    expect(rowOf('lease.pdf').querySelector('.upload-row-reason')).toBeNull();
  });

  it('draws a button only when its handler is given', () => {
    const onRetry = vi.fn();
    render(<UploadList items={[ITEMS.failed, ITEMS.uploading, ITEMS.saved]} onRetry={onRetry} />);
    // Retry alone: no Remove, and no Cancel without onCancel.
    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Retry video.mov',
    ]);
  });

  it('calls each handler with the row id', async () => {
    const user = userEvent.setup();
    const props = handlers();
    render(<UploadList items={[ITEMS.failed, ITEMS.uploading]} {...props} />);
    await user.click(screen.getByRole('button', { name: 'Retry video.mov' }));
    await user.click(screen.getByRole('button', { name: 'Remove video.mov' }));
    await user.click(screen.getByRole('button', { name: 'Cancel invoice.pdf' }));
    expect(props.onRetry).toHaveBeenCalledWith('f');
    expect(props.onRemove).toHaveBeenCalledWith('f');
    expect(props.onCancel).toHaveBeenCalledWith('u');
  });

  it('links the name through the router when the item has href', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <library.RouterProvider navigate={navigate}>
        <UploadList items={[ITEMS.saved, ITEMS.waiting]} />
      </library.RouterProvider>,
    );
    const link = screen.getByRole('link', { name: 'lease.pdf' });
    expect(link).toHaveAttribute('href', '/documents/lease');
    expect(link).toHaveClass('link', 'upload-row-name');
    await user.click(link);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/documents/lease');
    // No href, no link.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('keeps the extension in its own span, also for a name with no extension or a leading dot', () => {
    const names = ['Receipt-2026-10-14-corner-mart.pdf', 'archive.tar.gz', 'README', '.env', 'notes.'];
    render(
      <UploadList items={names.map((name, index) => ({ id: index, name, status: 'saved' as const }))} />,
    );
    const parts = names.map((name) =>
      [...rowOf(name).querySelectorAll('.upload-row-name > span')].map((span) => [
        span.className,
        span.textContent,
      ]),
    );
    expect(parts).toEqual([
      [
        ['upload-row-stem', 'Receipt-2026-10-14-corner-mart'],
        ['upload-row-ext', '.pdf'],
      ],
      [
        ['upload-row-stem', 'archive.tar'],
        ['upload-row-ext', '.gz'],
      ],
      [['upload-row-stem', 'README']],
      [['upload-row-stem', '.env']],
      [
        ['upload-row-stem', 'notes'],
        ['upload-row-ext', '.'],
      ],
    ]);
    // The name takes its own direction, so a Latin name on a Persian page keeps its extension at its end.
    expect(rowOf('README').querySelector('.upload-row-name')).toHaveAttribute('dir', 'auto');
  });

  it('draws a determinate bar from progress, an indeterminate one without it and while reading', () => {
    render(
      <UploadList
        items={[
          ITEMS.uploading,
          { id: 'p', name: 'plain.pdf', status: 'uploading', progress: 0.3 },
          { id: 'q', name: 'unknown.pdf', status: 'uploading' },
          ITEMS.reading,
        ]}
      />,
    );
    const [given, plain, unknown, reading] = screen.getAllByRole('progressbar');
    expect(given).toHaveAccessibleName('Uploading invoice.pdf');
    expect(given).toHaveAttribute('aria-valuenow', '45');
    expect(given).toHaveAttribute('aria-valuetext', '1.8 of 4 MB');
    expect(plain).toHaveAttribute('aria-valuetext', '30%');
    expect(unknown).not.toHaveAttribute('aria-valuenow');
    expect(reading).toHaveAccessibleName('Reading statement.pdf');
    expect(reading).not.toHaveAttribute('aria-valuenow');
    // No head: the status line says the progress, at its end.
    expect(document.querySelector('.progress-bar-head')).toBeNull();
    expect(rowOf('invoice.pdf').querySelector('.upload-row-progress')).toHaveTextContent('1.8 of 4 MB');
    expect(rowOf('plain.pdf').querySelector('.upload-row-progress')).toHaveTextContent('30%');
    expect(rowOf('unknown.pdf').querySelector('.upload-row-progress')).toBeNull();
    expect(rowOf('statement.pdf').querySelector('.upload-row-progress')).toBeNull();
  });

  it('replaces its words through labels', () => {
    render(
      <UploadList
        items={[ITEMS.failed]}
        onRetry={vi.fn()}
        labels={{
          // One word replaced: the others keep their defaults.
          status: { failed: 'ناموفق' } as Record<UploadStatus, string>,
          retry: (name) => `تلاش دوباره ${name}`,
        }}
      />,
    );
    expect(document.querySelector('.upload-row-word')).toHaveTextContent('ناموفق');
    expect(screen.getByRole('button', { name: 'تلاش دوباره video.mov' })).toBeInTheDocument();
  });

  it("moves focus to the next row's same button after Remove, else the previous, never the body", async () => {
    const user = userEvent.setup();
    function Removable(): ReactElement {
      const [items, setItems] = useState<UploadItem[]>([
        { id: 1, name: 'one.pdf', status: 'saved' },
        { id: 2, name: 'two.pdf', status: 'failed', reason: 'Over 10 MB' },
        { id: 3, name: 'three.pdf', status: 'saved' },
      ]);
      return (
        <UploadList
          aria-label="Uploads"
          items={items}
          onRetry={vi.fn()}
          onRemove={(id) => {
            setItems((each) => each.filter((item) => item.id !== id));
          }}
        />
      );
    }
    render(<Removable />);
    await user.click(screen.getByRole('button', { name: 'Remove two.pdf' }));
    expect(screen.getByRole('button', { name: 'Remove three.pdf' })).toHaveFocus();
    await user.keyboard('{Enter}');
    // The last row: the previous one.
    expect(screen.getByRole('button', { name: 'Remove one.pdf' })).toHaveFocus();
    await user.keyboard('{Enter}');
    // No row left: the list itself, never the body.
    expect(screen.getByRole('list', { name: 'Uploads' })).toHaveFocus();
  });

  it('keeps focus on the row through Retry', async () => {
    const user = userEvent.setup();
    function Retryable(): ReactElement {
      const [item, setItem] = useState<UploadItem>({
        id: 1,
        name: 'video.mov',
        status: 'failed',
        reason: 'Over 10 MB',
      });
      return (
        <UploadList
          items={[item]}
          onRetry={() => {
            setItem({ id: 1, name: 'video.mov', status: 'uploading', progress: 0 });
          }}
          onCancel={vi.fn()}
          onRemove={vi.fn()}
        />
      );
    }
    render(<Retryable />);
    await user.click(screen.getByRole('button', { name: 'Retry video.mov' }));
    // Retry is gone with the failure; the row's first control has focus.
    expect(screen.getByRole('button', { name: 'Cancel video.mov' })).toHaveFocus();
  });

  it('warns once for a failed item without reason, a repeated id and progress outside 0 to 1', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(
      <UploadList
        items={[
          { id: 1, name: 'a.pdf', status: 'failed' },
          { id: 1, name: 'b.pdf', status: 'uploading', progress: 45 },
        ]}
      />,
    );
    rerender(
      <UploadList
        items={[
          { id: 1, name: 'a.pdf', status: 'failed' },
          { id: 1, name: 'b.pdf', status: 'uploading', progress: 46 },
        ]}
      />,
    );
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      expect.stringContaining('"a.pdf" has no reason'),
      expect.stringContaining('the id 1 is used by more than one item'),
      expect.stringContaining('the progress of "b.pdf" is 45'),
    ]);
  });

  it('merges className after upload-list and forwards ref to the list', () => {
    const ref = { current: null as HTMLUListElement | null };
    render(<UploadList items={[ITEMS.saved]} className="mine" ref={ref} aria-label="Uploads" />);
    const list = screen.getByRole('list', { name: 'Uploads' });
    expect(list).toHaveClass('upload-list', 'mine');
    expect(ref.current).toBe(list);
  });

  const AXE_CASES: [string, ReactElement][] = [
    ...STATUSES.map(([status]): [string, ReactElement] => [
      status,
      <UploadList key={status} aria-label="Uploads" items={[ITEMS[status]]} {...handlers()} />,
    ]),
    [
      'a list named by aria-labelledby',
      <div key="named">
        <h2 id="uploads-title">Uploading 2 of 6</h2>
        <UploadList aria-labelledby="uploads-title" items={Object.values(ITEMS)} {...handlers()} />
      </div>,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations: %s', async (_, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});
