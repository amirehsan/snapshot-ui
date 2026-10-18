'use client';

import { ChevronDown, ChevronUp, CircleX, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { Button as RACButton } from 'react-aria-components';
import { useOptionalAppShell } from '../app-shell/AppShell';
import { Button } from '../button/Button';
import { useConfirm } from '../dialog/useConfirm';
import { IconButton } from '../icon-button/IconButton';
import { Sheet } from '../sheet/Sheet';
import { cx } from '../utils/cx';
import { useChrome } from '../utils/focus-clear';
import { present } from '../utils/present';
import { useBeforeUnload } from '../utils/useBeforeUnload';
import { useControllableState } from '../utils/useControllableState';
import {
  cancellableOf,
  countUploads,
  inFlightOf,
  isInFlight,
  type UploadCounts,
  type UploadItem,
} from './counts';
import { BaseUploadList, uploadListLabels, type UploadListLabels, type UploadListProps } from './UploadList';
import {
  DEFAULT_ANNOUNCEMENTS,
  useUploadAnnouncements,
  type UploadAnnouncementLabels,
} from './useUploadAnnouncements';

export interface UploadTrayLabels extends UploadListLabels, UploadAnnouncementLabels {
  /**
   * The heading, from the counts as `formatCount` writes them. While anything is in flight the counts are the
   * running batch's rows, so rows settled before it do not swell "Uploading 2 of 5"; once all have settled, every
   * row's. @default "Uploading 2 of 5", then "3 uploads complete, 1 failed, 1 needs review"
   */
  title: (counts: UploadCounts, format: (count: number) => string) => string;
  /** The fold button's name, the same open or folded; `aria-expanded` says which. @default 'Upload details' */
  details: string;
  /** The wide panel's close button, which clears or cancels all. @default 'Close' */
  close: string;
  /** The phone's sheet's own close button, which only closes the sheet. @default 'Close' */
  closeSheet: string;
  /** The phone's Clear once nothing is in flight: the sheet's footer button and the bar's X. @default 'Clear' */
  clear: string;
  /** The sheet's footer button while files are in flight, which asks first. @default 'Cancel uploads' */
  cancelAll: string;
  /**
   * The question Cancel all asks, given how many files it would stop (waiting or uploading) and that count as
   * `formatCount` writes it. @default 'Cancel 1 upload?', 'Cancel 3 uploads?', then 'Files still uploading will
   * not be saved.', 'Cancel uploads', 'Keep uploading'
   */
  cancelAllTitle: (count: number, formatted: string) => string;
  cancelAllDescription: string;
  cancelAllConfirm: string;
  cancelAllKeep: string;
  /** The landmark name of the phone's bar, whose one button says the title. @default 'Uploads' */
  region: string;
}

export interface UploadTrayProps extends Omit<
  UploadListProps,
  'labels' | 'aria-label' | 'aria-labelledby' | 'className' | 'ref'
> {
  /** A line under the title in slate, the app's: "About a minute left". */
  description?: string;
  /** Folded to its header on a wide screen. Controlled and uncontrolled. @default false */
  isCollapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  /** The close button, and the phone's Clear, once nothing is in flight: the app clears its settled items. */
  onClear?: () => void;
  /**
   * The close button, and the phone's Cancel uploads, while files are waiting or uploading, after a confirm.
   * Without it they show only once all have settled.
   */
  onCancelAll?: () => void;
  /** Warns before the page unloads while anything is in flight. @default true */
  warnsOnUnload?: boolean;
  /** @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<UploadTrayLabels>;
  /** Goes on both faces, the wide panel and the phone's bar. */
  className?: string;
}

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

const DEFAULT_TRAY_LABELS: Omit<UploadTrayLabels, keyof UploadListLabels | keyof UploadAnnouncementLabels> = {
  title: (counts, format) => {
    const { saved, review, failed } = counts;
    if (inFlightOf(counts) > 0) {
      const done = saved + review + failed;
      return `Uploading ${format(Math.min(done + 1, counts.total))} of ${format(counts.total)}`;
    }
    // What settled, failures and reviews named, so a failure never hides in "5 uploads complete".
    const parts: string[] = [];
    if (saved > 0 || (failed === 0 && review === 0)) {
      parts.push(`${format(saved)} ${plural(saved, 'upload', 'uploads')} complete`);
    }
    if (failed > 0) {
      parts.push(
        parts.length === 0
          ? `${format(failed)} ${plural(failed, 'upload', 'uploads')} failed`
          : `${format(failed)} failed`,
      );
    }
    if (review > 0) {
      parts.push(
        parts.length === 0
          ? `${format(review)} ${plural(review, 'upload needs', 'uploads need')} review`
          : `${format(review)} ${plural(review, 'needs', 'need')} review`,
      );
    }
    return parts.join(', ');
  },
  details: 'Upload details',
  close: 'Close',
  closeSheet: 'Close',
  clear: 'Clear',
  cancelAll: 'Cancel uploads',
  cancelAllTitle: (count, formatted) => `Cancel ${formatted} ${plural(count, 'upload', 'uploads')}?`,
  cancelAllDescription: 'Files still uploading will not be saved.',
  cancelAllConfirm: 'Cancel uploads',
  cancelAllKeep: 'Keep uploading',
  region: 'Uploads',
};

/** The custom property the toasts read to sit above the tray. */
const OFFSET = '--upload-tray-offset';

/** The viewport width the wide face starts at: the --breakpoint-sm token, written out. */
const WIDE = '(width >= 768px)';

/** Whether focus has fallen to the body, as it does when the element holding it leaves the page. */
function isFocusLost(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body;
}

/** The shell's main, or outside a shell the first main that takes focus (spec correction 11). */
function mainOf(mainId: string | undefined): HTMLElement | null {
  return mainId === undefined
    ? document.querySelector<HTMLElement>('main[tabindex]')
    : document.getElementById(mainId);
}

/**
 * Waits some frames for focus to fall to the body, as it does when a dialog or a sheet that held it has played
 * its exit, and gives it to `target` when it does. It stops as soon as focus is given, after about a second, or
 * when the returned function is called.
 */
function catchFallingFocus(target: () => HTMLElement | null): () => void {
  let frames = 0;
  let frame = 0;
  const check = (): void => {
    if (isFocusLost()) {
      target()?.focus({ preventScroll: true });
      return;
    }
    frames += 1;
    if (frames < 60) frame = requestAnimationFrame(check);
  };
  check();
  return () => {
    cancelAnimationFrame(frame);
  };
}

/** Which face a close or clear button is in: the wide panel, the phone's sheet or the phone's bar. */
type Face = 'wide' | 'sheet' | 'bar';

/** The rows settled before the running batch began, and whether a batch was running at the last render. */
interface Earlier {
  running: boolean;
  ids: ReadonlySet<UploadItem['id']>;
}

/**
 * The running batch's rows: every row but those already settled when it began, so settled rows the reader has
 * not cleared do not swell "Uploading N of M". A settled row retried during the batch joins it. Derived during
 * render from state, so the server and the first render agree: a tray mounted mid-batch counts every row, as its
 * announcements do.
 */
function useBatch(items: readonly UploadItem[], running: boolean): readonly UploadItem[] {
  const [earlier, setEarlier] = useState<Earlier>(() => ({ running, ids: new Set() }));
  const settledIds = (): Set<UploadItem['id']> =>
    new Set(items.filter((item) => !isInFlight(item.status)).map((item) => item.id));
  if (earlier.running !== running) {
    setEarlier({ running, ids: running ? settledIds() : new Set() });
  } else if (items.some((item) => earlier.ids.has(item.id) && isInFlight(item.status))) {
    const settled = settledIds();
    setEarlier({ running, ids: new Set([...earlier.ids].filter((id) => settled.has(id))) });
  }
  return running ? items.filter((item) => !earlier.ids.has(item.id)) : items;
}

/**
 * Where uploads report: the files the app is uploading, mounted once in AppShell's `floating` slot from the app's
 * root layout, so it stays across client navigation. From 768px it is a panel in the bottom end corner, the
 * toasts' 28rem column, with a title that counts, a fold button and a close button; under 768px a docked bar
 * that says the title, with a Clear once all have settled, and opens a Sheet with the list and Clear or Cancel
 * uploads, while the page keeps room under its content for the bar. With no items it draws only its polite status
 * host, which says three things: a batch's start, failures and needs-review gathered over a pause, and a summary
 * once everything has settled. It asks before it cancels uploads and warns before the page unloads while any
 * file is waiting or uploading. The app holds the items and does the uploading; the tray draws and announces.
 */
export function UploadTray({
  items,
  onRetry,
  onRemove,
  onCancel,
  description,
  isCollapsed: isCollapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  onClear,
  onCancelAll,
  warnsOnUnload = true,
  formatCount = String,
  labels: labelsProp,
  className,
}: UploadTrayProps): ReactElement {
  const labels: UploadTrayLabels = {
    ...DEFAULT_ANNOUNCEMENTS,
    ...DEFAULT_TRAY_LABELS,
    ...labelsProp,
    // The status words one by one over the defaults.
    ...uploadListLabels(labelsProp),
  };
  const shell = useOptionalAppShell();
  const mainId = shell?.mainId;
  const titleId = useId();
  const bodyId = useId();
  const [isCollapsed, setCollapsed] = useControllableState(
    isCollapsedProp,
    defaultCollapsed,
    onCollapsedChange,
  );
  const [isSheetOpen, setSheetOpen] = useState(false);
  // The sheet leaves with the last item, and the next batch does not open it again.
  if (items.length === 0 && isSheetOpen) setSheetOpen(false);
  const { confirm, dialog } = useConfirm();
  const wideRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const foldRef = useRef<HTMLButtonElement>(null);
  const barButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const counts = countUploads(items);
  const inFlight = inFlightOf(counts);
  // What Cancel all would stop and what holds the page open: a file being read is on the server already.
  const cancellable = cancellableOf(counts);
  const hasItems = items.length > 0;
  const batch = useBatch(items, inFlight > 0);
  const title = labels.title(inFlight > 0 ? countUploads(batch) : counts, formatCount);
  const hasFailed = counts.failed > 0;
  const message = useUploadAnnouncements(items, labels, formatCount);
  useBeforeUnload(warnsOnUnload && cancellable > 0);
  // A control on the page that focus lands on under the wide panel, open or folded, or under the phone's bar is
  // scrolled clear of it by a gap, as of a save bar (WCAG 2.4.11). The face the viewport hides measures nothing.
  useChrome(wideRef, 'bottom', hasItems);
  useChrome(barRef, 'bottom', hasItems);

  // The element in the tray that holds focus: in either face or the sheet. A row or the whole tray leaving takes
  // it from the page with no focus event, so this keeps it until focus moves on to anything still in the page,
  // the body by a press on empty space included; only an element that has left is the tray's to mend.
  const held = useRef<Element | null>(null);
  // A yes to Cancel all and the face that asked, whose dialog holds focus while what it asked from may leave.
  const cancelled = useRef<Face | null>(null);
  useEffect(() => {
    if (!hasItems) return;
    const isTray = (target: Element): boolean =>
      wideRef.current?.contains(target) === true ||
      barRef.current?.contains(target) === true ||
      target.closest('.upload-tray-sheet') !== null;
    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target instanceof Element ? event.target : null;
      held.current = target !== null && isTray(target) ? target : null;
      // Focus back on a closer after Cancel all: the yes has done its work.
      if (held.current !== null) cancelled.current = null;
    };
    const onFocusOut = (event: FocusEvent): void => {
      const left = event.target;
      if (event.relatedTarget !== null || left !== held.current) return;
      queueMicrotask(() => {
        if (held.current === left && left instanceof Node && left.isConnected) held.current = null;
      });
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [hasItems]);

  // The tray leaves with its last item: focus that was in it goes to main, never to the body. After a Cancel all,
  // focus is in the dialog, which plays its exit first.
  useLayoutEffect(() => {
    if (hasItems) return;
    const was = held.current;
    if (!((was !== null && !was.isConnected) || cancelled.current !== null)) return;
    held.current = null;
    cancelled.current = null;
    return catchFallingFocus(() => mainOf(mainId));
  }, [hasItems, mainId]);

  // A close or clear button leaves while the tray stays, as when the last upload settles with focus on Close and
  // there is no onClear, or after a yes to Cancel all leaves settled rows: focus goes to what stays in that face,
  // the fold button, the sheet's own close or the bar's button, never the body.
  const canClose = inFlight === 0 ? onClear !== undefined : cancellable > 0 && onCancelAll !== undefined;
  const canClearBar = inFlight === 0 && onClear !== undefined;
  useLayoutEffect(() => {
    if (!hasItems) return;
    const was = held.current;
    const left = was !== null && !was.isConnected ? (was.getAttribute('data-closer') as Face | null) : null;
    const face = left ?? (canClose ? null : cancelled.current);
    if (face === null) return;
    held.current = null;
    cancelled.current = null;
    return catchFallingFocus(() =>
      face === 'sheet'
        ? (sheetRef.current?.querySelector<HTMLElement>('.sheet-close') ?? null)
        : face === 'bar'
          ? barButtonRef.current
          : foldRef.current,
    );
  }, [hasItems, canClose, canClearBar]);

  // The tray unmounts with focus inside: the same, once the commit has taken its elements away.
  useLayoutEffect(
    () => () => {
      const was = held.current;
      if (was === null) return;
      const target = mainOf(mainId);
      queueMicrotask(() => {
        if (!was.isConnected && isFocusLost()) target?.focus({ preventScroll: true });
      });
    },
    [mainId],
  );

  // The toasts sit above the tray: its shown face's height and the inset, on the root, while it draws. The hidden
  // face measures 0. Never on the server, so no first paint waits on it.
  useEffect(() => {
    if (!hasItems || typeof ResizeObserver !== 'function') return;
    const root = document.documentElement;
    const heights = new Map<Element, number>();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        heights.set(entry.target, entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);
      }
      const height = Math.max(0, ...heights.values());
      if (height > 0) root.style.setProperty(OFFSET, `calc(${String(height)}px + var(--spacing-inset))`);
      else root.style.removeProperty(OFFSET);
    });
    for (const face of [wideRef.current, barRef.current]) if (face) observer.observe(face);
    return () => {
      observer.disconnect();
      root.style.removeProperty(OFFSET);
    };
  }, [hasItems]);

  const closeSheet = (): void => {
    setSheetOpen(false);
    // A sheet left open while the window widened past 768px closes onto the wide face, whose bar is hidden: focus
    // goes to its fold button once the sheet has left. The one matchMedia read, after hydration.
    if (typeof window.matchMedia === 'function' && window.matchMedia(WIDE).matches) {
      catchFallingFocus(() => foldRef.current);
    }
  };

  const close = async (face: Face): Promise<void> => {
    if (inFlight === 0) {
      onClear?.();
      return;
    }
    const yes = await confirm({
      title: labels.cancelAllTitle(cancellable, formatCount(cancellable)),
      description: labels.cancelAllDescription,
      confirmLabel: labels.cancelAllConfirm,
      cancelLabel: labels.cancelAllKeep,
      tone: 'danger',
    });
    if (!yes) return;
    cancelled.current = face;
    onCancelAll?.();
  };

  const list = { items, onRetry, onRemove, onCancel, labels };
  const alert = hasFailed ? (
    <span className="upload-tray-alert" aria-hidden="true">
      <CircleX />
    </span>
  ) : null;

  return (
    <>
      {/* Polite and in the page from the first render, server included, so a screen reader is listening before
          the words arrive; kept out of a modal's hiding, as the toasts' host is. */}
      <div
        className="upload-tray-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-react-aria-top-layer="true"
      >
        {message ? <div key={message.key}>{message.text}</div> : null}
      </div>
      {hasItems ? (
        <>
          <section
            ref={wideRef}
            className={cx('overlay', 'upload-tray', className)}
            aria-labelledby={titleId}
            data-collapsed={isCollapsed ? '' : undefined}
          >
            <div className="upload-tray-header">
              {alert}
              <div className="upload-tray-heading">
                <h2 ref={titleRef} id={titleId} className="upload-tray-title" tabIndex={-1}>
                  {title}
                </h2>
                {present(description) ? <p className="upload-tray-description">{description}</p> : null}
              </div>
              <IconButton
                ref={foldRef}
                className="upload-tray-fold"
                aria-label={labels.details}
                aria-expanded={!isCollapsed}
                aria-controls={bodyId}
                onPress={() => {
                  setCollapsed(!isCollapsed);
                }}
              >
                <ChevronDown />
              </IconButton>
              {canClose ? (
                <IconButton
                  aria-label={labels.close}
                  data-closer="wide"
                  onPress={() => {
                    void close('wide');
                  }}
                >
                  <X />
                </IconButton>
              ) : null}
            </div>
            <div className="upload-tray-body" id={bodyId} hidden={isCollapsed}>
              <BaseUploadList {...list} aria-labelledby={titleId} focusFallback={() => titleRef.current} />
            </div>
          </section>
          <div
            ref={barRef}
            className={cx('overlay', 'upload-tray-bar', className)}
            role="region"
            aria-label={labels.region}
          >
            <RACButton
              ref={barButtonRef}
              className="upload-tray-bar-button"
              aria-haspopup="dialog"
              aria-expanded={isSheetOpen}
              onPress={() => {
                setSheetOpen(true);
              }}
            >
              {alert}
              <span className="upload-tray-bar-title">{title}</span>
              <span className="upload-tray-bar-icon" aria-hidden="true">
                <ChevronUp />
              </span>
            </RACButton>
            {canClearBar ? (
              <RACButton
                className="upload-tray-bar-clear"
                aria-label={labels.clear}
                data-closer="bar"
                onPress={() => {
                  onClear();
                }}
              >
                <X aria-hidden="true" />
              </RACButton>
            ) : null}
          </div>
          <Sheet
            ref={sheetRef}
            title={title}
            description={description}
            closeLabel={labels.closeSheet}
            className="upload-tray-sheet"
            isOpen={isSheetOpen}
            onOpenChange={(isOpen) => {
              if (isOpen) setSheetOpen(true);
              else closeSheet();
            }}
            footer={
              canClose ? (
                <Button
                  variant="secondary"
                  className="upload-tray-sheet-action"
                  data-closer="sheet"
                  onPress={() => {
                    void close('sheet');
                  }}
                >
                  {inFlight === 0 ? labels.clear : labels.cancelAll}
                </Button>
              ) : null
            }
          >
            <BaseUploadList {...list} aria-label={title} onNavigate={closeSheet} />
          </Sheet>
        </>
      ) : null}
      {dialog}
    </>
  );
}
