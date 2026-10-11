'use client';

import { createContext, use } from 'react';

export interface ShellActions {
  /** Whether the rail is open as a drawer, for the menu button's aria-expanded. */
  drawerOpen: boolean;
  openDrawer: () => void;
  openSearch: () => void;
}

export const ShellContext = createContext<ShellActions | null>(null);

/** The shell's actions, for the header's menu button and search. */
export function useShell(): ShellActions {
  const actions = use(ShellContext);
  if (!actions) throw new Error('useShell must be used inside DocsShell');
  return actions;
}
