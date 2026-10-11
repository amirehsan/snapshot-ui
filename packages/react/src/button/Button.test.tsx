import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Button } from './Button';

describe('Button', () => {
  it('renders a primary button by default', async () => {
    const { container } = render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('button', 'button-primary');
    await expectNoA11yViolations(container);
  });

  it.each(['secondary', 'tertiary', 'danger'] as const)('renders the %s variant class', (variant) => {
    render(<Button variant={variant}>Save</Button>);
    expect(screen.getByRole('button')).toHaveClass('button', `button-${variant}`);
  });

  it('fires onPress on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('does not fire onPress when disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('stays focusable while pending, ignores presses and shows a named spinner', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(
      <Button isPending pendingLabel="Saving" onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).not.toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Saving' })).toBeInTheDocument();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
    await user.tab();
    await user.tab({ shift: true });
    expect(button).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('keeps the label in the accessible name while pending', () => {
    render(<Button isPending>Save</Button>);
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
  });

  it('names the spinner Loading when no pendingLabel is given', () => {
    render(<Button isPending>Save</Button>);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });

  it('submits a native form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Button type="submit">Send</Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit its form while pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Button type="submit" isPending>
          Send
        </Button>
      </form>,
    );
    await user.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('forwards data attributes, so a button can carry its own theme', () => {
    render(<Button data-theme="dark">Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-theme', 'dark');
  });

  it('forwards a ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges a custom className', () => {
    render(<Button className="extra">Save</Button>);
    expect(screen.getByRole('button')).toHaveClass('button', 'button-primary', 'extra');
  });

  it('merges a function-form className with the base classes', () => {
    render(<Button className={({ isPressed }) => (isPressed ? 'is-pressed' : 'extra')}>Save</Button>);
    expect(screen.getByRole('button')).toHaveClass('button', 'button-primary', 'extra');
  });
});
