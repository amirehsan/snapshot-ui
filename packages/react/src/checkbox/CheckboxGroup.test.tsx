import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Checkbox } from './Checkbox';
import { CheckboxGroup, type CheckboxGroupProps } from './CheckboxGroup';

/** A group the caller controls, the way a form library would. */
function Controlled(props: CheckboxGroupProps): ReactElement {
  const [value, setValue] = useState<string[]>(['email']);
  return <CheckboxGroup {...props} value={value} onChange={setValue} />;
}

const channels = [
  <Checkbox key="email" value="email">
    Email
  </Checkbox>,
  <Checkbox key="sms" value="sms">
    Text message
  </Checkbox>,
  <Checkbox key="push" value="push">
    Push
  </Checkbox>,
];

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

describe('CheckboxGroup', () => {
  it('renders a named group of checkboxes inside a field', async () => {
    const { container } = render(<CheckboxGroup label="Notify me by">{channels}</CheckboxGroup>);
    const group = screen.getByRole('group', { name: 'Notify me by' });
    expect(group).toBe(root(container));
    expect(group).toHaveClass('field', 'checkbox-group');
    expect(group).not.toHaveAttribute('data-changed');
    expect(group).not.toHaveAttribute('data-invalid');
    expect(screen.getByText('Notify me by')).toHaveClass('field-label');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(container.querySelector('.checkbox-items')?.children).toHaveLength(3);
    await expectNoA11yViolations(container);
  });

  it('puts its parts in the order the field contract asks for', () => {
    const { container } = render(
      <CheckboxGroup
        label="Notify me by"
        description="Pick as many as you like."
        isInvalid
        errorMessage="Pick one."
      >
        {channels}
      </CheckboxGroup>,
    );
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'field-head',
      'checkbox-items',
      'field-description',
      'field-error',
    ]);
  });

  it('lays its checkboxes out vertically unless told otherwise, with the orientation as an attribute', () => {
    const { container, rerender } = render(<CheckboxGroup label="Notify me by">{channels}</CheckboxGroup>);
    expect(root(container)).toHaveAttribute('data-orientation', 'vertical');
    rerender(
      <CheckboxGroup label="Notify me by" orientation="horizontal">
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('starts with the checkboxes of defaultValue checked and reports the whole selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup label="Notify me by" defaultValue={['email']} onChange={onChange}>
        {channels}
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Text message' })).not.toBeChecked();
    await user.click(screen.getByText('Text message'));
    expect(screen.getByRole('checkbox', { name: 'Text message' })).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(['email', 'sms']);
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    expect(onChange).toHaveBeenLastCalledWith(['sms']);
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toBeChecked();
  });

  it('follows value when the caller controls it, and tells the caller what was pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <CheckboxGroup label="Notify me by" value={['email']} onChange={onChange}>
        {channels}
      </CheckboxGroup>,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(onChange).toHaveBeenCalledWith(['email', 'push']);
    expect(screen.getByRole('checkbox', { name: 'Push' })).not.toBeChecked();
    rerender(
      <CheckboxGroup label="Notify me by" value={['sms', 'push']} onChange={onChange}>
        {channels}
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Text message' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Push' })).toBeChecked();
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled label="Notify me by">{channels}</Controlled>);
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Push' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toBeChecked();
  });

  it('moves between checkboxes with Tab, toggles with Space, and ignores the arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <button type="button">Before</button>
        <CheckboxGroup label="Notify me by" onChange={onChange}>
          {channels}
        </CheckboxGroup>
        <button type="button">After</button>
      </>,
    );
    const [email, sms, push] = screen.getAllByRole('checkbox');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await user.tab();
    expect(email).toHaveFocus();
    // Unlike a radio group, the arrow keys do nothing: each checkbox is its own tab stop.
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowUp}{ArrowLeft}');
    expect(email).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    await user.tab();
    expect(sms).toHaveFocus();
    await user.keyboard(' ');
    expect(sms).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(['sms']);
    await user.tab();
    expect(push).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(push).toHaveFocus();
  });

  it('submits the checked values again and again under the group name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <CheckboxGroup label="Notify me by" name="channels">
          {channels}
        </CheckboxGroup>
      </form>,
    );
    const form = formOf(container);
    expect(new FormData(form).getAll('channels')).toEqual([]);
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(new FormData(form).getAll('channels')).toEqual(['email', 'push']);
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    expect(new FormData(form).getAll('channels')).toEqual(['push']);
  });

  it('is back to its default selection after a form reset', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <CheckboxGroup label="Notify me by" name="channels" defaultValue={['sms']}>
          {channels}
        </CheckboxGroup>
        <button type="reset">Reset</button>
      </form>,
    );
    // A default that was unchecked comes back, and so does the empty selection.
    await user.click(screen.getByRole('checkbox', { name: 'Text message' }));
    expect(new FormData(formOf(container)).getAll('channels')).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(new FormData(formOf(container)).getAll('channels')).toEqual(['sms']);
    expect(screen.getByRole('checkbox', { name: 'Text message' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(new FormData(formOf(container)).getAll('channels')).toEqual(['sms']);
    expect(screen.getByRole('checkbox', { name: 'Push' })).not.toBeChecked();
  });

  it('asks for one checked box, not all of them, when it is required', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    const { container } = render(
      <form onSubmit={onSubmit}>
        <CheckboxGroup label="Notify me by" name="channels" isRequired errorMessage="Pick at least one.">
          {channels}
        </CheckboxGroup>
        <button type="submit">Save</button>
      </form>,
    );
    const group = screen.getByRole('group', { name: /Notify me by/ });
    expect(screen.queryByText('Pick at least one.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    // The browser blocked the submit, and the group shows its error and its state.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Pick at least one.')).toHaveClass('field-error');
    expect(group).toHaveAttribute('data-invalid');
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeInvalid();
    expect(group).toHaveAccessibleDescription('Pick at least one.');
    // Every box is marked invalid, and only the group says why.
    expect(container.querySelectorAll('.field-error')).toHaveLength(1);
    expect(container.querySelectorAll('.checkbox[data-invalid]')).toHaveLength(3);
    await expectNoA11yViolations(container);
    // One checked box is enough.
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(screen.queryByText('Pick at least one.')).not.toBeInTheDocument();
    expect(group).not.toHaveAttribute('data-invalid');
    for (const box of screen.getAllByRole('checkbox')) expect(box).not.toBeRequired();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(new FormData(formOf(container)).getAll('channels')).toEqual(['push']);
  });

  it('shows the message of a custom validate function', async () => {
    const user = userEvent.setup();
    render(
      <CheckboxGroup
        label="Notify me by"
        validationBehavior="aria"
        validate={(value) => (value.length >= 2 ? null : 'Pick at least two.')}
      >
        {channels}
      </CheckboxGroup>,
    );
    expect(screen.getByText('Pick at least two.')).toHaveClass('field-error');
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    expect(screen.getByText('Pick at least two.')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(screen.queryByText('Pick at least two.')).not.toBeInTheDocument();
  });

  it('builds the error from a function of the validation result', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <CheckboxGroup
          label="Notify me by"
          isRequired
          errorMessage={(validation) => `Problems: ${validation.validationErrors.length}`}
        >
          {channels}
        </CheckboxGroup>
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText(/^Problems: \d+$/)).toHaveClass('field-error');
  });

  it('describes the group with its hint, and marks an invalid group and every box in it', async () => {
    const { container } = render(
      <CheckboxGroup
        label="Notify me by"
        description="Pick as many as you like."
        isInvalid
        errorMessage="Pick at least one."
      >
        {channels}
      </CheckboxGroup>,
    );
    const group = screen.getByRole('group', { name: 'Notify me by' });
    expect(group).toHaveAttribute('data-invalid');
    expect(group).toHaveAccessibleDescription('Pick as many as you like. Pick at least one.');
    expect(screen.getByText('Pick as many as you like.')).toHaveClass('field-description');
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeInvalid();
    await expectNoA11yViolations(container);
  });

  it('lets a checkbox in the group keep a hint of its own', () => {
    render(
      <CheckboxGroup label="Notify me by">
        <Checkbox value="email" description="Receipts and password resets.">
          Email
        </Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Receipts and password resets.',
    );
  });

  it('shows the changed chip, and a screen reader reads it with the group', async () => {
    const { container } = render(
      <CheckboxGroup label="Notify me by" description="Pick as many as you like." isChanged>
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    expect(chip.parentElement).toHaveClass('field-head');
    const group = screen.getByRole('group', { name: 'Notify me by' });
    expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    expect(group).toHaveAccessibleDescription('Pick as many as you like. Changed');
    await expectNoA11yViolations(container);
  });

  it('takes the chip text from changedLabel', () => {
    render(
      <CheckboxGroup label="Notify me by" isChanged changedLabel="Unsaved">
        {channels}
      </CheckboxGroup>,
    );
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
  });

  it('keeps the chip in the page, unannounced, while the group is not changed', () => {
    render(<CheckboxGroup label="Notify me by">{channels}</CheckboxGroup>);
    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-describedby') ?? '').not.toContain(screen.getByText('Changed').id);
  });

  it('draws no chip for a group without a label row', () => {
    const { container } = render(
      <CheckboxGroup aria-label="Notify me by" isChanged>
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(container.querySelector('.field-head')).toBeNull();
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Notify me by' })).not.toHaveAttribute('aria-describedby');
  });

  it('lets invalid outrank changed: the chip is gone and no longer announced', async () => {
    const { container, rerender } = render(
      <CheckboxGroup label="Notify me by" isChanged errorMessage="Pick at least one.">
        {channels}
      </CheckboxGroup>,
    );
    const chipId = screen.getByText('Changed').id;
    expect(screen.getByRole('group').getAttribute('aria-describedby')?.split(' ')).toContain(chipId);
    rerender(
      <CheckboxGroup label="Notify me by" isChanged isInvalid errorMessage="Pick at least one.">
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('group').getAttribute('aria-describedby')?.split(' ')).not.toContain(chipId);
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Pick at least one.');
    await expectNoA11yViolations(container);
  });

  it('lets invalid outrank changed when React Aria finds the group invalid', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <CheckboxGroup label="Notify me by" isRequired isChanged errorMessage="Pick at least one.">
          {channels}
        </CheckboxGroup>
        <button type="submit">Save</button>
      </form>,
    );
    expect(screen.getByText('Changed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const group = screen.getByRole('group', { name: /Notify me by/ });
    expect(group).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('Pick at least one.');
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('Changed');
  });

  it('disables every checkbox in a disabled group and leaves them out of the form', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <CheckboxGroup
          label="Notify me by"
          name="channels"
          defaultValue={['email']}
          isDisabled
          onChange={onChange}
        >
          {channels}
        </CheckboxGroup>
      </form>,
    );
    const group = screen.getByRole('group', { name: 'Notify me by' });
    expect(group).toHaveAttribute('data-disabled');
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeDisabled();
    await user.click(screen.getByText('Text message'));
    expect(onChange).not.toHaveBeenCalled();
    expect(new FormData(formOf(container)).getAll('channels')).toEqual([]);
    await expectNoA11yViolations(container);
  });

  it('can disable one checkbox of the group', async () => {
    const user = userEvent.setup();
    render(
      <CheckboxGroup label="Notify me by">
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms" isDisabled>
          Text message
        </Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Text message' })).toBeDisabled();
    await user.click(screen.getByText('Text message'));
    expect(screen.getByRole('checkbox', { name: 'Text message' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeEnabled();
  });

  it('keeps a read-only group readable, focusable and in the form', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <CheckboxGroup
          label="Notify me by"
          name="channels"
          defaultValue={['email']}
          isReadOnly
          onChange={onChange}
        >
          {channels}
        </CheckboxGroup>
      </form>,
    );
    const email = screen.getByRole('checkbox', { name: 'Email' });
    await user.tab();
    expect(email).toHaveFocus();
    await user.keyboard(' ');
    await user.click(screen.getByText('Text message'));
    await user.click(email);
    expect(onChange).not.toHaveBeenCalled();
    expect(email).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Text message' })).not.toBeChecked();
    expect(new FormData(formOf(container)).getAll('channels')).toEqual(['email']);
    await expectNoA11yViolations(container);
  });

  it('can be named with aria-label when it has no visible label', async () => {
    const { container } = render(<CheckboxGroup aria-label="Notify me by">{channels}</CheckboxGroup>);
    expect(screen.getByRole('group', { name: 'Notify me by' })).toBeInTheDocument();
    expect(container.querySelector('.field-head')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('forwards ref to the group', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <CheckboxGroup label="Notify me by" ref={ref}>
        {channels}
      </CheckboxGroup>,
    );
    expect(ref.current).toBe(root(container));
  });

  it('merges a string className after its own classes', () => {
    const { container } = render(
      <CheckboxGroup label="Notify me by" className="mine">
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveClass('field', 'checkbox-group', 'mine');
    expect(root(container).className.indexOf('checkbox-group')).toBeLessThan(
      root(container).className.indexOf('mine'),
    );
  });

  it('merges a function className, which receives the group state', () => {
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
    const { container, rerender } = render(
      <CheckboxGroup label="Notify me by" className={className}>
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveClass('field', 'checkbox-group', 'is-fine');
    rerender(
      <CheckboxGroup label="Notify me by" className={className} isInvalid>
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveClass('field', 'checkbox-group', 'is-invalid');
    rerender(
      <CheckboxGroup label="Notify me by" className={className} isDisabled>
        {channels}
      </CheckboxGroup>,
    );
    expect(root(container)).toHaveClass('field', 'checkbox-group', 'is-disabled');
    expect(className.mock.calls[0]?.[0].defaultClassName).toBe('react-aria-CheckboxGroup');
  });

  it.each([
    ['plain', {}],
    ['with a hint', { description: 'Pick as many as you like.' }],
    ['horizontal', { orientation: 'horizontal' }],
    ['with a selection', { defaultValue: ['email', 'push'] }],
    ['changed', { isChanged: true }],
    ['invalid', { isInvalid: true, errorMessage: 'Pick at least one.' }],
    ['invalid and changed', { isInvalid: true, isChanged: true, errorMessage: 'Pick at least one.' }],
    ['disabled', { isDisabled: true }],
    ['read-only', { isReadOnly: true, defaultValue: ['sms'] }],
    ['required', { isRequired: true }],
  ] satisfies [string, Partial<CheckboxGroupProps>][])(
    'has no axe violations when %s',
    async (_state, props) => {
      const { container } = render(
        <CheckboxGroup label="Notify me by" {...props}>
          {channels}
        </CheckboxGroup>,
      );
      await expectNoA11yViolations(container);
    },
  );
});
