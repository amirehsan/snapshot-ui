'use client';

import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { Button as RACButton } from 'react-aria-components';
import { useOptionalAppShell } from '../app-shell/AppShell';
import { useConfirm } from '../dialog/useConfirm';
import { IconButton } from '../icon-button/IconButton';
import { Sheet } from '../sheet/Sheet';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useBeforeUnload } from '../utils/useBeforeUnload';
import { useControllableState } from '../utils/useControllableState';
import { countUploads, inFlightOf, type UploadCounts } from './counts';
import { BaseUploadList, uploadListLabels, type UploadListLabels, type UploadListProps } from './UploadList';
import {
  DEFAULT_ANNOUNCEMENTS,
  useUploadAnnouncements,
  type UploadAnnouncementLabels,
} from './useUploadAnnouncements';

export interface UploadTrayLabels extends UploadListLabels, UploadAnnouncementLabels {
  /** The heading, from the counts as `formatCount` writes them. @default "Uploading 2 of 5", then "5 uploads complete" */
  title: (counts: UploadCounts, format: (count: number) => string) => string;
  /** The fold button's name, the same open or folded; `aria-expanded` says which. @default 'Upload details' */
  details: string;
  /** @default 'Close' */
  close: string;
  /** The question the close button asks while files are in flight. @default 'Cancel 3 uploads?', 'Files still uploading will not be saved.', 'Cancel uploads', 'Keep uploading' */
  cancelAllTitle: (inFlight: string) => string;
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
  /** The close button once nothing is in flight: the app clears its settled items. */
  onClear?: () => void;
  /** The close button while files are in flight, after a confirm. Without it the button shows only once all have settled. */
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
    const done = counts.saved + counts.review + counts.failed;
    return inFlightOf(counts) > 0
      ? `Uploading ${format(Math.min(done + 1, counts.total))} of ${format(counts.total)}`
      : `${format(counts.total)} ${plural(counts.total, 'upload', 'uploads')} complete`;
  },
  details: 'Upload details',
  close: 'Close',
  cancelAllTitle: (inFlight) => `Cancel ${inFlight} uploads?`,
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

/**
 * Where uploads report: the files the app is uploading, mounted once in AppShell's `floating` slot from the app's
 * root layout, so it stays across client navigation. From 768px it is a panel in the bottom end corner, the
 * toasts' 28rem column, with a title that counts, a fold button and a close button; under 768px a docked bar
 * that says the title and opens a Sheet with the list. With no items it draws only its polite status host,
 * which says three things: a batch's start, failures and needs-review gathered over a pause, and a summary once
 * everything has settled. It asks before it cancels uploads in flight and warns before the page unloads while
 * any is. The app holds the items and does the uploading; the tray draws and announces.
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

  const counts = countUploads(items);
  const inFlight = inFlightOf(counts);
  const hasItems = items.length > 0;
  const title = labels.title(counts, formatCount);
  const message = useUploadAnnouncements(items, labels, formatCount);
  useBeforeUnload(warnsOnUnload && inFlight > 0);

  // Whether focus is in the tray: either face or the sheet. A row or the whole tray leaving takes the focused
  // element with it and fires no focus event, so this keeps the last word until focus moves on its own.
  const focusInside = useRef(false);
  // A yes to Cancel all, whose dialog holds focus while the tray it asked from may leave.
  const cancelled = useRef(false);
  useEffect(() => {
    if (!hasItems) return;
    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target;
      focusInside.current =
        target instanceof Node &&
        (wideRef.current?.contains(target) === true ||
          barRef.current?.contains(target) === true ||
          (target instanceof Element && target.closest('.upload-tray-sheet') !== null));
    };
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [hasItems]);

  // The tray leaves with its last item: focus that was in it goes to main, never to the body. After a Cancel all,
  // focus is in the dialog, which plays its exit first.
  useLayoutEffect(() => {
    if (hasItems || !(focusInside.current || cancelled.current)) return;
    focusInside.current = false;
    cancelled.current = false;
    return catchFallingFocus(() => mainOf(mainId));
  }, [hasItems, mainId]);

  // The tray unmounts with focus inside: the same, once the commit has taken its elements away.
  useLayoutEffect(
    () => () => {
      if (!focusInside.current) return;
      const target = mainOf(mainId);
      queueMicrotask(() => {
        if (isFocusLost()) target?.focus({ preventScroll: true });
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

  const canClose = inFlight === 0 ? onClear !== undefined : onCancelAll !== undefined;
  const close = async (): Promise<void> => {
    if (inFlight === 0) {
      onClear?.();
      return;
    }
    const yes = await confirm({
      title: labels.cancelAllTitle(formatCount(inFlight)),
      description: labels.cancelAllDescription,
      confirmLabel: labels.cancelAllConfirm,
      cancelLabel: labels.cancelAllKeep,
      tone: 'danger',
    });
    if (!yes) return;
    cancelled.current = true;
    onCancelAll?.();
  };

  const list = { items, onRetry, onRemove, onCancel, labels };

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
                  onPress={() => {
                    void close();
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
              className="upload-tray-bar-button"
              aria-haspopup="dialog"
              aria-expanded={isSheetOpen}
              onPress={() => {
                setSheetOpen(true);
              }}
            >
              <span className="upload-tray-bar-title">{title}</span>
              <span className="upload-tray-bar-icon" aria-hidden="true">
                <ChevronUp />
              </span>
            </RACButton>
          </div>
          <Sheet
            title={title}
            description={description}
            closeLabel={labels.close}
            className="upload-tray-sheet"
            isOpen={isSheetOpen}
            onOpenChange={(isOpen) => {
              if (isOpen) setSheetOpen(true);
              else closeSheet();
            }}
          >
            <BaseUploadList {...list} aria-label={title} onNavigate={closeSheet} />
          </Sheet>
        </>
      ) : null}
      {dialog}
    </>
  );
}
