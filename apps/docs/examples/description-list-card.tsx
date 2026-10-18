import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListItem,
  Link,
} from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/**
 * The list is the card's body. Its last row's Add ends the card, inside its bottom end curve, so the row takes
 * the card's corner inset under it and Add keeps its place on the column's end edge: 7px more in Rounded,
 * nothing more in Soft and Square. The list does this itself.
 */
export default function DescriptionListCard(): ReactElement {
  return (
    <Card
      as="section"
      aria-labelledby="description-list-card-title"
      style={{ width: '100%', maxWidth: 560, marginInline: 'auto' }}
    >
      <CardHeader>
        <CardTitle id="description-list-card-title" level={3}>
          Details
        </CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
          <DescriptionListItem term="Type">Credit card</DescriptionListItem>
          <DescriptionListItem term="Institution">Northwind Bank</DescriptionListItem>
          <DescriptionListItem term="Last four" isNumeric>
            4821
          </DescriptionListItem>
          <DescriptionListItem term="Bank feed">
            <Badge>Connected</Badge>
          </DescriptionListItem>
          <DescriptionListItem term="Credit limit" isNumeric>
            $5,000.00
          </DescriptionListItem>
          <DescriptionListItem term="APR" isNumeric>
            24.9%
          </DescriptionListItem>
          <DescriptionListItem
            term="Nickname"
            actions={
              <Link href="#nickname" aria-label="Add a nickname">
                Add
              </Link>
            }
          />
        </DescriptionList>
      </CardBody>
    </Card>
  );
}
