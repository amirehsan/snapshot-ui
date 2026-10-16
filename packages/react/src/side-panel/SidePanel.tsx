'use client';

import { X } from 'lucide-react';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Context,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { VisuallyHidden } from 'react-aria-components';
import { useRailFold } from '../app-shell/AppShell';
import { IconButton } from '../icon-button/IconButton';
import { keyboardScroll } from '../overlay/keyboard-scroll';
import { isUnderModal } from '../overlay/useOverlayStack';
import { Sheet } from '../sheet/Sheet';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { useHydrated } from '../utils/useHydrated';

export interface SidePanelProps {
  /** The panel's heading, and the landmark's and the sheet's name. */
  title: string;
  /** Keeps the title for assistive technology only, for a body that opens with its own heading. @default false */
  isTitleHidden?: boolean;
  /** A line under the title, in slate. */
  description?: ReactNode;
  children: ReactNode;
  /** Actions pinned under the body, such as Save and Delete. */
  footer?: ReactNode;
  /** Controlled from the URL. */
  isOpen: boolean;
  /** The close button, Escape, and the sheet's swipe and outside press. The app writes the URL. */
  onClose: () => void;
  /**
   * Asked first on every close the panel starts: its close button, Escape, and on a phone a swipe or a press
   * outside the sheet. Return `false` to keep the panel open, such as while the app holds unsaved edits and asks
   * whether to discard them; `onClose` is then not called.
   */
  onCloseRequest?: () => boolean;
  /**
   * Escape closes the panel, and on a phone a swipe or a press outside the sheet does too. `false` leaves only the
   * close button and the app's own buttons; pass it while edits are unsaved, so a swipe cannot throw them away.
   * @default true
   */
  isDismissable?: boolean;
  /** @default 'Close' */
  closeLabel?: string;
  /** Goes on the aside, or on the sheet on a phone, merged after the library's class. */
  className?: string;
  /** The aside, or the sheet's dialog on a phone. */
  ref?: Ref<HTMLElement>;
}

/** What a SidePanelLayout gives the panel it holds. */
export interface SidePanelLayoutState {
  /** The layout's content, focus's last resort when what opened the panel has left the page. */
  content: () => HTMLDivElement | null;
  /** What opened the panel, kept by the layout, so a panel keyed by its row hands it to the next. */
  opener: () => Element | null;
  setOpener: (element: Element) => void;
  /** Whether an open panel folds an AppShell's rail under 1440px. */
  collapsesRail: boolean;
}

/** Internal: SidePanelLayout's own, read by the SidePanel inside it. */
export const SidePanelLayoutContext: Context<SidePanelLayoutState | null> =
  createContext<SidePanelLayoutState | null>(null);

/** True on the server and through hydration; after, whether the viewport is 1024px or wider. */
export function useWide(): boolean {
  const [isWide, setWide] = useState(true);
  useEffect(() => {
    // Read in an effect, never at render, and guarded: a test environment may lack matchMedia. 1024px is the
    // --breakpoint-md token, as AppShell reads it.
    if (typeof window.matchMedia !== 'function') return;
    const wide = window.matchMedia('(width >= 1024px)');
    const read = (): void => {
      setWide(wide.matches);
    };
    read();
    wide.addEventListener('change', read);
    return () => {
      wide.removeEventListener('change', read);
    };
  }, []);
  return isWide;
}

/** Whether nothing holds focus: the body, or an element that has left the page with it. */
const isFocusLost = (): boolean => {
  const active = document.activeElement;
  return active === null || active === document.body || !active.isConnected;
};

