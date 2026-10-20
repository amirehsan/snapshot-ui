'use client';

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Text,
  ThemeSwitch,
  type ThemeChoice,
} from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/**
 * Appearance in a card of its own, outside every form: a choice applies at once. In an app, `onChange` sets
 * `data-theme` on `<html>` and writes the cookie; here the choice themes the preview under the switch, so the
 * docs page keeps its own theme.
 */
export default function ThemeSwitchBasic(): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  return (
    <div style={{ width: 'min(32rem, 100%)', display: 'grid', gap: 'var(--spacing-peer)' }}>
      <Card>
        <CardHeader>
          <CardTitle level={3}>Appearance</CardTitle>
        </CardHeader>
        <CardBody>
          <ThemeSwitch label="Theme" value={theme} onChange={setTheme} />
          <Text>Applied at once, on this device.</Text>
        </CardBody>
      </Card>
      {/* System is no attribute: the preview follows the reader's system, as the page would. */}
      <div data-theme={theme === 'system' ? undefined : theme}>
        <Card>
          <CardBody>
            <Text>A card in the theme you chose.</Text>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
