import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf, root } from '../../test/dom';
import { Checkbox, type CheckboxProps } from './Checkbox';

/** A checkbox the caller controls, the way a form library would. */
function Controlled(props: CheckboxProps): ReactElement {
  const [selected, setSelected] = useState(false);
  return <Checkbox {...props} isSelected={selected} onChange={setSelected} />;
}

const part = (container: HTMLElement, selector: string): HTMLElement => {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
};

describe('Checkbox', () => {
  it('renders a labelled checkbox inside its field, with the box drawn beside the text', async () => {
    const { container } = render(<Checkbox>Remember me</Checkbox>);
    const input = screen.getByRole('checkbox', { name: 'Remember me' });
    expect(input).not.toBeChecked();
    expect(root(container)).toHaveClass('checkbox-field');
    const row = input.closest('label');
    expect(row).toHaveClass('checkbox');
    // The box is drawn, so it is hidden from assistive technology, and it is not the label's name.
    const box = row?.querySelector('.checkbox-box');
    expect(box).toHaveAttribute('aria-hidden', 'true');
    expect(box?.textContent).toBe('');
    expect(row?.querySelector('.checkbox-text')).toHaveTextContent('Remember me');
    await expectNoA11yViolations(container);
  });

  it('has the box and the text in one label, so the whole row is the target', () => {
    const { container } = render(<Checkbox>Remember me</Checkbox>);
    const labels = container.querySelectorAll('label');
    expect(labels).toHaveLength(1);
    const [row] = labels;
    expect([...(row?.children ?? [])].map((child) => child.className || child.tagName)).toEqual([
      'SPAN', // React Aria's visually hidden wrapper around the input
      'checkbox-box',
      'checkbox-text',
    ]);
  });

  it('toggles when the text, the box or the gap between them is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Checkbox onChange={onChange}>Remember me</Checkbox>);
    const input = screen.getByRole('checkbox');
    await user.click(screen.getByText('Remember me'));
    expect(input).toBeChecked();
    await user.click(part(container, '.checkbox-box'));
    expect(input).not.toBeChecked();
    // The label itself, where the gap and the padding are, is also the target.
    await user.click(part(container, 'label'));
    expect(input).toBeChecked();
    expect(onChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  it('toggles with Space and not with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange}>Remember me</Checkbox>);
    const input = screen.getByRole('checkbox');
    await user.tab();
    expect(input).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(input).not.toBeChecked();
    await user.keyboard(' ');
    expect(input).toBeChecked();
    await user.keyboard(' ');
    expect(input).not.toBeChecked();
    expect(onChange.mock.calls).toEqual([[true], [false]]);
  });

  it('starts checked with defaultSelected and lets the user change it', async () => {
    const user = userEvent.setup();
    render(<Checkbox defaultSelected>Remember me</Checkbox>);
    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
    await user.click(input);
    expect(input).not.toBeChecked();
  });

  it('follows isSelected when the caller controls it, and reports what was pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Checkbox isSelected={false} onChange={onChange}>
        Remember me
      </Checkbox>,
    );
    const input = screen.getByRole('checkbox');
    await user.click(input);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(input).not.toBeChecked();
    rerender(
      <Checkbox isSelected onChange={onChange}>
        Remember me
      </Checkbox>,
    );
    expect(input).toBeChecked();
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled>Remember me</Controlled>);
    const input = screen.getByRole('checkbox');
    await user.click(input);
    expect(input).toBeChecked();
    await user.click(input);
    expect(input).not.toBeChecked();
  });

  it('marks the selected state on the field and on the row', async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox>Remember me</Checkbox>);
    expect(root(container)).not.toHaveAttribute('data-selected');
    await user.click(screen.getByRole('checkbox'));
    expect(root(container)).toHaveAttribute('data-selected');
    expect(container.querySelector('.checkbox')).toHaveAttribute('data-selected');
  });

  it('shows the indeterminate state on the input, the field and the row', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Checkbox isIndeterminate onChange={onChange}>
        Select all
      </Checkbox>,
    );
    const input = screen.getByRole('checkbox', { name: 'Select all' });
    expect(input).toBePartiallyChecked();
    expect((input as HTMLInputElement).indeterminate).toBe(true);
    expect(root(container)).toHaveAttribute('data-indeterminate');
    expect(container.querySelector('.checkbox')).toHaveAttribute('data-indeterminate');
    // Pressing it still reports a change; the caller decides when the mixed state ends.
    await user.click(input);
    expect(onChange).toHaveBeenCalledWith(true);
    await expectNoA11yViolations(container);
  });

  it('leaves the mixed state when the caller clears isIndeterminate', async () => {
    const user = userEvent.setup();
    function SelectAll(): ReactElement {
      const [mixed, setMixed] = useState(true);
      return (
        <Checkbox
          isIndeterminate={mixed}
          onChange={() => {
            setMixed(false);
          }}
        >
          Select all
        </Checkbox>
      );
    }
    render(<SelectAll />);
    const input = screen.getByRole('checkbox');
    expect(input).toBePartiallyChecked();
    await user.click(input);
    expect(input).not.toBePartiallyChecked();
    expect(input).toBeChecked();
  });

  it('omits an unchecked checkbox from the form and submits a checked one under its name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Checkbox name="remember" value="yes">
          Remember me
        </Checkbox>
      </form>,
    );
    const form = formOf(container);
    expect(new FormData(form).has('remember')).toBe(false);
    await user.click(screen.getByRole('checkbox'));
    expect(new FormData(form).get('remember')).toBe('yes');
    await user.click(screen.getByRole('checkbox'));
    expect(new FormData(form).has('remember')).toBe(false);
  });

  it('submits "on" when it has a name and no value', () => {
    const { container } = render(
      <form>
        <Checkbox name="remember" defaultSelected>
          Remember me
        </Checkbox>
      </form>,
    );
    expect(new FormData(formOf(container)).get('remember')).toBe('on');
  });

  it('is back to its default after a form reset', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Checkbox name="remember">Remember me</Checkbox>
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByRole('checkbox');
    await user.click(input);
    expect(input).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).not.toBeChecked();
    expect(new FormData(formOf(container)).has('remember')).toBe(false);
  });

  it('shows the hint as the checkbox description, after the row', async () => {
    const { container } = render(
      <Checkbox description="Off hides the copy under each card.">Show descriptions</Checkbox>,
    );
    const input = screen.getByRole('checkbox', { name: 'Show descriptions' });
    expect(input).toHaveAccessibleDescription('Off hides the copy under each card.');
    const hint = screen.getByText('Off hides the copy under each card.');
    expect(hint).toHaveClass('field-description');
    // The hint is not part of the label, so the name stays the label's own text.
    expect(hint.closest('label')).toBeNull();
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'checkbox',
      'field-description',
    ]);
    await expectNoA11yViolations(container);
  });

  it('shows the error and sets data-invalid after a required checkbox is submitted unchecked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Checkbox name="terms" isRequired errorMessage="Accept the terms to continue.">
          I accept the terms
        </Checkbox>
        <button type="submit">Continue</button>
      </form>,
    );
    const input = screen.getByRole('checkbox', { name: 'I accept the terms' });
    expect(input).toBeRequired();
    expect(screen.queryByText('Accept the terms to continue.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const error = screen.getByText('Accept the terms to continue.');
    expect(error).toHaveClass('field-error');
    expect(input).toHaveAccessibleDescription('Accept the terms to continue.');
    expect(input).toBeInvalid();
    expect(container.querySelector('.checkbox-field')).toHaveAttribute('data-invalid');
    expect(container.querySelector('.checkbox')).toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
    // Checking the box makes it valid again.
    await user.click(input);
    expect(screen.queryByText('Accept the terms to continue.')).not.toBeInTheDocument();
    expect(container.querySelector('.checkbox-field')).not.toHaveAttribute('data-invalid');
  });

  it('shows the message of a custom validate function', async () => {
    const user = userEvent.setup();
    render(
      <Checkbox validationBehavior="aria" validate={(selected) => (selected ? null : 'You must agree.')}>
        I agree
      </Checkbox>,
    );
    expect(screen.getByText('You must agree.')).toHaveClass('field-error');
    expect(screen.getByRole('checkbox')).toBeInvalid();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.queryByText('You must agree.')).not.toBeInTheDocument();
  });

  it('takes the error from a function of the validation result', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Checkbox isRequired errorMessage={(validation) => `Problems: ${validation.validationErrors.length}`}>
          I agree
        </Checkbox>
        <button type="submit">Continue</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/^Problems: \d+$/)).toHaveClass('field-error');
  });

  it('shows the error line of an invalid checkbox and marks it invalid', async () => {
    const { container } = render(
      <Checkbox isInvalid errorMessage="Accept the terms to continue.">
        I accept the terms
      </Checkbox>,
    );
    expect(screen.getByRole('checkbox')).toBeInvalid();
    expect(screen.getByText('Accept the terms to continue.')).toHaveClass('field-error');
    expect(root(container)).toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
  });

  it('cannot be toggled while disabled, and is left out of the form', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <Checkbox name="remember" defaultSelected isDisabled onChange={onChange}>
          Remember me
        </Checkbox>
      </form>,
    );
    const input = screen.getByRole('checkbox');
    expect(input).toBeDisabled();
    expect(root(container).firstElementChild).toHaveAttribute('data-disabled');
    expect(container.querySelector('.checkbox')).toHaveAttribute('data-disabled');
    await user.click(screen.getByText('Remember me'));
    expect(input).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
    expect(new FormData(formOf(container)).has('remember')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('cannot be toggled while read-only, keeps focus, and still submits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <Checkbox name="remember" defaultSelected isReadOnly onChange={onChange}>
          Remember me
        </Checkbox>
      </form>,
    );
    const input = screen.getByRole('checkbox');
    expect(input).not.toBeDisabled();
    expect(container.querySelector('.checkbox')).toHaveAttribute('data-readonly');
    await user.click(screen.getByText('Remember me'));
    await user.keyboard(' ');
    expect(input).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
    await user.tab();
    expect(input).toHaveFocus();
    expect(new FormData(formOf(container)).get('remember')).toBe('on');
  });

  it('can be named with aria-label when it has no visible label', async () => {
    const { container } = render(<Checkbox aria-label="Select row 3" />);
    expect(screen.getByRole('checkbox', { name: 'Select row 3' })).toBeInTheDocument();
    expect(container.querySelector('.checkbox-text')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('keeps a link in the label as part of the text', () => {
    const { container } = render(
      <Checkbox>
        I agree to the <a href="/terms">terms</a>
      </Checkbox>,
    );
    // One text box holds the sentence, so the gap between box and text is not added inside it.
    const text = container.querySelector('.checkbox-text');
    expect(text?.textContent).toBe('I agree to the terms');
    expect(text?.querySelector('a')).toHaveAttribute('href', '/terms');
  });

  it('forwards ref to the field and inputRef to the input', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <Checkbox ref={ref} inputRef={inputRef}>
        Remember me
      </Checkbox>,
    );
    expect(ref.current).toBe(root(container));
    expect(inputRef.current).toBe(screen.getByRole('checkbox'));
  });

  it('merges a string className after its own class', () => {
    const { container } = render(<Checkbox className="mine">Remember me</Checkbox>);
    expect(root(container)).toHaveClass('checkbox-field', 'mine');
    expect(root(container).className.indexOf('checkbox-field')).toBeLessThan(
      root(container).className.indexOf('mine'),
    );
  });

  it('computes className from its state', async () => {
    const user = userEvent.setup();
    const className = vi.fn(({ isSelected }: { isSelected: boolean }) => (isSelected ? 'on' : 'off'));
    const { container } = render(<Checkbox className={className}>Remember me</Checkbox>);
    expect(root(container)).toHaveClass('checkbox-field', 'off');
    await user.click(screen.getByRole('checkbox'));
    expect(root(container)).toHaveClass('checkbox-field', 'on');
    expect(root(container)).not.toHaveClass('off');
  });

  it('has no axe violations when checked', async () => {
    const { container } = render(<Checkbox defaultSelected>Remember me</Checkbox>);
    await expectNoA11yViolations(container);
  });
});
