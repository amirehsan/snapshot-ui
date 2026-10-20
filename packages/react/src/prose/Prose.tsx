import { createElement, type HTMLAttributes, type ReactElement, type Ref } from 'react';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';

export interface ProseProps extends HTMLAttributes<HTMLElement> {
  /**
   * The element to render. `article` for a piece that stands alone, such as a help article or a monthly
   * report; `section` for a part of a page with its own heading, which is a region landmark only when it is
   * named; `div` for text inside something else, such as a card's body.
   * @default 'div'
   */
  as?: 'div' | 'article' | 'section';
  ref?: Ref<HTMLElement>;
}

/**
 * Long-form text you render, such as Markdown turned into HTML on the server: the `prose` class on the
 * element `as` names, which gives the headings, paragraphs, lists, quotes, code, tables and figures inside the
 * library's type and spacing. It adds no element, no role and no state, so a server component renders a report
 * in it with no client JavaScript. A subtree under `not-prose` is left alone.
 */
export function Prose({ as: tag = 'div', className, ...props }: ProseProps): ReactElement {
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them.
  return createElement(tag, { ...props, className: cx('prose', className) });
}

export type ProseScrollProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'aria-labelledby' | 'role' | 'tabIndex'
> &
  AriaName & { ref?: Ref<HTMLDivElement> };

/**
 * A wide table's scrolling box inside Prose: a region named by its required `aria-label` or
 * `aria-labelledby` that takes focus, so a keyboard reader can scroll it and a screen reader can name it. It
 * draws no frame of its own; the table inside keeps its rows and columns. Static, as Prose is.
 */
export function ProseScroll({ className, ...props }: ProseScrollProps): ReactElement {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a region that scrolls must take focus to scroll by keyboard
    <div {...props} role="region" tabIndex={0} className={cx('prose-scroll', className)} />
  );
}
