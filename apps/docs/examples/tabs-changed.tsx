import { Badge, Tab, TabList, TabPanel, Tabs } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TabsChanged(): ReactElement {
  return (
    <div style={{ width: '100%' }}>
      <Tabs defaultSelectedKey="general">
        <TabList aria-label="Settings">
          <Tab id="general">General</Tab>
          {/* The panel holds unsaved edits: the clay dot, read as "Changed". */}
          <Tab id="rules" isChanged>
            Rules
          </Tab>
          {/* A count is part of the tab's name, in a Badge, never in clay. */}
          <Tab id="review">
            To review <Badge>3</Badge>
          </Tab>
        </TabList>
        <TabPanel id="general">
          <p>Your name, your currency and the day your month starts.</p>
        </TabPanel>
        <TabPanel id="rules">
          <p>Two rules edited and not saved yet.</p>
        </TabPanel>
        <TabPanel id="review">
          <p>Three transactions no rule has sorted.</p>
        </TabPanel>
      </Tabs>
    </div>
  );
}
