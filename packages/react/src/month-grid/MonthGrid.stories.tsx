import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, waitFor } from 'storybook/test';
import { Card, CardBody, CardHeader, CardNote, CardTitle } from '../card';
import {
  COVERAGE_STATES,
  COVERAGE_YEARS,
  FIRST_YEAR,
  MONTH_NAMES,
  PERSIAN_LABELS,
  PERSIAN_MONTH_NAMES,
  PERSIAN_SHORT_MONTHS,
  PERSIAN_STATES,
  PERSIAN_SUMMARY,
  PERSIAN_YEARS,
  SHORT_MONTHS,
} from '../stories/coverage';
import { nestedCardPixels } from '../stories/corner';
import { MonthGrid, type MonthGridYear } from './MonthGrid';

/** Three years of the consumer's coverage, newest first. */
const THREE_YEARS: MonthGridYear[] = [...COVERAGE_YEARS, FIRST_YEAR];

/** A frame the grid takes the width of, as a card's body would give it. */
const FRAME: CSSProperties = { width: '100%', maxWidth: '40rem' };

const meta = {
  title: 'Components/MonthGrid',
  component: MonthGrid,
  // Padded, so a grid takes the canvas's width and shows quarter labels on a phone.
  parameters: { layout: 'padded' },
  args: {
    label: 'Statement coverage',
    states: COVERAGE_STATES,
    years: THREE_YEARS,
    monthLabels: SHORT_MONTHS,
    monthNames: MONTH_NAMES,
  },
  render: (args) => (
    <div style={FRAME}>
      <MonthGrid {...args} />
    </div>
  ),
} satisfies Meta<typeof MonthGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first element with this class inside `scope`, or every one of them. */
const part = (scope: ParentNode, name: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};
const parts = (scope: ParentNode, name: string): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>(`.${name}`),
];

/** The page scrolls sideways by this many px: 0 when everything fits the screen. */
const sideways = (): number => document.documentElement.scrollWidth - document.documentElement.clientWidth;

/** Runs a check in each shape and density, and puts the page's own back. */
async function inEveryTheme(
  themes: readonly (readonly [shape: string, density: string])[],
  check: (shape: string, density: string) => Promise<void>,
): Promise<void> {
  const root = document.documentElement;
  const { shape, density } = root.dataset;
  try {
    for (const [nextShape, nextDensity] of themes) {
      root.dataset.shape = nextShape;
      root.dataset.density = nextDensity;
      await check(nextShape, nextDensity);
    }
  } finally {
    root.dataset.shape = shape ?? 'rounded';
    root.dataset.density = density ?? 'comfortable';
  }
}

/** A screen 320px wide, the narrowest the consumer supports, for the play that looks for sideways scroll. */
const NARROW = {
  globals: { viewport: { value: 'narrow' } },
  parameters: {
    viewport: { options: { narrow: { name: 'Narrow phone', styles: { width: '320px', height: '640px' } } } },
  },
} as const;

/**
 * Three years of the consumer's coverage, newest first: 2026 up to October, the rest not yet come and blank;
 * 2025 with March and April missing and June partial; 2024 from March, when the account opened, with November
 * missing. The sentence under the grid says what is missing or partial, and the legend names the three states.
 */
export const Default: Story = {};

/** One year of each look, a year with months outside the range, and a state of the app's own mapped to a look. */
export const AllLooks: Story = {
  args: {
    states: [...COVERAGE_STATES, { id: 'closed', label: 'Closed', look: 'filled' }],
    years: [
      { id: 'held', label: 'Held', months: SHORT_MONTHS.map(() => 'held') },
      { id: 'partial', label: 'Partial', months: SHORT_MONTHS.map(() => 'partial') },
      { id: 'missing', label: 'Missing', months: SHORT_MONTHS.map(() => 'missing') },
      {
        id: 'outside',
        label: 'Outside',
        months: [null, null, null, 'held', 'partial', 'missing', 'closed', null, null, null, null, null],
      },
    ],
  },
};

