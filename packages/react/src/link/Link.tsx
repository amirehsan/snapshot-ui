'use client';

import type { ReactElement, Ref } from 'react';
import { Link as RACLink, type LinkProps as RACLinkProps, composeRenderProps } from 'react-aria-components';
import { cx } from '../utils/cx';

/**
 * React Aria's router provider, from the library's own copy of React Aria, so a Link or a Menu item with
 * `href` navigates through the app's router with no second copy whose router context the library would not
 * see. `RouterConfig` is the interface to augment for typed `routerOptions`.
 */
export { RouterProvider, type RouterConfig } from 'react-aria-components';

export interface LinkProps extends RACLinkProps {
  /** A class name, or a function of the link's state, merged after the library's own class. */
  className?: RACLinkProps['className'];
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * An inline link, in Link Blue and always underlined. Built on React Aria's
 * Link: an `<a>` when it has an `href`, with press, hover and focus handled.
 */
export function Link({ className, ...props }: LinkProps): ReactElement {
  return (
    <RACLink
      {...props}
      className={composeRenderProps(className, (userClassName) => cx('link', userClassName))}
    />
  );
}
