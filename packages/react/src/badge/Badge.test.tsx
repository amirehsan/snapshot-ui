import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Badge } from './Badge';

/** The badge around a label, found by the label's text. */
const badgeOf = (text: string): HTMLElement => {
  const badge = screen.getByText(text).closest<HTMLElement>('.badge');
  if (!badge) throw new Error(`No badge around ${text}`);
  return badge;
};

describe('Badge', () => {
  it('sets its label in a badge-label, the part that caps what a long word asks of its holder', () => {
    render(<Badge tone="info">New</Badge>);
    const label = screen.getByText('New');
    expect(label.tagName).toBe('SPAN');
    expect(label).toHaveAttribute('class', 'badge-label');
    expect(label.parentElement).toBe(badgeOf('New'));
    expect(badgeOf('New').childNodes).toHaveLength(1);
  });

  it('is a span, and neutral is the base class alone', async () => {
    const { container } = render(<Badge>Beta</Badge>);
    const badge = badgeOf('Beta');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveAttribute('class', 'badge');
    await expectNoA11yViolations(container);
  });

  it('renders neutral when asked for it, with no tone class', () => {
    render(<Badge tone="neutral">Beta</Badge>);
    expect(badgeOf('Beta')).toHaveAttribute('class', 'badge');
  });

  it.each(['info', 'success', 'warning', 'error'] as const)('renders the %s tone class', async (tone) => {
    const { container } = render(<Badge tone={tone}>{tone}</Badge>);
    expect(badgeOf(tone)).toHaveAttribute('class', `badge badge-${tone}`);
    await expectNoA11yViolations(container);
  });

  it('shows a count as plain text', () => {
    render(<Badge>12</Badge>);
    expect(badgeOf('12')).toHaveClass('badge');
  });

  it('forwards the native attributes of an element', () => {
    render(
      <Badge title="Unread" data-theme="dark">
        New
      </Badge>,
    );
    const badge = badgeOf('New');
    expect(badge).toHaveAttribute('title', 'Unread');
    expect(badge).toHaveAttribute('data-theme', 'dark');
  });

  it('merges a custom className after the tone class', () => {
    render(
      <Badge tone="error" className="extra">
        Failed
      </Badge>,
    );
    expect(badgeOf('Failed')).toHaveAttribute('class', 'badge badge-error extra');
  });

  it('forwards a ref to the span element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>Beta</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
