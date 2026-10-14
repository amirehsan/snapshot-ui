import { Tab, TabList, TabPanel, Tabs } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TabsBasic(): ReactElement {
  return (
    <div style={{ width: '100%' }}>
      <Tabs defaultSelectedKey="spending">
        <TabList aria-label="Transactions">
          <Tab id="all">All</Tab>
          <Tab id="spending">Spending</Tab>
          <Tab id="income">Income</Tab>
          <Tab id="transfers">Transfers</Tab>
        </TabList>
        <TabPanel id="all">
          <p>Every transaction this month, newest first.</p>
        </TabPanel>
        <TabPanel id="spending">
          <p>Money out: card payments, bills and transfers you sent.</p>
        </TabPanel>
        <TabPanel id="income">
          <p>Money in: salary, refunds and transfers you received.</p>
        </TabPanel>
        <TabPanel id="transfers">
          <p>Moves between your own accounts, which are neither.</p>
        </TabPanel>
      </Tabs>
    </div>
  );
}
