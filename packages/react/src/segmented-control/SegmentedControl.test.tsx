import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { SegmentedControl, type SegmentedControlProps } from './SegmentedControl';
import { SegmentedControlItem } from './SegmentedControlItem';

/** The three options most tests use. `props` supplies the label and anything else. */
function Theme(props: SegmentedControlProps): ReactElement {
  return (
    <SegmentedControl {...props}>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
      <SegmentedControlItem value="system">System</SegmentedControlItem>
    </SegmentedControl>
  );
}

/** A control the caller controls, the way a form library would. */
function Controlled(props: SegmentedControlProps): ReactElement {
  const [value, setValue] = useState('light');
  return <Theme {...props} value={value} onChange={setValue} />;
}

const root = (container: HTMLElement): Element => {
  const element = container.firstElementChild;
  if (!element) throw new Error('Nothing rendered');
  return element;
};

const checked = (): string[] =>
  screen
    .getAllByRole('radio')
    .filter((radio) => (radio as HTMLInputElement).checked)
    .map((radio) => radio.closest('label')?.textContent ?? '');

describe('SegmentedControl', () => {
  it('is a labelled radio group of options, inside a field', async () => {
    const { container } = render(<Theme label="Color mode" description="Follows your system by default." />);
    const group = screen.getByRole('radiogroup', { name: 'Color mode' });
    expect(group).toBe(root(container));
    expect(group).toHaveClass('field', 'segmented');
    expect(group).not.toHaveClass('segmented-sm');
    expect(group).not.toHaveAttribute('data-changed');
    expect(group).not.toHaveAttribute('data-invalid');
    expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    expect(group).toHaveAccessibleDescription('Follows your system by default.');
    expect(screen.getByText('Color mode')).toHaveClass('field-label');
    expect(screen.getByText('Follows your system by default.')).toHaveClass('field-description');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(container.querySelectorAll('.segmented-track > .segmented-item')).toHaveLength(3);
    await expectNoA11yViolations(container);
  });

  it('puts its parts in the order the field contract asks for', () => {
    const { container } = render(
      <Theme label="Color mode" description="One choice." isInvalid errorMessage="Choose one." />,
    );
    // The last child is the marker the control watches to learn how much room it has.
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'field-head',
      'segmented-track',
      'field-description',
      'field-error',
      'segmented-room',
    ]);
  });

  it('is named by aria-label when it has no visible label, and then has no label row', async () => {
    const { container } = render(<Theme aria-label="Corners" />);
    expect(screen.getByRole('radiogroup', { name: 'Corners' })).toBe(root(container));
    expect(container.querySelector('.field-head')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('asks the types for a visible label or an aria-label', () => {
    const forgotten = (): ReactElement => (
      // @ts-expect-error A control with neither a label nor an aria-label has no name.
      <SegmentedControl>
        <SegmentedControlItem value="a">A</SegmentedControlItem>
      </SegmentedControl>
    );
    const byLabelledby = (): ReactElement => (
      <SegmentedControl aria-labelledby="heading">
        <SegmentedControlItem value="a">A</SegmentedControlItem>
      </SegmentedControl>
    );
    expect(forgotten).toBeTypeOf('function');
    expect(byLabelledby).toBeTypeOf('function');
  });

  it('selects the default value and leaves the rest', () => {
    render(<Theme label="Color mode" defaultValue="dark" />);
    expect(checked()).toEqual(['Dark']);
    expect(screen.getByRole('radio', { name: 'Dark' }).closest('label')).toHaveAttribute('data-selected');
  });

  it('selects nothing until it is told to, and then moves with a press', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();
    render(<Theme label="Color mode" onChange={onChange} />);
    expect(checked()).toEqual([]);
    await user.click(screen.getByText('System'));
    expect(checked()).toEqual(['System']);
    await user.click(screen.getByText('Light'));
    expect(checked()).toEqual(['Light']);
    expect(onChange.mock.calls.map(([value]) => value)).toEqual(['system', 'light']);
  });

  it('moves the selection with the arrow keys, and Tab lands on the selected option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();
    render(<Theme label="Color mode" defaultValue="light" onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
    expect(checked()).toEqual(['Dark']);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    // Past the last option the selection wraps to the first.
    expect(checked()).toEqual(['Light']);
    await user.keyboard('{ArrowLeft}');
    expect(checked()).toEqual(['System']);
    // The same keys serve a stacked column, where the options are one above the next.
    await user.keyboard('{ArrowUp}');
    expect(checked()).toEqual(['Dark']);
    await user.keyboard('{ArrowDown}');
    expect(checked()).toEqual(['System']);
    expect(onChange.mock.calls.map(([value]) => value)).toEqual([
      'dark',
      'system',
      'light',
      'system',
      'dark',
      'system',
    ]);
    // One tab stop for the whole group.
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('lets Tab land on the first option while nothing is selected, and an arrow key choose the next', async () => {
    const user = userEvent.setup();
    render(<Theme label="Color mode" />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(checked()).toEqual(['Dark']);
  });

  it('follows the value of a controlled control, and tells the caller what was chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();
    const { rerender } = render(<Theme label="Color mode" value="light" onChange={onChange} />);
    await user.click(screen.getByText('Dark'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('dark');
    expect(checked()).toEqual(['Light']);
    rerender(<Theme label="Color mode" value="system" onChange={onChange} />);
    expect(checked()).toEqual(['System']);
    // null is a controlled control with nothing selected.
    rerender(<Theme label="Color mode" value={null} onChange={onChange} />);
    expect(checked()).toEqual([]);
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled label="Color mode" />);
    expect(checked()).toEqual(['Light']);
    await user.click(screen.getByText('Dark'));
    expect(checked()).toEqual(['Dark']);
  });

  it('submits the chosen value in a plain form under its name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Theme label="Color mode" name="theme" />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).has('theme')).toBe(false);
    await user.click(screen.getByText('Dark'));
    expect(new FormData(form).get('theme')).toBe('dark');
    await user.keyboard('{ArrowRight}');
    expect(new FormData(form).get('theme')).toBe('system');
  });

  it('submits its default value, and follows a form reset back to it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Theme label="Color mode" name="theme" defaultValue="dark" />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('theme')).toBe('dark');
    await user.click(screen.getByText('System'));
    expect(new FormData(form).get('theme')).toBe('system');
    act(() => {
      form.reset();
    });
    expect(checked()).toEqual(['Dark']);
    expect(new FormData(form).get('theme')).toBe('dark');
  });

  it('disables every option, leaves them out of the form and shows the control as disabled', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Theme label="Color mode" name="theme" defaultValue="dark" isDisabled />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(container.querySelector('.segmented')).toHaveAttribute('data-disabled');
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    for (const option of container.querySelectorAll('.segmented-option')) {
      expect(option).toHaveAttribute('data-disabled');
    }
    await user.click(screen.getByText('System'));
    expect(checked()).toEqual(['Dark']);
    expect(new FormData(form).has('theme')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('shows the changed chip, and a screen reader reads it with the control', async () => {
    const { container } = render(
      <Theme
        label="Color mode"
        description="Follows your system by default."
        isChanged
        defaultValue="dark"
      />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Color mode' });
    expect(group).toHaveAttribute('data-changed', '');
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    expect(chip.parentElement).toHaveClass('field-head');
    expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    expect(group).toHaveAccessibleDescription('Follows your system by default. Changed');
    // The chip sits beside the label, so the group's name stays the label's own.
    expect(group).toHaveAccessibleName('Color mode');
    await expectNoA11yViolations(container);
  });

  it('takes the chip text from changedLabel', () => {
    render(<Theme label="Color mode" isChanged changedLabel="Unsaved" />);
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Unsaved');
  });

  it('keeps the chip unannounced while the control is not changed, and adds it to the described-by the caller passes', () => {
    const { rerender } = render(
      <>
        <p id="note">Visible to admins.</p>
        <Theme label="Color mode" aria-describedby="note" />
      </>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Visible to admins.');
    rerender(
      <>
        <p id="note">Visible to admins.</p>
        <Theme label="Color mode" aria-describedby="note" isChanged />
      </>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Visible to admins. Changed');
  });

  it('draws no chip for a control without a label row, though it still marks itself changed', () => {
    const { container } = render(<Theme aria-label="Corners" isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-describedby');
  });

  it('shows the error and sets data-invalid while the control is invalid', async () => {
    const { container } = render(<Theme label="Color mode" isInvalid errorMessage="Choose a color mode." />);
    const group = screen.getByRole('radiogroup', { name: 'Color mode' });
    expect(group).toHaveAttribute('data-invalid');
    expect(screen.getByText('Choose a color mode.')).toHaveClass('field-error');
    expect(group).toHaveAccessibleDescription('Choose a color mode.');
    await expectNoA11yViolations(container);
  });

  it('shows a required control as invalid after a submit with nothing chosen, and clears it on a choice', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Theme label="Color mode" name="theme" isRequired errorMessage="Choose a color mode." />
        <button type="submit">Save</button>
      </form>,
    );
    expect(screen.queryByText('Choose a color mode.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Choose a color mode.')).toHaveClass('field-error');
    expect(container.querySelector('.segmented')).toHaveAttribute('data-invalid');
    await user.click(screen.getByText('Dark'));
    expect(screen.queryByText('Choose a color mode.')).not.toBeInTheDocument();
    expect(container.querySelector('.segmented')).not.toHaveAttribute('data-invalid');
  });

  it('lets invalid outrank changed: the chip is gone and no longer announced', async () => {
    const { container, rerender } = render(<Theme label="Color mode" isChanged errorMessage="Choose one." />);
    const group = screen.getByRole('radiogroup');
    const chipId = screen.getByText('Changed').id;
    expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(chipId);
    rerender(<Theme label="Color mode" isChanged isInvalid errorMessage="Choose one." />);
    // Both attributes stay on the root. The stylesheet draws the error edge, because invalid comes last.
    expect(group).toHaveAttribute('data-changed', '');
    expect(group).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(group.getAttribute('aria-describedby')?.split(' ')).not.toContain(chipId);
    expect(group).toHaveAccessibleDescription('Choose one.');
    await expectNoA11yViolations(container);
  });

  it('lets invalid outrank changed when React Aria finds the control invalid', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Theme label="Color mode" name="theme" isRequired isChanged errorMessage="Choose one." />
        <button type="submit">Save</button>
      </form>,
    );
    expect(screen.getByText('Changed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(container.querySelector('.segmented')).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Choose one.');
  });

  it('draws the compact size with its own class', () => {
    const { container } = render(<Theme aria-label="Corners" size="sm" />);
    expect(root(container)).toHaveClass('field', 'segmented', 'segmented-sm');
    expect(root(container)).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('passes the group attributes through', () => {
    render(<Theme label="Color mode" data-testid="group" />);
    expect(screen.getByTestId('group')).toBe(screen.getByRole('radiogroup'));
  });

  it('forwards ref to the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Theme ref={ref} label="Color mode" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByRole('radiogroup'));
    expect(ref.current).toHaveClass('field', 'segmented');
  });

  it('merges a string className after its own', () => {
    const { container } = render(<Theme label="Color mode" className="extra" />);
    expect(root(container)).toHaveClass('field', 'segmented', 'extra');
  });

  it('merges a function className, which receives the control state', () => {
    const className = vi.fn(
      ({
        isInvalid,
        isDisabled,
      }: {
        isInvalid: boolean;
        isDisabled: boolean;
        defaultClassName: string | undefined;
      }) => (isInvalid ? 'is-invalid' : isDisabled ? 'is-disabled' : 'is-fine'),
    );
    const { container, rerender } = render(<Theme label="Color mode" className={className} />);
    expect(root(container)).toHaveClass('field', 'segmented', 'is-fine');
    rerender(<Theme label="Color mode" className={className} isInvalid />);
    expect(root(container)).toHaveClass('field', 'segmented', 'is-invalid');
    rerender(<Theme label="Color mode" className={className} isDisabled />);
    expect(root(container)).toHaveClass('field', 'segmented', 'is-disabled');
    expect(className.mock.calls[0]?.[0].defaultClassName).toBe('react-aria-RadioGroup');
  });

  it.each([
    ['plain', { label: 'Color mode' }],
    ['with a hint', { label: 'Color mode', description: 'Follows your system by default.' }],
    ['with a selection', { label: 'Color mode', defaultValue: 'dark' }],
    ['named by aria-label', { 'aria-label': 'Corners' }],
    ['compact', { 'aria-label': 'Corners', size: 'sm' }],
    ['changed', { label: 'Color mode', isChanged: true }],
    ['invalid', { label: 'Color mode', isInvalid: true, errorMessage: 'Choose one.' }],
    [
      'invalid and changed',
      { label: 'Color mode', isInvalid: true, isChanged: true, errorMessage: 'Choose one.' },
    ],
    ['disabled', { label: 'Color mode', isDisabled: true, defaultValue: 'dark' }],
    ['required', { label: 'Color mode', isRequired: true }],
  ] satisfies [string, SegmentedControlProps][])('has no axe violations when %s', async (_state, props) => {
    const { container } = render(<Theme {...props} />);
    await expectNoA11yViolations(container);
  });
});

describe('SegmentedControl stacking', () => {
  /** The widths the layout would give, which jsdom has none of. */
  const layout = { room: 300, row: 400, column: 120 };

  /**
   * Answers getBoundingClientRect the way a browser would. The marker is as wide as the room. The track
   * is as wide as the row, or as the room if that is wider, until the root says it is stacked: then
   * it is the column's width. So a test that measured the stacked track would read the wrong width.
   */
  function mockLayout(): void {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      let width = 0;
      if (this.classList.contains('segmented-room')) width = layout.room;
      else if (this.classList.contains('segmented-track')) {
        width = this.closest('.segmented')?.hasAttribute('data-stacked')
          ? layout.column
          : Math.max(layout.row, layout.room);
      }
      return new DOMRect(0, 0, width, 0);
    });
  }

  /** A ResizeObserver that stays still until the test says the size changed. */
  class FakeResizeObserver {
    static all: FakeResizeObserver[] = [];
    observed: Element[] = [];
    disconnected = false;
    constructor(private readonly callback: () => void) {
      FakeResizeObserver.all.push(this);
    }
    observe(target: Element): void {
      this.observed.push(target);
    }
    unobserve(): void {
      // Nothing is ever unobserved: a control watches one marker for as long as it lives.
    }
    disconnect(): void {
      this.disconnected = true;
    }
    fire(): void {
      this.callback();
    }
  }

  const resized = (): void => {
    act(() => {
      for (const observer of FakeResizeObserver.all) observer.fire();
    });
  };

  const stacked = (): boolean => screen.getByRole('radiogroup').hasAttribute('data-stacked');

  const setup = (): void => {
    layout.room = 300;
    layout.row = 400;
    layout.column = 120;
    FakeResizeObserver.all = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    mockLayout();
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'fonts');
  });

  it('stays in one row where the row fits its room', () => {
    setup();
    layout.row = 250;
    render(<Theme label="Color mode" />);
    expect(stacked()).toBe(false);
  });

  it('stacks, before anything is drawn, where the row does not fit its room', () => {
    setup();
    render(<Theme label="Color mode" />);
    expect(stacked()).toBe(true);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-stacked', '');
  });

  it('stacks and unstacks as the room changes, measuring the row as a row each time', () => {
    setup();
    render(<Theme label="Color mode" />);
    expect(stacked()).toBe(true);
    // Room for the row again. The stacked track is 120px wide, which would fit any room,
    // so only a measurement taken in a row can tell that 350px is still too little.
    layout.room = 350;
    resized();
    expect(stacked()).toBe(true);
    layout.room = 420;
    resized();
    expect(stacked()).toBe(false);
    layout.room = 280;
    resized();
    expect(stacked()).toBe(true);
  });

  it('allows a row half a pixel over its room', () => {
    setup();
    layout.row = 300.5;
    render(<Theme label="Color mode" />);
    expect(stacked()).toBe(false);
    layout.row = 300.6;
    resized();
    expect(stacked()).toBe(true);
  });

  it('keeps its arrangement while it cannot be measured, as when it is hidden', () => {
    setup();
    render(<Theme label="Color mode" />);
    expect(stacked()).toBe(true);
    layout.room = 0;
    resized();
    expect(stacked()).toBe(true);
    layout.room = 500;
    resized();
    expect(stacked()).toBe(false);
    layout.room = 0;
    resized();
    expect(stacked()).toBe(false);
  });

  it('watches the room marker and not the root, and lets go when it unmounts', () => {
    setup();
    const { unmount } = render(<Theme label="Color mode" />);
    expect(FakeResizeObserver.all).toHaveLength(1);
    const [observer] = FakeResizeObserver.all;
    expect(observer?.observed).toHaveLength(1);
    expect(observer?.observed[0]).toHaveClass('segmented-room');
    expect(observer?.observed[0]).toHaveAttribute('aria-hidden', 'true');
    expect(observer?.disconnected).toBe(false);
    unmount();
    expect(observer?.disconnected).toBe(true);
  });

  it('looks again when a label changes', async () => {
    setup();
    const Words = ({ words }: { words: string[] }): ReactElement => (
      <SegmentedControl label="Color mode">
        {words.map((word) => (
          <SegmentedControlItem key={word} value={word}>
            {word}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    );
    const { rerender } = render(<Words words={['Light', 'Dark', 'System']} />);
    expect(stacked()).toBe(true);
    layout.row = 250;
    // Same labels, same row: nothing to look at.
    rerender(<Words words={['Light', 'Dark', 'System']} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(stacked()).toBe(true);
    rerender(<Words words={['Day', 'Night', 'Auto']} />);
    await waitFor(() => {
      expect(stacked()).toBe(false);
    });
  });

  it('looks again when the size changes, since the row is a different width', () => {
    setup();
    const { rerender } = render(<Theme label="Color mode" />);
    expect(stacked()).toBe(true);
    layout.row = 250;
    rerender(<Theme label="Color mode" size="sm" />);
    expect(stacked()).toBe(false);
  });

  it('looks again when a web font arrives, which changes the width of every label', async () => {
    setup();
    const listeners = new Map<string, () => void>();
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        ready: Promise.resolve(),
        addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
        removeEventListener: (type: string) => listeners.delete(type),
      },
    });
    const { unmount } = render(<Theme label="Color mode" />);
    expect(stacked()).toBe(true);
    layout.row = 250;
    act(() => {
      listeners.get('loadingdone')?.();
    });
    expect(stacked()).toBe(false);
    layout.row = 400;
    await act(async () => {
      await Promise.resolve();
    });
    expect(stacked()).toBe(true);
    unmount();
    expect(listeners.size).toBe(0);
  });

  it('stacks once on mount even where ResizeObserver does not exist', () => {
    setup();
    vi.unstubAllGlobals();
    render(<Theme label="Color mode" />);
    expect(stacked()).toBe(true);
  });

  it('keeps one row in an environment that cannot measure anything', () => {
    render(<Theme label="Color mode" />);
    expect(stacked()).toBe(false);
  });

  it('has no axe violations while stacked', async () => {
    setup();
    const { container } = render(<Theme label="Color mode" />);
    expect(stacked()).toBe(true);
    await expectNoA11yViolations(container);
  });
});
