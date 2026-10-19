import { Prose } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { MODEL_OUTPUT } from './prose-fixtures';
import { ModelMarkdown } from './prose-markdown';

/**
 * A server component: a report a model wrote, rendered with skipHtml and the model output map. The link reads as
 * the text around it, the bare address breaks anywhere, the image shows its alt text in a small box, the one
 * with no alt text is not drawn, and the HTML never reaches the page.
 */
export default function ProseModelOutput(): ReactElement {
  return (
    <Prose as="article" style={{ width: '100%' }}>
      <ModelMarkdown tableLabel="Spending by category, September and October, table">
        {MODEL_OUTPUT}
      </ModelMarkdown>
    </Prose>
  );
}
