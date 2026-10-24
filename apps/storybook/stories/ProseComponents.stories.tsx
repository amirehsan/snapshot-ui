import { BarChart, LineChart, type BarValue, type LinePoint } from '@snapshot-ui/charts';
import {
  Accordion,
  AccordionItem,
  Badge,
  BottomTabBar,
  BottomTabBarItem,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Calendar,
  Card,
  CardBody,
  CardHeader,
  CardNote,
  CardTitle,
  DataTable,
  Eyebrow,
  Heading,
  Kbd,
  Link,
  PageHeader,
  Pagination,
  Prose,
  RouterProvider,
  Text,
  UploadList,
  type DataTableColumn,
  type UploadItem,
} from '@snapshot-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement, ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';

/**
 * The two packages together, which neither package's own stories may do: every library component inside a
 * Prose box draws exactly as it does outside one (insights spec 8.5). prose.css hands every component root it
 * finds inside the box back to the layer below its own rules, so its list, table, figure and link rules reach
 * no component, the compound ones included.
 */

const meta = {
  title: 'Compositions/Components in Prose',
  tags: ['no-visual'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = (): void => undefined;

const money = (value: number): BarValue => ({ value, valueLabel: `$${value.toFixed(2)}` });

const point = (value: number): LinePoint => ({ value, valueLabel: `$${value.toFixed(2)}` });

/** A small glyph for the tab bar, so the story needs no icon package. */
const Glyph = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

interface Row {
  id: string;
  payee: string;
  amount: string;
}

const ROWS: Row[] = [
  { id: 't1', payee: 'Corner Mart', amount: '-$42.18' },
  { id: 't2', payee: 'Northside Rent', amount: '-$1,450.00' },
  { id: 't3', payee: 'Acme Payroll', amount: '+$3,120.00' },
];

const COLUMNS: readonly DataTableColumn<Row>[] = [
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'amount', header: 'Amount', cell: (row) => row.amount, align: 'end' },
];

const UPLOADS: UploadItem[] = [
  { id: 1, name: 'receipt-march.pdf', status: 'waiting' },
  { id: 2, name: 'invoice.pdf', status: 'uploading', progress: 0.45, progressLabel: '1.8 of 4 MB' },
  { id: 3, name: 'lease.pdf', status: 'saved', href: '#lease' },
  { id: 4, name: 'video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
];

/** Every component the review found reached by prose, and the simple ones, each rendered bare. */
const PARTS: [name: string, render: (twin: string) => ReactElement][] = [
  [
    'Heading',
    () => (
      <Heading level={2} size={2}>
        Settings
      </Heading>
    ),
  ],
  ['Text', () => <Text>A sentence of body copy.</Text>],
  ['Eyebrow', () => <Eyebrow>Workspace</Eyebrow>],
  ['Link', () => <Link href="#budgets">Budgets</Link>],
  ['Kbd', () => <Kbd>Esc</Kbd>],
  ['Badge', () => <Badge tone="info">Beta</Badge>],
  ['Button', () => <Button>Save</Button>],
  [
    'Accordion',
    () => (
      <Accordion defaultExpandedKeys={['billing']}>
        <AccordionItem id="billing" title="Billing address" note="Where invoices go">
          <p>12 Rose Lane.</p>
          <ul>
            <li>Invoices monthly</li>
          </ul>
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone" isChanged>
          <p>Close the account.</p>
        </AccordionItem>
      </Accordion>
    ),
  ],
  [
    'Card',
    () => (
      <Card>
        <CardHeader>
          <CardTitle level={3}>Travel fund</CardTitle>
          <CardNote>$1,240.00 of $2,000.00</CardNote>
        </CardHeader>
        <CardBody>
          <p>Saved monthly.</p>
          <ul>
            <li>On payday</li>
          </ul>
          <a href="#fund">The fund</a>
        </CardBody>
      </Card>
    ),
  ],
  [
    'Breadcrumbs',
    (twin) => (
      <Breadcrumbs aria-label={`Breadcrumbs, ${twin}`}>
        <Breadcrumb href="#home">Home</Breadcrumb>
        <Breadcrumb href="#documents">Documents</Breadcrumb>
        <Breadcrumb>Receipts, 2026</Breadcrumb>
      </Breadcrumbs>
    ),
  ],
  [
    'PageHeader',
    (twin) => (
      <PageHeader
        headingLevel={2}
        breadcrumbs={
          <Breadcrumbs aria-label={`Breadcrumbs, header, ${twin}`}>
            <Breadcrumb href="#home">Home</Breadcrumb>
            <Breadcrumb>Receipts, 2026</Breadcrumb>
          </Breadcrumbs>
        }
        eyebrow="Documents"
        title="Receipts, 2026"
        description="Every receipt you uploaded this year."
        actions={<Button variant="secondary">Upload</Button>}
      />
    ),
  ],
  [
    'Pagination',
    (twin) => (
      <Pagination
        labels={{ navigation: `Pagination, ${twin}` }}
        page={12}
        pageCount={26}
        rangeLabel="551 to 600 of 1,284"
        getPageHref={(page) => `#page-${String(page)}`}
      />
    ),
  ],
  ['Calendar', () => <Calendar aria-label="Date" value="2026-09-14" today="2026-09-18" />],
  [
    'DataTable',
    () => <DataTable aria-label="Transactions" items={ROWS} columns={COLUMNS} getKey={(row) => row.id} />,
  ],
  [
    'UploadList',
    () => <UploadList aria-label="Uploads" items={UPLOADS} onRetry={noop} onRemove={noop} onCancel={noop} />,
  ],
  [
    'BottomTabBar',
    (twin) => (
      <BottomTabBar aria-label={`Main, ${twin}`}>
        <BottomTabBarItem href="#home" icon={<Glyph />} isCurrent>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Glyph />} count={3} countLabel="to review">
          Goals
        </BottomTabBarItem>
      </BottomTabBar>
    ),
  ],
  [
    'BarChart',
    () => (
      <BarChart
        aria-label="Spending by category"
        orientation="horizontal"
        categories={['Rent', 'Groceries', 'Transport']}
        series={[{ label: 'October', values: [1450, 612.4, 198.3].map(money) }]}
      />
    ),
  ],
  [
    'LineChart',
    () => (
      <LineChart
        aria-label="Spending this week"
        series={[{ label: 'This week', points: [42.1, 38.5, 55, 61.2, 47.8].map(point) }]}
        xLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
      />
    ),
  ],
];

/** What the twins must share, for the element and each of its descendants. */
const COMPARED = [
  'display',
  'position',
  'box-sizing',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant-numeric',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-align',
  'text-decoration-line',
  'text-decoration-thickness',
  'vertical-align',
  'white-space',
  'overflow-wrap',
  'color',
  'background-color',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-bottom-style',
  'border-top-left-radius',
  'border-bottom-right-radius',
  'border-collapse',
  'list-style-type',
  'max-width',
  'quotes',
] as const;

/** Each part inside a prose box, a direct child of it, beside its twin outside, in columns of one width. */
function Pairs({ children }: { children?: ReactNode }): ReactElement {
  return (
    <RouterProvider navigate={noop}>
      <div style={{ display: 'grid', gap: 24 }}>
        {PARTS.map(([name, render]) => (
          <div
            key={name}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}
          >
            <Prose as="article" data-twin={`inside-${name}`}>
              {render('inside')}
            </Prose>
            <article data-twin={`outside-${name}`}>{render('outside')}</article>
          </div>
        ))}
        {children}
      </div>
    </RouterProvider>
  );
}

