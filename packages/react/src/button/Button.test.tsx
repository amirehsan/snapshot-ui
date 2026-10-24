import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

/**
 * React Aria's live announcer says a focused button's pending start and end by ids in the button, and keeps the
 * sentence on the page for seconds. A button that unmounts in that time, as a dialog's Save does when the save
 * settles and closes it, must not leave a sentence naming ids that are gone.
 */
describe('Button leaving while React Aria says its pending state', () => {
  /** The sentences React Aria's announcer holds, by their own name or the ids that name them. */
  const sentences = (): Element[] => [...document.querySelectorAll('[data-live-announcer] [role="img"]')];

  beforeEach(() => {
    for (const log of document.querySelectorAll('[data-live-announcer] [role="log"]')) log.replaceChildren();
  });

  function Save({
    shown = true,
    pending,
    name,
  }: {
    shown?: boolean;
    pending: boolean;
    name?: string;
  }): ReactElement | null {
    return shown ? (
      <Button isPending={pending} pendingLabel="Saving" aria-label={name}>
        Add plan
      </Button>
    ) : null;
  }

  it.each([
    ['while pending, named by its text', false, undefined, 'Add plan Saving'],
    ['after its pending ended, named by its text', true, undefined, 'Add plan'],
    ['while pending, named by aria-label', false, 'Add the plan', 'Add the plan Saving'],
  ] as const)(
    'leaves a sentence that still says its words when it unmounts %s',
    async (_case, ends, name, words) => {
      const { rerender } = render(<Save pending={false} name={name} />);
      act(() => {
        screen.getByRole('button').focus();
      });
      rerender(<Save pending name={name} />);
      if (ends) rerender(<Save pending={false} name={name} />);
      // React Aria said it by ids in the button.
      const said = sentences().at(-1);
      expect(said?.getAttribute('aria-labelledby')).toBeTruthy();
      rerender(<Save shown={false} pending={!ends} name={name} />);
      expect(said).toHaveAttribute('aria-label', words);
      expect(said).not.toHaveAttribute('aria-labelledby');
      await expectNoA11yViolations(document.body);
    },
  );

  it("gives its words to a sentence that arrives after it has gone, as a page's first sentence can", () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(<Save pending={false} />);
      act(() => {
        screen.getByRole('button').focus();
      });
      rerender(<Save pending />);
      const ids = sentences().at(-1)?.getAttribute('aria-labelledby') ?? '';
      for (const said of sentences()) said.remove();
      rerender(<Save shown={false} pending />);
      // React Aria waits 100ms before a page's first sentence, so it lands once the button has left.
      const late = document.createElement('div');
      late.setAttribute('role', 'img');
      late.setAttribute('aria-labelledby', ids);
      document.querySelector('[data-live-announcer] [role="log"]')?.append(late);
      vi.advanceTimersByTime(100);
      expect(late).toHaveAttribute('aria-label', 'Add plan Saving');
      expect(late).not.toHaveAttribute('aria-labelledby');
    } finally {
      vi.useRealTimers();
    }
  });

  it('looks for no sentence as it leaves when it was never pending', () => {
    const set = vi.spyOn(window, 'setTimeout');
    try {
      const { rerender } = render(<Save pending={false} />);
      rerender(<Save shown={false} pending={false} />);
      expect(set.mock.calls.filter(([, delay]) => delay === 100)).toEqual([]);
    } finally {
      set.mockRestore();
    }
  });

  it('leaves the sentences of a button that stays alone', () => {
    const { rerender } = render(<Save pending={false} />);
    act(() => {
      screen.getByRole('button').focus();
    });
    rerender(<Save pending />);
    const said = sentences().at(-1);
    const ids = said?.getAttribute('aria-labelledby');
    rerender(<Save pending={false} />);
    expect(said).toHaveAttribute('aria-labelledby', ids);
  });
});
