'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FocusEvent, type ReactElement } from 'react';
import { TooltipTriggerStateContext, type TooltipTriggerState } from 'react-aria-components';
import { Button, type ButtonProps } from '../button/Button';
import { IconButton } from '../icon-button/IconButton';
import { Tooltip, TooltipTrigger } from '../tooltip/Tooltip';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface CopyButtonLabels {
  /** The button's name, unchanged by its outcome. Say what it copies: "Copy answer". @default 'Copy' */
  copy: string;
  /** @default 'Copied' */
  copied: string;
  /** @default 'Copy failed' */
  failed: string;
}

export interface CopyButtonProps extends Omit<
  ButtonProps,
  'onPress' | 'children' | 'variant' | 'className' | 'aria-label' | 'isPending' | 'pendingLabel'
> {
  /** The text to copy. In the page's HTML and its server payload: never a value the page may not hold. */
  value: string;
  /** `icon` is a ghost IconButton with a Tooltip; `button` a secondary Button with the icon and the word. @default 'icon' */
  look?: 'icon' | 'button';
  /** Called after each copy, with whether it worked. */
  onCopy?: (copied: boolean) => void;
  labels?: Partial<CopyButtonLabels>;
  /** Goes on the root `span.copy-button`. */
  className?: string;
}

const LABELS: CopyButtonLabels = { copy: 'Copy', copied: 'Copied', failed: 'Copy failed' };

/** How long the outcome holds: Carbon's copy button feedback and the docs site's code copy. */
const HOLD_MS = 2000;

const BUSY_WARNING =
  'A CopyButton is inside aria-busy="true", so a screen reader may not say its status: move it out of the busy part.';

/** What the last copy did, and which copy it was, so each copy writes its words as a new node. */
interface Held {
  outcome: 'copied' | 'failed';
  copy: number;
}

/**
 * Copies `value` with the document's own copy command, where the Clipboard API is missing (a page served over
 * plain http) or refuses (a frame whose permissions policy blocks it). The value is put in a span of its own
 * inside `host`, selected and copied, and the copy event is given the value as plain text, so no markup or
 * style is copied with it. The reader's selection is put back, and focus, which a selection never moves, is
 * put back too if an engine moved it.
 */
function copyByCommand(value: string, host: HTMLElement): boolean {
  const page = host.ownerDocument;
  // The command is deprecated and still the only copy a page without the Clipboard API has. jsdom has none.
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- read only to learn whether the page has it.
  if (typeof page.execCommand !== 'function') return false;
  const focused = page.activeElement;
  const selection = page.getSelection();
  const kept = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index))
    : [];
  const source = page.createElement('span');
  source.className = 'copy-button-source';
  source.setAttribute('aria-hidden', 'true');
  source.textContent = value;
  const onCopy = (event: Event): void => {
    const data = (event as ClipboardEvent).clipboardData;
    if (!data) return;
    data.setData('text/plain', value);
    event.preventDefault();
  };
  host.append(source);
  page.addEventListener('copy', onCopy, true);
  let copied: boolean;
  try {
    if (selection) {
      const range = page.createRange();
      range.selectNodeContents(source);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the fallback for a page with no Clipboard API.
    copied = page.execCommand('copy');
  } catch {
    copied = false;
  } finally {
    page.removeEventListener('copy', onCopy, true);
    source.remove();
    if (selection) {
      selection.removeAllRanges();
      for (const range of kept) selection.addRange(range);
    }
    if (focused instanceof HTMLElement && page.activeElement !== focused)
      focused.focus({ preventScroll: true });
  }
  return copied;
}

/**
 * Copies a string the page holds, and says it did without moving the reader. `icon`, the default, is a ghost
 * IconButton with a Tooltip; `button` is a secondary Button with the glyph and the word. A press calls the
 * Clipboard API's `writeText` inside the press, the user activation Safari asks for, and falls back to the
 * document's copy command where that API is missing or refuses. For two seconds the glyph turns to a check on a
 * copy, a tip shows "Copied" or "Copy failed", and a polite status beside the button says it once; the button's
 * name never changes and focus stays on it. Nothing reads the clipboard or `navigator` until a press.
 */
