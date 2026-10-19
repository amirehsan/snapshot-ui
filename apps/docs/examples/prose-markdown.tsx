import { Prose, ProseScroll } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * The map for Markdown a model writes. A link becomes its text and an image its alt text, so the reader is never
 * sent to an address or shown a picture from one; a table scrolls in a named region; a code block takes focus,
 * so it scrolls by keys in every engine.
 */
export const modelOutput = (tableLabel: string): Components => ({
  a: ({ children }) => <span className="prose-unlinked">{children}</span>,
  img: ({ alt }) => <span className="prose-image">{alt}</span>,
  table: ({ children }) => (
    <ProseScroll aria-label={tableLabel}>
      <table>{children}</table>
    </ProseScroll>
  ),
  pre: ({ children }) => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard
    <pre tabIndex={0}>{children}</pre>
  ),
});

/** The map for your own content, such as a help article: its links stay links. */
export const ownContent = (tableLabel: string): Components => ({
  table: ({ children }) => (
    <ProseScroll aria-label={tableLabel}>
      <table>{children}</table>
    </ProseScroll>
  ),
  pre: ({ children }) => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard
    <pre tabIndex={0}>{children}</pre>
  ),
});

/** Model output, rendered on the server: GitHub's tables, and no HTML at all. */
export function ModelMarkdown({
  children,
  tableLabel,
}: {
  children: string;
  tableLabel: string;
}): ReactElement {
  return (
    <Markdown remarkPlugins={[remarkGfm]} skipHtml components={modelOutput(tableLabel)}>
      {children}
    </Markdown>
  );
}

/** Your own Markdown, rendered on the server, with its links. */
export function OwnMarkdown({
  children,
  tableLabel,
}: {
  children: string;
  tableLabel: string;
}): ReactElement {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={ownContent(tableLabel)}>
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
      <ModelMarkdown tableLabel="Model output, table">{SNIPPET}</ModelMarkdown>
    </Prose>
  );
}
