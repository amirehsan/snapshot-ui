/*
 * The consumer's settings page for the server suites: eight sections in a PanelLayout, at the index or at a
 * section. Test code only: the build starts from src/index.ts and never reaches this folder.
 */

import type { ReactElement } from 'react';
import { PanelLayout, PanelNav, PanelNavItem, PanelSection, type PanelLayoutView } from '../src/panel-layout';

/** The eight sections, their descriptions and their end states, in an order nothing counts on. */
export const SETTINGS_SECTIONS: readonly (readonly [
  key: string,
  name: string,
  description: string,
  end?: string,
])[] = [
  ['coach', 'Coach', 'How the coach waits before a charge.'],
  ['notifications', 'Notifications', 'What we tell you, and where.'],
  ['bank-sync', 'Bank sync', 'Connected accounts and how often they sync.', '2 connected'],
  ['assistant', 'AI assistant', 'What the assistant may read.'],
  ['logos', 'Logos', 'Bank logos beside your transactions.', 'Off'],
  ['appearance', 'Appearance', 'The theme and the density.'],
  ['data', 'Data', 'Export or import your data.'],
  ['danger', 'Danger zone', 'Delete your account.'],
];

/** The settings page at its index, Coach beside the list, or at the section `sectionKey`. */
export function settingsPage(view: PanelLayoutView, sectionKey?: string): ReactElement {
  const open = SETTINGS_SECTIONS.find(([key]) => key === (sectionKey ?? 'coach')) ?? SETTINGS_SECTIONS[0];
  return (
    <PanelLayout
      view={view}
      sectionKey={sectionKey}
      backHref="/settings"
      backLabel="Settings"
      nav={
        <PanelNav aria-label="Settings sections">
          {SETTINGS_SECTIONS.map(([key, name, description, end]) => (
            <PanelNavItem
              key={key}
              href={`/settings/${key}`}
              isCurrent={view === 'section' && key === sectionKey}
              isDefault={view === 'index' && key === 'coach'}
              description={description}
              end={end}
            >
              {name}
            </PanelNavItem>
          ))}
        </PanelNav>
      }
    >
      <PanelSection title={open?.[1]} description={open?.[2]}>
        <p>The {open?.[1]} settings.</p>
      </PanelSection>
    </PanelLayout>
  );
}
