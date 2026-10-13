import { BottomTabBar, BottomTabBarItem, Link, Sheet, SheetTrigger } from '@snapshot-ui/react';
import { ArrowLeftRight, Ellipsis, House, Target } from 'lucide-react';
import type { ReactElement } from 'react';

const PAGES = ['Accounts', 'Documents', 'Insights', 'Ask', 'Settings'];

export default function BottomTabBarMore(): ReactElement {
  return (
    <div className="stage-phone">
      <div style={{ padding: 'var(--spacing-inset)', overflowWrap: 'anywhere' }}>
        <p style={{ margin: 0 }}>More opens a sheet of the pages that have no tab.</p>
      </div>
      <BottomTabBar aria-label="Main, with More">
        <BottomTabBarItem href="#home" icon={<House />} isCurrent>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />}>
          Transactions
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Target />}>
          Goals
        </BottomTabBarItem>
        <SheetTrigger>
          <BottomTabBarItem icon={<Ellipsis />}>More</BottomTabBarItem>
          <Sheet title="More" isTitleHidden>
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
      </BottomTabBar>
    </div>
  );
}
