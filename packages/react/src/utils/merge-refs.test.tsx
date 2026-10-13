import { render, screen } from '@testing-library/react';
import { createRef, useEffect, useRef, type ReactElement, type Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mergeRefs } from './merge-refs';

describe('mergeRefs', () => {
  it('gives an object ref and a callback ref the element on render, and null on unmount', () => {
    const object = createRef<HTMLDivElement>();
    const callback = vi.fn<(element: HTMLDivElement | null) => void>();
    const { unmount } = render(<div ref={mergeRefs(object, callback)} data-testid="target" />);
    const target = screen.getByTestId('target');
    expect(object.current).toBe(target);
    expect(callback).toHaveBeenCalledExactlyOnceWith(target);
    unmount();
    expect(object.current).toBeNull();
    expect(callback).toHaveBeenLastCalledWith(null);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('runs the cleanup a callback ref returns once on unmount, and never calls it with null', () => {
    const cleanup = vi.fn<() => void>();
    const callback = vi.fn<(element: HTMLDivElement | null) => () => void>(() => cleanup);
    const { unmount } = render(<div ref={mergeRefs(callback)} data-testid="target" />);
    expect(callback).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('target'));
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(callback).not.toHaveBeenCalledWith(null);
  });

  it('skips the refs it is given as undefined', () => {
    const object = createRef<HTMLDivElement>();
    const { unmount } = render(<div ref={mergeRefs(undefined, object, undefined)} data-testid="target" />);
    expect(object.current).toBe(screen.getByTestId('target'));
    unmount();
    expect(object.current).toBeNull();
  });

  it('detaches on a call with null as it does on cleanup', () => {
    const element = document.createElement('div');
    const object = createRef<HTMLDivElement>();
    const plain = vi.fn<(element: HTMLDivElement | null) => void>();
    const cleanup = vi.fn<() => void>();
    const withCleanup = vi.fn<(element: HTMLDivElement | null) => () => void>(() => cleanup);
    const merged = mergeRefs<HTMLDivElement>(object, plain, withCleanup);
    merged(element);
    expect(object.current).toBe(element);
    merged(null);
    expect(object.current).toBeNull();
    expect(plain).toHaveBeenLastCalledWith(null);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(withCleanup).toHaveBeenCalledExactlyOnceWith(element);
  });

  it('is a ref a component can put on its own element beside the one it was given', () => {
    function Probe({ forwarded }: { forwarded: Ref<HTMLDivElement> }): ReactElement {
      const own = useRef<HTMLDivElement>(null);
      useEffect(() => {
        own.current?.setAttribute('data-own', '');
      }, []);
      return <div ref={mergeRefs(own, forwarded)} data-testid="probe" />;
    }
    const forwarded = createRef<HTMLDivElement>();
    render(<Probe forwarded={forwarded} />);
    const probe = screen.getByTestId('probe');
    expect(forwarded.current).toBe(probe);
    expect(probe).toHaveAttribute('data-own');
  });
});
