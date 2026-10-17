import { Button, Card, CardBody, CardHeader, CardNote, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/**
 * The corner a part takes where it sits in a card's corner: the card's radius less its edge and padding, read
 * from the properties the card sets, so the two curves share a center in every shape.
 */
const CARD_CORNER =
  'max(var(--radius-micro), calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))';

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
          <Button style={{ borderEndEndRadius: CARD_CORNER }}>Save changes</Button>
        </div>
      </CardBody>
    </Card>
  );
}
