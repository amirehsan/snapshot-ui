import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Input, TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Description } from './Description';
import { FieldError } from './FieldError';
import { Label } from './Label';

describe('FieldError', () => {
  it('shows nothing while the field is valid', () => {
    render(
      <TextField>
        <Label>Email</Label>
        <Input />
        <FieldError>Enter an email address.</FieldError>
      </TextField>,
    );
    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('shows its message and describes the input once the field is invalid', async () => {
    const { container } = render(
      <TextField isInvalid>
        <Label>Email</Label>
        <Input />
        <Description>We never share it.</Description>
        <FieldError>Enter an email address.</FieldError>
      </TextField>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We never share it. Enter an email address.');
    const error = screen.getByText('Enter an email address.');
    expect(error).toHaveClass('field-error');
    await expectNoA11yViolations(container);
  });

  it('shows the message from validate and clears it when the value is fixed', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        defaultValue="nope"
        validationBehavior="aria"
        validate={(value) => (value.includes('@') ? null : 'Enter an email address.')}
      >
        <Label>Email</Label>
        <Input />
        <FieldError />
      </TextField>,
    );
    expect(screen.getByText('Enter an email address.')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), '@x.com');
    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
  });

  it('merges a custom className', () => {
    render(
      <TextField isInvalid>
        <Label>Email</Label>
        <Input />
        <FieldError className="extra">Wrong.</FieldError>
      </TextField>,
    );
    expect(screen.getByText('Wrong.')).toHaveClass('field-error', 'extra');
  });

  it('merges a function className, which receives the validation state', () => {
    render(
      <TextField isInvalid>
        <Label>Email</Label>
        <Input />
        <FieldError className={({ isInvalid }) => (isInvalid ? 'is-invalid' : 'is-valid')}>Wrong.</FieldError>
      </TextField>,
    );
    expect(screen.getByText('Wrong.')).toHaveClass('field-error', 'is-invalid');
  });

  it('forwards a ref to the element', () => {
    const ref = createRef<HTMLElement>();
    render(
      <TextField isInvalid>
        <Label>Email</Label>
        <Input />
        <FieldError ref={ref}>Wrong.</FieldError>
      </TextField>,
    );
    expect(ref.current).toHaveTextContent('Wrong.');
  });
});
