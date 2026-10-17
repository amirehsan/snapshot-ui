import { act, render } from '@testing-library/react';
import { useRef, type ReactElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBottomBarOffset } from './useBottomBarOffset';

/** A ResizeObserver whose callback the test calls, standing in for the browser's. */
function stubResizeObserver(): { observed: Element[]; report: (target: Element, blockSize: number) => void } {
  const observed: Element[] = [];
  let callback: ResizeObserverCallback | undefined;
  class Stub {
    constructor(each: ResizeObserverCallback) {
      callback = each;
    }
    observe = (target: Element): void => {
      observed.push(target);
    };
    unobserve = (): void => undefined;
    disconnect = (): void => {
      observed.length = 0;
    };
  }
  vi.stubGlobal('ResizeObserver', Stub);
  return {
    observed,
    report: (target, blockSize) => {
      const entry = {
        target,
        borderBoxSize: [{ blockSize, inlineSize: 600 }],
        contentRect: { height: blockSize },
      };
      act(() => {
        callback?.([entry] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      });
    },
  };
}

/** A bar that writes its offset, optionally inside a stand-in shell. */
function Bar(): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useBottomBarOffset(ref);
  return <div ref={ref} className="bar" />;
}

function Shell({ children }: { children: ReactNode }): ReactElement {
  return <div className="app-shell">{children}</div>;
}

const root = (): CSSStyleDeclaration => document.documentElement.style;

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty('--save-bar-offset');
});

describe('useBottomBarOffset', () => {
  it('writes the measured height and the inset on the root and the closest shell, and removes both on unmount', () => {
    const { observed, report } = stubResizeObserver();
    const { container, unmount } = render(
      <Shell>
        <Bar />
      </Shell>,
    );
    const bar = container.querySelector('.bar');
    const shell = container.querySelector<HTMLElement>('.app-shell');
    if (!bar || !shell) throw new Error('No bar');
    expect(observed).toEqual([bar]);
    // Nothing is written before the first measurement: the stylesheet's token value holds until then.
    expect(root().getPropertyValue('--save-bar-offset')).toBe('');
    report(bar, 74);
    expect(root().getPropertyValue('--save-bar-offset')).toBe('calc(74px + var(--spacing-inset))');
    expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('calc(74px + var(--spacing-inset))');
    report(bar, 118.5);
    expect(root().getPropertyValue('--save-bar-offset')).toBe('calc(118.5px + var(--spacing-inset))');
    unmount();
    expect(root().getPropertyValue('--save-bar-offset')).toBe('');
    expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('');
  });

  it('writes on the root alone outside a shell', () => {
    const { report } = stubResizeObserver();
    const { container, unmount } = render(<Bar />);
    const bar = container.querySelector('.bar');
    if (!bar) throw new Error('No bar');
    report(bar, 58);
    expect(root().getPropertyValue('--save-bar-offset')).toBe('calc(58px + var(--spacing-inset))');
    unmount();
    expect(root().getPropertyValue('--save-bar-offset')).toBe('');
  });

  it('removes the offset while the bar measures nothing, as a hidden one does', () => {
    const { report } = stubResizeObserver();
    const { container } = render(<Bar />);
    const bar = container.querySelector('.bar');
    if (!bar) throw new Error('No bar');
    report(bar, 58);
    report(bar, 0);
    expect(root().getPropertyValue('--save-bar-offset')).toBe('');
  });

  it('measures nothing on the server or without ResizeObserver', () => {
    expect(renderToString(<Bar />)).toBe('<div class="bar"></div>');
    vi.stubGlobal('ResizeObserver', undefined);
    const { unmount } = render(<Bar />);
    expect(root().getPropertyValue('--save-bar-offset')).toBe('');
    unmount();
  });
});
