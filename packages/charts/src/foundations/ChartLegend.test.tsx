import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { ChartLegend } from './ChartLegend';

describe('ChartLegend', () => {
  it("draws LineChart's legend: a list of keys and labels, each item numbered by its series", () => {
    expect(
      renderToStaticMarkup(
        <ChartLegend
          block="line-chart"
          items={[
            { label: 'This month', series: 1 },
            { label: 'Last month', series: 2 },
          ]}
        />,
      ),
    ).toBe(
      '<ul class="line-chart-legend">' +
        '<li class="line-chart-legend-item" data-series="1"><span class="line-chart-key" aria-hidden="true"></span>' +
        '<span class="line-chart-legend-label">This month</span></li>' +
        '<li class="line-chart-legend-item" data-series="2"><span class="line-chart-key" aria-hidden="true"></span>' +
        '<span class="line-chart-legend-label">Last month</span></li></ul>',
    );
  });

  it('writes the color and the look of a key when given, in the block it is given', () => {
    const { container } = render(
      <ChartLegend
        block="bar-chart"
        items={[
          { label: 'Income', color: 'gain', look: 'swatch' },
          { label: 'Last year', color: 'gain', look: 'hatched' },
        ]}
      />,
    );
    const items = [...container.querySelectorAll('li.bar-chart-legend-item')];
    expect(items.map((item) => [item.getAttribute('data-color'), item.getAttribute('data-look')])).toEqual([
      ['gain', 'swatch'],
      ['gain', 'hatched'],
    ]);
    expect(items[0]).not.toHaveAttribute('data-series');
    expect(container.querySelectorAll('.bar-chart-key[aria-hidden="true"]')).toHaveLength(2);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <ChartLegend block="line-chart" items={[{ label: 'This month', series: 1 }]} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
