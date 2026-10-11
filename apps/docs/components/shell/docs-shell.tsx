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

  useEffect(() => {
    const root = document.documentElement;
    if (drawerOpen) {
      root.dataset.drawer = 'open';
      document.querySelector<HTMLElement>('.rail .rail-link[aria-current="page"], .rail .rail-link')?.focus();
    } else if (root.dataset.drawer === 'open') {
      delete root.dataset.drawer;
      document.querySelector<HTMLElement>('.header-menu')?.focus();
    }
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDrawerPath(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
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
      openDrawer: () => {
        setDrawerPath(pathname);
      },
      openSearch: () => {
        setSearchOpen(true);
      },
    }),
    [pathname],
  );

  const toggleCollapsed = (): void => {
    writeRailCollapsed(!collapsed);
  };

  return (
    <ShellContext value={actions}>
      <Rail
        tree={tree}
        pathname={pathname}
        version={version}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onSearch={actions.openSearch}
      />
      <div
        className="scrim"
        aria-hidden
        onClick={() => {
          setDrawerPath(null);
        }}
      />
      <div className="workspace">{children}</div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </ShellContext>
  );
}
