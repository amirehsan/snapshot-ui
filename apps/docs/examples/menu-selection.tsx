import { Button, Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from '@snapshot-ui/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ReactElement } from 'react';

export default function MenuSelection(): ReactElement {
  return (
    <MenuTrigger>
      <Button variant="secondary">View options</Button>
      <Menu>
        <MenuSection title="Theme" selectionMode="single" defaultSelectedKeys={['system']}>
          <MenuItem id="light" icon={<Sun />}>
            Light
          </MenuItem>
          <MenuItem id="dark" icon={<Moon />}>
            Dark
          </MenuItem>
          <MenuItem id="system" icon={<Monitor />} description="Follows the device">
            System
          </MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuSection title="Show" selectionMode="multiple" defaultSelectedKeys={['sidebar']}>
          <MenuItem id="sidebar">Sidebar</MenuItem>
          <MenuItem id="minimap">Minimap</MenuItem>
        </MenuSection>
      </Menu>
    </MenuTrigger>
  );
}
