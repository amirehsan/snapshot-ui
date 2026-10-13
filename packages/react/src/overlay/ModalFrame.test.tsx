import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode, useLayoutEffect, useRef, type ReactElement } from 'react';
import {
  Button as RACButton,
  Dialog as RACDialog,
  DialogTrigger,
  Heading,
  I18nProvider,
} from 'react-aria-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { holdFrames } from '../../test/dom';
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

/** A frame open on the page, with a trigger inside its dialog that opens a second frame over it. */
function Stacked(): ReactElement {
  return (
    <ModalFrame overlayClass="dialog-overlay" panelClass="dialog" defaultOpen>
      <RACDialog>
        <Heading slot="title">Rename the workspace</Heading>
        <DialogTrigger>
          <RACButton>Discard</RACButton>
          <Frame name="Discard the new name?" />
        </DialogTrigger>
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

  it('gives focus back to its trigger in a dialog under it as it leaves, so that dialog cannot take it', async () => {
    const user = userEvent.setup();
    // Every frame held back, as on a loaded machine whose next frame comes late. React Aria gives focus back
    // in a frame, and until then focus would rest on the body, where the dialog under it takes it 500ms after
    // it opened.
    holdFrames();
    render(<Stacked />);
    const trigger = screen.getByRole('button', { name: 'Discard' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Discard the new name?' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Discard the new name?' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(trigger).toHaveFocus();
  });

  it('gives focus back to that trigger under Strict Mode too, which reads what held focus once as it opens', async () => {
    // Strict Mode runs the panel's effects again as it mounts, once its dialog has taken focus. Read then,
    // what held focus would be the dialog, which leaves with the panel.
    const user = userEvent.setup();
    holdFrames();
    render(
      <StrictMode>
        <Stacked />
      </StrictMode>,
    );
    const trigger = screen.getByRole('button', { name: 'Discard' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Discard the new name?' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Discard the new name?' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
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

  it('copies the theme of the trigger even when the content takes focus as it mounts', () => {
    // A field that focuses itself in a layout effect, which is when React focuses a native autoFocus: before
    // the panel around it attaches, so by then the trigger no longer holds focus.
    function TakesFocus(): ReactElement {
      const ref = useRef<HTMLInputElement>(null);
      useLayoutEffect(() => {
        ref.current?.focus();
      }, []);
      return <input ref={ref} aria-label="Workspace name" />;
    }
    const page = (isOpen: boolean): ReactElement => (
      <>
        <div data-theme="dark" data-density="compact">
          <button type="button">Open</button>
        </div>
        <ModalFrame overlayClass="dialog-overlay" panelClass="dialog" isOpen={isOpen}>
          <RACDialog>
            <Heading slot="title">Rename the workspace</Heading>
            <TakesFocus />
          </RACDialog>
        </ModalFrame>
      </>
    );
    const { rerender } = render(page(false));
    screen.getByRole('button', { name: 'Open' }).focus();
    rerender(page(true));
    expect(screen.getByRole('textbox', { name: 'Workspace name' })).toHaveFocus();
    expect(panelAt()).toHaveAttribute('data-theme', 'dark');
    expect(panelAt()).toHaveAttribute('data-density', 'compact');
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
