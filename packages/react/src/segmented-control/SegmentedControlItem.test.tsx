import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';
import { SegmentedControlItem } from './SegmentedControlItem';

describe('SegmentedControlItem', () => {
  it('is a radio inside a wrapper, drawn by a label with the option class', () => {
    render(
      <SegmentedControl aria-label="Theme" defaultValue="dark">
        <SegmentedControlItem value="light">Light</SegmentedControlItem>
        <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
      </SegmentedControl>,
    );
    const dark = screen.getByRole('radio', { name: 'Dark' });
    const option = dark.closest('label');
    expect(option).toHaveClass('segmented-option');
    expect(option).toHaveAttribute('data-selected');
    expect(option?.parentElement).toHaveClass('segmented-item');
    expect(option?.parentElement?.parentElement).toHaveClass('segmented-track');
    expect(screen.getByText('Dark')).toHaveClass('segmented-label');
    expect(screen.getByRole('radio', { name: 'Light' }).closest('label')).not.toHaveAttribute(
      'data-selected',
    );
  });

  it('requires its children in its types, and takes an aria-label as an extra', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error an option with no children has nothing to draw and no name
    const nameless = <SegmentedControlItem value="light" />;
    // @ts-expect-error an aria-label names an option and does not replace what it shows
    const byAriaLabelAlone = <SegmentedControlItem value="light" aria-label="Light" />;
    // @ts-expect-error an aria-labelledby names an option and does not replace what it shows
    const byLabelledbyAlone = <SegmentedControlItem value="light" aria-labelledby="light-name" />;
    const labelled = <SegmentedControlItem value="light">Light</SegmentedControlItem>;
    const iconOnly = (
      <SegmentedControlItem value="light" aria-label="Light">
        <svg viewBox="0 0 24 24" />
      </SegmentedControlItem>
    );
    expect([nameless, byAriaLabelAlone, byLabelledbyAlone, labelled, iconOnly]).toHaveLength(5);
  });

  it('keeps an option that cannot be chosen out of the keys and the form', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();
    render(
      <SegmentedControl aria-label="Plan" defaultValue="free" onChange={onChange}>
        <SegmentedControlItem value="free">Free</SegmentedControlItem>
        <SegmentedControlItem value="team" isDisabled>
          Team
        </SegmentedControlItem>
        <SegmentedControlItem value="business">Business</SegmentedControlItem>
      </SegmentedControl>,
    );
    const team = screen.getByRole('radio', { name: 'Team' });
    expect(team).toBeDisabled();
    expect(team.closest('label')).toHaveAttribute('data-disabled');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Business' })).toBeChecked();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('business');
    await user.click(screen.getByText('Team'));
    expect(screen.getByRole('radio', { name: 'Business' })).toBeChecked();
  });

  it('forwards ref to the option label', () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <SegmentedControl aria-label="Theme">
        <SegmentedControlItem ref={ref} value="light">
          Light
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current).toHaveClass('segmented-option');
  });

  it('merges a string className after the option class', () => {
    render(
      <SegmentedControl aria-label="Theme">
        <SegmentedControlItem value="light" className="extra">
          Light
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(screen.getByRole('radio').closest('label')).toHaveClass('segmented-option', 'extra');
  });

  it('merges a function className, which receives the option state', async () => {
    const user = userEvent.setup();
    const className = vi.fn(
      ({ isSelected }: { isSelected: boolean; defaultClassName: string | undefined }) =>
        isSelected ? 'is-on' : 'is-off',
    );
    render(
      <SegmentedControl aria-label="Theme" defaultValue="light">
        <SegmentedControlItem value="light" className={className}>
          Light
        </SegmentedControlItem>
        <SegmentedControlItem value="dark" className={className}>
          Dark
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    const light = screen.getByRole('radio', { name: 'Light' }).closest('label');
    const dark = screen.getByRole('radio', { name: 'Dark' }).closest('label');
    expect(light).toHaveClass('segmented-option', 'is-on');
    expect(dark).toHaveClass('segmented-option', 'is-off');
    await user.click(screen.getByText('Dark'));
    expect(light).toHaveClass('is-off');
    expect(dark).toHaveClass('is-on');
    expect(className.mock.calls[0]?.[0].defaultClassName).toBe('react-aria-RadioButton');
  });
});
