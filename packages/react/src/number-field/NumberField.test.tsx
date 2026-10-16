import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
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
 * A known React Aria issue, kept as a test that is expected to fail, so it reports when an update fixes it.
 * React Aria's useNumberField commits the typed text on blur inside flushSync (useNumberField.mjs:60-66, in
 * react-aria 3.53.1). A blur the browser sends while React commits, as when an app moves focus from a layout
 * effect or disables or removes the focused field, makes React log "flushSync was called from inside a
 * lifecycle method". It happens in every mode, at any value, with React Aria's own NumberField too, and only in
 * development: the commit still lands, a render later. The library cannot reach the call without taking React
 * Aria's blur from it, which would drop the announcement of the corrected value.
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

  it.fails(
    'logs nothing when focus leaves the field during a commit (React Aria flushes on blur)',
    async () => {
      expect(await saveFromTheField()).toEqual([]);
    },
  );
});
