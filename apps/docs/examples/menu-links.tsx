'use client';

import { Button, Menu, MenuItem, MenuTrigger } from '@snapshot-ui/react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { RouterProvider } from 'react-aria-components';

const PAGES = [
  { slug: 'button', title: 'Button' },
  { slug: 'dialog', title: 'Dialog' },
  { slug: 'popover', title: 'Popover' },
];

export default function MenuLinks(): ReactElement {
  const router = useRouter();
  // An app wraps its whole tree once; the example wraps only itself.
  return (
    <RouterProvider
      navigate={(href) => {
        router.push(href);
      }}
    >
      <MenuTrigger>
        <Button variant="secondary">Jump to a component</Button>
        <Menu>
          {PAGES.map(({ slug, title }) => (
            <MenuItem key={slug} id={slug} href={`/docs/components/${slug}`}>
              {title}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
    </RouterProvider>
  );
}
