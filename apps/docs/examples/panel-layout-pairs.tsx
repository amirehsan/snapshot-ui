import { Card, CardBody, CardHeader, CardTitle, PanelRow, Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** A server component: PanelRow and Card are static, so the pairs need no client code. */
export default function PanelLayoutPairs(): ReactElement {
  // A row's width is 0 until a holder gives it one: this column fills the stage. From 66rem of the row's own
  // width the cards pair; under it they stack in source order.
  return (
    <div style={{ width: '100%', display: 'grid', gap: 'var(--spacing-peer)' }}>
      <PanelRow layout="halves">
        <Card>
          <CardHeader>
            <CardTitle level={3}>Profile</CardTitle>
          </CardHeader>
          <CardBody>
            <Text>Ada Lovelace, ada@example.com</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle level={3}>Sign in</CardTitle>
          </CardHeader>
          <CardBody>
            <Text>A code to your email, then your passkey.</Text>
          </CardBody>
        </Card>
      </PanelRow>
      <PanelRow layout="third-two-thirds">
        <Card>
          <CardHeader>
            <CardTitle level={3}>Theme</CardTitle>
          </CardHeader>
          <CardBody>
            <Text>Follows the system.</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle level={3}>Density</CardTitle>
          </CardHeader>
          <CardBody>
            <Text>
              Comfortable rows, with every target at 40px or more. Compact fits more rows on a screen.
            </Text>
          </CardBody>
        </Card>
      </PanelRow>
    </div>
  );
}
