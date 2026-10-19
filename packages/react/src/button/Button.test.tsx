import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, createRef, type ReactElement } from 'react';
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

  it('adds the pending label to a text button’s name while pending, and drops it after', () => {
    const { rerender } = render(
      <Button isPending pendingLabel="Saving">
        Save
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Save Saving');
    rerender(<Button pendingLabel="Saving">Save</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName('Save');
    // Named by its text again, as a button that was never pending is.
    expect(button).not.toHaveAttribute('aria-labelledby');
  });

  it('keeps the label’s id at rest, so a pending sentence React Aria said by it still resolves', () => {
    const { rerender } = render(
      <Button isPending pendingLabel="Saving">
        Save
      </Button>,
    );
    const label = document.querySelector('.button-label');
    const id = label?.id ?? '';
    expect(id).not.toBe('');
    expect(screen.getByRole('button').getAttribute('aria-labelledby')?.split(' ')).toContain(id);
    rerender(<Button pendingLabel="Saving">Save</Button>);
    expect(document.getElementById(id)).toBe(label);
    expect(label).toHaveTextContent('Save');
  });

  it('writes a pending sentence’s words in place of its ids when the button unmounts', async () => {
    const said = sayPendingStart((isPending) => (
      <Button isPending={isPending} pendingLabel="Saving">
        Save
      </Button>
    ));
    const ids = said.result.container.querySelector('button')?.getAttribute('aria-labelledby') ?? '';
    const sentence = said.sentence();
    expect(sentence).toHaveAttribute('aria-labelledby', ids);
    said.result.unmount();
    await Promise.resolve();
    expect(sentence).toHaveAttribute('aria-label', 'Save Saving');
    expect(sentence).not.toHaveAttribute('aria-labelledby');
    await expectNoA11yViolations(announcer());
  });

  it('writes the words onto a sentence the announcer writes just after the unmount', async () => {
    const said = sayPendingStart((isPending) => (
      <Button isPending={isPending} pendingLabel="Saving">
        Save
      </Button>
    ));
    const ids = said.result.container.querySelector('button')?.getAttribute('aria-labelledby') ?? '';
    said.result.unmount();
    // React Aria's announcer writes the first sentence it is ever given 100ms late, so it can land here.
    const late = document.createElement('div');
    late.setAttribute('role', 'img');
    late.setAttribute('aria-labelledby', ids);
    announcer().querySelector('[aria-live="assertive"]')?.append(late);
    await Promise.resolve();
    expect(late).toHaveAttribute('aria-label', 'Save Saving');
    expect(late).not.toHaveAttribute('aria-labelledby');
  });

  it('keeps a name given by attribute in the words it writes', async () => {
    const said = sayPendingStart((isPending) => (
      <Button isPending={isPending} pendingLabel="Sending" aria-label="Send the invoice">
        Send
      </Button>
    ));
    const sentence = said.sentence();
    said.result.unmount();
    await Promise.resolve();
    expect(sentence).toHaveAttribute('aria-label', 'Send the invoice Sending');
  });

  it('leaves a sentence by ids while they resolve, as in Strict Mode’s rehearsed unmount', async () => {
    const said = sayPendingStart((isPending) => (
      <StrictMode>
        <Button isPending={isPending} pendingLabel="Saving">
          Save
        </Button>
      </StrictMode>
    ));
    const sentence = said.sentence();
    await Promise.resolve();
    expect(sentence).toHaveAttribute('aria-labelledby');
    expect(sentence).not.toHaveAttribute('aria-label');
  });

  it('keeps a name given by attribute, and adds the pending label to it', () => {
    render(
      <>
        <span id="outside">Publish the post</span>
        <Button isPending pendingLabel="Publishing" aria-labelledby="outside">
          Publish
        </Button>
        <Button isPending pendingLabel="Sending" aria-label="Send the invoice">
          Send
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Publish the post Publishing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send the invoice Sending' })).toBeInTheDocument();
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

/** React Aria's live announcer, which it keeps on the body across tests. */
function announcer(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[data-live-announcer]');
  if (!found) throw new Error('No live announcer');
  return found;
}

/**
 * Renders `ui`'s Button at rest, focuses it and makes it pending, so React Aria's announcer says the start by
 * the button's ids. `sentence` is what it said.
 */
function sayPendingStart(ui: (isPending: boolean) => ReactElement): {
  result: ReturnType<typeof render>;
  sentence: () => HTMLElement;
} {
  const result = render(ui(false));
  const button = screen.getByRole('button');
  act(() => {
    button.focus();
  });
  result.rerender(ui(true));
  const ids = button.getAttribute('aria-labelledby') ?? '';
  return {
    result,
    sentence: () => {
      const found = document.querySelector<HTMLElement>(
        `[data-live-announcer] [role="img"][aria-labelledby="${CSS.escape(ids)}"]`,
      );
      if (!found) throw new Error(`Nothing said by ${ids}`);
      return found;
    },
  };
}
