import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { cx } from '../utils/cx';

/** A heading step: the `h1` to `h4` element, or the type step that matches it. */
export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * The element, `h1` to `h4`. It places the heading in the page outline, so
   * choose it by the heading's place in the page and not by how it should look.
   * @default 2
   */
  level?: HeadingLevel;
  /**
   * The look: 1 is the 64px display step, 2 the 36px section step, 3 the 24px
   * card title and 4 the 14px bold subhead. It follows `level` unless it is
   * given.
   * @default level
   */
  size?: HeadingLevel;
  ref?: Ref<HTMLHeadingElement>;
}

/**
 * A heading drawn in one of the four heading steps. A static component: it
 * renders a plain `h1` to `h4`, so it works in a server component.
 */
export function Heading({ level = 2, size = level, className, ...props }: HeadingProps): ReactElement {
  const Element = `h${level}` as const;
  return <Element {...props} className={cx('heading', `heading-${size}`, className)} />;
}
