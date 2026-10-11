import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Input, TextField } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { FieldChanged } from './FieldChanged';
import { Label } from './Label';

describe('FieldChanged', () => {
  it('says Changed by default', async () => {
    const { container } = render(<FieldChanged />);
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    await expectNoA11yViolations(container);
  });

  it('takes other text as children, for another language or another word', () => {
    render(<FieldChanged>Unsaved</FieldChanged>);
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
  });

  it('describes the control when its id is passed to the field as aria-describedby', async () => {
    const { container } = render(
      <TextField aria-describedby="name-changed" className="field" data-changed="">
        <div className="field-head">
          <Label>Workspace name</Label>
          <FieldChanged id="name-changed" />
        </div>
        <Input />
      </TextField>,
    );
    const input = screen.getByRole('textbox', { name: 'Workspace name' });
    expect(input).toHaveAccessibleDescription('Changed');
    await expectNoA11yViolations(container);
  });

  it('merges a custom className', () => {
    render(<FieldChanged className="extra" />);
    expect(screen.getByText('Changed')).toHaveClass('field-changed', 'extra');
  });

  it('forwards a ref to the element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<FieldChanged ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
