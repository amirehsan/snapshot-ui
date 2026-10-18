'use client';

import { X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { Toolbar, type Key } from 'react-aria-components';
import { Button } from '../button/Button';
import { IconButton } from '../icon-button/IconButton';
import { Tooltip, TooltipTrigger } from '../tooltip/Tooltip';
import { useChrome } from '../utils/focus-clear';
import { present } from '../utils/present';
import { useBottomBarOffset } from '../utils/useBottomBarOffset';
import { isBulkActionData, isDrawn } from './bulk-actions';
import { BulkMenu } from './BulkMenu';
import type { DataTableBulkAction } from './DataTable';

export interface BulkBarProps {
  /** The bar's name, `labels.toolbar`. */
  label: string;
  /** The count in the app's words, `labels.selected(formatCount(count))`. */
  count: string;
  /** The app's buttons as a node, or the actions as data, laid out with a More menu. */
  actions: ReactNode | readonly DataTableBulkAction[];
  /** The app's "Select all 1,240 matching", after the count. */
  selectAllMatching?: ReactNode;
  /** The selected keys present in `items`, which a data action receives. */
  keys: Key[];
  /** `labels.clearSelection`: the X's name and its tip. */
  clearLabel: string;
  /** `labels.moreActions`: the More button's name. */
  moreLabel: string;
  /** Clears the selection and puts focus on the table. */
  onClear: () => void;
}

/** The most actions drawn as buttons; a fourth promoted one and later are in More (ruling 25). */
export const MOST_PROMOTED = 3;

/** What can hold focus in the bar, among which a control that leaves hands focus on. */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]';

/** The controls of `bar` a reader can reach now: drawn and not disabled. */
const reachable = (bar: Element): HTMLElement[] =>
  [...bar.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (control) => isDrawn(control) && !control.matches(':disabled') && control.tabIndex >= 0,
  );

/**
 * The bulk-action bar (spec 7.1 and 11.2, rulings 5 and 25): React Aria's Toolbar named `label`, holding Clear
 * selection as an X icon with a tip of the same words, the count, the app's `selectAllMatching`, and the actions:
 * the app's node as 0.6.0 drew it, or the data form's promoted actions as buttons (at most three) and a More menu
 * for the rest. The arrows move between its controls and Tab leaves it, React Aria's toolbar keys. React Aria's
 * Toolbar takes no key or focus handlers, so DataTable's root hears the bar's Escape, which clears and puts focus
 * on the table (spec correction 18). The bar writes its height as `--save-bar-offset`, as SaveBar does, so the
 * upload tray and the toasts sit above it. A control that leaves with focus on it, by a render or by the bar's
 * container query hiding it, hands focus to the control now in its place, never to the page. Private to
 * DataTable, which shows it while any row in `items` is selected.
 */
