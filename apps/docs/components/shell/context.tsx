'use client';

import { createContext, use } from 'react';

export interface ShellActions {
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
