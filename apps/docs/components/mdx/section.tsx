import type { ReactElement, ReactNode } from 'react';

/**
 * A stadium card. Its first heading is the card's title and the paragraph
 * right after it is the note above the rule, as in the mockup.
 */
export function Section({ children }: { children: ReactNode }): ReactElement {
  return <section className="card docs-section">{children}</section>;
}
