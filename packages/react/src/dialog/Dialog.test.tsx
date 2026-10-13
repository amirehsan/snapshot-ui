import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil, TriangleAlert } from 'lucide-react';
import { createRef, useId, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { holdFrames } from '../../test/dom';
import * as library from '../index';
import { Button } from '../button';
import { TextField } from '../text-field';
import { openModals } from '../overlay/useOverlayStack';
import { Dialog, DialogActions, DialogBody, DialogTrigger, type DialogProps } from './Dialog';

/** The open dialog's scrim, which React Aria portals to the body. */
function scrim(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.dialog-overlay');
  if (!element) throw new Error('No scrim');
  return element;
}

/** The open dialog's panel. */
function panel(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.dialog');
  if (!element) throw new Error('No panel');
  return element;
}

/** An open dialog with a title, and whatever else the test gives it. */
function open(props: Partial<DialogProps> = {}): ReturnType<typeof render> {
  return render(<Dialog isOpen title="Rename the workspace" {...props} />);
}

/** A trigger and its dialog, closed until the trigger is pressed. */
function Triggered(props: Partial<DialogProps>): ReactElement {
  return (
    <DialogTrigger>
      <Button>Rename</Button>
      <Dialog title="Rename the workspace" {...props} />
    </DialogTrigger>
  );
}

describe('Dialog', () => {
  it('is a dialog named by its title, which is an h2', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Rename the workspace' });
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Rename the workspace');
    expect(heading).toHaveClass('dialog-title');
    expect(dialog.tagName).toBe('SECTION');
    expect(dialog).toHaveClass('dialog-content');
    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('is described by its description, a paragraph under the title', () => {
    open({ description: 'The new name shows everywhere.' });
    const dialog = screen.getByRole('dialog');
    const description = document.querySelector('.dialog-description');
    expect(description?.tagName).toBe('P');
    expect(dialog).toHaveAccessibleDescription('The new name shows everywhere.');
    expect(dialog.getAttribute('aria-describedby')).toBe(description?.id);
  });

  it('draws no close button unless asked, and one named Close that closes the dialog when asked', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(document.querySelector('.dialog-head')).not.toHaveClass('dialog-head-with-close');
    unmount();

    render(<Triggered hasCloseButton />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('icon-button', 'dialog-close');
    expect(close.querySelector('svg')).toBeInTheDocument();
    expect(document.querySelector('.dialog-head')).toHaveClass('dialog-head', 'dialog-head-with-close');
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the close button with closeLabel', () => {
    open({ hasCloseButton: true, closeLabel: 'Fermer' });
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveClass('dialog-close');
  });

  it('is md wide by default and lg when asked', () => {
    const { unmount } = open();
    expect(panel()).toHaveAttribute('data-size', 'md');
    unmount();
    open({ size: 'lg' });
    expect(panel()).toHaveAttribute('data-size', 'lg');
  });

  it('takes the default tone unless asked for danger, which the panel carries for the well', () => {
    const { unmount } = open({ icon: <Pencil /> });
    expect(panel()).toHaveAttribute('data-tone', 'default');
    unmount();
    open({ tone: 'danger', icon: <TriangleAlert /> });
    expect(panel()).toHaveAttribute('data-tone', 'danger');
    expect(panel().querySelector('.dialog-well svg')).toBeInTheDocument();
  });

  it('draws the icon in a well hidden from assistive technology, and no well without one', () => {
    const { unmount } = open();
    expect(document.querySelector('.dialog-well')).not.toBeInTheDocument();
    unmount();
    open({ icon: <Pencil /> });
    const well = document.querySelector('.dialog-well');
    expect(well).toHaveAttribute('aria-hidden', 'true');
    expect(well?.querySelector('svg')).toBeInTheDocument();
    // The well, the title and the description are one head, in that order.
    expect(well?.parentElement).toHaveClass('dialog-head');
    expect(well?.nextElementSibling).toHaveClass('dialog-title');
  });

  it('draws the body and the action row only when given, after the head and in that order', () => {
    const { unmount } = open();
    expect(document.querySelector('.dialog-body')).not.toBeInTheDocument();
    expect(document.querySelector('.dialog-actions')).not.toBeInTheDocument();
    unmount();
    open({ children: <p>Workspace names show in every invite.</p>, actions: <Button>Rename</Button> });
    const content = screen.getByRole('dialog');
    expect([...content.children].map((child) => child.className)).toEqual([
      'dialog-head',
      'dialog-body',
      'dialog-actions',
    ]);
    expect(content.querySelector('.dialog-body')).toHaveTextContent('Workspace names show in every invite.');
    expect(content.querySelector('.dialog-actions')).toContainElement(
      screen.getByRole('button', { name: 'Rename' }),
    );
  });

  it('puts className on the panel and overlayClassName on the scrim, after the library classes, and ref on the dialog', () => {
    const ref = createRef<HTMLElement>();
    open({ className: 'mine', overlayClassName: 'theirs', ref });
    expect(panel().className).toBe('overlay dialog mine');
    expect(scrim().className).toBe('overlay-scrim dialog-overlay theirs');
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });

  it('closes on Escape, unless isKeyboardDismissDisabled', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<Triggered isKeyboardDismissDisabled />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on a press on the scrim, unless isDismissable is false', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.click(scrim());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<Triggered isDismissable={false} />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.click(scrim());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('stays open for a press inside the toast region', async () => {
    const user = userEvent.setup();
    const region = document.createElement('div');
    region.className = 'toast-region';
    const undo = region.appendChild(document.createElement('button'));
    undo.type = 'button';
    undo.textContent = 'Undo';
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    document.body.append(region);
    try {
      await user.click(undo);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    } finally {
      region.remove();
    }
  });

  it('is controlled by isOpen, and tells onOpenChange when Escape asks to close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Dialog isOpen onOpenChange={onOpenChange} title="Rename the workspace" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    // The caller owns the state, and it still says open.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens from defaultOpen and closes on its own', async () => {
    const user = userEvent.setup();
    render(<Dialog defaultOpen title="Rename the workspace" />);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from its trigger, moves focus into the dialog and gives it back to the trigger on close', async () => {
    const user = userEvent.setup();
    render(<Triggered actions={<Button>Save</Button>} />);
    const trigger = screen.getByRole('button', { name: 'Rename' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toHaveFocus();
    // Focus is held inside: Tab moves to the one control and stays in the dialog.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // React Aria gives focus back in the next animation frame.
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('hands children and actions given as functions a close that closes the dialog', async () => {
    const user = userEvent.setup();
    const children = vi.fn(({ close }: { close: () => void }) => (
      <Button variant="secondary" onPress={close}>
        Close from the body
      </Button>
    ));
    const actions = vi.fn(({ close }: { close: () => void }) => <Button onPress={close}>Done</Button>);
    const { unmount } = render(<Triggered actions={actions}>{children}</Triggered>);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    expect(typeof children.mock.lastCall?.[0].close).toBe('function');
    expect(typeof actions.mock.lastCall?.[0].close).toBe('function');
    expect(document.querySelector('.dialog-body')).toContainElement(
      screen.getByRole('button', { name: 'Close from the body' }),
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<Triggered>{children}</Triggered>);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.click(screen.getByRole('button', { name: 'Close from the body' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('holds the page still while open and lets it go on close', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    expect(document.documentElement.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    expect(document.documentElement.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('hides the page behind it from assistive technology while open', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    const trigger = screen.getByRole('button', { name: 'Rename' });
    await user.click(trigger);
    expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('stacks a second dialog over the first: one scrim paints, and Escape closes the top one only', async () => {
    const user = userEvent.setup();
    // Every frame held back, as on a loaded machine whose next frame comes late. React Aria gives focus back in
    // a frame, so only the library's own restore, as the top panel leaves, can put it back on the trigger
    // before the dialog under it finds focus on the body and takes it.
    holdFrames();
    render(
      <Dialog defaultOpen title="Rename the workspace">
        <DialogTrigger>
          <Button>Discard</Button>
          <Dialog title="Discard the new name?" />
        </DialogTrigger>
      </Dialog>,
    );
    const inner = screen.getByRole('button', { name: 'Discard' });
    await user.click(inner);
    expect(openModals()).toHaveLength(2);
    const scrims = document.querySelectorAll('.dialog-overlay');
    expect(scrims[0]).not.toHaveAttribute('data-stacked');
    expect(scrims[1]).toHaveAttribute('data-stacked', '');
    await user.keyboard('{Escape}');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Rename the workspace' })).toBeInTheDocument();
    expect(inner).toHaveFocus();
    expect(openModals()).toHaveLength(1);
  });

  it('copies the theme of the trigger onto the panel', async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Triggered />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    expect(scrim()).not.toHaveAttribute('data-theme');
  });

  it('submits the form in its body from a submit button in its actions, by press and by Enter', async () => {
    const user = userEvent.setup();
    const names: string[] = [];
    function RenameForm(): ReactElement {
      const formId = useId();
      return (
        <Dialog
          isOpen
          title="Rename the workspace"
          actions={
            <Button type="submit" form={formId}>
              Rename
            </Button>
          }
        >
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              const name = new FormData(event.currentTarget).get('name');
              if (typeof name === 'string') names.push(name);
            }}
          >
            <TextField label="Workspace name" name="name" defaultValue="Northwind" />
          </form>
        </Dialog>
      );
    }
    render(<RenameForm />);
    // The button sits in the action row, outside the form in the body, and joins it by the form attribute.
    const submit = screen.getByRole('button', { name: 'Rename' });
    expect(submit.closest('form')).toBeNull();
    expect(submit.closest('.dialog-actions')).not.toBeNull();
    const field = screen.getByRole('textbox', { name: 'Workspace name' });
    await user.clear(field);
    await user.type(field, 'Northwind Studio');
    await user.click(submit);
    expect(names).toEqual(['Northwind Studio']);
    await user.type(field, ' Two{Enter}');
    expect(names).toEqual(['Northwind Studio', 'Northwind Studio Two']);
  });

  it('keeps the body and the action row private: the package exports Dialog and its trigger only', () => {
    expect(library).toHaveProperty('Dialog');
    expect(library).toHaveProperty('DialogTrigger');
    expect(library).not.toHaveProperty('DialogBody');
    expect(library).not.toHaveProperty('DialogActions');
  });

  it.each(['default', 'danger'] as const)('has no axe violations open in the %s tone', async (tone) => {
    open({
      tone,
      icon: tone === 'danger' ? <TriangleAlert /> : <Pencil />,
      description: 'The new name shows everywhere.',
      hasCloseButton: true,
      children: <p>Workspace names show in every invite.</p>,
      actions: (
        <>
          <Button variant="tertiary">Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'}>Rename</Button>
        </>
      ),
    });
    await expectNoA11yViolations(document.body);
  });
});

describe('the dialog parts', () => {
  it('draws a body and an action row for a custom layout, with className merged after', () => {
    const body = createRef<HTMLDivElement>();
    const actions = createRef<HTMLDivElement>();
    render(
      <>
        <DialogBody ref={body} className="mine" data-testid="body">
          <p>Words</p>
        </DialogBody>
        <DialogActions ref={actions} className="theirs">
          <Button>Save</Button>
        </DialogActions>
      </>,
    );
    expect(body.current?.tagName).toBe('DIV');
    expect(body.current?.className).toBe('dialog-body mine');
    expect(body.current).toHaveAttribute('data-testid', 'body');
    expect(actions.current?.className).toBe('dialog-actions theirs');
  });

  it('makes the body a tab stop while it scrolls and holds nothing to focus, and only then', () => {
    // jsdom lays nothing out, so the body's heights are given: taller inside than it shows, then not.
    const inside = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(900);
    const shown = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    try {
      const { unmount } = render(<DialogBody data-testid="scrolls">Long words</DialogBody>);
      expect(screen.getByTestId('scrolls')).toHaveAttribute('tabindex', '0');
      unmount();
      inside.mockReturnValue(300);
      const { unmount: unmountShort } = render(<DialogBody data-testid="fits">Short words</DialogBody>);
      expect(screen.getByTestId('fits')).not.toHaveAttribute('tabindex');
      unmountShort();
      // A body that scrolls and holds a control is reached through the control, as Chrome does natively, so
      // a long form gains no extra stop before its first field.
      inside.mockReturnValue(900);
      render(
        <DialogBody data-testid="holds">
          <p>Long words</p>
          <Button>Save</Button>
        </DialogBody>,
      );
      expect(screen.getByTestId('holds')).not.toHaveAttribute('tabindex');
    } finally {
      inside.mockRestore();
      shown.mockRestore();
    }
  });
});
