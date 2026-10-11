import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from './a11y';

describe('expectNoA11yViolations', () => {
  it('fails on an image without alt text', async () => {
    // eslint-disable-next-line jsx-a11y/alt-text -- the violation under test
    const { container } = render(<img src="x.png" />);
    await expect(expectNoA11yViolations(container)).rejects.toThrow(/image-alt/);
  });

  it('passes on accessible markup', async () => {
    const { container } = render(<img src="x.png" alt="A cat" />);
    await expectNoA11yViolations(container);
  });
});
