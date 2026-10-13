import { AppShell } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { ShellHeader, ShellNav, ShellPage } from './shell-nav';

export default function SidebarCollapsed(): ReactElement {
  return (
    <div className="stage-shell">
      <AppShell defaultSidebarCollapsed sidebar={<ShellNav label="Main, icons" />} header={<ShellHeader />}>
        <ShellPage />
      </AppShell>
    </div>
  );
}
