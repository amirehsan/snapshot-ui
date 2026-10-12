import { Button, Card, CardBody, CardHeader, CardNote, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CardParts(): ReactElement {
  return (
    <Card as="section" aria-labelledby="card-parts-title" style={{ maxWidth: 480, marginInline: 'auto' }}>
      <CardHeader>
        <CardTitle id="card-parts-title" level={3}>
          Notifications
        </CardTitle>
        <CardNote>Where we reach you, and how often.</CardNote>
      </CardHeader>
      <CardBody>
        <p>Product updates, when something ships.</p>
        <p>A weekly digest, every Tuesday morning.</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="tertiary">Discard</Button>
          <Button>Save changes</Button>
        </div>
      </CardBody>
    </Card>
  );
}
