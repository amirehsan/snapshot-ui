import { render, screen } from '@testing-library/react';
import { StrictMode, useRef, type ReactElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { isAnotherModalOpen, openModals, useOverlayStack } from './useOverlayStack';

/**
 * A modal overlay as the stack sees one: a scrim, found by the member's id, that shows whether the hook
 * called it the bottom-most.
 */
function Member({ id, isOpen = true }: { id: string; isOpen?: boolean }): ReactElement {
  const scrimRef = useRef<HTMLDivElement>(null);
  const isBottom = useOverlayStack(id, isOpen, scrimRef);
  return <div ref={scrimRef} data-testid={id} data-bottom={isBottom} />;
}

/** The members with these ids, opened in this order, each keyed by its id so it keeps its place. */
function Members({ ids }: { ids: string[] }): ReactElement {
  return (
    <>
      {ids.map((id) => (
        <Member key={id} id={id} />
      ))}
    </>
  );
}

describe('useOverlayStack', () => {
  beforeEach(() => {
    // The stack is a module singleton, so each test starts from a page with no modal open.
    expect(openModals()).toEqual([]);
  });

  it('makes the one open overlay the bottom-most, which paints its scrim', () => {
    render(<Members ids={['a']} />);
    const scrim = screen.getByTestId('a');
    expect(scrim).toHaveAttribute('data-bottom', 'true');
    expect(scrim).not.toHaveAttribute('data-stacked');
    expect(openModals()).toEqual(['a']);
  });

  it('marks every overlay opened over it as stacked, so one scrim paints', () => {
    render(<Members ids={['a', 'b']} />);
    expect(screen.getByTestId('a')).not.toHaveAttribute('data-stacked');
    const second = screen.getByTestId('b');
    expect(second).toHaveAttribute('data-bottom', 'false');
    expect(second).toHaveAttribute('data-stacked', '');
    expect(openModals()).toEqual(['a', 'b']);
  });

  it('promotes the next overlay when the bottom-most closes, and it paints the scrim', () => {
    const { rerender } = render(<Members ids={['a', 'b']} />);
    rerender(<Members ids={['b']} />);
    const second = screen.getByTestId('b');
    expect(second).toHaveAttribute('data-bottom', 'true');
    expect(second).not.toHaveAttribute('data-stacked');
    expect(openModals()).toEqual(['b']);
  });

  it('registers nothing for an overlay that is not open', () => {
    render(<Member id="a" isOpen={false} />);
    expect(openModals()).toEqual([]);
    expect(screen.getByTestId('a')).not.toHaveAttribute('data-stacked');
  });

  it('leaves the stack when the overlay starts to close, before it unmounts', () => {
    const { rerender } = render(<Member id="a" />);
    rerender(<Member id="a" isOpen={false} />);
    expect(openModals()).toEqual([]);
  });

  it('tells whether a modal other than the one asking is open', () => {
    expect(isAnotherModalOpen()).toBe(false);
    const { rerender } = render(<Members ids={['a']} />);
    expect(isAnotherModalOpen('a')).toBe(false);
    expect(isAnotherModalOpen()).toBe(true);
    rerender(<Members ids={['a', 'b']} />);
    expect(isAnotherModalOpen('a')).toBe(true);
    expect(isAnotherModalOpen('b')).toBe(true);
  });

  it('is empty once every overlay unmounts', () => {
    const { unmount } = render(<Members ids={['a', 'b']} />);
    unmount();
    expect(openModals()).toEqual([]);
    expect(isAnotherModalOpen()).toBe(false);
  });

  it('keeps one entry per overlay under Strict Mode, which runs each effect twice, and none after', () => {
    const { unmount } = render(
      <StrictMode>
        <Members ids={['a', 'b']} />
      </StrictMode>,
    );
    expect(openModals()).toEqual(['a', 'b']);
    expect(screen.getByTestId('a')).not.toHaveAttribute('data-stacked');
    expect(screen.getByTestId('b')).toHaveAttribute('data-stacked', '');
    unmount();
    expect(openModals()).toEqual([]);
  });
});
