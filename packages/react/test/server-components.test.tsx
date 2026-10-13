// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// React as a server component sees it: the react-server build, which has no state, no effects, no refs
// and no context. A component that calls one of those throws here, as it does in a Next.js server tree.
// react-dom/server is outside this module graph, so it renders the elements with the ordinary React.
// The few hooks the server build exports (useId among them) read the dispatcher of the React that renders, so
// each is taken from the ordinary React, the one react-dom/server sets: the names stay the server build's.
vi.mock('react', async () => {
  const require = createRequire(import.meta.url);
  const entry = join(dirname(require.resolve('react/package.json')), 'react.react-server.js');
  const server = (await import(/* @vite-ignore */ pathToFileURL(entry).href)) as {
    default: Record<string, unknown>;
  };
  const client = require('react') as Record<string, unknown>;
  // Only the hooks a static module may call under React's server build come from ordinary React, which
  // drives the render here. `use` stays the server build's, since ordinary React's would also accept a context.
  const SHARED = new Set(['useId', 'useCallback', 'useMemo', 'useDebugValue']);
  const exports = Object.fromEntries(
    Object.entries(server.default).map(([name, value]) => [name, SHARED.has(name) ? client[name] : value]),
  );
  return { ...exports, default: exports };
});

// A server bundler replaces a client module with a reference, and React Aria cannot be imported under React's
// server build, so the linked tile's client module is a stand-in here.
vi.mock('../src/stat-tile/StatTileLink', () => ({ StatTileLink: () => null }));

import * as react from 'react';
import { Badge } from '../src/badge';
import { Card, CardBody, CardHeader, CardNote, CardTitle } from '../src/card';
import { FieldChanged, FieldCounter } from '../src/field';
import { Kbd } from '../src/kbd';
import { Meter } from '../src/meter';
import { StatTile } from '../src/stat-tile';
import { Eyebrow, Heading, Text } from '../src/typography';

/** The static components: the ones that carry no `'use client'`, so a server component may use them directly. */
const STATIC: [name: string, element: ReactElement, markup: string][] = [
  [
    'Heading',
    <Heading level={1} size={3}>
      Settings
    </Heading>,
    '<h1 class="heading heading-3">Settings</h1>',
  ],
  [
    'Text',
    <Text as="span" size="small" tone="muted">
      Saved a minute ago.
    </Text>,
    '<span class="copy copy-small copy-muted">Saved a minute ago.</span>',
  ],
  [
    'Text numeral',
    <Text as="span" size="numeral">
      $12,345.67
    </Text>,
    '<span class="copy copy-numeral">$12,345.67</span>',
  ],
  ['Eyebrow', <Eyebrow>Workspace</Eyebrow>, '<p class="eyebrow">Workspace</p>'],
  ['Kbd', <Kbd>Esc</Kbd>, '<kbd class="kbd">Esc</kbd>'],
  ['Badge', <Badge tone="info">Beta</Badge>, '<span class="badge badge-info">Beta</span>'],
  [
    'Card and its parts',
    <Card as="section" aria-label="Danger zone">
      <CardHeader>
        <CardTitle level={3}>Delete the workspace</CardTitle>
        <CardNote>This cannot be undone.</CardNote>
      </CardHeader>
      <CardBody>Everything goes.</CardBody>
    </Card>,
    '<section aria-label="Danger zone" class="card"><div class="card-header"><h3 class="card-title">Delete the workspace</h3>' +
      '<p class="card-note">This cannot be undone.</p></div><div class="card-body">Everything goes.</div></section>',
  ],
  [
    'FieldCounter',
    <FieldCounter count={9} budget={12} />,
    '<span role="status" class="field-counter">9 of about 12</span>',
  ],
  ['FieldChanged', <FieldChanged />, '<span class="field-changed">Changed</span>'],
];

describe('the static components in a server component', () => {
  it('are rendered against a React that has no client APIs', () => {
    // Guards the setup: if the mock stopped applying, every test below would pass for the wrong reason.
    const names = Object.keys(react);
    for (const client of [
      'useState',
      'useReducer',
      'useEffect',
      'useLayoutEffect',
      'useRef',
      'useContext',
      'createContext',
      'Component',
    ]) {
      expect(names).not.toContain(client);
    }
    expect(names).toContain('createElement');
  });

  it.each(STATIC)('%s renders to plain markup', (_name, element, markup) => {
    expect(renderToStaticMarkup(element)).toBe(markup);
  });

  it('passes a class and attributes through, so a server page can shape them', () => {
    const html = renderToStaticMarkup(
      <Heading level={2} className="page-title" id="top" data-testid="title">
        Title
      </Heading>,
    );
    expect(html).toBe('<h2 id="top" data-testid="title" class="heading heading-2 page-title">Title</h2>');
  });
});

