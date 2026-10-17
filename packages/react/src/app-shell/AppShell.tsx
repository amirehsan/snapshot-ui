'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useControllableState } from '../utils/useControllableState';

export interface AppShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The rail: a Sidebar. Fixed and floating; the workspace is offset by its width from 1024px up. */
  sidebar?: ReactNode;
  /** The page header, above the main content and outside it. Sticky to the top. */
  header?: ReactNode;
  /** The bottom tab bar. Below 1024px the workspace reserves room under its content for it. */
  bottomBar?: ReactNode;
  /**
   * Floating chrome that outlives every page, such as an UploadTray: rendered after the workspace and the tab bar,
   * outside `<main>`, so a client navigation keeps it and it is never a landmark inside main.
   */
  floating?: ReactNode;
  /** The page, rendered inside `<main>`. */
  children: ReactNode;
  /** Controlled: whether the rail is collapsed to icons. Pair it with `onSidebarCollapsedChange`. */
  isSidebarCollapsed?: boolean;
  /** Uncontrolled: the first value. A server layout passes what its cookie says, so the first paint is right. @default false */
  defaultSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (isCollapsed: boolean) => void;
  /** Controlled: whether the rail is open as a drawer. Only meaningful below 1024px. */
  isDrawerOpen?: boolean;
  /** Uncontrolled: the first value. @default false */
  defaultDrawerOpen?: boolean;
  onDrawerOpenChange?: (isOpen: boolean) => void;
  /** The skip link's text. @default 'Skip to content' */
  skipLinkLabel?: string;
  /** The id of `<main>`, which the skip link targets. Default from `useId`. */
  mainId?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface AppShellState {
  /** Whether the rail is drawn collapsed: the reader's choice, or folded for an open SidePanel under 1440px. */
  isSidebarCollapsed: boolean;
  /** The reader's choice. Expanding a rail a SidePanel folded keeps it expanded until that panel closes. */
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** The id of `<main>`. */
  mainId: string;
}

const AppShellContext = createContext<AppShellState | null>(null);

/** Asks the shell to fold its rail, and returns what gives it back. Internal: SidePanel's, through `useRailFold`. */
const RailFoldContext = createContext<(() => () => void) | null>(null);

/**
 * Folds the shell's rail to its collapsed width while `isFolding` and the viewport is under 1440px, and gives it
 * back after. The reader's own choice is untouched: nothing is told through
 * `onSidebarCollapsedChange`, so a cookie that keeps the choice never holds a fold. A layout effect, so the fold
 * lands in the frame the panel comes in. Outside an AppShell it does nothing.
 *
 * Internal: not exported from the package.
 */
export function useRailFold(isFolding: boolean): void {
  const fold = use(RailFoldContext);
  useLayoutEffect(() => {
    if (!isFolding || fold === null) return;
    return fold();
  }, [fold, isFolding]);
}

/** The shell's state, for the parts and for an app's own header or palette. Throws outside an AppShell. */
export function useAppShell(): AppShellState {
  const state = use(AppShellContext);
  if (state === null) throw new Error('useAppShell must be used inside an AppShell');
  return state;
}

/**
 * The shell's state, or null outside an AppShell, for a part that may be mounted with or without one, such as
 * UploadTray, which gives focus to the shell's `<main>` when it leaves.
 *
 * Internal: not exported from the package.
 */
export function useOptionalAppShell(): AppShellState | null {
  return use(AppShellContext);
}

/**
 * The frame an app runs in: a skip link, the rail, a workspace holding a sticky header and `<main>`, a bottom
 * tab bar, and floating chrome that outlives every page, such as an UploadTray, after them all. It owns the collapsed state, because the workspace offset depends on it, and the drawer
 * state, because the header's menu button and the rail share it. The root carries `data-sidebar="collapsed"`
 * while collapsed and nothing otherwise, so a server paints the right width from a prop, and CSS does the
 * rest. The drawer closes as the window widens past 1024px and on Back and Forward; nothing here needs a
 * browser at render. An open SidePanel in a SidePanelLayout folds the rail under 1440px and gives it back as it
 * closes, without touching the reader's choice (`useRailFold`). The stylesheet draws the same fold from the server's
 * HTML (`:has()` on the layout's open panel), so a page loaded with a panel open never draws the rail expanded first.
 */
