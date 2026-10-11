import { createElement, type HTMLAttributes, type ReactElement, type Ref } from 'react';
import { cx } from '../utils/cx';

export type EyebrowElement = 'p' | 'span' | 'div';

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  /**
   * The element to render: `p`, `span` or `div`. An eyebrow is a label, never a
   * heading.
   * @default 'p'
   */
  as?: EyebrowElement;
  /**
   * Keeps the dot inside the label's box. By default the dot hangs into the
   * gutter beside the label, so use this where there is no gutter.
   * @default false
   */
  inset?: boolean;
  ref?: Ref<HTMLElement>;
}

/**
 * The small capitalised label above a heading, with the accent dot hanging into
 * the gutter. A static component: it renders a plain `p`, `span` or `div`, so it
 * works in a server component.
 */
export function Eyebrow({
  as: Element = 'p',
  inset = false,
  className,
  ...props
}: EyebrowProps): ReactElement {
  // createElement and not JSX: see Text.
  return createElement(Element, { ...props, className: cx('eyebrow', inset && 'eyebrow-inset', className) });
}