export function CopyButton({
  value,
  look = 'icon',
  onCopy,
  labels: given,
  className,
  ref,
  onBlur,
  ...props
}: CopyButtonProps): ReactElement {
  const labels: CopyButtonLabels = { ...LABELS, ...given };
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Memoized, so React does not detach and attach the button's refs on every render.
  const refs = useMemo(() => mergeRefs<HTMLButtonElement>(ref, buttonRef), [ref]);
  const [held, setHeld] = useState<Held | null>(null);
  // The outcome's tip, shown by a copy until the hold ends or the reader dismisses it, and its words, which stay
  // while it leaves.
  const [outcomeTip, setOutcomeTip] = useState(false);
  const [tipWords, setTipWords] = useState('');
  const [busy, setBusy] = useState(false);
  const copies = useRef(0);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(hold.current);
    };
  }, []);

  useWarnOnce(busy ? BUSY_WARNING : null);

  // Escape anywhere dismisses the outcome's tip, as it does any tip, wherever focus or the pointer is. It takes
  // the key, as React Aria's own tips do, so one Escape closes the tip and not a dialog or popover around it too.
  useEffect(() => {
    if (!outcomeTip) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOutcomeTip(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [outcomeTip]);

  /** Says how copy number `copy` went, unless a later copy has spoken or the part has left. */
  const show = (copy: number, copied: boolean): void => {
    onCopy?.(copied);
    if (!mounted.current || copy !== copies.current) return;
    if (rootRef.current?.closest('[aria-busy="true"]')) setBusy(true);
    setHeld({ outcome: copied ? 'copied' : 'failed', copy });
    setTipWords(copied ? labels.copied : labels.failed);
    setOutcomeTip(true);
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      setHeld(null);
      setOutcomeTip(false);
    }, HOLD_MS);
  };

  const copy = (): void => {
    copies.current += 1;
    const current = copies.current;
    const host = rootRef.current;
    const byCommand = (): boolean => (host ? copyByCommand(value, host) : false);
    // Missing outside a secure context, whatever its type says.
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (typeof clipboard?.writeText !== 'function') {
      show(current, byCommand());
      return;
    }
    let written: Promise<void>;
    try {
      written = clipboard.writeText(value);
    } catch (error) {
      written = Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
    written.then(
      () => {
        show(current, true);
      },
      () => {
        show(current, byCommand());
      },
    );
  };

  const outcome = held ? labels[held.outcome] : null;
  const glyphs = (
    <>
      <span className="copy-button-glyph" data-glyph="copy" aria-hidden="true">
        <Copy />
      </span>
      <span className="copy-button-glyph" data-glyph="check" aria-hidden="true">
        <Check />
      </span>
    </>
  );

  // Opened only by a copy; the pointer leaving it, a scroll, a resize or Escape close it.
  const outcomeTipState = useMemo<TooltipTriggerState>(
    () => ({
      isOpen: outcomeTip,
      shouldSkipAnimation: false,
      open: () => undefined,
      close: () => {
        setOutcomeTip(false);
      },
    }),
    [outcomeTip],
  );

  const onButtonBlur = (event: FocusEvent): void => {
    // Focus leaving the button takes the outcome's tip with it; the status has said it already.
    setOutcomeTip(false);
    onBlur?.(event);
  };

  const button =
    look === 'icon' ? (
      <IconButton
        {...props}
        ref={refs}
        variant="ghost"
        aria-label={labels.copy}
        onPress={copy}
        onBlur={onButtonBlur}
      >
        {glyphs}
      </IconButton>
    ) : (
      <Button {...props} ref={refs} variant="secondary" onPress={copy} onBlur={onButtonBlur}>
        {glyphs}
        {labels.copy}
      </Button>
    );

  return (
    <span
      ref={rootRef}
      className={cx('copy-button', className)}
      data-look={look}
      data-outcome={held?.outcome}
    >
      {look === 'icon' ? (
        // The name's tip, on hover and focus, the library's tip for an icon button. It stays shut while the
        // outcome's tip holds the same place.
        <TooltipTrigger isDisabled={outcomeTip}>
          {button}
          <Tooltip>{labels.copy}</Tooltip>
        </TooltipTrigger>
      ) : (
        button
      )}
      {/*
       * The outcome's tip, for the eye, with a state of its own that no trigger shares: it never becomes the
       * button's description, so the status alone says the outcome, once. The word look, whose name is shown, has
       * only this tip.
       */}
      <TooltipTriggerStateContext.Provider value={outcomeTipState}>
        <Tooltip triggerRef={buttonRef}>{tipWords}</Tooltip>
      </TooltipTriggerStateContext.Provider>
      <span className="copy-button-status" role="status" aria-live="polite" aria-atomic="true">
        {held && outcome !== null ? <span key={held.copy}>{outcome}</span> : null}
      </span>
    </span>
  );
}
