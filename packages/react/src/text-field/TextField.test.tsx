import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { TextField, type TextFieldProps } from './TextField';

/** A field the caller controls, the way a form library would. */
function Controlled(props: TextFieldProps): ReactElement {
  const [value, setValue] = useState('Northwind');
  return <TextField {...props} value={value} onChange={setValue} />;
}

const root = (container: HTMLElement): Element => {
  const element = container.firstElementChild;
  if (!element) throw new Error('Nothing rendered');
  return element;
};

describe('TextField', () => {
  it('renders a labelled input with a hint, inside a field', async () => {
    const { container } = render(
      <TextField label="Workspace name" description="Shown in the header." placeholder="Northwind Studio" />,
    );
    const input = screen.getByRole('textbox', { name: 'Workspace name' });
    expect(input).toHaveClass('input');
    expect(input).toHaveAttribute('placeholder', 'Northwind Studio');
    expect(input).toHaveAccessibleDescription('Shown in the header.');
    expect(screen.getByText('Workspace name')).toHaveClass('field-label');
    expect(screen.getByText('Shown in the header.')).toHaveClass('field-description');
    expect(root(container)).toHaveClass('field');
    expect(root(container)).not.toHaveAttribute('data-changed');
    expect(root(container)).not.toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
  });

  it('puts its parts in the order the field contract asks for', () => {
    const { container } = render(
      <TextField
        label="Short description"
        description="One sentence."
        isInvalid
        errorMessage="Too vague."
        budget={10}
        defaultValue="abcdefgh"
      />,
    );
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'field-head',
      'input',
      'field-description',
      'field-error',
      'field-counter',
    ]);
  });

  it('types into an uncontrolled field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Name" defaultValue="Northwind" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Northwind');
    await user.type(input, ' East');
    expect(input).toHaveValue('Northwind East');
    expect(onChange).toHaveBeenCalledTimes(5);
    expect(onChange).toHaveBeenLastCalledWith('Northwind East');
  });

  it('follows the value of a controlled field, and tells the caller what was typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<TextField label="Name" value="one" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'x');
    expect(onChange).toHaveBeenCalledWith('onex');
    expect(input).toHaveValue('one');
    rerender(<TextField label="Name" value="two" onChange={onChange} />);
    expect(input).toHaveValue('two');
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled label="Name" />);
    const input = screen.getByRole('textbox');
    await user.type(input, ' East');
    expect(input).toHaveValue('Northwind East');
  });

  it('submits its value in a plain form under its name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextField label="Email" name="email" defaultValue="a@b.co" />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('email')).toBe('a@b.co');
    await user.type(screen.getByRole('textbox'), 'm');
    expect(new FormData(form).get('email')).toBe('a@b.com');
  });

  it('shows the error and sets data-invalid after a required field is submitted empty', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextField label="Name" name="name" isRequired errorMessage="Enter a name." />
        <button type="submit">Save</button>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: /Name/ });
    expect(input).toBeRequired();
    expect(screen.queryByText('Enter a name.')).not.toBeInTheDocument();
    expect(root(container).firstElementChild).not.toHaveAttribute('data-invalid');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const error = screen.getByText('Enter a name.');
    expect(error).toHaveClass('field-error');
    expect(input).toHaveAccessibleDescription('Enter a name.');
    expect(container.querySelector('.field')).toHaveAttribute('data-invalid');
    expect(input).toBeInvalid();
    await expectNoA11yViolations(container);
    // The native error stays while the field is being edited and clears when the edit is committed.
    await user.type(input, 'Northwind');
    await user.tab();
    expect(screen.queryByText('Enter a name.')).not.toBeInTheDocument();
    expect(container.querySelector('.field')).not.toHaveAttribute('data-invalid');
  });

  it('shows the message of a custom validate function', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        label="Email"
        defaultValue="nope"
        validationBehavior="aria"
        validate={(value) => (value.includes('@') ? null : 'Enter an email address.')}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(screen.getByText('Enter an email address.')).toHaveClass('field-error');
    expect(input).toBeInvalid();
    await user.type(input, '@x.co');
    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
    expect(input).toBeValid();
  });

  it('blocks a submit that validate rejects, with the native behavior', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <TextField
          label="Email"
          defaultValue="nope"
          validate={(value) => (value.includes('@') ? null : 'Enter an email address.')}
        />
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter an email address.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.type(screen.getByRole('textbox'), '@x.co');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('builds the error from a function of the validation result', () => {
    render(
      <TextField
        label="Email"
        defaultValue="nope"
        validationBehavior="aria"
        validate={() => 'Too short.'}
        errorMessage={({ isInvalid, validationErrors }) =>
          `${isInvalid ? 'Invalid' : 'Valid'}: ${validationErrors.join(' ')}`
        }
      />,
    );
    expect(screen.getByText('Invalid: Too short.')).toHaveClass('field-error');
  });

  it('shows the changed chip, and a screen reader reads it with the field', async () => {
    const { container } = render(
      <TextField
        label="Workspace name"
        description="Shown in the header."
        isChanged
        defaultValue="Northwind"
      />,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    expect(chip.parentElement).toHaveClass('field-head');
    const input = screen.getByRole('textbox', { name: 'Workspace name' });
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    expect(input).toHaveAccessibleDescription('Shown in the header. Changed');
    await expectNoA11yViolations(container);
  });

  it('takes the chip text from changedLabel', () => {
    render(<TextField label="Name" isChanged changedLabel="Unsaved" />);
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Unsaved');
  });

  it('keeps the chip in the page, unannounced, while the field is not changed', () => {
    render(<TextField label="Name" description="Shown in the header." />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAccessibleDescription('Shown in the header.');
    expect(input.getAttribute('aria-describedby')?.split(' ')).not.toContain(screen.getByText('Changed').id);
  });

  it('adds the chip to the aria-describedby the caller passes', () => {
    render(
      <>
        <p id="note">Visible to admins.</p>
        <TextField label="Name" description="Shown in the header." aria-describedby="note" isChanged />
      </>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Shown in the header. Visible to admins. Changed',
    );
  });

  it('draws no chip for a field without a label row', () => {
    const { container } = render(<TextField aria-label="Search" isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(container.querySelector('.field-head')).toBeNull();
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('lets invalid outrank changed: the chip is gone and no longer announced', async () => {
    const { container, rerender } = render(
      <TextField label="Name" isChanged errorMessage="Enter a name." defaultValue="!" />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    const chipId = screen.getByText('Changed').id;
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(chipId);
    rerender(<TextField label="Name" isChanged isInvalid errorMessage="Enter a name." defaultValue="!" />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(input.getAttribute('aria-describedby')?.split(' ')).not.toContain(chipId);
    expect(input).toHaveAccessibleDescription('Enter a name.');
    await expectNoA11yViolations(container);
  });

  it('lets invalid outrank changed when React Aria finds the field invalid', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextField label="Name" name="name" isRequired isChanged errorMessage="Enter a name." />
        <button type="submit">Save</button>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: /Name/ });
    expect(screen.getByText('Changed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(container.querySelector('.field')).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(input).toHaveAccessibleDescription('Enter a name.');
    await user.type(input, 'N');
    await user.tab();
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription('Changed');
  });

  it('counts an uncontrolled value, from its default and as it is typed', async () => {
    const user = userEvent.setup();
    render(<TextField label="Short description" defaultValue="abcdefgh" budget={10} />);
    const input = screen.getByRole('textbox');
    const counter = screen.getByRole('status');
    expect(counter).toHaveClass('field-counter');
    expect(counter).toHaveTextContent('8 of about 10');
    await user.type(input, 'ij');
    expect(counter).toHaveTextContent('10 of about 10');
    expect(counter).not.toHaveAttribute('data-over');
    await user.clear(input);
    await user.type(input, 'ab');
    expect(counter).toBeEmptyDOMElement();
  });

  it('counts a controlled value, and counts the prop and not the typing', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TextField label="Name" value="abcdefgh" onChange={vi.fn()} budget={10} />);
    expect(screen.getByRole('status')).toHaveTextContent('8 of about 10');
    await user.type(screen.getByRole('textbox'), 'xyz');
    expect(screen.getByRole('status')).toHaveTextContent('8 of about 10');
    rerender(<TextField label="Name" value="abcdefghij" onChange={vi.fn()} budget={10} />);
    expect(screen.getByRole('status')).toHaveTextContent('10 of about 10');
  });

  it('counts the value of a field the caller controls', async () => {
    const user = userEvent.setup();
    render(<Controlled label="Name" budget={12} />);
    expect(screen.getByRole('status')).toHaveTextContent('9 of about 12');
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(screen.getByRole('status')).toHaveTextContent('12 of about 12');
  });

  it('follows a form reset back to the default value', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextField label="Name" defaultValue="abcdefgh" budget={10} />
      </form>,
    );
    await user.type(screen.getByRole('textbox'), 'ijk');
    expect(screen.getByRole('status')).toHaveTextContent('11 of about 10');
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    act(() => {
      form.reset();
    });
    expect(screen.getByRole('textbox')).toHaveValue('abcdefgh');
    expect(screen.getByRole('status')).toHaveTextContent('8 of about 10');
  });

  it('never blocks typing past the budget, and the value stays valid', async () => {
    const user = userEvent.setup();
    render(<TextField label="Short description" budget={10} />);
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('maxlength');
    await user.type(input, 'fourteen chars');
    expect(input).toHaveValue('fourteen chars');
    expect(input).toBeValid();
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('status')).toHaveTextContent('14 of about 10');
    expect(screen.getByRole('status')).toHaveAttribute('data-over');
  });

  it('words the count with counter.label, in the status region a screen reader announces', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        label="Kurzbeschreibung"
        defaultValue="abcdefgh"
        budget={10}
        counter={{
          label: ({ count, budget, over }) =>
            `${String(count)} von etwa ${String(budget)}${over ? ', zu lang' : ''}`,
        }}
      />,
    );
    const counter = screen.getByRole('status');
    expect(counter).toHaveTextContent('8 von etwa 10');
    await user.type(screen.getByRole('textbox', { name: 'Kurzbeschreibung' }), 'ijk');
    expect(counter).toHaveTextContent('11 von etwa 10, zu lang');
    expect(counter).toHaveAttribute('data-over');
  });

  it('shows the count from the share of the budget counter.showFrom gives', async () => {
    const user = userEvent.setup();
    render(
      <TextField label="Kurzbeschreibung" defaultValue="abcd" budget={10} counter={{ showFrom: 0.5 }} />,
    );
    const counter = screen.getByRole('status');
    // 4 of 10 is under half the budget, and 5 is the first count shown, where 70% would wait for 7.
    expect(counter).toBeEmptyDOMElement();
    await user.type(screen.getByRole('textbox', { name: 'Kurzbeschreibung' }), 'e');
    expect(counter).toHaveTextContent('5 of about 10');
  });

  it('has no counter without a budget', () => {
    render(<TextField label="Name" defaultValue="abcdefgh" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('disables the control and leaves it out of the form', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextField label="Name" name="name" defaultValue="Northwind" isDisabled />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toBeDisabled();
    expect(container.querySelector('.field')).toHaveAttribute('data-disabled');
    await user.type(input, 'x');
    expect(input).toHaveValue('Northwind');
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).has('name')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('keeps a read-only value readable, selectable and in the form', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextField label="Name" name="name" defaultValue="Northwind" isReadOnly />
      </form>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
    expect(container.querySelector('.field')).toHaveAttribute('data-readonly');
    await user.type(input, 'x');
    expect(input).toHaveValue('Northwind');
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('name')).toBe('Northwind');
  });

  it('passes the input attributes through', () => {
    render(<TextField label="Email" type="email" name="email" autoComplete="email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('forwards ref to the field and inputRef to the input', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    render(<TextField ref={ref} inputRef={inputRef} label="Name" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('field');
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(inputRef.current).toBe(screen.getByRole('textbox'));
  });

  it('merges a string className after its own', () => {
    const { container } = render(<TextField label="Name" className="extra" />);
    expect(root(container)).toHaveClass('field', 'extra');
  });

  it('merges a function className, which receives the field state', () => {
    const className = vi.fn(
      ({
        isInvalid,
        isDisabled,
      }: {
        isInvalid: boolean;
        isDisabled: boolean;
        defaultClassName: string | undefined;
      }) => (isInvalid ? 'is-invalid' : isDisabled ? 'is-disabled' : 'is-fine'),
    );
    const { container, rerender } = render(<TextField label="Name" className={className} />);
    expect(root(container)).toHaveClass('field', 'is-fine');
    rerender(<TextField label="Name" className={className} isInvalid />);
    expect(root(container)).toHaveClass('field', 'is-invalid');
    rerender(<TextField label="Name" className={className} isDisabled />);
    expect(root(container)).toHaveClass('field', 'is-disabled');
    expect(className.mock.calls[0]?.[0].defaultClassName).toBe('react-aria-TextField');
  });

  it.each([
    ['plain', {}],
    ['with a hint', { description: 'Shown in the header.' }],
    ['with a placeholder', { placeholder: 'Northwind Studio' }],
    ['changed', { isChanged: true }],
    ['invalid', { isInvalid: true, errorMessage: 'Enter a name.' }],
    ['invalid and changed', { isInvalid: true, isChanged: true, errorMessage: 'Enter a name.' }],
    ['counted', { budget: 10, defaultValue: 'abcdefgh' }],
    ['over its budget', { budget: 5, defaultValue: 'abcdefgh' }],
    ['disabled', { isDisabled: true }],
    ['read-only', { isReadOnly: true, defaultValue: 'Northwind' }],
    ['required', { isRequired: true }],
  ] satisfies [string, Partial<TextFieldProps>][])('has no axe violations when %s', async (_state, props) => {
    const { container } = render(<TextField label="Workspace name" {...props} />);
    await expectNoA11yViolations(container);
  });
});
