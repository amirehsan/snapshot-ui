'use client';

import {
  Button,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Text,
  ThemeMenu,
  type ThemeChoice,
} from '@snapshot-ui/react';
import { LogOut, Settings } from 'lucide-react';
import { useState, type ReactElement } from 'react';

/** The theme in a menu: a Theme item opening a submenu, and the three in a section of the menu itself. */
export default function ThemeSwitchMenu(): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        <MenuTrigger>
          <Button variant="secondary">Submenu</Button>
          <Menu>
            <MenuItem id="settings" icon={<Settings />}>
              Settings
            </MenuItem>
            <ThemeMenu value={theme} onChange={setTheme} />
            <MenuSeparator />
            <MenuItem id="sign-out" icon={<LogOut />}>
              Sign out
            </MenuItem>
          </Menu>
        </MenuTrigger>
        <MenuTrigger>
          <Button variant="secondary">Section</Button>
          <Menu>
            <MenuItem id="settings" icon={<Settings />}>
              Settings
            </MenuItem>
            <MenuSeparator />
            <ThemeMenu value={theme} onChange={setTheme} display="section" />
            <MenuSeparator />
            <MenuItem id="sign-out" icon={<LogOut />}>
              Sign out
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </div>
      <Text>Theme: {theme}</Text>
    </div>
  );
}
