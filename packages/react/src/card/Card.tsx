import { createElement, type HTMLAttributes, type ReactElement, type Ref } from 'react';
import { cx } from '../utils/cx';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /**
   * The element to render. A `section` with an accessible name is a region
   * landmark. An `article` is not a landmark, named or not, and a `div` is
   * neither.
   * @default 'div'
   */
  as?: 'div' | 'section' | 'article';
  ref?: Ref<HTMLElement>;
}

/** A lifted surface laid on the page. Static: it adds no JavaScript. */
export function Card({ as: tag = 'div', className, ...props }: CardProps): ReactElement {
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them.
  return createElement(tag, { ...props, className: cx('card', className) });
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * The band above the body that holds the title and the note, ruled off from
 * the body. A div, not a header: a header outside sectioning content is the
 * page's banner, and a card is a div by default.
 */
export function CardHeader({ className, ...props }: CardHeaderProps): ReactElement {
  return <div {...props} className={cx('card-header', className)} />;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading element, `h1` to `h4`, so the card fits the page's outline.
   * The look is the same at every level.
   * @default 2
   */
  level?: 1 | 2 | 3 | 4;
  ref?: Ref<HTMLHeadingElement>;
}

/** The card's heading. */
export function CardTitle({ level = 2, className, ...props }: CardTitleProps): ReactElement {
  const Heading = `h${level}` as const;
  return <Heading {...props} className={cx('card-title', className)} />;
}

export interface CardNoteProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

/** A line of slate text under the title. */
export function CardNote({ className, ...props }: CardNoteProps): ReactElement {
  return <p {...props} className={cx('card-note', className)} />;
}

export interface CardActionsProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Buttons in a plain card's header, such as Edit and a More menu on a Details card. Place it in `CardHeader`
 * after `CardTitle` and `CardNote`, so the reading order is the title, the note, then the actions. They sit at
 * the end of the title's line, clear of the card's rounded corner, and move under the note in a header
 * narrower than 24rem. Show at most two; put the rest in a More menu. No role: each button is named by the
 * app, such as "Edit details".
 */
export function CardActions({ className, ...props }: CardActionsProps): ReactElement {
  return <div {...props} className={cx('card-actions', className)} />;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * The card's content, stacked with 24px between peers. The body is a grid, so
 * wrap text in a paragraph: bare text next to an element, or two inline
 * elements side by side, would each take a row of their own.
 */
export function CardBody({ className, ...props }: CardBodyProps): ReactElement {
  return <div {...props} className={cx('card-body', className)} />;
}
