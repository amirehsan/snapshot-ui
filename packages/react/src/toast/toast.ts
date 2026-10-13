'use client';

import type { ReactNode } from 'react';
import { UNSTABLE_ToastQueue } from 'react-aria-components';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  /** The button's label, such as "Undo". */
  label: string;
  /** Runs on press; the toast then closes. */
  onAction: () => void;
}

export interface ToastOptions {
  /** The message. Say the outcome in words: the tone only repeats it. Preformatted. */
  title: ReactNode;
  /** A second line, in slate. */
  description?: ReactNode;
  tone: ToastTone;
  /** A button such as "Undo". A toast with an action stays until it is used or dismissed. */
  action?: ToastAction;
  /**
   * Milliseconds before it leaves, or `null` to stay until dismissed. Unless given: 6000, 12000 for
   * `error`, and `null` with an `action`.
   */
  timeout?: number | null;
  /** Called when it leaves, however it leaves. */
  onClose?: () => void;
}

/** What the queue holds for each toast. */
export type ToastContent = Omit<ToastOptions, 'timeout' | 'onClose'>;

export interface ToastFunction {
  /** Shows a toast and returns its id. Callable from any client code, including after a server action returns. */
  (options: ToastOptions): string;
  /** Closes one toast by id. */
  dismiss: (id: string) => void;
  /** Drops every toast, errors included: a new save starts and the last result is stale. */
  clear: () => void;
}

const TIMEOUT: Record<ToastTone, number> = { success: 6000, info: 6000, warning: 6000, error: 12000 };

/**
 * The one queue. It creates no DOM, so this module imports on the server.
 *
 * Internal: not exported from the package.
 */
export const queue: UNSTABLE_ToastQueue<ToastContent> = new UNSTABLE_ToastQueue<ToastContent>({
  maxVisibleToasts: 3,
});

/** The open toasts, so clear() can close each one and fire its onClose, which React Aria's clear() does not. */
const open = new Set<string>();

let regions = 0;
let warned = false;

/**
 * Counts the mounted regions, so a toast called with none can say so.
 *
 * Internal: not exported from the package.
 */
export function markRegion(delta: 1 | -1): void {
  regions += delta;
}

function show({ timeout, onClose, ...content }: ToastOptions): string {
  if (regions === 0 && !warned) {
    warned = true;
    console.warn(
      'toast() was called with no <ToastRegion /> mounted, so nothing will show. Mount one at the app root.',
    );
  }
  const ms = timeout === undefined ? (content.action ? null : TIMEOUT[content.tone]) : timeout;
  let key = '';
  key = queue.add(content, {
    timeout: ms ?? undefined,
    onClose: () => {
      open.delete(key);
      onClose?.();
    },
  });
  open.add(key);
  return key;
}

/**
 * Shows a toast in the `ToastRegion` mounted at the app root, and returns its id: `toast({ title, tone })`.
 * `toast.dismiss(id)` closes one, and `toast.clear()` drops them all. A plain function on a module
 * singleton, so any client code may call it, after `await` on a server action included.
 */
export const toast: ToastFunction = Object.assign(show, {
  dismiss: (id: string): void => {
    queue.close(id);
  },
  clear: (): void => {
    for (const key of [...open]) queue.close(key);
    queue.clear();
  },
});
