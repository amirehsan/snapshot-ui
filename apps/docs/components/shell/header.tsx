'use client';

import {
  IconButton,
  PageHeader,
  SegmentedControl,
  SegmentedControlItem,
  ThemeSwitch,
  type ThemeChoice,
} from '@snapshot-ui/react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, type ReactElement } from 'react';
import { useMounted, useShape } from '@/lib/document-state';
import { writeShape } from '@/lib/prepaint';
import { useShell } from './context';

/**
 * The corners switch: a compact segmented control. Its value is not
 * known until the browser has said which option is set, and until then it
 * shows none.
 */
function Choice<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly (readonly [T, string])[];
  value: T | undefined;
  onChange: (value: T) => void;
}): ReactElement {
  return (
    <SegmentedControl
      aria-label={label}
      name={name}
      size="sm"
      value={value ?? null}
      onChange={(next) => {
        onChange(next as T);
      }}
    >
      {options.map(([option, text]) => (
        <SegmentedControlItem key={option} value={option}>
          {text}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

const SHAPES = [
  ['rounded', 'Rounded'],
  ['soft', 'Soft'],
  ['square', 'Square'],
] as const;

/** next-themes' stored theme as a ThemeSwitch value; anything else, or nothing yet, is System. */
const themeChoice = (theme: string | undefined): ThemeChoice =>
  theme === 'light' || theme === 'dark' ? theme : 'system';

/**
 * The docs site's header: the library's PageHeader, with the trail as its eyebrow, the page's title as its one
 * `h1` and the two switches as its actions, the color mode drawn with ThemeSwitch, and under 1024px the drawer's
 * menu button over its start corner, since PageHeader has no leading slot (plan open question 3). The shell's row
 * is a `div` with the banner role and sticks; the PageHeader inside it takes `role="none"`, so the page keeps one
 * banner and no `header` element holds another (spec corrections 62 and 71).
 */
export function DocsHeader({ group, title }: { group: string; title: string }): ReactElement {
  const { drawerOpen, openDrawer } = useShell();
  const { theme, setTheme } = useTheme();
  // Both switches show values only the browser knows, so they settle after hydration.
  const mounted = useMounted();
  const shape = useShape();
  // The header sticks at the top with no fixed height, so its height is the page's sticky offset: every sticky
  // part of a page, such as a data table's header row, sticks under it, never behind it. The docs shell is not
  // AppShell, so nothing else writes it.
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (header === null || typeof ResizeObserver !== 'function') return;
    const root = document.documentElement;
    const write = (): void => {
      root.style.setProperty('--page-sticky-top', `${String(header.getBoundingClientRect().height)}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--page-sticky-top');
    };
  }, []);

  return (
    // A div with the banner role, not a header, so PageHeader's own header element is never nested in one.
    <div className="header" role="banner" ref={headerRef}>
      {/* The drawer's button, drawn under 1024px over the page header's start corner. */}
      <div className="header-lead">
        <IconButton
          className="header-menu"
          variant="outline"
          aria-label="Open the menu"
          aria-expanded={drawerOpen}
          aria-controls="rail"
          onPress={openDrawer}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </IconButton>
      </div>
      <PageHeader
        role="none"
        className="header-page"
        eyebrow={
          <>
            Docs <span className="eyebrow-sep">&#8250;</span> {group}
          </>
        }
        title={title}
        actions={
          <>
            {/* The library's own theme switch: System, Light and Dark. next-themes knows the choice only in the
                browser, so it shows none until then. */}
            <ThemeSwitch
              size="sm"
              aria-label="Color mode"
              name="theme"
              value={mounted ? themeChoice(theme) : null}
              onChange={setTheme}
            />
            <Choice
              label="Corners"
              name="shape"
              options={SHAPES}
              value={mounted ? shape : undefined}
              onChange={writeShape}
            />
          </>
        }
      />
    </div>
  );
}
