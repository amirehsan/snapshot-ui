import { Accordion, AccordionItem } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function AccordionExpandAll(): ReactElement {
  return (
    <Accordion hasExpandAll style={{ width: '100%', maxWidth: '36rem' }}>
      <AccordionItem id="income" title="Income" note="Salary, transfers in and refunds">
        <p>Money that comes into an account, counted on the day it arrives.</p>
      </AccordionItem>
      <AccordionItem id="spending" title="Spending" note="Purchases, bills and fees">
        <p>Money that leaves an account, grouped by the category you give each payee.</p>
      </AccordionItem>
      <AccordionItem id="transfers" title="Transfers" note="Between your own accounts">
        <p>Moves between two of your accounts, left out of income and spending.</p>
      </AccordionItem>
      <AccordionItem id="pending" title="Pending" note="Not yet cleared by the bank">
        <p>Shown in the list, and counted once the bank clears them.</p>
      </AccordionItem>
    </Accordion>
  );
}
