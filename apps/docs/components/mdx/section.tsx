import { Card } from '@snapshot-ui/react';
import type { ReactElement, ReactNode } from 'react';

/**
 * A stadium card. Its first heading is the card's title and the paragraph
 * right after it is the note above the rule, as in the mockup.
 */
export function Section({ children }: { children: ReactNode }): ReactElement {
  return (
    <Card as="section" className="docs-section">
      {children}
    </Card>
  );
}
