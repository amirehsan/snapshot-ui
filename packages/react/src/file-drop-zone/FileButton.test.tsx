import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { FileButton } from './FileButton';

const pdf = (): File => new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' });
const exe = (): File => new File(['MZ'], 'setup.exe', { type: 'application/x-msdownload' });

/** The hidden input FileTrigger writes beside the button. */
const inputOf = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) throw new Error('No input');
  return input;
};

// user-event filters the files by accept before the library's check sees them, unless told not to.
const user = (): ReturnType<typeof userEvent.setup> => userEvent.setup({ applyAccept: false });

describe('FileButton', () => {
  it('is exported from the package', () => {
    expect(library.FileButton).toBe(FileButton);
  });

  it('writes accept, multiple and capture on its hidden input', () => {
    const { container } = render(
      <FileButton
        acceptedFileTypes={['image/*', '.heic']}
        allowsMultiple
        capture="environment"
        onFiles={() => undefined}
      >
        Take a photo
      </FileButton>,
    );
    const input = inputOf(container);
    expect(input).toHaveAttribute('accept', 'image/*,.heic');
    expect(input).toHaveAttribute('multiple');
    expect(input).toHaveAttribute('capture', 'environment');
    expect(screen.getByRole('button', { name: 'Take a photo' })).toHaveClass('button', 'button-primary');
  });

  it('calls onFiles once with the accepted and refused files of a choice', async () => {
    const onFiles = vi.fn();
    const { container } = render(
      <FileButton acceptedFileTypes={['application/pdf']} allowsMultiple onFiles={onFiles}>
        Upload
      </FileButton>,
    );
    const [good, bad] = [pdf(), exe()];
    await user().upload(inputOf(container), [good, bad]);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledWith([good], [{ file: bad, reason: 'type' }]);
  });

  it('calls nothing for an empty choice', async () => {
    const onFiles = vi.fn();
    const { container } = render(<FileButton onFiles={onFiles}>Upload</FileButton>);
    await user().upload(inputOf(container), []);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('fires again when the same file is chosen twice', async () => {
    const onFiles = vi.fn();
    const { container } = render(<FileButton onFiles={onFiles}>Upload</FileButton>);
    const input = inputOf(container);
    const file = pdf();
    const events = user();
    await events.upload(input, file);
    expect(input.value).not.toBe('');
    // React Aria clears the input as the button is pressed, before the picker opens (spec correction 17).
    await events.click(screen.getByRole('button', { name: 'Upload' }));
    expect(input.value).toBe('');
    await events.upload(input, file);
    expect(onFiles).toHaveBeenCalledTimes(2);
  });

  it('opens nothing while disabled', async () => {
    const { container } = render(
      <FileButton isDisabled onFiles={() => undefined}>
        Upload
      </FileButton>,
    );
    const click = vi.spyOn(inputOf(container), 'click');
    await user().click(screen.getByRole('button', { name: 'Upload' }));
    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('passes the button props through and its ref to the button', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <FileButton ref={ref} variant="secondary" className="extra" onFiles={() => undefined}>
        Choose files
      </FileButton>,
    );
    const button = screen.getByRole('button', { name: 'Choose files' });
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('button-secondary', 'extra');
  });

  const AXE_CASES: [name: string, element: () => ReactElement][] = [
    ['primary', () => <FileButton onFiles={() => undefined}>Upload</FileButton>],
    [
      'secondary',
      () => (
        <FileButton variant="secondary" allowsMultiple onFiles={() => undefined}>
          Choose files
        </FileButton>
      ),
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element());
    await expectNoA11yViolations(container);
  });
});
