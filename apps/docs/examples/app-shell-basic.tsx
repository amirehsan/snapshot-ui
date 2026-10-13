import { AppShell } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { ShellHeader, ShellNav, ShellPage } from './shell-nav';

export default function AppShellBasic(): ReactElement {
  return (
    <div className="stage-shell">
      <AppShell sidebar={<ShellNav label="Main" />} header={<ShellHeader />}>
        <ShellPage />
      </AppShell>
    </div>
  );
}
