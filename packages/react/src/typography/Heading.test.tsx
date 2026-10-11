import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Heading, type HeadingLevel } from './Heading';

const STEPS = [1, 2, 3, 4] as const satisfies readonly HeadingLevel[];
const PAIRS = STEPS.flatMap((level) => STEPS.map((size) => [level, size] as const));

describe('Heading', () => {
  it('is a level 2 heading in the section step by default', () => {
    render(<Heading>Notifications</Heading>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Notifications' });
    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveAttribute('class', 'heading heading-2');
  });

  it.each(PAIRS)('level %i drawn in size %i', (level, size) => {
    render(
      <Heading level={level} size={size}>
        Title
      </Heading>,
    );
    const heading = screen.getByRole('heading', { level });
    expect(heading.tagName).toBe(`H${level}`);
    expect(heading).toHaveAttribute('class', `heading heading-${size}`);
  });

  it.each(STEPS)('draws level %i in its own size when no size is given', (level) => {
    render(<Heading level={level}>Title</Heading>);
    expect(screen.getByRole('heading', { level })).toHaveAttribute('class', `heading heading-${level}`);
  });

  it('merges a custom className after the library classes', () => {
    render(<Heading className="extra">Title</Heading>);
    expect(screen.getByRole('heading')).toHaveAttribute('class', 'heading heading-2 extra');
  });

  it('forwards a ref to the heading element', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading level={3} ref={ref}>
        Title
      </Heading>,
    );
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(ref.current?.tagName).toBe('H3');
  });

  it('passes other attributes through, so a heading can be a link target or carry its own theme', () => {
    render(
      <Heading id="notifications" data-theme="dark" aria-describedby="note">
        Title
      </Heading>,
    );
    const heading = screen.getByRole('heading');
    expect(heading).toHaveAttribute('id', 'notifications');
    expect(heading).toHaveAttribute('data-theme', 'dark');
    expect(heading).toHaveAttribute('aria-describedby', 'note');
  });

  it('has no axe violations in an outline whose looks differ from its levels', async () => {
    const { container } = render(
      <main>
        <Heading level={1} size={2}>
          Settings
        </Heading>
        <Heading level={2} size={3}>
          Notifications
        </Heading>
        <Heading level={3} size={4}>
          Email
        </Heading>
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});
