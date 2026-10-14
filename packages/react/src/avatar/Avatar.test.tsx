import { fireEvent, render, waitFor } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Avatar } from './Avatar';

/** The text the avatar draws as its initials. */
const initialsIn = (container: HTMLElement): string | null =>
  container.querySelector('.avatar-initials')?.textContent ?? null;

describe('Avatar', () => {
  it('draws the first character of the first two words, uppercased: "Ada Lovelace" is AL and "Northwind" is N', () => {
    const { container, rerender } = render(<Avatar name="ada lovelace" />);
    expect(initialsIn(container)).toBe('AL');
    rerender(<Avatar name="Northwind" />);
    expect(initialsIn(container)).toBe('N');
  });

  it('takes two words of three, and ignores extra whitespace: "Mary Ann Evans" is MA and "  Ada   Lovelace " is AL', () => {
    const { container, rerender } = render(<Avatar name="Mary Ann Evans" />);
    expect(initialsIn(container)).toBe('MA');
    rerender(<Avatar name={'  Ada \t  Lovelace '} />);
    expect(initialsIn(container)).toBe('AL');
  });

  it('counts a character outside the basic plane as one, and reads a right-to-left name: "علی رضایی" is عر', () => {
    const { container, rerender } = render(<Avatar name="علی رضایی" />);
    expect(initialsIn(container)).toBe('عر');
    // A surrogate pair is one character: slicing the string by code unit would keep half of it.
    rerender(<Avatar name={'\u{1D400}da Lovelace'} />);
    expect(initialsIn(container)).toBe('\u{1D400}L');
  });

  it('draws initials as given, such as WF for a bank, and nothing for an empty name', () => {
    const { container, rerender } = render(<Avatar name="Wells Fargo Bank" initials="WF" />);
    expect(initialsIn(container)).toBe('WF');
    rerender(<Avatar name="" />);
    expect(initialsIn(container)).toBe('');
    rerender(<Avatar name="   " />);
    expect(initialsIn(container)).toBe('');
  });

  it('falls back to the initials of name when the initials given are blank', () => {
    const { container, rerender } = render(<Avatar name="Wells Fargo Bank" initials="" />);
    expect(initialsIn(container)).toBe('WF');
    rerender(<Avatar name="Wells Fargo Bank" initials="  " />);
    expect(initialsIn(container)).toBe('WF');
  });

  it('is an img named by its name, with data-size md and data-shape circle by default', () => {
    const { container } = render(<Avatar name="Ada Lovelace" />);
    const avatar = root(container);
    expect(avatar.tagName).toBe('SPAN');
    expect(avatar).toHaveAttribute('class', 'avatar');
    expect(avatar).toHaveAttribute('role', 'img');
    expect(avatar).toHaveAttribute('aria-label', 'Ada Lovelace');
    expect(avatar).toHaveAttribute('data-size', 'md');
    expect(avatar).toHaveAttribute('data-shape', 'circle');
    expect(avatar).not.toHaveAttribute('aria-hidden');
    // The initials are drawn and hidden: the name is the label, never the letters.
    expect(avatar.querySelector('.avatar-initials')).toHaveAttribute('aria-hidden', 'true');
  });

  it('takes size and shape as data attributes', () => {
    const { container, rerender } = render(<Avatar name="Northwind" size="sm" shape="square" />);
    expect(root(container)).toHaveAttribute('data-size', 'sm');
    expect(root(container)).toHaveAttribute('data-shape', 'square');
    rerender(<Avatar name="Northwind" size="lg" />);
    expect(root(container)).toHaveAttribute('data-size', 'lg');
    expect(root(container)).toHaveAttribute('data-shape', 'circle');
  });

  it('hides itself from assistive technology when decorative, with no role and no name', () => {
    const { container } = render(<Avatar name="Ada Lovelace" isDecorative />);
    const avatar = root(container);
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).not.toHaveAttribute('role');
    expect(avatar).not.toHaveAttribute('aria-label');
    expect(initialsIn(container)).toBe('AL');
  });

  it('draws the image after the initials with an empty alt, invisible until it loads', () => {
    const { container } = render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    const avatar = root(container);
    expect([...avatar.children].map((child) => child.className)).toEqual(['avatar-initials', 'avatar-image']);
    const image = avatar.querySelector('img');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('src', '/ada.png');
    expect(image).not.toHaveAttribute('data-loaded');
    expect(initialsIn(container)).toBe('AL');
  });

  it('marks the image loaded when it fires load', () => {
    const { container } = render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    const image = container.querySelector('.avatar-image');
    if (!image) throw new Error('No image');
    fireEvent.load(image);
    expect(image).toHaveAttribute('data-loaded', '');
  });

  it('removes the image and keeps the initials when it fires error', () => {
    const { container } = render(<Avatar name="Ada Lovelace" src="/missing.png" />);
    const image = container.querySelector('.avatar-image');
    if (!image) throw new Error('No image');
    fireEvent.error(image);
    expect(container.querySelector('.avatar-image')).toBeNull();
    expect(initialsIn(container)).toBe('AL');
  });

  describe('an image that settled before React listened', () => {
    const prototype = HTMLImageElement.prototype;
    const restore: (() => void)[] = [];

    /** Makes every image report `complete` with this natural width, as one the browser has finished with does. */
    const settledImages = (naturalWidth: number): void => {
      for (const [name, value] of [
        ['complete', true],
        ['naturalWidth', naturalWidth],
      ] as const) {
        const own = Object.getOwnPropertyDescriptor(prototype, name);
        Object.defineProperty(prototype, name, { get: () => value, configurable: true });
        restore.push(() => {
          if (own) Object.defineProperty(prototype, name, own);
          else Reflect.deleteProperty(prototype, name);
        });
      }
    };

    afterEach(() => {
      for (const undo of restore.splice(0).reverse()) undo();
    });

    /** Gives every image a `decode` that settles as given; jsdom has none of its own. */
    const decodes = (result: () => Promise<void>): void => {
      const own = Object.getOwnPropertyDescriptor(prototype, 'decode');
      Object.defineProperty(prototype, 'decode', {
        value: vi.fn(result),
        configurable: true,
        writable: true,
      });
      restore.push(() => {
        if (own) Object.defineProperty(prototype, 'decode', own);
        else Reflect.deleteProperty(prototype, 'decode');
      });
    };

    it('catches an image that loaded or failed before React listened', () => {
      settledImages(0);
      const failed = render(<Avatar name="Ada Lovelace" src="/missing.png" />);
      expect(failed.container.querySelector('.avatar-image')).toBeNull();
      expect(initialsIn(failed.container)).toBe('AL');
      failed.unmount();
      for (const undo of restore.splice(0).reverse()) undo();

      settledImages(1);
      const loaded = render(<Avatar name="Ada Lovelace" src="/ada.png" />);
      expect(loaded.container.querySelector('.avatar-image')).toHaveAttribute('data-loaded', '');
    });

    it('decodes an image with no natural width, such as an SVG with only a viewBox, before calling it failed', async () => {
      // The HTML standard gives such an image a natural width of 0 even when it loaded.
      settledImages(0);
      decodes(() => Promise.resolve());
      const { container } = render(<Avatar name="Willowford Bank" src="/logo.svg" shape="square" />);
      await waitFor(() => {
        expect(container.querySelector('.avatar-image')).toHaveAttribute('data-loaded', '');
      });
    });

    it('drops an image with no natural width whose decode fails', async () => {
      settledImages(0);
      decodes(() => Promise.reject(new Error('EncodingError')));
      const { container } = render(<Avatar name="Willowford Bank" src="/broken.svg" shape="square" />);
      await waitFor(() => {
        expect(container.querySelector('.avatar-image')).toBeNull();
      });
      expect(initialsIn(container)).toBe('WB');
    });
  });

  it('tries a failed address again when it comes back before the next one settled', () => {
    const { container, rerender } = render(<Avatar name="Ada Lovelace" src="/missing.png" />);
    const failed = container.querySelector('.avatar-image');
    if (!failed) throw new Error('No image');
    fireEvent.error(failed);
    rerender(<Avatar name="Ada Lovelace" src="/ada.png" />);
    // Back before the second image reported anything.
    rerender(<Avatar name="Ada Lovelace" src="/missing.png" />);
    expect(container.querySelector('.avatar-image')).toHaveAttribute('src', '/missing.png');
  });

  it('hides itself when its name is blank, since an image with no name fails axe', () => {
    const { container } = render(<Avatar name="  " src="/ada.png" />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('role');
  });

  it('takes its name from name alone, and drops a caller name when decorative', () => {
    const named = render(<Avatar name="Ada Lovelace" aria-label="Someone else" />);
    expect(named.container.firstElementChild).toHaveAttribute('aria-label', 'Ada Lovelace');
    named.unmount();
    const decorative = render(
      <Avatar name="Ada Lovelace" isDecorative role="img" aria-label="Ada" aria-labelledby="x" />,
    );
    const root = decorative.container.firstElementChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    for (const attribute of ['role', 'aria-label', 'aria-labelledby']) {
      expect(root, attribute).not.toHaveAttribute(attribute);
    }
  });

  it('starts again at loading when src changes after a failure', () => {
    const { container, rerender } = render(<Avatar name="Ada Lovelace" src="/missing.png" />);
    const failed = container.querySelector('.avatar-image');
    if (!failed) throw new Error('No image');
    fireEvent.error(failed);
    expect(container.querySelector('.avatar-image')).toBeNull();

    rerender(<Avatar name="Ada Lovelace" src="/ada.png" />);
    const next = container.querySelector('.avatar-image');
    expect(next).toHaveAttribute('src', '/ada.png');
    expect(next).not.toHaveAttribute('data-loaded');
    if (!next) throw new Error('No image');
    fireEvent.load(next);
    expect(next).toHaveAttribute('data-loaded', '');

    // And back: the first address failed once, and is tried again.
    rerender(<Avatar name="Ada Lovelace" src="/missing.png" />);
    expect(container.querySelector('.avatar-image')).not.toHaveAttribute('data-loaded');
  });

  it('draws no image for an empty src', () => {
    const { container } = render(<Avatar name="Ada Lovelace" src="" />);
    expect(container.querySelector('img')).toBeNull();
    expect(initialsIn(container)).toBe('AL');
  });

  it('passes className, ref, id and data attributes to the root', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Avatar name="Ada Lovelace" ref={ref} className="extra" id="ada" data-testid="person" title="Ada" />,
    );
    const avatar = root(container);
    expect(ref.current).toBe(avatar);
    expect(avatar).toHaveAttribute('class', 'avatar extra');
    expect(avatar).toHaveAttribute('id', 'ada');
    expect(avatar).toHaveAttribute('data-testid', 'person');
    expect(avatar).toHaveAttribute('title', 'Ada');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('Avatar');
  });

  it('has no axe violations as a named image, as a decorative avatar and with initials only', async () => {
    const { container } = render(
      <div>
        <Avatar name="Ada Lovelace" src="/ada.png" />
        <p>
          <Avatar name="Northwind" shape="square" isDecorative /> Northwind
        </p>
        <Avatar name="Mary Ann Evans" size="lg" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });

  it('requires a name, in the types', () => {
    // @ts-expect-error: an avatar is always someone's
    const unchecked = (): ReactElement => <Avatar src="/ada.png" />;
    expect(unchecked).toBeTypeOf('function');
  });
});
