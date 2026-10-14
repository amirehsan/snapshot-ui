import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { SearchField } from './SearchField';

/** A field the caller controls, as an app that keeps the query in its URL does. */
function Controlled({ onChange }: { onChange: (value: string) => void }): ReactElement {
  const [value, setValue] = useState('coffee');
  return (
    <SearchField
      label="Search transactions"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

/** The clear button, which is out of the tab order and so found by its class. */
const clearButton = (container: HTMLElement): HTMLButtonElement => {
  const button = container.querySelector<HTMLButtonElement>('.search-field-clear');
  if (!button) throw new Error('No clear button');
  return button;
};

describe('SearchField', () => {
  it('is a searchbox named by its label, with the hint as its description', async () => {
    const { container } = render(
      <SearchField label="Search transactions" description="Merchant, note or amount." />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search transactions' });
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveClass('input', 'search-field-input');
    expect(input).toHaveAccessibleDescription('Merchant, note or amount.');
    expect(root(container)).toHaveClass('field', 'search-field');
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'field-head',
      'search-field-control',
      'field-description',
    ]);
    // A query is never unsaved, so the label row holds the label alone.
    expect(container.querySelector('.field-head')?.children).toHaveLength(1);
    expect(container.querySelector('.field-changed')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('is named by aria-label without a label, and marks its root data-unlabelled', () => {
    const { container } = render(<SearchField aria-label="Search transactions" placeholder="Search" />);
    expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toBeInTheDocument();
    expect(root(container)).toHaveAttribute('data-unlabelled', '');
    expect(container.querySelector('.field-head')).toBeNull();
  });

  it('draws the magnifier hidden from assistive technology', () => {
    const { container } = render(<SearchField label="Search" />);
    const icon = container.querySelector('.search-field-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(icon?.parentElement).toHaveClass('search-field-control');
  });

  it('clears on Escape and calls onClear, and lets Escape through when already empty', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onKeyDown = vi.fn();
    render(
      // A parent that listens for Escape, as a dialog or a popover does.
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a test harness that only listens
      <div
        onKeyDown={(event) => {
          onKeyDown(event.key);
        }}
      >
        <SearchField label="Search" defaultValue="coffee" onClear={onClear} />
      </div>,
    );
    const input = screen.getByRole('searchbox');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(onClear).toHaveBeenCalledOnce();
    expect(onKeyDown).not.toHaveBeenCalledWith('Escape');
    await user.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalledWith('Escape');
  });

  it('calls onSubmit with the text on Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchField label="Search" onSubmit={onSubmit} />);
    await user.type(screen.getByRole('searchbox'), 'rent{Enter}');
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('rent');
  });

  it('hides the clear button while empty and shows it once there is text', async () => {
    // The stylesheet hides the button under data-empty; jsdom has no stylesheet, so the attribute is read.
    const user = userEvent.setup();
    const { container } = render(<SearchField label="Search" />);
    expect(root(container)).toHaveAttribute('data-empty');
    expect(clearButton(container)).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'a');
    expect(root(container)).not.toHaveAttribute('data-empty');
  });

  it('clears on a press of the clear button and keeps focus in the input', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { container } = render(<SearchField label="Search" defaultValue="coffee" onClear={onClear} />);
    const input = screen.getByRole('searchbox');
    await user.click(input);
    await user.click(clearButton(container));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('keeps the clear button out of the tab order', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <SearchField label="Search" defaultValue="coffee" />
        <button type="button">After</button>
      </>,
    );
    expect(clearButton(container)).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('names the clear button Clear search, or clearLabel', () => {
    const { container, rerender } = render(<SearchField label="Search" defaultValue="a" />);
    expect(clearButton(container)).toHaveAccessibleName('Clear search');
    expect(clearButton(container).querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    rerender(<SearchField label="Search" defaultValue="a" clearLabel="پاک کردن" />);
    expect(clearButton(container)).toHaveAccessibleName('پاک کردن');
  });

  it('works controlled and uncontrolled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Controlled onChange={onChange} />);
    const controlled = screen.getByRole('searchbox');
    expect(controlled).toHaveValue('coffee');
    await user.type(controlled, 's');
    expect(onChange).toHaveBeenLastCalledWith('coffees');
    expect(controlled).toHaveValue('coffees');
    unmount();

    // A value the caller holds still: what is typed is reported and not shown.
    const fixed = vi.fn();
    const { unmount: unmountFixed } = render(<SearchField label="Search" value="one" onChange={fixed} />);
    await user.type(screen.getByRole('searchbox'), 'x');
    expect(fixed).toHaveBeenCalledWith('onex');
    expect(screen.getByRole('searchbox')).toHaveValue('one');
    unmountFixed();

    render(<SearchField label="Search" defaultValue="tea" />);
    const uncontrolled = screen.getByRole('searchbox');
    expect(uncontrolled).toHaveValue('tea');
    await user.type(uncontrolled, 's');
    expect(uncontrolled).toHaveValue('teas');
  });

  it('passes className, ref, inputRef and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <SearchField
        label="Search"
        className={({ isEmpty }) => (isEmpty ? 'mine is-empty' : 'mine')}
        ref={ref}
        inputRef={inputRef}
        data-testid="search"
        name="q"
      />,
    );
    expect(root(container)).toHaveClass('field', 'search-field', 'mine', 'is-empty');
    expect(root(container).className.startsWith('field search-field')).toBe(true);
    expect(ref.current).toBe(root(container));
    expect(inputRef.current).toBe(screen.getByRole('searchbox'));
    expect(inputRef.current).toHaveAttribute('name', 'q');
    expect(root(container)).toHaveAttribute('data-testid', 'search');
  });

  it('has no axe violations labelled, unlabelled, with a value, disabled and invalid', async () => {
    for (const element of [
      <SearchField key="labelled" label="Search" placeholder="Merchant or note" />,
      <SearchField key="unlabelled" aria-label="Search transactions" placeholder="Search transactions" />,
      <SearchField key="value" label="Search" defaultValue="coffee" />,
      <SearchField key="disabled" label="Search" defaultValue="coffee" isDisabled />,
      <SearchField
        key="invalid"
        label="Search"
        defaultValue="a"
        isInvalid
        errorMessage="Search needs two letters or more"
      />,
    ]) {
      const { container, unmount } = render(element);
      await expectNoA11yViolations(container);
      unmount();
    }
  });

  it('draws the disabled and invalid states on its root', () => {
    const { container, rerender } = render(<SearchField label="Search" defaultValue="a" isDisabled />);
    expect(root(container)).toHaveAttribute('data-disabled');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    rerender(<SearchField label="Search" defaultValue="a" isInvalid errorMessage="Too short" />);
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(screen.getByText('Too short')).toHaveClass('field-error');
    expect(screen.getByRole('searchbox')).toHaveAccessibleDescription('Too short');
  });

  it('requires an accessible name, and has no changed state, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a field with no label, aria-label or aria-labelledby has no name
    const nameless = <SearchField placeholder="Search" />;
    // @ts-expect-error a query is not saved data, so it is never changed
    const changed = <SearchField label="Search" isChanged />;
    const labelled = <SearchField label="Search" />;
    const byAriaLabel = <SearchField aria-label="Search" />;
    const byLabelledby = <SearchField aria-labelledby="heading" />;
    expect([nameless, changed, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });
});
