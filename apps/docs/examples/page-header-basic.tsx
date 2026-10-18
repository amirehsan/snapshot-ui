import { Breadcrumb, Breadcrumbs, Button, PageColumn, PageHeader, Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function PageHeaderBasic(): ReactElement {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        // An example on a docs page, which has its own h1; a page's own header keeps the default, 1.
        headingLevel={2}
        breadcrumbs={
          // Two trails share this docs page, so this one names its landmark apart; a page has one.
          <Breadcrumbs aria-label="Breadcrumbs, settings">
            <Breadcrumb href="/docs">Home</Breadcrumb>
            <Breadcrumb href="/docs/components/page-header">Settings</Breadcrumb>
            <Breadcrumb>Notifications</Breadcrumb>
          </Breadcrumbs>
        }
        eyebrow="Settings"
        title="Notifications"
        description="Choose what reaches you by email and what waits in the app."
        actions={<Button variant="secondary">Send a test</Button>}
      />
      <PageColumn>
        <Text tone="muted">The page under the header starts where its title does.</Text>
      </PageColumn>
    </div>
  );
}