/** The parts the home batch adds that render with no client JavaScript, and what their markup holds and leaves out. */
const HOME: [name: string, element: ReactElement, contains: string[], excludes: string[]][] = [
  [
    'StatTile',
    <StatTile
      label="Spending"
      value="$1,284.50"
      change={{ direction: 'up', label: 'Up 12% from last month' }}
      caption="Across all accounts"
    />,
    [
      '<div class="stat-tile">',
      '<div class="stat-tile-body">',
      '<p class="stat-tile-label">Spending</p>',
      'class="copy copy-numeral-sm stat-tile-value"',
      'data-direction="up"',
      'data-tone="neutral"',
      'aria-hidden="true"',
      'Across all accounts',
    ],
    ['data-rac', '<a'],
  ],
  [
    'Meter',
    <Meter
      label="Groceries"
      max={1200}
      valueLabel="$1,020 of $1,200"
      pace={{ value: 900, label: "Where you'd be today: $900" }}
      segments={[
        { value: 820, look: 'fill', label: 'Spent', valueLabel: '$820.00' },
        { value: 200, look: 'hatched', label: 'Held', valueLabel: '$200.00' },
      ]}
    />,
    [
      'class="meter"',
      'role="meter"',
      'aria-valuemin="0"',
      'aria-valuemax="1200"',
      'aria-valuenow="1020"',
      'aria-valuetext="$1,020 of $1,200"',
      'data-look="hatched"',
      'inline-size:68.333%',
      'inset-inline-start:75%',
      'hidden=""',
    ],
    ['data-over', 'meter-legend'],
  ],
];

describe('the home parts in a server component', () => {
  it.each(HOME)('%s renders under the server build', (_name, element, contains, excludes) => {
    const html = renderToStaticMarkup(element);
    for (const text of contains) expect(html).toContain(text);
    for (const text of excludes) expect(html).not.toContain(text);
  });
});

/** The source file of every static component, relative to `src`. */
const STATIC_MODULES = [
  'typography/Heading.tsx',
  'typography/Text.tsx',
  'typography/Eyebrow.tsx',
  'kbd/Kbd.tsx',
  'badge/Badge.tsx',
  'card/Card.tsx',
  'field/FieldCounter.tsx',
  'field/FieldChanged.tsx',
  'stat-tile/StatTile.tsx',
  'meter/Meter.tsx',
];

describe.each(STATIC_MODULES)('the source of %s', (file) => {
  // Rendering above proves the component runs without client APIs today; this proves it stays a server
  // module, since a `'use client'` line would turn it, and everything it imports, into a client one.
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');

  it('carries no client directive', () => {
    expect(source).not.toMatch(/^\s*['"]use client['"]/m);
  });

  it('imports no React Aria, which would pull a client module into a server tree', () => {
    expect(source).not.toContain('react-aria-components');
  });
});

describe('every component source', () => {
  // A static component that is not listed above is never checked to stay one, so every source is either a
  // client module, which says so on its first line, or listed. Tests and stories never ship.
  const src = new URL('../src/', import.meta.url);
  const sources = readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((folder) =>
      readdirSync(new URL(`${folder.name}/`, src))
        .filter((file) => file.endsWith('.tsx') && !/\.(?:test|stories)\.tsx$/.test(file))
        .map((file) => `${folder.name}/${file}`),
    );

  it('finds the sources, so a moved folder cannot pass as one with nothing in it', () => {
    expect(sources.length).toBeGreaterThan(STATIC_MODULES.length);
    for (const file of STATIC_MODULES) expect(sources).toContain(file);
  });

  it('is a client module or a listed static one', () => {
    const unlisted = sources.filter(
      (file) =>
        !readFileSync(new URL(file, src), 'utf8').startsWith("'use client';") &&
        !STATIC_MODULES.includes(file),
    );
    expect(unlisted).toEqual([]);
  });
});
