import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { FieldChangedMark } from './FieldChangedMark';

describe('FieldChangedMark', () => {
  it('renders its label with its id, the word the dot stands for', async () => {
    const { container } = render(
      <TextField className="field" aria-label="Amount" aria-describedby="mark" data-changed="">
        <Input />
        <FieldChangedMark id="mark" />
      </TextField>,
    );
    const mark = container.querySelector('.field-changed-mark');
    expect(mark).toHaveAttribute('id', 'mark');
    expect(mark).toHaveTextContent('Changed');
    // Named by the field, so a reader hears it after the field's name.
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAccessibleDescription('Changed');
    await expectNoA11yViolations(container);
  });

  it('takes other words', () => {
    render(<FieldChangedMark id="mark" label="Edited" />);
    expect(screen.getByText('Edited')).toHaveClass('field-changed-mark');
    expect(screen.queryByText('Changed')).toBeNull();
  });

  it('renders nothing inside an invalid field, by its props or by React Aria validation', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <TextField aria-label="Amount" isInvalid>
        <Input />
        <FieldChangedMark id="mark" />
      </TextField>,
    );
    expect(container.querySelector('.field-changed-mark')).toBeNull();
    rerender(
      <TextField
        aria-label="Amount"
        validate={(value) => (value === '' ? 'Enter an amount.' : null)}
        validationBehavior="aria"
      >
        <Input />
        <FieldChangedMark id="mark" />
      </TextField>,
    );
    await user.type(screen.getByRole('textbox'), '1');
    expect(container.querySelector('.field-changed-mark')).not.toBeNull();
    await user.clear(screen.getByRole('textbox'));
    expect(container.querySelector('.field-changed-mark')).toBeNull();
  });
});