/** In a 20rem frame, under 28rem of the grid's width: every third label from the first, the quarters. */
export const Narrow: Story = {
  render: (args) => (
    <div style={{ width: '20rem', maxWidth: '100%' }}>
      <MonthGrid {...args} />
    </div>
  ),
};

/** Eight years, newest first, with a gap here and there: a column of strips that stays a strip per year. */
export const ManyYears: Story = {
  args: {
    years: Array.from({ length: 8 }, (_, index) => {
      const year = 2026 - index;
      return {
        id: year,
        label: String(year),
        months: SHORT_MONTHS.map((_short, month) => {
          if (year === 2026 && month > 9) return null;
          if (year === 2019 && month < 4) return null;
          if ((year * 12 + month) % 17 === 0) return 'missing';
          if ((year * 12 + month) % 23 === 0) return 'partial';
          return 'held';
        }),
      };
    }),
  },
};

/**
 * The credit tab's coverage card: the card's note says what is missing, and the grid, named by the card's title,
 * ends the card's body, so the last year's December cell sits in the card's bottom end corner. A cell is a
 * text-sized part, 4px in Rounded and Soft and 0 in Square, sharper than the card's formula in every density, so
 * it keeps its corner and nothing moves.
 */
export const InCard: Story = {
  tags: ['density'],
  args: { label: undefined, 'aria-labelledby': 'coverage-title', hasLegend: false, summary: false },
  render: (args) => (
    <Card style={FRAME}>
      <CardHeader>
        <CardTitle id="coverage-title" level={3}>
          Statement coverage
        </CardTitle>
        <CardNote>Missing: March, April 2025; November 2024. Partial: June 2025.</CardNote>
      </CardHeader>
      <CardBody>
        <MonthGrid {...args} />
      </CardBody>
    </Card>
  ),
};

/** No legend, and a summary of the app's own that says what to do about the gap. */
export const NoLegendCustomSummary: Story = {
  args: {
    hasLegend: false,
    summary: 'Two statements are missing from 2025, and one from 2024. Upload them to complete your history.',
  },
};

/**
 * On a Persian page: Persian years and months, placed by the app, the year column and Farvardin at the right, the
 * app's own summary and table words. The hatch keeps its angle: it is a texture, not an arrow.
 */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={FRAME}>
        <MonthGrid
          label="صورت‌حساب‌ها"
          states={PERSIAN_STATES}
          years={PERSIAN_YEARS}
          monthLabels={PERSIAN_SHORT_MONTHS}
          monthNames={PERSIAN_MONTH_NAMES}
          summary={PERSIAN_SUMMARY}
          labels={PERSIAN_LABELS}
        />
      </div>
    </I18nProvider>
  ),
};

/**
 * The header shows every label from 28rem of the grid's own width and only the quarters under it, whatever the
 * viewport: in a frame 29rem wide all twelve show, and at 27rem only the first of each quarter. In three engines,
 * since each runs its own container queries.
 */
export const QuarterLabels: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => (
    <div data-testid="frame" style={{ width: '29rem' }}>
      <MonthGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = part(canvasElement, 'month-grid').parentElement;
    if (!frame) throw new Error('No frame');
    const shown = (): boolean[] =>
      parts(canvasElement, 'month-grid-month').map(
        (label) => getComputedStyle(label).visibility === 'visible',
      );
    try {
      await waitFor(() => expect(shown()).toEqual(SHORT_MONTHS.map(() => true)), { timeout: 5000 });
      frame.style.width = '27rem';
      await waitFor(
        () =>
          expect(shown()).toEqual([
            true,
            false,
            false,
            true,
            false,
            false,
            true,
            false,
            false,
            true,
            false,
            false,
          ]),
        { timeout: 5000 },
      );
      // The server's HTML holds all twelve: the query hides them, nothing removes them.
      await expect(parts(canvasElement, 'month-grid-month')).toHaveLength(12);
      frame.style.width = '29rem';
      await waitFor(() => expect(shown()).toEqual(SHORT_MONTHS.map(() => true)), { timeout: 5000 });
    } finally {
      frame.style.width = '29rem';
    }
  },
};

