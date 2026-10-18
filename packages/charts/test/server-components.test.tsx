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
  const exports = Object.fromEntries(
    Object.entries(server.default).map(([name, value]) => [
      name,
      name.startsWith('use') ? client[name] : value,
    ]),
  );
  return { ...exports, default: exports };
});

import * as react from 'react';
import { Sparkline } from '../src/sparkline';

describe('the charts in a server component', () => {
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
});

/** The charts that render with no client JavaScript, and what their markup holds and leaves out. */
const STATIC: [name: string, element: ReactElement, contains: string[], excludes: string[]][] = [
  [
    'Sparkline',
    <Sparkline data={[10, 20, 15]} hasArea aria-label="Spending, last 3 days" />,
    [
      'class="sparkline"',
      'role="img"',
      'aria-label="Spending, last 3 days"',
      'viewBox="0 0 100 100"',
      'preserveAspectRatio="none"',
      'class="sparkline-area"',
      'd="M0 100L50 0L100 50"',
      'class="sparkline-end"',
      'inset-inline-start:100%;top:50%',
    ],
    ['data-rac'],
  ],
  [
    'Sparkline, decorative',
    <Sparkline data={[10, 20, 15]} />,
    ['class="sparkline"', 'aria-hidden="true"', 'class="sparkline-line"'],
    ['role="img"', 'aria-label', 'sparkline-area'],
  ],
];

describe('the static charts in a server component', () => {
  it.each(STATIC)('%s renders under the server build', (_name, element, contains, excludes) => {
    const html = renderToStaticMarkup(element);
    for (const text of contains) expect(html).toContain(text);
    for (const text of excludes) expect(html).not.toContain(text);
  });
});

/**
 * The source file of every static chart, relative to `src`, and of each part the charts share that holds no
 * state and so carries no directive.
 */
const STATIC_MODULES = [
  'sparkline/Sparkline.tsx',
  'foundations/ChartLegend.tsx',
  'foundations/ChartTable.tsx',
];

describe.each(STATIC_MODULES)('the source of %s', (file) => {
  // Rendering above proves the chart runs without client APIs today; this proves it stays a server
  // module, since a `'use client'` line would turn it, and everything it imports, into a client one.
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');

  it('carries no client directive', () => {
    expect(source).not.toMatch(/^\s*['"]use client['"]/m);
  });

  it('imports no React Aria, which would pull a client module into a server tree', () => {
    expect(source).not.toContain('react-aria-components');
  });
});

describe('every chart source', () => {
  // A static chart that is not listed above is never checked to stay one, so every source is either a
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
    expect(sources.length).toBeGreaterThanOrEqual(STATIC_MODULES.length);
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
