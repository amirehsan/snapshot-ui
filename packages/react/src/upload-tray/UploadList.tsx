'use client';

import { ArrowUp, CircleAlert, CircleCheck, CircleX, Clock, RotateCw, ScanText, X } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { IconButton } from '../icon-button/IconButton';
import { Link } from '../link/Link';
import { ProgressBar } from '../progress-bar/ProgressBar';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';
import type { UploadItem, UploadStatus } from './counts';

export interface UploadListLabels {
  /** The status words. @default 'Waiting', 'Uploading', 'Reading', 'Saved', 'Needs review', 'Failed' */
  status: Record<UploadStatus, string>;
  /** The row buttons' names, given the file's name. @default (name) => `Retry ${name}`, `Remove ${name}`, `Cancel ${name}` */
  retry: (name: string) => string;
  remove: (name: string) => string;
  cancel: (name: string) => string;
}

export interface UploadListProps {
  items: readonly UploadItem[];
  /** Shows Retry on failed rows. */
  onRetry?: (id: UploadItem['id']) => void;
  /** Shows Remove on waiting, failed, saved and needs-review rows. */
  onRemove?: (id: UploadItem['id']) => void;
  /** Shows Cancel on uploading rows. */
  onCancel?: (id: UploadItem['id']) => void;
  labels?: Partial<UploadListLabels>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  ref?: Ref<HTMLUListElement>;
}

/**
 * UploadList's props with the two the tray sets as well.
 *
 * Internal: not exported from the package.
 */
export interface UploadListInternalProps extends UploadListProps {
  /** Called when a row's link is pressed: the sheet closes as the router navigates. */
  onNavigate?: () => void;
  /** Where focus goes when the last row it was in leaves: the tray's heading. @default the list */
  focusFallback?: () => HTMLElement | null;
}

/** The English defaults. */
export const DEFAULT_UPLOAD_LIST_LABELS: UploadListLabels = {
  status: {
    waiting: 'Waiting',
    uploading: 'Uploading',
    reading: 'Reading',
    saved: 'Saved',
    review: 'Needs review',
    failed: 'Failed',
  },
  retry: (name) => `Retry ${name}`,
  remove: (name) => `Remove ${name}`,
  cancel: (name) => `Cancel ${name}`,
};

/** The labels given, over the defaults, the status words one by one. */
export function uploadListLabels(labels: Partial<UploadListLabels> | undefined): UploadListLabels {
  return {
    ...DEFAULT_UPLOAD_LIST_LABELS,
    ...labels,
    status: { ...DEFAULT_UPLOAD_LIST_LABELS.status, ...labels?.status },
  };
}

const ICONS: Record<UploadStatus, ReactNode> = {
  waiting: <Clock />,
  uploading: <ArrowUp />,
  reading: <ScanText />,
  saved: <CircleCheck />,
  review: <CircleAlert />,
  failed: <CircleX />,
};

/** A share from 0 to 1, clamped, or undefined when it is not a number. */
const shareOf = (progress: number | undefined): number | undefined =>
  progress === undefined || !Number.isFinite(progress) ? undefined : Math.min(1, Math.max(0, progress));

/**
 * The name in two spans, so the stem ellipsizes and the extension stays in view: split at the last dot, unless
 * that dot is the first character, as in ".env".
 */
function Name({ name }: { name: string }): ReactElement {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return <span className="upload-row-stem">{name}</span>;
  return (
    <>
      <span className="upload-row-stem">{name.slice(0, dot)}</span>
      <span className="upload-row-ext">{name.slice(dot)}</span>
    </>
  );
}

/** The development warnings for items the app got wrong, each once (risk R4). */
function useItemWarnings(items: readonly UploadItem[]): void {
  const failed = items.find((item) => item.status === 'failed' && !present(item.reason));
  useWarnOnce(
    failed
      ? `UploadList: the failed item "${failed.name}" has no reason. Say why it failed in the reader's words.`
      : null,
  );
  const ids = new Set<UploadItem['id']>();
  const repeated = items.find((item) => (ids.has(item.id) ? true : (ids.add(item.id), false)));
  useWarnOnce(
    repeated
      ? `UploadList: the id ${String(repeated.id)} is used by more than one item. Give each its own.`
      : null,
  );
  const outside = items.find(
    (item) => item.progress !== undefined && !(item.progress >= 0 && item.progress <= 1),
  );
  useWarnOnce(
    outside
      ? `UploadList: the progress of "${outside.name}" is ${String(outside.progress)}. Give it from 0 to 1.`
      : null,
  );
}

/**
 * Each file the app is uploading, from waiting to saved, needs review or failed: a plain list in the page's tab
 * order, each row with its status icon, its name (a link once it has a document), its status in
 * words with the reason or the progress, a bar while it uploads or is read, and Retry, Remove or Cancel where
 * the app handles them. The words carry the status, never the color alone. The app holds the items; the list
 * draws them and never uploads.
 */
export function UploadList(props: UploadListProps): ReactElement {
  return <BaseUploadList {...props} />;
}

/**
 * UploadList, with the props the tray sets as well.
 *
 * Internal: not exported from the package.
 */
