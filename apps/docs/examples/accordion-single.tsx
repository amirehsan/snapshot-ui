'use client';

import { Accordion, AccordionItem, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const TITLES: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export default function AccordionSingle(): ReactElement {
  const [open, setOpen] = useState<Set<string | number>>(new Set(['weekly']));
  const [first] = [...open];
  return (
    <div
      className="stack"
      style={{ width: '100%', minWidth: 0, maxWidth: '36rem', gridTemplateColumns: 'minmax(0, 1fr)' }}
    >
      <Accordion allowsMultipleExpanded={false} expandedKeys={open} onExpandedChange={setOpen}>
        <AccordionItem id="daily" title="Daily">
          <p>A summary every morning at 8, of yesterday&apos;s spending.</p>
        </AccordionItem>
        <AccordionItem id="weekly" title="Weekly">
          <p>A digest every Monday, with the week&apos;s totals by category.</p>
        </AccordionItem>
        <AccordionItem id="monthly" title="Monthly">
          <p>A report on the first of the month, with every budget against its limit.</p>
        </AccordionItem>
      </Accordion>
      <Text size="small" tone="muted">
        Open: {first === undefined ? 'none' : TITLES[String(first)]}
      </Text>
    </div>
  );
}
