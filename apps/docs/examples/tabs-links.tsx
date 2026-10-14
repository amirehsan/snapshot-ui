'use client';

import { RouterProvider, Tab, TabList, TabPanel, Tabs } from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type ReactElement } from 'react';

const VIEWS = [
  { id: 'all', name: 'All', content: 'Every transaction this month, newest first.' },
  { id: 'spending', name: 'Spending', content: 'Money out: card payments, bills and transfers you sent.' },
  { id: 'income', name: 'Income', content: 'Money in: salary, refunds and transfers you received.' },
] as const;

function ViewTabs({ view }: { view: string }): ReactElement {
  const pathname = usePathname();
  const current = VIEWS.find(({ id }) => id === view) ?? VIEWS[0];
  return (
    // The URL holds the selection; the arrows only move focus, and Enter or Space follows the focused tab's link.
    <Tabs selectedKey={current.id} keyboardActivation="manual">
      <TabList aria-label="Transactions">
        {VIEWS.map(({ id, name }) => (
          <Tab key={id} id={id} href={`${pathname}?view=${id}`}>
            {name}
          </Tab>
        ))}
      </TabList>
      {/* One panel, the route's content, with the selected key as its id. */}
      <TabPanel id={current.id}>
        <p>{current.content}</p>
      </TabPanel>
    </Tabs>
  );
}

function ViewFromUrl(): ReactElement {
  return <ViewTabs view={useSearchParams().get('view') ?? 'all'} />;
}

export default function TabsLinks(): ReactElement {
  const router = useRouter();
  // An app wraps its whole tree once; the example wraps only itself.
  return (
    <div style={{ width: '100%' }}>
      <RouterProvider
        navigate={(href) => {
          router.push(href, { scroll: false });
        }}
      >
        {/* The page is static, so the server renders the fallback: the same tabs at the first view. */}
        <Suspense fallback={<ViewTabs view="all" />}>
          <ViewFromUrl />
        </Suspense>
      </RouterProvider>
    </div>
  );
}
