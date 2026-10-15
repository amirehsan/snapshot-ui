import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from '@snapshot-ui/react';
import { SearchX } from 'lucide-react';
import type { ReactElement } from 'react';

export default function EmptyStateInCard(): ReactElement {
  return (
    <Card
      as="section"
      aria-labelledby="empty-state-in-card-title"
      style={{ maxWidth: 480, marginInline: 'auto' }}
    >
      <CardHeader>
        <CardTitle id="empty-state-in-card-title" level={3}>
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardBody>
        <EmptyState
          headingLevel={4}
          icon={<SearchX />}
          title="No matches"
          description="Try fewer filters."
          action={<Button variant="tertiary">Clear filters</Button>}
        />
      </CardBody>
    </Card>
  );
}
