import { Card, CardBody, CardHeader, CardNote, CardTitle } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CardNested(): ReactElement {
  return (
    <Card as="section" aria-labelledby="card-nested-title" style={{ maxWidth: 480, marginInline: 'auto' }}>
      <CardHeader>
        <CardTitle id="card-nested-title" level={3}>
          Workspace
        </CardTitle>
        <CardNote>Shown in the header and in every invite.</CardNote>
      </CardHeader>
      <CardBody>
        <p>Northwind Studio</p>
        <Card as="section" aria-labelledby="card-nested-danger">
          <CardHeader>
            <CardTitle id="card-nested-danger" level={4}>
              Danger zone
            </CardTitle>
            <CardNote>Deleting a workspace cannot be undone.</CardNote>
          </CardHeader>
          <CardBody>
            <p>Every member loses access at once.</p>
          </CardBody>
        </Card>
      </CardBody>
    </Card>
  );
}
