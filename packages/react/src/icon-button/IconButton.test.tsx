import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from 'lucide-react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders a ghost button by default', async () => {
    const { container } = render(
      <IconButton aria-label="Search">
        <Search />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveClass('icon-button');
    expect(button).not.toHaveClass('icon-button-outline');
    await expectNoA11yViolations(container);
  });

  it('renders the outline variant class', () => {
    render(
      <IconButton aria-label="Search" variant="outline">
        <Search />
      </IconButton>,
    );
    expect(screen.getByRole('button')).toHaveClass('icon-button', 'icon-button-outline');
  });

  it('renders a link with the same classes when given an href', async () => {
    const { container } = render(
      <IconButton aria-label="Search" href="#search" variant="outline">
        <Search />
      </IconButton>,
    );
    const link = screen.getByRole('link', { name: 'Search' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '#search');
    expect(link).toHaveClass('icon-button', 'icon-button-outline');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('is named by aria-labelledby when there is no label', () => {
    render(
      <>
        <span id="search-name">Search the docs</span>
        <IconButton aria-labelledby="search-name">
          <Search />
        </IconButton>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Search the docs' })).toBeInTheDocument();
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error an icon has no text, so the button needs aria-label or aria-labelledby
    const button = <IconButton>icon</IconButton>;
    // @ts-expect-error the link form needs a name as well
    const link = <IconButton href="#search">icon</IconButton>;
    const labelled = <IconButton aria-labelledby="name">icon</IconButton>;
    expect([button, link, labelled]).toHaveLength(3);
  });

  it('hides the icon from assistive technology', () => {
    // An icon that is exposed to assistive technology on its own: a bare svg with a role and a name,
    // and no `aria-hidden`. Only the wrapper can hide it, so the test fails if the wrapper stops.
    const { container } = render(
      <IconButton aria-label="Search">
        <svg role="img" aria-label="Magnifier" viewBox="0 0 24 24" />
      </IconButton>,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).not.toHaveAttribute('aria-hidden');
    expect(container.querySelector('.icon-button-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAccessibleName('Search');
  });

  it('fires onPress on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <IconButton aria-label="Search" onPress={onPress}>
        <Search />
      </IconButton>,
    );
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('fires onPress on a link with Enter', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <IconButton aria-label="Search" href="#search" onPress={onPress}>
        <Search />
      </IconButton>,
    );
    await user.tab();
    expect(screen.getByRole('link')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <IconButton aria-label="Search" isDisabled onPress={onPress}>
        <Search />
      </IconButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('marks a disabled link, skips it in the tab order and does not fire onPress', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(
      <IconButton aria-label="Search" href="#search" isDisabled onPress={onPress}>
        <Search />
      </IconButton>,
    );
    const link = screen.getByRole('link', { name: 'Search' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled', 'true');
    await user.tab();
    expect(link).not.toHaveFocus();
    await user.click(link);
    expect(onPress).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
  });

  it('does not submit the form it sits in', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <IconButton aria-label="Search">
          <Search />
        </IconButton>
      </form>,
    );
    await user.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('passes the disclosure attributes a menu button needs', () => {
    render(
      <IconButton aria-label="Open the menu" aria-expanded={false} aria-controls="rail">
        <Search />
      </IconButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'rail');
  });

  it('forwards data attributes, so a button can carry its own theme', () => {
    render(
      <IconButton aria-label="Search" data-theme="dark">
        <Search />
      </IconButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-theme', 'dark');
  });

  it('forwards a ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton aria-label="Search" ref={ref}>
        <Search />
      </IconButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('forwards a ref to the anchor element', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <IconButton aria-label="Search" href="#search" ref={ref}>
        <Search />
      </IconButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('merges a custom className', () => {
    render(
      <IconButton aria-label="Search" className="extra">
        <Search />
      </IconButton>,
    );
    expect(screen.getByRole('button')).toHaveClass('icon-button', 'extra');
  });

  it('merges a function-form className with the base classes', () => {
    render(
      <IconButton aria-label="Search" className={({ isPressed }) => (isPressed ? 'is-pressed' : 'extra')}>
        <Search />
      </IconButton>,
    );
    expect(screen.getByRole('button')).toHaveClass('icon-button', 'extra');
  });

  it('merges a function-form className on the link form', () => {
    render(
      <IconButton
        aria-label="Search"
        href="#search"
        className={({ isPressed }) => (isPressed ? 'is-pressed' : 'extra')}
      >
        <Search />
      </IconButton>,
    );
    expect(screen.getByRole('link')).toHaveClass('icon-button', 'extra');
  });
});
