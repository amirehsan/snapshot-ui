import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { TextArea, type TextAreaProps } from './TextArea';

/** A field the caller controls, the way a form library would. */
function Controlled(props: TextAreaProps): ReactElement {
  const [value, setValue] = useState('Northwind\nStudio');
  return <TextArea {...props} value={value} onChange={setValue} />;
}

describe('TextArea', () => {
  it('renders a labelled textarea with a hint, inside a field', async () => {
    const { container } = render(
      <TextArea
        label="Short description"
        description="Shown in search results."
        placeholder="A shared space"
      />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Short description' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveClass('input', 'textarea');
    expect(textarea).toHaveAttribute('placeholder', 'A shared space');
    expect(textarea).toHaveAccessibleDescription('Shown in search results.');
    expect(screen.getByText('Short description')).toHaveClass('field-label');
    expect(screen.getByText('Shown in search results.')).toHaveClass('field-description');
    expect(root(container)).toHaveClass('field');
    expect(root(container)).not.toHaveAttribute('data-changed');
    expect(root(container)).not.toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a field with no label, aria-label or aria-labelledby has no name
    const nameless = <TextArea />;
    // @ts-expect-error a hint and a placeholder are not a name
    const unnamed = <TextArea description="Shown under the title." placeholder="Title" />;
    const labelled = <TextArea label="Title" />;
    const byAriaLabel = <TextArea aria-label="Title" />;
    const byLabelledby = <TextArea aria-labelledby="heading" />;
    const jsxLabel = <TextArea label={<strong>Title</strong>} />;
    const labelAndAriaLabel = <TextArea label="Title" aria-label="Page title" />;
    const bothAriaProps = <TextArea aria-label="Page title" aria-labelledby="heading" />;
    expect([
      nameless,
      unnamed,
      labelled,
      byAriaLabel,
      byLabelledby,
      jsxLabel,
      labelAndAriaLabel,
      bothAriaProps,
    ]).toHaveLength(8);
  });

  it('is a textarea and not an input: it carries no type once it has mounted', () => {
    render(<TextArea label="Notes" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('type');
  });

  it('puts its parts in the order the field contract asks for', () => {
    const { container } = render(
      <TextArea
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

  it('takes several lines: Enter adds a new line and does not submit the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <TextArea label="Notes" onChange={onChange} />
        <button type="submit">Save</button>
      </form>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    await user.type(textarea, 'one{Enter}two{Enter}{Enter}three');
    expect(textarea).toHaveValue('one\ntwo\n\nthree');
    expect(onChange).toHaveBeenLastCalledWith('one\ntwo\n\nthree');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('types into an uncontrolled field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextArea label="Notes" defaultValue="Northwind" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Northwind');
    await user.type(textarea, ' East');
    expect(textarea).toHaveValue('Northwind East');
    expect(onChange).toHaveBeenCalledTimes(5);
    expect(onChange).toHaveBeenLastCalledWith('Northwind East');
  });

  it('follows the value of a controlled field, and tells the caller what was typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<TextArea label="Notes" value="one" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'x');
    expect(onChange).toHaveBeenCalledWith('onex');
    expect(textarea).toHaveValue('one');
    rerender(<TextArea label="Notes" value={'two\nlines'} onChange={onChange} />);
    expect(textarea).toHaveValue('two\nlines');
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled label="Notes" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Northwind\nStudio');
    await user.type(textarea, '{Enter}East');
    expect(textarea).toHaveValue('Northwind\nStudio\nEast');
  });

  it('submits its lines in a plain form under its name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextArea label="Notes" name="notes" defaultValue="First line" />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('notes')).toBe('First line');
    await user.type(screen.getByRole('textbox'), '{Enter}Second line');
    expect(new FormData(form).get('notes')).toBe('First line\nSecond line');
  });

  it('shows the error and sets data-invalid after a required field is submitted empty', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextArea label="Notes" name="notes" isRequired errorMessage="Write a note." />
        <button type="submit">Save</button>
      </form>,
    );
    const textarea = screen.getByRole('textbox', { name: /Notes/ });
    expect(textarea).toBeRequired();
    expect(screen.queryByText('Write a note.')).not.toBeInTheDocument();
    expect(container.querySelector('.field')).not.toHaveAttribute('data-invalid');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const error = screen.getByText('Write a note.');
    expect(error).toHaveClass('field-error');
    expect(textarea).toHaveAccessibleDescription('Write a note.');
    expect(container.querySelector('.field')).toHaveAttribute('data-invalid');
    expect(textarea).toBeInvalid();
    await expectNoA11yViolations(container);
    // The native error stays while the field is being edited and clears when the edit is committed.
    await user.type(textarea, 'Northwind');
    await user.tab();
    expect(screen.queryByText('Write a note.')).not.toBeInTheDocument();
    expect(container.querySelector('.field')).not.toHaveAttribute('data-invalid');
  });

  it('shows the message of a custom validate function', async () => {
    const user = userEvent.setup();
    render(
      <TextArea
        label="Notes"
        defaultValue="one line"
        validationBehavior="aria"
        validate={(value) => (value.includes('\n') ? null : 'Write at least two lines.')}
      />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(screen.getByText('Write at least two lines.')).toHaveClass('field-error');
    expect(textarea).toBeInvalid();
    await user.type(textarea, '{Enter}two lines');
    expect(screen.queryByText('Write at least two lines.')).not.toBeInTheDocument();
    expect(textarea).toBeValid();
  });

  it('blocks a submit that validate rejects, with the native behavior', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <TextArea
          label="Notes"
          defaultValue="short"
          validate={(value) => (value.length >= 10 ? null : 'Write at least ten characters.')}
        />
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Write at least ten characters.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.type(screen.getByRole('textbox'), ' and more');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('builds the error from a function of the validation result', () => {
    render(
      <TextArea
        label="Notes"
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
      <TextArea
        label="Short description"
        description="Shown in search results."
        isChanged
        defaultValue="Hello"
      />,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    expect(chip.parentElement).toHaveClass('field-head');
    const textarea = screen.getByRole('textbox', { name: 'Short description' });
    expect(textarea.getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    expect(textarea).toHaveAccessibleDescription('Shown in search results. Changed');
    await expectNoA11yViolations(container);
  });

  it('takes the chip text from changedLabel', () => {
    render(<TextArea label="Notes" isChanged changedLabel="Unsaved" />);
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Unsaved');
  });

  it('keeps the chip in the page, unannounced, while the field is not changed', () => {
    render(<TextArea label="Notes" description="Shown in search results." />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAccessibleDescription('Shown in search results.');
    expect(textarea.getAttribute('aria-describedby')?.split(' ')).not.toContain(
      screen.getByText('Changed').id,
    );
  });

  it('adds the chip to the aria-describedby the caller passes', () => {
    render(
      <>
        <p id="note">Visible to admins.</p>
        <TextArea label="Notes" description="Shown in search results." aria-describedby="note" isChanged />
      </>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Shown in search results. Visible to admins. Changed',
    );
  });

  it('draws no chip for a field without a label row', () => {
    const { container } = render(<TextArea aria-label="Notes" isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(container.querySelector('.field-head')).toBeNull();
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('lets invalid outrank changed: the chip is gone and no longer announced', async () => {
    const { container, rerender } = render(
      <TextArea label="Notes" isChanged errorMessage="Write a note." defaultValue="!" />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    const chipId = screen.getByText('Changed').id;
    expect(textarea.getAttribute('aria-describedby')?.split(' ')).toContain(chipId);
    rerender(<TextArea label="Notes" isChanged isInvalid errorMessage="Write a note." defaultValue="!" />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(textarea.getAttribute('aria-describedby')?.split(' ')).not.toContain(chipId);
    expect(textarea).toHaveAccessibleDescription('Write a note.');
    await expectNoA11yViolations(container);
  });

  it('reads the hint and the error of an invalid field, and drops only the chip', async () => {
    const { container } = render(
      <TextArea
        label="Notes"
        description="Shown in search results."
        isChanged
        isInvalid
        errorMessage="Write a note."
        defaultValue="!"
      />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).toHaveAccessibleDescription('Shown in search results. Write a note.');
    expect(textarea.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('lets invalid outrank changed when React Aria finds the field invalid', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextArea label="Notes" name="notes" isRequired isChanged errorMessage="Write a note." />
        <button type="submit">Save</button>
      </form>,
    );
    const textarea = screen.getByRole('textbox', { name: /Notes/ });
    expect(screen.getByText('Changed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(container.querySelector('.field')).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(textarea).toHaveAccessibleDescription('Write a note.');
    await user.type(textarea, 'N');
    await user.tab();
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(textarea).toHaveAccessibleDescription('Changed');
  });

  it('counts an uncontrolled value, from its default and as it is typed', async () => {
    const user = userEvent.setup();
    render(<TextArea label="Short description" defaultValue="abcdefgh" budget={10} />);
    const textarea = screen.getByRole('textbox');
    const counter = screen.getByRole('status');
    expect(counter).toHaveClass('field-counter');
    expect(counter).toHaveTextContent('8 of about 10');
    await user.type(textarea, 'ij');
    expect(counter).toHaveTextContent('10 of about 10');
    expect(counter).not.toHaveAttribute('data-over');
    await user.clear(textarea);
    await user.type(textarea, 'ab');
    expect(counter).toBeEmptyDOMElement();
  });

  it('counts a line break as one character', async () => {
    const user = userEvent.setup();
    render(<TextArea label="Short description" budget={10} />);
    await user.type(screen.getByRole('textbox'), 'abc{Enter}def{Enter}gh');
    expect(screen.getByRole('textbox')).toHaveValue('abc\ndef\ngh');
    expect(screen.getByRole('status')).toHaveTextContent('10 of about 10');
  });

  it('counts a controlled value, and counts the prop and not the typing', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TextArea label="Notes" value="abcdefgh" onChange={vi.fn()} budget={10} />);
    expect(screen.getByRole('status')).toHaveTextContent('8 of about 10');
    await user.type(screen.getByRole('textbox'), 'xyz');
    expect(screen.getByRole('status')).toHaveTextContent('8 of about 10');
    rerender(<TextArea label="Notes" value="abcdefghij" onChange={vi.fn()} budget={10} />);
    expect(screen.getByRole('status')).toHaveTextContent('10 of about 10');
  });

  it('counts the value of a field the caller controls', async () => {
    const user = userEvent.setup();
    render(<Controlled label="Notes" budget={20} />);
    expect(screen.getByRole('status')).toHaveTextContent('16 of about 20');
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(screen.getByRole('status')).toHaveTextContent('19 of about 20');
  });

  it('follows a form reset back to the default value', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextArea label="Notes" defaultValue="abcdefgh" budget={10} />
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
    render(<TextArea label="Short description" budget={10} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toHaveAttribute('maxlength');
    await user.type(textarea, 'fourteen{Enter}chars');
    expect(textarea).toHaveValue('fourteen\nchars');
    expect(textarea).toBeValid();
    expect(textarea).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('status')).toHaveTextContent('14 of about 10');
    expect(screen.getByRole('status')).toHaveAttribute('data-over');
  });

  it('words the count with counter.label, in the status region a screen reader announces', async () => {
    const user = userEvent.setup();
    render(
      <TextArea
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
    render(<TextArea label="Kurzbeschreibung" defaultValue="abcd" budget={10} counter={{ showFrom: 0.5 }} />);
    const counter = screen.getByRole('status');
    // 4 of 10 is under half the budget, and 5 is the first count shown, where 70% would wait for 7.
    expect(counter).toBeEmptyDOMElement();
    await user.type(screen.getByRole('textbox', { name: 'Kurzbeschreibung' }), 'e');
    expect(counter).toHaveTextContent('5 of about 10');
  });

  it('has no counter without a budget', () => {
    render(<TextArea label="Notes" defaultValue="abcdefgh" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('is three lines tall unless told otherwise, and takes rows', () => {
    const { rerender } = render(<TextArea label="Notes" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
    rerender(<TextArea label="Notes" rows={6} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
  });

  it('disables the control and leaves it out of the form', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextArea label="Notes" name="notes" defaultValue="Northwind" isDisabled />
      </form>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).toBeDisabled();
    expect(container.querySelector('.field')).toHaveAttribute('data-disabled');
    await user.type(textarea, 'x');
    expect(textarea).toHaveValue('Northwind');
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).has('notes')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('keeps a read-only value readable, selectable and in the form', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TextArea label="Notes" name="notes" defaultValue="Northwind" isReadOnly />
      </form>,
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
    expect(container.querySelector('.field')).toHaveAttribute('data-readonly');
    await user.type(textarea, 'x');
    expect(textarea).toHaveValue('Northwind');
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('notes')).toBe('Northwind');
  });

  it('passes the textarea attributes through', () => {
    render(<TextArea label="Notes" name="notes" autoComplete="off" spellCheck="false" maxLength={200} />);
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).toHaveAttribute('name', 'notes');
    expect(textarea).toHaveAttribute('autocomplete', 'off');
    expect(textarea).toHaveAttribute('spellcheck', 'false');
    expect(textarea).toHaveAttribute('maxlength', '200');
  });

  it('forwards ref to the field and textAreaRef to the textarea', () => {
    const ref = createRef<HTMLDivElement>();
    const textAreaRef = createRef<HTMLTextAreaElement>();
    render(<TextArea ref={ref} textAreaRef={textAreaRef} label="Notes" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('field');
    expect(textAreaRef.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(textAreaRef.current).toBe(screen.getByRole('textbox'));
  });

  it('merges a string className after its own', () => {
    const { container } = render(<TextArea label="Notes" className="extra" />);
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
    const { container, rerender } = render(<TextArea label="Notes" className={className} />);
    expect(root(container)).toHaveClass('field', 'is-fine');
    rerender(<TextArea label="Notes" className={className} isInvalid />);
    expect(root(container)).toHaveClass('field', 'is-invalid');
    rerender(<TextArea label="Notes" className={className} isDisabled />);
    expect(root(container)).toHaveClass('field', 'is-disabled');
    expect(className.mock.calls[0]?.[0].defaultClassName).toBe('react-aria-TextField');
  });

  it.each([
    ['plain', {}],
    ['with a hint', { description: 'Shown in search results.' }],
    ['with a placeholder', { placeholder: 'A shared space' }],
    ['with several lines', { defaultValue: 'One\nTwo\nThree' }],
    ['taller', { rows: 6 }],
    ['changed', { isChanged: true }],
    ['invalid', { isInvalid: true, errorMessage: 'Write a note.' }],
    ['invalid and changed', { isInvalid: true, isChanged: true, errorMessage: 'Write a note.' }],
    ['counted', { budget: 10, defaultValue: 'abcdefgh' }],
    ['over its budget', { budget: 5, defaultValue: 'abcdefgh' }],
    ['disabled', { isDisabled: true }],
    ['read-only', { isReadOnly: true, defaultValue: 'Northwind' }],
    ['required', { isRequired: true }],
  ] satisfies [string, Partial<TextAreaProps>][])('has no axe violations when %s', async (_state, props) => {
    const { container } = render(<TextArea label="Short description" {...props} />);
    await expectNoA11yViolations(container);
  });
});
