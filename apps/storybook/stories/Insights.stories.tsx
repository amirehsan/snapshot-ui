import { BarChart, type BarValue } from '@snapshot-ui/charts';
import {
  Card,
  CardHeader,
  CardNote,
  CardTitle,
  PageHeader,
  Prose,
  ProseScroll,
  SegmentedControl,
  SegmentedControlItem,
  StatTile,
  Switch,
} from '@snapshot-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { expect, waitFor } from 'storybook/test';

/**
 * The consumer's Insights page, the docs' recipe drawn still: the month's figures, the chart card in its month
 * view comparing income with the twelve months before, and the month's report as Prose in a card, side by side on
 * a wide screen and one under the other on a phone. The two packages together, which neither package's own
 * stories may do. Static: no router, and the report is the markup the stories' react-markdown map writes.
 */

const meta = {
  title: 'Pages/Insights',
  tags: ['density'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** An amount as the app writes it, with no Intl: "$1,450.00". */
const dollars = (value: number): string => {
  const [whole = '0', cents = '00'] = Math.abs(value).toFixed(2).split('.');
  return `${value < 0 ? '-' : ''}$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
};

const money = (value: number): BarValue => ({ value, valueLabel: dollars(value) });

const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const INCOME = [5200, 5200, 5200, 5200, 5200, 5450, 5200, 5200, 5200, 5200, 5200, 5200];
const INCOME_BEFORE = [4900, 4900, 4900, 4900, 4900, 5150, 4900, 4900, 4900, 4900, 4900, 4900];

const TICKS = [0, 2000, 4000, 6000].map((value) => ({ value, label: dollars(value).replace(/\.00$/, '') }));

const ROWS = [
  ['Rent', '$1,450.00', '$1,450.00', '$0.00', '34%', '$1,450.00'],
  ['Groceries', '$698.15', '$742.60', '+$44.45', '18%', '$750.00'],
  ['Dining', '$455.00', '$412.45', '-$42.55', '10%', '$400.00'],
  ['Shopping', '$212.40', '$368.30', '+$155.90', '9%', '$250.00'],
  ['Transport', '$301.75', '$288.10', '-$13.65', '7%', '$300.00'],
];

const HEADERS = ['Category', 'September', 'October', 'Change', 'Share', 'Budget'];

/** The month's report, as react-markdown writes it with the docs' map: its link and image are text. */
const Report = (): ReactElement => (
  <Prose as="article">
    <h2>Your October</h2>
    <p>
      You spent <strong>$4,220.00</strong> in October, $415.00 more than in September, and kept $980.00 of
      your income. Most of the rise was <em>shopping</em> and <em>gifts</em>, ahead of the holidays.
    </p>
    <h3>What changed</h3>
    <ul>
      <li>Shopping rose to $368.30, from $212.40.</li>
      <li>Gifts rose to $165.00, from $40.00.</li>
      <li>Travel netted -$310.00: Delta Air Lines refunded the cancelled flight.</li>
    </ul>
    <ProseScroll aria-label={`Table: ${HEADERS.join(', ')}`}>
      <table>
        <thead>
          <tr>
            {HEADERS.map((name, index) => (
              <th key={name} style={index === 0 ? undefined : { textAlign: 'right' }}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([name = '', ...figures]) => (
            <tr key={name}>
              <td>{name}</td>
              {figures.map((figure, index) => (
                <td key={index} style={{ textAlign: 'right' }}>
                  {figure}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ProseScroll>
    <p>
      See <span className="prose-unlinked">every transaction</span> for the detail.
    </p>
    <p>
      <span className="prose-image">Spending by category in October, rent first</span>
    </p>
    <blockquote>
      <p>Next month, move the refund to the travel fund before it is spent.</p>
    </blockquote>
    <p>Export the month as a file with:</p>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard */}
    <pre role="region" aria-label="Code: snapshot export --month 2026-10 --format csv" tabIndex={0}>
      <code>snapshot export --month 2026-10 --format csv</code>
    </pre>
  </Prose>
);

export const Default: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-peer)' }}>
      <PageHeader title="Insights" description="Where October's money went, account by account." />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(14rem, 100%), 1fr))',
          gap: 'var(--spacing-peer)',
        }}
      >
        <StatTile
          label="Spent"
          value="$4,220.00"
          caption="October"
          change={{ direction: 'up', label: 'Up $415 vs September' }}
        />
        <StatTile
          label="Income"
          value="$5,200.00"
          caption="October"
          change={{ direction: 'flat', label: 'Same as September' }}
        />
        <StatTile
          label="Net"
          value="$980.00"
          caption="October"
          change={{ direction: 'down', label: 'Down $415 vs September' }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(28rem, 100%), 1fr))',
          gap: 'var(--spacing-peer)',
          alignItems: 'start',
        }}
      >
        <Card as="section" aria-labelledby="insights-title">
          <CardHeader>
            <CardTitle id="insights-title" level={2}>
              Income by month
            </CardTitle>
            <CardNote id="insights-note">The last twelve months, against the twelve before</CardNote>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-part)' }}>
              <SegmentedControl aria-label="Group by" size="sm" defaultValue="month">
                <SegmentedControlItem value="month">Month</SegmentedControlItem>
                <SegmentedControlItem value="category">Category</SegmentedControlItem>
                <SegmentedControlItem value="merchant">Merchant</SegmentedControlItem>
                <SegmentedControlItem value="account">Account</SegmentedControlItem>
              </SegmentedControl>
              <SegmentedControl aria-label="Show" size="sm" defaultValue="income">
                <SegmentedControlItem value="both">Both</SegmentedControlItem>
                <SegmentedControlItem value="spending">Spending</SegmentedControlItem>
                <SegmentedControlItem value="income">Income</SegmentedControlItem>
                <SegmentedControlItem value="net">Net</SegmentedControlItem>
                <SegmentedControlItem value="mix">Mix</SegmentedControlItem>
              </SegmentedControl>
            </div>
            <Switch defaultSelected>Compare to previous period</Switch>
          </CardHeader>
          <BarChart
            aria-labelledby="insights-title insights-note"
            categories={MONTHS}
            bands="time"
            valueTicks={TICKS}
            series={[
              { label: 'Income', color: 'gain', values: INCOME.map(money) },
              { label: 'A year before', look: 'hatched', values: INCOME_BEFORE.map(money) },
            ]}
          />
        </Card>
        <Card>
          <Report />
        </Card>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.bar-chart');
    // The previous period takes income's gain, striped, beside each month's bar.
    await waitFor(() =>
      expect(chart?.querySelectorAll('.bar-chart-bar[data-look="hatched"][data-color="gain"]')).toHaveLength(
        12,
      ),
    );
    await expect(chart?.querySelectorAll('.bar-chart-bar[data-look="fill"][data-color="gain"]')).toHaveLength(
      12,
    );
    await expect(canvasElement.querySelectorAll('.prose a, .prose img')).toHaveLength(0);
  },
};
