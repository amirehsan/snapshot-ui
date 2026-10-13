import { AppShell } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { ShellHeader, ShellNav, ShellPage } from './shell-nav';

export default function AppShellCollapsed(): ReactElement {
  return (
    <div className="stage-shell">
      <AppShell
        defaultSidebarCollapsed
        sidebar={<ShellNav label="Main, collapsed" />}
        header={<ShellHeader />}
      >
        <ShellPage />
      </AppShell>
    </div>
  );
}
