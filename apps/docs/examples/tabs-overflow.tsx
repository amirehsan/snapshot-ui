import { Tab, TabList, TabPanel, Tabs } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const VIEWS = ['All', 'Spending', 'Income', 'Transfers', 'Bills', 'Subscriptions', 'Refunds', 'Archived'];

export default function TabsOverflow(): ReactElement {
  return (
    <div style={{ width: '100%', maxWidth: '24rem' }}>
      <Tabs defaultSelectedKey="archived">
        <TabList aria-label="Transactions">
          {VIEWS.map((view) => (
            <Tab key={view} id={view.toLowerCase()}>
              {view}
            </Tab>
          ))}
        </TabList>
        {VIEWS.map((view) => (
          <TabPanel key={view} id={view.toLowerCase()}>
            <p>{`The ${view.toLowerCase()} view.`}</p>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
