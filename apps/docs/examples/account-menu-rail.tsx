'use client';

import {
  AccountMenu,
  AppShell,
  MenuItem,
  MenuSeparator,
  ThemeMenu,
  type ThemeChoice,
} from '@snapshot-ui/react';
import { LifeBuoy, LogOut, Settings } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { ShellHeader, ShellNav, ShellPage } from './shell-nav';

/** The signed-in person's menu: Settings, the theme as a submenu, Help, a rule and Sign out. */
export function AdaMenu({ isCompact }: { isCompact?: boolean }): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  return (
    <AccountMenu name="Ada Lovelace" detail="ada@example.com" isCompact={isCompact}>
      <MenuItem id="settings" href="#settings" icon={<Settings />}>
        Settings
      </MenuItem>
      <ThemeMenu value={theme} onChange={setTheme} />
      <MenuItem id="help" href="#help" icon={<LifeBuoy />}>
        Help
      </MenuItem>
      <MenuSeparator />
      <MenuItem id="sign-out" icon={<LogOut />}>
        Sign out
      </MenuItem>
    </AccountMenu>
  );
}

/** In the rail's footer, opening upward; collapse the rail and it is the avatar alone. */
export default function AccountMenuRail(): ReactElement {
  return (
    <div className="stage-shell">
      <AppShell
        sidebar={<ShellNav label="Main, with the account menu" footer={<AdaMenu />} />}
        header={<ShellHeader />}
      >
        <ShellPage />
      </AppShell>
    </div>
  );
}
