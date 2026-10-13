import { Button, DialogTrigger, Drawer, Link, Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const PAGES = ['Overview', 'Projects', 'Members', 'Billing', 'Settings'];

export default function DrawerNavigation(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="secondary">Browse the workspace</Button>
      <Drawer
        placement="start"
        title="Workspace"
        isTitleHidden
        footer={
          <div style={{ minWidth: 0 }}>
            <Text as="span" style={{ display: 'block' }}>
              Ada Lovelace
            </Text>
            <Text as="span" size="small" tone="muted" style={{ display: 'block' }}>
              ada@northwind.example
            </Text>
          </div>
        }
      >
        <nav aria-label="Workspace pages">
          <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
            {PAGES.map((page) => (
              <li key={page}>
                <Link href={`#${page.toLowerCase()}`}>{page}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </DialogTrigger>
  );
}
