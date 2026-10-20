import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Prose } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { ModelMarkdown } from './prose-markdown';

/**
 * The Insights page's server part: the month's report, which a model wrote in Markdown, rendered by a server
 * component with no client JavaScript. `skipHtml` drops the HTML it wrote, its link becomes text and its image
 * its alt text, and its table scrolls inside a named region on a phone.
 */
export default async function InsightsReport(): Promise<ReactElement> {
  // Your server's query for the month's report goes here. The docs make no request, so it is a file.
  const report = await readFile(path.join(process.cwd(), 'examples', 'insights-report.md'), 'utf8');
  return (
    <Prose as="article" style={{ width: '100%' }}>
      <ModelMarkdown>{report}</ModelMarkdown>
    </Prose>
  );
}
