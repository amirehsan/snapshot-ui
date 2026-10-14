import { act, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useHydrated } from './useHydrated';

describe('useHydrated', () => {
  it('is false on the server and through hydration, and true from the render after', () => {
    const seen: boolean[] = [];
    function Probe(): ReactElement {
      const hydrated = useHydrated();
      seen.push(hydrated);
      return <output>{hydrated ? 'browser' : 'server'}</output>;
    }
    const html = renderToString(<Probe />);
    expect(seen).toEqual([false]);
    expect(html).toContain('server');

    seen.length = 0;
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, <Probe />);
    });
    // The hydration pass renders the server's value, so nothing mismatches; React then renders again.
    expect(seen[0]).toBe(false);
    expect(seen.at(-1)).toBe(true);
    expect(container).toHaveTextContent('browser');
    act(() => {
      root?.unmount();
    });
    container.remove();
  });

  it('is true from the first render of a part first rendered in the browser', () => {
    const seen: boolean[] = [];
    function Probe(): ReactElement {
      seen.push(useHydrated());
      return <output />;
    }
    render(<Probe />);
    expect(seen).not.toContain(false);
  });
});
