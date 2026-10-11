'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useRailCollapsed } from '@/lib/document-state';
import { writeRailCollapsed } from '@/lib/prepaint';
import { ShellContext, type ShellActions } from './context';
import { Rail } from './rail';
import { SearchDialog } from './search';

/**
 * The Snapshot app shell: the floating rail, which collapses to icons on wide
 * screens and becomes a drawer under 1024px, the scrim, search, and the
 * workspace the page renders into. Phase 5 rebuilds it from the library's
 * Sidebar and AppShell.
 */
export function DocsShell({
  tree,
  version,
  children,
}: {
  tree: Root;
  version: string;
  children: ReactNode;
}): ReactElement {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const collapsed = useRailCollapsed();
  // The drawer belongs to the page it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;

  // The open drawer is a modal dialog: it takes focus, holds the page still and
  // closes on Escape, and everything behind it is inert (see the render below).
  useEffect(() => {
    if (!drawerOpen) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.dataset.drawer = 'open';
    root.style.overflow = 'hidden';
    const current = document.querySelector<HTMLElement>('.rail .rail-link[aria-current="page"]');
    (current ?? document.querySelector<HTMLElement>('.rail .rail-link'))?.focus();

    const onKey = (event: KeyboardEvent): void => {
      // Search is a dialog above the drawer: it handles its own keys, Escape included.
      if (event.defaultPrevented || document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        setDrawerPath(null);
      } else if (event.key === 'Tab') {
        // Everything behind the drawer is inert, so Tab would leave the page for the
        // browser's own controls. Wrap at both ends instead.
        const stops = [
          ...document.querySelectorAll<HTMLElement>('#rail a[href], #rail button:not([disabled])'),
        ];
        const first = stops[0];
        const last = stops.at(-1);
        if (!first || !last) return;
        const active = document.activeElement;
        const inside = active instanceof HTMLElement && active.closest('#rail') !== null;
        if (!inside || (event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    // Past 1024px the rail is no longer a drawer, so a window widened with it open closes it.
    const wide = matchMedia('(width >= 1024px)');
    const onWiden = (): void => {
      if (wide.matches) setDrawerPath(null);
    };
    document.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWiden);
    return () => {
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWiden);
      delete root.dataset.drawer;
      root.style.overflow = previousOverflow;
      document.querySelector<HTMLElement>('.header-menu')?.focus();
    };
  }, [drawerOpen]);

  // Cmd+K or Ctrl+K opens search from anywhere in the docs.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const actions = useMemo<ShellActions>(
    () => ({
      drawerOpen,
      openDrawer: () => {
        setDrawerPath(pathname);
      },
      openSearch: () => {
        setSearchOpen(true);
      },
    }),
    [pathname, drawerOpen],
  );

  const closeDrawer = (): void => {
    setDrawerPath(null);
  };

  const toggleCollapsed = (): void => {
    writeRailCollapsed(!collapsed);
  };

  return (
    <ShellContext value={actions}>
      <a className="skip-link" href="#main" inert={drawerOpen}>
        Skip to content
      </a>
      <Rail
        tree={tree}
        pathname={pathname}
        version={version}
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        onCloseDrawer={closeDrawer}
        onToggleCollapsed={toggleCollapsed}
        onSearch={actions.openSearch}
      />
      <div className="scrim" aria-hidden onClick={closeDrawer} />
      <div className="workspace" inert={drawerOpen}>
        {children}
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </ShellContext>
  );
}
