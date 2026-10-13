'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
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
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** The id of `<main>`. */
  mainId: string;
}

const AppShellContext = createContext<AppShellState | null>(null);

/** The shell's state, for the parts and for an app's own header or palette. Throws outside an AppShell. */
export function useAppShell(): AppShellState {
  const state = use(AppShellContext);
  if (state === null) throw new Error('useAppShell must be used inside an AppShell');
  return state;
}

/**
 * The frame an app runs in: a skip link, the rail, a workspace holding a sticky header and `<main>`, and a
 * bottom tab bar. It owns the collapsed state, because the workspace offset depends on it, and the drawer
 * state, because the header's menu button and the rail share it. The root carries `data-sidebar="collapsed"`
 * while collapsed and nothing otherwise, so a server paints the right width from a prop, and CSS does the
 * rest. The drawer closes as the window widens past 1024px and on Back and Forward; nothing here needs a
 * browser at render.
 */
export function AppShell({
  sidebar,
  header,
  bottomBar,
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
  const [isSidebarCollapsed, setSidebarCollapsed] = useControllableState(
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
      <div
        {...props}
        ref={ref}
        className={cx('app-shell', className)}
        // Never "expanded": an attribute set higher up, by a pre-paint script, must not be reset.
        data-sidebar={isSidebarCollapsed ? 'collapsed' : undefined}
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
      </div>
    </AppShellContext>
  );
}
