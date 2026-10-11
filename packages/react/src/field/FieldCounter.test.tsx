import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { Input, TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { FieldCounter } from './FieldCounter';
import { Label } from './Label';

/** A field that counts what is typed against a budget of 10. */
function Counted(): ReactElement {
  const [value, setValue] = useState('');
  return (
    <TextField value={value} onChange={setValue}>
      <Label>Short description</Label>
      <Input />
      <FieldCounter count={value.length} budget={10} />
    </TextField>
  );
}

describe('FieldCounter', () => {
  it('is a polite status region that is in the page while it is still empty', () => {
    render(<FieldCounter count={0} budget={60} />);
    const counter = screen.getByRole('status');
    expect(counter).toBeEmptyDOMElement();
    expect(counter).toHaveClass('field-counter');
    expect(counter).not.toHaveAttribute('data-over');
  });

  it('stays empty until the count reaches 70% of the budget', () => {
    const { rerender } = render(<FieldCounter count={41} budget={60} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    rerender(<FieldCounter count={42} budget={60} />);
    expect(screen.getByRole('status')).toHaveTextContent('42 of about 60');
  });

  it('reads the budget as met, not over, when the count equals it', () => {
    render(<FieldCounter count={60} budget={60} />);
    const counter = screen.getByRole('status');
    expect(counter).toHaveTextContent('60 of about 60');
    expect(counter).not.toHaveAttribute('data-over');
  });

  it('marks the count over once it passes the budget', () => {
    render(<FieldCounter count={62} budget={60} />);
    const counter = screen.getByRole('status');
    expect(counter).toHaveTextContent('62 of about 60');
    expect(counter).toHaveAttribute('data-over');
  });

  it('shows the count from a different share of the budget with showFrom', () => {
    const { rerender } = render(<FieldCounter count={0} budget={60} showFrom={0} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    rerender(<FieldCounter count={1} budget={60} showFrom={0} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 of about 60');
    rerender(<FieldCounter count={59} budget={60} showFrom={1} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    rerender(<FieldCounter count={60} budget={60} showFrom={1} />);
    expect(screen.getByRole('status')).toHaveTextContent('60 of about 60');
  });

  it('takes its text from label, which receives the count, the budget and whether it is over', () => {
    const label = ({ count, budget, over }: { count: number; budget: number; over: boolean }): string =>
      over ? `${String(count - budget)} over` : `${String(budget - count)} left`;
    const { rerender } = render(<FieldCounter count={50} budget={60} label={label} />);
    expect(screen.getByRole('status')).toHaveTextContent('10 left');
    rerender(<FieldCounter count={65} budget={60} label={label} />);
    expect(screen.getByRole('status')).toHaveTextContent('5 over');
  });

  it.each([0, -5, Number.NaN])('shows nothing for a budget of %s', (budget) => {
    render(<FieldCounter count={40} budget={budget} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('never blocks typing: the value keeps growing past the budget and stays valid', async () => {
    const user = userEvent.setup();
    render(<Counted />);
    const input = screen.getByRole('textbox', { name: 'Short description' });
    expect(input).not.toHaveAttribute('maxlength');
    await user.type(input, 'a'.repeat(15));
    expect(input).toHaveValue('a'.repeat(15));
    expect(input).toBeValid();
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('status')).toHaveTextContent('15 of about 10');
    expect(screen.getByRole('status')).toHaveAttribute('data-over');
  });

  it('merges a custom className and passes other attributes through', () => {
    render(<FieldCounter count={50} budget={60} className="extra" id="count" />);
    const counter = screen.getByRole('status');
    expect(counter).toHaveClass('field-counter', 'extra');
    expect(counter).toHaveAttribute('id', 'count');
  });

  it('forwards a ref to the element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<FieldCounter ref={ref} count={50} budget={60} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it.each([
    ['empty', 3],
    ['near the budget', 50],
    ['over the budget', 70],
  ])('has no axe violations when %s', async (_state, count) => {
    const { container } = render(
      <TextField>
        <Label>Short description</Label>
        <Input />
        <FieldCounter count={count} budget={60} />
      </TextField>,
    );
    await expectNoA11yViolations(container);
  });
});
