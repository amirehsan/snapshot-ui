import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** The pages of one docs section, `components` or `charts`, in the rail's order, with each one's title. */
const pages = (folder) =>
  JSON.parse(read(`apps/docs/content/docs/${folder}/meta.json`)).pages.map((slug) => ({
    slug,
    title: /^title: (.+)$/m.exec(read(`apps/docs/content/docs/${folder}/${slug}.mdx`))?.[1],
  }));

const componentPages = pages('components');
const chartPages = pages('charts');

/** The links in `readme` to pages of one docs section, in the order the README lists them. */
const links = (readme, folder) =>
  [
    ...read(readme).matchAll(
      new RegExp(
        `^- \\[([^\\]]+)\\]\\(https:\\/\\/snapshotui\\.com\\/docs\\/${folder}\\/([\\w-]+)\\)$`,
        'gm',
      ),
    ),
  ].map((match) => ({ slug: match[2], title: match[1] }));

for (const readme of ['packages/core/README.md', 'packages/react/README.md']) {
  test(`${readme} links every component page, in the rail's order`, () => {
    assert.ok(componentPages.length >= 15, 'the docs list the components');
    assert.deepEqual(links(readme, 'components'), componentPages);
  });
}

for (const readme of ['packages/core/README.md', 'packages/charts/README.md']) {
  test(`${readme} links every chart page, in the rail's order`, () => {
    assert.ok(chartPages.length >= 1, 'the docs list the charts');
    assert.deepEqual(links(readme, 'charts'), chartPages);
  });
}
