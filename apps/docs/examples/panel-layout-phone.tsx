'use client';

import {
  PageHeader,
  PanelLayout,
  PanelNav,
  PanelNavItem,
  PanelSection,
  RouterProvider,
  Switch,
} from '@snapshot-ui/react';
import { useSyncExternalStore, type ReactElement } from 'react';
import { SETTINGS_SECTIONS, sectionOf } from './panel-layout-data';

/** Listens for the page's hash, which a link, Back and the browser's Back and Forward change. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

const readHash = (): string => window.location.hash;

/** The server sees no hash, so it draws the index; a hash on load opens its section once the page hydrates. */
const serverHash = (): string => '';

export default function PanelLayoutPhone(): ReactElement {
  // The example's address is the page's hash, so it moves apart from the basic example's ?section= and a reload,
  // a shared link and the browser's Back land on the same view. An app reads its route the same way.
  const hash = useSyncExternalStore(subscribe, readHash, serverHash);
  const open = sectionOf(hash.startsWith('#settings-') ? hash.slice('#settings-'.length) : null);
  const view = open === undefined ? 'index' : 'section';
  const shown = open ?? SETTINGS_SECTIONS[0];
  return (
    // A phone's width: under 48rem of its own box the layout draws the list at the index, and Back and the section
    // at a section. The frame gives it that width; the layout's own is 0.
    <div style={{ width: 'min(375px, 100%)', display: 'grid', gap: 'var(--spacing-part)' }}>
      {/* The shell's header holds the page's title on both views; here it is a second-level heading, since the
          docs page has its own h1. */}
      <PageHeader title="Settings" headingLevel={2} />
      <RouterProvider
        navigate={(href) => {
          window.location.hash = href;
        }}
      >
        <PanelLayout
          view={view}
          sectionKey={open?.key}
          backHref="#settings"
          backLabel="Settings"
          nav={
            <PanelNav aria-label="Settings sections on a phone">
              {SETTINGS_SECTIONS.map((section) => (
                <PanelNavItem
                  key={section.key}
                  href={`#settings-${section.key}`}
                  isCurrent={section.key === open?.key}
                  isDefault={view === 'index' && section === SETTINGS_SECTIONS[0]}
                  description={section.description}
                  end={section.end}
                >
                  {section.name}
                </PanelNavItem>
              ))}
            </PanelNav>
          }
        >
          {shown === undefined ? null : (
            <PanelSection title={shown.name} description={shown.description} headingLevel={3}>
              <Switch defaultSelected={shown.end !== 'Off'}>Turn on {shown.name.toLowerCase()}</Switch>
            </PanelSection>
          )}
        </PanelLayout>
      </RouterProvider>
    </div>
  );
}
