import { Prose, ProseScroll } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import Markdown, { type Components, type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** The words the map names a table and a code block with, and an image's alt text with, in the page's language. */
export interface MarkdownLabels {
  /** Starts a table's name, before its column headers: "Table". */
  table: string;
  /** A code block's name, before its language when it has one: "Code". */
  code: string;
  /** Read before an image's alt text, and not shown: "Image:". */
  image: string;
}

const ENGLISH: MarkdownLabels = { table: 'Table', code: 'Code', image: 'Image:' };

/** The part of the HTML tree react-markdown hands a component as `node`, as far as the map reads it. */
interface Node {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { className?: unknown };
  children?: Node[];
}

/** The text a node holds. */
const textOf = (node: Node): string =>
  node.type === 'text' ? (node.value ?? '') : (node.children ?? []).map(textOf).join('');

/** The elements among a node's children with this tag. */
const childrenNamed = (node: Node | undefined, tag: string): Node[] =>
  (node?.children ?? []).filter((child) => child.tagName === tag);

/** A table's name from its column headers, so a page with several regions tells them apart. */
function tableName(node: Node | undefined, labels: MarkdownLabels): string {
  const [head] = childrenNamed(node, 'thead');
  const [row] = childrenNamed(head, 'tr');
  const headers = childrenNamed(row, 'th').map((cell) => textOf(cell).trim());
  return headers.length > 0 ? `${labels.table}: ${headers.join(', ')}` : labels.table;
}

/** A code block's name: its language when the fence gives one, and its first line. */
function codeName(node: Node | undefined, labels: MarkdownLabels): string {
  const [code] = childrenNamed(node, 'code');
  const classes = code?.properties?.className;
  const language = Array.isArray(classes)
    ? classes.find((name): name is string => typeof name === 'string' && name.startsWith('language-'))
    : undefined;
  // Its first line tells two blocks apart, as a table's headers do.
  const first = (code ? textOf(code) : '').trim().split('\n')[0] ?? '';
  const line = first.length > 40 ? `${first.slice(0, 40)}...` : first;
  const kind = language ? `${labels.code}, ${language.slice('language-'.length)}` : labels.code;
  return line ? `${kind}: ${line}` : kind;
}

/** The parts both maps share: a table scrolls in a region named by its headers, a code block in one of its own. */
const scrolling = (labels: MarkdownLabels): Components => ({
  table: ({ node, children }) => (
    <ProseScroll aria-label={tableName(node, labels)}>
      <table>{children}</table>
    </ProseScroll>
  ),
  pre: ({ node, children }) => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard
    <pre role="region" aria-label={codeName(node, labels)} tabIndex={0}>
      {children}
    </pre>
  ),
});

/**
 * The map for Markdown a model writes. A link becomes its text and an image its alt text, so the reader is never
 * sent to an address or shown a picture from one; a link within the page, such as a footnote's, stays a link.
 */
export const modelOutput = (labels: MarkdownLabels = ENGLISH): Components => ({
  ...scrolling(labels),
  a: ({ children, ...link }) => {
    // react-markdown's tree node is not an attribute of the link.
    delete link.node;
    return link.href?.startsWith('#') ? (
      <a {...link}>{children}</a>
    ) : (
      <span className="prose-unlinked">{children}</span>
    );
  },
  img: ({ alt }) =>
    alt ? (
      <span className="prose-image">
        <span className="visually-hidden">{labels.image} </span>
        {alt}
      </span>
    ) : null,
});

/** The map for your own content, such as a help article: its links stay links. */
export const ownContent = (labels: MarkdownLabels = ENGLISH): Components => scrolling(labels);

interface MarkdownProps {
  children: string;
  labels?: MarkdownLabels;
  /** Passed to remark-rehype, such as the footnotes' label in the page's language. */
  remarkRehypeOptions?: Options['remarkRehypeOptions'];
}

/** Model output, rendered on the server: GitHub's tables and footnotes, and no HTML at all. */
export function ModelMarkdown({ children, labels, remarkRehypeOptions }: MarkdownProps): ReactElement {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      remarkRehypeOptions={remarkRehypeOptions}
      skipHtml
      components={modelOutput(labels)}
    >
      {children}
    </Markdown>
  );
}

/** Your own Markdown, rendered on the server, with its links. */
export function OwnMarkdown({ children, labels, remarkRehypeOptions }: MarkdownProps): ReactElement {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      remarkRehypeOptions={remarkRehypeOptions}
      components={ownContent(labels)}
    >
      {children}
    </Markdown>
  );
}

const SNIPPET = `Read [the full report](https://example.com/report) at https://example.com/reports/2026/october?view=all.

![Spending by category in October](https://example.com/october.png) <script>track()</script>`;

/** A server component: what a model wrote, with its link, its address and its image turned into text. */
export default function ProseMarkdown(): ReactElement {
  return (
    <Prose style={{ width: '100%' }}>
      <ModelMarkdown>{SNIPPET}</ModelMarkdown>
    </Prose>
  );
}
