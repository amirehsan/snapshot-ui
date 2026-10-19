'use client';

import { BarChart, type BarChartProps, type BarChartSeries, type BarSeries } from '@snapshot-ui/charts';
import {
  Card,
  CardHeader,
  CardNote,
  CardTitle,
  DataTable,
  FilterBar,
  FilterChip,
  PageHeader,
  PickerOption,
  RouterProvider,
  SegmentedControl,
  SegmentedControlItem,
  StatTile,
  Switch,
  type DataTableColumn,
  type Key,
} from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useId, useState, type ReactElement } from 'react';
import {
  dollars,
  money,
  MONTH_FIGURES,
  MONTH_KEYS,
  MONTH_MIX,
  MONTH_MIX_TOTALS,
  MONTH_NET_TICKS,
  MONTH_TICKS,
  MONTHS,
  RANKED,
} from './insights-data';

type Grouping = 'month' | 'category' | 'merchant' | 'account';

/** What the month view draws: income beside spending, one of them, net cash flow, or the category mix. */
type Show = 'both' | 'spending' | 'income' | 'net' | 'mix';

/** The page's view, all of it in the URL: `?by=category&compare=1`. The defaults write no parameter. */
interface View {
  by: Grouping;
  show: Show;
  compare: boolean;
}

const GROUPINGS: Grouping[] = ['month', 'category', 'merchant', 'account'];
const SHOWS: Show[] = ['both', 'spending', 'income', 'net', 'mix'];

function viewOf(params: URLSearchParams): View {
  const by = GROUPINGS.find((each) => each === params.get('by')) ?? 'month';
  const show = SHOWS.find((each) => each === params.get('show')) ?? 'both';
  return { by, show, compare: params.get('compare') === '1' };
}

/** The query for a view, with no bare `?` and nothing for a default. */
function queryOf({ by, show, compare }: View): string {
  const params = new URLSearchParams();
  if (by !== 'month') params.set('by', by);
  if (by === 'month' && show !== 'both') params.set('show', show);
  if (compare) params.set('compare', '1');
  return params.toString();
}

/**
 * A grouped bar holds two series at most, so the comparison draws one series beside its previous period: it is
 * off while the month view shows income and spending together, or the stacked mix.
 */
const canCompare = ({ by, show }: View): boolean => by !== 'month' || !(show === 'both' || show === 'mix');

/** A row of the table under the chart: a band's name, its figures and the key of its transactions link. */
interface Row {
  key: string;
  name: string;
  figures: string[];
}

/** What a view draws: the card's words, the chart's props and the table's rows. */
interface Drawn {
  title: string;
  note: string;
  chart: BarChartSeries &
    Pick<BarChartProps, 'categories' | 'orientation' | 'bands' | 'valueTicks' | 'totals'>;
  /** The link's parameter, such as `category=rent`. */
  linkBy: string;
  columns: string[];
  rows: Row[];
}

const MONTH_TITLES: Record<Show, string> = {
  both: 'Income and spending',
  spending: 'Spending by month',
  income: 'Income by month',
  net: 'Net cash flow',
  mix: 'Spending by category, by month',
};

/** The month view: twelve months standing up, the newest last, and Tab lands on the newest. */
function monthView(show: Show, compare: boolean): Drawn {
  const { income, spending, net } = MONTH_FIGURES;
  const rows = MONTHS.map((name, index) => ({
    key: MONTH_KEYS[index] ?? name,
    name,
    figures: [spending, income, net].map(({ year }) => dollars(year[index] ?? 0)),
  }));
  const shared = { categories: MONTHS, bands: 'time', orientation: 'vertical' } as const;
  const table = { linkBy: 'month', columns: ['Month', 'Spending', 'Income', 'Net'], rows };
  const title = MONTH_TITLES[show];
  if (show === 'both' || show === 'mix') {
    return {
      ...table,
      title,
      note: 'The last twelve months',
      chart:
        show === 'both'
          ? {
              ...shared,
              valueTicks: MONTH_TICKS,
              // Money that arrived in gain beside money that went out in ink: never a color for spending.
              series: [
                { label: 'Income', color: 'gain', values: income.year.map(money) },
                { label: 'Spending', color: 'ink', values: spending.year.map(money) },
              ],
            }
          : {
              ...shared,
              valueTicks: MONTH_TICKS,
              layout: 'stacked',
              series: MONTH_MIX,
              totals: MONTH_MIX_TOTALS,
            },
    };
  }
  const figures = MONTH_FIGURES[show];
  const label = show === 'net' ? 'Net' : show === 'income' ? 'Income' : 'Spending';
  const current: BarSeries = {
    label,
    color: show === 'income' ? 'gain' : 'ink',
    values: figures.year.map(money),
  };
  // The previous period takes the current series' color, striped: the same thing, a year before.
  const previous: BarSeries = { label: 'A year before', look: 'hatched', values: figures.before.map(money) };
  return {
    ...table,
    title,
    note: compare ? 'The last twelve months, against the twelve before' : 'The last twelve months',
    chart: {
      ...shared,
      valueTicks: show === 'net' ? MONTH_NET_TICKS : MONTH_TICKS,
      series: compare ? [current, previous] : [current],
    },
  };
}

