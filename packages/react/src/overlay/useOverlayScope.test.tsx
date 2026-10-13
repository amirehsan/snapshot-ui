import { render, screen } from '@testing-library/react';
import { useRef, type ReactElement, type ReactPortal, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { describe, expect, it } from 'vitest';
import { SCOPE_ATTRIBUTES, copyScope, useOverlayScope } from './useOverlayScope';

/** The element matching `selector` in a tree built from `html`, outside the document, as `closest` needs none. */
function inTree(html: string, selector: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  const found = host.querySelector(selector);
  if (!found) throw new Error(`No ${selector}`);
  return found;
}

/** An overlay's root as the hook sees one: a div portaled to the body, which leaves every scope. */
function Overlay({ originRef }: { originRef?: RefObject<Element | null> }): ReactPortal {
  const rootRef = useRef<HTMLDivElement>(null);
  useOverlayScope(rootRef, originRef);
  return createPortal(<div ref={rootRef} data-testid="overlay" />, document.body);
}

/**
 * A page with a trigger in a dark scope and another button in a light one. The overlay opens with the trigger
 * as its origin ref when `withOriginRef` is set, and with no ref, as a Dialog opens, otherwise.
 */
function Page({ isOpen, withOriginRef = false }: { isOpen: boolean; withOriginRef?: boolean }): ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <div data-theme="dark">
        <button ref={triggerRef} type="button">
          Open
        </button>
      </div>
      <div data-theme="light" data-shape="square">
        <button type="button">Elsewhere</button>
      </div>
      {isOpen && <Overlay originRef={withOriginRef ? triggerRef : undefined} />}
    </>
  );
}

describe('copyScope', () => {
  it('copies the theme, the shape and the density, in that order', () => {
    expect(SCOPE_ATTRIBUTES).toEqual(['data-theme', 'data-shape', 'data-density']);
  });

  it('copies all three from the nearest ancestors that carry them', () => {
    const origin = inTree(
      '<div data-theme="dark" data-shape="soft"><div data-density="compact"><button></button></div></div>',
      'button',
    );
    const root = document.createElement('div');
    copyScope(root, origin);
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root).toHaveAttribute('data-shape', 'soft');
    expect(root).toHaveAttribute('data-density', 'compact');
  });

  it('takes a nearer ancestor over a farther one', () => {
    const origin = inTree(
      '<div data-theme="dark" data-shape="soft"><div data-theme="light"><button></button></div></div>',
      'button',
    );
    const root = document.createElement('div');
    copyScope(root, origin);
    expect(root).toHaveAttribute('data-theme', 'light');
    expect(root).toHaveAttribute('data-shape', 'soft');
  });

  it('removes from the root an attribute no ancestor carries', () => {
    const origin = inTree('<div data-theme="dark"><button></button></div>', 'button');
    const root = document.createElement('div');
    root.setAttribute('data-shape', 'square');
    root.setAttribute('data-density', 'compact');
    copyScope(root, origin);
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root).not.toHaveAttribute('data-shape');
    expect(root).not.toHaveAttribute('data-density');
  });

  it('removes all three for no origin, which is the root theme', () => {
    const root = document.createElement('div');
    for (const name of SCOPE_ATTRIBUTES) root.setAttribute(name, 'x');
    copyScope(root, null);
    for (const name of SCOPE_ATTRIBUTES) expect(root, name).not.toHaveAttribute(name);
  });
});

describe('useOverlayScope', () => {
  it('copies the scope of the focused trigger onto the portaled root when it mounts', () => {
    const { rerender } = render(<Page isOpen={false} />);
    screen.getByRole('button', { name: 'Open' }).focus();
    rerender(<Page isOpen />);
    const overlay = screen.getByTestId('overlay');
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveAttribute('data-theme', 'dark');
    expect(overlay).not.toHaveAttribute('data-shape');
  });

  it('reads the origin ref over the focused element when it is given one', () => {
    const { rerender } = render(<Page isOpen={false} withOriginRef />);
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    rerender(<Page isOpen withOriginRef />);
    const overlay = screen.getByTestId('overlay');
    expect(overlay).toHaveAttribute('data-theme', 'dark');
    expect(overlay).not.toHaveAttribute('data-shape');
  });

  it('copies nothing when nothing is focused', () => {
    const { rerender } = render(<Page isOpen={false} />);
    expect(document.activeElement).toBe(document.body);
    rerender(<Page isOpen />);
    const overlay = screen.getByTestId('overlay');
    for (const name of SCOPE_ATTRIBUTES) expect(overlay, name).not.toHaveAttribute(name);
  });

  it('copies once, at mount, so a later move of focus leaves the open overlay as it was', () => {
    const { rerender } = render(<Page isOpen={false} />);
    screen.getByRole('button', { name: 'Open' }).focus();
    rerender(<Page isOpen />);
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    rerender(<Page isOpen />);
    expect(screen.getByTestId('overlay')).toHaveAttribute('data-theme', 'dark');
  });
});
