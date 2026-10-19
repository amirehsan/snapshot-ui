import { DescriptionList, DescriptionListItem, Link } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function DescriptionListValues(): ReactElement {
  return (
    <DescriptionList style={{ width: '100%' }}>
      {/* Empty: "Not set" in slate, never a dash or a blank. */}
      <DescriptionListItem term="Nickname" />
      {/* Or your own words, here a link to add the value. */}
      <DescriptionListItem term="Notes" emptyValue={<Link href="#notes">Add a note</Link>} />
      {/* Zero is a value. */}
      <DescriptionListItem term="Balance" isNumeric>
        $0.00
      </DescriptionListItem>
      {/* A long value wraps, and an unbroken one breaks anywhere. Nothing is cut off. */}
      <DescriptionListItem term="Billing address">
        12 Harbour Street, Flat 4, Northgate, Springfield, SP1 2AB, United Kingdom
      </DescriptionListItem>
      <DescriptionListItem term="IBAN">GB29NWBK60161331926819000000000000</DescriptionListItem>
      {/* Amounts, limits, percentages and the last four digits: tabular, and left to right on a Persian page. */}
      <DescriptionListItem term="Credit limit" isNumeric>
        $5,000.00
      </DescriptionListItem>
      <DescriptionListItem term="APR" isNumeric>
        24.9%
      </DescriptionListItem>
      <DescriptionListItem term="Last four" isNumeric>
        4821
      </DescriptionListItem>
    </DescriptionList>
  );
}