/**
 * A ranked view: rows lying down, amounts at their end, refunds below zero and "Other" last. Each bar links to
 * its transactions for the period it shows, October's or, compared, September's: the page's drill-down.
 */
function rankedView(by: Exclude<Grouping, 'month'>, compare: boolean): Drawn {
  const rows = RANKED[by];
  const october: BarSeries = {
    label: 'October',
    values: rows.map(({ key, october: value }) => ({ ...money(value), href: `#transactions?${by}=${key}` })),
  };
  const september: BarSeries = {
    label: 'September',
    look: 'hatched',
    values: rows.map(({ key, september: value }) => ({
      ...money(value),
      href: `#transactions?${by}=${key}&period=2026-09`,
    })),
  };
  const name = by.charAt(0).toUpperCase() + by.slice(1);
  return {
    title: `Spending by ${by}`,
    note: compare ? 'October, against September' : 'October',
    chart: {
      categories: rows.map((each) => each.name),
      // A ranked list reads by its amounts at the end, so it draws no gridlines.
      orientation: 'horizontal',
      series: compare ? [october, september] : [october],
    },
    linkBy: by,
    columns: compare ? [name, 'October', 'September'] : [name, 'October'],
    rows: rows.map((each) => ({
      key: each.key,
      name: each.name,
      figures: (compare ? [each.october, each.september] : [each.october]).map(dollars),
    })),
  };
}

/**
 * The table's columns: the band's name as the row header, then its figures, aligned at the end. On a phone each
 * row is an item with its first figure at the end; the chart above it carries the rest.
 */
const columnsOf = (names: string[]): DataTableColumn<Row>[] =>
  names.map((header, index) =>
    index === 0
      ? { id: 'name', header, cell: (row) => row.name, isRowHeader: true }
      : {
          id: header,
          header,
          cell: (row) => row.figures[index - 1],
          align: 'end',
          listSlot: index === 1 ? 'end' : 'hidden',
        },
  );

interface InsightsProps {
  view: View;
  onView?: (view: View) => void;
  /** The router's navigate, the RouterProvider's own, for the chart's links: the charts cannot read the provider. */
  navigate?: (href: string) => void;
}

