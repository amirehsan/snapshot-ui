'use client';

import { Button, Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from '@snapshot-ui/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useState, type ReactElement } from 'react';

type Keys = 'all' | Iterable<string | number>;

export default function MenuSelection(): ReactElement {
  const [theme, setTheme] = useState<Keys>(new Set(['system']));
  const [shown, setShown] = useState<Keys>(new Set(['sidebar']));
  return (
    <MenuTrigger>
      <Button variant="secondary">View options</Button>
      <Menu>
        <MenuSection title="Theme" selectionMode="single" selectedKeys={theme} onSelectionChange={setTheme}>
          <MenuItem id="light" icon={<Sun />}>
            Light
          </MenuItem>
          <MenuItem id="dark" icon={<Moon />}>
            Dark
          </MenuItem>
          <MenuItem id="system" icon={<Monitor />}>
            System
          </MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuSection title="Show" selectionMode="multiple" selectedKeys={shown} onSelectionChange={setShown}>
          <MenuItem id="sidebar">Sidebar</MenuItem>
          <MenuItem id="minimap">Minimap</MenuItem>
        </MenuSection>
      </Menu>
    </MenuTrigger>
  );
}
