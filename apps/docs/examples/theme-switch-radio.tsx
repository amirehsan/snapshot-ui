'use client';

import { ThemeSwitch, type ThemeChoice } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/** The radio look, a row per choice, for a page with room. */
export default function ThemeSwitchRadio(): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('dark');
  return (
    <div style={{ width: 'min(20rem, 100%)' }}>
      <ThemeSwitch look="radio" label="Theme" value={theme} onChange={setTheme} />
    </div>
  );
}
