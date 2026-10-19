import { Prose } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { REPORT } from './prose-fixtures';
import { OwnMarkdown } from './prose-markdown';

/** A server component: a report you write, rendered from Markdown into Prose, with no client JavaScript. */
export default function ProseReport(): ReactElement {
  return (
    <Prose as="article" style={{ width: '100%' }}>
      <OwnMarkdown>{REPORT}</OwnMarkdown>
    </Prose>
  );
}
