import { DescriptionList, DescriptionListItem } from '@snapshot-ui/react';
import type { CSSProperties, ReactElement } from 'react';

const DETAILS = [
  <DescriptionListItem key="name" term="Name">
    Everyday Visa
  </DescriptionListItem>,
  <DescriptionListItem key="type" term="Type">
    Credit card
  </DescriptionListItem>,
  <DescriptionListItem key="institution" term="Institution">
    Northwind Bank
  </DescriptionListItem>,
  <DescriptionListItem key="routing" term="Routing number" isNumeric>
    021000021
  </DescriptionListItem>,
];

/** A wider name column, for terms longer than the 30% default holds on one line. */
const WIDE_TERMS = { '--description-list-term-size': '40%' } as CSSProperties;

export default function DescriptionListBasic(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', minWidth: 0, gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {/* The list's own width decides: beside the values here, above them on a phone. */}
      <DescriptionList>{DETAILS}</DescriptionList>
      {/* In a narrow column the terms stand above their values, whatever the screen's width. */}
      <div style={{ width: '100%', maxWidth: '18rem' }}>
        <DescriptionList>{DETAILS}</DescriptionList>
      </div>
      {/* layout holds one layout at every width, and the custom property sets the name column. */}
      <DescriptionList layout="horizontal" style={WIDE_TERMS}>
        {DETAILS}
      </DescriptionList>
    </div>
  );
}
