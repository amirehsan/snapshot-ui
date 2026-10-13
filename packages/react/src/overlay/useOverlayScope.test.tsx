import { render, screen } from '@testing-library/react';
import { useLayoutEffect, useRef, type ReactElement, type ReactPortal, type RefObject } from 'react';
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

/**
 * An overlay as the hook sees one: a component that stays mounted, as a Dialog does inside its trigger, and
 * a root it renders only while open, a div portaled to the body, which leaves every scope. The root starts
 * with a stale theme of its own, so a copy that removes it is seen to run.
 */
function Overlay({
  isOpen,
  originRef,
}: {
  isOpen: boolean;
  originRef?: RefObject<Element | null>;
}): ReactPortal | null {
  const scopeRef = useOverlayScope(originRef);
  return isOpen
    ? createPortal(<div ref={scopeRef} data-theme="stale" data-testid="overlay" />, document.body)
    : null;
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
      <Overlay isOpen={isOpen} originRef={withOriginRef ? triggerRef : undefined} />
    </>
  );
}

/**
 * A modal's shape: the hook's ref goes on a panel, and a component inside the panel runs a layout effect at
 * open. React attaches the panel's ref only after that effect, which is why the copy is a callback ref and
 * not an effect that reads a ref object. The child reports what it saw on the panel.
 */
function Panel({ seen }: { seen: (theme: string | null) => void }): ReactPortal {
  const scopeRef = useOverlayScope();
  return createPortal(
    <div ref={scopeRef} data-testid="overlay">
      <Inside seen={seen} />
    </div>,
    document.body,
  );
}

function Inside({ seen }: { seen: (theme: string | null) => void }): null {
  useLayoutEffect(() => {
    seen(document.querySelector('[data-testid="overlay"]')?.getAttribute('data-theme') ?? null);
  }, [seen]);
  return null;
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
  it('copies the scope of the focused trigger onto the portaled root when it attaches', () => {
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

  it('copies nothing when nothing is focused, and clears what the root had', () => {
    const { rerender } = render(<Page isOpen={false} />);
    expect(document.activeElement).toBe(document.body);
    rerender(<Page isOpen />);
    const overlay = screen.getByTestId('overlay');
    for (const name of SCOPE_ATTRIBUTES) expect(overlay, name).not.toHaveAttribute(name);
  });

  it('copies when the root attaches, so the copy is there for what the root holds, as a modal panel needs', () => {
    const outside = document.createElement('div');
    outside.setAttribute('data-theme', 'dark');
    const trigger = outside.appendChild(document.createElement('button'));
    document.body.append(outside);
    try {
      trigger.focus();
      const seen: (string | null)[] = [];
      const { unmount } = render(
        <Panel
          seen={(theme) => {
            seen.push(theme);
          }}
        />,
      );
      // The child's layout effect runs before the panel's ref attaches, so it sees no theme on the panel yet...
      expect(seen).toEqual([null]);
      // ...and the copy lands as the panel attaches, in the same commit.
      expect(screen.getByTestId('overlay')).toHaveAttribute('data-theme', 'dark');
      unmount();
    } finally {
      outside.remove();
    }
  });

  it('copies again each time the overlay opens, from what is focused then', () => {
    const { rerender } = render(<Page isOpen={false} />);
    screen.getByRole('button', { name: 'Open' }).focus();
    rerender(<Page isOpen />);
    expect(screen.getByTestId('overlay')).toHaveAttribute('data-theme', 'dark');
    rerender(<Page isOpen={false} />);
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    rerender(<Page isOpen />);
    expect(screen.getByTestId('overlay')).toHaveAttribute('data-theme', 'light');
    expect(screen.getByTestId('overlay')).toHaveAttribute('data-shape', 'square');
  });

  it('copies once while open, so a later move of focus leaves the open overlay as it was', () => {
    const { rerender } = render(<Page isOpen={false} />);
    screen.getByRole('button', { name: 'Open' }).focus();
    rerender(<Page isOpen />);
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    rerender(<Page isOpen />);
    expect(screen.getByTestId('overlay')).toHaveAttribute('data-theme', 'dark');
  });
});
