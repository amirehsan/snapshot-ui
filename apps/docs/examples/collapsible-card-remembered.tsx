import { CollapsibleCard } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CollapsibleCardRemembered(): ReactElement {
  return (
    <CollapsibleCard
      title="Shortcuts"
      level={3}
      note="Fold it and reload the page: it stays folded."
      storageKey="docs-collapsible-card-shortcuts"
      style={{ width: '100%', maxWidth: 480 }}
    >
      <p>Enter or Space on the title folds the card or opens it.</p>
      <p>Tab moves on from the title, and a folded body takes no focus.</p>
    </CollapsibleCard>
  );
}
