import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useControllableState } from './useControllableState';

interface ProbeProps {
  value?: string;
  defaultValue: string;
  onChange?: (value: string) => void;
  /** What the button sets. */
  next: string;
}

/** Shows the value, and sets `next` when its button is pressed. */
function Probe({ value, defaultValue, onChange, next }: ProbeProps): ReactElement {
  const [current, setValue] = useControllableState(value, defaultValue, onChange);
  return (
    <>
      <output>{current}</output>
      <button
        type="button"
        onClick={() => {
          setValue(next);
        }}
      >
        Set
      </button>
    </>
  );
}

const shown = (): string | null => screen.getByRole('status').textContent;

describe('useControllableState', () => {
  it('starts from the default when uncontrolled, and the setter moves it and tells onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Probe defaultValue="light" next="dark" onChange={onChange} />);
    expect(shown()).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Set' }));
    expect(shown()).toBe('dark');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('shows the given value when controlled, and moves only when the prop does', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Probe value="light" defaultValue="dark" next="dark" onChange={onChange} />);
    expect(shown()).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Set' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('dark');
    expect(shown()).toBe('light');
    rerender(<Probe value="dark" defaultValue="dark" next="dark" onChange={onChange} />);
    expect(shown()).toBe('dark');
  });

  it('calls nothing when the value set is the current one, controlled or not', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Probe defaultValue="light" next="light" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Set' }));
    expect(onChange).not.toHaveBeenCalled();
    unmount();
    render(<Probe value="dark" defaultValue="light" next="dark" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Set' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(shown()).toBe('dark');
  });

  it('works with no onChange', async () => {
    const user = userEvent.setup();
    render(<Probe defaultValue="light" next="dark" />);
    await user.click(screen.getByRole('button', { name: 'Set' }));
    expect(shown()).toBe('dark');
  });
});
