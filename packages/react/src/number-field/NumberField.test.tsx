import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRef,
  useId,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
import { Dialog, DialogTrigger } from '../dialog';
import { TextField } from '../text-field';
import { NumberField } from './NumberField';

afterEach(() => {
  vi.restoreAllMocks();
});

/** The field's text box: React Aria removes the spin button role, so it is a textbox. */
const amount = (name = 'Amount'): HTMLInputElement => screen.getByRole<HTMLInputElement>('textbox', { name });

/** The sign button, a toggle named Negative. */
const sign = (): HTMLElement => screen.getByRole('button', { name: 'Negative' });

/** Selects the whole text of `input`, as a reader's Select All before a paste does. */
const selectAll = (input: HTMLInputElement): void => {
  input.setSelectionRange(0, input.value.length);
};

describe('NumberField', () => {
  it('is a textbox named by its label, with no spin button role and no role description', () => {
    const { container } = render(
      <NumberField
        label="Amount"
        description="Before tax"
        money={{ symbol: '$' }}
        defaultValue={123450}
        name="amount"
      />,
    );
    const input = amount();
    expect(input).toHaveClass('input', 'number-field-input');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).not.toHaveAttribute('aria-roledescription');
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(root(container)).toHaveClass('field', 'number-field');
    // The label row, the control, the hint; the hidden input carries no class.
    expect([...root(container).children].map((child) => child.className)).toEqual([
      'field-head',
      'number-field-control',
      'field-description',
      '',
    ]);
    const control = container.querySelector('.number-field-control');
    expect(control).toHaveAttribute('role', 'group');
    expect([...(control?.children ?? [])].map((child) => child.className)).toEqual([
      'number-field-symbol',
      'input number-field-input',
    ]);
  });

  it('takes value and onChange in minor units, and defaultValue alone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<NumberField label="Amount" money={{ symbol: '$' }} value={123450} />);
    expect(amount()).toHaveValue('1,234.50');
    unmount();

    const { unmount: unmountDefault } = render(
      <NumberField label="Amount" money={{ symbol: '$' }} defaultValue={1999} />,
    );
    expect(amount()).toHaveValue('19.99');
    unmountDefault();

    render(<NumberField label="Amount" money={{ symbol: '$' }} onChange={onChange} />);
    await user.type(amount(), '19.99');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(1999);
    expect(amount()).toHaveValue('19.99');
  });

  it('calls onChange with a negative count of minor units', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} allowsNegative onChange={onChange} />);
    await user.type(amount(), '-0.01');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(-1);
    await user.clear(amount());
    await user.type(amount(), '19.99');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(1999);
  });

  it('commits what it shows for a third decimal place', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} onChange={onChange} />);
    await user.type(amount(), '1.005');
    await user.tab();
    const minor: unknown = onChange.mock.lastCall?.[0];
    expect(Number.isInteger(minor)).toBe(true);
    // Whichever way React Aria rounds, the field shows exactly the minor units it reported.
    expect(Number(minor) / 100).toBe(Number(amount().value));
  });

  it('calls onChange(null) when emptied', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} defaultValue={1999} onChange={onChange} />);
    await user.clear(amount());
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(amount()).toHaveValue('');
  });

  it('never snaps a typed amount: 12.50 stays 12.50', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} onChange={onChange} />);
    await user.type(amount(), '12.50');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(1250);
    expect(amount()).toHaveValue('12.50');
  });

  it('steps a money amount one whole unit on the arrows and on Page Up and Page Down, snapping first: 12.50 then Arrow Up is 13.00', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} defaultValue={1250} onChange={onChange} />);
    await user.click(amount());
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(1300);
    expect(amount()).toHaveValue('13.00');
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(1200);
    await user.keyboard('{PageUp}');
    expect(onChange).toHaveBeenLastCalledWith(1300);
    await user.keyboard('{PageDown}');
    expect(onChange).toHaveBeenLastCalledWith(1200);
    expect(amount()).toHaveValue('12.00');
  });

  it('starts an empty field at 0 on Arrow Up without negatives', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} onChange={onChange} />);
    await user.click(amount());
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(amount()).toHaveValue('0.00');
  });

  it('keeps Home and End from React Aria: the value is unchanged and no bound is set', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        defaultValue={1250}
        minValue={0}
        maxValue={1000000}
        onChange={onChange}
      />,
    );
    await user.click(amount());
    await user.keyboard('{Home}');
    expect(amount()).toHaveValue('12.50');
    await user.keyboard('{End}');
    expect(amount()).toHaveValue('12.50');
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets the lower bound to 0 without allowsNegative, and warns once for a negative minValue without it', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(<NumberField label="Amount" money={{ symbol: '$' }} defaultValue={0} />);
    await user.click(amount());
    await user.keyboard('{ArrowDown}');
    expect(amount()).toHaveValue('0.00');
    // A minus is refused as it is typed, as any letter is.
    await user.clear(amount());
    await user.type(amount(), '-5');
    expect(amount()).toHaveValue('5');
    expect(warn).not.toHaveBeenCalled();
    unmount();

    const { rerender } = render(
      <NumberField label="Amount" money={{ symbol: '$' }} minValue={-1000} defaultValue={0} />,
    );
    rerender(<NumberField label="Amount" money={{ symbol: '$' }} minValue={-2000} defaultValue={0} />);
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/allowsNegative/);
    await user.click(amount());
    await user.keyboard('{ArrowDown}');
    expect(amount()).toHaveValue('0.00');
  });

  it('rounds a value that is not a safe integer, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<NumberField label="Amount" money={{ symbol: '$' }} value={1234.6} />);
    expect(amount()).toHaveValue('12.35');
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/integer/);
  });

  it('warns once for an amount past 2 ** 52 / 10 ** fractionDigits minor units, where whole units lose a cent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // 2 ** 52 / 100 is 45035996273704.96: the largest whole count of cents under it is held exactly.
    const { unmount } = render(<NumberField label="Amount" money={{ symbol: '$' }} value={45035996273704} />);
    expect(warn).not.toHaveBeenCalled();
    unmount();
    const { unmount: again } = render(
      <NumberField label="Amount" money={{ symbol: '$' }} value={45035996273705} />,
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/2 \*\* 52/);
    expect(String(warn.mock.calls[0]?.[0])).not.toMatch(/rounded/);
    again();
    // At 0 digits the bound is 2 ** 52 itself.
    render(<NumberField label="Amount" money={{ symbol: '$', fractionDigits: 0 }} value={-(2 ** 52) - 1} />);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('draws the sign button with allowsNegative only, a toggle named Negative, pressed under zero', () => {
    const { rerender } = render(<NumberField label="Amount" money={{ symbol: '$' }} value={4250} />);
    expect(screen.queryByRole('button', { name: 'Negative' })).toBeNull();
    rerender(<NumberField label="Amount" money={{ symbol: '$' }} allowsNegative value={4250} />);
    expect(sign()).toHaveAttribute('aria-pressed', 'false');
    expect(sign()).toHaveClass('input-button', 'number-field-sign');
    expect(sign().parentElement).toHaveClass('number-field-control');
    expect(sign().parentElement?.firstElementChild).toBe(sign());
    rerender(<NumberField label="Amount" money={{ symbol: '$' }} allowsNegative value={-4250} />);
    expect(sign()).toHaveAttribute('aria-pressed', 'true');
    expect(sign()).toHaveAttribute('data-selected');
    rerender(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        allowsNegative
        value={-4250}
        labels={{ negative: 'منفی' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'منفی' })).toBeInTheDocument();
  });

  it('negates the value on a press of the sign button, and puts a minus in an empty field and focuses it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        allowsNegative
        defaultValue={4250}
        onChange={onChange}
      />,
    );
    await user.click(sign());
    expect(onChange).toHaveBeenLastCalledWith(-4250);
    expect(sign()).toHaveAttribute('aria-pressed', 'true');
    expect(amount()).toHaveValue('-42.50');
    await user.click(sign());
    expect(onChange).toHaveBeenLastCalledWith(4250);
    expect(sign()).toHaveAttribute('aria-pressed', 'false');
    unmount();

    render(<NumberField label="Amount" money={{ symbol: '$' }} allowsNegative onChange={onChange} />);
    await user.click(sign());
    expect(amount()).toHaveValue('-');
    expect(amount()).toHaveFocus();
    await user.keyboard('7');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(-700);
    expect(sign()).toHaveAttribute('aria-pressed', 'true');
  });

  it('treats zero as empty on a press of the sign button: a minus in the input, never "-0.00"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        allowsNegative
        defaultValue={0}
        onChange={onChange}
      />,
    );
    await user.click(sign());
    expect(amount()).toHaveValue('-');
    expect(amount()).toHaveFocus();
    expect(sign()).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).not.toHaveBeenCalled();
    // Left as a bare minus, the field goes back to its zero.
    await user.tab();
    expect(amount()).toHaveValue('0.00');
    await user.click(sign());
    await user.keyboard('3');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(-300);
  });

  it('never calls onChange with -0', async () => {
    const user = userEvent.setup();
    const money = vi.fn();
    const plain = vi.fn();
    render(
      <>
        <NumberField label="Amount" money={{ symbol: '$' }} allowsNegative onChange={money} />
        <NumberField label="Count" allowsNegative onChange={plain} />
      </>,
    );
    await user.type(amount(), '-0');
    await user.tab();
    expect(Object.is(money.mock.lastCall?.[0], 0)).toBe(true);
    await user.type(amount('Count'), '-0');
    await user.tab();
    expect(Object.is(plain.mock.lastCall?.[0], 0)).toBe(true);
  });

  it('clamps a negated value to the bounds, as a commit does, and validates it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        allowsNegative
        minValue={-1000}
        defaultValue={5000}
        onChange={onChange}
      />,
    );
    await user.click(sign());
    expect(onChange).toHaveBeenLastCalledWith(-1000);
    expect(amount()).toHaveValue('-10.00');
    unmount();

    render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        allowsNegative
        maxValue={1000}
        defaultValue={-5000}
        onChange={onChange}
        validate={(next) => (next !== null && next < 0 ? null : 'Enter a refund')}
      />,
    );
    await user.click(sign());
    expect(onChange).toHaveBeenLastCalledWith(1000);
    expect(amount()).toHaveValue('10.00');
    // React Aria's own steppers commit validation; the sign button does too, so the error shows at once.
    expect(screen.getByText('Enter a refund')).toBeInTheDocument();
    expect(amount()).toHaveAttribute('aria-invalid', 'true');
  });

  it('hands validate minor units in money mode, the number in a plain field, and null for an empty one', async () => {
    const user = userEvent.setup();
    const validate = vi.fn((next: number | null) => (next === null || next <= 5000 ? true : 'At most $50'));
    const { unmount } = render(
      <NumberField label="Amount" money={{ symbol: '$' }} defaultValue={1999} validate={validate} />,
    );
    expect(validate).toHaveBeenLastCalledWith(1999);
    await user.clear(amount());
    await user.type(amount(), '50.01');
    await user.tab();
    expect(validate).toHaveBeenLastCalledWith(5001);
    expect(screen.getByText('At most $50')).toBeInTheDocument();
    await user.clear(amount());
    await user.tab();
    expect(validate).toHaveBeenLastCalledWith(null);
    expect(validate.mock.calls.every(([each]) => each === null || Number.isInteger(each))).toBe(true);
    unmount();

    validate.mockClear();
    render(<NumberField label="Count" defaultValue={3} validate={validate} />);
    expect(validate).toHaveBeenLastCalledWith(3);
    await user.clear(amount('Count'));
    await user.tab();
    expect(validate).toHaveBeenLastCalledWith(null);
    expect(validate.mock.calls.some(([each]) => Number.isNaN(each))).toBe(false);
  });

  it('follows a minus typed on the keyboard once the value commits', async () => {
    const user = userEvent.setup();
    render(<NumberField label="Amount" money={{ symbol: '$' }} allowsNegative />);
    await user.type(amount(), '-5');
    await user.tab();
    expect(amount()).toHaveValue('-5.00');
    expect(sign()).toHaveAttribute('aria-pressed', 'true');
  });

  it('describes the input by the symbol after React Aria descriptions', () => {
    const { container } = render(
      <NumberField label="Amount" description="Before tax" money={{ symbol: '$' }} defaultValue={100} />,
    );
    const symbol = container.querySelector('.number-field-symbol');
    expect(symbol).toHaveTextContent('$');
    const ids = amount().getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids.at(-1)).toBe(symbol?.id);
    expect(amount()).toHaveAccessibleDescription('Before tax $');
  });

  it('drops its own symbol from a paste that replaces the whole text: "$1,234.50" lands as 123450', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} defaultValue={100} onChange={onChange} />);
    await user.click(amount());
    selectAll(amount());
    await user.paste('$1,234.50');
    expect(onChange).toHaveBeenLastCalledWith(123450);
    expect(amount()).toHaveValue('1,234.50');
    // A symbol written after the figure, as a Persian amount is, lands too.
    selectAll(amount());
    await user.paste('20 $');
    expect(onChange).toHaveBeenLastCalledWith(2000);
  });

  it('leaves a paste without the symbol, or a partial paste, to React Aria', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} defaultValue={1250} onChange={onChange} />);
    await user.click(amount());
    selectAll(amount());
    await user.paste('1,234.50');
    expect(onChange).toHaveBeenLastCalledWith(123450);
    // The caret at the end: React Aria's, which refuses a symbol as it refuses any letter.
    amount().setSelectionRange(amount().value.length, amount().value.length);
    await user.paste('$3');
    expect(amount()).toHaveValue('1,234.50');
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('calls the app onPaste on a paste the symbol guard takes, and on one it leaves', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onPaste = vi.fn();
    render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        defaultValue={100}
        onChange={onChange}
        onPaste={onPaste}
      />,
    );
    await user.click(amount());
    selectAll(amount());
    await user.paste('$1,234.50');
    expect(onPaste).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith(123450);
    selectAll(amount());
    await user.paste('20');
    expect(onPaste).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(2000);
  });

  it('calls the app onKeyDown for Home and End, which it keeps from React Aria, once each', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        defaultValue={1250}
        minValue={0}
        maxValue={1000000}
        onKeyDown={onKeyDown}
      />,
    );
    await user.click(amount());
    await user.keyboard('{Home}{End}{ArrowUp}');
    expect(onKeyDown.mock.calls.map((call) => (call[0] as { key: string }).key)).toEqual([
      'Home',
      'End',
      'ArrowUp',
    ]);
    expect(amount()).toHaveValue('13.00');
  });

  it('sets inputMode decimal in money mode and for a fractional number, and numeric for whole numbers, on a mocked iPhone too', () => {
    for (const platform of ['Win32', 'iPhone']) {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
      const { unmount } = render(
        <>
          <NumberField label="Money" money={{ symbol: '$' }} allowsNegative />
          <NumberField label="Plain" allowsNegative />
          <NumberField label="Whole" formatOptions={{ maximumFractionDigits: 0 }} />
          <NumberField label="Share" formatOptions={{ style: 'percent' }} />
          <NumberField label="Rate" formatOptions={{ style: 'percent', maximumFractionDigits: 1 }} />
        </>,
      );
      expect(amount('Money'), platform).toHaveAttribute('inputmode', 'decimal');
      expect(amount('Plain'), platform).toHaveAttribute('inputmode', 'decimal');
      expect(amount('Whole'), platform).toHaveAttribute('inputmode', 'numeric');
      expect(amount('Share'), platform).toHaveAttribute('inputmode', 'numeric');
      expect(amount('Rate'), platform).toHaveAttribute('inputmode', 'decimal');
      unmount();
      vi.restoreAllMocks();
    }
  });

  it('draws steppers for a plain number with hasStepper, named Increase and the label, out of the tab order', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, unmount } = render(
      <NumberField label="Guests" hasStepper defaultValue={2} minValue={1} onChange={onChange} />,
    );
    const increase = screen.getByRole('button', { name: 'Increase Guests' });
    const decrease = screen.getByRole('button', { name: 'Decrease Guests' });
    for (const button of [increase, decrease]) {
      expect(button).toHaveClass('input-button', 'number-field-step');
      expect(button).toHaveAttribute('tabindex', '-1');
    }
    expect(decrease).toHaveAttribute('slot', 'decrement');
    expect(increase).toHaveAttribute('slot', 'increment');
    // In DOM order after the input: decrement, then increment.
    expect(
      [...(container.querySelector('.number-field-control')?.children ?? [])].map((c) => c.className),
    ).toEqual([
      'input number-field-input',
      'input-button number-field-step',
      'input-button number-field-step',
    ]);
    await user.click(increase);
    expect(onChange).toHaveBeenLastCalledWith(3);
    await user.click(decrease);
    await user.click(decrease);
    expect(onChange).toHaveBeenLastCalledWith(1);
    // Disabled at the bound.
    expect(decrease).toBeDisabled();
    unmount();

    render(<NumberField aria-label="Nights" hasStepper labels={{ increment: 'Add', decrement: 'Remove' }} />);
    expect(screen.getByRole('button', { name: 'Add Nights' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Nights' })).toBeInTheDocument();
  });

  it('submits minor units under name in money mode, and React Aria number for a plain one', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <NumberField label="Minimum" money={{ symbol: '$' }} defaultValue={123450} name="min" />
        <NumberField label="Guests" defaultValue={2.5} name="guests" />
        <NumberField label="Off" money={{ symbol: '$' }} defaultValue={5} name="off" isDisabled />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('min')).toBe('123450');
    expect(new FormData(form).get('guests')).toBe('2.5');
    // A disabled field sends nothing, as a disabled native input does.
    expect(new FormData(form).has('off')).toBe(false);
    // The text box itself is never submitted.
    expect(amount('Minimum')).not.toHaveAttribute('name');
    expect(form.querySelectorAll('input[name="min"]')).toHaveLength(1);
    await user.clear(amount('Minimum'));
    await user.tab();
    expect(new FormData(form).get('min')).toBe('');
  });

  it('marks its root data-unlabelled without a label, data-money, data-signed, data-stepper and data-symbol', () => {
    const { container, rerender } = render(
      <NumberField
        aria-label="Minimum"
        money={{ symbol: 'تومان', symbolPosition: 'end', fractionDigits: 0 }}
        allowsNegative
        placeholder="0"
      />,
    );
    const field = root(container);
    expect(field).toHaveAttribute('data-unlabelled', '');
    expect(field).toHaveAttribute('data-money', '');
    expect(field).toHaveAttribute('data-signed', '');
    expect(field).toHaveAttribute('data-symbol', 'end');
    expect(field).not.toHaveAttribute('data-stepper');
    // The room is the symbol's length in ch, a property of the string and not a measurement.
    expect((field as HTMLElement).style.getPropertyValue('--number-field-symbol')).toBe('calc(5ch + 0.5rem)');
    // The symbol sits after the input when it ends the figure.
    expect(
      [...(container.querySelector('.number-field-control')?.children ?? [])].map((c) => c.className),
    ).toEqual(['input-button number-field-sign', 'input number-field-input', 'number-field-symbol']);

    rerender(<NumberField label="Guests" hasStepper />);
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
    expect(root(container)).not.toHaveAttribute('data-money');
    expect(root(container)).not.toHaveAttribute('data-signed');
    expect(root(container)).not.toHaveAttribute('data-symbol');
    expect(root(container)).toHaveAttribute('data-stepper', '');
    expect((root(container) as HTMLElement).style.getPropertyValue('--number-field-symbol')).toBe('');
    expect(container.querySelector('.number-field-symbol')).toBeNull();
  });

  it('shows the Changed chip and reads it with the input while changed and valid', () => {
    const { container, rerender } = render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        defaultValue={100}
        isChanged
        changedLabel="Edited"
      />,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(amount()).toHaveAccessibleDescription('Edited $');
    rerender(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        defaultValue={100}
        isChanged
        changedLabel="Edited"
        isInvalid
        errorMessage="Too much"
      />,
    );
    expect(amount()).toHaveAccessibleDescription('Too much $');
    expect(container.querySelector('.field-changed')).toBeNull();
  });

  it('passes className, ref, inputRef and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const { container, rerender } = render(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        className="mine"
        ref={ref}
        inputRef={inputRef}
        data-testid="amount"
      />,
    );
    expect(root(container)).toHaveClass('field', 'number-field', 'mine');
    expect(root(container)).toHaveAttribute('data-testid', 'amount');
    expect(ref.current).toBe(root(container));
    expect(inputRef.current).toBe(amount());
    rerender(
      <NumberField
        label="Amount"
        money={{ symbol: '$' }}
        className={({ isDisabled }) => (isDisabled ? 'off' : 'on')}
      />,
    );
    expect(root(container)).toHaveClass('field', 'number-field', 'on');
  });

  it('keeps the wheel off in money mode', () => {
    const onChange = vi.fn();
    render(<NumberField label="Amount" money={{ symbol: '$' }} defaultValue={100} onChange={onChange} />);
    act(() => {
      amount().focus();
    });
    act(() => {
      amount().dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true, cancelable: true }));
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(amount()).toHaveValue('1.00');
  });

  const AXE_CASES: [name: string, field: () => ReactElement][] = [
    [
      'labelled money',
      () => (
        <NumberField label="Amount" description="Before tax" money={{ symbol: '$' }} defaultValue={123450} />
      ),
    ],
    [
      'unlabelled',
      () => <NumberField aria-label="Minimum amount" money={{ symbol: '$' }} placeholder="Min" />,
    ],
    [
      'negative with the sign pressed',
      () => <NumberField label="Amount" money={{ symbol: '$' }} allowsNegative defaultValue={-4250} />,
    ],
    ['with steppers', () => <NumberField label="Guests" hasStepper defaultValue={2} />],
    ['changed', () => <NumberField label="Amount" money={{ symbol: '$' }} defaultValue={100} isChanged />],
    [
      'invalid',
      () => (
        <NumberField
          label="Amount"
          money={{ symbol: '$' }}
          defaultValue={1500000}
          isInvalid
          errorMessage="Enter an amount under $10,000"
        />
      ),
    ],
    [
      'disabled',
      () => (
        <NumberField label="Amount" money={{ symbol: '$' }} allowsNegative defaultValue={100} isDisabled />
      ),
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, field) => {
    const { container } = render(field());
    await expectNoA11yViolations(container);
  });

  it('refuses in its types what money and a plain number do not take', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error money is typed, never nudged: no steppers
    const stepped = <NumberField label="Amount" money={{ symbol: '$' }} hasStepper />;
    // @ts-expect-error money never snaps to a step
    const step = <NumberField label="Amount" money={{ symbol: '$' }} step={5} />;
    // @ts-expect-error the currency style is the app's symbol, never Intl's
    const currency = <NumberField label="Amount" formatOptions={{ style: 'currency', currency: 'USD' }} />;
    // @ts-expect-error a field with no label, aria-label or aria-labelledby has no name
    const nameless = <NumberField money={{ symbol: '$' }} />;
    // @ts-expect-error the steppers are named from labels, which keep the field's label after them
    const named = <NumberField label="Guests" hasStepper incrementAriaLabel="More" />;
    // @ts-expect-error compact notation's text comes from Intl, so the server's face could not match it
    const compact = <NumberField label="Views" formatOptions={{ notation: 'compact' }} />;
    // @ts-expect-error compactDisplay belongs to compact notation
    const display = <NumberField label="Views" formatOptions={{ compactDisplay: 'short' }} />;
    const money = <NumberField label="Amount" money={{ symbol: '$', fractionDigits: 0 }} />;
    const plain = (
      <NumberField aria-label="Guests" hasStepper step={2} formatOptions={{ style: 'unit', unit: 'day' }} />
    );
    expect([stepped, step, currency, nameless, named, compact, display, money, plain]).toHaveLength(9);
  });
});

