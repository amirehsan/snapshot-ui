'use client';

/*
 * The rail and the header the shell's stories share. It is story code only and never ships: the build starts
 * from src/index.ts, which never imports this folder, tsconfig.build.json leaves it out, and the 'use client'
 * guard skips it. It carries the directive anyway, because it uses a hook and the server components test scans
 * every .tsx under src that is not a test or a story.
 */
import {
  ArrowLeftRight,
  ChartColumn,
  CircleUser,
  House,
  PiggyBank,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import {
  Sidebar,
  SidebarBrand,
  SidebarGroup,
  SidebarItem,
  SidebarSearch,
  SidebarTrigger,
  useSidebar,
  type SidebarProps,
} from '../sidebar';
import { Heading } from '../typography';

/** A stand-in mark, a 24px square in the text color with a canvas cross. */
export function DemoMark(): ReactElement {
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

/** The signed-in person: an avatar and a name, the avatar alone while the rail is collapsed. */
export function DemoAccount(): ReactElement {
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

/** The three groups the stories draw: Overview, current, holding Home, current, Transactions with 12 to review and Goals. */
export const DEMO_GROUPS: ReactNode = (
  <>
    <SidebarGroup label="Overview" isCurrent>
      <SidebarItem href="#home" icon={<House />} isCurrent>
        Home
      </SidebarItem>
      <SidebarItem href="#transactions" icon={<ArrowLeftRight />} count={12} countLabel="to review">
        Transactions
      </SidebarItem>
      <SidebarItem href="#goals" icon={<Target />}>
        Goals
      </SidebarItem>
    </SidebarGroup>
    <SidebarGroup label="Insights">
      <SidebarItem href="#reports" icon={<ChartColumn />}>
        Reports
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
  </>
);

export type DemoNavProps = Omit<Partial<SidebarProps>, 'aria-label' | 'aria-labelledby'> & {
  /** The nav's name. @default 'Main' */
  label?: string;
};

/** The whole rail: the brand, the search, the groups (DEMO_GROUPS unless given others) and the account row. */
export function DemoNav({ label = 'Main', children = DEMO_GROUPS, ...props }: DemoNavProps): ReactElement {
  return (
    <Sidebar
      aria-label={label}
      brand={
        <SidebarBrand href="#home" mark={<DemoMark />}>
          Snapshot
        </SidebarBrand>
      }
      search={<SidebarSearch shortcut="Mod K">Search or jump to</SidebarSearch>}
      footer={<DemoAccount />}
      {...props}
    >
      {children}
    </Sidebar>
  );
}

/** The page header: the menu button, which shows below 1024px, and the page's title. */
export function DemoHeader({ title = 'Home' }: { title?: string }): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 72,
        padding: '16px var(--spacing-inset)',
        boxSizing: 'border-box',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      <SidebarTrigger />
      <Heading level={1} size={3}>
        {title}
      </Heading>
    </div>
  );
}
