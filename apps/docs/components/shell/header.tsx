'use client';

import { IconButton } from '@snapshot-ui/react';
import { useTheme } from 'next-themes';
import type { ReactElement } from 'react';
import { useMounted, useShape } from '@/lib/document-state';
import { writeShape } from '@/lib/prepaint';
import { useShell } from './context';

/**
 * A stand-in for the segmented control phase 1b builds: real radios, so arrow
 * keys and the single choice come from the platform.
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
    <div className="segmented segmented-small" role="radiogroup" aria-label={label}>
      {options.map(([option, text]) => (
        <label key={option} className="segmented-option">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => {
              onChange(option);
            }}
          />
          {text}
        </label>
      ))}
    </div>
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

  return (
    <header className="header">
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
          <p className="eyebrow">
            Docs <span className="eyebrow-sep">&#8250;</span> {group}
          </p>
          <h1 className="type-h2">{title}</h1>
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
