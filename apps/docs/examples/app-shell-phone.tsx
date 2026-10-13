import { AppShell, BottomTabBar, BottomTabBarItem } from '@snapshot-ui/react';
import { ArrowLeftRight, Ellipsis, House, Target } from 'lucide-react';
import type { ReactElement } from 'react';
import { ShellHeader } from './shell-nav';

export default function AppShellPhone(): ReactElement {
  return (
    <div className="stage-phone">
      {/* A phone has no rail here, so the header draws no menu button. */}
      <AppShell
        header={<ShellHeader hasTrigger={false} />}
        bottomBar={
          <BottomTabBar aria-label="Main, phone">
            <BottomTabBarItem href="#home" icon={<House />} isCurrent>
              Home
            </BottomTabBarItem>
            <BottomTabBarItem
              href="#transactions"
              icon={<ArrowLeftRight />}
              count={12}
              countLabel="to review"
            >
              Transactions
            </BottomTabBarItem>
            <BottomTabBarItem href="#goals" icon={<Target />}>
              Goals
            </BottomTabBarItem>
            <BottomTabBarItem icon={<Ellipsis />}>More</BottomTabBarItem>
          </BottomTabBar>
        }
      >
        <div style={{ padding: '0 var(--spacing-inset) var(--spacing-inset)', overflowWrap: 'anywhere' }}>
          <p style={{ margin: '0 0 16px' }}>Spending is on track this month.</p>
          <p style={{ margin: '0 0 16px' }}>Twelve transactions are waiting for a category.</p>
          <p style={{ margin: 0 }}>
            The page keeps the bar&apos;s height clear under its end, so nothing ends under it.
          </p>
        </div>
      </AppShell>
    </div>
  );
}
