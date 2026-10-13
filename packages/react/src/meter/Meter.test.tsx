import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Meter, type MeterSegment } from './Meter';

const SPENT: MeterSegment = { value: 820, look: 'fill', label: 'Spent', valueLabel: '$820.00' };
const HELD: MeterSegment = { value: 200, look: 'hatched', label: 'Held', valueLabel: '$200.00' };
const PACE = { value: 900, label: "Where you'd be today: $900" };

/** The meter: the bar, which carries the role. */
const bar = (): HTMLElement => screen.getByRole('meter');

/** The inline sizes of the drawn segments, in order. */
const widths = (container: HTMLElement): string[] =>
  [...container.querySelectorAll<HTMLElement>('.meter-segment')].map((segment) => segment.style.inlineSize);

describe('Meter', () => {
  it("is a meter on the bar from 0 to max, its value the sum of the segments and its value text the app's", () => {
    const { container } = render(
      <Meter label="Groceries" max={1200} segments={[SPENT, HELD]} valueLabel="$1,020 of $1,200" />,
    );
    const meter = bar();
    expect(meter).toHaveClass('meter-bar');
    expect(meter.parentElement).toBe(root(container));
    expect(root(container)).not.toHaveAttribute('role');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '1200');
    expect(meter).toHaveAttribute('aria-valuenow', '1020');
    expect(meter).toHaveAttribute('aria-valuetext', '$1,020 of $1,200');

    // In DOM order: the head, the bar, and nothing else without a pace or a legend.
    expect([...root(container).children].map((child) => child.className)).toEqual([
      'meter-head',
      'meter-bar',
    ]);
    expect([...meter.children].map((child) => child.className)).toEqual(['meter-track']);
  });

  it('caps the value at max past the limit and marks the root data-over, and is not over at exactly max', () => {
    const { container, rerender } = render(
      <Meter
        label="Groceries"
        max={1200}
        segments={[{ ...SPENT, value: 1140 }, HELD]}
        valueLabel="$1,340 of $1,200, $140 over"
      />,
    );
    expect(bar()).toHaveAttribute('aria-valuenow', '1200');
    expect(root(container)).toHaveAttribute('data-over', '');

    rerender(
      <Meter
        label="Groceries"
        max={1200}
        segments={[{ ...SPENT, value: 1000 }, HELD]}
        valueLabel="$1,200 of $1,200"
      />,
    );
    expect(bar()).toHaveAttribute('aria-valuenow', '1200');
    expect(root(container)).not.toHaveAttribute('data-over');
  });

  it('draws each segment as its share of max, stacked, and clips what passes max', () => {
    const { container, rerender } = render(
      <Meter label="Groceries" max={1200} segments={[SPENT, HELD]} valueLabel="$1,020 of $1,200" />,
    );
    expect(widths(container)).toEqual(['68.333%', '16.667%']);
    expect(
      [...container.querySelectorAll('.meter-segment')].map((segment) => segment.getAttribute('data-look')),
    ).toEqual(['fill', 'hatched']);

    rerender(
      <Meter
        label="Groceries"
        max={1200}
        segments={[{ ...SPENT, value: 1140 }, HELD]}
        valueLabel="$1,340 of $1,200, $140 over"
      />,
    );
    expect(widths(container)).toEqual(['95%', '5%']);
  });

  it('draws no segment that is left with no width, so no spacer shows for it', () => {
    const { container, rerender } = render(
      <Meter
        label="Groceries"
        max={1200}
        segments={[{ ...SPENT, value: 1300 }, HELD]}
        valueLabel="$1,500 of $1,200, $300 over"
      />,
    );
    // The held segment starts past max, so it has no width and is not drawn.
    expect(widths(container)).toEqual(['100%']);
    expect(container.querySelector('.meter-segment')).toHaveAttribute('data-look', 'fill');

    rerender(
      <Meter
        label="Groceries"
        max={1200}
        segments={[{ ...SPENT, value: 0 }, HELD]}
        valueLabel="$200 of $1,200"
      />,
    );
    expect(widths(container)).toEqual(['16.667%']);
    expect(container.querySelector('.meter-segment')).toHaveAttribute('data-look', 'hatched');
  });

  it('floors a negative value at 0 and draws an empty bar for a max of 0', () => {
    const { container, rerender } = render(
      <Meter
        label="Groceries"
        max={1200}
        segments={[{ ...SPENT, value: -50 }, HELD]}
        valueLabel="$200 of $1,200"
      />,
    );
    expect(bar()).toHaveAttribute('aria-valuenow', '200');
    expect(widths(container)).toEqual(['16.667%']);

    rerender(<Meter label="Groceries" max={0} segments={[SPENT, HELD]} valueLabel="$1,020 of $0" />);
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
    expect(bar()).toHaveAttribute('aria-valuemax', '0');
    expect(container.querySelector('.meter-segment')).toBeNull();
    expect(container.querySelector('.meter-track')).not.toBeNull();
  });

  it('names the bar by its visible label, by aria-label, or by aria-labelledby, which wins', () => {
    const { container, rerender } = render(
      <Meter label="Groceries" max={1200} segments={[SPENT]} valueLabel="$820 of $1,200" />,
    );
    const label = container.querySelector('.meter-label');
    expect(label).toHaveTextContent('Groceries');
    expect(label?.id).not.toBe('');
    expect(bar()).toHaveAttribute('aria-labelledby', label?.id);
    expect(bar()).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('meter', { name: 'Groceries' })).toBe(bar());

    rerender(<Meter aria-label="Dining out" max={300} segments={[SPENT]} valueLabel="$80 of $300" />);
    expect(container.querySelector('.meter-label')).toBeNull();
    expect(bar()).toHaveAttribute('aria-label', 'Dining out');
    expect(bar()).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('meter', { name: 'Dining out' })).toBe(bar());

    rerender(
      <>
        <h2 id="budget-heading">Monthly groceries</h2>
        <Meter
          label="Groceries"
          aria-label="Dining out"
          aria-labelledby="budget-heading"
          max={1200}
          segments={[SPENT]}
          valueLabel="$820 of $1,200"
        />
      </>,
    );
    expect(screen.getByRole('meter', { name: 'Monthly groceries' })).toBe(bar());
    expect(bar()).not.toHaveAttribute('aria-label');
  });

  it('never leaves the bar unnamed: a blank aria-label or aria-labelledby falls back to the next name', () => {
    const { rerender } = render(
      <Meter
        label="Groceries"
        aria-label=" "
        aria-labelledby=""
        max={1200}
        segments={[SPENT]}
        valueLabel="$820 of $1,200"
      />,
    );
    expect(screen.getByRole('meter', { name: 'Groceries' })).toBe(bar());
    expect(bar()).not.toHaveAttribute('aria-label');

    // Nothing names it: the value text does, rather than a meter with no name.
    rerender(<Meter label="" aria-label="" max={1200} segments={[SPENT]} valueLabel="$820 of $1,200" />);
    expect(screen.getByRole('meter', { name: '$820 of $1,200' })).toBe(bar());
  });

  it('shows the value text and hides it from assistive technology, which reads aria-valuetext', () => {
    const { container } = render(
      <Meter label="Groceries" max={1200} segments={[SPENT, HELD]} valueLabel="$1,020 of $1,200" />,
    );
    const head = container.querySelector('.meter-head');
    expect([...(head?.children ?? [])].map((child) => child.className)).toEqual([
      'meter-label',
      'meter-value',
    ]);
    const value = container.querySelector('.meter-value');
    expect(value?.tagName).toBe('SPAN');
    expect(value).toHaveTextContent('$1,020 of $1,200');
    expect(value).toHaveAttribute('aria-hidden', 'true');
  });

  it('places the pace marker at pace over max by inset-inline-start, clamped, and describes the bar with its label', () => {
    const { container, rerender } = render(
      <Meter
        label="Groceries"
        max={1200}
        segments={[SPENT, HELD]}
        valueLabel="$1,020 of $1,200"
        pace={PACE}
      />,
    );
    const marker = container.querySelector<HTMLElement>('.meter-bar > .meter-pace');
    expect(marker?.previousElementSibling).toHaveClass('meter-track');
    expect(marker?.style.insetInlineStart).toBe('75%');
    const description = container.querySelector('.meter-pace-label');
    expect(description).toHaveAttribute('hidden');
    expect(description).toHaveTextContent("Where you'd be today: $900");
    expect(description?.parentElement).toBe(root(container));
    expect(bar()).toHaveAttribute('aria-describedby', description?.id);
    expect(bar()).toHaveAccessibleDescription("Where you'd be today: $900");

    rerender(
      <Meter
        label="Groceries"
        max={1200}
        segments={[SPENT, HELD]}
        valueLabel="$1,020 of $1,200"
        pace={{ ...PACE, value: 1500 }}
      />,
    );
    expect(container.querySelector<HTMLElement>('.meter-pace')?.style.insetInlineStart).toBe('100%');
    rerender(
      <Meter
        label="Groceries"
        max={1200}
        segments={[SPENT, HELD]}
        valueLabel="$1,020 of $1,200"
        pace={{ ...PACE, value: -10 }}
      />,
    );
    expect(container.querySelector<HTMLElement>('.meter-pace')?.style.insetInlineStart).toBe('0%');

    rerender(<Meter label="Groceries" max={1200} segments={[SPENT, HELD]} valueLabel="$1,020 of $1,200" />);
    expect(container.querySelector('.meter-pace')).toBeNull();
    expect(container.querySelector('.meter-pace-label')).toBeNull();
    expect(bar()).not.toHaveAttribute('aria-describedby');
  });

  it('draws a pace with a blank label as the marker alone, with no description and no legend key', () => {
    const { container } = render(
      <Meter
        label="Groceries"
        max={1200}
        segments={[SPENT, HELD]}
        valueLabel="$1,020 of $1,200"
        pace={{ value: 900, label: ' ' }}
        hasLegend
      />,
    );
    expect(container.querySelector('.meter-pace')).not.toBeNull();
    expect(container.querySelector('.meter-pace-label')).toBeNull();
    expect(bar()).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector(".meter-swatch[data-look='pace']")).toBeNull();
  });

  it('draws the legend only with hasLegend: a swatch, a label and a value per segment, then the pace', () => {
    const { container, rerender } = render(
      <Meter
        label="Groceries"
        max={1200}
        segments={[SPENT, HELD]}
        valueLabel="$1,020 of $1,200"
        pace={PACE}
      />,
    );
    expect(container.querySelector('.meter-legend')).toBeNull();

    rerender(
      <Meter
        label="Groceries"
        max={1200}
        segments={[{ ...SPENT, value: 1300 }, HELD]}
        valueLabel="$1,500 of $1,200, $300 over"
        pace={PACE}
        hasLegend
      />,
    );
    const legend = container.querySelector('.meter-legend');
    expect(legend?.tagName).toBe('UL');
    // Outside the meter, whose children are presentational.
    expect(legend?.closest('[role="meter"]')).toBeNull();
    expect(legend?.parentElement).toBe(root(container));
    const items = [...container.querySelectorAll('.meter-legend > li.meter-legend-item')];
    // Every segment, including one the track does not draw, then the pace.
    expect(items).toHaveLength(3);
    expect(items.map((item) => [...item.children].map((child) => child.className))).toEqual([
      ['meter-swatch', 'meter-legend-label', 'meter-legend-value'],
      ['meter-swatch', 'meter-legend-label', 'meter-legend-value'],
      ['meter-swatch', 'meter-legend-label'],
    ]);
    expect(items.map((item) => item.querySelector('.meter-swatch')?.getAttribute('data-look'))).toEqual([
      'fill',
      'hatched',
      'pace',
    ]);
    for (const item of items)
      expect(item.querySelector('.meter-swatch')).toHaveAttribute('aria-hidden', 'true');
    expect(items.map((item) => item.textContent)).toEqual([
      'Spent$820.00',
      'Held$200.00',
      "Where you'd be today: $900",
    ]);

    rerender(
      <Meter label="Groceries" max={1200} segments={[SPENT, HELD]} valueLabel="$1,020 of $1,200" hasLegend />,
    );
    expect(container.querySelectorAll('.meter-legend-item')).toHaveLength(2);
  });

  it('passes className, ref and attributes to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Meter
        label="Groceries"
        max={1200}
        segments={[SPENT]}
        valueLabel="$820 of $1,200"
        ref={ref}
        className="extra"
        id="groceries"
        data-testid="meter"
      />,
    );
    const element = root(container);
    expect(ref.current).toBe(element);
    expect(element.tagName).toBe('DIV');
    expect(element).toHaveAttribute('class', 'meter extra');
    expect(element).toHaveAttribute('id', 'groceries');
    expect(element).toHaveAttribute('data-testid', 'meter');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('Meter');
  });

  it('requires a name in its types and a known look', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a meter with no label, aria-label or aria-labelledby has no name
    const unnamed = <Meter max={1200} segments={[SPENT]} valueLabel="$820 of $1,200" />;
    // @ts-expect-error a segment is filled or hatched
    const striped: MeterSegment = { value: 1, look: 'striped', label: 'Spent', valueLabel: '$1' };
    expect(unnamed).toBeTruthy();
    expect(striped).toBeTruthy();
  });

  it('has no axe violations with a label, with aria-label, over the limit and with a legend and pace', async () => {
    const { container } = render(
      <div>
        <Meter label="Groceries" max={1200} segments={[SPENT, HELD]} valueLabel="$1,020 of $1,200" />
        <Meter
          aria-label="Dining out"
          max={300}
          segments={[{ ...SPENT, value: 80 }]}
          valueLabel="$80 of $300"
        />
        <Meter
          label="Transport"
          max={1200}
          segments={[{ ...SPENT, value: 1140 }, HELD]}
          valueLabel="$1,340 of $1,200, $140 over"
          hasLegend
        />
        <Meter
          label="Household"
          max={1200}
          segments={[SPENT, HELD]}
          valueLabel="$1,020 of $1,200"
          pace={PACE}
          hasLegend
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
