import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf, root } from '../../test/dom';
import { Radio } from './Radio';
import { RadioGroup, type RadioGroupProps } from './RadioGroup';

/** A group the caller controls, the way a form library would. */
function Controlled(props: RadioGroupProps): ReactElement {
  const [value, setValue] = useState<string | null>('monthly');
  return (
    <RadioGroup {...props} value={value} onChange={setValue}>
      <Radio value="weekly">Weekly</Radio>
      <Radio value="monthly">Monthly</Radio>
      <Radio value="never">Never</Radio>
    </RadioGroup>
  );
}

/** The three options every test below chooses between. */
function Frequency(props: Partial<RadioGroupProps>): ReactElement {
  return (
    <RadioGroup label="Newsletter frequency" {...props}>
      <Radio value="weekly">Weekly</Radio>
      <Radio value="monthly">Monthly</Radio>
      <Radio value="never">Never</Radio>
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('renders a labelled group of radio rows inside a field', async () => {
    const { container } = render(
      <Frequency description="You can change this at any time." defaultValue="weekly" />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Newsletter frequency' });
    expect(group).toBe(root(container));
    expect(group).toHaveClass('field', 'radio-group');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).not.toHaveAttribute('data-changed');
    expect(group).not.toHaveAttribute('data-invalid');
    expect(group).toHaveAccessibleDescription('You can change this at any time.');
    expect(screen.getByText('Newsletter frequency')).toHaveClass('field-label');
    expect(screen.getByText('You can change this at any time.')).toHaveClass('field-description');
    const items = container.querySelector('.radio-items');
    expect(items).not.toBeNull();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    for (const radio of radios) {
      const row = radio.closest('label');
      expect(row).toHaveClass('radio');
      expect(items).toContainElement(row);
      expect(row?.querySelector('.radio-indicator')).toHaveAttribute('aria-hidden', 'true');
    }
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('puts its parts in the order the field contract asks for', () => {
    const { container } = render(
      <Frequency description="One line." isInvalid errorMessage="Choose a frequency." />,
    );
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'field-head',
      'radio-items',
      'field-description',
      'field-error',
    ]);
  });

  it('moves the selection with the arrow keys, wrapping at the ends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Frequency defaultValue="weekly" onChange={onChange} />);
    const weekly = screen.getByRole('radio', { name: 'Weekly' });
    const monthly = screen.getByRole('radio', { name: 'Monthly' });
    const never = screen.getByRole('radio', { name: 'Never' });
    await user.tab();
    expect(weekly).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(monthly).toHaveFocus();
    expect(monthly).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('monthly');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(weekly).toHaveFocus();
    expect(weekly).toBeChecked();
    await user.keyboard('{ArrowUp}');
    expect(never).toHaveFocus();
    expect(never).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('is one tab stop: the selected radio takes focus and the rest are skipped', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Frequency defaultValue="monthly" />
        <button type="button">After</button>
      </>,
    );
    const [weekly, monthly, never] = screen.getAllByRole('radio');
    expect(monthly).toHaveAttribute('tabindex', '0');
    expect(weekly).toHaveAttribute('tabindex', '-1');
    expect(never).toHaveAttribute('tabindex', '-1');
    await user.tab();
    await user.tab();
    expect(monthly).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(monthly).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(weekly).toHaveAttribute('tabindex', '0');
    expect(monthly).toHaveAttribute('tabindex', '-1');
  });

  it('moves the other way in a right-to-left locale: ArrowLeft chooses the next option', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-EG">
        <Frequency orientation="horizontal" defaultValue="weekly" />
      </I18nProvider>,
    );
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Weekly' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Monthly' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
  });

  it('lays out horizontally with orientation, and the arrow keys still move the selection', async () => {
    const user = userEvent.setup();
    render(<Frequency orientation="horizontal" defaultValue="weekly" />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
  });

  it('selects by clicking an uncontrolled group, and calls onChange with the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Frequency defaultValue="weekly" onChange={onChange} />);
    await user.click(screen.getByText('Never'));
    expect(screen.getByRole('radio', { name: 'Never' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Weekly' })).not.toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('never');
  });

  it('starts with nothing selected when it has no default', async () => {
    const user = userEvent.setup();
    render(<Frequency />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    await user.click(screen.getByText('Weekly'));
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
  });

  it('follows the value of a controlled group, and tells the caller what was chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Frequency value="weekly" onChange={onChange} />);
    await user.click(screen.getByText('Never'));
    expect(onChange).toHaveBeenCalledWith('never');
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Never' })).not.toBeChecked();
    rerender(<Frequency value="never" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Never' })).toBeChecked();
    rerender(<Frequency value={null} onChange={onChange} />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled label="Newsletter frequency" />);
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    await user.click(screen.getByText('Weekly'));
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Monthly' })).not.toBeChecked();
  });

  it('marks the chosen row with data-selected, and only that row', async () => {
    const user = userEvent.setup();
    render(<Frequency defaultValue="weekly" />);
    const row = (name: string): HTMLElement => {
      const label = screen.getByRole('radio', { name }).closest('label');
      if (!label) throw new Error('No row');
      return label;
    };
    expect(row('Weekly')).toHaveAttribute('data-selected');
    expect(row('Monthly')).not.toHaveAttribute('data-selected');
    await user.click(screen.getByText('Monthly'));
    expect(row('Weekly')).not.toHaveAttribute('data-selected');
    expect(row('Monthly')).toHaveAttribute('data-selected');
  });

  it('submits the chosen value in a plain form under its name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Frequency name="frequency" defaultValue="weekly" />
      </form>,
    );
    const form = formOf(container);
    expect(new FormData(form).get('frequency')).toBe('weekly');
    await user.click(screen.getByText('Never'));
    expect(new FormData(form).get('frequency')).toBe('never');
  });

  it('is back to its default after a native form reset, tells onChange once, and the chip follows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Saved(): ReactElement {
      const [value, setValue] = useState('weekly');
      return (
        <form>
          <Frequency
            name="frequency"
            defaultValue="weekly"
            isChanged={value !== 'weekly'}
            onChange={(next) => {
              setValue(next);
              onChange(next);
            }}
          />
          <button type="reset">Reset</button>
        </form>
      );
    }
    const { container } = render(<Saved />);
    const group = screen.getByRole('radiogroup');
    await user.click(screen.getByText('Never'));
    expect(group).toHaveAttribute('data-changed', '');
    expect(group).toHaveAccessibleDescription('Changed');
    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(new FormData(formOf(container)).get('frequency')).toBe('weekly');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('weekly');
    expect(group).not.toHaveAttribute('data-changed');
    expect(group).not.toHaveAccessibleDescription();
  });

  it('submits nothing while nothing is chosen', () => {
    const { container } = render(
      <form>
        <Frequency name="frequency" />
      </form>,
    );
    expect(new FormData(formOf(container)).has('frequency')).toBe(false);
  });

  it('shows the error and sets data-invalid after a required group is submitted empty', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Frequency name="frequency" isRequired errorMessage="Choose a frequency." />
        <button type="submit">Save</button>
      </form>,
    );
    const group = screen.getByRole('radiogroup');
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeRequired();
    expect(screen.queryByText('Choose a frequency.')).not.toBeInTheDocument();
    expect(group).not.toHaveAttribute('data-invalid');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Choose a frequency.')).toHaveClass('field-error');
    expect(group).toHaveAttribute('data-invalid');
    expect(group).toHaveAccessibleDescription('Choose a frequency.');
    await expectNoA11yViolations(container);
    // Choosing an option clears the error.
    await user.click(screen.getByText('Weekly'));
    expect(screen.queryByText('Choose a frequency.')).not.toBeInTheDocument();
    expect(group).not.toHaveAttribute('data-invalid');
  });

  it('blocks a submit that is missing a required choice, and lets it through once chosen', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <Frequency name="frequency" isRequired />
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByText('Monthly'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows the message of a custom validate function', async () => {
    const user = userEvent.setup();
    render(
      <Frequency
        defaultValue="never"
        validationBehavior="aria"
        validate={(value) => (value === 'never' ? 'Pick a frequency to stay informed.' : null)}
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(screen.getByText('Pick a frequency to stay informed.')).toHaveClass('field-error');
    expect(group).toHaveAttribute('data-invalid');
    await user.click(screen.getByText('Weekly'));
    expect(screen.queryByText('Pick a frequency to stay informed.')).not.toBeInTheDocument();
    expect(group).not.toHaveAttribute('data-invalid');
  });

  it('builds the error from a function of the validation result', () => {
    render(
      <Frequency
        defaultValue="never"
        validationBehavior="aria"
        validate={() => 'Too quiet.'}
        errorMessage={({ isInvalid, validationErrors }) =>
          `${isInvalid ? 'Invalid' : 'Valid'}: ${validationErrors.join(' ')}`
        }
      />,
    );
    expect(screen.getByText('Invalid: Too quiet.')).toHaveClass('field-error');
  });

  it('shows the error for a group told it is invalid, and marks each radio invalid', async () => {
    const { container } = render(<Frequency isInvalid errorMessage="Choose a frequency." />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-invalid');
    expect(group).toHaveAccessibleDescription('Choose a frequency.');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.closest('label')).toHaveAttribute('data-invalid');
    }
    await expectNoA11yViolations(container);
  });

  it('shows the changed chip, and a screen reader reads it with the group', async () => {
    const { container } = render(
      <Frequency isChanged description="You can change this at any time." defaultValue="weekly" />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Newsletter frequency' });
    expect(group).toHaveAttribute('data-changed', '');
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    expect(chip.parentElement).toHaveClass('field-head');
    expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    expect(group).toHaveAccessibleDescription('You can change this at any time. Changed');
    await expectNoA11yViolations(container);
  });

  it('takes the chip text from changedLabel', () => {
    render(<Frequency isChanged changedLabel="Unsaved" />);
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Unsaved');
  });

  it('keeps the chip in the page, unannounced, while the group is not changed', () => {
    render(<Frequency description="You can change this at any time." />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAccessibleDescription('You can change this at any time.');
    expect(group.getAttribute('aria-describedby')?.split(' ')).not.toContain(screen.getByText('Changed').id);
  });

  it('adds the chip to the aria-describedby the caller passes', () => {
    render(
      <>
        <p id="note">Applies to every workspace.</p>
        <Frequency description="You can change this at any time." aria-describedby="note" isChanged />
      </>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      'You can change this at any time. Applies to every workspace. Changed',
    );
  });

  it('draws no chip for a group without a label row', () => {
    const { container } = render(
      <RadioGroup aria-label="Frequency" isChanged>
        <Radio value="weekly">Weekly</Radio>
      </RadioGroup>,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(container.querySelector('.field-head')).toBeNull();
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-describedby');
  });

  it('lets invalid outrank changed: the chip is gone and no longer announced', async () => {
    const { container, rerender } = render(<Frequency isChanged errorMessage="Choose a frequency." />);
    const group = screen.getByRole('radiogroup');
    const chipId = screen.getByText('Changed').id;
    expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(chipId);
    rerender(<Frequency isChanged isInvalid errorMessage="Choose a frequency." />);
    expect(group).toHaveAttribute('data-changed', '');
    expect(group).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(group.getAttribute('aria-describedby')?.split(' ')).not.toContain(chipId);
    expect(group).toHaveAccessibleDescription('Choose a frequency.');
    await expectNoA11yViolations(container);
  });

  it('lets invalid outrank changed when React Aria finds the group invalid', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Frequency name="frequency" isRequired isChanged errorMessage="Choose a frequency." />
        <button type="submit">Save</button>
      </form>,
    );
    const group = screen.getByRole('radiogroup');
    expect(screen.getByText('Changed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(group).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('Choose a frequency.');
    await user.click(screen.getByText('Weekly'));
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('Changed');
  });

  it('disables every radio, skips the group in the form and ignores keys', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Frequency name="frequency" defaultValue="weekly" isDisabled />
      </form>,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-disabled');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
      expect(radio.closest('label')).toHaveAttribute('data-disabled');
    }
    await user.click(screen.getByText('Never'));
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(new FormData(formOf(container)).has('frequency')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('keeps a read-only choice readable, in the form and out of reach of the keys', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Frequency name="frequency" defaultValue="weekly" isReadOnly />
      </form>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-readonly');
    await user.click(screen.getByText('Never'));
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Never' })).not.toBeChecked();
    expect(new FormData(formOf(container)).get('frequency')).toBe('weekly');
  });

  it('skips a disabled item with the keys and leaves it out of the choice', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <RadioGroup label="Plan" name="plan" defaultValue="free">
          <Radio value="free">Free</Radio>
          <Radio value="team" isDisabled>
            Team
          </Radio>
          <Radio value="business">Business</Radio>
        </RadioGroup>
      </form>,
    );
    const team = screen.getByRole('radio', { name: 'Team' });
    expect(team).toBeDisabled();
    expect(team.closest('label')).toHaveAttribute('data-disabled');
    expect(screen.getByRole('radio', { name: 'Free' }).closest('label')).not.toHaveAttribute('data-disabled');
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Business' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Business' })).toBeChecked();
    await user.click(screen.getByText('Team'));
    expect(team).not.toBeChecked();
    expect(new FormData(formOf(container)).get('plan')).toBe('business');
    await expectNoA11yViolations(container);
  });

  // A known React Aria limit, recorded in Appendix B and not worked around. `useRadio` in
  // @react-aria/radio gives the chosen radio the only tab stop and every other one tabIndex -1, then
  // takes the tab stop away from a disabled radio, so a chosen radio that is disabled leaves the group
  // with none: Tab skips it and the keys cannot be reached. `it.fails` holds the right behavior, a tab
  // stop in the group, so an upstream fix makes this test report and it can be turned into a plain `it`.
  it.fails('keeps a tab stop in the group when the chosen radio is disabled', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <RadioGroup label="Plan" defaultValue="team">
          <Radio value="free">Free</Radio>
          <Radio value="team" isDisabled>
            Team
          </Radio>
          <Radio value="business">Business</Radio>
        </RadioGroup>
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole('radiogroup')).toContainElement(document.activeElement as HTMLElement);
  });

  it('forwards ref to the group', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Frequency ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByRole('radiogroup'));
    expect(ref.current).toHaveClass('field', 'radio-group');
  });

  it('merges a string className after its own', () => {
    const { container } = render(<Frequency className="extra" />);
    expect(root(container)).toHaveClass('field', 'radio-group', 'extra');
  });

  it('merges a function className, which receives the group state', () => {
    const className = vi.fn(
      ({
        isInvalid,
        isDisabled,
        orientation,
      }: {
        isInvalid: boolean;
        isDisabled: boolean;
        orientation: string;
        defaultClassName: string | undefined;
      }) => (isInvalid ? 'is-invalid' : isDisabled ? 'is-disabled' : `is-${orientation}`),
    );
    const { container, rerender } = render(<Frequency className={className} />);
    expect(root(container)).toHaveClass('field', 'radio-group', 'is-vertical');
    rerender(<Frequency className={className} orientation="horizontal" />);
    expect(root(container)).toHaveClass('field', 'radio-group', 'is-horizontal');
    rerender(<Frequency className={className} isInvalid />);
    expect(root(container)).toHaveClass('field', 'radio-group', 'is-invalid');
    rerender(<Frequency className={className} isDisabled />);
    expect(root(container)).toHaveClass('field', 'radio-group', 'is-disabled');
    expect(className.mock.calls[0]?.[0].defaultClassName).toBe('react-aria-RadioGroup');
  });

  it('names a group with aria-label when it has no visible label', () => {
    render(
      <RadioGroup aria-label="Corners">
        <Radio value="rounded">Rounded</Radio>
        <Radio value="square">Square</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Corners' })).toBeInTheDocument();
  });

  it('scopes the radios to their own group', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Frequency label="Newsletter" name="newsletter" defaultValue="weekly" />
        <Frequency label="Digest" name="digest" defaultValue="never" />
      </>,
    );
    const newsletter = screen.getByRole('radiogroup', { name: 'Newsletter' });
    const digest = screen.getByRole('radiogroup', { name: 'Digest' });
    await user.click(within(newsletter).getByText('Monthly'));
    expect(within(newsletter).getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(within(digest).getByRole('radio', { name: 'Never' })).toBeChecked();
  });

  it.each([
    ['plain', {}],
    ['with a hint', { description: 'You can change this at any time.' }],
    ['with a choice', { defaultValue: 'weekly' }],
    ['horizontal', { orientation: 'horizontal', defaultValue: 'weekly' }],
    ['changed', { isChanged: true, defaultValue: 'weekly' }],
    ['invalid', { isInvalid: true, errorMessage: 'Choose a frequency.' }],
    ['invalid and changed', { isInvalid: true, isChanged: true, errorMessage: 'Choose a frequency.' }],
    ['disabled', { isDisabled: true, defaultValue: 'weekly' }],
    ['read-only', { isReadOnly: true, defaultValue: 'weekly' }],
    ['required', { isRequired: true }],
  ] satisfies [string, Partial<RadioGroupProps>][])(
    'has no axe violations when %s',
    async (_state, props) => {
      const { container } = render(<Frequency {...props} />);
      await expectNoA11yViolations(container);
    },
  );
});
