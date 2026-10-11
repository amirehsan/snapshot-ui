import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, RadioButton, RadioField, RadioGroup, TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { FieldHead } from './FieldHead';

describe('FieldHead', () => {
  it('is the label row: the label, then the Changed chip with its id', async () => {
    const { container } = render(
      <TextField className="field" data-changed="">
        <FieldHead label="Workspace name" chipId="workspace-chip" />
        <Input />
      </TextField>,
    );
    const row = container.querySelector('.field-head');
    expect(row).not.toBeNull();
    expect([...(row?.children ?? [])].map((child) => child.className)).toEqual([
      'field-label',
      'field-changed',
    ]);
    const chip = screen.getByText('Changed');
    expect(chip).toHaveAttribute('id', 'workspace-chip');
    expect(chip.parentElement).toBe(row);
    // The chip sits beside the label, so the control's name is the label alone.
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Workspace name');
    await expectNoA11yViolations(container);
  });

  it('takes other text for the chip', () => {
    render(
      <TextField>
        <FieldHead label="Name" changedLabel="Unsaved" chipId="chip" />
        <Input />
      </TextField>,
    );
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
  });

  it('leaves the chip out of the page while the field is invalid', () => {
    const { rerender } = render(
      <TextField>
        <FieldHead label="Name" chipId="chip" />
        <Input />
      </TextField>,
    );
    expect(screen.getByText('Changed')).toBeInTheDocument();
    rerender(
      <TextField isInvalid>
        <FieldHead label="Name" chipId="chip" />
        <Input />
      </TextField>,
    );
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByText('Name')).toHaveClass('field-label');
  });

  it('leaves the chip out when validation that React Aria runs makes the field invalid', async () => {
    const user = userEvent.setup();
    render(
      <TextField validate={(value) => (value === '' ? 'Enter a name.' : null)} validationBehavior="aria">
        <FieldHead label="Name" chipId="chip" />
        <Input />
      </TextField>,
    );
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'a');
    expect(screen.getByText('Changed')).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox'));
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
  });

  it('renders outside a field too, and in a group, where it names the group', () => {
    const { unmount } = render(<FieldHead label="Plain" chipId="plain-chip" />);
    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(screen.getByText('Changed')).toHaveAttribute('id', 'plain-chip');
    unmount();
    render(
      <RadioGroup>
        <FieldHead label="Size" chipId="size-chip" />
        <RadioField value="s">
          <RadioButton>Small</RadioButton>
        </RadioField>
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeInTheDocument();
  });
});
