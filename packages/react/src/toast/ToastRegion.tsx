'use client';

import { X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactElement } from 'react';
import {
  Text,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as RACToastContent,
  UNSTABLE_ToastList as RACToastList,
  UNSTABLE_ToastRegion as RACToastRegion,
  type QueuedToast,
} from 'react-aria-components';
import { Button } from '../button/Button';
import { IconButton } from '../icon-button/IconButton';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { markRegion, queue, type ToastContent } from './toast';

export interface ToastRegionProps {
  /** The region's name. @default React Aria's localized count, such as "2 notifications." */
  'aria-label'?: string;
  /** The dismiss button's accessible name. @default 'Dismiss' */
  dismissLabel?: string;
  /**
   * How many toasts show at once. The newest always shows, and the oldest is hidden until one leaves. Applies
   * from the next toast. @default 3
   */
  maxVisibleToasts?: number;
  /** Goes on the region, after its classes. */
  className?: string;
}

type Queued = QueuedToast<ToastContent>;

const subscribe = (listener: () => void): (() => void) => queue.subscribe(listener);
const visibleNow = (): readonly Queued[] => queue.visibleToasts;
const NONE: readonly Queued[] = [];
const visibleOnServer = (): readonly Queued[] => NONE;

/**
 * The latest polite toast, for the status host to announce: each toast that arrives is seen once, as it
 * arrives at the head of the queue, and a polite one replaces the last. An error is left to its own alert.
 * The toast stays until it leaves the screen, so the host never holds words nothing shows, and one that comes
 * back into view, when a newer one closes, is not read again. Two polite toasts raised in one handler render
 * once, so only the second is read: the host announces the latest, never a backlog.
 */
function useAnnouncement(): Queued | null {
  const [latest, setLatest] = useState<Queued | null>(null);
  useEffect(() => {
    const seen = new WeakSet<Queued>();
    const update = (): void => {
      const visible = queue.visibleToasts;
      const newest = visible[0];
      const arrived = newest !== undefined && !seen.has(newest) ? newest : undefined;
      if (arrived) seen.add(arrived);
      setLatest((current) => {
        if (arrived && arrived.content.tone !== 'error') return arrived;
        return current && visible.includes(current) ? current : null;
      });
    };
    update();
    return queue.subscribe(update);
  }, []);
  return latest;
}

/**
 * Where every toast shows, mounted once at the app root, in a client component: the bottom end corner of
 * the viewport, 16px in, above every modal. It renders two things. In place, a visually hidden polite
 * status host that is in the page from the first render, server included, so a screen reader is already
 * listening when a toast's words arrive in it. And React Aria's toast region, which portals itself to the
 * body with the first toast: a landmark F6 reaches, holding the list, newest nearest the corner. Hover and
 * focus inside it pause every timer. Both carry React Aria's top-layer attribute, which keeps them out of a
 * modal's hide and its outside press, so a toast is announced and pressed while a dialog is open.
 *
 * React Aria's toast parts are `UNSTABLE_` in react-aria-components 1.22, so they are wrapped entirely, and
 * the package pins that version exactly.
 */
export function ToastRegion({
  'aria-label': ariaLabel,
  dismissLabel = 'Dismiss',
  maxVisibleToasts = 3,
  className,
}: ToastRegionProps): ReactElement {
  const latest = useAnnouncement();
  const regionRef = useRef<HTMLDivElement>(null);
  const visible = useSyncExternalStore(subscribe, visibleNow, visibleOnServer);

  // React Aria pauses the timers when hover or focus enters the region, and a toast that arrives after that
  // starts its own as it mounts. This effect runs after the new toast's, since the toasts are inside the
  // region, and holds it with the rest while the pointer or focus is still there.
  useEffect(() => {
    const region = regionRef.current;
    if (region && (region.matches('[data-hovered]') || region.contains(document.activeElement))) {
      queue.pauseAll();
    }
  }, [visible]);

  // Counted from the layout phase, so a toast that a component raises as it mounts finds the region counted.
  useLayoutEffect(() => {
    markRegion(1);
    return () => {
      markRegion(-1);
    };
  }, []);

  // The queue reads the field each time a toast is added or closed, so a change applies from the next one. It
  // is a plain instance field in 1.22.1, private only in React Aria's types, and the exact version pin and the
  // tests hold it there. A region that leaves puts back what it found.
  useLayoutEffect(() => {
    const field = queue as unknown as { maxVisibleToasts: number };
    const before = field.maxVisibleToasts;
    field.maxVisibleToasts = maxVisibleToasts;
    return () => {
      field.maxVisibleToasts = before;
    };
  }, [maxVisibleToasts]);

  return (
    <>
      <div
        className="toast-status-host"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-react-aria-top-layer="true"
      >
        {latest ? (
          // Keyed by the toast, so the same words twice are a new node and are announced twice. The title and
          // the second line are blocks, so a screen reader pauses between them.
          <div key={latest.key}>
            <div>{latest.content.title}</div>
            {present(latest.content.description) ? <div>{latest.content.description}</div> : null}
          </div>
        ) : null}
      </div>
      <RACToastRegion
        ref={regionRef}
        queue={queue}
        aria-label={ariaLabel}
        className={cx('overlay', 'toast-region', className)}
      >
        <RACToastList<ToastContent> className="toast-list">
          {({ toast: item }) => {
            const { title, description, tone, action } = item.content;
            return (
              <RACToast toast={item} className="toast" data-tone={tone}>
                {/* An error keeps React Aria's assertive alert. Every other tone is announced by the status
                    host, so its own words are a plain group and nothing is read twice. */}
                <RACToastContent className="toast-content" role={tone === 'error' ? undefined : 'group'}>
                  <Text slot="title" elementType="div" className="toast-title">
                    {title}
                  </Text>
                  {present(description) ? (
                    <Text slot="description" elementType="div" className="toast-description">
                      {description}
                    </Text>
                  ) : null}
                </RACToastContent>
                <div className="toast-controls">
                  {action ? (
                    <Button
                      variant="secondary"
                      onPress={() => {
                        action.onAction();
                        queue.close(item.key);
                      }}
                    >
                      {action.label}
                    </Button>
                  ) : null}
                  <IconButton slot="close" aria-label={dismissLabel}>
                    <X />
                  </IconButton>
                </div>
              </RACToast>
            );
          }}
        </RACToastList>
      </RACToastRegion>
    </>
  );
}