export function AppShell({
  sidebar,
  header,
  bottomBar,
  floating,
  children,
  isSidebarCollapsed: isSidebarCollapsedProp,
  defaultSidebarCollapsed,
  onSidebarCollapsedChange,
  isDrawerOpen: isDrawerOpenProp,
  defaultDrawerOpen,
  onDrawerOpenChange,
  skipLinkLabel = 'Skip to content',
  mainId: mainIdProp,
  className,
  ref,
  ...props
}: AppShellProps): ReactElement {
  const generatedId = useId();
  const mainId = mainIdProp ?? generatedId;
  const [isCollapsedChosen, setCollapsedChosen] = useControllableState(
    isSidebarCollapsedProp,
    defaultSidebarCollapsed ?? false,
    onSidebarCollapsedChange,
  );
  const [isDrawerOpen, setDrawerOpen] = useControllableState(
    isDrawerOpenProp,
    defaultDrawerOpen ?? false,
    onDrawerOpenChange,
  );
  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, [setDrawerOpen]);
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  // Whether open SidePanels ask for a fold, and whether the reader expanded the rail over one; and whether the
  // viewport is 1440px or wider, where the rail and a panel both fit and nothing folds. A panel keyed by its row
  // gives its fold back and the next panel asks again in one commit, so the fold, and the reader's waiver of it,
  // end only when no panel asks once that commit is done.
  const folds = useRef(0);
  const [fold, setFold] = useState({ isAsked: false, isWaived: false });
  const [isRoomy, setRoomy] = useState(false);
  const requestFold = useCallback(() => {
    folds.current += 1;
    setFold((each) => (each.isAsked ? each : { isAsked: true, isWaived: false }));
    return () => {
      folds.current -= 1;
      queueMicrotask(() => {
        if (folds.current === 0) setFold({ isAsked: false, isWaived: false });
      });
    };
  }, []);
  useLayoutEffect(() => {
    // Read in a layout effect, so a fold asked for as a panel mounts already knows the width. Guarded, because a
    // test environment may lack matchMedia. 1440px is the --breakpoint-lg token.
    if (typeof window.matchMedia !== 'function') return;
    const roomy = window.matchMedia('(width >= 1440px)');
    const read = (): void => {
      setRoomy(roomy.matches);
    };
    read();
    roomy.addEventListener('change', read);
    return () => {
      roomy.removeEventListener('change', read);
    };
  }, []);
  const isFolded = fold.isAsked && !fold.isWaived && !isRoomy;
  const isSidebarCollapsed = isCollapsedChosen || isFolded;
  const setSidebarCollapsed = useCallback(
    (isCollapsed: boolean) => {
      // Expanding a folded rail is the reader's call over the panel's: it stays expanded until the panel closes.
      if (!isCollapsed && fold.isAsked) setFold({ isAsked: true, isWaived: true });
      setCollapsedChosen(isCollapsed);
    },
    [fold.isAsked, setCollapsedChosen],
  );

  // Back and Forward leave the page the drawer was opened on.
  useEffect(() => {
    window.addEventListener('popstate', closeDrawer);
    return () => {
      window.removeEventListener('popstate', closeDrawer);
    };
  }, [closeDrawer]);

  useEffect(() => {
    // Past 1024px the rail is no longer a drawer. Guarded, because a test environment may lack matchMedia.
    if (typeof window.matchMedia !== 'function') return;
    const wide = window.matchMedia('(width >= 1024px)');
    const onChange = (): void => {
      if (wide.matches) closeDrawer();
    };
    wide.addEventListener('change', onChange);
    return () => {
      wide.removeEventListener('change', onChange);
    };
  }, [closeDrawer]);

  const state = useMemo<AppShellState>(
    () => ({ isSidebarCollapsed, setSidebarCollapsed, isDrawerOpen, openDrawer, closeDrawer, mainId }),
    [isSidebarCollapsed, setSidebarCollapsed, isDrawerOpen, openDrawer, closeDrawer, mainId],
  );

  return (
    <AppShellContext value={state}>
      <RailFoldContext value={requestFold}>
        <div
          {...props}
          ref={ref}
          className={cx('app-shell', className)}
          // Never "expanded": an attribute set higher up, by a pre-paint script, must not be reset.
          data-sidebar={isSidebarCollapsed ? 'collapsed' : undefined}
          // Collapsed by a fold alone: the rail and the workspace move at once, not over 200ms, so the content
          // beside a panel changes width once and a table there keeps its face.
          data-sidebar-folded={isFolded && !isCollapsedChosen ? '' : undefined}
          // The reader expanded the rail over an open panel: the stylesheet's own fold, which draws it folded
          // before scripts run, stands down until the last panel closes.
          data-sidebar-unfolded={fold.isAsked && fold.isWaived ? '' : undefined}
          data-has-sidebar={present(sidebar) ? '' : undefined}
          data-has-bottom-bar={present(bottomBar) ? '' : undefined}
        >
          <a className="app-shell-skip" href={`#${mainId}`}>
            {skipLinkLabel}
          </a>
          {sidebar}
          <div className="app-shell-workspace">
            {present(header) && <div className="app-shell-header">{header}</div>}
            <main className="app-shell-main" id={mainId} tabIndex={-1}>
              {children}
            </main>
          </div>
          {bottomBar}
          {floating}
        </div>
      </RailFoldContext>
    </AppShellContext>
  );
}
