import { Card, Prose } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { COACHING_NOTE } from './prose-fixtures';
import { ModelMarkdown } from './prose-markdown';

/**
 * A weekly note in a Card: the card's padding is the article's inset, an h2 starts it, and the code block at its
 * foot takes the card's concentric corner.
 */
export default function ProseCard(): ReactElement {
  return (
    <Card style={{ maxWidth: 560, marginInline: 'auto', width: '100%' }}>
      <Prose>
        <ModelMarkdown>{COACHING_NOTE}</ModelMarkdown>
      </Prose>
    </Card>
  );
}
