import { act, render } from '@testing-library/react';
import { useRef, type ReactElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBottomBarOffset } from './useBottomBarOffset';

/** A ResizeObserver whose callbacks the test calls, one per observed bar, standing in for the browser's. */
function stubResizeObserver(): { observed: Element[]; report: (target: Element, blockSize: number) => void } {
  const observed: Element[] = [];
  const callbacks = new Map<Element, ResizeObserverCallback>();
  class Stub {
    private readonly each: ResizeObserverCallback;
    private readonly targets: Element[] = [];
    constructor(each: ResizeObserverCallback) {
      this.each = each;
    }
    observe = (target: Element): void => {
      observed.push(target);
      this.targets.push(target);
      callbacks.set(target, this.each);
    };
    unobserve = (): void => undefined;
    disconnect = (): void => {
      for (const target of this.targets) {
        callbacks.delete(target);
        observed.splice(observed.indexOf(target), 1);
      }
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
        callbacks.get(target)?.([entry] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      });
    },
  };
}

/** A bar that writes its offset, optionally inside a stand-in shell. */
function Bar({ name = 'bar' }: { name?: string }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useBottomBarOffset(ref);
  return <div ref={ref} className={name} />;
}

function Shell({ children }: { children: ReactNode }): ReactElement {
  return <div className="app-shell">{children}</div>;
}

/** The offset written inline on the root. */
const written = (): string => document.documentElement.style.getPropertyValue('--save-bar-offset');

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
    expect(written()).toBe('');
    report(bar, 74);
    expect(written()).toBe('calc(74px + var(--spacing-inset))');
    expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('calc(74px + var(--spacing-inset))');
    report(bar, 118.5);
    expect(written()).toBe('calc(118.5px + var(--spacing-inset))');
    unmount();
    expect(written()).toBe('');
    expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('');
  });

  it('writes on the root alone outside a shell', () => {
    const { report } = stubResizeObserver();
    const { container, unmount } = render(<Bar />);
    const bar = container.querySelector('.bar');
    if (!bar) throw new Error('No bar');
    report(bar, 58);
    expect(written()).toBe('calc(58px + var(--spacing-inset))');
    unmount();
    expect(written()).toBe('');
  });

  it('writes 0px while the bar measures nothing, as a hidden one does, so the token value lifts nothing', () => {
    const { report } = stubResizeObserver();
    const { container, unmount } = render(<Bar />);
    const bar = container.querySelector('.bar');
    if (!bar) throw new Error('No bar');
    report(bar, 58);
    report(bar, 0);
    expect(written()).toBe('0px');
    report(bar, 58);
    expect(written()).toBe('calc(58px + var(--spacing-inset))');
    unmount();
    expect(written()).toBe('');
  });

  it.each([
    ['the taller leaves first', 'tall'],
    ['the shorter leaves first', 'short'],
  ])('keeps the taller of two bars, and the other once one unmounts: %s', (_, first) => {
    const { report } = stubResizeObserver();
    function Page({ tall, short }: { tall: boolean; short: boolean }): ReactElement {
      return (
        <Shell>
          {short ? <Bar name="short" /> : null}
          {tall ? <Bar name="tall" /> : null}
        </Shell>
      );
    }
    const { container, rerender, unmount } = render(<Page tall short />);
    const shell = container.querySelector<HTMLElement>('.app-shell');
    const [short, tall] = ['.short', '.tall'].map((selector) => container.querySelector(selector));
    if (!shell || !short || !tall) throw new Error('No bars');
    report(short, 58);
    report(tall, 120);
    // The shorter bar measuring again never writes its height over the taller one's.
    report(short, 60);
    expect(written()).toBe('calc(120px + var(--spacing-inset))');
    expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('calc(120px + var(--spacing-inset))');
    if (first === 'tall') {
      rerender(<Page tall={false} short />);
      expect(written()).toBe('calc(60px + var(--spacing-inset))');
      expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('calc(60px + var(--spacing-inset))');
    } else {
      rerender(<Page tall short={false} />);
      expect(written()).toBe('calc(120px + var(--spacing-inset))');
      expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('calc(120px + var(--spacing-inset))');
    }
    unmount();
    expect(written()).toBe('');
    expect(shell.style.getPropertyValue('--save-bar-offset')).toBe('');
  });

  it('keeps the visible bar while another one hides, and 0px only once both measure nothing', () => {
    const { report } = stubResizeObserver();
    const { container } = render(
      <>
        <Bar name="first" />
        <Bar name="second" />
      </>,
    );
    const [first, second] = ['.first', '.second'].map((selector) => container.querySelector(selector));
    if (!first || !second) throw new Error('No bars');
    report(first, 58);
    report(second, 0);
    expect(written()).toBe('calc(58px + var(--spacing-inset))');
    report(first, 0);
    expect(written()).toBe('0px');
  });

  it("keeps a measured bar's height when a bar that never measured unmounts", () => {
    const { report } = stubResizeObserver();
    function Page({ second }: { second: boolean }): ReactElement {
      return (
        <>
          <Bar name="first" />
          {second ? <Bar name="second" /> : null}
        </>
      );
    }
    const { container, rerender, unmount } = render(<Page second />);
    const first = container.querySelector('.first');
    if (!first) throw new Error('No bar');
    report(first, 58);
    rerender(<Page second={false} />);
    expect(written()).toBe('calc(58px + var(--spacing-inset))');
    unmount();
    expect(written()).toBe('');
  });

  it('measures nothing on the server or without ResizeObserver', () => {
    expect(renderToString(<Bar />)).toBe('<div class="bar"></div>');
    vi.stubGlobal('ResizeObserver', undefined);
    const { unmount } = render(<Bar />);
    expect(written()).toBe('');
    unmount();
  });
});
