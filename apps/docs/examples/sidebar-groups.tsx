import { AppShell } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { ShellHeader, ShellNav, ShellPage } from './shell-nav';

export default function SidebarGroups(): ReactElement {
  return (
    <div className="stage-shell">
      <AppShell sidebar={<ShellNav label="Main, groups" />} header={<ShellHeader />}>
        <ShellPage />
      </AppShell>
    </div>
  );
}
