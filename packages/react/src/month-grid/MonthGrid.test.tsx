import { render, screen, within } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { MonthGrid, type MonthGridState, type MonthGridYear } from './MonthGrid';

/** The consumer's states: held statements filled, partial ones hatched, missing ones outlined. */
const HELD: MonthGridState = { id: 'held', label: 'Held', look: 'filled' };
const PARTIAL: MonthGridState = { id: 'partial', label: 'Partial', look: 'partial' };
const MISSING: MonthGridState = { id: 'missing', label: 'Missing', look: 'empty' };
const STATES = [HELD, PARTIAL, MISSING];

const NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const H = 'held';
const P = 'partial';
const M = 'missing';

/** Two years, newest first: 2026 up to October and the rest not yet come, 2025 with a gap and a partial month. */
const THIS_YEAR: MonthGridYear = {
  id: 2026,
  label: '2026',
  months: [H, H, H, H, H, H, H, H, H, H, null, null],
};
const YEARS: MonthGridYear[] = [
  THIS_YEAR,
  { id: 2025, label: '2025', months: [H, H, M, M, H, P, H, H, H, H, H, H] },
];

/** The consumer's grid. */
const coverage = (props: Partial<Parameters<typeof MonthGrid>[0]> = {}): ReactElement => (
  <MonthGrid
    label="Statement coverage"
    states={STATES}
    years={YEARS}
    monthLabels={SHORT}
    monthNames={NAMES}
    {...props}
  />
);

/** An element by its class, or an error. */
const part = (container: ParentNode, name: string): HTMLElement => {
  const element = container.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** The tag and class of each child of an element, in order. */
const children = (element: Element): string[] =>
  [...element.children].map((child) => `${child.tagName.toLowerCase()}.${child.getAttribute('class') ?? ''}`);

/** The looks of the cells, row by row. */
const looks = (container: HTMLElement): (string | null)[] =>
  [...container.querySelectorAll('.month-grid-cell')].map((cell) => cell.getAttribute('data-look'));

/** The Persian grid: Persian years, months and words, and the app's own summary. */
const PERSIAN_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];
const PERSIAN_SHORT = ['فر', 'ار', 'خر', 'تی', 'مر', 'شه', 'مه', 'آب', 'آذ', 'دی', 'به', 'اس'];
const persian = (
  <div dir="rtl" lang="fa">
    <MonthGrid
      label="صورت‌حساب‌ها"
      states={[
        { id: 'held', label: 'موجود', look: 'filled' },
        { id: 'missing', label: 'ناموجود', look: 'empty' },
      ]}
      years={[
        { id: 1404, label: '۱۴۰۴', months: [H, H, M, M, H, H, H, null, null, null, null, null] },
        { id: 1403, label: '۱۴۰۳', months: [null, null, null, H, H, H, H, H, H, H, H, H] },
      ]}
      monthLabels={PERSIAN_SHORT}
      monthNames={PERSIAN_NAMES}
      summary="ناموجود: خرداد و تیر ۱۴۰۴."
      labels={{ year: 'سال', outside: 'خارج از بازه' }}
    />
  </div>
);

