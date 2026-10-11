import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Input, TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Description } from './Description';
import { Label } from './Label';

describe('Description', () => {
  it('describes the input it sits beside', async () => {
    const { container } = render(
      <TextField>
        <Label>Email</Label>
        <Input />
        <Description>We never share it.</Description>
      </TextField>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAccessibleDescription('We never share it.');
    expect(screen.getByText('We never share it.')).toHaveClass('field-description');
    await expectNoA11yViolations(container);
  });

  it('renders outside a field, for the hint under a row of settings', () => {
    render(<Description>Every Tuesday morning.</Description>);
    expect(screen.getByText('Every Tuesday morning.')).toHaveClass('field-description');
  });

  it('merges a custom className', () => {
    render(<Description className="extra">Hint</Description>);
    expect(screen.getByText('Hint')).toHaveClass('field-description', 'extra');
  });

  it('forwards a ref to the element', () => {
    const ref = createRef<HTMLElement>();
    render(<Description ref={ref}>Hint</Description>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveTextContent('Hint');
  });
});
