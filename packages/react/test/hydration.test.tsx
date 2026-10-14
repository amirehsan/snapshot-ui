import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumberField } from '../src/number-field';

/**
 * Each part's server HTML, hydrated in the browser on a mocked iPhone (plan, spec corrections 1 and 2). The HTML
 * is written with jsdom's own navigator, which is no phone, as a server's is none; the iPhone is read in the
 * hydration pass, where React Aria's platform checks run. React 19 recovers from a text mismatch through
 * onRecoverableError but only logs a differing attribute with console.error, so the test fails on either. From
 * the render after hydration each part shows React Aria's own text, which `after` checks.
 *
 * Each later part adds its rows to HYDRATED.
 */
const HYDRATED: [name: string, element: ReactElement, after: (container: HTMLElement) => void][] = [
  [
    'NumberField money',
    <NumberField label="Amount" money={{ symbol: '$' }} allowsNegative value={-123450} name="amount" />,
    (container) => {
      const input = container.querySelector('.number-field-input');
      expect(input).toHaveValue('-1,234.50');
      expect(input).toHaveAttribute('inputmode', 'decimal');
      expect(input).not.toHaveAttribute('aria-roledescription');
    },
  ],
  [
    'NumberField plain',
    <NumberField label="Guests" hasStepper value={2} />,
    (container) => {
      expect(container.querySelector('.number-field-input')).toHaveValue('2');
    },
  ],
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hydration', () => {
  it.each(HYDRATED)(
    'hydrates %s from its server HTML on a mocked iPhone with no mismatch, then draws React Aria text',
    (_name, element, after) => {
      const html = renderToString(element);
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.append(container);
      const consoleError = vi.spyOn(console, 'error');
      const recoverable = vi.fn();
      let root: Root | undefined;
      act(() => {
        root = hydrateRoot(container, element, { onRecoverableError: recoverable });
      });
      expect(recoverable).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      after(container);
      act(() => {
        root?.unmount();
      });
      container.remove();
    },
  );
});
