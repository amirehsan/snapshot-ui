'use client';

import {
  PanelLayout,
  PanelNav,
  PanelNavItem,
  PanelSection,
  RouterProvider,
  Switch,
} from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type ReactElement } from 'react';
import { SETTINGS_SECTIONS, sectionOf } from './panel-layout-data';

/** The page at `?section=`, or at the index with none: the URL is the state, and the layout holds none. */
function Settings({ sectionKey }: { sectionKey: string | null }): ReactElement {
  const pathname = usePathname();
  const open = sectionOf(sectionKey);
  const view = open === undefined ? 'index' : 'section';
  // At the index the split face shows the first section beside the list, marked isDefault.
  const shown = open ?? SETTINGS_SECTIONS[0];
  return (
    <PanelLayout
      view={view}
      sectionKey={open?.key}
      backHref={pathname}
      backLabel="Settings"
      nav={
        <PanelNav aria-label="Settings sections">
          {SETTINGS_SECTIONS.map((section) => (
            <PanelNavItem
              key={section.key}
              href={`${pathname}?section=${section.key}`}
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
        <PanelSection title={shown.name} description={shown.description}>
          <Switch defaultSelected={shown.end !== 'Off'}>Turn on {shown.name.toLowerCase()}</Switch>
        </PanelSection>
      )}
    </PanelLayout>
  );
}

function SettingsFromUrl(): ReactElement {
  return <Settings sectionKey={useSearchParams().get('section')} />;
}

export default function PanelLayoutBasic(): ReactElement {
  const router = useRouter();
  // An app wraps its whole tree once; the example wraps only itself. The layout's width is 0 until a holder gives
  // it one: this one fills the stage.
  return (
    <div style={{ width: '100%' }}>
      <RouterProvider
        navigate={(href) => {
          router.push(href, { scroll: false });
        }}
      >
        {/* The page is static, so the server renders the fallback: the index, Coach beside the list. */}
        <Suspense fallback={<Settings sectionKey={null} />}>
          <SettingsFromUrl />
        </Suspense>
      </RouterProvider>
    </div>
  );
}