describe('MonthGrid', () => {
  it('draws its parts in reading order: the label, the grid, the summary, the table and the legend', () => {
    const { container } = render(coverage());
    const figure = root(container);
    expect(figure.tagName).toBe('FIGURE');
    expect(figure).toHaveClass('month-grid');
    expect(children(figure)).toEqual([
      'span.month-grid-label',
      'div.month-grid-grid',
      'p.month-grid-summary',
      'div.month-grid-alternative',
      'ul.month-grid-legend',
    ]);
    expect(children(part(container, 'month-grid-alternative'))).toEqual(['table.month-grid-table']);
  });

  it('draws a header of short labels and a row per year, a cell per month with its look', () => {
    const { container } = render(coverage());
    const grid = part(container, 'month-grid-grid');
    expect(children(grid)).toEqual([
      'span.month-grid-corner',
      ...SHORT.map(() => 'span.month-grid-month'),
      'span.month-grid-year',
      ...Array.from({ length: 12 }, () => 'span.month-grid-cell'),
      'span.month-grid-year',
      ...Array.from({ length: 12 }, () => 'span.month-grid-cell'),
    ]);
    expect([...grid.querySelectorAll('.month-grid-month')].map((label) => label.textContent)).toEqual(SHORT);
    expect([...grid.querySelectorAll('.month-grid-year')].map((label) => label.textContent)).toEqual([
      '2026',
      '2025',
    ]);
    const F = 'filled';
    expect(looks(container)).toEqual([
      ...[F, F, F, F, F, F, F, F, F, F, 'none', 'none'],
      ...[F, F, 'empty', 'empty', F, 'partial', F, F, F, F, F, F],
    ]);
    // The cells are empty boxes: their state is a shape here, and words in the table and the summary.
    for (const cell of grid.querySelectorAll('.month-grid-cell')) expect(cell).toBeEmptyDOMElement();
  });

  it('draws none for null and for an id no state has', () => {
    const { container } = render(
      coverage({ years: [{ id: 'one', label: '2025', months: [null, 'closed', H, ''] }] }),
    );
    expect(looks(container)).toEqual(['none', 'none', 'filled', 'none']);
    // The table says the same: a month outside the range, or in no state the grid knows, is not in range.
    const cells = within(part(container, 'month-grid-table')).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toEqual([
      'Not in range',
      'Not in range',
      'Held',
      'Not in range',
    ]);
  });

  it('marks every third month label from the first as a quarter', () => {
    const { container } = render(coverage());
    const quarters = [...container.querySelectorAll('.month-grid-month')].map((label) =>
      label.hasAttribute('data-quarter'),
    );
    expect(quarters).toEqual([
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
    ]);
  });

  it('writes --month-grid-columns from the label count', () => {
    const { container, rerender } = render(coverage());
    expect(part(container, 'month-grid-grid')).toHaveStyle({ '--month-grid-columns': '12' });
    // Half of them, rounded up, for the narrow layout's two rows a year.
    expect(part(container, 'month-grid-grid')).toHaveStyle({ '--month-grid-half': '6' });
    rerender(coverage({ monthLabels: SHORT.slice(0, 7), monthNames: NAMES.slice(0, 7) }));
    expect(part(container, 'month-grid-grid')).toHaveStyle({ '--month-grid-columns': '7' });
    expect(part(container, 'month-grid-grid')).toHaveStyle({ '--month-grid-half': '4' });
  });

  it('builds the hidden table: caption, Year and month names as column headers, years as row headers, state words in cells', () => {
    const { container } = render(coverage());
    const table = within(container).getByRole('table', { name: 'Statement coverage' });
    expect(table).toHaveClass('month-grid-table');
    expect(table.querySelector('caption')).toHaveTextContent('Statement coverage');
    const columns = within(table).getAllByRole('columnheader');
    expect(columns.map((header) => header.textContent)).toEqual(['Year', ...NAMES]);
    for (const header of columns) expect(header).toHaveAttribute('scope', 'col');
    const rows = within(table).getAllByRole('rowheader');
    expect(rows.map((header) => header.textContent)).toEqual(['2026', '2025']);
    for (const header of rows) expect(header).toHaveAttribute('scope', 'row');
    // The header row, then a row per year, each a row header and the state's word per month.
    const words = within(table)
      .getAllByRole('row')
      .map((row) =>
        within(row)
          .queryAllByRole('cell')
          .map((cell) => cell.textContent),
      );
    expect(words).toEqual([
      [],
      [...Array.from({ length: 10 }, () => 'Held'), 'Not in range', 'Not in range'],
      [
        'Held',
        'Held',
        'Missing',
        'Missing',
        'Held',
        'Partial',
        'Held',
        'Held',
        'Held',
        'Held',
        'Held',
        'Held',
      ],
    ]);

    // The app's words for the year column and a month outside the range.
    const { container: other } = render(
      coverage({ labels: { year: 'Statement year', outside: 'Not open' } }),
    );
    const otherTable = within(other).getByRole('table');
    expect(within(otherTable).getAllByRole('columnheader')[0]).toHaveTextContent('Statement year');
    expect(within(otherTable).getAllByRole('cell')[10]).toHaveTextContent('Not open');
  });

  it('names the figure by its label, its aria-label or its aria-labelledby, and the table the same', () => {
    const { container, unmount } = render(coverage());
    const figure = screen.getByRole('figure', { name: 'Statement coverage' });
    expect(figure).toHaveAttribute('aria-labelledby', part(container, 'month-grid-label').id);
    // The visible label is hidden, since it names the figure; it is not read a second time.
    expect(part(container, 'month-grid-label')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('table')).toHaveAccessibleName('Statement coverage');
    unmount();

    // An aria-label names the figure and is the table's caption, since nothing shows it.
    const { container: labelled, unmount: unmountLabelled } = render(
      coverage({ label: undefined, 'aria-label': 'Statement coverage, Everyday Visa' }),
    );
    expect(labelled.querySelector('.month-grid-label')).toBeNull();
    expect(screen.getByRole('figure')).toHaveAccessibleName('Statement coverage, Everyday Visa');
    expect(screen.getByRole('figure')).not.toHaveAttribute('aria-labelledby');
    expect(labelled.querySelector('caption')).toHaveTextContent('Statement coverage, Everyday Visa');
    expect(screen.getByRole('table')).toHaveAccessibleName('Statement coverage, Everyday Visa');
    unmountLabelled();

    // A name shown elsewhere: the figure and the table both point at it, and the table has no caption.
    const { container: pointed } = render(
      <>
        <h3 id="coverage-heading">Statement coverage</h3>
        {coverage({ label: undefined, 'aria-labelledby': 'coverage-heading' })}
      </>,
    );
    expect(screen.getByRole('figure')).toHaveAttribute('aria-labelledby', 'coverage-heading');
    expect(screen.getByRole('figure')).toHaveAccessibleName('Statement coverage');
    expect(screen.getByRole('table')).toHaveAttribute('aria-labelledby', 'coverage-heading');
    expect(screen.getByRole('table')).toHaveAccessibleName('Statement coverage');
    expect(pointed.querySelector('caption')).toBeNull();
  });

  it("draws the English summary by default, the app's summary when given, and none for false", () => {
    const { container, rerender } = render(coverage());
    expect(part(container, 'month-grid-summary')).toHaveTextContent(
      'Missing: March and April 2025. Partial: June 2025.',
    );
    rerender(
      coverage({
        summary: (
          <>
            Two statements are missing. <a href="#upload">Upload them</a>
          </>
        ),
      }),
    );
    expect(part(container, 'month-grid-summary')).toHaveTextContent(
      'Two statements are missing. Upload them',
    );
    expect(within(part(container, 'month-grid-summary')).getByRole('link')).toHaveAttribute(
      'href',
      '#upload',
    );
    rerender(coverage({ summary: false }));
    expect(container.querySelector('.month-grid-summary')).toBeNull();
    // Nothing missing or partial says so in the first filled state's words.
    rerender(coverage({ years: [{ id: 2024, label: '2024', months: NAMES.map(() => H) }] }));
    expect(part(container, 'month-grid-summary')).toHaveTextContent('Held: every month.');
    // No month in any state has nothing to say, so no paragraph.
    rerender(coverage({ years: [{ id: 2027, label: '2027', months: NAMES.map(() => null) }] }));
    expect(container.querySelector('.month-grid-summary')).toBeNull();
  });

  it('lists only the states some month holds in the legend, in the order given, and none without hasLegend', () => {
    const { container, rerender } = render(coverage({ states: [MISSING, HELD, PARTIAL] }));
    const legend = part(container, 'month-grid-legend');
    expect([...legend.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'Missing',
      'Held',
      'Partial',
    ]);
    expect(
      [...legend.querySelectorAll('.month-grid-swatch')].map((swatch) => swatch.getAttribute('data-look')),
    ).toEqual(['empty', 'filled', 'partial']);
    for (const item of legend.querySelectorAll('li'))
      expect(children(item)[0]).toBe('span.month-grid-swatch');

    // A year with nothing partial leaves Partial out; a state no month holds is not in the legend.
    rerender(coverage({ years: [THIS_YEAR] }));
    expect(
      [...part(container, 'month-grid-legend').querySelectorAll('li')].map((item) => item.textContent),
    ).toEqual(['Held']);
    rerender(coverage({ hasLegend: false }));
    expect(container.querySelector('.month-grid-legend')).toBeNull();
  });

  it('hides the visible grid and the legend from assistive technology', () => {
    const { container } = render(coverage());
    expect(part(container, 'month-grid-grid')).toHaveAttribute('aria-hidden', 'true');
    expect(part(container, 'month-grid-legend')).toHaveAttribute('aria-hidden', 'true');
    // The summary and the table are read; the table is clipped from sight by the stylesheet, not hidden.
    expect(part(container, 'month-grid-summary')).not.toHaveAttribute('aria-hidden');
    expect(part(container, 'month-grid-alternative')).not.toHaveAttribute('aria-hidden');
    expect(screen.getAllByRole('table')).toHaveLength(1);
  });

  it("is described by its summary, after the caller's own description, and by nothing when there is none", () => {
    const { container, rerender } = render(coverage());
    const figure = root(container);
    const summary = part(container, 'month-grid-summary');
    expect(figure).toHaveAttribute('aria-describedby', summary.id);
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      'Missing: March and April 2025. Partial: June 2025.',
    );
    rerender(
      <>
        <p id="coverage-note">From your bank feed.</p>
        {coverage({ 'aria-describedby': 'coverage-note' })}
      </>,
    );
    expect(screen.getByRole('figure')).toHaveAttribute(
      'aria-describedby',
      `coverage-note ${part(container, 'month-grid-summary').id}`,
    );
    rerender(coverage({ summary: false }));
    expect(screen.getByRole('figure')).not.toHaveAttribute('aria-describedby');
  });

  it('passes className, ref and the rest props to the figure', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <MonthGrid
        label="Statement coverage"
        states={STATES}
        years={YEARS}
        monthLabels={SHORT}
        monthNames={NAMES}
        ref={ref}
        className="extra"
        id="coverage"
        data-testid="grid"
        style={{ maxWidth: '40rem' }}
      />,
    );
    const figure = root(container);
    expect(ref.current).toBe(figure);
    expect(figure).toHaveAttribute('class', 'month-grid extra');
    expect(figure).toHaveAttribute('id', 'coverage');
    expect(figure).toHaveAttribute('data-testid', 'grid');
    expect(figure).toHaveAttribute('style', 'max-width: 40rem;');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('MonthGrid');
  });

  it('requires a name, a known look and state ids in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a grid with no label, aria-label or aria-labelledby has no name
    const unnamed = <MonthGrid states={STATES} years={YEARS} monthLabels={SHORT} monthNames={NAMES} />;
    // @ts-expect-error the looks are shapes, not the app's states: 'missing' is a state, mapped to 'empty'
    const missing: MonthGridState = { id: 'missing', label: 'Missing', look: 'missing' };
    // @ts-expect-error a month is a state's id or null, never a number
    const counted: MonthGridYear = { id: 2025, label: '2025', months: [1, 2, 3] };
    expect([unnamed, missing, counted].every(Boolean)).toBe(true);
  });

  const AXE_CASES: [string, ReactElement][] = [
    [
      "three years of the consumer's states",
      coverage({
        years: [...YEARS, { id: 2024, label: '2024', months: [M, H, H, H, H, H, H, H, H, P, H, H] }],
      }),
    ],
    [
      'outside months',
      coverage({
        years: [
          {
            id: 2026,
            label: '2026',
            months: [H, H, H, null, null, null, null, null, null, null, null, null],
          },
          { id: 2025, label: '2025', months: [null, null, null, null, null, null, null, null, H, H, M, H] },
        ],
      }),
    ],
    ['a Persian grid with its own summary', persian],
    ['no legend', coverage({ hasLegend: false, 'aria-label': 'Statement coverage', label: undefined })],
  ];

  it.each(AXE_CASES)('has no axe violations: %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});