/**
 * React Aria's useNumberField commits the typed text on blur inside flushSync (useNumberField.mjs:60-76, in
 * react-aria 3.53.1). A blur the browser sends while React commits, as when an app moves focus from a layout
 * effect or disables or removes the focused field, would make React log "flushSync was called from inside a
 * lifecycle method", in every mode, at any value, with React Aria's own NumberField too. NumberField defers
 * React Aria's blur handler one microtask, which runs after React's commit, so nothing is logged and the commit
 * and its announcement still happen.
 */
function SavesOnEnter(): ReactElement {
  const [saved, setSaved] = useState(false);
  const done = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (saved) done.current?.focus();
  }, [saved]);
  return (
    <>
      <NumberField
        label="Guests"
        value={0}
        minValue={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter') setSaved(true);
        }}
      />
      <button ref={done} type="button">
        Done
      </button>
    </>
  );
}

/**
 * Enter disables the field while the app saves, and the app moves focus to Done from a layout effect, so the
 * browser's focusout leaves a disabled field inside React's commit. React Aria commits a disabled field's text
 * from a focusout listener of its own (useSyntheticBlurEvent, interactions/utils.mjs:41-105), which flushed there.
 */
function DisablesOnEnter({ onBlur }: { onBlur?: () => void }): ReactElement {
  const [saving, setSaving] = useState(false);
  const done = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (saving) done.current?.focus();
  }, [saving]);
  return (
    <>
      <NumberField
        label="Guests"
        defaultValue={0}
        minValue={0}
        isDisabled={saving}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter') setSaving(true);
        }}
      />
      <button ref={done} type="button">
        Done
      </button>
    </>
  );
}

