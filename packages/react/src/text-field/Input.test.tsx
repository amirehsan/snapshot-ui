import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Description } from '../field/Description';
import { Label } from '../field/Label';
import { Input } from './Input';

describe('Input', () => {
  it('is a text input with the input class', async () => {
    const { container } = render(<Input aria-label="Search" placeholder="Search settings" />);
    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(input).toHaveClass('input');
    expect(input).toHaveAttribute('placeholder', 'Search settings');
    await expectNoA11yViolations(container);
  });

  it('takes the label and the hint of the React Aria field around it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextField>
        <Label>Email</Label>
        <Input />
        <Description>We never share it.</Description>
      </TextField>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAccessibleDescription('We never share it.');
    await user.type(input, 'a@b.co');
    expect(input).toHaveValue('a@b.co');
    await expectNoA11yViolations(container);
  });

  it('merges a custom className after its own', () => {
    render(<Input aria-label="Search" className="extra" />);
    expect(screen.getByRole('textbox')).toHaveClass('input', 'extra');
  });

  it('merges a function className, which receives the input state', async () => {
    const user = userEvent.setup();
    render(
      <Input aria-label="Search" className={({ isFocused }) => (isFocused ? 'is-focused' : 'is-idle')} />,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input', 'is-idle');
    await user.click(input);
    expect(input).toHaveClass('input', 'is-focused');
    expect(input).not.toHaveClass('is-idle');
  });

  it('forwards a ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Search" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });

  it('passes its other attributes to the input', () => {
    render(<Input aria-label="Email" type="email" name="email" autoComplete="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });
});
