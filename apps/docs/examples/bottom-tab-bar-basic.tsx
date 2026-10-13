import { BottomTabBar, BottomTabBarItem } from '@snapshot-ui/react';
import { ArrowLeftRight, Ellipsis, House, Target } from 'lucide-react';
import type { ReactElement } from 'react';

export default function BottomTabBarBasic(): ReactElement {
  return (
    <div className="stage-phone">
      <div style={{ padding: 'var(--spacing-inset)', overflowWrap: 'anywhere' }}>
        <p style={{ margin: '0 0 16px' }}>Spending is on track this month.</p>
        <p style={{ margin: 0 }}>Twelve transactions are waiting for a category.</p>
      </div>
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<House />} isCurrent>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />} count={12} countLabel="to review">
          Transactions
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Target />}>
          Goals
        </BottomTabBarItem>
        <BottomTabBarItem icon={<Ellipsis />}>More</BottomTabBarItem>
      </BottomTabBar>
    </div>
  );
}
