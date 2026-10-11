import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('is a kbd element with the kbd class, read by assistive technology', async () => {
    const { container } = render(<Kbd>&#8984;K</Kbd>);
    const key = screen.getByText('\u2318K');
    expect(key.tagName).toBe('KBD');
    expect(key).toHaveClass('kbd');
    expect(key).not.toHaveAttribute('aria-hidden');
    await expectNoA11yViolations(container);
  });

  it('forwards the native attributes of an element', () => {
    render(
      <Kbd id="search-key" title="Search" aria-hidden="true" style={{ marginRight: 6 }}>
        esc
      </Kbd>,
    );
    const key = screen.getByText('esc');
    expect(key).toHaveAttribute('id', 'search-key');
    expect(key).toHaveAttribute('title', 'Search');
    expect(key).toHaveAttribute('aria-hidden', 'true');
    expect(key).toHaveStyle({ marginRight: '6px' });
  });

  it('merges a custom className after its own', () => {
    render(<Kbd className="extra">esc</Kbd>);
    expect(screen.getByText('esc')).toHaveAttribute('class', 'kbd extra');
  });

  it('forwards a ref to the kbd element', () => {
    const ref = createRef<HTMLElement>();
    render(<Kbd ref={ref}>esc</Kbd>);
    expect(ref.current?.tagName).toBe('KBD');
  });
});
