import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineDocs } from 'fumadocs-mdx/macro';

const docs = defineDocs({
  dir: 'content/docs',
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

/** Content loading, the page tree, and table of contents data. Fumadocs runs headless: every visible part is ours. */
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  // Turns `icon: BookOpen` in a page's frontmatter into the rail's icon.
  plugins: [lucideIconsPlugin()],
});