/** The page above the report: header, tiles, filters, the chart card and the table under it. */
function Insights({ view, onView, navigate }: InsightsProps): ReactElement {
  const titleId = useId();
  const noteId = useId();
  // The period is your query's; the fixtures hold October against September, so the chip only keeps its choice.
  const [period, setPeriod] = useState<Key | null>('2026-10');
  const comparing = view.compare && canCompare(view);
  const drawn = view.by === 'month' ? monthView(view.show, comparing) : rankedView(view.by, comparing);
  const change = (patch: Partial<View>): void => {
    onView?.({ ...view, ...patch });
  };
  return (
    <div className="stack" style={{ width: '100%', minWidth: 0 }}>
      {/* An example on a docs page, which has its own h1; the app's own header keeps the default, 1. */}
      <PageHeader
        headingLevel={2}
        title="Insights"
        description="Where October's money went, account by account."
      />
      {/* The summary: each figure's change against September is drawn while the page compares. */}
      <div className="tile-row">
        <StatTile
          label="Spent"
          value={dollars(4220)}
          caption="October"
          change={comparing ? { direction: 'up', label: 'Up $415 vs September' } : undefined}
        />
        <StatTile
          label="Income"
          value={dollars(5200)}
          caption="October"
          change={comparing ? { direction: 'flat', label: 'Same as September' } : undefined}
        />
        <StatTile
          label="Net"
          value={dollars(980)}
          caption="October"
          change={comparing ? { direction: 'down', label: 'Down $415 vs September' } : undefined}
        />
      </div>
      <FilterBar>
        <FilterChip label="Period" selectionMode="single" value={period} onChange={setPeriod}>
          <PickerOption id="2026-10">October 2026</PickerOption>
          <PickerOption id="2026-09">September 2026</PickerOption>
          <PickerOption id="2026-q3">July to September 2026</PickerOption>
        </FilterChip>
      </FilterBar>
      <Card as="section" aria-labelledby={titleId}>
        <CardHeader>
          <CardTitle id={titleId} level={3}>
            {drawn.title}
          </CardTitle>
          <CardNote id={noteId}>{drawn.note}</CardNote>
          {/* The two controls on one line, from the start, wrapping where the card is narrow. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-part)' }}>
            <SegmentedControl
              aria-label="Group by"
              size="sm"
              value={view.by}
              onChange={(by) => {
                change({ by: by as Grouping });
              }}
            >
              <SegmentedControlItem value="month">Month</SegmentedControlItem>
              <SegmentedControlItem value="category">Category</SegmentedControlItem>
              <SegmentedControlItem value="merchant">Merchant</SegmentedControlItem>
              <SegmentedControlItem value="account">Account</SegmentedControlItem>
            </SegmentedControl>
            {view.by === 'month' ? (
              <SegmentedControl
                aria-label="Show"
                size="sm"
                value={view.show}
                onChange={(show) => {
                  change({ show: show as Show });
                }}
              >
                <SegmentedControlItem value="both">Both</SegmentedControlItem>
                <SegmentedControlItem value="spending">Spending</SegmentedControlItem>
                <SegmentedControlItem value="income">Income</SegmentedControlItem>
                <SegmentedControlItem value="net">Net</SegmentedControlItem>
                <SegmentedControlItem value="mix">Mix</SegmentedControlItem>
              </SegmentedControl>
            ) : null}
          </div>
          <Switch
            isSelected={comparing}
            isDisabled={!canCompare(view)}
            description={canCompare(view) ? undefined : 'Choose Spending, Income or Net to compare.'}
            onChange={(compare) => {
              change({ compare });
            }}
          >
            Compare to previous period
          </Switch>
        </CardHeader>
        {/* One chart for every grouping: new props, never a new chart, so a focused bar hands focus on. */}
        <BarChart {...drawn.chart} aria-labelledby={`${titleId} ${noteId}`} navigate={navigate} />
      </Card>
      <DataTable
        aria-label={`Transactions by ${view.by}`}
        items={drawn.rows}
        columns={columnsOf(drawn.columns)}
        getKey={(row) => row.key}
        getRowHref={(row) => `#transactions?${drawn.linkBy}=${row.key}`}
      />
    </div>
  );
}

/** The view the URL names, kept in state so a control answers at once while the URL catches up. */
function InsightsFromUrl({ navigate }: Pick<InsightsProps, 'navigate'>): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const [view, setView] = useState(() => viewOf(new URLSearchParams(key)));
  const [seen, setSeen] = useState(key);
  // The URL changed under the page, by Back or Forward: draw its view.
  if (key !== seen) {
    setSeen(key);
    setView(viewOf(new URLSearchParams(key)));
  }
  return (
    <Insights
      view={view}
      navigate={navigate}
      onView={(next) => {
        const query = queryOf(next);
        setView(next);
        setSeen(query);
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }}
    />
  );
}

/** The first view: months, income beside spending, as the static page's server renders it. */
const FIRST = viewOf(new URLSearchParams());

/**
 * The Insights page's client part: everything but the month's report, which a server component renders beside
 * it. The grouping and the comparison live in the URL, so a link or a reload keeps them.
 */
export default function InsightsRecipe(): ReactElement {
  const router = useRouter();
  const navigate = (href: string): void => {
    router.push(href, { scroll: false });
  };
  return (
    // An app wraps its whole tree once; the example wraps only itself. The chart takes the same navigate.
    <RouterProvider navigate={navigate}>
      <Suspense fallback={<Insights view={FIRST} navigate={navigate} />}>
        <InsightsFromUrl navigate={navigate} />
      </Suspense>
    </RouterProvider>
  );
}
