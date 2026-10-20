import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LineChart, type LineSeries } from './LineChart';

/*
 * LineChart's active position across new props, through the shared useChartActive. Kept apart from
 * LineChart.test.tsx, which the foundations move left byte for byte as it was.
 */

const DAYS = ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5'];

const MONTH: LineSeries = {
  label: 'This month',
  points: [12, 40, 84.2, 61, 90].map((value) => ({ value, valueLabel: `$${value.toFixed(2)}` })),
};

describe('LineChart, its active position', () => {
  it('draws no readout and no crosshair for a position new props took away, and a key starts again at the newest', () => {
    const { container, rerender } = render(
      <LineChart aria-label="Spending" series={[MONTH]} xLabels={DAYS} />,
    );
    const plot = container.querySelector<HTMLElement>('.line-chart-plot');
    if (!plot) throw new Error('No plot');
    act(() => {
      plot.focus();
    });
    expect(container.querySelector('.line-chart-readout-x')?.textContent).toBe('Oct 5');
    expect(container.querySelector('.line-chart-crosshair')).not.toBeNull();

    // Fewer days: Oct 5 is gone while it is active.
    rerender(<LineChart aria-label="Spending" series={[MONTH]} xLabels={DAYS.slice(0, 3)} />);
    expect(container.querySelector('.line-chart-readout')).toBeNull();
    expect(container.querySelector('.line-chart-crosshair')).toBeNull();
    expect(container.querySelector('.line-chart-dot')).toBeNull();
    expect(plot).not.toHaveAttribute('data-active');

    // A key from a position that is not current starts at the newest with data, as focus would have.
    fireEvent.keyDown(plot, { key: 'ArrowLeft' });
    expect(container.querySelector('.line-chart-readout-x')?.textContent).toBe('Oct 3');
  });
});