/** Whether an element is drawn: a face of a DataTable that its container query hides is `display: none`. */
function isDrawn(element: Element): boolean {
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

/**
 * What opened the panel, or, when it is no longer drawn, the item with its key in the face drawn now: a DataTable
 * beside the panel can change from its table to its list, or back, as the panel comes or goes and its box changes
 * width, and both faces carry React Aria's `data-key` on each row. Null when neither is on the page.
 */
function drawnOpener(element: Element | null, content: HTMLElement | null): HTMLElement | null {
  if (!(element instanceof HTMLElement) || !element.isConnected) return null;
  if (isDrawn(element)) return element;
  const item = element.closest<HTMLElement>('[data-key][role]');
  const key = item?.dataset.key;
  if (item === null || key === undefined || content === null) return null;
  const twins = content.querySelectorAll<HTMLElement>(
    `[data-key="${CSS.escape(key)}"][role="${item.getAttribute('role') ?? ''}"]`,
  );
  return [...twins].find(isDrawn) ?? null;
}

/**
 * Brings the row that holds what opened the panel back into view if the panel's coming moved it out, so the reader
 * still sees what they opened beside its detail.
 */
function keepInView(element: Element | null, content: HTMLElement | null): void {
  const opener = drawnOpener(element, content);
  if (opener === null || content?.contains(opener) !== true) return;
  const target = opener.closest<HTMLElement>('[role="row"]') ?? opener;
  const box = target.getBoundingClientRect();
  if (box.top < 0 || box.bottom > window.innerHeight) target.scrollIntoView({ block: 'nearest' });
}

/**
 * The detail of one row: beside the content from 1024px, a `complementary` landmark named by its title on the
 * rail's surface, sticky at `--page-sticky-top`; under 1024px, after hydration, the same panel as a Sheet. Open
 * and closed by `isOpen`, which the app reads from its URL. Focus moves to the heading when it opens and back to
 * what opened it when it closes; the wide face traps nothing and dims nothing. Put it in a SidePanelLayout's
 * `panel`, and give it `key` with the open row's id, so another row is a new opening.
 */
export function SidePanel({
  title,
  isTitleHidden = false,
  description,
  children,
  footer,
  isOpen,
  onClose,
  onCloseRequest,
  isDismissable = true,
  closeLabel = 'Close',
  className,
  ref,
}: SidePanelProps): ReactElement | null {
  const layout = use(SidePanelLayoutContext);
  const isWide = useWide();
  const titleId = useId();
  const aside = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sheetContent = useRef<HTMLElement>(null);
  // What opened the panel: the layout's, or the panel's own outside a layout.
  const ownOpener = useRef<Element | null>(null);
  const openerOf = useCallback(
    (): Element | null => (layout ? layout.opener() : ownOpener.current),
    [layout],
  );
  const remember = useCallback(
    (element: Element): void => {
      if (layout) layout.setOpener(element);
      else ownOpener.current = element;
    },
    [layout],
  );
  const contentOf = useCallback((): HTMLDivElement | null => layout?.content() ?? null, [layout]);
  // A refused swipe has taken the sheet off the screen; a new key mounts it again, and it rises.
  const [sheetKey, setSheetKey] = useState(0);

  useRailFold(isOpen && (layout?.collapsesRail ?? false));

  // An opening is isOpen turning true, or a mount after hydration with isOpen (spec correction 20). A panel in
  // the server's HTML, hydrated open, never moves focus.
  const hydrated = useHydrated();
  const wasOpen = useRef(hydrated ? false : isOpen);
  const wasWide = useRef(isWide);

  /** The heading, or the aside while the heading is hidden, so the ring a keyboard lands on can be seen. */
  const focusPanel = useCallback((): void => {
    (isTitleHidden ? aside.current : heading.current)?.focus();
  }, [isTitleHidden]);

  // Whether focus was in the aside or the sheet's dialog as it left the page: read as React detaches the ref, before
  // the element leaves, so only focus that left with the panel is given back, never focus the reader put elsewhere
  // or a page that loaded with focus nowhere.
  const leftWithFocus = useRef(false);

  /** Back to what opened the panel, or the layout's content, but only when focus left with the panel. */
  const giveFocusBack = useCallback((): void => {
    if (!leftWithFocus.current || !isFocusLost()) return;
    leftWithFocus.current = false;
    const back = drawnOpener(openerOf(), contentOf());
    if (back !== null) {
      back.focus();
      if (document.activeElement === back) return;
    }
    contentOf()?.focus({ preventScroll: true });
  }, [contentOf, openerOf]);

  useEffect(() => {
    const isOpening = isOpen && !wasOpen.current;
    const isClosing = !isOpen && wasOpen.current;
    const isMoving = isOpen && wasOpen.current && isWide !== wasWide.current;
    wasOpen.current = isOpen;
    wasWide.current = isWide;
    if (isOpening) {
      const active = document.activeElement;
      // Opened from inside a panel, as a Next button in it does, or from nowhere, the layout keeps its opener.
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        active.closest('.side-panel, .side-panel-sheet') === null
      ) {
        remember(active);
      }
      if (isWide) {
        focusPanel();
        keepInView(openerOf(), contentOf());
      }
      return;
    }
    // On the narrow face the sheet gives focus back as it leaves (trackSheet).
    if (isClosing && isWide) giveFocusBack();
    if (!isMoving || !isWide) return;
    // Narrow to wide: the sheet has left, and its own hand-back ran first; the heading takes focus after it. A
    // hand-back that lands a frame later is undone in that frame.
    focusPanel();
    const frame = requestAnimationFrame(() => {
      const panel = aside.current;
      if (panel !== null && !panel.contains(document.activeElement)) focusPanel();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOpen, isWide, focusPanel, giveFocusBack, remember, openerOf, contentOf]);

  // The aside leaving the page with the panel, as it does when the app's key changes to a closed row's: once the
  // effects of that commit have run, a microtask later, focus that left with it goes back. A panel for the next
  // row has taken focus by then, and an aside that is still on the page, as in Strict Mode's rehearsal, moves
  // nothing.
  useEffect(() => {
    if (!isOpen || !isWide) return;
    const element = aside.current;
    return () => {
      queueMicrotask(() => {
        if (wasOpen.current && wasWide.current && element?.isConnected !== true) giveFocusBack();
      });
    };
  }, [isOpen, isWide, giveFocusBack]);

  /** Every close the panel starts: asks the app first, and closes only if it agrees. */
  const requestClose = (): boolean => {
    if (onCloseRequest?.() === false) return false;
    onClose();
    return true;
  };

  const trackAside = useCallback((element: HTMLElement | null) => {
    aside.current = element;
    if (element === null) return undefined;
    leftWithFocus.current = false;
    return () => {
      aside.current = null;
      leftWithFocus.current = element.contains(document.activeElement);
    };
  }, []);
  // The sheet's dialog leaving the page: once its own hand-back has run, a frame later, focus that is still lost,
  // as when the sheet opened from no focused element or took over from the aside, goes back here.
  const trackSheet = useCallback(
    (element: HTMLElement | null) => {
      sheetContent.current = element;
      if (element === null) return undefined;
      leftWithFocus.current = false;
      return () => {
        sheetContent.current = null;
        leftWithFocus.current = element.contains(document.activeElement);
        requestAnimationFrame(giveFocusBack);
      };
    },
    [giveFocusBack],
  );
  const sheetRef = useMemo(() => mergeRefs<HTMLElement>(ref, trackSheet), [ref, trackSheet]);
  const asideRef = useMemo(() => mergeRefs<HTMLElement>(ref, trackAside), [ref, trackAside]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    // Bubble phase: an open list or menu in the panel takes its own Escape first and stops it.
    if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing) return;
    const panel = event.currentTarget;
    // A key from a portal opened in the panel reaches it only through React's tree, and is not the panel's.
    if (!(event.target instanceof Node) || !panel.contains(event.target)) return;
    // Under a modal, as a confirm dialog the panel's Delete opened, the key is the modal's.
    if (isUnderModal(panel) || !isDismissable) return;
    event.preventDefault();
    event.stopPropagation();
    requestClose();
  };

  if (!isWide) {
    return (
      <Sheet
        key={sheetKey}
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (open || requestClose()) return;
          // Refused. A close button, Escape or a press outside left the sheet where it was; a swipe took it off
          // the screen before asking, so it rises again.
          const sheet = sheetContent.current;
          if (sheet !== null && sheet.getBoundingClientRect().top >= window.innerHeight - 1) {
            setSheetKey((each) => each + 1);
          }
        }}
        title={title}
        isTitleHidden={isTitleHidden}
        description={description}
        footer={footer}
        closeLabel={closeLabel}
        isDismissable={isDismissable}
        className={cx('side-panel-sheet', className)}
        ref={sheetRef}
      >
        {children}
      </Sheet>
    );
  }

  if (!isOpen) return null;

  const shownTitle = (
    <h2 ref={heading} id={titleId} className="side-panel-title" tabIndex={-1}>
      {title}
    </h2>
  );
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape inside the panel closes it (spec 9.2, ruling 11); the panel's own controls are the tab stops
    <aside
      ref={asideRef}
      className={cx('side-panel', className)}
      aria-labelledby={titleId}
      // Focus's landing while the heading is hidden, so its ring shows; never a tab stop.
      tabIndex={isTitleHidden ? -1 : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="side-panel-header">
        <div className="side-panel-header-text">
          {isTitleHidden ? <VisuallyHidden>{shownTitle}</VisuallyHidden> : shownTitle}
          {present(description) ? <p className="side-panel-description">{description}</p> : null}
        </div>
        <IconButton aria-label={closeLabel} className="side-panel-close" onPress={requestClose}>
          <X />
        </IconButton>
      </div>
      <div className="side-panel-body" ref={keyboardScroll}>
        {children}
      </div>
      {present(footer) ? <div className="side-panel-footer">{footer}</div> : null}
    </aside>
  );
}
