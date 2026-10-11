import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Input, TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Label } from './Label';

describe('Label', () => {
  it('names the input it sits beside', async () => {
    const { container } = render(
      <TextField>
        <Label>Workspace name</Label>
        <Input />
      </TextField>,
    );
    expect(screen.getByLabelText('Workspace name')).toBe(screen.getByRole('textbox'));
    const label = screen.getByText('Workspace name');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveClass('field-label');
    await expectNoA11yViolations(container);
  });

  it('moves focus to the input when it is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TextField>
        <Label>Workspace name</Label>
        <Input />
      </TextField>,
    );
    await user.click(screen.getByText('Workspace name'));
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('works on its own, tied to an input by htmlFor', () => {
    render(
      <>
        <Label htmlFor="plain">Plain field</Label>
        <input id="plain" />
      </>,
    );
    expect(screen.getByLabelText('Plain field')).toBe(screen.getByRole('textbox'));
  });

  it('can be a span, for a group caption', () => {
    render(<Label elementType="span">Theme</Label>);
    expect(screen.getByText('Theme').tagName).toBe('SPAN');
  });

  it('merges a custom className', () => {
    render(<Label className="extra">Name</Label>);
    expect(screen.getByText('Name')).toHaveClass('field-label', 'extra');
  });

  it('forwards a ref to the label element', () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Name</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
