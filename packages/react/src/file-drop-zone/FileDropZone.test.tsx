import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { FileDropZone } from './FileDropZone';

const pdf = (): File => new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' });
const exe = (): File => new File(['MZ'], 'setup.exe', { type: 'application/x-msdownload' });
const blank = (): File => new File([], 'blank.pdf', { type: 'application/pdf' });

const RECEIPTS = {
  label: 'Receipts',
  description: 'PDF, JPG or PNG, up to 10 MB',
  acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxFileSize: 10_000_000,
  allowsMultiple: true,
} as const;

const inputOf = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) throw new Error('No input');
  return input;
};

const statusOf = (container: HTMLElement): HTMLElement => {
  const status = container.querySelector<HTMLElement>('.file-drop-zone-status');
  if (status === null) throw new Error('No status');
  return status;
};

// user-event filters the files by accept before the library's check sees them, unless told not to.
const user = (): ReturnType<typeof userEvent.setup> => userEvent.setup({ applyAccept: false });

/** A drag event of `type` on `target` holding files, as the hold reads it: jsdom has no DragEvent. */
function drag(type: 'dragover' | 'drop', target: EventTarget): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'] } });
  target.dispatchEvent(event);
  return event;
}

/** A paste on `target` holding `files`: jsdom has no ClipboardEvent data, so the transfer is defined on it. */
function paste(target: EventTarget, files: File[]): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  const items = files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file }));
  Object.defineProperty(event, 'clipboardData', { value: { items, files, types: ['Files'] } });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe('FileDropZone', () => {
  it('is exported from the package', () => {
    expect(library.FileDropZone).toBe(FileDropZone);
  });

  it('is a group named by its label, with one tab stop, the button', async () => {
    const { container } = render(
      <>
        <button type="button">Before</button>
        <FileDropZone {...RECEIPTS} onFiles={() => undefined} />
        <button type="button">After</button>
      </>,
    );
    const zone = screen.getByRole('group', { name: 'Receipts' });
    expect(zone).toHaveClass('file-drop-zone', 'field');
    expect(zone.querySelector('.field-head .field-label')?.tagName).toBe('SPAN');
    // In DOM order: the head, the box, the description and the status.
    expect([...zone.children].map((child) => child.className)).toEqual([
      'field-head',
      'file-drop-zone-box',
      'field-description',
      'file-drop-zone-status field-error',
    ]);
    const box = container.querySelector('.file-drop-zone-box');
    // The hint, the drop line, the button and FileTrigger's hidden input, which has no class.
    expect(
      [...(box?.querySelector('.file-drop-zone-line')?.children ?? [])].map(
        (child) => `${child.tagName} ${child.className}`,
      ),
    ).toEqual([
      'SPAN file-drop-zone-hint',
      'SPAN file-drop-zone-drop',
      'BUTTON button button-secondary',
      'INPUT ',
    ]);
    expect(box?.querySelector('.file-drop-zone-icon')).toHaveAttribute('aria-hidden', 'true');
    const events = user();
    screen.getByRole('button', { name: 'Before' }).focus();
    await events.tab();
    expect(screen.getByRole('button', { name: 'Choose files' })).toHaveFocus();
    await events.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('describes the button by the description, and by the status while invalid', async () => {
    const { container } = render(<FileDropZone {...RECEIPTS} onFiles={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Choose files' });
    expect(button).toHaveAccessibleDescription('PDF, JPG or PNG, up to 10 MB');
    await user().upload(inputOf(container), [exe()]);
    expect(button).toHaveAccessibleDescription('PDF, JPG or PNG, up to 10 MB 1 files were not added');
  });

  it('reaches onFiles through a choice', async () => {
    const onFiles = vi.fn();
    const { container } = render(<FileDropZone {...RECEIPTS} onFiles={onFiles} />);
    const file = pdf();
    await user().upload(inputOf(container), [file]);
    expect(onFiles).toHaveBeenCalledWith([file], []);
    expect(root(container)).not.toHaveAttribute('data-invalid');
    expect(statusOf(container)).toBeEmptyDOMElement();
  });

  it('takes a paste of files on its button, and leaves a paste with none alone', () => {
    const onFiles = vi.fn();
    render(<FileDropZone {...RECEIPTS} onFiles={onFiles} />);
    const button = screen.getByRole('button', { name: 'Choose files' });
    const file = pdf();
    expect(paste(button, [file]).defaultPrevented).toBe(true);
    expect(onFiles).toHaveBeenCalledWith([file], []);
    expect(paste(button, []).defaultPrevented).toBe(false);
    expect(onFiles).toHaveBeenCalledTimes(1);
  });

  it('says the refusals in the status after a choice, as labels.rejected writes them with formatCount', async () => {
    const onFiles = vi.fn();
    const { container } = render(
      <FileDropZone
        {...RECEIPTS}
        formatCount={(count) => `#${String(count)}`}
        labels={{ rejected: (count) => `${count} not added` }}
        onFiles={onFiles}
      />,
    );
    const status = statusOf(container);
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toBeEmptyDOMElement();
    const [good, bad, empty] = [pdf(), exe(), blank()];
    await user().upload(inputOf(container), [good, bad, empty]);
    expect(onFiles).toHaveBeenCalledWith(
      [good],
      [
        { file: bad, reason: 'type' },
        { file: empty, reason: 'empty' },
      ],
    );
    expect(status).toHaveTextContent(/^#2 not added$/);
    expect(root(container)).toHaveAttribute('data-invalid');
  });

  it('puts errorMessage in place of the library line', async () => {
    const { container } = render(
      <FileDropZone
        {...RECEIPTS}
        errorMessage="The selected file must be a PDF, JPG or PNG"
        onFiles={() => undefined}
      />,
    );
    // Not invalid yet, so not said.
    expect(statusOf(container)).toBeEmptyDOMElement();
    await user().upload(inputOf(container), [exe()]);
    expect(statusOf(container)).toHaveTextContent(/^The selected file must be a PDF, JPG or PNG$/);
  });

  it("clears its own invalid state on a clean choice and keeps the app's isInvalid", async () => {
    const { container, rerender } = render(<FileDropZone {...RECEIPTS} onFiles={() => undefined} />);
    const events = user();
    await events.upload(inputOf(container), [exe()]);
    expect(root(container)).toHaveAttribute('data-invalid');
    await events.upload(inputOf(container), [pdf()]);
    expect(root(container)).not.toHaveAttribute('data-invalid');
    expect(statusOf(container)).toBeEmptyDOMElement();

    rerender(
      <FileDropZone {...RECEIPTS} isInvalid errorMessage="Add the receipt" onFiles={() => undefined} />,
    );
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(statusOf(container)).toHaveTextContent('Add the receipt');
    await events.upload(inputOf(container), [pdf()]);
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(statusOf(container)).toHaveTextContent('Add the receipt');
  });

  it('draws both lines in the server HTML', () => {
    const html = renderToString(<FileDropZone {...RECEIPTS} onFiles={() => undefined} />);
    for (const part of [
      'class="file-drop-zone field"',
      'role="group"',
      'class="field-label"',
      'Receipts',
      'class="file-drop-zone-hint">Drag files here or<',
      'class="file-drop-zone-drop" aria-hidden="true">Drop to upload<',
      'Choose files',
      'type="file"',
      'accept="application/pdf,image/jpeg,image/png"',
      'PDF, JPG or PNG, up to 10 MB',
      'role="status"',
    ]) {
      expect(html).toContain(part);
    }
    // No name and no native submission: files reach the app through onFiles only.
    expect(html).not.toContain('name=');
  });

  it('holds missed drops while mounted, disabled too, and releases them on unmount', () => {
    const beside = document.body.appendChild(document.createElement('p'));
    const { rerender, unmount } = render(<FileDropZone {...RECEIPTS} onFiles={() => undefined} />);
    expect(drag('dragover', beside).defaultPrevented).toBe(true);
    expect(drag('drop', beside).defaultPrevented).toBe(true);
    rerender(<FileDropZone {...RECEIPTS} isDisabled onFiles={() => undefined} />);
    expect(drag('drop', beside).defaultPrevented).toBe(true);
    unmount();
    expect(drag('drop', beside).defaultPrevented).toBe(false);
    beside.remove();
  });

  it('ignores a paste and opens nothing while disabled', () => {
    const onFiles = vi.fn();
    const { container } = render(<FileDropZone {...RECEIPTS} isDisabled onFiles={onFiles} />);
    const button = screen.getByRole('button', { name: 'Choose files' });
    expect(button).toBeDisabled();
    expect(root(container)).toHaveAttribute('data-disabled');
    // The group says it is disabled, so its taupe text reads as an inactive control's.
    expect(root(container)).toHaveAttribute('aria-disabled', 'true');
    expect(paste(button, [pdf()]).defaultPrevented).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('uses "Drag a file here or" and "Choose a file" without allowsMultiple', () => {
    const { container } = render(<FileDropZone label="Receipt" onFiles={() => undefined} />);
    expect(container.querySelector('.file-drop-zone-hint')).toHaveTextContent(/^Drag a file here or$/);
    expect(screen.getByRole('button', { name: 'Choose a file' })).toBeInTheDocument();
    expect(inputOf(container)).not.toHaveAttribute('multiple');
  });

  it('passes className and ref to the root, and capture to its button', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <FileDropZone
        ref={ref}
        className="extra"
        capture="environment"
        {...RECEIPTS}
        onFiles={() => undefined}
      />,
    );
    expect(ref.current).toBe(root(container));
    expect(root(container)).toHaveClass('file-drop-zone', 'field', 'extra');
    expect(inputOf(container)).toHaveAttribute('capture', 'environment');
  });

  it('types the name as required', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring it.
    // @ts-expect-error a zone with no label, aria-label or aria-labelledby has no name
    const unnamed = <FileDropZone onFiles={() => undefined} />;
    expect(unnamed).toBeTruthy();
  });

  const AXE_CASES: [name: string, element: () => ReactElement][] = [
    ['idle', () => <FileDropZone {...RECEIPTS} onFiles={() => undefined} />],
    [
      'invalid',
      () => (
        <FileDropZone
          {...RECEIPTS}
          isInvalid
          errorMessage="The selected file must be smaller than 10 MB"
          onFiles={() => undefined}
        />
      ),
    ],
    ['disabled', () => <FileDropZone {...RECEIPTS} isDisabled onFiles={() => undefined} />],
    [
      'unlabelled with aria-label',
      () => <FileDropZone aria-label="Receipt for row 3" onFiles={() => undefined} />,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element());
    await expectNoA11yViolations(container);
  });
});
