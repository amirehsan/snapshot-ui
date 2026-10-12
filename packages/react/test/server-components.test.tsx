// @vitest-environment node
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// React as a server component sees it: the react-server build, which has no state, no effects, no refs
// and no context. A component that calls one of those throws here, as it does in a Next.js server tree.
// react-dom/server is outside this module graph, so it renders the elements with the ordinary React.
vi.mock('react', async () => {
  const require = createRequire(import.meta.url);
  const entry = join(dirname(require.resolve('react/package.json')), 'react.react-server.js');
  const server = (await import(/* @vite-ignore */ pathToFileURL(entry).href)) as { default: object };
  return { ...server.default, default: server.default };
});

import * as react from 'react';
import { Badge } from '../src/badge';
import { Card, CardBody, CardHeader, CardNote, CardTitle } from '../src/card';
import { FieldChanged, FieldCounter } from '../src/field';
import { Kbd } from '../src/kbd';
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

  it('pass a class and attributes through, so a server page can shape them', () => {
    const html = renderToStaticMarkup(
      <Heading level={2} className="page-title" id="top" data-testid="title">
        Title
      </Heading>,
    );
    expect(html).toBe('<h2 id="top" data-testid="title" class="heading heading-2 page-title">Title</h2>');
  });
});