export function BulkBar({
  label,
  count,
  actions,
  selectAllMatching,
  keys,
  clearLabel,
  moreLabel,
  onClear,
}: BulkBarProps): ReactElement {
  const barRef = useRef<HTMLDivElement>(null);
  useBottomBarOffset(barRef);
  // A control elsewhere on the page that focus lands on under the stuck bar is scrolled clear of it; DataTable's own
  // rows are cleared by `scroll.ts`, flush with the bar, which keeps no gap so the two never add.
  useChrome(barRef, 'bottom');

  // The control that last held focus in the bar, and its place among the controls then reachable; null once the
  // reader has moved focus out of the bar, so a later change in the bar never takes it back (spec correction 111).
  const last = useRef<{ control: HTMLElement; index: number } | null>(null);
  /**
   * Gives focus to the control in the place of the one that held it, once that one has left, been hidden or been
   * disabled and focus has fallen to the page. Focus the reader moved anywhere else, the page's body included, is
   * left alone.
   */
  const mend = (): void => {
    const bar = barRef.current;
    const held = last.current;
    if (bar === null || held === null) return;
    const { control, index } = held;
    if (isDrawn(control) && !control.matches(':disabled')) return;
    const active = bar.ownerDocument.activeElement;
    if (active !== null && active !== bar.ownerDocument.body && active !== control) return;
    const controls = reachable(bar);
    const next = controls[Math.max(0, Math.min(index, controls.length - 1))];
    if (next === undefined) return;
    next.focus();
    last.current = { control: next, index: controls.indexOf(next) };
  };
  // After every render, for a control the app took away (a selectAllMatching that has done its work).
  useLayoutEffect(mend);
  useEffect(() => {
    const bar = barRef.current;
    if (bar === null) return;
    const onFocusIn = (event: FocusEvent): void => {
      if (!(event.target instanceof HTMLElement)) return;
      last.current = { control: event.target, index: reachable(bar).indexOf(event.target) };
    };
    // Focus that leaves a control which is still connected, drawn and enabled a frame later was moved by the
    // reader, by Tab or by a press on plain text, which leaves it on the body: the bar forgets it. A control that
    // has left, been hidden or been disabled by then is the mend's; the frame lets a render or the container
    // query settle first.
    const frames = new Set<number>();
    const onFocusOut = (event: FocusEvent): void => {
      const control = event.target;
      if (!(control instanceof HTMLElement)) return;
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        if (last.current?.control !== control) return;
        if (bar.contains(bar.ownerDocument.activeElement)) return;
        if (control.isConnected && isDrawn(control) && !control.matches(':disabled')) last.current = null;
      });
      frames.add(frame);
    };
    // A press outside the bar moves the reader on at once, whatever the frame's check would find.
    const onPointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && bar.contains(event.target)) return;
      last.current = null;
    };
    const document = bar.ownerDocument;
    bar.addEventListener('focusin', onFocusIn);
    bar.addEventListener('focusout', onFocusOut);
    document.addEventListener('pointerdown', onPointerDown, true);
    // A bar that narrows past its container query hides its promoted buttons: read again as it resizes.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(mend) : null;
    observer?.observe(bar);
    return () => {
      bar.removeEventListener('focusin', onFocusIn);
      bar.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('pointerdown', onPointerDown, true);
      for (const frame of frames) cancelAnimationFrame(frame);
      observer?.disconnect();
    };
    // `mend` reads only refs, so the first one serves for the bar's life.
  }, []);

  const data = isBulkActionData(actions) ? actions : null;
  const promoted =
    data === null ? [] : data.filter((action) => action.isPromoted === true).slice(0, MOST_PROMOTED);
  return (
    <Toolbar ref={barRef} aria-label={label} className="data-table-bar">
      <TooltipTrigger>
        <IconButton className="data-table-bar-clear" aria-label={clearLabel} onPress={onClear}>
          <X />
        </IconButton>
        <Tooltip>{clearLabel}</Tooltip>
      </TooltipTrigger>
      <span className="data-table-bar-count">{count}</span>
      {present(selectAllMatching) ? (
        <div className="data-table-bar-select-all">{selectAllMatching}</div>
      ) : null}
      {data === null ? (
        present(actions as ReactNode) ? (
          <div className="data-table-bar-actions">{actions as ReactNode}</div>
        ) : null
      ) : data.length > 0 ? (
        <div className="data-table-bar-actions">
          {promoted.map((action) => (
            <Button
              key={action.id}
              variant="secondary"
              data-action-id={action.id}
              isDisabled={action.isDisabled}
              onPress={() => {
                action.onAction(keys);
              }}
            >
              {present(action.icon) ? (
                <span className="data-table-bar-icon" aria-hidden="true">
                  {action.icon}
                </span>
              ) : null}
              {action.label}
            </Button>
          ))}
          <BulkMenu
            actions={data}
            promoted={new Set(promoted.map((action) => action.id))}
            keys={keys}
            label={moreLabel}
            barRef={barRef}
          />
        </div>
      ) : null}
    </Toolbar>
  );
}
