'use client';

import { AppShell, Button, Card, CardBody, useAppShell } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { ShellHeader, ShellNav } from './shell-nav';

/** The button spans the card's foot, so it stops at the card's corner inset and keeps its own shape. */
const CLEAR_OF_FOOT = { marginBlockEnd: 'calc(var(--holder-corner-inset) - var(--holder-pad))' };

/** Opens the drawer at any width, as the header's menu button does below 1024px. */
function OpenTheMenu(): ReactElement {
  const { openDrawer } = useAppShell();
  return (
    <Button onPress={openDrawer} style={CLEAR_OF_FOOT}>
      Open the menu
    </Button>
  );
}

export default function SidebarDrawer(): ReactElement {
  return (
    <div className="stage-shell">
      {/* The page's button is the one way in here, so the header draws no menu button of its own. */}
      <AppShell sidebar={<ShellNav label="Main, drawer" />} header={<ShellHeader hasTrigger={false} />}>
        <div style={{ padding: '0 var(--spacing-inset) var(--spacing-inset)' }}>
          <Card>
            <CardBody>
              <p style={{ margin: '0 0 16px' }}>The drawer is the rail a phone sees, here at any width.</p>
              <OpenTheMenu />
            </CardBody>
          </Card>
        </div>
      </AppShell>
    </div>
  );
}
