import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** The pages of the docs' Components section, in the rail's order, with the title each page gives itself. */
const pages = JSON.parse(read('apps/docs/content/docs/components/meta.json')).pages.map((slug) => ({
  slug,
  title: /^title: (.+)$/m.exec(read(`apps/docs/content/docs/components/${slug}.mdx`))?.[1],
}));

for (const readme of ['packages/core/README.md', 'packages/react/README.md']) {
  test(`${readme} links every component page, in the rail's order`, () => {
    const listed = [
      ...read(readme).matchAll(/^- \[([^\]]+)\]\(https:\/\/snapshotui\.com\/docs\/components\/([\w-]+)\)$/gm),
    ].map((match) => ({ slug: match[2], title: match[1] }));
    assert.ok(pages.length >= 15, 'the docs list the components');
    assert.deepEqual(listed, pages);
  });
}
