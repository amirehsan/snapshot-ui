import { Button, Link, Sheet, SheetTrigger, Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const PAGES = ['Reports', 'Budgets', 'Members', 'Settings', 'Help'];

export default function SheetMore(): ReactElement {
  return (
    <SheetTrigger>
      <Button variant="secondary">More</Button>
      <Sheet
        title="More"
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
        <nav aria-label="More pages">
          <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
            {PAGES.map((page) => (
              <li key={page}>
                <Link href={`#${page.toLowerCase()}`}>{page}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>
    </SheetTrigger>
  );
}
