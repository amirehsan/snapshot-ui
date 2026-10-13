import { render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { Dialog as RACDialog, Heading, I18nProvider } from 'react-aria-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { isOutsideToastRegion, ModalFrame, type ModalFrameProps } from './ModalFrame';
import { openModals } from './useOverlayStack';

/** The scrim of the open frame at `index`, in the order they opened. */
function scrimAt(index = 0): HTMLElement {
  const scrim = document.querySelectorAll<HTMLElement>('.overlay-scrim')[index];
  if (!scrim) throw new Error(`No scrim at ${String(index)}`);
  return scrim;
}

/** The panel of the open frame at `index`, in the order they opened. */
function panelAt(index = 0): HTMLElement {
  const panel = document.querySelectorAll<HTMLElement>('.overlay-scrim > .overlay')[index];
  if (!panel) throw new Error(`No panel at ${String(index)}`);
  return panel;
}

/** A frame drawn as a dialog's, holding a React Aria dialog named `name`. */
function Frame({
  name = 'Rename the workspace',
  ...props
}: Partial<ModalFrameProps> & { name?: string }): ReactElement {
  return (
    <ModalFrame overlayClass="dialog-overlay" panelClass="dialog" {...props}>
      <RACDialog>
        <Heading slot="title">{name}</Heading>
      </RACDialog>
    </ModalFrame>
  );
}

describe('ModalFrame', () => {
  beforeEach(() => {
    // The stack is a module singleton, so each test starts from a page with no modal open.
    expect(openModals()).toEqual([]);
  });

  it('draws the scrim and the panel with the shared classes, the part classes and the caller classes, in order', () => {
    render(<Frame isOpen overlayClassName="extra" className="extra" />);
    expect(scrimAt().className).toBe('overlay-scrim dialog-overlay extra');
    expect(panelAt().className).toBe('overlay dialog extra');
    expect(panelAt().parentElement).toBe(scrimAt());
    expect(scrimAt().parentElement).toBe(document.body);
  });

  it('takes a render function for the panel class, merged after the library classes', () => {
    render(<Frame isOpen className={({ isExiting }) => (isExiting ? 'leaving' : 'here')} />);
    expect(panelAt().className).toBe('overlay dialog here');
  });

  it('puts the panel attributes on the panel and none on the scrim', () => {
    render(
      <Frame isOpen panelAttributes={{ 'data-size': 'lg', 'data-tone': 'danger', 'data-side': undefined }} />,
    );
    expect(panelAt()).toHaveAttribute('data-size', 'lg');
    expect(panelAt()).toHaveAttribute('data-tone', 'danger');
    expect(panelAt()).not.toHaveAttribute('data-side');
    expect(scrimAt()).not.toHaveAttribute('data-size');
  });

  it('gives the panel ref the panel', () => {
    const panelRef = createRef<HTMLDivElement>();
    render(<Frame isOpen panelRef={panelRef} />);
    expect(panelRef.current).toBe(panelAt());
  });

  it('sets the direction of the locale on the scrim', () => {
    const { unmount } = render(<Frame isOpen />);
    expect(scrimAt()).toHaveAttribute('dir', 'ltr');
    unmount();
    render(
      <I18nProvider locale="ar-EG">
        <Frame isOpen />
      </I18nProvider>,
    );
    expect(scrimAt()).toHaveAttribute('dir', 'rtl');
  });

  it('marks the scrim of a second open frame as stacked, so one scrim paints', () => {
    const { rerender } = render(<Frame isOpen name="First" />);
    rerender(
      <>
        <Frame isOpen name="First" />
        <Frame isOpen name="Second" />
      </>,
    );
    expect(openModals()).toHaveLength(2);
    expect(scrimAt(0)).not.toHaveAttribute('data-stacked');
    expect(scrimAt(1)).toHaveAttribute('data-stacked', '');
  });

  it('calls onUnmount once, after the overlay has closed and left the page', () => {
    const onUnmount = vi.fn();
    const { rerender } = render(<Frame isOpen onUnmount={onUnmount} />);
    expect(onUnmount).not.toHaveBeenCalled();
    rerender(<Frame isOpen={false} onUnmount={onUnmount} />);
    expect(document.querySelector('.overlay-scrim')).toBeNull();
    expect(onUnmount).toHaveBeenCalledTimes(1);
  });

  it('copies the theme of the focused trigger onto the panel, and nothing onto the scrim', () => {
    const page = (isOpen: boolean): ReactElement => (
      <>
        <div data-theme="dark" data-shape="soft">
          <button type="button">Open</button>
        </div>
        <Frame isOpen={isOpen} />
      </>
    );
    const { rerender } = render(page(false));
    screen.getByRole('button', { name: 'Open' }).focus();
    rerender(page(true));
    expect(panelAt()).toHaveAttribute('data-theme', 'dark');
    expect(panelAt()).toHaveAttribute('data-shape', 'soft');
    expect(scrimAt()).not.toHaveAttribute('data-theme');
    expect(scrimAt()).not.toHaveAttribute('data-shape');
  });

  it('has no axe violations with a dialog inside', async () => {
    render(<Frame isOpen />);
    expect(screen.getByRole('dialog', { name: 'Rename the workspace' })).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });
});

describe('isOutsideToastRegion', () => {
  it('keeps a press inside the toast region from closing a modal, and lets any other press close it', () => {
    const host = document.createElement('div');
    host.innerHTML =
      '<div class="toast-region"><div><button type="button">Undo</button></div></div><button type="button">Page</button>';
    const [undo, elsewhere] = host.querySelectorAll('button');
    if (!undo || !elsewhere) throw new Error('No buttons');
    expect(isOutsideToastRegion(undo)).toBe(false);
    expect(isOutsideToastRegion(elsewhere)).toBe(true);
    expect(isOutsideToastRegion(host)).toBe(true);
  });
});
