import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import { remarkCode } from './remark-code';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    // Naming MDX options here replaces Fumadocs' defaults, so the preset is applied again, with the
    // fence plugin ahead of the others.
    mdxOptions: applyMdxPreset({ remarkPlugins: (defaults) => [remarkCode, ...defaults] }),
  },
  meta: { schema: metaSchema },
});

/** Content loading, the page tree, and table of contents data. Fumadocs runs headless: every visible part is ours. */
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  // Turns `icon: BookOpen` in a page's frontmatter into the rail's icon.
  plugins: [lucideIconsPlugin()],
});
