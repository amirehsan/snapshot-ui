import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is an indeterminate progress bar named Loading by default', async () => {
    const { container } = render(<Spinner />);
    const spinner = screen.getByRole('progressbar', { name: 'Loading' });
    expect(spinner).not.toHaveAttribute('aria-valuenow');
    expect(spinner).toHaveClass('spinner');
    await expectNoA11yViolations(container);
  });

  it('takes a custom accessible name', () => {
    render(<Spinner aria-label="Saving changes" />);
    expect(screen.getByRole('progressbar', { name: 'Saving changes' })).toBeInTheDocument();
  });

  it.each([
    ['inline', 'spinner'],
    ['md', 'spinner spinner-md'],
    ['lg', 'spinner spinner-lg'],
  ] as const)('size %s renders class "%s"', (size, expected) => {
    render(<Spinner size={size} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('class', expected);
  });

  it('hides its drawing from assistive technology', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges a custom className', () => {
    render(<Spinner className="extra" />);
    expect(screen.getByRole('progressbar')).toHaveClass('spinner', 'extra');
  });
});
