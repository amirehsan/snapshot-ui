import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ellipsis } from 'lucide-react';
import type { CSSProperties, ReactElement } from 'react';
import { expect } from 'storybook/test';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardActions, CardBody, CardHeader, CardNote, CardTitle } from '../card';
import { DescriptionList, DescriptionListItem } from '../description-list';
import { Gauge, type GaugeMark } from '../gauge';
import { IconButton } from '../icon-button';
import { Link } from '../link';
import { Menu, MenuItem, MenuTrigger } from '../menu';
import { MonthGrid } from '../month-grid';
import { COVERAGE_STATES, COVERAGE_YEARS, FIRST_YEAR, MONTH_NAMES, SHORT_MONTHS } from './coverage';

/**
 * An account's page from the Accounts recipe, static and with no router: the Details card with its Edit and More
 * in CardActions and its DescriptionList, the credit tab's score, and its statement coverage. Side by side at
 * 1280 and stacked at 375, so the concentric audit and the baselines see the batch's parts together.
 */
const meta = {
  title: 'Pages/Accounts',
  tags: ['density'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band edges of a 300 to 850 score, read as the gauge's description. */
const SCORE_MARKS: GaugeMark[] = [
  { value: 580, label: 'Fair from 580' },
  { value: 670, label: 'Good from 670' },
  { value: 740, label: 'Very good from 740' },
  { value: 800, label: 'Excellent from 800' },
];

/** The range's ends under the lg semicircle's ends, the app's text for the eye (spec correction 41). */
const END: CSSProperties = {
  position: 'absolute',
  insetBlockStart: 'calc(5rem + var(--spacing-part))',
  fontSize: 'var(--text-small)',
  lineHeight: 'var(--text-small--line-height)',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-slate)',
};

const BANDS = [
  ['Poor', '300 to 579'],
  ['Fair', '580 to 669'],
  ['Good', '670 to 739'],
  ['Very good', '740 to 799'],
  ['Excellent', '800 to 850'],
] as const;

function Details(): ReactElement {
  return (
    <Card as="section" aria-labelledby="accounts-details-title">
      <CardHeader>
        <CardTitle id="accounts-details-title" level={3}>
          Details
        </CardTitle>
        <CardActions>
          <Button variant="secondary" aria-label="Edit details">
            Edit
          </Button>
          <MenuTrigger>
            <IconButton aria-label="More actions" variant="outline">
              <Ellipsis />
            </IconButton>
            <Menu>
              <MenuItem id="merge">Merge</MenuItem>
              <MenuItem id="remove" variant="danger">
                Remove
              </MenuItem>
            </Menu>
          </MenuTrigger>
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
            <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 'var(--spacing-part)' }}>
              <Badge tone="error">Failed</Badge>
              <Link href="#reconnect" aria-label="Reconnect Everyday Visa">
                Reconnect
              </Link>
            </span>
          </DescriptionListItem>
          <DescriptionListItem term="Credit limit" isNumeric>
            $5,000.00
          </DescriptionListItem>
          <DescriptionListItem term="APR" isNumeric>
            24.9%
          </DescriptionListItem>
          <DescriptionListItem term="Nickname" emptyValue={<Link href="#nickname">Add a nickname</Link>} />
        </DescriptionList>
      </CardBody>
    </Card>
  );
}

function Score(): ReactElement {
  return (
    <Card as="section" aria-labelledby="accounts-score-title">
      <CardHeader>
        <CardTitle id="accounts-score-title" level={3}>
          Credit score
        </CardTitle>
        <CardNote>From your bureau on Oct 1</CardNote>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--spacing-peer)' }}>
          <div style={{ position: 'relative', display: 'inline-grid' }}>
            <Gauge
              aria-labelledby="accounts-score-title"
              form="semicircle"
              size="lg"
              minValue={300}
              maxValue={850}
              value={742}
              valueLabel="742 of 850, Very good"
              figure="742"
              figureCaption="Very good"
              marks={SCORE_MARKS}
            />
            <span aria-hidden="true" style={{ ...END, insetInlineStart: 'calc(50% - 5rem)' }}>
              300
            </span>
            <span aria-hidden="true" style={{ ...END, insetInlineEnd: 'calc(50% - 5rem)' }}>
              850
            </span>
          </div>
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '4px var(--spacing-peer)',
              margin: 0,
              padding: 0,
              listStyle: 'none',
              fontSize: 'var(--text-small)',
              lineHeight: 'var(--text-small--line-height)',
            }}
          >
            {BANDS.map(([word, range]) => (
              <li key={word}>
                <span style={{ fontWeight: 500 }}>{word}</span>{' '}
                <span style={{ color: 'var(--color-slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {range}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

function Coverage(): ReactElement {
  return (
    <Card>
      <MonthGrid
        label="Statement coverage"
        states={COVERAGE_STATES}
        years={[...COVERAGE_YEARS, FIRST_YEAR]}
        monthLabels={SHORT_MONTHS}
        monthNames={MONTH_NAMES}
      />
    </Card>
  );
}

/** The account's Details card, its credit score and its statement coverage, side by side where they fit. */
export const Default: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(22rem, 100%), 1fr))',
        alignItems: 'start',
        gap: 'var(--spacing-separate)',
      }}
    >
      <Details />
      <Score />
      <Coverage />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Details' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Edit details' })).toBeInTheDocument();
    const score = canvas.getByRole('meter', { name: 'Credit score' });
    await expect(score).toHaveAttribute('aria-valuetext', '742 of 850, Very good');
    await expect(canvas.getByRole('figure', { name: 'Statement coverage' })).toBeInTheDocument();
    // Never the error tone on a score: the feed that failed is the page's one error.
    await expect(score.closest('.gauge')).toHaveAttribute('data-tone', 'neutral');
  },
};
