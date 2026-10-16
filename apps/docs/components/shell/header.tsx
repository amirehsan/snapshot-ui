'use client';

import { Eyebrow, Heading, IconButton, SegmentedControl, SegmentedControlItem } from '@snapshot-ui/react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, type ReactElement } from 'react';
import { useMounted, useShape } from '@/lib/document-state';
import { writeShape } from '@/lib/prepaint';
import { useShell } from './context';

/**
 * One of the header's switches: a compact segmented control. Its value is not
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

const THEMES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
] as const;

const SHAPES = [
  ['rounded', 'Rounded'],
  ['soft', 'Soft'],
  ['square', 'Square'],
] as const;

export function DocsHeader({ group, title }: { group: string; title: string }): ReactElement {
  const { drawerOpen, openDrawer } = useShell();
  const { resolvedTheme, setTheme } = useTheme();
  // Both switches show values only the browser knows, so they settle after hydration.
  const mounted = useMounted();
  const shape = useShape();
  // The header sticks at the top with no fixed height, so its height is the page's sticky offset: every sticky
  // part of a page, such as a data table's header row, sticks under it, never behind it.
  const headerRef = useRef<HTMLElement>(null);
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
    <header className="header" ref={headerRef}>
      <div className="header-inner">
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
        <div className="header-titles">
          <Eyebrow>
            Docs <span className="eyebrow-sep">&#8250;</span> {group}
          </Eyebrow>
          <Heading level={1} size={2}>
            {title}
          </Heading>
        </div>
        <div className="header-controls">
          <Choice
            label="Color mode"
            name="theme"
            options={THEMES}
            value={mounted ? (resolvedTheme as 'light' | 'dark' | undefined) : undefined}
            onChange={setTheme}
          />
          <Choice
            label="Corners"
            name="shape"
            options={SHAPES}
            value={mounted ? shape : undefined}
            onChange={writeShape}
          />
        </div>
      </div>
    </header>
  );
}
