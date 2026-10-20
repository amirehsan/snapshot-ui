import { BarChart, type BarValue } from '@snapshot-ui/charts';
import { Badge, Prose } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** An amount as the app formats it: the number to draw and the string to say it. */
const money = (value: number): BarValue => ({ value, valueLabel: `$${value.toFixed(2)}` });

/**
 * A chart and a badge inside an article, with no not-prose: prose leaves every library component as it is
 * anywhere, its figure, its rows and its table included, and spaces the chart as a block of the article.
 */
export default function ProseWithChart(): ReactElement {
  return (
    <Prose as="article" style={{ width: '100%' }}>
      <h2>
        Where October went <Badge tone="info">New</Badge>
      </h2>
      <p>Rent was most of the month, as it is every month, and eating out fell by a third.</p>
      <BarChart
        aria-label="Spending by category, October"
        orientation="horizontal"
        categories={['Rent', 'Groceries', 'Eating out', 'Transport', 'Utilities']}
        series={[{ label: 'October', values: [1450, 612.4, 286.9, 198.3, 181.75].map(money) }]}
      />
      <p>Refunds are counted in the month they arrive.</p>
    </Prose>
  );
}
