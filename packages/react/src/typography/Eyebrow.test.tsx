import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Eyebrow } from './Eyebrow';

describe('Eyebrow', () => {
  it('is a paragraph with the eyebrow class', () => {
    render(<Eyebrow>Components</Eyebrow>);
    const eyebrow = screen.getByText('Components');
    expect(eyebrow.tagName).toBe('P');
    expect(eyebrow).toHaveAttribute('class', 'eyebrow');
  });

  it.each(['p', 'span', 'div'] as const)('renders a %s element with as="%s"', (as) => {
    render(<Eyebrow as={as}>Components</Eyebrow>);
    expect(screen.getByText('Components').tagName).toBe(as.toUpperCase());
  });

  it('is a label and not a heading, so it never enters the page outline', () => {
    render(<Eyebrow>Components</Eyebrow>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('merges a custom className after the library class', () => {
    render(<Eyebrow className="extra">Components</Eyebrow>);
    expect(screen.getByText('Components')).toHaveAttribute('class', 'eyebrow extra');
  });

  it('forwards a ref to the element it renders', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Eyebrow as="span" ref={ref}>
        Components
      </Eyebrow>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes other attributes through and keeps nested elements', () => {
    render(
      <Eyebrow id="group" style={{ marginBottom: 18 }}>
        Docs <span data-testid="separator">/</span> Components
      </Eyebrow>,
    );
    const eyebrow = screen.getByText(/Docs/);
    expect(eyebrow).toHaveAttribute('id', 'group');
    expect(eyebrow).toHaveStyle({ marginBottom: '18px' });
    expect(screen.getByTestId('separator')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Eyebrow>Components</Eyebrow>);
    await expectNoA11yViolations(container);
  });
});
