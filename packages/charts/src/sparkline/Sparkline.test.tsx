import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { linePath } from '../foundations/path';
import { Sparkline } from './Sparkline';

/** The element a render put first in its container: the sparkline's root. */
const root = (container: HTMLElement): HTMLElement => {
  const element = container.firstElementChild;
  if (!(element instanceof HTMLElement)) throw new Error('Nothing rendered');
  return element;
};

/** The `d` of the path with this class, or null when there is none. */
const d = (container: HTMLElement, name: string): string | null =>
  container.querySelector(`path.${name}`)?.getAttribute('d') ?? null;

const endPoint = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>('.sparkline-end');

describe('Sparkline', () => {
  it('is hidden from assistive technology by default', () => {
    const { container } = render(<Sparkline data={[10, 20, 15]} />);
    const element = root(container);
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveClass('sparkline');
    expect(element).toHaveAttribute('aria-hidden', 'true');
    expect(element).not.toHaveAttribute('role');
    expect(screen.queryByRole('img')).toBeNull();

    // The drawing is the plot's svg, stretched, and hidden itself as well.
    const plot = element.firstElementChild;
    expect(plot).toHaveClass('sparkline-plot');
    const svg = plot?.firstElementChild;
    expect(svg?.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('is an img named by aria-label, or by aria-labelledby', () => {
    const { container, rerender } = render(
      <Sparkline data={[10, 20, 15]} aria-label="Spending, last 30 days, rising" />,
    );
    const named = screen.getByRole('img', { name: 'Spending, last 30 days, rising' });
    expect(named).toBe(root(container));
    expect(named).not.toHaveAttribute('aria-hidden');

    rerender(
      <>
        <h2 id="spending-heading">Spending this month</h2>
        <Sparkline data={[10, 20, 15]} aria-labelledby="spending-heading" />
      </>,
    );
    const labelled = screen.getByRole('img', { name: 'Spending this month' });
    expect(labelled).toHaveClass('sparkline');
    expect(labelled).not.toHaveAttribute('aria-label');

    // Both given: aria-labelledby wins, as it does in the accessible name computation, and only it is written.
    rerender(
      <>
        <h2 id="spending-heading">Spending this month</h2>
        <Sparkline data={[10, 20, 15]} aria-label="Spending" aria-labelledby="spending-heading" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Spending this month' })).not.toHaveAttribute('aria-label');
  });

  it('never becomes an unnamed image: a blank name falls back to the other, and with none it hides', () => {
    const { container, rerender } = render(
      <Sparkline data={[10, 20, 15]} aria-label="Spending, rising" aria-labelledby=" " />,
    );
    expect(screen.getByRole('img', { name: 'Spending, rising' })).toBe(root(container));
    expect(root(container)).not.toHaveAttribute('aria-labelledby');

    rerender(<Sparkline data={[10, 20, 15]} aria-label="" />);
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).not.toHaveAttribute('role');
    expect(root(container)).not.toHaveAttribute('aria-label');

    rerender(<Sparkline data={[10, 20, 15]} aria-label="  " aria-labelledby="" />);
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).not.toHaveAttribute('role');

    // Hidden, a caller's role never sits beside aria-hidden.
    rerender(<Sparkline data={[10, 20, 15]} role="img" />);
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).not.toHaveAttribute('role');
  });

  it('draws the line through the data extent, oldest at x 0 and newest at x 100', () => {
    const { container } = render(<Sparkline data={[10, 20, 15]} />);
    const expected = linePath([
      { x: 0, y: 100 },
      { x: 50, y: 0 },
      { x: 100, y: 50 },
    ]);
    expect(expected).toBe('M0 100L50 0L100 50');
    expect(d(container, 'sparkline-line')).toBe(expected);
    // The domain is the extent, not from zero: a series far from zero still fills the box.
    const { container: high } = render(<Sparkline data={[1000, 1010, 1005]} />);
    expect(d(high, 'sparkline-line')).toBe(expected);
  });

  it('draws a flat series at mid-height', () => {
    const { container } = render(<Sparkline data={[7, 7, 7]} />);
    expect(d(container, 'sparkline-line')).toBe('M0 50L50 50L100 50');
    expect(endPoint(container)?.style.top).toBe('50%');
  });

  it('marks the last point with a dot by default, and draws none with hasEndPoint false', () => {
    const { container, rerender } = render(<Sparkline data={[10, 20, 15]} />);
    const dot = endPoint(container);
    // Inside the plot, after the svg, so it sits over the drawing in the plot's box.
    expect(dot?.parentElement).toHaveClass('sparkline-plot');
    expect(dot?.previousElementSibling?.tagName.toLowerCase()).toBe('svg');
    expect(dot?.style.insetInlineStart).toBe('100%');
    expect(dot?.style.top).toBe('50%');

    rerender(<Sparkline data={[10, 20, 15]} hasEndPoint={false} />);
    expect(endPoint(container)).toBeNull();
    expect(d(container, 'sparkline-line')).toBe('M0 100L50 0L100 50');
  });

  it('fills under the line with hasArea, down to the bottom of the box', () => {
    const { container, rerender } = render(<Sparkline data={[10, 20, 15]} />);
    expect(container.querySelector('.sparkline-area')).toBeNull();

    rerender(<Sparkline data={[10, 20, 15]} hasArea />);
    expect(d(container, 'sparkline-area')).toBe('M0 100L0 100L50 0L100 50L100 100Z');
    // The area is drawn first, so the line lies over it.
    const paths = [...container.querySelectorAll('svg path')].map((path) => path.getAttribute('class'));
    expect(paths).toEqual(['sparkline-area', 'sparkline-line']);
  });

  it('draws no line and no dot for no data, and only a dot at the middle for one value', () => {
    const { container, rerender } = render(<Sparkline data={[]} hasArea />);
    expect(container.querySelector('.sparkline svg')).not.toBeNull();
    expect(container.querySelector('path')).toBeNull();
    expect(endPoint(container)).toBeNull();

    rerender(<Sparkline data={[42]} hasArea />);
    expect(container.querySelector('path')).toBeNull();
    expect(endPoint(container)?.style.insetInlineStart).toBe('50%');
    expect(endPoint(container)?.style.top).toBe('50%');
  });

  it('breaks the line at a value that is not a finite number, and marks the last value only when it is one', () => {
    const { container, rerender } = render(<Sparkline data={[10, Number.NaN, 20, 15]} />);
    // x is still each value's place in the series; the gap starts a new subpath.
    expect(d(container, 'sparkline-line')).toBe('M0 100L0 100M66.667 0L100 50');
    expect(endPoint(container)?.style.insetInlineStart).toBe('100%');

    rerender(<Sparkline data={[10, 20, Number.POSITIVE_INFINITY]} />);
    expect(d(container, 'sparkline-line')).toBe('M0 100L50 0');
    expect(endPoint(container)).toBeNull();

    rerender(<Sparkline data={[Number.NaN, Number.NaN]} />);
    expect(container.querySelector('path')).toBeNull();
    expect(endPoint(container)).toBeNull();
  });

  it('passes className, ref and attributes to the root', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Sparkline
        data={[10, 20, 15]}
        ref={ref}
        className="extra"
        id="trend"
        data-testid="sparkline"
        style={{ width: '20rem' }}
      />,
    );
    const element = root(container);
    expect(ref.current).toBe(element);
    expect(element).toHaveAttribute('class', 'sparkline extra');
    expect(element).toHaveAttribute('id', 'trend');
    expect(element).toHaveAttribute('data-testid', 'sparkline');
    expect(element.style.width).toBe('20rem');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('Sparkline');
  });

  it('takes numbers only in its types', () => {
    // @ts-expect-error the data are numbers, oldest first
    const strings = <Sparkline data={['10', '20']} />;
    expect(strings).toBeTruthy();
  });

  it('has no axe violations hidden and named', async () => {
    const { container } = render(
      <div>
        <p>
          Spending <Sparkline data={[10, 20, 15]} />
        </p>
        <Sparkline data={[10, 20, 15]} hasArea aria-label="Spending, last 3 days, rising" />
        <h2 id="net-worth">Net worth</h2>
        <Sparkline data={[3, 3, 4]} hasEndPoint={false} aria-labelledby="net-worth" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