/** The holder's element and every element inside it, in document order. */
const elementsOf = (holder: Element): Element[] => [...holder.querySelectorAll('*')];

/**
 * Prose never reaches a component: every element of each part, its root a direct child of the prose box,
 * computes the same type, color, spacing, edges, corners, list style and measure as its twin outside it, with
 * no not-prose. Run in three engines, since each resolves the layer it falls back to itself.
 */
export const ComponentsUnchanged: Story = {
  tags: ['webkit', 'firefox'],
  render: () => <Pairs />,
  play: async ({ canvasElement }) => {
    // Every chart has mounted its roving tab stop before anything is read.
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.bar-chart-bar[tabindex="0"]')).toHaveLength(2),
    );
    // Read synchronously and asserted once: thousands of instrumented expectations would outlast a story's time.
    const counts: string[] = [];
    const differences: string[] = [];
    for (const [name] of PARTS) {
      const inside = canvasElement.querySelector(`[data-twin="inside-${name}"]`);
      const outside = canvasElement.querySelector(`[data-twin="outside-${name}"]`);
      if (!inside || !outside) throw new Error(`No twins for ${name}`);
      const ours = elementsOf(inside);
      const theirs = elementsOf(outside);
      if (ours.length === 0 || ours.length !== theirs.length) {
        counts.push(`${name}: ${String(ours.length)} inside, ${String(theirs.length)} outside`);
        continue;
      }
      for (const [index, element] of ours.entries()) {
        const twin = theirs[index];
        if (!twin) continue;
        const label = `${name} ${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`;
        if (element.tagName !== twin.tagName) differences.push(`${label}: ${twin.tagName} outside`);
        const mine = getComputedStyle(element);
        const yours = getComputedStyle(twin);
        for (const property of COMPARED) {
          const value = mine.getPropertyValue(property);
          const expected = yours.getPropertyValue(property);
          if (value !== expected)
            differences.push(`${label} ${property}: ${value} inside, ${expected} outside`);
        }
      }
    }
    await expect(counts).toEqual([]);
    await expect(differences).toEqual([]);
  },
};

/**
 * Components placed directly in the box take the box's gaps, though each root sets `margin: 0` in a file that
 * loads after prose's: the gaps are two classes deep (insights spec correction 89). A chart after a paragraph
 * stands a peer step below it, a Heading of level 2 the separate step, and a Text after that heading a part step.
 */
export const GapsBeforeComponents: Story = {
  tags: ['webkit', 'firefox'],
  render: () => (
    <Prose as="article" style={{ maxWidth: '40rem' }}>
      <p>Rent was most of the month, as it is every month.</p>
      <BarChart
        aria-label="Spending by category, October"
        orientation="horizontal"
        categories={['Rent', 'Groceries']}
        series={[{ label: 'October', values: [money(1450), money(742.6)] }]}
      />
      <Heading level={2} size={3}>
        What changed
      </Heading>
      <Text>Groceries rose a little.</Text>
    </Prose>
  ),
  play: async ({ canvas }) => {
    /** The space between an element and the box's child before it, in whole pixels. */
    const gap = (element: HTMLElement): number => {
      const previous = element.previousElementSibling;
      if (!previous) throw new Error('Nothing before it');
      return Math.round(element.getBoundingClientRect().top - previous.getBoundingClientRect().bottom);
    };
    const chart = canvas.getByRole('figure', { name: 'Spending by category, October' });
    const heading = canvas.getByRole('heading', { name: 'What changed' });
    const text = canvas.getByText('Groceries rose a little.');
    await waitFor(() => expect(gap(chart)).toBe(24));
    await expect(gap(heading)).toBe(32);
    await expect(gap(text)).toBe(8);
  },
};
