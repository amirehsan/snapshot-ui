import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { ChartTable, type ChartTableProps } from './ChartTable';

const LABELS = {
  showTable: 'Show as table',
  showChart: 'Show as chart',
  noScript: "Scripts are off, so the chart's data is in the table below.",
};

const VALUES: Record<string, readonly (string | undefined)[]> = {
  'Oct 1': ['$12.00', '$20.00'],
  'Oct 2': [undefined, '$35.00'],
};

const ROWS = Object.keys(VALUES);

/** A total per row, for a chart whose table ends in a total column, as a stack's does. */
const TOTALS = ['$32.00', '$35.00'];

/** The table of two months, as LineChart draws it, in a figure as LineChart holds it. */
const Table = (props: Partial<ChartTableProps>): ReactElement => (
  <figure>
    <ChartTable
      block="line-chart"
      columns={['This month', 'Last month']}
      rows={ROWS}
      cell={(row, column) => VALUES[ROWS[row] ?? '']?.[column]}
      id={(row, column) => (row < 0 ? `chart-series-${String(column + 1)}` : undefined)}
      name={{ label: 'Spending in October' }}
      view="chart"
      labels={LABELS}
      onToggle={() => undefined}
      {...props}
    />
  </figure>
);

/** Each cell of a table as [tag, text, scope, id]. */
const cellsOf = (table: HTMLTableElement): (string | null)[][][] =>
  [...table.rows].map((row) =>
    [...row.cells].map((cell) => [
      cell.tagName,
      cell.textContent,
      cell.getAttribute('scope'),
      cell.id || null,
    ]),
  );

describe('ChartTable', () => {
  it('draws the markup LineChart draws: a corner cell, column and row headers, a cell per value, captioned', () => {
    const { container } = render(<Table />);
    const table = container.querySelector('table');
    if (!(table instanceof HTMLTableElement)) throw new Error('No table');
    expect(table).toHaveClass('line-chart-table');
    expect(table).toHaveAttribute('hidden');
    expect(table).not.toHaveAttribute('aria-labelledby');
    expect(table.caption?.textContent).toBe('Spending in October');
    expect(cellsOf(table)).toEqual([
      [
        ['TD', '', null, null],
        ['TH', 'This month', 'col', 'chart-series-1'],
        ['TH', 'Last month', 'col', 'chart-series-2'],
      ],
      [
        ['TH', 'Oct 1', 'row', null],
        ['TD', '$12.00', null, null],
        ['TD', '$20.00', null, null],
      ],
      [
        ['TH', 'Oct 2', 'row', null],
        ['TD', '', null, null],
        ['TD', '$35.00', null, null],
      ],
    ]);
    // The toggle follows the table, in its toolbar, then the noscript note, which a client render leaves empty.
    const toggle = screen.getByRole('button', { name: 'Show as table' });
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveClass('button', 'button-tertiary', 'line-chart-toggle');
    expect(toggle.parentElement).toHaveClass('line-chart-toolbar');
    expect(toggle.parentElement?.previousElementSibling).toBe(table);
    expect(toggle.parentElement?.nextElementSibling?.tagName).toBe('NOSCRIPT');
  });

  it('is shown in the table view, named by aria-labelledby with no caption, and toggles back by its label', async () => {
    const onToggle = vi.fn();
    const { container } = render(
      <>
        <h2 id="heading">Spending</h2>
        <Table view="table" name={{ labelledBy: 'heading' }} onToggle={onToggle} />
      </>,
    );
    const table = screen.getByRole('table', { name: 'Spending' });
    expect(table).not.toHaveAttribute('hidden');
    expect(table).toHaveAttribute('aria-labelledby', 'heading');
    expect(container.querySelector('caption')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show as chart' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('writes a total column as its last column, and an id for every header and cell it is given one for', () => {
    const { container } = render(
      <Table
        block="bar-chart"
        columns={['This month', 'Last month', 'Total']}
        cell={(row, column) => (column === 2 ? TOTALS[row] : VALUES[ROWS[row] ?? '']?.[column])}
        id={(row, column) =>
          row < 0
            ? `c${String(column)}`
            : column < 0
              ? `r${String(row)}`
              : `r${String(row)}c${String(column)}`
        }
      />,
    );
    const table = container.querySelector('table');
    if (!(table instanceof HTMLTableElement)) throw new Error('No table');
    expect(table).toHaveClass('bar-chart-table');
    expect(cellsOf(table)).toEqual([
      [
        ['TD', '', null, null],
        ['TH', 'This month', 'col', 'c0'],
        ['TH', 'Last month', 'col', 'c1'],
        ['TH', 'Total', 'col', 'c2'],
      ],
      [
        ['TH', 'Oct 1', 'row', 'r0'],
        ['TD', '$12.00', null, 'r0c0'],
        ['TD', '$20.00', null, 'r0c1'],
        ['TD', '$32.00', null, 'r0c2'],
      ],
      [
        ['TH', 'Oct 2', 'row', 'r1'],
        ['TD', '', null, 'r1c0'],
        ['TD', '$35.00', null, 'r1c1'],
        ['TD', '$35.00', null, 'r1c2'],
      ],
    ]);
    expect(container.querySelector('.bar-chart-toolbar > .bar-chart-toggle')).not.toBeNull();
  });

  it('puts a shown copy with no ids in noscript, after the note, and the shown table before it', () => {
    const html = renderToStaticMarkup(
      <Table
        columns={['This month', 'Last month', 'Total']}
        cell={(row, column) => (column === 2 ? TOTALS[row] : VALUES[ROWS[row] ?? '']?.[column])}
        id={(row, column) => (row < 0 ? `c${String(column)}` : column < 0 ? `r${String(row)}` : undefined)}
      />,
    );
    const noscript = html.indexOf('<noscript>');
    expect(html.slice(noscript)).toBe(
      '<noscript><p class="line-chart-noscript">Scripts are off, so the chart&#x27;s data is in the table below.</p>' +
        '<table class="line-chart-table"><caption>Spending in October</caption><thead><tr><td></td>' +
        '<th scope="col">This month</th><th scope="col">Last month</th><th scope="col">Total</th></tr></thead>' +
        '<tbody><tr><th scope="row">Oct 1</th><td>$12.00</td><td>$20.00</td><td>$32.00</td></tr>' +
        '<tr><th scope="row">Oct 2</th><td></td><td>$35.00</td><td>$35.00</td></tr></tbody></table>' +
        '</noscript></figure>',
    );
    expect(html.slice(0, noscript)).toContain('<table class="line-chart-table" hidden="">');
    expect(html.slice(0, noscript)).toContain('<th scope="col" id="c2">Total</th>');
  });

  // One test per state, so each axe pass has its own time budget on a busy runner.
  it('draws no toggle, no note and no copy without hasToggle, and keeps the hidden table', () => {
    const html = renderToStaticMarkup(<Table hasToggle={false} />);
    expect(html).toContain('<table class="line-chart-table" hidden="">');
    expect([...html.matchAll(/<table/g)]).toHaveLength(1);
    for (const part of ['line-chart-toolbar', 'line-chart-toggle', '<noscript>', 'line-chart-noscript'])
      expect(html).not.toContain(part);
  });

  it.each(['chart', 'table'] as const)('has no axe violations in the %s view', async (view) => {
    const { container } = render(
      <div>
        <Table
          view={view}
          columns={['This month', 'Last month', 'Total']}
          cell={(row, column) => (column === 2 ? TOTALS[row] : VALUES[ROWS[row] ?? '']?.[column])}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
