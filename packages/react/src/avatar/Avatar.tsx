'use client';

import { useCallback, useState, type HTMLAttributes, type ReactElement, type Ref } from 'react';
import { cx } from '../utils/cx';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The person's or the organization's name. Gives the initials and, unless `isDecorative`, the accessible name. */
  name: string;
  /** The image. When absent, or when it fails to load, the initials show. */
  src?: string;
  /** Override the initials derived from `name`, such as "WF" for a bank. One or two characters. */
  initials?: string;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** `circle` for a person, `square` for a merchant's or a bank's logo. @default 'circle' */
  shape?: 'circle' | 'square';
  /** The name is already beside it in text, so the avatar is hidden from assistive technology. @default false */
  isDecorative?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

/** What the browser reported for an image, and for which address, so one image's verdict never reaches the next. */
type ImageState = { src: string; status: 'loaded' | 'failed' } | null;

/**
 * The first character of each of the first two words, uppercased. `Array.from` splits by code point, so a
 * character outside the basic plane counts as one; `toUpperCase` is not locale-aware, which is enough for
 * initials and needs no `Intl`.
 */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => (Array.from(word)[0] ?? '').toUpperCase())
    .join('');
}

/**
 * A person, a merchant or a bank, as an image over its initials. The initials are always drawn, and the image
 * covers them once it is known to have loaded, so a slow or a failed image shows the initials and the box never
 * moves. A client component for one piece of state, the failed image.
 */
export function Avatar({
  name,
  src,
  initials,
  size = 'md',
  shape = 'circle',
  isDecorative = false,
  className,
  ...props
}: AvatarProps): ReactElement {
  const [image, setImage] = useState<ImageState>(null);
  // A new address starts over, even one that failed before: forget the last verdict as src changes, during
  // render, so an address that comes back before the next one settled is tried again.
  const [seenSrc, setSeenSrc] = useState(src);
  if (seenSrc !== src) {
    setSeenSrc(src);
    setImage(null);
  }
  const status = src !== undefined && image?.src === src ? image.status : 'loading';
  // One function per src, and an update that returns the same object when nothing changed, so React bails out
  // and a ref callback that runs again never renders again.
  const settle = useCallback(
    (next: 'loaded' | 'failed') => {
      if (src === undefined) return;
      setImage((current) =>
        current?.src === src && current.status === next ? current : { src, status: next },
      );
    },
    [src],
  );
  // An image that loaded or failed before React listened, as one in the server's HTML can, fires no event
  // React hears, so its state is read as it mounts.
  // A natural width of 0 is not a failure on its own: the standard gives an SVG with only a viewBox no natural
  // width, and most logos are such SVGs. Decoding tells the two apart; a verdict for an address the image no
  // longer shows is dropped.
  const catchEarly = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img?.complete) return;
      if (img.naturalWidth > 0) {
        settle('loaded');
        return;
      }
      if (typeof img.decode !== 'function') {
        settle('failed');
        return;
      }
      const address = img.getAttribute('src');
      const settleIfCurrent = (next: 'loaded' | 'failed'): void => {
        if (img.getAttribute('src') === address) settle(next);
      };
      img.decode().then(
        () => {
          settleIfCurrent('loaded');
        },
        () => {
          settleIfCurrent('failed');
        },
      );
    },
    [settle],
  );
  // A blank name would make an image with no name, which assistive technology cannot use: hide it instead.
  const isHidden = isDecorative || name.trim() === '';
  return (
    <span
      {...props}
      className={cx('avatar', className)}
      data-size={size}
      data-shape={shape}
      // The name comes from `name` alone; hidden, no role or name a caller passed reaches the element.
      {...(isHidden
        ? { 'aria-hidden': true, role: undefined, 'aria-label': undefined, 'aria-labelledby': undefined }
        : { role: 'img', 'aria-label': name, 'aria-labelledby': undefined })}
    >
      <span className="avatar-initials" aria-hidden="true">
        {initials ?? initialsOf(name)}
      </span>
      {src !== undefined && src !== '' && status !== 'failed' ? (
        <img
          className="avatar-image"
          src={src}
          alt=""
          ref={catchEarly}
          data-loaded={status === 'loaded' ? '' : undefined}
          onLoad={() => {
            settle('loaded');
          }}
          onError={() => {
            settle('failed');
          }}
        />
      ) : null}
    </span>
  );
}
