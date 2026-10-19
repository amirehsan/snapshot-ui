// @vitest-environment node
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// The consumer's path (spec 8.10): model output rendered by react-markdown in a server component, with
// skipHtml, its links and images turned into spans, its tables in a ProseScroll and its code blocks focusable.
// React is the react-server build, as in test/server-components.test.tsx, so a hook or a context anywhere in
// Prose, ProseScroll or the renderer throws here as it would in a Next.js server tree.
vi.mock('react', async () => {
  const require = createRequire(import.meta.url);
  const entry = join(dirname(require.resolve('react/package.json')), 'react.react-server.js');
  const server = (await import(/* @vite-ignore */ pathToFileURL(entry).href)) as {
    default: Record<string, unknown>;
  };
  const client = require('react') as Record<string, unknown>;
  const SHARED = new Set(['useId', 'useCallback', 'useMemo', 'useDebugValue']);
  const exports = Object.fromEntries(
    Object.entries(server.default).map(([name, value]) => [name, SHARED.has(name) ? client[name] : value]),
  );
  return { ...exports, default: exports };
});

import * as react from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MONTHLY_REPORT } from './fixtures';
import { Prose, ProseScroll } from './Prose';

/** The map the docs' recipe gives react-markdown for model output, inlined as an app writes it. */
const components: Components = {
  // A link within the page, such as a footnote's, stays a link; any other becomes its text.
  a: ({ children, ...link }) => {
    // react-markdown's tree node is not an attribute of the link.
    delete link.node;
    return link.href?.startsWith('#') ? (
      <a {...link}>{children}</a>
    ) : (
      <span className="prose-unlinked">{children}</span>
    );
  },
  img: ({ alt }) => <span className="prose-image">{alt}</span>,
  table: ({ children }) => (
    <ProseScroll aria-label="October by category, table">
      <table>{children}</table>
    </ProseScroll>
  ),
  pre: ({ children }) => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard
    <pre tabIndex={0}>{children}</pre>
  ),
};

/** The monthly report as the consumer's server component renders it. */
const html = (): string =>
  renderToStaticMarkup(
    <Prose as="article">
      <Markdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {MONTHLY_REPORT}
      </Markdown>
    </Prose>,
  );

describe('model output through react-markdown', () => {
  it('renders against a React that has no client APIs', () => {
    // Guards the setup: if the mock stopped applying, the render below would prove nothing.
    expect(Object.keys(react)).not.toContain('useState');
    expect(Object.keys(react)).not.toContain('useEffect');
  });

  it('writes no link that leaves the page, and no image', () => {
    const output = html();
    // The only links are the footnote's, to its note and back, within the page.
    const hrefs = [...output.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
    expect(hrefs).toEqual(['#user-content-fn-refunds', '#user-content-fnref-refunds']);
    expect(output).not.toMatch(/<img[\s>]/);
    expect(output).not.toContain('src=');
    expect(output).not.toContain('example.com/charts');
  });

  it('writes GFM footnotes: a mark that links to its note, the note, and a label for screen readers alone', () => {
    const output = html();
    expect(output).toMatch(
      /<sup><a href="#user-content-fn-refunds" id="user-content-fnref-refunds" data-footnote-ref="true"/,
    );
    expect(output).toContain(
      '<section data-footnotes="true" class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>',
    );
    expect(output).toContain('Refunds are counted in the month they arrive.');
    expect(output).toMatch(/<a href="#user-content-fnref-refunds" data-footnote-backref=""/);
  });

  it('writes none of the HTML the model sent, inline or as a block', () => {
    const output = html();
    expect(output).not.toContain('<b>');
    expect(output).not.toContain('<div onclick');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('never reaches the page');
    // The words between inline tags are Markdown text, so they stay, as plain text.
    expect(output).toContain('this bold');
  });

  it('turns the link and the bare address into two plain spans holding their text', () => {
    const output = html();
    const spans = [...output.matchAll(/<span class="prose-unlinked">([^<]*)<\/span>/g)].map(
      (match) => match[1],
    );
    expect(spans).toEqual([
      'your transactions',
      'https://example.com/reports/2026/october/spending-by-category?view=table&amp;compare=september',
    ]);
  });

  it('turns each image into a span of its alt text, empty where it has none', () => {
    const output = html();
    const spans = [...output.matchAll(/<span class="prose-image">([^<]*)<\/span>/g)].map((match) => match[1]);
    expect(spans).toEqual(['Spending by category in October, rent first', '']);
  });

  it('puts the six-column table in a named region that takes focus', () => {
    const output = html();
    expect(output).toContain(
      '<div aria-label="October by category, table" role="region" tabindex="0" class="prose-scroll"><table>',
    );
    expect(output.match(/<th[\s>]/g)).toHaveLength(6);
    expect(output).toContain('</table></div>');
  });

  it('writes an article with the prose class and its headings, lists, quote and code', () => {
    const output = html();
    expect(output.startsWith('<article class="prose"><h2>October at a glance</h2>')).toBe(true);
    for (const part of ['<h3>Where it went</h3>', '<ol>', '<ul>', '<blockquote>', '<strong>', '<em>']) {
      expect(output).toContain(part);
    }
    expect(output).toContain('<code>Budgets</code>');
  });
});