describe('NumberField disabled while it holds focus', () => {
  /** Saves from the field, which disables it, and returns the focusouts the document heard from it. */
  const saveAndDisable = async (onBlur?: () => void): Promise<FocusEvent[]> => {
    const heard: FocusEvent[] = [];
    const listen = (event: FocusEvent): void => {
      if (event.target === amount('Guests')) heard.push(event);
    };
    document.addEventListener('focusout', listen);
    try {
      const user = userEvent.setup();
      render(<DisablesOnEnter onBlur={onBlur} />);
      await user.click(amount('Guests'));
      await user.keyboard('{Enter}');
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    } finally {
      document.removeEventListener('focusout', listen);
    }
    return heard;
  };

  it('logs nothing when it loses focus inside a commit', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await saveAndDisable();
    expect(amount('Guests')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
    expect(error.mock.calls.map((call) => String(call[0]))).toEqual([]);
  });

  it("sends one focusout and runs the app's onBlur once", async () => {
    const onBlur = vi.fn();
    const heard = await saveAndDisable(onBlur);
    expect(heard).toHaveLength(1);
    expect(heard[0]?.relatedTarget).toBe(screen.getByRole('button', { name: 'Done' }));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('sends the stopped focusout itself when React Aria sends none', async () => {
    // Focused while React ignores events, from an insertion effect, so React Aria never heard the focus and holds
    // no listener of its own to replace the browser's focusout.
    function FocusedInACommit({ step }: { step: 'idle' | 'focus' | 'disable' }): ReactElement {
      const done = useRef<HTMLButtonElement>(null);
      useInsertionEffect(() => {
        if (step === 'focus') document.querySelector<HTMLInputElement>('.number-field-input')?.focus();
      }, [step]);
      useLayoutEffect(() => {
        if (step === 'disable') done.current?.focus();
      }, [step]);
      return (
        <>
          <NumberField label="Guests" isDisabled={step === 'disable'} />
          <button ref={done} type="button">
            Done
          </button>
        </>
      );
    }
    const heard: FocusEvent[] = [];
    const listen = (event: FocusEvent): void => {
      heard.push(event);
    };
    const { rerender } = render(<FocusedInACommit step="idle" />);
    rerender(<FocusedInACommit step="focus" />);
    expect(amount('Guests')).toHaveFocus();
    document.addEventListener('focusout', listen);
    try {
      await act(async () => {
        rerender(<FocusedInACommit step="disable" />);
        await Promise.resolve();
      });
    } finally {
      document.removeEventListener('focusout', listen);
    }
    expect(heard).toHaveLength(1);
    expect(heard[0]?.target).toBe(amount('Guests'));
    expect(heard[0]?.relatedTarget).toBe(screen.getByRole('button', { name: 'Done' }));
  });
});

describe('NumberField and React Aria', () => {
  /** Saves the field from the keyboard, as the app above does, and returns what React logged as errors. */
  const saveFromTheField = async (): Promise<string[]> => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<SavesOnEnter />);
    await user.click(amount('Guests'));
    await user.keyboard('{Enter}');
    return error.mock.calls.map((call) => String(call[0]));
  };

  it('moves focus off the field during a commit, the case the next test pins', async () => {
    await saveFromTheField();
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
  });

  // Expected to fail until 0.10: the blur came inside React's commit and React Aria flushed in it. The field now
  // runs React Aria's blur handler one microtask later, after the commit.
  it('logs nothing when focus leaves the field during a commit (React Aria flushes on blur)', async () => {
    expect(await saveFromTheField()).toEqual([]);
  });

  it('commits the typed value before a click that follows the blur', async () => {
    const user = userEvent.setup();
    let committed: number | null = null;
    const read: (number | null)[] = [];
    render(
      <>
        <NumberField
          label="Guests"
          onChange={(next) => {
            committed = next;
          }}
        />
        <Button
          onPress={() => {
            read.push(committed);
          }}
        >
          Read
        </Button>
      </>,
    );
    await user.type(amount('Guests'), '12');
    await user.click(screen.getByRole('button', { name: 'Read' }));
    expect(read).toEqual([12]);
  });

  it('commits before a following submit and the FormData holds the value', async () => {
    const user = userEvent.setup();
    const sent: (FormDataEntryValue | null)[] = [];
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sent.push(new FormData(event.currentTarget).get('amount'));
        }}
      >
        <NumberField label="Amount" money={{ symbol: '$' }} name="amount" />
        <Button type="submit">Send</Button>
      </form>,
    );
    await user.type(amount(), '12.50');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(sent).toEqual(['1250']);
  });

  it('still announces a corrected value on blur', async () => {
    const user = userEvent.setup();
    render(<NumberField label="Amount" money={{ symbol: '$' }} />);
    await user.type(amount(), '1234.5');
    await user.tab();
    expect(amount()).toHaveValue('1,234.50');
    // React Aria's announcer, which it keeps on the body across tests: the last message is the corrected text.
    const said = document.querySelector('[data-live-announcer] [aria-live="assertive"]');
    expect(said?.lastElementChild).toHaveTextContent('1,234.50');
  });

  it("runs the app's onBlur and onFocusChange(false) one microtask after the blur", async () => {
    const onBlur = vi.fn();
    const onFocusChange = vi.fn();
    render(<NumberField label="Guests" onBlur={onBlur} onFocusChange={onFocusChange} />);
    const input = amount('Guests');
    act(() => {
      input.focus();
    });
    expect(onFocusChange).toHaveBeenLastCalledWith(true);
    await act(async () => {
      input.blur();
      // The browser's blur has run React's handler, and the deferred one waits for this task to end.
      expect(onBlur).not.toHaveBeenCalled();
      expect(onFocusChange).not.toHaveBeenCalledWith(false);
      await Promise.resolve();
    });
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onFocusChange).toHaveBeenLastCalledWith(false);
    // The event keeps its target and currentTarget, which React clears after dispatch and React Aria compares.
    const event = onBlur.mock.calls[0]?.[0] as { target: unknown; currentTarget: unknown; type: string };
    expect(event.target).toBe(input);
    expect(event.currentTarget).toBe(input);
    expect(event.type).toBe('blur');
  });
});

