import {
  Badge,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListItem,
  Link,
} from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/**
 * The list is the card's body. Its last row's Edit ends the card, inside its bottom end curve, so the row takes
 * the card's corner inset under it and Edit keeps its place on the column's end edge: 7px more in Rounded,
 * nothing more in Soft and Square, and nothing while the list is stacked, where Edit is on the term's line. The
 * list does this itself. The header's Edit, in CardActions, stands clear of the top end curve the same way: the
 * header's top grows by the corner inset.
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
        <CardActions>
          <Link href="#edit-details" aria-label="Edit details">
            Edit
          </Link>
        </CardActions>
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
          {/* A missing value: a link to add it, in place of the value, and no action beside it. */}
          <DescriptionListItem term="Nickname" emptyValue={<Link href="#nickname">Add a nickname</Link>} />
          <DescriptionListItem term="APR" isNumeric>
            24.9%
          </DescriptionListItem>
          <DescriptionListItem
            term="Credit limit"
            isNumeric
            actions={
              <Link href="#credit-limit" aria-label="Edit Credit limit">
                Edit
              </Link>
            }
          >
            $5,000.00
          </DescriptionListItem>
        </DescriptionList>
      </CardBody>
    </Card>
  );
}
