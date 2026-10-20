import type { ReactElement } from 'react';
import { AccountMenu } from '../src/account-menu';
import { AppShell } from '../src/app-shell';
import { MenuItem, MenuSeparator } from '../src/menu';
import { Sidebar, SidebarGroup, SidebarItem } from '../src/sidebar';
import { ThemeMenu } from '../src/theme-switch';

/** Ada's account menu: Settings, the theme as a submenu, Help, a rule and Sign out. */
export function accountMenu(props: { isCompact?: boolean } = {}): ReactElement {
  return (
    <AccountMenu name="Ada Lovelace" detail="ada@example.com" {...props}>
      <MenuItem id="settings" href="/settings">
        Settings
      </MenuItem>
      <ThemeMenu value="system" onChange={() => undefined} />
      <MenuItem id="help">Help</MenuItem>
      <MenuSeparator />
      <MenuItem id="sign-out">Sign out</MenuItem>
    </AccountMenu>
  );
}

/**
 * The account menu in a rail's footer, in an AppShell whose server layout read the rail's state from its cookie:
 * expanded, or collapsed, which draws the compact trigger from the first paint.
 */
export function accountRail(collapsed: boolean): ReactElement {
  return (
    <AppShell
      mainId="main"
      defaultSidebarCollapsed={collapsed}
      sidebar={
        <Sidebar id="rail" aria-label="Main" footer={accountMenu()}>
          <SidebarGroup label="Overview">
            <SidebarItem href="/" icon={<svg />} isCurrent>
              Home
            </SidebarItem>
          </SidebarGroup>
        </Sidebar>
      }
    >
      <p>The page.</p>
    </AppShell>
  );
}
