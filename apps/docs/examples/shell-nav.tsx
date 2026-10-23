'use client';

import {
  Card,
  CardBody,
  Heading,
  Sidebar,
  SidebarBrand,
  SidebarGroup,
  SidebarItem,
  SidebarSearch,
  SidebarTrigger,
  useSidebar,
} from '@snapshot-ui/react';
import {
  ArrowLeftRight,
  CalendarClock,
  ChartColumn,
  CircleUser,
  House,
  PiggyBank,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

/** A stand-in mark: a square in the text color with a canvas cross. */
function Mark(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="7" fill="currentColor" />
      <path
        d="M7 12h10M12 7v10"
        style={{ stroke: 'var(--color-canvas)' }}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The signed-in person, the avatar alone while the rail is collapsed. */
function FooterRow(): ReactElement {
  const { isCollapsed } = useSidebar();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          flex: 'none',
          placeItems: 'center',
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--color-bone)',
          fontSize: 'var(--text-small)',
          fontWeight: 500,
        }}
      >
        AL
      </span>
      {isCollapsed ? null : <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>Ada Lovelace</span>}
    </div>
  );
}

export interface ShellNavProps {
  /** The nav's name: each example on a page names its own. */
  label: string;
  /** Two labels long enough to wrap. */
  isLong?: boolean;
  /** The footer's row: the signed-in person's avatar and name unless given. */
  footer?: ReactNode;
}

/** The rail the shell examples share: the brand, the search, three groups and the account row. */
export function ShellNav({ label, isLong = false, footer = <FooterRow /> }: ShellNavProps): ReactElement {
  return (
    <Sidebar
      aria-label={label}
      brand={
        <SidebarBrand href="#home" mark={<Mark />}>
          Snapshot
        </SidebarBrand>
      }
      search={<SidebarSearch shortcut="Mod K">Search or jump to</SidebarSearch>}
      footer={footer}
    >
      <SidebarGroup label="Overview" isCurrent>
        <SidebarItem href="#home" icon={<House />} isCurrent>
          Home
        </SidebarItem>
        <SidebarItem href="#transactions" icon={<ArrowLeftRight />} count={12} countLabel="to review">
          Transactions
        </SidebarItem>
        {isLong ? (
          <SidebarItem href="#scheduled" icon={<CalendarClock />}>
            Scheduled and recurring payments
          </SidebarItem>
        ) : (
          <SidebarItem href="#goals" icon={<Target />}>
            Goals
          </SidebarItem>
        )}
      </SidebarGroup>
      <SidebarGroup label="Insights">
        <SidebarItem href="#reports" icon={<ChartColumn />}>
          {isLong ? 'Reports and exported statements' : 'Reports'}
        </SidebarItem>
        <SidebarItem href="#budgets" icon={<PiggyBank />}>
          Budgets
        </SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Settings">
        <SidebarItem href="#account" icon={<CircleUser />}>
          Account
        </SidebarItem>
        <SidebarItem href="#preferences" icon={<SlidersHorizontal />}>
          Preferences
        </SidebarItem>
      </SidebarGroup>
    </Sidebar>
  );
}

/** The page header: the menu button, which shows below 1024px, and the title. */
export function ShellHeader({ hasTrigger = true }: { hasTrigger?: boolean }): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px var(--spacing-inset)',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      {hasTrigger ? <SidebarTrigger /> : null}
      <Heading level={3} size={4}>
        Home
      </Heading>
    </div>
  );
}

/** A short page. */
export function ShellPage(): ReactElement {
  return (
    <div style={{ padding: '0 var(--spacing-inset) var(--spacing-inset)' }}>
      <Card>
        <CardBody>
          <p style={{ margin: 0 }}>Spending is on track this month.</p>
        </CardBody>
      </Card>
    </div>
  );
}
