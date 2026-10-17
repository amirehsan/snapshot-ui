import { Button, Card, CardBody, CardHeader, CardNote, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/**
 * The buttons end the card's body, inside its bottom end curve, so the row keeps the card's corner inset under
 * it and the buttons keep their own shape and their place on the column's end edge: 7px more in Rounded,
 * nothing more in Soft and Square.
 */
const CLEAR_OF_CORNER = 'calc(var(--holder-corner-inset) - var(--holder-pad))';

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
        <div className="row" style={{ justifyContent: 'flex-end', marginBlockEnd: CLEAR_OF_CORNER }}>
          <Button variant="tertiary">Discard</Button>
          <Button>Save changes</Button>
        </div>
      </CardBody>
    </Card>
  );
}