/**
 * The consumer's reproduction (spec section 24, ruling 6): a plain NumberField with `minValue={0}` in a Dialog
 * titled "Add a plan", labelled "Payments made"; 0 typed, then Save or the next field pressed. The field is
 * controlled, as the consumer's forms are, unless `uncontrolled`; Save submits the form, or with `closeOnPress`
 * saves and closes the Dialog from its own press.
 */
function AddAPlan({
  uncontrolled = false,
  closeOnPress = false,
  onSave,
}: {
  uncontrolled?: boolean;
  closeOnPress?: boolean;
  onSave: (payments: number | null) => void;
}): ReactElement {
  const formId = useId();
  const [payments, setPayments] = useState<number | null>(null);
  return (
    <DialogTrigger>
      <Button>Add a plan</Button>
      <Dialog
        title="Add a plan"
        actions={({ close }) =>
          closeOnPress ? (
            <Button
              onPress={() => {
                onSave(payments);
                close();
              }}
            >
              Save
            </Button>
          ) : (
            <Button type="submit" form={formId}>
              Save
            </Button>
          )
        }
      >
        {({ close }) => (
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              if (uncontrolled) {
                const sent = new FormData(event.currentTarget).get('payments');
                onSave(sent === null || sent === '' ? null : Number(sent));
              } else onSave(payments);
              close();
            }}
          >
            {uncontrolled ? (
              <NumberField label="Payments made" name="payments" minValue={0} />
            ) : (
              <NumberField label="Payments made" minValue={0} value={payments} onChange={setPayments} />
            )}
            <TextField label="Name" />
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

describe("NumberField, the consumer's reproduction", () => {
  /** Opens the Dialog, types 0 in Payments made and returns what React logged as errors and warnings. */
  const typeZero = async (
    props: Omit<Parameters<typeof AddAPlan>[0], 'onSave'> = {},
  ): Promise<{
    user: ReturnType<typeof userEvent.setup>;
    saved: (number | null)[];
    logged: () => string[];
  }> => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const saved: (number | null)[] = [];
    render(<AddAPlan {...props} onSave={(next) => saved.push(next)} />);
    await user.click(screen.getByRole('button', { name: 'Add a plan' }));
    await user.click(amount('Payments made'));
    await user.keyboard('0');
    const logged = (): string[] =>
      [...error.mock.calls, ...warn.mock.calls].map((call) => call.map(String).join(' '));
    return { user, saved, logged };
  };

  it('types 0 and presses Save: saves 0 and logs nothing', async () => {
    const { user, saved, logged } = await typeZero();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved).toEqual([0]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(logged()).toEqual([]);
  });

  it('types 0 and presses the next field: commits 0 and logs nothing', async () => {
    const { user, logged } = await typeZero();
    await user.click(screen.getByRole('textbox', { name: 'Name' }));
    expect(amount('Payments made')).toHaveValue('0');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    expect(logged()).toEqual([]);
  });

  it('types 0 and presses Save with an uncontrolled field: saves 0 and logs nothing', async () => {
    const { user, saved, logged } = await typeZero({ uncontrolled: true });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved).toEqual([0]);
    expect(logged()).toEqual([]);
  });

  it('types 0 and presses a Save that closes the Dialog from onPress: saves 0 and logs nothing', async () => {
    const { user, saved, logged } = await typeZero({ closeOnPress: true });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved).toEqual([0]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(logged()).toEqual([]);
  });
});

