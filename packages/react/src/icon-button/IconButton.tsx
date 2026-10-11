'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  Link as RACLink,
  type LinkProps as RACLinkProps,
  composeRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';

export type IconButtonVariant = 'ghost' | 'outline';

/** The props both forms share. */
interface IconButtonOptions {
  /**
   * `ghost` has no fill and no edge. `outline` is the design system's circle on cream: a transparent
   * fill with a 1px ink edge.
   * @default 'ghost'
   */
  variant?: IconButtonVariant;
}

/**
 * An icon has no text to name the button, so the types require a name: a label, or the id of an
 * element that holds it.
 */
type AccessibleName =
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label': string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby'?: string;
    }
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label'?: string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby': string;
    };

/** The button form, the default. It has no pending state, because an icon has nowhere to show one. */
type IconButtonAction = Omit<RACButtonProps, 'aria-label' | 'aria-labelledby' | 'isPending'> & {
  href?: undefined;
  ref?: Ref<HTMLButtonElement>;
};

/** The link form: given an `href` it renders an anchor with the same classes. */
type IconButtonAnchor = Omit<RACLinkProps, 'aria-label' | 'aria-labelledby' | 'href'> & {
  /** A URL to link to. Given an `href`, the icon button renders a link instead of a button. */
  href: NonNullable<RACLinkProps['href']>;
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * A button that holds one icon, or a link drawn the same way when given an `href`. The child is the
 * icon, such as a Lucide icon. It is hidden from assistive technology, so the name comes from
 * `aria-label` or `aria-labelledby`, which the types require.
 */
export type IconButtonProps = IconButtonOptions & AccessibleName & (IconButtonAction | IconButtonAnchor);

const classes =
  (variant: IconButtonVariant) =>
  (userClassName: string | undefined): string =>
    cx('icon-button', variant === 'outline' && 'icon-button-outline', userClassName);

const icon = (resolved: ReactNode): ReactElement => (
  <span className="icon-button-icon" aria-hidden="true">
    {resolved}
  </span>
);

/** A button for one icon. Built on React Aria's Button, or Link when given an `href`. */
export function IconButton(props: IconButtonProps): ReactElement {
  if (props.href !== undefined) {
    const { variant = 'ghost', className, children, ...link } = props;
    return (
      <RACLink {...link} className={composeRenderProps(className, classes(variant))}>
        {composeRenderProps(children, icon)}
      </RACLink>
    );
  }
  const { variant = 'ghost', className, children, ...button } = props;
  return (
    <RACButton {...button} className={composeRenderProps(className, classes(variant))}>
      {composeRenderProps(children, icon)}
    </RACButton>
  );
}
