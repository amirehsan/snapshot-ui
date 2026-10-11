import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Link } from './Link';

describe('Link', () => {
  it('is an anchor with the link class and its href', async () => {
    const { container } = render(<Link href="/guide">Read the guide</Link>);
    const link = screen.getByRole('link', { name: 'Read the guide' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/guide');
    expect(link).toHaveClass('link');
    await expectNoA11yViolations(container);
  });

  it('keeps target and rel, so a link can open a new tab safely', () => {
    render(
      <Link href="https://react-aria.adobe.com" target="_blank" rel="noopener noreferrer">
        React Aria
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'React Aria' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('fires onPress on Enter and on click, and not on Space', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Link href="#guide" onPress={onPress}>
        Read the guide
      </Link>,
    );
    const link = screen.getByRole('link');
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(1);
    await user.click(link);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('marks keyboard focus for the focus ring', async () => {
    const user = userEvent.setup();
    render(<Link href="#guide">Read the guide</Link>);
    const link = screen.getByRole('link');
    expect(link).not.toHaveAttribute('data-focus-visible');
    await user.tab();
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('data-focus-visible', 'true');
  });

  it('is inert when disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Link href="/guide" isDisabled onPress={onPress}>
        Read the guide
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Read the guide' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled', 'true');
    // Not an anchor, so there is nothing to follow.
    expect(link.tagName).toBe('SPAN');
    await user.click(link);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('forwards data attributes, so a link can carry its own theme', () => {
    render(
      <Link href="/guide" data-theme="dark">
        Read the guide
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-theme', 'dark');
  });

  it('merges a custom className', () => {
    render(
      <Link href="/guide" className="extra">
        Read the guide
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass('link', 'extra');
  });

  it('merges a function-form className with the base class', () => {
    render(
      <Link
        href="/guide"
        aria-current="page"
        className={({ isCurrent }) => (isCurrent ? 'is-current' : 'extra')}
      >
        Read the guide
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('link', 'is-current');
    expect(link).not.toHaveClass('extra');
  });

  it('forwards a ref to the anchor element', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link href="/guide" ref={ref}>
        Read the guide
      </Link>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});