describe('NumberField, changed with no label', () => {
  it('marks a changed field with no label, and reads the mark after its name', async () => {
    const { container, rerender } = render(
      <NumberField aria-label="Amount, Corner Mart" defaultValue={12} isChanged />,
    );
    const field = root(container);
    expect(field).toHaveAttribute('data-changed');
    expect(field).toHaveAttribute('data-unlabelled', '');
    const mark = container.querySelector('.field-changed-mark');
    expect(mark).toHaveTextContent('Changed');
    const control = screen.getByRole('textbox', { name: 'Amount, Corner Mart' });
    // In the control, after the input.
    expect(mark?.parentElement).toHaveClass('number-field-control');
    expect(mark?.previousElementSibling).toHaveClass('number-field-input');
    // React Aria's own descriptions come first, the chosen value or range; the mark's word ends it.
    expect(control).toHaveAccessibleDescription(/(^| )Changed$/);
    expect(control.getAttribute('aria-describedby')?.split(' ')).toContain(mark?.id);
    expect(container.querySelector('.field-changed')).toBeNull();
    await expectNoA11yViolations(container);
    // With a label the chip says it, and no mark is drawn.
    rerender(<NumberField label="Amount" defaultValue={12} isChanged />);
    expect(container.querySelector('.field-changed-mark')).toBeNull();
    expect(container.querySelector('.field-changed')).not.toBeNull();
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
  });

  it('drops the mark while invalid', () => {
    const { container } = render(
      <NumberField aria-label="Amount, Corner Mart" isChanged isInvalid errorMessage="Enter an amount." />,
    );
    expect(container.querySelector('.field-changed-mark')).toBeNull();
    // Nothing names a mark that is gone.
    for (const described of container.querySelectorAll('[aria-describedby]')) {
      for (const id of described.getAttribute('aria-describedby')?.split(' ') ?? []) {
        expect(document.getElementById(id), id).not.toBeNull();
      }
    }
  });
});
