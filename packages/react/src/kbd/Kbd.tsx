import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cx } from '../utils/cx';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** The key, such as `Esc`, `K` or a symbol. One key per element, so a shortcut is as many as it has keys. */
  children?: ReactNode;
  /** Added after the library's own class. */
  className?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * A key hint, such as the search shortcut. A static `<kbd>` element, safe in a
 * server component. It is read aloud like any text; pass `aria-hidden` when
 * something nearby already names the shortcut.
 */
export function Kbd({ className, ...props }: KbdProps): ReactElement {
  return <kbd {...props} className={cx('kbd', className)} />;
}
