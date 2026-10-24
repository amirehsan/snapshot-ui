import { Accordion, AccordionItem } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function AccordionBasic(): ReactElement {
  return (
    <Accordion defaultExpandedKeys={['export']} style={{ width: '100%', minWidth: 0, maxWidth: '36rem' }}>
      <AccordionItem id="export" title="How do I export my transactions?">
        <p>
          Open Transactions, choose the months, and press Export. You get one CSV file for the whole range.
        </p>
      </AccordionItem>
      <AccordionItem id="shared" title="Who can see a shared budget?" note="Members and their roles">
        <p>Everyone you invite sees the budget and its totals. Only owners see the accounts behind it.</p>
      </AccordionItem>
      <AccordionItem id="close" title="What happens when I close my account?">
        <p>Your documents are deleted after 30 days. You can download them until then.</p>
      </AccordionItem>
    </Accordion>
  );
}
