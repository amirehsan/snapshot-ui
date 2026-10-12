import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Switch, type SwitchProps } from './Switch';

/** A switch the caller controls, the way a form library would. */
function Controlled(props: SwitchProps): ReactElement {
  const [isSelected, setSelected] = useState(false);
  return <Switch {...props} isSelected={isSelected} onChange={setSelected} />;
}

const root = (container: HTMLElement): Element => {
  const element = container.firstElementChild;
  if (!element) throw new Error('Nothing rendered');
  return element;
};

const formOf = (container: HTMLElement): HTMLFormElement => {
  const form = container.querySelector('form');
  if (!form) throw new Error('No form');
  return form;
};

describe('Switch', () => {
  it('renders a switch with its label, inside a field', async () => {
    const { container } = render(<Switch>Weekly digest</Switch>);
    const control = screen.getByRole('switch', { name: 'Weekly digest' });
    expect(control).not.toBeChecked();
    expect(root(container)).toHaveClass('field');
    expect(root(container)).not.toHaveAttribute('data-changed');
    const row = screen.getByText('Weekly digest').closest('label');
    expect(row).toHaveClass('switch');
    expect(row).toContainElement(control);
    await expectNoA11yViolations(container);
  });

  it('draws the track and the thumb as decoration inside the row', () => {
    render(<Switch>Weekly digest</Switch>);
    const track = screen.getByText('Weekly digest').closest('label')?.querySelector('.switch-track');
    expect(track).toHaveAttribute('aria-hidden', 'true');
    expect(track?.firstElementChild).toHaveClass('switch-thumb');
    expect(track?.firstElementChild?.children).toHaveLength(0);
  });

  it('puts the row first and the hint after it', async () => {
    const { container } = render(<Switch description="Every Tuesday morning.">Weekly digest</Switch>);
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'field-head',
      'field-description',
    ]);
    const control = screen.getByRole('switch', { name: 'Weekly digest' });
    expect(control).toHaveAccessibleDescription('Every Tuesday morning.');
    expect(screen.getByText('Every Tuesday morning.')).toHaveClass('field-description');
    await expectNoA11yViolations(container);
  });

  it('turns on and off with a click on the label, and on the input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch onChange={onChange}>Weekly digest</Switch>);
    const control = screen.getByRole('switch');
    await user.click(screen.getByText('Weekly digest'));
    expect(control).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.click(control);
    expect(control).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('turns on and off with Space, and not with Enter', async () => {
    const user = userEvent.setup();
    render(<Switch>Weekly digest</Switch>);
    const control = screen.getByRole('switch');
    await user.tab();
    expect(control).toHaveFocus();
    await user.keyboard(' ');
    expect(control).toBeChecked();
    await user.keyboard(' ');
    expect(control).not.toBeChecked();
    await user.keyboard('{Enter}');
    expect(control).not.toBeChecked();
  });

  it('starts from defaultSelected when uncontrolled', () => {
    render(<Switch defaultSelected>Weekly digest</Switch>);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('marks the row with data-selected while it is on', async () => {
    const user = userEvent.setup();
    render(<Switch>Weekly digest</Switch>);
    const row = screen.getByText('Weekly digest').closest('label');
    expect(row).not.toHaveAttribute('data-selected');
    await user.click(screen.getByRole('switch'));
    expect(row).toHaveAttribute('data-selected');
  });

  it('follows isSelected when controlled, and tells the caller what was asked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Switch isSelected={false} onChange={onChange}>
        Weekly digest
      </Switch>,
    );
    const control = screen.getByRole('switch');
    await user.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(control).not.toBeChecked();
    rerender(
      <Switch isSelected onChange={onChange}>
        Weekly digest
      </Switch>,
    );
    expect(control).toBeChecked();
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled>Weekly digest</Controlled>);
    const control = screen.getByRole('switch');
    await user.click(control);
    expect(control).toBeChecked();
    await user.click(control);
    expect(control).not.toBeChecked();
  });

  it('submits its value in a plain form only while it is on', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Switch name="digest" value="weekly">
          Weekly digest
        </Switch>
      </form>,
    );
    const form = formOf(container);
    expect(new FormData(form).has('digest')).toBe(false);
    await user.click(screen.getByRole('switch'));
    expect(new FormData(form).get('digest')).toBe('weekly');
    await user.click(screen.getByRole('switch'));
    expect(new FormData(form).has('digest')).toBe(false);
  });

  it('submits the browser default, on, when it has no value', () => {
    const { container } = render(
      <form>
        <Switch name="digest" defaultSelected>
          Weekly digest
        </Switch>
      </form>,
    );
    expect(new FormData(formOf(container)).get('digest')).toBe('on');
  });

  it('follows a form reset back to the default', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Switch name="digest" defaultSelected>
          Weekly digest
        </Switch>
      </form>,
    );
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).not.toBeChecked();
    act(() => {
      formOf(container).reset();
    });
    expect(screen.getByRole('switch')).toBeChecked();
    expect(new FormData(formOf(container)).get('digest')).toBe('on');
  });

  it('is named by aria-label when it has no visible label', async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch aria-label="Sample" defaultSelected />);
    const control = screen.getByRole('switch', { name: 'Sample' });
    expect(control).toBeChecked();
    await user.click(control);
    expect(control).not.toBeChecked();
    expect(container.querySelector('.switch-track')).not.toBeNull();
    await expectNoA11yViolations(container);
  });

  it('disables the control and leaves it out of the form', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <Switch name="digest" defaultSelected isDisabled onChange={onChange}>
          Weekly digest
        </Switch>
      </form>,
    );
    const control = screen.getByRole('switch', { name: 'Weekly digest' });
    expect(control).toBeDisabled();
    expect(container.querySelector('.field')).toHaveAttribute('data-disabled');
    expect(container.querySelector('.switch')).toHaveAttribute('data-disabled');
    await user.click(screen.getByText('Weekly digest'));
    await user.click(control);
    expect(control).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
    expect(new FormData(formOf(container)).has('digest')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('keeps a read-only switch readable, focusable and in the form, and does not let it change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <Switch name="digest" defaultSelected isReadOnly onChange={onChange}>
          Weekly digest
        </Switch>
      </form>,
    );
    const control = screen.getByRole('switch', { name: 'Weekly digest' });
    expect(control).toHaveAttribute('aria-readonly', 'true');
    expect(screen.getByText('Weekly digest').closest('label')).toHaveAttribute('data-readonly');
    await user.tab();
    expect(control).toHaveFocus();
    await user.keyboard(' ');
    await user.click(screen.getByText('Weekly digest'));
    expect(control).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
    expect(new FormData(formOf(container)).get('digest')).toBe('on');
    await expectNoA11yViolations(container);
  });

  it('shows the changed chip beside the label, and a screen reader reads it with the switch', async () => {
    const { container } = render(
      <Switch isChanged description="Every Tuesday morning.">
        Weekly digest
      </Switch>,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    expect(chip.parentElement).toHaveClass('field-head');
    // The chip sits beside the row, not inside it, so the switch is named by its label alone.
    expect(chip.closest('label')).toBeNull();
    const control = screen.getByRole('switch', { name: 'Weekly digest' });
    expect(control.getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    expect(control).toHaveAccessibleDescription('Every Tuesday morning. Changed');
    await expectNoA11yViolations(container);
  });

  it('takes the chip text from changedLabel', () => {
    render(
      <Switch isChanged changedLabel="Unsaved">
        Weekly digest
      </Switch>,
    );
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAccessibleDescription('Unsaved');
  });

  it('keeps the chip in the page, unannounced, while the switch is not changed', () => {
    render(<Switch description="Every Tuesday morning.">Weekly digest</Switch>);
    const control = screen.getByRole('switch');
    expect(control).toHaveAccessibleDescription('Every Tuesday morning.');
    expect(control.getAttribute('aria-describedby')?.split(' ')).not.toContain(
      screen.getByText('Changed').id,
    );
  });

  it('adds the chip to the aria-describedby the caller passes', () => {
    render(
      <>
        <p id="note">Visible to admins.</p>
        <Switch description="Every Tuesday morning." aria-describedby="note" isChanged>
          Weekly digest
        </Switch>
      </>,
    );
    expect(screen.getByRole('switch')).toHaveAccessibleDescription(
      'Every Tuesday morning. Visible to admins. Changed',
    );
  });

  it('draws no chip for a switch without a visible label, though the root is still changed', () => {
    const { container } = render(<Switch aria-label="Sample" isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-describedby');
  });

  it('shows the chip whichever way the switch is set', async () => {
    const user = userEvent.setup();
    render(<Switch isChanged>Weekly digest</Switch>);
    await user.click(screen.getByRole('switch'));
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAccessibleDescription('Changed');
  });

  it('forwards ref to the field and inputRef to the input', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    render(
      <Switch ref={ref} inputRef={inputRef}>
        Weekly digest
      </Switch>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('field');
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(inputRef.current).toBe(screen.getByRole('switch'));
  });

  it('merges a string className after its own', () => {
    const { container } = render(<Switch className="extra">Weekly digest</Switch>);
    expect(root(container)).toHaveClass('field', 'extra');
  });

  it('merges a function className, which receives the switch state', async () => {
    const user = userEvent.setup();
    const className = vi.fn(
      ({
        isSelected,
        isDisabled,
      }: {
        isSelected: boolean;
        isDisabled: boolean;
        defaultClassName: string | undefined;
      }) => (isDisabled ? 'is-disabled' : isSelected ? 'is-on' : 'is-off'),
    );
    const { container, rerender } = render(<Switch className={className}>Weekly digest</Switch>);
    expect(root(container)).toHaveClass('field', 'is-off');
    await user.click(screen.getByRole('switch'));
    expect(root(container)).toHaveClass('field', 'is-on');
    rerender(
      <Switch className={className} isDisabled>
        Weekly digest
      </Switch>,
    );
    expect(root(container)).toHaveClass('field', 'is-disabled');
    expect(className.mock.calls[0]?.[0].defaultClassName).toBe('react-aria-SwitchField');
  });

  it('passes its other attributes to the input', () => {
    render(
      <Switch name="digest" value="weekly" id="digest-switch">
        Weekly digest
      </Switch>,
    );
    const control = screen.getByRole('switch');
    expect(control).toHaveAttribute('id', 'digest-switch');
    expect(control).toHaveAttribute('name', 'digest');
    expect(control).toHaveAttribute('value', 'weekly');
  });

  it('offers no required or invalid state in its types, since a switch acts as soon as it is flipped', () => {
    expectTypeOf<SwitchProps>().not.toHaveProperty('isRequired');
    expectTypeOf<SwitchProps>().not.toHaveProperty('isInvalid');
    expectTypeOf<SwitchProps>().not.toHaveProperty('validate');
  });

  it.each([
    ['off', {}],
    ['on', { defaultSelected: true }],
    ['with a hint', { description: 'Every Tuesday morning.' }],
    ['disabled and off', { isDisabled: true }],
    ['disabled and on', { isDisabled: true, defaultSelected: true }],
    ['read-only', { isReadOnly: true, defaultSelected: true }],
    ['changed', { isChanged: true }],
    ['changed with a hint', { isChanged: true, description: 'Every Tuesday morning.' }],
  ] satisfies [string, Partial<SwitchProps>][])('has no axe violations when %s', async (_state, props) => {
    const { container } = render(<Switch {...props}>Weekly digest</Switch>);
    await expectNoA11yViolations(container);
  });
});
