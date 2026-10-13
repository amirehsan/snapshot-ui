'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  Button as RACButton,
  Link as RACLink,
  VisuallyHidden,
  composeRenderProps,
  type ButtonProps as RACButtonProps,
  type ButtonRenderProps,
  type LinkProps as RACLinkProps,
  type LinkRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';

/** A count and the words that make it a name: "12" and "to review" read "Transactions, 12 to review". */
type TabCount =
  { count?: undefined; countLabel?: undefined } | { count: number | string; countLabel: string };

interface TabItemShared {
  /** The icon, 20px, hidden from assistive technology. */
  icon: ReactNode;
  /** The label, one line at the small step. It is the accessible name. */
  children: ReactNode;
  /** Draws the ink pill. On a link it also sets `aria-current="page"`. */
  isCurrent?: boolean;
}

/** A destination: an anchor through React Aria's Link. Exported from the module for the docs tables, not from the index. */
export type BottomTabBarLinkProps = Omit<RACLinkProps, 'children' | 'className' | 'aria-current' | 'href'> & {
  href: NonNullable<RACLinkProps['href']>;
  className?: string | ((values: LinkRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLAnchorElement>;
};

/** An action, such as "More": a button through React Aria's Button, which a SheetTrigger can wrap. Exported as above. */
export type BottomTabBarButtonProps = Omit<RACButtonProps, 'children' | 'className'> & {
  href?: undefined;
  className?: string | ((values: ButtonRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLButtonElement>;
};

export type BottomTabBarItemProps = TabItemShared &
  TabCount &
  (BottomTabBarLinkProps | BottomTabBarButtonProps);

/**
 * One tab: an icon over a one-line label, with an optional count chip. Given `href` it is a link through React
 * Aria's Link, so `href` works with scripts off and a `RouterProvider` routes the press; without one it is a
 * button through React Aria's Button, which a `SheetTrigger` can wrap. `isCurrent` draws the ink pill, and on a
 * link alone sets `aria-current="page"`: a button is not the page shown.
 */
export function BottomTabBarItem({
  icon,
  children,
  isCurrent = false,
  count,
  countLabel,
  ...props
}: BottomTabBarItemProps): ReactElement {
  const content = (
    <>
      {/* The chip is decoration in the hidden icon box; the name's count comes from the hidden words. */}
      <span className="tab-bar-item-icon" aria-hidden="true">
        {icon}
        {count !== undefined ? <span className="tab-bar-count">{count}</span> : null}
      </span>
      {/* A name joins the parts of a link as the page lays them out: a browser puts a space at every flex
          item's edge and at every hidden box's, and jsdom trims each element's text. So the comma ends the
          label, inline and drawn at no size, and a plain space comes before the hidden words: the name is
          "Transactions, 12 to review" everywhere, while the tab shows the chip and no comma or words. */}
      <span className="tab-bar-item-label">
        {children}
        {count !== undefined ? <span className="tab-bar-comma">,</span> : null}
      </span>
      {count !== undefined ? (
        <>
          {' '}
          <VisuallyHidden elementType="span">
            {count} {countLabel}
          </VisuallyHidden>
        </>
      ) : null}
    </>
  );
  if (props.href !== undefined) {
    const { className, ...link } = props;
    return (
      <li>
        <RACLink
          {...link}
          // React Aria treats any aria-current as current, "false" included, so it is set only when current.
          aria-current={isCurrent ? 'page' : undefined}
          className={composeRenderProps(className, (userClassName) => cx('tab-bar-item', userClassName))}
        >
          {content}
        </RACLink>
      </li>
    );
  }
  const { className, ...button } = props;
  return (
    <li>
      <RACButton
        {...button}
        // React Aria's data-current belongs to links, so a current button says so in its own attribute.
        data-current-action={isCurrent ? '' : undefined}
        className={composeRenderProps(className, (userClassName) => cx('tab-bar-item', userClassName))}
      >
        {content}
      </RACButton>
    </li>
  );
}
