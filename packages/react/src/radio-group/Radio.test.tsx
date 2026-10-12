import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Radio, type RadioProps } from './Radio';
import { RadioGroup } from './RadioGroup';

/** One radio in a group of its own, which every radio needs. */
function Alone(props: Partial<RadioProps>): ReactElement {
  return (
    <RadioGroup label="Plan" defaultValue="free">
      <Radio value="free" {...props}>
        Free
      </Radio>
      <Radio value="team">Team</Radio>
    </RadioGroup>
  );
}

const row = (name: string): HTMLElement => {
  const label = screen.getByRole('radio', { name }).closest('label');
  if (!label) throw new Error(`No row for ${name}`);
  return label;
};

describe('Radio', () => {
  it('is a labelled row holding the native radio, a dot and the label text', async () => {
    const { container } = render(<Alone />);
    const radio = screen.getByRole('radio', { name: 'Free' });
    expect(radio).toHaveAttribute('type', 'radio');
    expect(row('Free')).toHaveClass('radio');
    expect(row('Free').tagName).toBe('LABEL');
    const indicator = row('Free').querySelector('.radio-indicator');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    expect(indicator).toBeEmptyDOMElement();
    // The dot is decoration: the radio's name is the label text alone.
    expect(radio).toHaveAccessibleName('Free');
    expect(row('Free')).toHaveTextContent('Free');
    await expectNoA11yViolations(container);
  });

  it('ties a hint to the radio as its accessible description', async () => {
    const { container } = render(
      <RadioGroup label="Newsletter frequency">
        <Radio value="weekly" description="Every Tuesday morning.">
          Weekly
        </Radio>
        <Radio value="never">Never</Radio>
      </RadioGroup>,
    );
    const radio = screen.getByRole('radio', { name: 'Weekly' });
    expect(radio).toHaveAccessibleDescription('Every Tuesday morning.');
    const hint = screen.getByText('Every Tuesday morning.');
    expect(hint).toHaveClass('field-description');
    // The hint sits under its own row, not inside it, so the ink fill stops at the label.
    expect(row('Weekly')).not.toContainElement(hint);
    expect(row('Weekly').nextElementSibling).toBe(hint);
    expect(screen.getByRole('radio', { name: 'Never' })).not.toHaveAccessibleDescription();
    await expectNoA11yViolations(container);
  });

  it('reads its own hint first and then the hint of its group', () => {
    render(
      <RadioGroup label="Newsletter frequency" description="Applies to every workspace.">
        <Radio value="weekly" description="Every Tuesday morning.">
          Weekly
        </Radio>
        <Radio value="never">Never</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Applies to every workspace.');
    expect(screen.getByRole('radio', { name: 'Weekly' })).toHaveAccessibleDescription(
      'Every Tuesday morning. Applies to every workspace.',
    );
    expect(screen.getByRole('radio', { name: 'Never' })).toHaveAccessibleDescription(
      'Applies to every workspace.',
    );
  });

  it('takes focus from a click on its label text, and from its row', async () => {
    const user = userEvent.setup();
    render(<Alone />);
    await user.click(screen.getByText('Team'));
    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Team' })).toHaveFocus();
  });

  it('disables itself alone, with isDisabled', async () => {
    const user = userEvent.setup();
    render(<Alone isDisabled />);
    expect(screen.getByRole('radio', { name: 'Free' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Team' })).toBeEnabled();
    expect(row('Free')).toHaveAttribute('data-disabled');
    await user.click(screen.getByText('Team'));
    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked();
    expect(row('Free')).not.toHaveAttribute('data-selected');
  });

  it('names a radio with aria-label when it has no text', () => {
    render(
      <RadioGroup label="Plan">
        <Radio value="free" aria-label="Free plan" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio', { name: 'Free plan' })).toBeInTheDocument();
  });

  it('forwards ref to the row and inputRef to the input', () => {
    const ref = createRef<HTMLLabelElement>();
    const inputRef = createRef<HTMLInputElement>();
    render(<Alone ref={ref} inputRef={inputRef} />);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current).toBe(row('Free'));
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(inputRef.current).toBe(screen.getByRole('radio', { name: 'Free' }));
  });

  it('merges a string className onto the row, after its own', () => {
    render(<Alone className="extra" />);
    expect(row('Free')).toHaveClass('radio', 'extra');
    expect(row('Team')).not.toHaveClass('extra');
  });

  it('merges a function className, which receives the radio state', async () => {
    const user = userEvent.setup();
    const className = vi.fn(({ isSelected, isDisabled }: { isSelected: boolean; isDisabled: boolean }) =>
      isDisabled ? 'is-disabled' : isSelected ? 'is-selected' : 'is-idle',
    );
    render(<Alone className={className} />);
    expect(row('Free')).toHaveClass('radio', 'is-selected');
    await user.click(screen.getByText('Team'));
    expect(row('Free')).toHaveClass('radio', 'is-idle');
    expect(className.mock.calls[0]?.[0]).toMatchObject({ defaultClassName: 'react-aria-RadioButton' });
  });

  it('shows the row as hovered, pressed and focused through data attributes', async () => {
    const user = userEvent.setup();
    render(<Alone />);
    const team = row('Team');
    await user.hover(team);
    expect(team).toHaveAttribute('data-hovered');
    await user.unhover(team);
    expect(team).not.toHaveAttribute('data-hovered');
    await user.tab();
    expect(row('Free')).toHaveAttribute('data-focus-visible');
    expect(row('Team')).not.toHaveAttribute('data-focus-visible');
  });

  it('passes the value to the form', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <RadioGroup label="Plan" name="plan">
          <Radio value="free">Free</Radio>
          <Radio value="team">Team</Radio>
        </RadioGroup>
      </form>,
    );
    await user.click(screen.getByText('Team'));
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('plan')).toBe('team');
  });
});
