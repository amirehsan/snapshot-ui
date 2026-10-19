import {
  Badge,
  Button,
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
 * The list is the card's body. Its last row's Add ends the card, inside its bottom end curve, so the row takes
 * the card's corner inset under it and Add keeps its place on the column's end edge: 7px more in Rounded,
 * nothing more in Soft and Square. The list does this itself. The header's Edit, a secondary Button in
 * CardActions, stands clear of the top end curve the same way: beside the title it moves down by the corner
 * inset less the card's padding. An app opens its form from it, as the card page's Actions example does.
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
          <Button variant="secondary" aria-label="Edit details">
            Edit
          </Button>
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
