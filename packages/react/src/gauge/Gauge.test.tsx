import { render, screen } from '@testing-library/react';
import { createRef, type CSSProperties, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Gauge, type GaugeMark } from './Gauge';

/** The consumer's score bands: four edges on a 300 to 850 range. */
const BANDS: GaugeMark[] = [
  { value: 740, label: 'Very good from 740' },
  { value: 580, label: 'Fair from 580' },
  { value: 800, label: 'Excellent from 800' },
  { value: 670, label: 'Good from 670' },
];

/** A credit score as the consumer draws it. */
const score = (value: number, valueLabel: string, caption: string): ReactElement => (
  <Gauge
    label="Credit score"
    form="semicircle"
    size="lg"
    minValue={300}
    maxValue={850}
    value={value}
    valueLabel={valueLabel}
    figure={String(value)}
    figureCaption={caption}
    marks={BANDS}
  />
);

/** The dial, which carries the role. */
const dial = (): HTMLElement => screen.getByRole('meter');

/** An element by its class, or an error. */
const part = (container: HTMLElement, name: string): HTMLElement => {
  const element = container.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** The tag and class of each child of an element, in order. */
const children = (element: Element): string[] =>
  [...element.children].map((child) => `${child.tagName.toLowerCase()}.${child.getAttribute('class') ?? ''}`);

describe('Gauge', () => {
  it('puts the meter role on the dial with min, max, now clamped and the value text', () => {
    const { container, rerender } = render(score(742, '742 of 850, Very good', 'Very good'));
    expect(dial()).toHaveClass('gauge-dial');
    expect(dial().parentElement).toBe(root(container));
    expect(root(container)).not.toHaveAttribute('role');
    expect(dial()).toHaveAttribute('aria-valuemin', '300');
    expect(dial()).toHaveAttribute('aria-valuemax', '850');
    expect(dial()).toHaveAttribute('aria-valuenow', '742');
    expect(dial()).toHaveAttribute('aria-valuetext', '742 of 850, Very good');

    rerender(score(900, '900 of 850, over', 'Over'));
    expect(dial()).toHaveAttribute('aria-valuenow', '850');
    rerender(score(250, '250, under the range', 'Poor'));
    expect(dial()).toHaveAttribute('aria-valuenow', '300');
  });

  it('draws its parts in DOM order: the dial with the svg and the figure, the text, then the marks label', () => {
    const { container } = render(score(742, '742 of 850, Very good', 'Very good'));
    expect(children(root(container))).toEqual(['div.gauge-dial', 'div.gauge-text', 'span.gauge-marks-label']);
    expect(children(dial())).toEqual(['svg.gauge-svg', 'span.gauge-figure']);
    expect(children(part(container, 'gauge-svg'))).toEqual([
      'path.gauge-track',
      'path.gauge-value',
      // A ring in the surface under each mark, then the mark, for each of the four.
      ...Array.from({ length: 4 }, () => ['line.gauge-mark-ring', 'line.gauge-mark']).flat(),
    ]);
    expect(children(part(container, 'gauge-figure'))).toEqual([
      'span.gauge-figure-value',
      'span.gauge-figure-caption',
    ]);
    expect(children(part(container, 'gauge-text'))).toEqual(['span.gauge-label', 'span.gauge-value-label']);
    expect(root(container)).toHaveAttribute('data-size', 'lg');
    expect(root(container)).toHaveAttribute('data-form', 'semicircle');
    expect(root(container)).toHaveAttribute('data-tone', 'neutral');
  });

  it('draws a 96px ring by default, from 0 to 100, neutral', () => {
    const { container } = render(<Gauge label="Utilization" value={23} valueLabel="23% of your limit" />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    expect(root(container)).toHaveAttribute('data-form', 'ring');
    expect(root(container)).toHaveAttribute('data-tone', 'neutral');
    expect(dial()).toHaveAttribute('aria-valuemin', '0');
    expect(dial()).toHaveAttribute('aria-valuemax', '100');
    expect(dial()).toHaveAttribute('aria-valuenow', '23');
    const svg = part(container, 'gauge-svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 96 96');
    expect(part(container, 'gauge-track')).toHaveAttribute('d', 'M48 4A44 44 0 1 1 48 92A44 44 0 1 1 48 4');
    expect(part(container, 'gauge-track')).toHaveAttribute('stroke-width', '8');
    expect(part(container, 'gauge-value')).toHaveAttribute('stroke-width', '8');
  });

  it('names the dial in every branch: aria-labelledby, aria-label, the label, else the value text', () => {
    const { container, rerender } = render(
      <Gauge label="Utilization" value={23} valueLabel="23% of your limit" />,
    );
    const label = part(container, 'gauge-label');
    expect(label.id).not.toBe('');
    expect(dial()).toHaveAttribute('aria-labelledby', label.id);
    expect(screen.getByRole('meter', { name: 'Utilization' })).toBe(dial());

    rerender(<Gauge aria-label="Utilization, Everyday Visa" size="sm" value={23} valueLabel="23%" />);
    expect(container.querySelector('.gauge-label')).toBeNull();
    expect(dial()).toHaveAttribute('aria-label', 'Utilization, Everyday Visa');
    expect(dial()).not.toHaveAttribute('aria-labelledby');

    rerender(
      <>
        <h2 id="credit-heading">Your credit</h2>
        <Gauge
          label="Utilization"
          aria-label="Card utilization"
          aria-labelledby="credit-heading"
          value={23}
          valueLabel="23%"
        />
      </>,
    );
    expect(screen.getByRole('meter', { name: 'Your credit' })).toBe(dial());
    expect(dial()).not.toHaveAttribute('aria-label');

    // Blank names fall through, and with nothing else the value text names the dial.
    rerender(<Gauge label="Utilization" aria-label=" " aria-labelledby="" value={23} valueLabel="23%" />);
    expect(screen.getByRole('meter', { name: 'Utilization' })).toBe(dial());
    rerender(<Gauge label="  " aria-label="" value={23} valueLabel="23% of your limit" />);
    expect(screen.getByRole('meter', { name: '23% of your limit' })).toBe(dial());
    expect(part(container, 'gauge-value-label').id).not.toBe('');
  });

  it("describes the dial by the caller's description, then the marks' labels in order of value", () => {
    render(
      <>
        <p id="note">Updated daily.</p>
        <Gauge
          label="Credit score"
          minValue={300}
          maxValue={850}
          value={742}
          valueLabel="742 of 850, Very good"
          marks={BANDS}
          aria-describedby="note"
        />
      </>,
    );
    expect(dial()).toHaveAccessibleDescription(
      'Updated daily. Fair from 580. Good from 670. Very good from 740. Excellent from 800.',
    );
    const marks = document.querySelector('.gauge-marks-label');
    expect(marks).toHaveAttribute('hidden');
    expect(marks).toHaveTextContent(
      /^Fair from 580\. Good from 670\. Very good from 740\. Excellent from 800\.$/,
    );
  });

  it('places each mark at its share of the range, clamped, and draws none without marks', () => {
    const { container, rerender } = render(
      <Gauge
        label="Utilization"
        value={23}
        valueLabel="23%"
        marks={[
          { value: 30, label: 'Keep it under 30%' },
          { value: 150, label: 'Past the end' },
        ]}
      />,
    );
    const [first, second] = [...container.querySelectorAll('.gauge-mark')];
    // 30% of a ring is 108 degrees clockwise from the top: right of the centre and under it.
    expect(Number(first?.getAttribute('x1'))).toBeGreaterThan(48);
    expect(Number(first?.getAttribute('y1'))).toBeGreaterThan(48);
    // Clamped to the end of the range, the top again.
    expect(second).toHaveAttribute('x1', '48');
    expect(second).toHaveAttribute('y1', '10');
    for (const [ring, mark] of [...container.querySelectorAll('.gauge-mark-ring')].map((line, index) => [
      line,
      container.querySelectorAll('.gauge-mark')[index],
    ])) {
      for (const name of ['x1', 'y1', 'x2', 'y2'])
        expect(ring?.getAttribute(name)).toBe(mark?.getAttribute(name));
    }

    rerender(<Gauge label="Utilization" value={23} valueLabel="23%" />);
    expect(container.querySelector('.gauge-mark')).toBeNull();
    expect(container.querySelector('.gauge-marks-label')).toBeNull();
    expect(dial()).not.toHaveAttribute('aria-describedby');
  });

  it('draws and describes five marks at most', () => {
    const marks = [10, 20, 30, 40, 50, 60].map((value) => ({ value, label: `At ${String(value)}` }));
    const { container } = render(
      <Gauge label="Utilization" value={23} valueLabel="23%" marks={[...marks].reverse()} />,
    );
    expect(container.querySelectorAll('.gauge-mark')).toHaveLength(5);
    expect(container.querySelectorAll('.gauge-mark-ring')).toHaveLength(5);
    expect(dial()).toHaveAccessibleDescription('At 10. At 20. At 30. At 40. At 50.');
  });

  it('draws no value path at a share of 0, and gives the value path its dash as inline style', () => {
    const { container, rerender } = render(<Gauge label="Utilization" value={0} valueLabel="0%" />);
    expect(container.querySelector('.gauge-value')).toBeNull();
    expect(container.querySelector('.gauge-track')).not.toBeNull();

    rerender(<Gauge label="Utilization" value={50} valueLabel="50%" />);
    const value = part(container, 'gauge-value');
    expect(value.getAttribute('d')).toBe(part(container, 'gauge-track').getAttribute('d'));
    expect(value.style.strokeDasharray).toBe('130.23 276.46');
    expect(value.style.strokeDashoffset).toBe('-4');
    // A ring's track is the whole circle and has no dash.
    expect(part(container, 'gauge-track').getAttribute('style')).toBeNull();

    // Under the stroke's width: a dot.
    rerender(<Gauge label="Utilization" value={0.5} valueLabel="Under 1%" />);
    expect(part(container, 'gauge-value').style.strokeDasharray).toBe('0 276.46');
  });

  it("dashes a semicircle's track at the whole share, so its round caps end at the arc's ends", () => {
    const { container } = render(<Gauge label="Spent" form="semicircle" value={40} valueLabel="40% spent" />);
    expect(part(container, 'gauge-svg')).toHaveAttribute('viewBox', '0 0 96 52');
    const track = part(container, 'gauge-track');
    expect(track).toHaveAttribute('d', 'M4 48A44 44 0 0 1 92 48');
    expect(track.style.strokeDasharray).toBe('130.23 138.23');
    expect(track.style.strokeDashoffset).toBe('-4');
    expect(part(container, 'gauge-value').style.strokeDasharray).toBe('47.292 138.23');
  });

  it('resolves neutral above maxValue to warning, sets data-over, and keeps warning and error', () => {
    const { container, rerender } = render(
      <Gauge label="Utilization" value={107} valueLabel="107% of your limit, over" />,
    );
    expect(root(container)).toHaveAttribute('data-tone', 'warning');
    expect(root(container)).toHaveAttribute('data-over', '');
    expect(dial()).toHaveAttribute('aria-valuenow', '100');

    // Exactly the limit is not over.
    rerender(<Gauge label="Utilization" value={100} valueLabel="100% of your limit" />);
    expect(root(container)).toHaveAttribute('data-tone', 'neutral');
    expect(root(container)).not.toHaveAttribute('data-over');

    rerender(<Gauge label="Utilization" tone="error" value={107} valueLabel="Over the limit, declined" />);
    expect(root(container)).toHaveAttribute('data-tone', 'error');
    expect(root(container)).toHaveAttribute('data-over', '');

    rerender(<Gauge label="Utilization" tone="warning" value={47} valueLabel="47%, above 30%" />);
    expect(root(container)).toHaveAttribute('data-tone', 'warning');
    expect(root(container)).not.toHaveAttribute('data-over');
  });

  it('draws the figure and its caption at md and lg only, and has no default for either', () => {
    const { container, rerender } = render(
      <Gauge label="Utilization" value={23} valueLabel="23% of your limit" />,
    );
    expect(container.querySelector('.gauge-figure')).toBeNull();

    rerender(<Gauge label="Utilization" value={23} valueLabel="23%" figure="23%" />);
    expect(part(container, 'gauge-figure-value')).toHaveTextContent(/^23%$/);
    expect(container.querySelector('.gauge-figure-caption')).toBeNull();

    rerender(<Gauge label="Score" size="lg" value={23} valueLabel="Fair" figureCaption="Fair" />);
    expect(container.querySelector('.gauge-figure-value')).toBeNull();
    expect(part(container, 'gauge-figure-caption')).toHaveTextContent(/^Fair$/);

    rerender(
      <Gauge label="Utilization" size="sm" value={23} valueLabel="23%" figure="23%" figureCaption="Low" />,
    );
    expect(container.querySelector('.gauge-figure')).toBeNull();
  });

  it('draws an empty track and reports minValue for a range with no width', () => {
    const { container, rerender } = render(
      <Gauge label="Score" minValue={300} maxValue={300} value={500} valueLabel="No score yet" />,
    );
    expect(dial()).toHaveAttribute('aria-valuemin', '300');
    expect(dial()).toHaveAttribute('aria-valuemax', '300');
    expect(dial()).toHaveAttribute('aria-valuenow', '300');
    expect(container.querySelector('.gauge-value')).toBeNull();
    expect(root(container)).not.toHaveAttribute('data-over');

    rerender(<Gauge label="Score" minValue={850} maxValue={300} value={500} valueLabel="No score yet" />);
    expect(dial()).toHaveAttribute('aria-valuemax', '850');
    expect(dial()).toHaveAttribute('aria-valuenow', '850');
    expect(container.querySelector('.gauge-value')).toBeNull();

    rerender(<Gauge label="Score" value={Number.NaN} valueLabel="No score yet" />);
    expect(dial()).toHaveAttribute('aria-valuenow', '0');
    expect(container.querySelector('.gauge-value')).toBeNull();
  });

  it('hides the svg, the figure and the value text from assistive technology', () => {
    const { container } = render(score(742, '742 of 850, Very good', 'Very good'));
    const svg = part(container, 'gauge-svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(part(container, 'gauge-figure')).toHaveAttribute('aria-hidden', 'true');
    expect(part(container, 'gauge-value-label')).toHaveAttribute('aria-hidden', 'true');
    expect(part(container, 'gauge-value-label')).toHaveTextContent('742 of 850, Very good');
    // The name is the label alone: the figure is not read twice.
    expect(dial()).toHaveAccessibleName('Credit score');
  });

  it('passes className, ref and the rest props to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Gauge
        label="Utilization"
        value={23}
        valueLabel="23%"
        ref={ref}
        className="extra"
        id="utilization"
        data-testid="gauge"
        style={{ '--gauge-size': '7rem' } as CSSProperties}
      />,
    );
    const element = root(container);
    expect(ref.current).toBe(element);
    expect(element.tagName).toBe('DIV');
    expect(element).toHaveAttribute('class', 'gauge extra');
    expect(element).toHaveAttribute('id', 'utilization');
    expect(element).toHaveAttribute('data-testid', 'gauge');
    expect(element).toHaveStyle({ '--gauge-size': '7rem' });
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('Gauge');
  });

  it('requires a name, a value text, a known tone and a known form in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a gauge with no label, aria-label or aria-labelledby has no name
    const unnamed = <Gauge value={23} valueLabel="23%" />;
    // @ts-expect-error the value text is required: it says the state in words
    const silent = <Gauge label="Utilization" value={23} />;
    // @ts-expect-error there is no success tone: a good value is ink, and its words say so
    const success = <Gauge label="Score" value={800} valueLabel="Excellent" tone="success" />;
    // @ts-expect-error a gauge is a ring or a semicircle
    const arc = <Gauge label="Score" value={800} valueLabel="Excellent" form="arc" />;
    expect([unnamed, silent, success, arc].every(Boolean)).toBe(true);
  });

  const AXE_CASES: [string, ReactElement][] = [
    [
      'a labelled md ring',
      <Gauge
        key="ring"
        label="Utilization"
        value={23}
        valueLabel="23% of your limit"
        figure="23%"
        marks={[
          { value: 10, label: 'Best under 10%' },
          { value: 30, label: 'Keep it under 30%' },
        ]}
      />,
    ],
    [
      'an aria-label sm ring in a table cell',
      <table key="table">
        <thead>
          <tr>
            <th>Card</th>
            <th>Utilization</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Everyday Visa ending 4821</th>
            <td>
              <Gauge
                aria-label="Utilization, Everyday Visa ending 4821"
                size="sm"
                value={23}
                valueLabel="23%"
              />
            </td>
          </tr>
        </tbody>
      </table>,
    ],
    [
      'the lg score semicircle with four marks and a caption',
      score(742, '742 of 850, Very good', 'Very good'),
    ],
    [
      'warning',
      <Gauge
        key="warning"
        label="Utilization"
        tone="warning"
        value={47}
        valueLabel="47% of your limit, above 30%"
      />,
    ],
    [
      'error',
      <Gauge
        key="error"
        label="Utilization"
        tone="error"
        value={100}
        valueLabel="Limit reached, a payment was declined"
      />,
    ],
    [
      'over the limit',
      <Gauge
        key="over"
        label="Utilization"
        value={107}
        valueLabel="107% of your limit, over"
        figure="107%"
      />,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations: %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});