/**
 * The grid ending a Rounded card puts its last cell in the card's bottom end curve, comfortable and compact: the
 * cell's 4px corner is under the card's formula, 7px and 19px, so it keeps its own (a text-sized part), and it
 * really is in the curve, so the check means something. Soft keeps 4px under its 6px, and Square is square.
 */
export const CellsInTheCorner: Story = {
  tags: ['no-visual'],
  args: { label: undefined, 'aria-label': 'Statement coverage', hasLegend: false, summary: false },
  render: (args) => (
    <Card style={FRAME}>
      <CardBody>
        <MonthGrid {...args} />
      </CardBody>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const card = part(canvasElement, 'card');
    const last = parts(canvasElement, 'month-grid-cell').at(-1);
    if (!last) throw new Error('No cell');
    await inEveryTheme(
      [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
        ['soft', 'comfortable'],
        ['square', 'comfortable'],
      ],
      async (shape) => {
        const cardRadius = parseFloat(getComputedStyle(card).borderEndEndRadius);
        const radius = parseFloat(getComputedStyle(last).borderEndEndRadius);
        const formula = nestedCardPixels();
        await expect(radius).toBeCloseTo(shape === 'square' ? 0 : 4, 0);
        await expect(radius).toBeLessThanOrEqual(formula + 1);
        if (shape === 'rounded') {
          // In the curve: both gaps to the card's outer edge are under its radius.
          const outer = card.getBoundingClientRect();
          const box = last.getBoundingClientRect();
          await expect(outer.right - box.right).toBeLessThan(cardRadius);
          await expect(outer.bottom - box.bottom).toBeLessThan(cardRadius);
        }
      },
    );
  },
};

/**
 * On a 320px phone a size container takes its width from its holder, never from a stand-in (spec corrections 34
 * and 45): in a `flex: 1` wrapper, in a `1fr` grid and two up in a `1fr 1fr` grid, every grid fills its holder,
 * stays inside the page and draws its cells, and nothing scrolls sideways, in every shape. In three engines.
 */
export const OnANarrowPhone: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: NARROW.globals,
  parameters: { ...NARROW.parameters, layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-wrapper="flex" style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <MonthGrid {...args} />
        </div>
      </div>
      <div data-wrapper="grid" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <MonthGrid {...args} />
      </div>
      <div
        data-wrapper="two-up"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-part)' }}
      >
        <div>
          <MonthGrid {...args} aria-label="Everyday Visa" label={undefined} hasLegend={false} />
        </div>
        <div>
          <MonthGrid {...args} aria-label="Travel Mastercard" label={undefined} hasLegend={false} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    await inEveryTheme(
      [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
        ['soft', 'comfortable'],
        ['square', 'comfortable'],
      ],
      async () => {
        await waitFor(() => expect(sideways()).toBeLessThanOrEqual(0), { timeout: 5000 });
        for (const wrapper of parts(canvasElement, 'month-grid').map((grid) => grid.parentElement)) {
          if (!wrapper) throw new Error('No wrapper');
          const grid = part(wrapper, 'month-grid');
          const box = grid.getBoundingClientRect();
          const holder = wrapper.getBoundingClientRect();
          await expect(box.right).toBeLessThanOrEqual(holder.right + 1);
          await expect(box.left).toBeGreaterThanOrEqual(holder.left - 1);
          // Not collapsed: the grid fills its holder, and every cell is drawn.
          await expect(box.width).toBeGreaterThanOrEqual(holder.width - 1);
          for (const cell of parts(grid, 'month-grid-cell'))
            await expect(cell.getBoundingClientRect().width).toBeGreaterThan(0);
          await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
        }
      },
    );
  },
};