export function BaseUploadList({
  items,
  onRetry,
  onRemove,
  onCancel,
  labels: labelsProp,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ref,
  onNavigate,
  focusFallback,
}: UploadListInternalProps): ReactElement {
  const labels = uploadListLabels(labelsProp);
  useItemWarnings(items);
  const listRef = useRef<HTMLUListElement>(null);
  const listRefs = useMemo(() => mergeRefs(listRef, ref), [ref]);
  // The row and the button that last held focus, and the ids as last drawn, so focus can follow a row that leaves.
  const focused = useRef<{ id: UploadItem['id']; action: string | null } | null>(null);
  const drawn = useRef<readonly UploadItem['id'][]>([]);

  // Listened for on the list itself, so the rows' own controls keep their handlers and the list stays a plain one.
  const itemsNow = useRef(items);
  useLayoutEffect(() => {
    itemsNow.current = items;
  });
  useEffect(() => {
    const list = listRef.current;
    if (list === null) return;
    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target instanceof Element ? event.target : null;
      const row = target?.closest('.upload-row');
      const item = row ? itemsNow.current[[...list.children].indexOf(row)] : undefined;
      focused.current = item
        ? { id: item.id, action: target?.closest('[data-action]')?.getAttribute('data-action') ?? null }
        : null;
    };
    const onFocusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget;
      // Focus the reader moves elsewhere is theirs; focus lost with a removed row has no target.
      if (next instanceof Node && !list.contains(next)) focused.current = null;
    };
    list.addEventListener('focusin', onFocusIn);
    list.addEventListener('focusout', onFocusOut);
    return () => {
      list.removeEventListener('focusin', onFocusIn);
      list.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Before paint, so focus never rests on the body for a frame: a row that left takes focus to the same button of
  // the next row, else the previous one, else the fallback; a row that stays, as through Retry, keeps it.
  useLayoutEffect(() => {
    const before = drawn.current;
    const ids = items.map((item) => item.id);
    drawn.current = ids;
    const lost = focused.current;
    const list = listRef.current;
    if (lost === null || list === null) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body && active.isConnected) return;
    let index = ids.indexOf(lost.id);
    if (index === -1) {
      const at = before.indexOf(lost.id);
      const next = before.slice(at + 1).find((id) => ids.includes(id));
      const previous = before
        .slice(0, Math.max(at, 0))
        .reverse()
        .find((id) => ids.includes(id));
      const target = next ?? previous;
      index = target === undefined ? -1 : ids.indexOf(target);
    }
    const row = index === -1 ? undefined : list.children[index];
    const control =
      (lost.action === null ? null : row?.querySelector<HTMLElement>(`[data-action="${lost.action}"]`)) ??
      row?.querySelector<HTMLElement>('a[href], button');
    if (control) {
      control.focus();
      return;
    }
    focused.current = null;
    (focusFallback?.() ?? list).focus();
  }, [items, focusFallback]);

  return (
    <ul
      ref={listRefs}
      className={cx('upload-list', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      // Focus lands here when the last row leaves in a page, never on the body.
      tabIndex={-1}
    >
      {items.map((item) => {
        const { id, name, status, href, reason, progressLabel } = item;
        const word = labels.status[status];
        const share = shareOf(item.progress);
        const progressText =
          status !== 'uploading'
            ? null
            : present(progressLabel)
              ? progressLabel
              : share === undefined
                ? null
                : `${String(Math.round(share * 100))}%`;
        const isWorking = status === 'uploading' || status === 'reading';
        return (
          <li key={id} className="upload-row" data-status={status}>
            <span className="upload-row-icon" aria-hidden="true">
              {ICONS[status]}
            </span>
            <div className="upload-row-text">
              {present(href) ? (
                // The name's direction is its own, so a Latin name on a Persian page keeps its extension at its end.
                <Link href={href} className="upload-row-name" dir="auto" onPress={onNavigate}>
                  <Name name={name} />
                </Link>
              ) : (
                <span className="upload-row-name" dir="auto">
                  <Name name={name} />
                </span>
              )}
              <div className="upload-row-status">
                <span className="upload-row-word">{word}</span>
                {(status === 'failed' || status === 'review') && present(reason) ? (
                  <>
                    {' '}
                    <span className="upload-row-reason">{reason}</span>
                  </>
                ) : null}
                {progressText === null ? null : (
                  <>
                    {' '}
                    <span className="upload-row-progress">{progressText}</span>
                  </>
                )}
              </div>
              {isWorking ? (
                <ProgressBar
                  className="upload-row-bar"
                  aria-label={`${word} ${name}`}
                  isIndeterminate={status === 'reading' || share === undefined}
                  value={share === undefined ? 0 : share * 100}
                  valueLabel={progressLabel}
                  showValueLabel={false}
                />
              ) : null}
            </div>
            <div className="upload-row-actions">
              {status === 'failed' && onRetry ? (
                <IconButton
                  aria-label={labels.retry(name)}
                  data-action="retry"
                  onPress={() => {
                    onRetry(id);
                  }}
                >
                  <RotateCw />
                </IconButton>
              ) : null}
              {status === 'uploading' && onCancel ? (
                <IconButton
                  aria-label={labels.cancel(name)}
                  data-action="cancel"
                  onPress={() => {
                    onCancel(id);
                  }}
                >
                  <X />
                </IconButton>
              ) : null}
              {status !== 'uploading' && status !== 'reading' && onRemove ? (
                <IconButton
                  aria-label={labels.remove(name)}
                  data-action="remove"
                  onPress={() => {
                    onRemove(id);
                  }}
                >
                  <X />
                </IconButton>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
